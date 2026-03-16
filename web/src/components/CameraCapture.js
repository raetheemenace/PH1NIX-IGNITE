import React, { useRef, useState, useEffect, useCallback } from 'react';
import { recognizeSign } from '../services/api';
import { useAgora, AGORA_APP_ID } from '../services/agoraService';

const LocalPlayer = React.memo(({ localVideoTrack, startCamera, stopCamera }) => {
  const videoRef = useRef(null);
  const isAgora = AGORA_APP_ID !== 'YOUR_AGORA_APP_ID_HERE' && !!AGORA_APP_ID;

  useEffect(() => {
    if (!isAgora) {
      startCamera(videoRef);
    } else if (localVideoTrack && videoRef.current) {
      localVideoTrack.play(videoRef.current);
    }

    return () => {
      if (!isAgora) stopCamera(videoRef);
    };
  }, [localVideoTrack, isAgora, startCamera, stopCamera]);

  return (
    <div className="w-full h-full object-cover opacity-90">
      {isAgora ? (
        <div ref={videoRef} className="w-full h-full" />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
});

const RemotePlayer = React.memo(({ user }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && user.videoTrack) {
      user.videoTrack.play(containerRef.current);
      return () => {
        user.videoTrack.stop();
      };
    }
  }, [user.videoTrack]);

  return (
    <div className="w-32 h-24 bg-gray-900 rounded-lg overflow-hidden border border-white/20 relative">
      <div ref={containerRef} className="w-full h-full"></div>
      <span className="absolute bottom-1 left-1 text-[8px] text-white bg-black/40 px-1 rounded">Remote User</span>
    </div>
  );
});

const CameraCapture = ({ signLanguage, outputLanguage, onSignRecognized }) => {
  const localPlayerContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const captureVideoRef = useRef(null);
  const intervalRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [lastSign, setLastSign] = useState(null);
  const [aiSpeech, setAiSpeech] = useState({ isSpeaking: false, text: '', emotion: 'casual' });

  // Agora logic
  const { localVideoTrack, remoteUsers } = useAgora();

  useEffect(() => {
    const videoEl = captureVideoRef.current;
    if (!videoEl) return;

    if (localVideoTrack && typeof localVideoTrack.getMediaStreamTrack === 'function') {
      const mediaTrack = localVideoTrack.getMediaStreamTrack();
      if (mediaTrack) {
        videoEl.srcObject = new MediaStream([mediaTrack]);
        videoEl.muted = true;
        videoEl.playsInline = true;
        videoEl.play().catch(() => {});
        return;
      }
    }

    videoEl.srcObject = null;
  }, [localVideoTrack]);

  const stopCamera = useCallback((videoRef) => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  }, []);

  const stopAutoCapture = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const captureFrame = useCallback(() => {
    if (!canvasRef.current) return null;

    const video = captureVideoRef.current?.videoWidth
      ? captureVideoRef.current
      : localPlayerContainerRef.current?.querySelector?.('video');
    if (!video || !video.videoWidth) return null;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
  }, []);

  const isProcessingRef = useRef(false);

  const handleCapture = useCallback(async (isAuto = false) => {
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsProcessing(true);
    if (!isAuto) setError(null);
    
    try {
      const base64Frame = captureFrame();
      if (!base64Frame) {
        if (isAuto) return;
        throw new Error('Failed to capture frame');
      }

      const result = await recognizeSign(base64Frame, signLanguage, outputLanguage);
      
      if (result.text && result.text !== lastSign) {
        setLastResult(result);
        setLastSign(result.text);
        onSignRecognized(result.text, 'sign');
        
        // Use AI-generated voice response
        const textToSpeak = result.voice_response?.text || result.text;
        const emotion = result.voice_response?.emotion || 'casual';
        
        if (result.confidence > 0.7 && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.lang = outputLanguage === 'Tagalog' ? 'tl-PH' : 'en-US';
          
          switch(emotion) {
            case 'warm': utterance.rate = 0.85; utterance.pitch = 1.15; utterance.volume = 0.9; break;
            case 'excited': utterance.rate = 1.2; utterance.pitch = 1.3; utterance.volume = 1.0; break;
            case 'concerned': utterance.rate = 0.75; utterance.pitch = 0.85; utterance.volume = 0.8; break;
            default: utterance.rate = 1.0; utterance.pitch = 1.0; utterance.volume = 0.9;
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
      } else if (!isAuto && !result.text) {
        setLastResult({ text: 'No sign detected', confidence: 0 });
      }
    } catch (err) {
      console.error('Recognition error:', err);
      if (!isAuto) setError(err.message);
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [lastSign, signLanguage, outputLanguage, onSignRecognized, captureFrame]);

  const startAutoCapture = useCallback(() => {
    if (intervalRef.current) return;
    
    intervalRef.current = setInterval(() => {
      handleCapture(true);
    }, 1500);
  }, [handleCapture]);

  const startCamera = useCallback(async (videoRef) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasCamera(true);
        setError(null);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Camera access denied. Please allow camera permissions.');
      setHasCamera(false);
    }
  }, []);

  useEffect(() => {
    if (localVideoTrack) {
      setHasCamera(true);
    }
  }, [localVideoTrack]);

  useEffect(() => {
    return () => {
      stopAutoCapture();
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    };
  }, [stopAutoCapture]);

  useEffect(() => {
    if (hasCamera && isAutoMode) {
      startAutoCapture();
    } else {
      stopAutoCapture();
    }
  }, [hasCamera, isAutoMode, startAutoCapture, stopAutoCapture]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 rounded-2xl">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center ring-1 ring-red-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">Camera Access Required</h3>
          <p className="text-gray-400 mb-8 text-sm leading-relaxed">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-white text-black hover:bg-gray-100 px-6 py-2.5 rounded-lg font-medium transition-all text-sm"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const handleAutoModeToggle = () => {
    const newState = !isAutoMode;
    setIsAutoMode(newState);
  };

  return (
    <div className="relative w-full h-full bg-black group overflow-hidden">
      {/* Video Feed */}
      <div id="local-player" ref={localPlayerContainerRef} className="w-full h-full">
        <LocalPlayer 
          localVideoTrack={localVideoTrack} 
          startCamera={startCamera} 
          stopCamera={stopCamera} 
        />
      </div>

      {/* Remote Users (Overlay Grid) */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {remoteUsers.map(user => (
          <RemotePlayer key={user.uid} user={user} />
        ))}
      </div>

      <canvas ref={canvasRef} className="hidden" />
      <video ref={captureVideoRef} muted playsInline className="hidden" />

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
      
      {!hasCamera && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/60 text-sm font-medium tracking-wide uppercase">Initializing Camera System...</p>
          </div>
        </div>
      )}

      {/* Modern Overlay UI */}
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

export default CameraCapture;
