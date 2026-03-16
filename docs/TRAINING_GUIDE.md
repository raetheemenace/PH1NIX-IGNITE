# Complete Training Guide - MediaPipe + Scikit-Learn

## The Big Picture

```
You record videos → Upload to Colab → MediaPipe extracts hand positions → 
Scikit-learn learns patterns → Download trained model → Backend uses it for predictions
```

## Step-by-Step Visual Workflow

### Step 1: Record Your Sign Videos (On Your Phone)

Record yourself doing each sign multiple times:

```
FSL Signs to Record:
├── KAMUSTA (record 20-30 times, different angles)
├── SALAMAT (record 20-30 times, different angles)
├── TULONG (record 20-30 times, different angles)
├── OO (record 20-30 times, different angles)
└── HINDI (record 20-30 times, different angles)
```

**Tips:**
- Each video should be 2-3 seconds
- Do the sign clearly
- Try different angles, lighting, backgrounds
- More videos = better accuracy

---

### Step 2: Organize Videos in Google Drive

Create this folder structure in your Google Drive:

```
My Drive/
└── fsl_dataset/
    ├── KAMUSTA/
    │   ├── video1.mp4
    │   ├── video2.mp4
    │   └── video3.mp4
    ├── SALAMAT/
    │   ├── video1.mp4
    │   └── video2.mp4
    ├── TULONG/
    ├── OO/
    └── HINDI/
```

---

### Step 3: Open Colab Notebook

1. Go to https://colab.research.google.com
2. Upload `ai-training/notebooks/fsl_training.ipynb`
3. Click "Runtime" → "Change runtime type" → Select "GPU" (faster)

---

### Step 4: Run the Notebook (Cell by Cell)

**Cell 1: Install Libraries**
```python
!pip install mediapipe opencv-python scikit-learn numpy
```
This installs the tools we need.

---

**Cell 2: Import Libraries**
```python
import cv2
import numpy as np
import mediapipe as mp
from sklearn.ensemble import RandomForestClassifier
import pickle
```
This loads the tools into memory.

---

**Cell 3: Initialize MediaPipe**
```python
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=False, max_num_hands=2)
```
This sets up MediaPipe to detect hands.

---

**Cell 4: Mount Google Drive**
```python
from google.colab import drive
drive.mount('/content/drive')
```
Click the link, sign in, paste the code. Now Colab can access your videos.

---

**Cell 5: Extract Hand Landmarks (THE MAGIC HAPPENS HERE)**

This is what MediaPipe does:

```
Your Video Frame          MediaPipe Detects Hand       Extracts 21 Points
┌─────────────┐          ┌─────────────┐              [x1, y1, z1,
│             │          │      ●      │               x2, y2, z2,
│    👋      │   →      │     ●●●     │       →       x3, y3, z3,
│             │          │    ● ● ●    │               ... 21 points]
└─────────────┘          │   ●  ●  ●   │              = 63 numbers
                         └─────────────┘
```

Each hand has 21 landmarks (finger tips, knuckles, wrist, etc.)
Each landmark has x, y, z coordinates = 63 numbers total

The code loops through ALL your videos and extracts these 63 numbers from EVERY frame.

```python
data = []  # Will store all the 63-number arrays
labels = []  # Will store which sign each array represents

for sign in ['KAMUSTA', 'SALAMAT', 'TULONG', 'OO', 'HINDI']:
    for video in sign_folder:
        landmarks = extract_landmarks(video)  # Gets 63 numbers per frame
        data.append(landmarks)
        labels.append(sign)  # "This is KAMUSTA"
```

After this runs, you have:
- `data`: Thousands of 63-number arrays
- `labels`: "KAMUSTA", "SALAMAT", etc. for each array

---

**Cell 6: Train the Model**

```python
model = RandomForestClassifier()
model.fit(data, labels)
```

This is where the AI learns:
- "When I see these 63 numbers, it's KAMUSTA"
- "When I see these other 63 numbers, it's SALAMAT"

It finds patterns in the hand positions.

---

**Cell 7: Save the Model**

```python
with open('/content/drive/MyDrive/fsl_model.pkl', 'wb') as f:
    pickle.dump(model, f)
```

Saves the trained model to your Google Drive as `fsl_model.pkl`

---

### Step 5: Download the Model

1. Go to your Google Drive
2. Find `fsl_model.pkl`
3. Download it
4. Put it in `ai-training/trained_models/fsl_model.pkl` in your project

---

### Step 6: How the Backend Uses It

When your app sends a camera frame to the backend:

```
Phone Camera Frame
      ↓
Backend receives it
      ↓
MediaPipe extracts 21 hand points (63 numbers)
      ↓
Load fsl_model.pkl
      ↓
model.predict([63 numbers])
      ↓
Returns: "KAMUSTA"
      ↓
Backend sends back to phone
      ↓
Phone shows "Kamusta!" and speaks it
```

---

## Quick Example

Let's say you do the KAMUSTA sign:

1. **Your hand position**: Waving hand near face
2. **MediaPipe sees**: 
   - Thumb tip at (0.5, 0.3, 0.1)
   - Index finger at (0.6, 0.2, 0.15)
   - ... 19 more points
3. **Converts to**: `[0.5, 0.3, 0.1, 0.6, 0.2, 0.15, ...]` (63 numbers)
4. **Model thinks**: "I've seen this pattern before during training! It's KAMUSTA"
5. **Returns**: "KAMUSTA"
6. **App translates**: "Kamusta!" (Tagalog) or "Hello!" (English)

---

## Why This Works

- **MediaPipe** = Finds hands and extracts positions (no training needed, Google built it)
- **Your videos** = Examples of what each sign looks like
- **Scikit-learn** = Learns to recognize patterns in hand positions
- **The model** = Remembers those patterns and can recognize them later

---

## Repeat for ASL

Do the exact same thing with `asl_training.ipynb` for the 5 ASL signs.

---

## Common Issues

**"No hands detected"**
- Make sure hands are clearly visible in videos
- Good lighting
- Hands not too far from camera

**"Low accuracy"**
- Record more videos per sign (30+ is better)
- Make sure signs are distinct from each other
- Try different backgrounds and angles

**"Model file too big"**
- Random Forest models are usually small (< 1MB)
- If it's huge, reduce `n_estimators` to 50
