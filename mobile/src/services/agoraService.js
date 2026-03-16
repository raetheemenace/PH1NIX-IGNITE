import { createAgoraRtcEngine, ChannelProfileType, ClientRoleType, RtcSurfaceView, VideoViewSetupMode } from 'react-native-agora';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';

// AGORA CONFIG - Replace with your own App ID
export const AGORA_APP_ID = '21f0337230e848cdae22ed7022aaa600';

export const useAgora = (channelName = 'unmute-session') => {
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(0);
  const engineRef = useRef(null);

  const getPermissions = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]);
    }
  };

  const leaveChannel = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.leaveChannel();
      engineRef.current.release();
      engineRef.current = null;
    }
  }, []);

  const initAgora = useCallback(async () => {
    try {
      await getPermissions();

      engineRef.current = createAgoraRtcEngine();
      const engine = engineRef.current;

      engine.initialize({
        appId: AGORA_APP_ID,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });

      engine.registerEventHandler({
        onJoinChannelSuccess: (connection, elapsed) => {
          console.log('Successfully joined channel:', connection.channelId);
          setIsJoined(true);
        },
        onUserJoined: (connection, uid, elapsed) => {
          console.log('Remote user joined:', uid);
          setRemoteUid(uid);
        },
        onUserOffline: (connection, uid, reason) => {
          console.log('Remote user offline:', uid);
          setRemoteUid(0);
        },
        onLeaveChannel: (connection, stats) => {
          console.log('Left channel');
          setIsJoined(false);
          setRemoteUid(0);
        },
      });

      engine.enableVideo();
      engine.startPreview();

      engine.joinChannel('', channelName, 0, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      });
    } catch (e) {
      console.error('Error initializing Agora:', e);
    }
  }, [channelName]);

  useEffect(() => {
    if (AGORA_APP_ID !== 'YOUR_AGORA_APP_ID_HERE' && AGORA_APP_ID) {
      initAgora();
    }
    return () => leaveChannel();
  }, [initAgora, leaveChannel]);

  const toggleCamera = (enabled) => {
    if (engineRef.current) {
      engineRef.current.enableLocalVideo(enabled);
    }
  };

  const toggleMic = (enabled) => {
    if (engineRef.current) {
      engineRef.current.enableLocalAudio(enabled);
    }
  };

  const switchCamera = () => {
    if (engineRef.current) {
      engineRef.current.switchCamera();
    }
  };

  return {
    isJoined,
    remoteUid,
    toggleCamera,
    toggleMic,
    switchCamera,
    engine: engineRef.current,
  };
};

export { RtcSurfaceView, VideoViewSetupMode };
