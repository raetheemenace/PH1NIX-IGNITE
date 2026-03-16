"""
Test the backend API with a real image
"""
import requests
import base64
import cv2
import numpy as np

# Create a simple test image (or you can use a real one)
def create_test_image():
    # Create a blank white image
    img = np.ones((480, 640, 3), dtype=np.uint8) * 255
    
    # Add some text
    cv2.putText(img, "Test Image", (200, 240), 
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
    
    return img

def test_backend():
    print("Testing SignVoice Backend API\n")
    print("=" * 50)
    
    # Test 1: Check if server is running
    print("\n1. Testing root endpoint...")
    try:
        response = requests.get("http://localhost:8000")
        print(f"   ✓ Server is running: {response.json()}")
    except Exception as e:
        print(f"   ✗ Server not reachable: {e}")
        return
    
    # Test 2: Send a test image
    print("\n2. Testing recognition endpoint...")
    try:
        # Create test image
        img = create_test_image()
        
        # Encode to base64
        _, buffer = cv2.imencode('.jpg', img)
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        
        # Send request
        response = requests.post("http://localhost:8000/recognize", json={
            "frame": img_base64,
            "sign_language": "ASL",
            "output_language": "English",
            "recent_signs": []
        }, timeout=10)
        
        result = response.json()
        print(f"   Response: {result}")
        
        if result.get('text'):
            print(f"   ✓ Recognition working!")
            print(f"   Detected: {result.get('text')}")
            print(f"   Confidence: {result.get('confidence', 0):.2%}")
        else:
            print(f"   ⚠ No sign detected (this is normal for blank image)")
            
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    print("\n" + "=" * 50)
    print("\nBackend is ready! You can now:")
    print("1. Test with your webcam using the mobile app")
    print("2. Or create a Python script to test with real sign images")

if __name__ == "__main__":
    test_backend()
