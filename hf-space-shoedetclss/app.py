"""
Shoe Brand Classification Demo — Hugging Face Space
Pipeline: YOLO (Person) → YOLO (Shoe) → MiDaS Depth → YOLOv8 Pose → Swin-T + FashionSigLIP + SigLIP2 → Consensus Voting

All model weights and feeding dataset zip are stored directly in this Space repo root.
"""

import gradio as gr
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as models
import torchvision.transforms as transforms
import cv2
import numpy as np
import base64
import io
import os
import gc
import zipfile
import traceback
from PIL import Image
from pathlib import Path

# ============================================================
# Configuration — all files are in the Space repo root
# ============================================================
SPACE_ROOT = Path(os.path.dirname(os.path.abspath(__file__)))

BRANDS = ['adidas', 'nike', 'asics', 'other']
FEEDING_MAP = {'adidas': 0, 'nike': 1, 'asics': 2, 'others': 3}
BRAND_COLORS_BGR = {
    'adidas': (255, 255, 0), 'nike': (0, 0, 255),
    'asics': (255, 0, 0), 'other': (128, 128, 128)
}
BRAND_COLORS_RGB = {
    'adidas': (0, 255, 255), 'nike': (255, 0, 0),
    'asics': (0, 0, 255), 'other': (128, 128, 128)
}

BLUR_THRESHOLD = 35.0
ENTROPY_CUTOFF = 0.85
PERSON_CONF = 0.40
SHOE_CONF = 0.15
POSE_CONF = 0.15
ANCHOR_THRESH = 0.50

IDX_HEEL, IDX_LOGO1, IDX_TOE, IDX_LACE, IDX_SOLE, IDX_LOGO2 = 0, 1, 2, 3, 4, 5
KPT_THRESH = 0.25

DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
MAX_OUTPUT_SIZE = 800

ZEROSHOT_CONFIGS = [
    {'name': 'Marqo/marqo-fashionSigLIP', 'type': 'open_clip'},
    {'name': 'google/siglip2-so400m-patch14-384', 'type': 'transformers'}
]


# ============================================================
# Utilities
# ============================================================
def get_model_path(filename):
    """Resolve model weight file from Space repo root."""
    path = SPACE_ROOT / filename
    if path.exists():
        return str(path)
    raise FileNotFoundError(f"Model weight not found: {path}. Please upload {filename} to the Space.")


def get_feeding_root():
    """Extract and resolve feeding dataset from zip in Space root."""
    extract_dir = SPACE_ROOT / "feeding_dataset"
    if extract_dir.exists() and any(extract_dir.iterdir()):
        # Find the actual subfolder with brand dirs
        for sub in extract_dir.rglob("adidas"):
            return sub.parent
        return extract_dir

    # Find and extract zip
    zip_files = list(SPACE_ROOT.glob("autolabeling_sample*.zip"))
    if not zip_files:
        print("[WARN] No feeding dataset zip found. Zero-shot prototypes will be empty.")
        return None

    print(f"[INFO] Extracting feeding dataset from {zip_files[0].name}...")
    extract_dir.mkdir(exist_ok=True)
    with zipfile.ZipFile(zip_files[0], 'r') as zf:
        zf.extractall(extract_dir)
    print(f"[OK] Feeding dataset extracted to {extract_dir}")

    # Find the actual subfolder with brand dirs (zip may have nested folders)
    for sub in extract_dir.rglob("adidas"):
        return sub.parent
    return extract_dir


def numpy_to_base64(img_np, fmt='JPEG', quality=80):
    """Convert BGR numpy array to base64 data URI."""
    rgb = cv2.cvtColor(img_np, cv2.COLOR_BGR2RGB) if len(img_np.shape) == 3 and img_np.shape[2] == 3 else img_np
    pil = Image.fromarray(rgb.astype(np.uint8))
    buf = io.BytesIO()
    if fmt == 'JPEG':
        pil.save(buf, format=fmt, quality=quality)
    else:
        pil.save(buf, format=fmt)
    b64 = base64.b64encode(buf.getvalue()).decode()
    mime = 'jpeg' if fmt == 'JPEG' else 'png'
    return f"data:image/{mime};base64,{b64}"


