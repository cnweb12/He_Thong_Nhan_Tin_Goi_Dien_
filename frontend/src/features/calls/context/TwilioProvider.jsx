import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useAppSocket } from '../../realtime/hooks/useAppSocket';

export const TwilioContext = createContext(null);

const rtcConfig = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export function TwilioProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { socket, isConnected } = useAppSocket();

  const [callState, setCallState] = useState('idle'); // idle | calling | ringing | connected | ended
  const [callInfo, setCallInfo] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  const callStateRef = useRef(callState);
  const callInfoRef = useRef(callInfo);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const audioContextRef = useRef(null);
  const toneIntervalRef = useRef(null);

  callStateRef.current = callState;
  callInfoRef.current = callInfo;

  const stopTone = useCallback(() => {
    if (toneIntervalRef.current) {
      clearInterval(toneIntervalRef.current);
      toneIntervalRef.current = null;
    }
  }, []);

  const playTone = useCallback((type) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      stopTone();

      const playDualTone = (durationMs, volume) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.frequency.value = 440;
        osc2.frequency.value = 480;
        gain.gain.setValueAtTime(volume, ctx.currentTime);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start();

        setTimeout(() => {
          try {
            osc1.stop();
            osc2.stop();
          } catch (err) {
            // Oscillators may already be stopped during fast call transitions.
          }
        }, durationMs);
      };

      if (type === 'dialing') {
        playDualTone(2000, 0.03);
        toneIntervalRef.current = setInterval(() => playDualTone(2000, 0.03), 6000);
      } else if (type === 'ringing') {
        playDualTone(1500, 0.05);
        toneIntervalRef.current = setInterval(() => playDualTone(1500, 0.05), 3000);
      } else if (type === 'hangup') {
        [0, 0.2, 0.4].forEach((delay) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.value = 480;
          gain.gain.setValueAtTime(0.05, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.15);
        });
      }
    } catch (err) {
      console.warn('[WebRTC Call] Tone generation failed:', err);
    }
  }, [stopTone]);

  const cleanupMedia = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    setIsMuted(false);
  }, []);

  const ensureRemoteAudio = useCallback(() => {
    if (!remoteAudioRef.current) {
      const audio = new Audio();
      audio.autoplay = true;
      audio.playsInline = true;
      remoteAudioRef.current = audio;
    }
    return remoteAudioRef.current;
  }, []);

  const handleCallEndedLocally = useCallback(() => {
    stopTone();
    cleanupMedia();
    playTone('hangup');
    setCallState('ended');
    setTimeout(() => {
      setCallState('idle');
      setCallInfo(null);
    }, 1500);
  }, [cleanupMedia, playTone, stopTone]);

  const getLocalAudioStream = useCallback(async () => {
    if (!localStreamRef.current) {
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    }
    return localStreamRef.current;
  }, []);

  const getOrCreatePeerConnection = useCallback(async () => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const pc = new RTCPeerConnection(rtcConfig);
    const localStream = await getLocalAudioStream();

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    pc.onicecandidate = (event) => {
      const currentCall = callInfoRef.current;
      if (!event.candidate || !socket || !currentCall?.callId || !currentCall?.peerId) return;

      socket.emit('call:webrtc-ice', {
        callId: currentCall.callId,
        targetUserId: currentCall.peerId,
        candidate: event.candidate,
      });
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      const audio = ensureRemoteAudio();
      audio.srcObject = remoteStream;
      audio.play().catch((err) => {
        console.warn('[WebRTC Call] Remote audio autoplay blocked:', err);
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        stopTone();
        setCallState('connected');
      }

      if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)
        && callStateRef.current === 'connected') {
        handleCallEndedLocally();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [ensureRemoteAudio, getLocalAudioStream, handleCallEndedLocally, socket, stopTone]);

  const makeCall = useCallback((peerUser, conversationId, type = 'audio') => {
    if (callStateRef.current !== 'idle' || !socket || !isConnected) return;

    const peerId = peerUser?._id || peerUser?.id || peerUser?.userId;
    if (!peerId || !conversationId) {
      console.warn('[Socket Call] Cannot initiate call: missing peerId or conversationId', {
        peerUser,
        conversationId,
      });
      return;
    }

    setCallInfo({
      callId: null,
      peerId,
      peerName: peerUser.displayName || peerUser.name || peerUser.phone || 'Nguoi dung',
      peerAvatar: peerUser.avatarUrl || peerUser.displayAvatarUrl || '',
      isIncoming: false,
      conversationId,
      type,
    });
    setCallState('calling');
    playTone('dialing');

    socket.emit('call:initiate', { calleeId: peerId, conversationId, type }, (res) => {
      if (res?.ok) {
        setCallInfo((prev) => prev ? { ...prev, callId: res.callId } : prev);
      } else {
        console.error('[Socket Call] Failed to initiate call:', res?.error);
        stopTone();
        cleanupMedia();
        setCallState('idle');
        setCallInfo(null);
      }
    });
  }, [cleanupMedia, isConnected, playTone, socket, stopTone]);

  const acceptCall = useCallback(async () => {
    const currentCall = callInfoRef.current;
    if (callStateRef.current !== 'ringing' || !currentCall || !socket) return;

    try {
      stopTone();
      await getOrCreatePeerConnection();
      socket.emit('call:accept', { callId: currentCall.callId }, (res) => {
        if (!res?.ok) {
          console.error('[Socket Call] Failed to accept call:', res?.error);
          cleanupMedia();
          setCallState('idle');
          setCallInfo(null);
        }
      });
    } catch (err) {
      console.error('[WebRTC Call] Cannot access microphone:', err);
      cleanupMedia();
      setCallState('idle');
      setCallInfo(null);
    }
  }, [cleanupMedia, getOrCreatePeerConnection, socket, stopTone]);

  const rejectCall = useCallback(() => {
    const currentCall = callInfoRef.current;
    if (callStateRef.current !== 'ringing' || !currentCall || !socket) return;

    stopTone();
    socket.emit('call:reject', { callId: currentCall.callId });
    cleanupMedia();
    setCallState('idle');
    setCallInfo(null);
  }, [cleanupMedia, socket, stopTone]);

  const cancelCall = useCallback(() => {
    const currentCall = callInfoRef.current;
    if (callStateRef.current !== 'calling' || !currentCall || !socket) return;

    stopTone();
    socket.emit('call:cancel', {
      callId: currentCall.callId,
      calleeId: currentCall.peerId,
    });
    cleanupMedia();
    setCallState('idle');
    setCallInfo(null);
  }, [cleanupMedia, socket, stopTone]);

  const endCall = useCallback((durationSec = 0) => {
    const currentCall = callInfoRef.current;
    if (!['calling', 'ringing', 'connected'].includes(callStateRef.current) || !currentCall || !socket) return;

    socket.emit('call:end', {
      callId: currentCall.callId,
      durationSec,
    });

    handleCallEndedLocally();
  }, [handleCallEndedLocally, socket]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const nextMute = !isMuted;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !nextMute;
    });
    setIsMuted(nextMute);
  }, [isMuted]);

  useEffect(() => {
    if (!socket || !isConnected) return undefined;

    const onIncomingCall = (data) => {
      if (callStateRef.current !== 'idle') {
        socket.emit('call:reject', { callId: data.callId });
        return;
      }

      setCallInfo({
        callId: data.callId,
        peerId: data.callerId,
        peerName: data.callerName || 'Nguoi goi',
        peerAvatar: data.callerAvatar || '',
        isIncoming: true,
        conversationId: data.conversationId,
        type: data.type,
      });
      setCallState('ringing');
      playTone('ringing');
    };

    const onCallAccepted = async (data) => {
      const currentCall = callInfoRef.current;
      if (!currentCall || currentCall.callId !== data.callId) return;

      try {
        stopTone();
        const pc = await getOrCreatePeerConnection();
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('call:webrtc-offer', {
          callId: currentCall.callId,
          targetUserId: data.acceptedBy || currentCall.peerId,
          offer,
        });
      } catch (err) {
        console.error('[WebRTC Call] Failed to create offer:', err);
        handleCallEndedLocally();
      }
    };

    const onWebrtcOffer = async (data) => {
      const currentCall = callInfoRef.current;
      if (!currentCall || currentCall.callId !== data.callId) return;

      try {
        const pc = await getOrCreatePeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('call:webrtc-answer', {
          callId: currentCall.callId,
          targetUserId: data.fromUserId || currentCall.peerId,
          answer,
        });
      } catch (err) {
        console.error('[WebRTC Call] Failed to handle offer:', err);
        handleCallEndedLocally();
      }
    };

    const onWebrtcAnswer = async (data) => {
      const currentCall = callInfoRef.current;
      const pc = peerConnectionRef.current;
      if (!currentCall || currentCall.callId !== data.callId || !pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      } catch (err) {
        console.error('[WebRTC Call] Failed to handle answer:', err);
        handleCallEndedLocally();
      }
    };

    const onWebrtcIce = async (data) => {
      const currentCall = callInfoRef.current;
      const pc = peerConnectionRef.current;
      if (!currentCall || currentCall.callId !== data.callId || !pc || !data.candidate) return;

      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.warn('[WebRTC Call] Failed to add ICE candidate:', err);
      }
    };

    const onCallRejected = () => handleCallEndedLocally();
    const onCallCancelled = () => {
      stopTone();
      cleanupMedia();
      setCallState('idle');
      setCallInfo(null);
    };
    const onCallEnded = () => handleCallEndedLocally();

    socket.on('call:incoming', onIncomingCall);
    socket.on('call:accepted', onCallAccepted);
    socket.on('call:webrtc-offer', onWebrtcOffer);
    socket.on('call:webrtc-answer', onWebrtcAnswer);
    socket.on('call:webrtc-ice', onWebrtcIce);
    socket.on('call:rejected', onCallRejected);
    socket.on('call:cancelled', onCallCancelled);
    socket.on('call:ended', onCallEnded);

    return () => {
      socket.off('call:incoming', onIncomingCall);
      socket.off('call:accepted', onCallAccepted);
      socket.off('call:webrtc-offer', onWebrtcOffer);
      socket.off('call:webrtc-answer', onWebrtcAnswer);
      socket.off('call:webrtc-ice', onWebrtcIce);
      socket.off('call:rejected', onCallRejected);
      socket.off('call:cancelled', onCallCancelled);
      socket.off('call:ended', onCallEnded);
    };
  }, [
    cleanupMedia,
    getOrCreatePeerConnection,
    handleCallEndedLocally,
    isConnected,
    playTone,
    socket,
    stopTone,
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      stopTone();
      cleanupMedia();
      setCallState('idle');
      setCallInfo(null);
    }
  }, [cleanupMedia, isAuthenticated, stopTone]);

  return (
    <TwilioContext.Provider value={{
      callState,
      callInfo,
      isMuted,
      makeCall,
      acceptCall,
      rejectCall,
      cancelCall,
      endCall,
      toggleMute,
    }}>
      {children}
    </TwilioContext.Provider>
  );
}
