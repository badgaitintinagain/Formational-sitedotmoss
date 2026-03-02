---
title: Shoe Brand Classification
emoji: 👟
colorFrom: gray
colorTo: blue
sdk: gradio
sdk_version: "5.29.0"
app_file: app.py
pinned: false
---

# 👟 Shoe Brand Classification Demo

Multi-model pipeline for detecting and classifying shoe brands (adidas / nike / asics / other) from photos.

**Pipeline:** RF-DETR → MiDaS Depth → YOLOv8 Pose → Swin-T + FashionSigLIP + SigLIP2 → Consensus Voting
