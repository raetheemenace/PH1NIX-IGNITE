"""
Test sign recognition with your webcam
Press 'q' to quit
"""
import cv2
import requests
import base64
import time

API_URL = "http://localhost:8000/recognize"

def main():
    print("Starting webcam test...")
    print("Press 'q' to quit\n")
    
    # Open webcam
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("Error: Could not open webcam")
        return
    
    last_prediction = None
    last_time = time.time()
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Mirror the frame
        frame = cv2.flip(frame, 1)
        
        # Process frame every 500ms
        current_time = time.time()
        if current_time - last_time > 0.5:
            last_time = current_time
            
            # Encode frame
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 50])
            img_base64 = base64.b64encode(buffer).decode('utf-8')
            
            try:
                # Send to backend
                response = requests.post(API_URL, json={
                    "frame": img_base64,
                    "sign_language": "ASL",
                    "output_language": "English",
                    "recent_signs": []
                }, timeout=2)
                
                result = response.json()
                
                if result.get('text'):
                    last_prediction = result['text']
                    print(f"Detected: {last_prediction} (Confidence: {result.get('confidence', 0):.2%})")
                    
            except Exception as e:
                print(f"Error: {e}")
        
        # Display prediction on frame
        if last_prediction:
            cv2.putText(frame, last_prediction, (10, 50), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 3)
        
        # Show instructions
        cv2.putText(frame, "Press 'q' to quit", (10, frame.shape[0] - 20),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        cv2.imshow('SignVoice - Webcam Test', frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()
    print("\nTest complete!")

if __name__ == "__main__":
    main()