def pil_to_base64(pil_img, fmt='JPEG', quality=80):
    """Convert PIL Image to base64 data URI."""
    buf = io.BytesIO()
    if fmt == 'JPEG':
        pil_img.convert('RGB').save(buf, format=fmt, quality=quality)
    else:
        pil_img.save(buf, format=fmt)
    b64 = base64.b64encode(buf.getvalue()).decode()
    mime = 'jpeg' if fmt == 'JPEG' else 'png'
    return f"data:image/{mime};base64,{b64}"


def resize_for_output(img_np, max_size=MAX_OUTPUT_SIZE):
    """Resize image so longest side ≤ max_size."""
    h, w = img_np.shape[:2]
    if max(h, w) <= max_size:
        return img_np
    scale = max_size / max(h, w)
    new_w, new_h = int(w * scale), int(h * scale)
    return cv2.resize(img_np, (new_w, new_h), interpolation=cv2.INTER_AREA)


def estimate_blur(crop_bgr):
    """Laplacian variance blur score, normalized to [0, 1]."""
    if crop_bgr.size == 0:
        return 0.1
    gray = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2GRAY)
    return min(1.0, cv2.Laplacian(gray, cv2.CV_64F).var() / BLUR_THRESHOLD)


def calculate_entropy_weight(probs):
    """Entropy-based certainty weight for consensus voting."""
    probs = np.clip(probs, 1e-9, 1.0)
    entropy = -np.sum(probs * np.log(probs))
    max_entropy = np.log(len(probs))
    certainty = 1.0 - (entropy / max_entropy)
    return max(0.01, certainty)


def is_valid_shoe_position(s_bbox, person_h):
    """Shoe center must be in lower 60% of person crop."""
    return ((s_bbox[1] + s_bbox[3]) / 2) > (person_h * 0.4)


def get_transform():
    return transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])


# ============================================================
# Zero-Shot Model
# ============================================================
class HybridZeroShot(nn.Module):
    def __init__(self, model_name, model_type, device, feeding_root=None):
        super().__init__()
        self.device = device
        self.model_type = model_type

        if model_type == 'open_clip':
            import open_clip
            self.model, _, self.preprocess = open_clip.create_model_and_transforms(f"hf-hub:{model_name}")
            self.model = self.model.to(device).eval()
            self.feat_dim = 768
        else:
            from transformers import AutoImageProcessor, AutoModel
            self.processor = AutoImageProcessor.from_pretrained(model_name)
            self.model = AutoModel.from_pretrained(model_name, low_cpu_mem_usage=True).to(device).eval()
            self.feat_dim = 1152

        self.prototypes = self._build_prototypes(feeding_root)

    def _build_prototypes(self, feeding_root):
        prototypes = torch.zeros((4, self.feat_dim), device=self.device)
        if feeding_root is None:
            print(f"[WARN] No feeding dataset — zero-shot prototypes will be zeros for {self.model_type}")
            return prototypes

        root = Path(feeding_root)
        for name, idx in FEEDING_MAP.items():
            folder = root / name
            if not folder.exists():
                continue
            files = list(folder.glob('*.jpg'))[:8]
            if not files:
                continue
            imgs = [Image.open(f).convert("RGB") for f in files]
            with torch.inference_mode():
                if self.model_type == 'open_clip':
                    feat = self.model.encode_image(
                        torch.stack([self.preprocess(im) for im in imgs]).to(self.device)
                    )
                else:
                    out = self.model.get_image_features(
                        **self.processor(images=imgs, return_tensors="pt").to(self.device)
                    )
                    feat = out.pooler_output if hasattr(out, 'pooler_output') else out
                feat = feat / (feat.norm(dim=-1, keepdim=True) + 1e-9)
                prototypes[idx] = feat.mean(dim=0)
        return prototypes

    def forward(self, pil_images):
        with torch.inference_mode():
            if self.model_type == 'open_clip':
                feat = self.model.encode_image(
                    torch.stack([self.preprocess(img) for img in pil_images]).to(self.device)
                )
            else:
                out = self.model.get_image_features(
                    **self.processor(images=pil_images, return_tensors="pt").to(self.device)
                )
                feat = out.pooler_output if hasattr(out, 'pooler_output') else out
            feat = feat / (feat.norm(dim=-1, keepdim=True) + 1e-9)
            return F.softmax(feat @ self.prototypes.to(feat.dtype).T * 50.0, dim=1)


