# UnMute - Real-Time Sign Language Interpreter

A mobile app that acts as a personal sign language interpreter, enabling seamless two-way communication between deaf and hearing individuals during meetings.

## Project Structure

```
signvoice/
├── mobile/                          # React Native app
│   ├── src/
│   │   ├── screens/
│   │   │   ├── HomeScreen.js       # Language selection screen
│   │   │   └── SessionScreen.js    # Live conversation screen
│   │   ├── components/
│   │   │   ├── SignRecognition.js  # Camera + AI recognition
│   │   │   ├── SpeechOutput.js     # Text-to-speech
│   │   │   ├── SpeechInput.js      # Speech-to-text
│   │   │   └── ConversationThread.js # Chat-like display
│   │   ├── services/
│   │   │   ├── api.js              # Backend API calls
│   │   │   ├── camera.js           # Camera handling
│   │   │   ├── tts.js              # Text-to-speech service
│   │   │   └── stt.js              # Speech-to-text service
│   │   ├── utils/
│   │   │   ├── translations.js     # Sign-to-text lookup table
│   │   │   └── context.js          # Context awareness logic
│   │   └── App.js
│   ├── package.json
│   └── tailwind.config.js
│
├── backend/                         # FastAPI server
│   ├── app/
│   │   ├── main.py                 # FastAPI entry point
│   │   ├── models/
│   │   │   └── sign_model.py       # Load trained AI model
│   │   ├── routes/
│   │   │   └── recognition.py      # Sign recognition endpoint
│   │   ├── services/
│   │   │   ├── inference.py        # AI inference logic
│   │   │   └── context.py          # Context awareness engine
│   │   └── config.py
│   ├── requirements.txt
│   └── .env
│
├── ai-training/                     # Colab notebooks (not hosted locally)
│   ├── notebooks/
│   │   ├── fsl_training.ipynb      # FSL model training
│   │   └── asl_training.ipynb      # ASL model training
│   ├── datasets/
│   │   ├── fsl/                    # FSL sign videos
│   │   └── asl/                    # ASL sign videos
│   └── trained_models/
│       ├── fsl_model.h5            # Trained FSL model
│       └── asl_model.h5            # Trained ASL model
│
├── database/
│   └── supabase_schema.sql         # Minimal schema (if needed)
│
└── docs/
    ├── FEATURES.md                  # Detailed feature specs
    ├── SETUP.md                     # Setup instructions
    └── DEMO.md                      # Demo script for hackathon
```

## Tech Stack

- **Mobile**: React Native + NativeWind
- **Backend**: Python FastAPI
- **Database**: Supabase (minimal use)
- **AI Training**: Google Colab
- **Languages**: FSL + ASL → Tagalog + English

## The 5 Features

1. Real-Time Sign Language to Speech and Text
2. Multi-Language Support (4 combinations)
3. Live Conversation Mode (Two-Way)
4. Meeting Integration (Companion App)
5. Context Awareness Per Word

## Quick Start

### Backend (Python)
1. `cd backend`
2. `python -m venv venv`
3. Activate: `.\venv\Scripts\Activate.ps1` (Win) or `source venv/bin/activate` (Mac/Linux)
4. `pip install -r requirements.txt`
5. `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`

### Mobile (React Native)
1. `cd mobile`
2. `npm install`
3. `npx expo start`

See `docs/SETUP.md` for detailed setup instructions.
