import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Speech from 'expo-speech';
import { recognizeSign } from '../services/api';

export default function SignRecognition({ signLanguage, outputLanguage, onSignRecognized, speakerEnabled = true, onAiSpeechState }) {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSign, setLastSign] = useState(null);

  useEffect(() => {
    if (!speakerEnabled) {
      Speech.stop();
      onAiSpeechState?.({ isSpeaking: false, text: '', emotion: 'casual' });
    }
  }, [speakerEnabled, onAiSpeechState]);

  useEffect(() => {
    return () => {
      Speech.stop();
      onAiSpeechState?.({ isSpeaking: false, text: '', emotion: 'casual' });
    };
  }, [onAiSpeechState]);

  const captureAndRecognize = async () => {
    if (!cameraRef.current || isProcessing) return;
    
    setIsProcessing(true);
    try {
      // Capture photo
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5,
      });

      if (!photo || !photo.base64) {
        setIsProcessing(false);
        return;
      }

      // Send to backend
      const result = await recognizeSign(photo.base64, signLanguage, outputLanguage);
      
      if (result.text) {
        setLastSign(result.text);
        onSignRecognized(result.text, 'sign');

        const textToSpeak = result.voice_response?.text || result.text;
        const emotion = result.voice_response?.emotion || 'casual';

        if (speakerEnabled) {
          Speech.stop();
          Speech.speak(textToSpeak, {
            language: outputLanguage === 'Tagalog' ? 'tl-PH' : 'en-US',
            onStart: () => onAiSpeechState?.({ isSpeaking: true, text: textToSpeak, emotion }),
            onDone: () => onAiSpeechState?.({ isSpeaking: false, text: textToSpeak, emotion }),
            onStopped: () => onAiSpeechState?.({ isSpeaking: false, text: textToSpeak, emotion }),
            onError: () => onAiSpeechState?.({ isSpeaking: false, text: textToSpeak, emotion }),
          });
        } else {
          onAiSpeechState?.({ isSpeaking: false, text: textToSpeak, emotion });
        }
      } else {
        setLastSign('No sign detected');
      }
    } catch (error) {
      console.error('Recognition error:', error.message);
      setLastSign('Error: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No camera access</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef} 
        style={styles.camera} 
        facing="front"
      />
      
      {/* Capture Button */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]} 
          onPress={captureAndRecognize}
          disabled={isProcessing}
        >
          <Text style={styles.captureButtonText}>
            {isProcessing ? 'Processing...' : 'Capture Sign'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Result Overlay */}
      {lastSign && (
        <View style={styles.overlay}>
          <Text style={styles.signText}>{lastSign}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  text: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  controls: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  captureButtonDisabled: {
    backgroundColor: '#666',
  },
  captureButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    marginHorizontal: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  overlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 15,
    borderRadius: 10,
  },
  signText: {
    color: 'white',
    fontSize: 24,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
