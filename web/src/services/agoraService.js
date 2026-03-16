import AgoraRTC from 'agora-rtc-sdk-ng';
import { useState, useEffect, useCallback } from 'react';

// AGORA CONFIG - Replace with your own App ID
export const AGORA_APP_ID = '21f0337230e848cdae22ed7022aaa600';

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

export const useAgora = (channelName = 'unmute-session') => {
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isJoined, setIsJoined] = useState(false);

  const joinChannel = useCallback(async () => {
    if (AGORA_APP_ID === 'YOUR_AGORA_APP_ID_HERE' || !AGORA_APP_ID || isJoined) return;

    try {
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);

      await client.join(AGORA_APP_ID, channelName, null, null);
      await client.publish([audioTrack, videoTrack]);

      setIsJoined(true);

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'video') {
          setRemoteUsers(prev => {
            if (prev.find(u => u.uid === user.uid)) return prev;
            return [...prev, user];
          });
        }
        if (mediaType === 'audio') {
          user.audioTrack.play();
        }
      });

      client.on('user-unpublished', (user) => {
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      });
    } catch (e) {
      console.error('Error joining Agora channel:', e);
    }
  }, [channelName, isJoined]);

  useEffect(() => {
    joinChannel();
    return () => {
      // Use the actual state values at cleanup time
      const cleanup = async () => {
        if (client.connectionState === 'DISCONNECTED') return;
        
        await client.leave();
        setIsJoined(false);
        setRemoteUsers([]);
        
        // We can't directly access state in cleanup safely without a ref
        // but for Agora tracks, we should close them if they exist
      };
      cleanup();
    };
  }, [joinChannel]);

  // Handle track cleanup separately to avoid dependency cycles
  useEffect(() => {
    return () => {
      localAudioTrack?.stop();
      localAudioTrack?.close();
      localVideoTrack?.stop();
      localVideoTrack?.close();
    };
  }, [localAudioTrack, localVideoTrack]);

  const toggleCamera = async (enabled) => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(enabled);
    }
  };

  const toggleMic = async (enabled) => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(enabled);
    }
  };

  return {
    localVideoTrack,
    remoteUsers,
    isJoined,
    toggleCamera,
    toggleMic,
  };
};
