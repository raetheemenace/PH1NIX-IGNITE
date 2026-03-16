import React, { useRef, useState, useEffect, useCallback } from 'react';
import { recognizeSign } from '../services/api';

const SimpleCameraCapture = ({ signLanguage, outputLanguage, onSignRecognized }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [lastSign, setLastSign] = useState(null);
  const [cameraStatus, setCameraStatus] = useState('initializing');
  const [aiSpeech, setAiSpeech] = useState({ isSpeaking: false, text: '', emotion: 'casual' });
  const aiSpeechTimeoutRef = useRef(null);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      setCameraStatus('requesting_permission');
      console.log('Requesting camera access...');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser. Please use a modern browser like Chrome, Firefox, or Edge.');
      }

      // Check if we're on HTTPS or localhost
      const isSecureContext = window.isSecureContext || 
                             window.location.protocol === 'https:' || 
                             window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1';
      
      if (!isSecureContext) {
        console.warn('Not in secure context. Camera may not work.');
      }
      
      // Request camera access with specific constraints
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      };

      console.log('Requesting camera with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera stream obtained:', stream.getVideoTracks().length, 'video tracks');
      
      streamRef.current = stream;
      
      if (!videoRef.current) {
        throw new Error('Video element not found');
      }

      // Set up video element
      const video = videoRef.current;
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      
      // Wait for metadata to load
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Video metadata load timeout'));
        }, 10000);

        video.onloadedmetadata = () => {
          clearTimeout(timeout);
          console.log('Video metadata loaded:', {
            width: video.videoWidth,
            height: video.videoHeight,
            readyState: video.readyState
          });
          resolve();
        };

        video.onerror = (e) => {
          clearTimeout(timeout);
          reject(new Error('Video element error: ' + (e.message || 'Unknown error')));
        };
      });

      // Try to play the video
      try {
        await video.play();
        console.log('Video playback started successfully');
      } catch (playErr) {
        console.warn('Video play() failed, but this might be okay:', playErr);
        // For camera feeds, autoplay usually works even if play() fails
      }

      // Verify video is actually playing
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error('Video dimensions are zero. Camera may not be working properly.');
      }

      setHasCamera(true);
      setCameraStatus('active');
      setError(null);
      console.log('Camera initialized successfully');
      
    } catch (err) {
      console.error('Camera initialization error:', err);
      setCameraStatus('error');
      
      let errorMessage = 'Camera access failed: ';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage += 'Permission denied. Please allow camera access in your browser settings and refresh the page.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera found. Please connect a camera and refresh the page.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage += 'Camera is being used by another application. Please close other apps using the camera and refresh.';
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        errorMessage += 'Camera does not support the required settings. Trying with basic settings...';
        // Try again with minimal constraints
        setTimeout(() => initializeCameraBasic(), 1000);
        return;
      } else if (err.name === 'TypeError') {
        errorMessage += 'Browser does not support camera access. Please use Chrome, Firefox, or Edge.';
      } else {
        errorMessage += err.message || 'Unknown error occurred.';
      }
      
      setError(errorMessage);
      setHasCamera(false);
    }
  }, []);

  // Fallback initialization with minimal constraints
  const initializeCameraBasic = useCallback(async () => {
    try {
      console.log('Trying basic camera initialization...');
      setCameraStatus('requesting_permission');
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = resolve;
        });
        
        await videoRef.current.play().catch(() => {});
        
        setHasCamera(true);
        setCameraStatus('active');
        setError(null);
        console.log('Basic camera initialization successful');
      }
    } catch (err) {
      console.error('Basic camera initialization failed:', err);
      setError('Camera initialization failed even with basic settings. Please check your camera and browser permissions.');
      setCameraStatus('error');
      setHasCamera(false);
    }
  }, []);

  // Capture frame from video
  const captureFrame = useCallback(() => {
    if (!canvasRef.current || !videoRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Check if video is ready
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn('Video not ready for capture');
      return null;
    }
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame
    ctx.drawImage(video, 0, 0);
    
    // Convert to base64
    try {
      return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    } catch (err) {
      console.error('Error converting canvas to base64:', err);
      return null;
    }
  }, []);

  // Handle sign recognition
  const handleCapture = useCallback(async (isAuto = false) => {
    if (isProcessing || !hasCamera) return;

    setIsProcessing(true);
    if (!isAuto) setError(null);
    
    try {
      const base64Frame = captureFrame();
      if (!base64Frame) {
        if (!isAuto) {
          setError('Failed to capture frame from camera');
        }
        return;
      }

      console.log('Sending frame for recognition...');
      const result = await recognizeSign(base64Frame, signLanguage, outputLanguage, {
        source: isAuto ? 'auto_capture' : 'manual_capture',
        timestamp: Date.now(),
        platform: 'web'
      });
      
      console.log('Recognition result:', result);
      
      if (result.text && result.text !== lastSign) {
        setLastResult(result);
        setLastSign(result.text);
        onSignRecognized(result.text, 'sign');
        
        // Handle speech synthesis
        await handleSpeechSynthesis(result);
      } else if (!isAuto && !result.text) {
        setLastResult({ text: 'No sign detected', confidence: 0 });
      }
    } catch (err) {
      console.error('Recognition error:', err);
      if (!isAuto) {
        setError(`Recognition failed: ${err.message}`);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, hasCamera, captureFrame, signLanguage, outputLanguage, lastSign, onSignRecognized]);

  // Handle speech synthesis
  const handleSpeechSynthesis = useCallback(async (result) => {
    const textToSpeak = result.voice_response?.text || result.text;
    const emotion = result.voice_response?.emotion || 'casual';
    
    if (result.confidence > 0.7 && 'speechSynthesis' in window && textToSpeak) {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = outputLanguage === 'Tagalog' ? 'tl-PH' : 'en-US';
      
      // Apply emotion-based voice settings
      switch(emotion) {
        case 'warm': 
          utterance.rate = 0.85; 
          utterance.pitch = 1.15; 
          utterance.volume = 0.9; 
          break;
        case 'excited': 
          utterance.rate = 1.2; 
          utterance.pitch = 1.3; 
          utterance.volume = 1.0; 
          break;
        case 'concerned': 
          utterance.rate = 0.75; 
          utterance.pitch = 0.85; 
          utterance.volume = 0.8; 
          break;
        default: 
          utterance.rate = 1.0; 
          utterance.pitch = 1.0; 
          utterance.volume = 0.9;
      }

      utterance.onstart = () => {
        setAiSpeech({ isSpeaking: true, text: textToSpeak, emotion });
      };
      utterance.onend = () => {
        setAiSpeech(prev => ({ ...prev, isSpeaking: false }));
      };
      utterance.onerror = () => {
        setAiSpeech(prev => ({ ...prev, isSpeaking: false }));
      };

      speechSynthesis.speak(utterance);
    }
  }, [outputLanguage]);

  // Auto capture functionality
  const startAutoCapture = useCallback(() => {
    if (intervalRef.current || !hasCamera) return;
    
    console.log('Starting auto capture...');
    intervalRef.current = setInterval(() => {
      handleCapture(true);
    }, 2000); // Capture every 2 seconds
  }, [hasCamera, handleCapture]);

  const stopAutoCapture = useCallback(() => {
    if (intervalRef.current) {
      console.log('Stopping auto capture...');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Initialize camera on mount
  useEffect(() => {
    let mounted = true;
    let initTimer = null;
    
    const initialize = async () => {
      if (!mounted) return;
      
      // Wait for video element to be ready
      if (!videoRef.current) {
        initTimer = setTimeout(() => {
          if (mounted) {
            if (videoRef.current) {
              initializeCamera();
            } else {
              console.error('Video element never mounted');
              setError('Failed to initialize video element. Please refresh the page.');
              setCameraStatus('error');
            }
          }
        }, 100);
        return;
      }
      
      // Video element is ready, initialize camera
      initializeCamera();
    };
    
    initialize();
    
    return () => {
      mounted = false;
      
      if (initTimer) {
        clearTimeout(initTimer);
      }
      
      stopAutoCapture();
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (aiSpeechTimeoutRef.current) {
        clearTimeout(aiSpeechTimeoutRef.current);
      }
      
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Handle auto mode changes
  useEffect(() => {
    if (hasCamera && isAutoMode) {
      startAutoCapture();
    } else {
      stopAutoCapture();
    }
  }, [hasCamera, isAutoMode, startAutoCapture, stopAutoCapture]);

  // Retry camera initialization
  const retryCamera = () => {
    // Clean up existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log('Stopping existing track:', track.label);
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setError(null);
    setCameraStatus('initializing');
    setHasCamera(false);
    
    // Wait a bit before retrying
    setTimeout(() => {
      initializeCamera();
    }, 500);
  };

  // Debug camera info
  const debugCamera = async () => {
    console.log('=== Camera Debug Info ===');
    console.log('Browser:', navigator.userAgent);
    console.log('Protocol:', window.location.protocol);
    console.log('Hostname:', window.location.hostname);
    console.log('Secure Context:', window.isSecureContext);
    console.log('getUserMedia supported:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
    
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      console.log('Video devices found:', videoDevices.length);
      videoDevices.forEach((device, i) => {
        console.log(`  Device ${i + 1}:`, device.label || 'Unknown', device.deviceId);
      });
      
      if (streamRef.current) {
        const tracks = streamRef.current.getVideoTracks();
        console.log('Active video tracks:', tracks.length);
        tracks.forEach((track, i) => {
          console.log(`  Track ${i + 1}:`, {
            label: track.label,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
            settings: track.getSettings()
          });
        });
      }
      
      if (videoRef.current) {
        console.log('Video element:', {
          videoWidth: videoRef.current.videoWidth,
          videoHeight: videoRef.current.videoHeight,
          readyState: videoRef.current.readyState,
          paused: videoRef.current.paused,
          muted: videoRef.current.muted
        });
      }
    } catch (err) {
      console.error('Debug error:', err);
    }
    console.log('=== End Debug Info ===');
    
    alert('Camera debug info logged to console. Press F12 to view.');
  };

  // Toggle auto mode
  const handleAutoModeToggle = () => {
    setIsAutoMode(!isAutoMode);
  };

  return (
    <div className="relative w-full h-full bg-black group overflow-hidden">
      {/* Video Feed - Always render so ref is available */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-50">
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center ring-1 ring-red-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Camera Access Required</h3>
            <p className="text-gray-400 mb-8 text-sm leading-relaxed">{error}</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={retryCamera}
                className="bg-white text-black hover:bg-gray-100 px-6 py-2.5 rounded-lg font-medium transition-all text-sm"
              >
                Retry Camera Access
              </button>
              <button 
                onClick={debugCamera}
                className="bg-gray-700 text-white hover:bg-gray-600 px-6 py-2.5 rounded-lg font-medium transition-all text-sm"
              >
                Debug Info
              </button>
            </div>
            <div className="mt-6 p-4 bg-gray-800 rounded-lg text-left">
              <p className="text-xs text-gray-300 font-semibold mb-2">Troubleshooting Tips:</p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Check browser address bar for camera permission icon</li>
                <li>• Close other apps using the camera (Zoom, Teams, etc.)</li>
                <li>• Try refreshing the page (F5)</li>
                <li>• Make sure you're using HTTPS or localhost</li>
                <li>• Check Windows camera privacy settings</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {!error && (cameraStatus === 'initializing' || cameraStatus === 'requesting_permission') && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-40">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/60 text-sm font-medium tracking-wide uppercase">
              {cameraStatus === 'requesting_permission' ? 'Requesting Camera Permission...' : 'Initializing Camera...'}
            </p>
          </div>
        </div>
      )}

      {/* AI Speech Indicator */}
      {aiSpeech.isSpeaking && (
        <div className="absolute left-4 bottom-24 max-w-xs z-30 pointer-events-none">
          <div className="bg-indigo-500/90 backdrop-blur-md border border-indigo-300/30 rounded-2xl px-4 py-3 shadow-2xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex w-2 h-2 rounded-full bg-white animate-pulse"></span>
              <p className="text-[10px] text-indigo-100 uppercase tracking-wider font-bold">AI Speaking</p>
            </div>
            <p className="text-sm text-white font-semibold leading-snug">"{aiSpeech.text}"</p>
            <p className="text-[10px] text-indigo-100 uppercase tracking-wide mt-1">{aiSpeech.emotion} tone</p>
          </div>
        </div>
      )}

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
        {/* Top Bar */}
        <div className="flex justify-between items-start">
          {/* Left: Language Status */}
          <div className="flex gap-2">
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-white/60 font-medium">Input</span>
              <span className="text-xs font-bold text-white">{signLanguage}</span>
            </div>
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-white/60 font-medium">Output</span>
              <span className="text-xs font-bold text-white">{outputLanguage}</span>
            </div>
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-white/60 font-medium">Status</span>
              <span className="text-xs font-bold text-green-400">{cameraStatus}</span>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex gap-2 pointer-events-auto">
            <button
              onClick={handleAutoModeToggle}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border backdrop-blur-md ${
                isAutoMode 
                  ? 'bg-red-500/80 border-red-500/50 text-white hover:bg-red-600' 
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isAutoMode ? 'bg-white animate-pulse' : 'bg-white/40'}`}></div>
              <span className="tracking-wide">{isAutoMode ? 'LIVE' : 'PAUSED'}</span>
            </button>
          </div>
        </div>

        {/* Bottom: Recognition Result */}
        {lastResult && lastResult.text && lastResult.text !== 'No sign detected' && (
          <div className="w-full flex justify-center pb-8 animate-slide-up">
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-xl w-full text-center shadow-2xl relative overflow-hidden">
              {/* Glow Effect */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 blur-sm"></div>
              
              <p className="text-xs text-indigo-300 font-medium uppercase tracking-widest mb-2">Detected Sign</p>
              <h2 className="text-3xl font-bold text-white tracking-tight mb-3">{lastResult.sign || lastResult.text}</h2>
              
              {lastResult.voice_response && (
                <div className="flex flex-col items-center gap-2 mt-4 pt-4 border-t border-white/10">
                  <p className="text-lg text-white/90 font-medium italic">"{lastResult.voice_response.text}"</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-white/10 text-white/60 uppercase tracking-wide">
                    {lastResult.voice_response.emotion} Tone
                  </span>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-white/60">
                  Confidence: {(lastResult.confidence * 100).toFixed(1)}% | Model: {lastResult.model_language}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manual Trigger (Center) */}
      {!isAutoMode && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button
            onClick={() => handleCapture(false)}
            disabled={!hasCamera || isProcessing}
            className={`pointer-events-auto group relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              !hasCamera || isProcessing
                ? 'bg-gray-800 cursor-not-allowed opacity-50'
                : 'bg-white/10 hover:bg-white/20 backdrop-blur-sm border-2 border-white/50 hover:border-white hover:scale-110'
            }`}
          >
            {isProcessing ? (
               <div className="w-8 h-8 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
            ) : (
               <div className="w-16 h-16 rounded-full bg-white group-hover:scale-90 transition-transform duration-200"></div>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default SimpleCameraCapture;