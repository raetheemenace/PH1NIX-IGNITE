# AI Training - Quick Start

## What You Need

1. Phone to record videos
2. Google account (for Colab and Drive)
3. 30 minutes per sign language

## Training Workflow

```
┌─────────────────┐
│ 1. Record Videos│  (On your phone, 20-30 per sign)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ 2. Upload to    │  (Google Drive, organize by sign name)
│    Google Drive │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ 3. Open Colab   │  (Upload notebook, connect to Drive)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ 4. Run Notebook │  (Click through cells, wait for training)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ 5. Download     │  (Get .pkl file from Drive)
│    Model        │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ 6. Put in       │  (Place in trained_models/ folder)
│    Project      │
└─────────────────┘
```

## Files You'll Create

```
ai-training/
├── datasets/                    (You create this in Google Drive)
│   ├── fsl/
│   │   ├── KAMUSTA/
│   │   │   ├── video1.mp4
│   │   │   ├── video2.mp4
│   │   │   └── ...
│   │   ├── SALAMAT/
│   │   ├── TULONG/
│   │   ├── OO/
│   │   └── HINDI/
│   └── asl/
│       ├── HELLO/
│       ├── THANK_YOU/
│       ├── HELP/
│       ├── YES/
│       └── NO/
│
├── trained_models/              (Download from Colab after training)
│   ├── fsl_model.pkl           (FSL trained model)
│   └── asl_model.pkl           (ASL trained model)
│
└── notebooks/                   (Already created)
    ├── fsl_training.ipynb      (Upload to Colab)
    └── asl_training.ipynb      (Upload to Colab)
```

## Detailed Guides

- See `docs/TRAINING_GUIDE.md` for step-by-step instructions
- See `docs/MEDIAPIPE_EXPLAINED.md` to understand how it works

## Tips for Good Results

1. **Record more videos** - 30+ per sign is better than 10
2. **Vary conditions** - Different lighting, angles, backgrounds
3. **Be consistent** - Do the sign the same way each time
4. **Clear visibility** - Make sure hands are fully visible
5. **Good lighting** - Avoid shadows on hands

## Expected Training Time

- Recording videos: 15-20 minutes per sign language
- Uploading to Drive: 5-10 minutes
- Training in Colab: 5-10 minutes per sign language
- Total: ~1 hour for both FSL and ASL
