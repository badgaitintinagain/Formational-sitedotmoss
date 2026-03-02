"""
Hawk WBC Detection — Hugging Face Space
Pipeline: YOLOv8 Detection → 6-class WBC classification
Classes: heterophils, eosinophils, basophils, lymphocytes, monocytes, thrombocytes

Model weights (.pt) should be placed in this Space repo root.
"""

import gradio as gr
import torch
import cv2
import numpy as np
import base64
import os
import gc
import traceback
from PIL import Image
from pathlib import Path

# ============================================================
# Configuration
# ============================================================
SPACE_ROOT = Path(os.path.dirname(os.path.abspath(__file__)))

CLASSES = [
    "heterophil",
    "eosinophil",
    "basophil",
    "lymphocyte",
    "monocyte",
    "thrombocyte",
]

CLASS_COLORS_BGR = {
    "heterophil":  (0, 200, 255),   # orange
    "eosinophil":  (0, 0, 255),     # red
    "basophil":    (255, 0, 128),    # purple
    "lymphocyte":  (255, 200, 0),    # cyan-blue
    "monocyte":    (0, 255, 0),      # green
    "thrombocyte": (200, 200, 200),  # gray
}

CLASS_COLORS_HEX = {
    "heterophil":  "#FFC800",
    "eosinophil":  "#FF0000",
    "basophil":    "#8000FF",
    "lymphocyte":  "#00C8FF",
    "monocyte":    "#00FF00",
    "thrombocyte": "#C8C8C8",
}

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
CONF_THRESHOLD = 0.25
IOU_THRESHOLD = 0.45
MAX_OUTPUT_SIZE = 1024


# ============================================================
# Utilities
# ============================================================
def get_model_path(filename: str) -> str:
    """Resolve model weight file from Space repo root."""
    path = SPACE_ROOT / filename
    if path.exists():
        return str(path)
    raise FileNotFoundError(
        f"Model weight not found: {path}. Please upload {filename} to the Space."
    )


def numpy_to_base64(img_np: np.ndarray, fmt: str = "JPEG", quality: int = 85) -> str:
    """Convert BGR numpy array to base64 data URI."""
    if len(img_np.shape) == 3 and img_np.shape[2] == 3:
        rgb = cv2.cvtColor(img_np, cv2.COLOR_BGR2RGB)
    else:
        rgb = img_np
    pil = Image.fromarray(rgb)
    from io import BytesIO
    buf = BytesIO()
    pil.save(buf, format=fmt, quality=quality)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    mime = "image/jpeg" if fmt == "JPEG" else "image/png"
    return f"data:{mime};base64,{b64}"


def resize_for_output(img: np.ndarray, max_size: int = MAX_OUTPUT_SIZE) -> np.ndarray:
    """Resize image so the longest side is max_size, preserving aspect ratio."""
    h, w = img.shape[:2]
    if max(h, w) <= max_size:
        return img
    scale = max_size / max(h, w)
    return cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)


# ============================================================
# Model Loading
# ============================================================
_model = None


def load_model():
    """Load YOLOv8 detection model."""
    global _model
    if _model is not None:
        return _model

    from ultralytics import YOLO

    # Try common weight filenames
    for name in ["tune_best_1733 (1).pt", "best.pt", "hawkwbc.pt", "wbc_detect.pt", "yolov8_wbc.pt"]:
        try:
            path = get_model_path(name)
            print(f"[INFO] Loading YOLO model from {path}")
            _model = YOLO(path)
            _model.to(DEVICE)
            print(f"[OK] Model loaded on {DEVICE}")
            return _model
        except FileNotFoundError:
            continue

    raise FileNotFoundError(
        "No YOLO weight file found. Please upload best.pt (or similar) to the Space root."
    )


# ============================================================
# Inference Pipeline
# ============================================================
def predict(image, progress=gr.Progress(track_tqdm=False)):
    """
    Run WBC detection on a blood smear image.
    Returns a JSON dict consumed by the frontend.
    """
    try:
        if image is None:
            return {"error": "No image provided"}

        # --- Load model ---
        progress(0.1, desc="Loading model...")
        model = load_model()

        # --- Convert to numpy BGR ---
        if isinstance(image, Image.Image):
            img_np = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        elif isinstance(image, np.ndarray):
            img_np = image.copy()
        else:
            return {"error": "Unsupported image format"}

        progress(0.2, desc="Running detection...")

        # --- Run YOLO detection ---
        results = model.predict(
            img_np,
            conf=CONF_THRESHOLD,
            iou=IOU_THRESHOLD,
            device=DEVICE,
            verbose=False,
        )

        progress(0.6, desc="Processing detections...")

        result = results[0]
        boxes = result.boxes
        annotated = img_np.copy()

        cells = []
        class_counts = {cls: 0 for cls in CLASSES}

        if boxes is not None and len(boxes) > 0:
            for i, box in enumerate(boxes):
                # Bounding box
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
                conf = float(box.conf[0].cpu().numpy())
                cls_id = int(box.cls[0].cpu().numpy())

                # Map class id to name
                cls_name = model.names.get(cls_id, f"class_{cls_id}")
                # Normalize to our known classes
                cls_lower = cls_name.lower().strip()
                matched_class = None
                for c in CLASSES:
                    if c in cls_lower or cls_lower in c:
                        matched_class = c
                        break
                if matched_class is None:
                    matched_class = cls_lower

                class_counts[matched_class] = class_counts.get(matched_class, 0) + 1

                # Draw bounding box
                color = CLASS_COLORS_BGR.get(matched_class, (255, 255, 255))
                cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)

                # Label
                label = f"{matched_class} {conf:.0%}"
                (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
                cv2.rectangle(annotated, (x1, y1 - th - 6), (x1 + tw + 4, y1), color, -1)
                cv2.putText(
                    annotated, label, (x1 + 2, y1 - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1, cv2.LINE_AA,
                )

                # Crop cell
                pad = 10
                cy1 = max(0, y1 - pad)
                cx1 = max(0, x1 - pad)
                cy2 = min(img_np.shape[0], y2 + pad)
                cx2 = min(img_np.shape[1], x2 + pad)
                crop = img_np[cy1:cy2, cx1:cx2]

                cells.append({
                    "id": i,
                    "class": matched_class,
                    "confidence": round(conf, 4),
                    "bbox": [int(x1), int(y1), int(x2), int(y2)],
                    "crop_base64": numpy_to_base64(crop),
                    "color": CLASS_COLORS_HEX.get(matched_class, "#FFFFFF"),
                })

        progress(0.85, desc="Encoding results...")

        # Sort cells by confidence descending
        cells.sort(key=lambda c: c["confidence"], reverse=True)

        # Encode annotated image
        annotated_resized = resize_for_output(annotated)
        annotated_b64 = numpy_to_base64(annotated_resized)

        # Original image (resized)
        original_resized = resize_for_output(img_np)
        original_b64 = numpy_to_base64(original_resized)

        total_cells = len(cells)
        progress(1.0, desc=f"Done — {total_cells} cells detected")

        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        return {
            "annotated_image": annotated_b64,
            "original_image": original_b64,
            "total_cells": total_cells,
            "class_counts": class_counts,
            "cells": cells,
        }

    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}


# ============================================================
# Gradio Interface
# ============================================================
demo = gr.Interface(
    fn=predict,
    inputs=gr.Image(type="pil", label="Blood Smear Image"),
    outputs=gr.JSON(label="Detection Results"),
    title="🔬 Hawk WBC Detection",
    description="Upload a hawk/falcon blood smear image to detect and classify white blood cells.",
    api_name="predict",
)

if __name__ == "__main__":
    demo.launch()
