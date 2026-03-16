#!/usr/bin/env python3
"""
Start the UnMute backend server with the new improved models.
"""

import uvicorn
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("🚀 Starting UnMute Backend Server with Improved Models...")
    print("=" * 60)
    
    # Import and load models first
    from app.services.inference import load_models
    print("📦 Loading improved models...")
    load_models()
    print("✅ Models loaded successfully!")
    
    print("🌐 Starting server on http://localhost:8000")
    print("📱 Web app will be available once you start the web server")
    print("=" * 60)
    
    # Start the server
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )