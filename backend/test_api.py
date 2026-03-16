"""
Quick test script for the backend API
Run this after starting the backend with: uvicorn app.main:app --reload
"""
import requests
import base64
import cv2

# Test with a simple image
def test_recognition():
    # Create a test image (or use a real one)
    # For now, just test if the endpoint is reachable
    
    url = "http://localhost:8000"
    
    # Test root endpoint
    print("Testing root endpoint...")
    response = requests.get(url)
    print(f"✓ Root: {response.json()}")
    
    # Test recognition endpoint with dummy data
    print("\nTesting recognition endpoint...")
    try:
        # Create a simple test frame (black image)
        test_frame = cv2.imencode('.jpg', cv2.imread('test.jpg') if False else (255 * np.ones((480, 640, 3), dtype=np.uint8)))[1]
        test_base64 = base64.b64encode(test_frame).decode('utf-8')
        
        response = requests.post(f"{url}/recognize", json={
            "frame": test_base64,
            "sign_language": "ASL",
            "output_language": "English",
            "recent_signs": []
        })
        
        print(f"✓ Recognition: {response.json()}")
    except Exception as e:
        print(f"✗ Recognition test failed: {e}")

if __name__ == "__main__":
    import numpy as np
    test_recognition()