# ============================================================
# Consensus Voting
# ============================================================
def apply_consensus_voting(candidates):
    """Entropy-weighted consensus from 3 classifiers + quality gating."""
    if not candidates:
        return []

    for s in candidates:
        p_swin, p_zs1, p_zs2 = s['raw_probs']

        w_swin = calculate_entropy_weight(p_swin)
        w_zs1 = calculate_entropy_weight(p_zs1)
        w_zs2 = calculate_entropy_weight(p_zs2)

        total_w = w_swin + w_zs1 + w_zs2
        weighted_avg = (p_swin * w_swin + p_zs1 * w_zs1 + p_zs2 * w_zs2) / total_w
        best_idx = int(np.argmax(weighted_avg))

        pose_score = s.get('pose_score', 0.0)
        depth_score = s.get('depth_score', 1.0)
        blur_factor = s.get('blur_factor', 1.0)
        quality_factor = (pose_score * depth_score * blur_factor) ** (1 / 3)

        final_conf = float(weighted_avg[best_idx]) * quality_factor
        final_entropy = -np.sum(weighted_avg * np.log(np.clip(weighted_avg, 1e-9, 1.0))) / np.log(4)

        if final_entropy > ENTROPY_CUTOFF or quality_factor < 0.15:
            best_idx = 3
            final_conf = min(0.1, final_conf)

        s.update({
            'final_idx': best_idx,
            'final_conf_pre': float(weighted_avg[best_idx]),
            'brand': BRANDS[best_idx],
            'conf': final_conf,
            'weighted_avg_probs': weighted_avg,
            'dynamic_weights': (w_swin, w_zs1, w_zs2),
            'relabel_info': ''
        })
    return candidates


# ============================================================
# System Loader
# ============================================================
_model_cache = {}
_feeding_root_cache = None
_feeding_root_loaded = False


def _get_feeding_root():
    global _feeding_root_cache, _feeding_root_loaded
    if not _feeding_root_loaded:
        _feeding_root_cache = get_feeding_root()
        _feeding_root_loaded = True
    return _feeding_root_cache


