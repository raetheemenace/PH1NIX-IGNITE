# Start SignVoice Demo - Quick Commands

## Terminal 1: Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0
```

Wait for: `✓ Loaded model with signs: ['HOW_ARE_YOU', 'THANK_YOU', 'HELP', 'YES', 'NO']`

## Terminal 2: Mobile App
```bash
cd mobile
npm install
npm start
```

## Before Running Mobile App:

1. Find your IP address:
   - Windows: `ipconfig` → look for IPv4 Address
   - Mac/Linux: `ifconfig` → look for inet

2. Update `mobile/src/services/api.js`:
   ```javascript
   const API_URL = 'http://YOUR_IP:8000';  // Replace YOUR_IP
   ```

3. Make sure phone and computer are on same WiFi

## Testing Without Mobile:

Test backend is working:
```bash
curl http://localhost:8000
```

Should return: `{"message":"SignVoice API is running"}`

## What You Should See:

Backend console:
```
✓ Loaded model with signs: ['HOW_ARE_YOU', 'THANK_YOU', 'HELP', 'YES', 'NO']
✓ Feature engineering: enabled
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Mobile app:
- Camera view (front-facing)
- Recognized signs appear at bottom
- Text-to-speech speaks the sign

## The 5 Signs You Can Use:
1. How Are You (2 hands)
2. Thank You (1 hand)
3. Help (2 hands)
4. Yes (1 hand - nodding fist)
5. No (1 hand - side to side)

## Quick Troubleshooting:

**"No module named 'app'"**
→ Make sure you're in the `backend` directory

**"Model file not found"**
→ Check `ai-training/trained_models/asl_model_improved.pkl` exists

**"Connection refused" on mobile**
→ Update IP address in `api.js`
→ Check firewall settings

**"No hands detected"**
→ Better lighting
→ Hands closer to camera
→ Do signs more slowly
