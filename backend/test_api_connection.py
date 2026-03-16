#!/usr/bin/env python3
"""
Test API connection and model serving
"""
import requests
import base64
import json
import time
from PIL import Image, ImageDraw
import io
import numpy as np

API_URL = "http://localhost:8000"

def create_test_image():
    """Create a simple test image with a hand-like shape"""
    # Create a 640x480 image with a simple hand gesture
    img = Image.new('RGB', (640, 480), color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw a simple hand shape (just for testing)
    # Palm
    draw.ellipse([250, 200, 390, 340], fill='peachpuff', outline='black')
    
    # Fingers
    finger_positions = [
        (270, 150, 290, 200),  # Thumb
        (300, 120, 320, 200),  # Index
        (330, 110, 350, 200),  # Middle
        (360, 120, 380, 200),  # Ring
        (390, 140, 410, 200),  # Pinky
    ]
    
    for pos in finger_positions:
        draw.ellipse(pos, fill='peachpuff', outline='black')
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    img_bytes = buffer.getvalue()
    img_base64 = base64.b64encode(img_bytes).decode('utf-8')
    
    return img_base64

def test_api_health():
    """Test if API is running"""
    print("🏥 Testing API Health...")
    print("-" * 30)
    
    try:
        response = requests.get(f"{API_URL}/", timeout=5)
        if response.status_code == 200:
            print("✅ API is running")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ API returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API. Is the backend running?")
        print("   Try running: python -m uvicorn app.main:app --reload")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_recognition_endpoint():
    """Test the recognition endpoint with both ASL and FSL"""
    print("\n🔍 Testing Recognition Endpoint...")
    print("-" * 40)
    
    # Create test image
    test_image = create_test_image()
    
    # Test both languages
    for language in ['ASL', 'FSL']:
        print(f"\n📝 Testing {language} recognition:")
        
        payload = {
            "frame": test_image,
            "sign_language": language,
            "output_language": "English",
            "recent_signs": []
        }
        
        try:
            start_time = time.time()
            response = requests.post(
                f"{API_URL}/recognize",
                json=payload,
                timeout=15,
                headers={'Content-Type': 'application/json'}
            )
            end_time = time.time()
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ Success!")
                print(f"   📊 Sign: {result.get('sign', 'N/A')}")
                print(f"   📊 Confidence: {result.get('confidence', 0):.3f}")
                print(f"   📊 Model Language: {result.get('model_language', 'N/A')}")
                print(f"   ⏱️  Processing Time: {(end_time - start_time):.3f}s")
                
                if 'voice_response' in result:
                    print(f"   🗣️  Voice Response: {result['voice_response']}")
                
            else:
                print(f"   ❌ Error {response.status_code}: {response.text}")
                
        except requests.exceptions.Timeout:
            print(f"   ⏰ Timeout - processing took too long")
        except Exception as e:
            print(f"   ❌ Error: {e}")

def test_enhanced_features():
    """Test enhanced API features if available"""
    print("\n🚀 Testing Enhanced Features...")
    print("-" * 35)
    
    # Test health endpoint
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health endpoint working")
            health_data = response.json()
            print(f"   Status: {health_data}")
        else:
            print("❌ Health endpoint not available")
    except:
        print("❌ Health endpoint not available")
    
    # Test stats endpoint
    try:
        response = requests.get(f"{API_URL}/stats", timeout=5)
        if response.status_code == 200:
            print("✅ Stats endpoint working")
            stats_data = response.json()
            print(f"   Stats: {stats_data}")
        else:
            print("❌ Stats endpoint not available")
    except:
        print("❌ Stats endpoint not available")

def test_performance():
    """Test API performance with multiple requests"""
    print("\n⚡ Testing Performance...")
    print("-" * 25)
    
    test_image = create_test_image()
    payload = {
        "frame": test_image,
        "sign_language": "ASL",
        "output_language": "English",
        "recent_signs": []
    }
    
    times = []
    successes = 0
    
    print("Running 5 test requests...")
    for i in range(5):
        try:
            start_time = time.time()
            response = requests.post(
                f"{API_URL}/recognize",
                json=payload,
                timeout=10
            )
            end_time = time.time()
            
            if response.status_code == 200:
                times.append(end_time - start_time)
                successes += 1
                print(f"   Request {i+1}: ✅ {(end_time - start_time):.3f}s")
            else:
                print(f"   Request {i+1}: ❌ Error {response.status_code}")
                
        except Exception as e:
            print(f"   Request {i+1}: ❌ {e}")
    
    if times:
        avg_time = sum(times) / len(times)
        min_time = min(times)
        max_time = max(times)
        
        print(f"\n📊 Performance Summary:")
        print(f"   Success Rate: {successes}/5 ({successes/5*100:.1f}%)")
        print(f"   Average Time: {avg_time:.3f}s")
        print(f"   Min Time: {min_time:.3f}s")
        print(f"   Max Time: {max_time:.3f}s")
        
        # Check if it meets requirements (< 500ms per requirements)
        if avg_time < 0.5:
            print("   ✅ Meets latency requirements (<500ms)")
        else:
            print("   ⚠️  Exceeds latency requirements (>500ms)")

def main():
    """Run all API tests"""
    print("🧪 Testing API with New Models")
    print("=" * 50)
    
    # Test 1: API Health
    if not test_api_health():
        print("\n❌ API is not running. Please start the backend first:")
        print("   cd backend")
        print("   python -m uvicorn app.main:app --reload")
        return False
    
    # Test 2: Recognition
    test_recognition_endpoint()
    
    # Test 3: Enhanced Features
    test_enhanced_features()
    
    # Test 4: Performance
    test_performance()
    
    print("\n" + "=" * 50)
    print("🎉 API testing complete!")
    print("\nNext steps:")
    print("1. Start the web application: cd web && npm start")
    print("2. Test sign recognition through the web interface")
    print("3. Try both ASL and FSL languages")
    
    return True

if __name__ == "__main__":
    main()