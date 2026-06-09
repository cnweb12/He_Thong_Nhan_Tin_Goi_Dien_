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
    <div 
      className="fixed top-0 left-0 right-0 bottom-0 w-full h-full z-[9999] flex flex-col items-center justify-center p-4 transition-all"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
    >
      {/* Khung Modal Trắng (Giống Zalo) */}
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[320px] p-6 flex flex-col items-center relative overflow-hidden">
        
        {/* Hiệu ứng sóng tỏa ra khi đang đổ chuông */}
        {(callState === 'calling' || callState === 'ringing') && (
          <div className="absolute top-[3.5rem] w-28 h-28 rounded-full animate-ping" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }} />
        )}

        {/* Avatar Area */}
        <div className="relative z-10 w-24 h-24 rounded-full overflow-hidden flex items-center justify-center border-4 border-white shadow-md mt-4 mb-4" style={{ backgroundColor: '#f1f5f9' }}>
          {callInfo?.peerAvatar ? (
            <img
              src={callInfo.peerAvatar}
              alt={callInfo.peerName}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-12 h-12 text-slate-400" />
          )}
        </div>

        {/* Thông tin người dùng & Trạng thái */}
        <h2 className="text-xl font-bold text-slate-800 text-center w-full truncate mb-1">
          {callInfo?.peerName || 'Người dùng'}
        </h2>
        <div className="text-slate-500 text-sm font-medium mb-8 h-6 flex flex-col items-center justify-center">
          {callState === 'connected' ? (
            <span className="text-green-600 font-bold text-lg">{formatTime(duration)}</span>
          ) : (
            <span>{getStatusText()}</span>
          )}
        </div>

        {/* Các nút điều khiển */}
        <div className="flex items-center justify-center gap-6 w-full mb-2">
          
          {/* Giao diện cuộc gọi đến */}
          {callState === 'ringing' && (
            <>
              <button
                onClick={rejectCall}
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg text-white active:scale-95 transition-transform cursor-pointer"
                style={{ backgroundColor: '#ef4444', boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.39)' }}
                title="Từ chối"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              <button
                onClick={acceptCall}
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg text-white active:scale-95 transition-transform animate-bounce cursor-pointer"
                style={{ backgroundColor: '#22c55e', boxShadow: '0 4px 14px 0 rgba(34, 197, 94, 0.39)' }}
                title="Trả lời"
              >
                <Phone className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Giao diện đang gọi đi */}
          {callState === 'calling' && (
            <button
              onClick={cancelCall}
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg text-white active:scale-95 transition-transform cursor-pointer"
              style={{ backgroundColor: '#ef4444', boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.39)' }}
              title="Hủy cuộc gọi"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
          )}

          {/* Giao diện đang trò chuyện (kết nối thành công) */}
          {callState === 'connected' && (
            <>
              <button
                onClick={toggleMute}
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-colors cursor-pointer"
                style={{ 
                  backgroundColor: isMuted ? '#eab308' : '#f1f5f9', 
                  color: isMuted ? 'white' : '#334155',
                  boxShadow: isMuted ? '0 4px 14px 0 rgba(234, 179, 8, 0.39)' : '' 
                }}
                title={isMuted ? 'Bật micro' : 'Tắt tiếng'}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              <button
                onClick={() => endCall(duration)}
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg text-white active:scale-95 transition-transform cursor-pointer"
                style={{ backgroundColor: '#ef4444', boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.39)' }}
                title="Kết thúc"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
            </>
          )}

          {/* Trạng thái kết thúc */}
          {callState === 'ended' && (
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e2e8f0', color: '#94a3b8' }}>
              <PhoneOff className="w-7 h-7" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
