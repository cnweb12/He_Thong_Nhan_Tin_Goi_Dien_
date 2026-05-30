import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, User } from 'lucide-react';
import { useCall } from '../hooks/useCall';

export default function CallOverlay() {
  const { callState, callInfo, isMuted, acceptCall, rejectCall, cancelCall, endCall, toggleMute } = useCall();
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let timer;
    if (callState === 'connected') {
      setDuration(0);
      timer = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState]);

  if (callState === 'idle') return null;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getStatusText = () => {
    switch (callState) {
      case 'calling':
        return 'Đang kết nối...';
      case 'ringing':
        return 'Cuộc gọi đến...';
      case 'connected':
        return 'Đang trò chuyện';
      case 'ended':
        return 'Cuộc gọi đã kết thúc';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-slate-950/80 backdrop-blur-xl text-white p-8">
      {/* Top Banner / Status */}
      <div className="flex flex-col items-center mt-12 space-y-2 text-center animate-fade-in">
        <span className="text-sm font-medium tracking-widest text-slate-400 uppercase">
          {getStatusText()}
        </span>
        {callState === 'connected' && (
          <span className="text-2xl font-mono font-semibold text-emerald-400">
            {formatTime(duration)}
          </span>
        )}
      </div>

      {/* Center Avatar & Pulsing Effect */}
      <div className="relative flex items-center justify-center my-auto">
        {/* Pulsing Outer Rings */}
        {(callState === 'calling' || callState === 'ringing') && (
          <>
            <div className="absolute w-44 h-44 rounded-full border border-white/10 animate-ping opacity-75" />
            <div className="absolute w-56 h-56 rounded-full border border-white/5 animate-ping [animation-delay:0.5s] opacity-50" />
            <div className="absolute w-64 h-64 rounded-full border border-white/5 animate-ping [animation-delay:1s] opacity-25" />
          </>
        )}

        {/* Inner Avatar Container */}
        <div className="relative z-10 w-36 h-36 rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_50px_rgba(99,102,241,0.3)]">
          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
            {callInfo?.peerAvatar ? (
              <img
                src={callInfo.peerAvatar}
                alt={callInfo.peerName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-16 h-16 text-slate-400" />
            )}
          </div>
        </div>
      </div>

      {/* Bottom User Profile & Actions */}
      <div className="w-full max-w-sm flex flex-col items-center space-y-8 mb-12">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold tracking-wide">{callInfo?.peerName || 'Người dùng'}</h2>
          <p className="text-sm text-slate-400">Cuộc gọi thoại qua mạng</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-8 w-full animate-slide-up">
          {/* Ringing (Incoming Call): Accept & Reject */}
          {callState === 'ringing' && (
            <>
              <button
                onClick={rejectCall}
                className="group flex items-center justify-center w-16 h-16 rounded-full bg-rose-500 hover:bg-rose-600 transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg shadow-rose-500/30 cursor-pointer"
                title="Từ chối"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </button>

              <button
                onClick={acceptCall}
                className="group flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg shadow-emerald-500/30 animate-bounce cursor-pointer"
                title="Trả lời"
              >
                <Phone className="w-7 h-7 text-white" />
              </button>
            </>
          )}

          {/* Calling (Outgoing Dialing): Cancel */}
          {callState === 'calling' && (
            <button
              onClick={cancelCall}
              className="group flex items-center justify-center w-16 h-16 rounded-full bg-rose-500 hover:bg-rose-600 transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg shadow-rose-500/30 cursor-pointer"
              title="Hủy cuộc gọi"
            >
              <PhoneOff className="w-7 h-7 text-white" />
            </button>
          )}

          {/* Connected (Ongoing Call): Mute & End */}
          {callState === 'connected' && (
            <>
              <button
                onClick={toggleMute}
                className={`group flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 border cursor-pointer ${
                  isMuted
                    ? 'bg-amber-500 hover:bg-amber-600 border-amber-500 shadow-lg shadow-amber-500/20'
                    : 'bg-white/10 hover:bg-white/20 border-white/10'
                }`}
                title={isMuted ? 'Bật micro' : 'Tắt tiếng'}
              >
                {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
              </button>

              <button
                onClick={() => endCall(duration)}
                className="group flex items-center justify-center w-16 h-16 rounded-full bg-rose-500 hover:bg-rose-600 transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg shadow-rose-500/30 cursor-pointer"
                title="Kết thúc"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </button>
            </>
          )}

          {/* Ended State (Displaying Finished Call): Disabled controls */}
          {callState === 'ended' && (
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 opacity-50 cursor-not-allowed">
              <PhoneOff className="w-7 h-7 text-slate-400" />
            </div>
          )}
        </div>
      </div>

      {/* Standard Animation Keyframes inserted dynamically to wow user */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-up {
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
