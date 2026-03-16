# SignVoice Integration Guide

## Quick Start for Hackathon Demo

### 1. Start the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0
```

The backend will:
- Load your improved model (98.3% accuracy)
- Start on http://0.0.0.0:8000
- Be accessible from your phone on the same network

### 2. Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.100)

**Mac/Linux:**
```bash
ifconfig
```
Look for "inet" under your network interface (e.g., 192.168.1.100)

### 3. Update Mobile App

Edit `mobile/src/services/api.js`:
```javascript
const API_URL = 'http://YOUR_IP_ADDRESS:8000';  // e.g., http://192.168.1.100:8000
```

### 4. Start the Mobile App

```bash
cd mobile
npm install
npm start
```

Then:
- Scan QR code with Expo Go app on your phone
- Make sure your phone is on the same WiFi network as your computer

### 5. Test the Integration

1. Open the app on your phone
2. Select ASL and English
3. Start a session
4. The camera will capture frames every 500ms
5. Signs will be recognized and displayed on screen
6. Text-to-speech will speak the recognized sign

## How It Works

```
Mobile App (Camera)
    ↓ captures frame every 500ms
    ↓ converts to base64
    ↓
Backend API (/recognize)
    ↓ decodes base64 to image
    ↓ extracts hand landmarks (MediaPipe)
    ↓ applies feature engineering (106 features)
    ↓ normalizes with StandardScaler
    ↓ predicts with ensemble model
    ↓
Mobile App (Display)
    ↓ shows recognized sign
    ↓ speaks text (TTS)
```

## Troubleshooting

### Backend won't start
- Check if model file exists: `ai-training/trained_models/asl_model_improved.pkl`
- Install dependencies: `pip install -r requirements.txt`

### Mobile app can't connect
- Make sure phone and computer are on same WiFi
- Check firewall isn't blocking port 8000
- Verify IP address in `api.js` is correct

### No signs detected
- Check lighting - hands need to be clearly visible
- Try moving hands closer to camera
- Check backend logs for errors

### Low accuracy
- Ensure you're doing the signs correctly
- Check if the sign is one of the 5 trained signs:
  - How Are You
  - Thank You
  - Help
  - Yes
  - No

## Performance Tips

- Frame processing happens every 500ms (2 FPS)
- Adjust interval in `SignRecognition.js` if needed
- Lower quality images = faster processing
- Current quality: 0.5 (50%)

## Demo Tips

1. Start with simple signs (Yes, No)
2. Do signs slowly and clearly
3. Keep hands in frame
4. Good lighting is essential
5. Practice transitions between signs
