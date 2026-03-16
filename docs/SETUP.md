# Setup Instructions

## Prerequisites
- Node.js 18+
- Python 3.10+
- Expo CLI
- Google Colab account (for training)

## Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your config
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Mobile Setup
```bash
cd mobile
npm install
npx expo start
```

## AI Training (Colab)
1. Upload notebooks to Google Colab
2. Record sign videos for dataset
3. Run training notebooks
4. Download trained models to `ai-training/trained_models/`
5. Update backend .env with model paths

## Running the App
1. Start backend: `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
2. Start mobile: `npx expo start`
3. Scan QR code with Expo Go app
4. Grant camera and microphone permissions
5. Select languages and start session

> **Note on Connectivity**: Make sure your computer and mobile phone are on the same Wi-Fi network. If you see a timeout error, double-check that your computer's local IP address matches the one in `mobile/src/services/api.js`.
