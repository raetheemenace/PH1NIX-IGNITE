import React, { useState, useEffect, useRef } from 'react';

const SpeechInput = ({ onSpeechRecognized, inputLanguage = 'en-US' }) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = inputLanguage;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setError(`Error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');

      // If the result is final, pass it up
      if (event.results[event.results.length - 1].isFinal) {
        onSpeechRecognized(transcript, 'speech');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [inputLanguage, onSpeechRecognized]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  if (error) {
    return (
      <div className="text-red-500 text-sm mt-2">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-slate-100">
      <button
        onClick={toggleListening}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-200'
            : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 shadow-lg'
        }`}
      >
        <span className="text-2xl filter drop-shadow-md">
          {isListening ? '⏹️' : '🎙️'}
        </span>
      </button>
      <p className="mt-3 text-sm font-medium text-slate-600">
        {isListening ? 'Listening...' : 'Tap to speak'}
      </p>
      {isListening && (
        <div className="mt-2 flex space-x-1">
          <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      )}
    </div>
  );
};

export default SpeechInput;
