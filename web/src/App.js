import React, { useState, useEffect, useRef, useCallback } from 'react';
import CameraCapture from './components/CameraCapture';
import ConversationThread from './components/ConversationThread';

function App() {
  const [messages, setMessages] = useState([]);
  const [signLanguage, setSignLanguage] = useState('ASL');
  const [outputLanguage, setOutputLanguage] = useState('English');
  const [autoResetTimer, setAutoResetTimer] = useState(30); // seconds
  const [timeUntilReset, setTimeUntilReset] = useState(null);
  const resetTimeoutRef = useRef(null);
  const countdownRef = useRef(null);

  const resetConversation = useCallback(() => {
    setMessages([]);
    setTimeUntilReset(null);
    clearTimeout(resetTimeoutRef.current);
    clearInterval(countdownRef.current);
  }, []);

  const resetAutoResetTimer = useCallback(() => {
    // Clear existing timers
    clearTimeout(resetTimeoutRef.current);
    clearInterval(countdownRef.current);
    setTimeUntilReset(null);

    if (autoResetTimer > 0) {
      // Start countdown
      setTimeUntilReset(autoResetTimer);
      
      // Update countdown every second
      countdownRef.current = setInterval(() => {
        setTimeUntilReset(prev => {
          if (prev <= 1) {
            resetConversation();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [autoResetTimer, resetConversation]);

  const addMessage = useCallback((text, type) => {
    const newMessage = {
      id: Date.now(),
      text,
      type, // 'sign' or 'speech'
      timestamp: new Date(),
      language: type === 'sign' ? signLanguage : outputLanguage
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Reset the auto-reset timer when new message is added
    resetAutoResetTimer();
  }, [signLanguage, outputLanguage, resetAutoResetTimer]);

  // Start auto-reset timer when component mounts
  useEffect(() => {
    if (messages.length > 0) {
      resetAutoResetTimer();
    }
    
    return () => {
      clearTimeout(resetTimeoutRef.current);
      clearInterval(countdownRef.current);
    };
  }, [autoResetTimer]);

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Professional Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">U</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-slate-900 leading-none tracking-tight">UnMute</h1>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Enterprise Edition</span>
              </div>
            </div>
            
            {/* Center Controls - Pill Design */}
            <div className="hidden md:flex items-center bg-gray-100/80 rounded-full p-1 border border-gray-200">
              <div className="flex items-center px-3 py-1 border-r border-gray-300/50">
                <span className="text-xs font-semibold text-gray-500 mr-2 uppercase tracking-wide">Input</span>
                <select 
                  value={signLanguage}
                  onChange={(e) => setSignLanguage(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer hover:text-indigo-600 transition-colors"
                >
                  <option value="ASL">ASL</option>
                  <option value="FSL">FSL</option>
                </select>
              </div>
              
              <div className="px-2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </div>

              <div className="flex items-center px-3 py-1">
                <span className="text-xs font-semibold text-gray-500 mr-2 uppercase tracking-wide">Output</span>
                <select 
                  value={outputLanguage}
                  onChange={(e) => setOutputLanguage(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer hover:text-indigo-600 transition-colors"
                >
                  <option value="English">English</option>
                  <option value="Tagalog">Tagalog</option>
                </select>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Auto-Reset</span>
                <select 
                  value={autoResetTimer}
                  onChange={(e) => setAutoResetTimer(Number(e.target.value))}
                  className="bg-white border border-gray-200 rounded-md text-xs py-1.5 pl-2 pr-6 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors"
                >
                  <option value={0}>Off</option>
                  <option value={15}>15s</option>
                  <option value={30}>30s</option>
                  <option value={60}>1m</option>
                </select>
              </div>

              <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

              <button
                onClick={resetConversation}
                className="group flex items-center gap-2 text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-md hover:bg-red-50 transition-all text-sm font-medium"
                title="Clear History"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Auto Reset Notification Bar */}
          {timeUntilReset && (
            <div className="absolute top-full left-0 w-full bg-indigo-50 border-b border-indigo-100 py-1.5 text-center animate-slide-down shadow-sm z-40">
              <p className="text-xs font-medium text-indigo-900 flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                <span>Session will auto-reset in <span className="font-bold tabular-nums">{timeUntilReset}s</span></span>
                <button
                  onClick={() => setTimeUntilReset(null)}
                  className="text-indigo-600 hover:text-indigo-800 underline ml-2 hover:no-underline transition-all"
                >
                  Cancel
                </button>
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          
          {/* Left Panel: Camera & Live Feed (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-4 h-full">
            <div className="bg-white rounded-2xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.1)] overflow-hidden border border-gray-100 flex flex-col h-full relative group">
              {/* Camera Header Overlay */}
              <div className="absolute top-0 left-0 w-full z-10 p-4 bg-gradient-to-b from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                    <span className="text-white text-xs font-semibold tracking-wide shadow-black drop-shadow-md">LIVE FEED</span>
                  </div>
                </div>
              </div>

              {/* Main Camera Component */}
              <div className="flex-1 bg-black relative">
                <CameraCapture 
                  signLanguage={signLanguage}
                  outputLanguage={outputLanguage}
                  onSignRecognized={addMessage}
                />
              </div>
            </div>
          </div>

          {/* Right Panel: Conversation Transcript (4 cols) */}
          <div className="lg:col-span-4 h-full flex flex-col">
            <div className="bg-white rounded-2xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col h-full overflow-hidden">
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-white flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Transcript</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time interpretation</p>
                </div>
                <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </div>
              </div>
              
              {/* Chat Content */}
              <div className="flex-1 overflow-hidden relative bg-gray-50/30">
                <ConversationThread messages={messages} />
              </div>

              {/* Chat Footer/Status */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-400 font-medium">
                  Conversation is processed locally and secure
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;