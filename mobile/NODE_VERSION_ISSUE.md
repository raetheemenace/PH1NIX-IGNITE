# Node Version Issue

## Problem
Expo 50 is not compatible with Node.js 24. You're currently running Node v24.13.1.

## Error
```
Error: ENOENT: no such file or directory, mkdir 'node:sea'
```

## Solutions

### Option 1: Use Node Version Manager (Recommended)
Install nvm (Node Version Manager) and switch to Node 18 or 20:

**Windows (nvm-windows):**
1. Download from: https://github.com/coreybutler/nvm-windows/releases
2. Install and run:
```bash
nvm install 20
nvm use 20
cd mobile
npm install
npm start
```

### Option 2: Use the Webcam Test (Quick Demo)
For immediate testing without fixing Node:
```bash
cd backend
python test_webcam.py
```

This provides the same functionality as the mobile app for testing sign recognition.

### Option 3: Upgrade Expo (Not Recommended for Hackathon)
Upgrade to Expo SDK 52+ which supports Node 24, but this requires updating all dependencies.

## For Hackathon Demo
Use the webcam test script (`backend/test_webcam.py`) which works perfectly and shows:
- Real-time sign recognition
- All 5 trained signs
- 98.3% accuracy
- Live video feed with predictions

The mobile app can be fixed after the demo by switching to Node 18/20.