def get_model(name):
    """Lazy-load a single model by name, cache for reuse."""
    global _model_cache
    if name in _model_cache:
        return _model_cache[name]

    device = DEVICE

    if name == 'person':
        from ultralytics import YOLO
        person_path = get_model_path("person26n_best.pt")
        m = YOLO(person_path)
        print("[OK] Person detector loaded (YOLO)")

    elif name == 'shoe':
        from ultralytics import YOLO
        shoe_path = get_model_path("yoloshoe_best.pt")
        m = YOLO(shoe_path)
        print("[OK] Shoe detector loaded (YOLO)")

    elif name == 'swin':
        swin_path = get_model_path("best_model_swin.pth")
        swin_model = models.swin_t(weights=None)
        swin_model.head = nn.Linear(swin_model.head.in_features, 4)
        swin_model.load_state_dict(
            torch.load(swin_path, map_location=device, weights_only=False), strict=False
        )
        m = swin_model.to(device).eval()
        if device == 'cuda':
            m = m.half()
        print("[OK] Swin-T classifier loaded")

    elif name == 'pose':
        from ultralytics import YOLO
        pose_path = get_model_path("best225.pt")
        m = YOLO(pose_path)
        print("[OK] YOLO pose model loaded")

    elif name == 'depth':
        from transformers import DPTForDepthEstimation, DPTImageProcessor
        depth_processor = DPTImageProcessor.from_pretrained("Intel/dpt-hybrid-midas")
        depth_model = DPTForDepthEstimation.from_pretrained("Intel/dpt-hybrid-midas").to(device).eval()
        _model_cache['depth_processor'] = depth_processor
        m = depth_model
        print("[OK] MiDaS depth model loaded")

    elif name == 'depth_processor':
        # Loading depth also loads depth_processor
        get_model('depth')
        return _model_cache['depth_processor']

    elif name == 'zeroshots':
        feeding_root = _get_feeding_root()
        zeroshots = []
        for cfg in ZEROSHOT_CONFIGS:
            zs = HybridZeroShot(cfg['name'], cfg['type'], device, feeding_root)
            if device == 'cuda':
                zs = zs.half()
            zeroshots.append(zs)
            print(f"[OK] Zero-shot model loaded: {cfg['name']}")
        m = zeroshots

    else:
        raise ValueError(f"Unknown model: {name}")

    _model_cache[name] = m
    return m


# ============================================================
# Inference Pipeline
# ============================================================
def compute_depth_map(img_rgb, h, w):
    """Run MiDaS depth estimation, return normalized depth map."""
    processor = get_model('depth_processor')
    model = get_model('depth')
    inputs = processor(images=img_rgb, return_tensors="pt").to(DEVICE)
    with torch.no_grad():
        outputs = model(**inputs)
        depth = outputs.predicted_depth
    depth = F.interpolate(
        depth.unsqueeze(1), size=(h, w), mode="bicubic", align_corners=False
    ).squeeze().cpu().numpy()
    depth = (depth - depth.min()) / (depth.max() - depth.min() + 1e-6)
    return depth


