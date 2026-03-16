import React from 'react';

const ConversationThread = ({ messages }) => {
  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
        <div className="w-16 h-16 mb-4 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
          <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-500">Awaiting conversation</p>
        <p className="text-xs text-slate-400 mt-1">Signs and speech will appear here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.type === 'sign' ? 'justify-end' : 'justify-start'} group`}
        >
          <div className={`flex flex-col max-w-[85%] ${message.type === 'sign' ? 'items-end' : 'items-start'}`}>
            {/* Message Bubble */}
            <div
              className={`px-5 py-3.5 rounded-2xl shadow-sm border text-sm leading-relaxed relative ${
                message.type === 'sign'
                  ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-sm'
                  : 'bg-white text-slate-700 border-gray-100 rounded-tl-sm'
              }`}
            >
              {message.text}
            </div>

            {/* Metadata */}
            <div className={`flex items-center gap-2 mt-1.5 px-1 ${message.type === 'sign' ? 'flex-row-reverse' : 'flex-row'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                message.type === 'sign' 
                  ? 'text-indigo-200' 
                  : 'text-slate-400'
              }`}>
                {message.type === 'sign' ? 'Signer (You)' : 'Hearing Person'}
              </span>
              <span className="w-0.5 h-0.5 bg-slate-300 rounded-full"></span>
              <span className="text-[10px] text-slate-400 font-medium tabular-nums">
                {formatTime(message.timestamp)}
              </span>
              {message.language && (
                <>
                  <span className="w-0.5 h-0.5 bg-slate-300 rounded-full"></span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                    message.type === 'sign' 
                      ? 'border-indigo-100/50 text-indigo-400 bg-indigo-50/50' 
                      : 'border-slate-200 text-slate-400 bg-slate-50'
                  }`}>
                    {message.language}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConversationThread;