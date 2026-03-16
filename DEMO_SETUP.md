# SignVoice Demo Setup Guide

## What's Working ✓

1. **Backend API** - Fully functional
   - Loads improved model (98.3% accuracy)
   - MediaPipe hand detection
   - Feature engineering (106 features)
   - Real-time sign recognition

2. **Webcam Test** - Ready for demo
   - Real-time video feed
   - Sign recognition every 500ms
   - On-screen display of predictions
   - Works with all 5 trained signs

3. **Trained Model**
   - 5 ASL signs: How Are You, Thank You, Help, Yes, No
   - 2,671 training samples
   - 98.3% test accuracy
   - Ensemble model (RF + GB + SVM)

## Quick Start for Demo

### 1. Start Backend
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0
```

Wait for: `✓ Loaded model with signs: ['HOW_ARE_YOU', 'THANK_YOU', 'HELP', 'YES', 'NO']`

### 2. Run Webcam Test
```bash
cd backend
python test_webcam.py
```

Press 'q' to quit

### 3. Demo the Signs
- **How Are You** (2 hands)
- **Thank You** (1 hand)  
- **Help** (2 hands)
- **Yes** (1 hand - nodding fist)
- **No** (1 hand - side to side)

## What to Show

1. **Training Process**
   - Show `ai-training/notebooks/working.ipynb`
   - Explain MediaPipe + scikit-learn approach
   - Show 98.3% accuracy results

2. **Live Demo**
   - Run `test_webcam.py`
   - Demonstrate each of the 5 signs
   - Show real-time recognition
   - Highlight confidence scores

3. **Architecture**
   - MediaPipe extracts 21 hand landmarks
   - Feature engineering creates 106 features
   - StandardScaler normalization
   - Ensemble model prediction

## Mobile App Status

The mobile app code is complete but has a Node.js version compatibility issue:
- Current Node: v24.13.1
- Expo 50 requires: Node 18 or 20

**For hackathon:** Use webcam test (same functionality)
**After hackathon:** Install Node 20 to run mobile app

## Files Ready to Commit

Backend:
- ✓ `backend/app/` - Complete API
- ✓ `backend/test_webcam.py` - Demo script
- ✓ `backend/requirements.txt` - All dependencies

AI Training:
- ✓ `ai-training/notebooks/working.ipynb` - Training notebook
- ✓ `ai-training/trained_models/asl_model_improved.pkl` - Model file

Mobile (code complete, needs Node 20):
- ✓ `mobile/src/` - All components
- ✓ `mobile/package.json` - Dependencies

Documentation:
- ✓ `docs/` - All guides
- ✓ `README.md` - Project overview

## Troubleshooting

**Backend won't start:**
- Check model file exists: `ai-training/trained_models/asl_model_improved.pkl`
- Install dependencies: `pip install -r requirements.txt`

**Webcam not working:**
- Check camera permissions
- Try different camera index: `cv2.VideoCapture(1)`

**Low accuracy:**
- Ensure good lighting
- Do signs slowly and clearly
- Keep hands in frame
- Practice the exact signs from training videos

## Demo Tips

1. Start with simple signs (Yes, No)
2. Do signs slowly and deliberately  
3. Explain the feature engineering
4. Show the confusion matrix from training
5. Discuss future improvements (more signs, better accuracy)