def predict(input_image, progress=gr.Progress()):
    """
    Full inference pipeline for a single image.
    Returns structured JSON with base64-encoded images.
    """
    if input_image is None:
        return {"error": "No image provided", "persons": [], "annotated_image": "", "depth_map": ""}

    tf = get_transform()

    # Convert PIL → numpy (BGR for OpenCV, RGB for models)
    img_rgb = np.array(input_image.convert("RGB"))
    frame = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
    h, w = frame.shape[:2]

    # Annotated image (draw on a copy)
    annotated = frame.copy()

    # --- Step 1: Person Detection (YOLO) ---
    try:
        progress(0.05, desc="Loading person detector...")
        person_model = get_model('person')
    except Exception as e:
        tb = traceback.format_exc()
        print(f"[ERROR] Person model loading failed:\n{tb}")
        return {"error": f"Model loading failed: {str(e)}", "persons": [], "annotated_image": "", "depth_map": ""}

    progress(0.10, desc="Detecting persons (YOLO)...")
    person_yolo_res = person_model.predict(img_rgb, conf=PERSON_CONF, verbose=False)
    person_boxes = []
    if len(person_yolo_res) > 0 and person_yolo_res[0].boxes is not None:
        for box in person_yolo_res[0].boxes:
            person_boxes.append(box.xyxy[0].cpu().numpy())
    if len(person_boxes) == 0:
        progress(0.15, desc="STAT:persons=0|No persons found")
        out_img = resize_for_output(annotated)
        return {
            "annotated_image": numpy_to_base64(out_img),
            "depth_map": "",
            "persons": [],
            "message": "No persons detected in image."
        }

    n_persons = len(person_boxes)
    progress(0.15, desc=f"STAT:persons={n_persons}|{n_persons} person{'s' if n_persons != 1 else ''} detected")

    # --- Step 2: Depth Map ---
    progress(0.20, desc="Computing depth map (MiDaS)...")
    d_map = compute_depth_map(img_rgb, h, w)

    # Depth visualization (MAGMA colormap)
    d_vis_full = cv2.applyColorMap((d_map * 255).astype(np.uint8), cv2.COLORMAP_MAGMA)
    progress(0.30, desc="STAT:depth=done|Depth map computed")

    # --- Step 3: Per-person processing ---
    progress(0.32, desc=f"Processing {n_persons} person{'s' if n_persons != 1 else ''}...")
    persons_output = []
    total_shoes_found = 0

    for p_idx, p_bbox in enumerate(person_boxes):
        px1, py1, px2, py2 = map(int, p_bbox)
        px1, py1 = max(0, px1), max(0, py1)
        px2, py2 = min(w, px2), min(h, py2)
        if px2 <= px1 or py2 <= py1:
            continue

        person_crop = frame[py1:py2, px1:px2]
        if person_crop.size == 0:
            continue

        p_crop_d = d_map[py1:py2, px1:px2]
        p_depth = np.median(p_crop_d) if p_crop_d.size > 0 else 0.5

        # Draw person box on annotated image
        cv2.rectangle(annotated, (px1, py1), (px2, py2), (200, 200, 200), 1)
        cv2.putText(annotated, f"P{p_idx + 1}", (px1 + 4, py1 + 16),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

        # --- Step 4: Shoe Detection (YOLO) ---
        progress(0.35 + p_idx * 0.05, desc=f"Detecting shoes on person {p_idx + 1}/{n_persons}...")
        shoe_model = get_model('shoe')
        shoe_yolo_res = shoe_model.predict(person_crop, conf=SHOE_CONF, verbose=False)
        shoe_boxes = []
        if len(shoe_yolo_res) > 0 and shoe_yolo_res[0].boxes is not None:
            shoe_boxes = [b.xyxy[0].cpu().numpy() for b in shoe_yolo_res[0].boxes]

        left_shoes, right_shoes = [], []

        for s_bbox in shoe_boxes:
            sx1, sy1, sx2, sy2 = map(int, s_bbox)
            sx1, sy1 = max(0, sx1), max(0, sy1)
            sx2, sy2 = min(person_crop.shape[1], sx2), min(person_crop.shape[0], sy2)
            if sx2 <= sx1 or sy2 <= sy1:
                continue

            # Global coords
            gx1, gy1, gx2, gy2 = px1 + sx1, py1 + sy1, px1 + sx2, py1 + sy2

            # Position validation
            if not is_valid_shoe_position((sx1, sy1, sx2, sy2), py2 - py1):
                continue

            # Depth similarity
            s_crop_d = d_map[gy1:gy2, gx1:gx2]
            s_depth = np.median(s_crop_d) if s_crop_d.size > 0 else 0.5
            depth_score = float(np.exp(-(abs(p_depth - s_depth) ** 2) / (2 * 0.1 ** 2)))

            # Padded crop
            pad = 10
            csx1 = max(0, sx1 - pad)
            csx2 = min(person_crop.shape[1], sx2 + pad)
            csy1 = max(0, sy1 - pad)
            csy2 = min(person_crop.shape[0], sy2 + pad)
            shoe_crop = person_crop[csy1:csy2, csx1:csx2]
            if shoe_crop.size == 0:
                continue

            blur_factor = estimate_blur(shoe_crop)
            shoe_center_x = (sx1 + sx2) / 2
            person_center_x = person_crop.shape[1] / 2
            side = "Left" if shoe_center_x < person_center_x else "Right"

            shoe_data = {
                's_bbox_local': [sx1, sy1, sx2, sy2],
                's_bbox_global': [gx1, gy1, gx2, gy2],
                'depth_score': depth_score,
                'blur_factor': blur_factor,
                'side': side,
                'dist_to_center': abs(shoe_center_x - person_center_x),
                'shoe_crop_bgr': shoe_crop
            }

            if side == "Left":
                left_shoes.append(shoe_data)
            else:
                right_shoes.append(shoe_data)

        # Best shoe per side
        best_left = max(left_shoes, key=lambda x: x['depth_score'] / (x['dist_to_center'] + 1)) if left_shoes else None
        best_right = max(right_shoes, key=lambda x: x['depth_score'] / (x['dist_to_center'] + 1)) if right_shoes else None

        candidates = []
        for s_data in [best_left, best_right]:
            if s_data is None:
                continue

            shoe_rgb = cv2.cvtColor(s_data['shoe_crop_bgr'], cv2.COLOR_BGR2RGB)

            # --- Step 5: Pose Estimation ---
            progress(0.50 + p_idx * 0.05, desc=f"Estimating pose P{p_idx + 1} {s_data['side']}...")
            pose_model = get_model('pose')
            pose_results = pose_model.predict(shoe_rgb, conf=POSE_CONF, verbose=False)
            pose_score = 0.0
            pose_plot = shoe_rgb  # fallback

            if len(pose_results) > 0 and len(pose_results[0].boxes) > 0 and pose_results[0].keypoints is not None:
                kpts_conf = pose_results[0].keypoints.conf[0].cpu().numpy()
                n_kpts = len(kpts_conf)

                struct_confs = [kpts_conf[i] for i in [IDX_HEEL, IDX_TOE, IDX_LACE, IDX_SOLE]
                                if n_kpts > i and kpts_conf[i] > KPT_THRESH]
                logo_confs = [kpts_conf[i] for i in [IDX_LOGO1, IDX_LOGO2]
                              if n_kpts > i and kpts_conf[i] > KPT_THRESH]

                struct_prob = np.mean(struct_confs) if struct_confs else 0.0
                logo_prob = max(logo_confs) if logo_confs else 0.0
                pose_score = 1.0 - ((1.0 - struct_prob) * (1.0 - logo_prob))

                pose_plot = pose_results[0].plot()

            candidates.append({
                's_bbox_global': s_data['s_bbox_global'],
                'side': s_data['side'],
                'depth_score': s_data['depth_score'],
                'blur_factor': s_data['blur_factor'],
                'pose_score': pose_score,
                'shoe_rgb': shoe_rgb,
                'pose_plot': pose_plot,
            })

        if not candidates:
            continue

        # --- Step 6: Classification (batch) ---
        progress(0.65, desc="Loading classifiers (Swin-T + SigLIP)...")
        swin_model = get_model('swin')
        zeroshots = get_model('zeroshots')
        progress(0.70, desc="Classifying brands...")
        pil_shoes = [Image.fromarray(c['shoe_rgb']) for c in candidates]
        shoe_tensors = torch.stack([tf(pil) for pil in pil_shoes]).to(DEVICE)

        with torch.no_grad():
            p_swin = F.softmax(swin_model(shoe_tensors), dim=1).cpu().float().numpy()
            p_zs1 = zeroshots[0](pil_shoes).cpu().float().numpy()
            p_zs2 = zeroshots[1](pil_shoes).cpu().float().numpy()

        for i, c in enumerate(candidates):
            c['raw_probs'] = (p_swin[i], p_zs1[i], p_zs2[i])

        # --- Step 7: Consensus Voting ---
        progress(0.85, desc="Running consensus voting...")
        candidates = apply_consensus_voting(candidates)

        # --- Step 8: Anchor-based relabeling ---
        progress(0.90, desc="Applying anchor-based relabeling...")
        valid_results = [s for s in candidates if s['final_idx'] != 3]
        if valid_results:
            best_shoe = max(valid_results, key=lambda x: x['conf'])
            if best_shoe['final_conf_pre'] >= ANCHOR_THRESH:
                for s in candidates:
                    if s['brand'] != best_shoe['brand']:
                        old_brand = s['brand']
                        s['relabel_info'] = f"(Fixed from {old_brand})"
                        s['brand'] = best_shoe['brand']
                        s['final_idx'] = best_shoe['final_idx']

        # --- Draw shoe boxes on annotated image & build output ---
        shoes_output = []
        for c in candidates:
            gx1, gy1, gx2, gy2 = c['s_bbox_global']
            brand = c['brand']
            color = BRAND_COLORS_BGR.get(brand, (128, 128, 128))

            cv2.rectangle(annotated, (gx1, gy1), (gx2, gy2), color, 3)
            label = f"{brand} {c['conf']:.0%}"
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
            cv2.rectangle(annotated, (gx1, gy1 - th - 8), (gx1 + tw + 6, gy1), color, -1)
            cv2.putText(annotated, label, (gx1 + 3, gy1 - 4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)

            # Also draw on depth vis
            cv2.rectangle(d_vis_full, (gx1, gy1), (gx2, gy2), (255, 255, 255), 2)

            # Encode images
            crop_b64 = pil_to_base64(Image.fromarray(c['shoe_rgb']))
            pose_plot_rgb = c['pose_plot']
            if isinstance(pose_plot_rgb, np.ndarray) and len(pose_plot_rgb.shape) == 3:
                if pose_plot_rgb.shape[2] == 3:
                    pose_b64 = pil_to_base64(Image.fromarray(pose_plot_rgb))
                else:
                    pose_b64 = crop_b64
            else:
                pose_b64 = crop_b64

            w_swin, w_zs1, w_zs2 = c.get('dynamic_weights', (0.33, 0.33, 0.33))

            shoes_output.append({
                'side': c['side'],
                'brand': c['brand'],
                'confidence': round(float(c['conf']), 4),
                'pose_score': round(float(c['pose_score']), 4),
                'blur_score': round(float(c['blur_factor']), 4),
                'depth_score': round(float(c['depth_score']), 4),
                'probs': {
                    'swin': [round(float(v), 4) for v in c['raw_probs'][0]],
                    'marqo': [round(float(v), 4) for v in c['raw_probs'][1]],
                    'google': [round(float(v), 4) for v in c['raw_probs'][2]],
                    'weighted_avg': [round(float(v), 4) for v in c.get('weighted_avg_probs', c['raw_probs'][0])],
                    'weights': [round(float(w_swin), 4), round(float(w_zs1), 4), round(float(w_zs2), 4)]
                },
                'relabel_info': c.get('relabel_info', ''),
                'crop_base64': crop_b64,
                'pose_base64': pose_b64,
            })

        if shoes_output:
            total_shoes_found += len(shoes_output)
            progress(0.60 + p_idx * 0.05, desc=f"STAT:shoes={total_shoes_found}|P{p_idx + 1}: {len(shoes_output)} shoe{'s' if len(shoes_output) != 1 else ''} classified")
            person_crop_rgb = cv2.cvtColor(person_crop, cv2.COLOR_BGR2RGB)
            persons_output.append({
                'rank': p_idx + 1,
                'shoes': shoes_output,
                'person_crop_base64': pil_to_base64(
                    Image.fromarray(resize_for_output(person_crop_rgb, 400))
                ),
            })

    # --- Encode final images ---
    progress(0.95, desc="Encoding results...")
    annotated_out = resize_for_output(annotated)
    depth_out = resize_for_output(d_vis_full)

    gc.collect()
    if DEVICE == 'cuda':
        torch.cuda.empty_cache()

    return {
        'annotated_image': numpy_to_base64(annotated_out),
        'depth_map': numpy_to_base64(depth_out, fmt='PNG'),
        'persons': persons_output,
    }


# ============================================================
# Gradio Interface
# ============================================================
demo = gr.Interface(
    fn=predict,
    inputs=gr.Image(type="pil", label="Upload Image"),
    outputs=gr.JSON(label="Results"),
    title="👟 Shoe Brand Classification",
    description="Upload a photo with people wearing shoes. The pipeline detects persons → shoes → classifies brand (adidas / nike / asics / other) using multi-model consensus voting. Runs on CPU.",
    examples=[],
    cache_examples=False,
)

if __name__ == "__main__":
    demo.queue(max_size=5).launch()
