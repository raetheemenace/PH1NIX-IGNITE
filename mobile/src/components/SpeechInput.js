import React, { useEffect } from 'react';
import { Audio } from 'expo-av';

export default function SpeechInput({ onSpeechRecognized }) {
  useEffect(() => {
    // Start listening to microphone
    // Convert speech to text
    // Call onSpeechRecognized with text
  }, []);

  return null; // Background service
}
