import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import { useAgora, RtcSurfaceView, AGORA_APP_ID } from '../services/agoraService';
import SignRecognition from '../components/SignRecognition';
import SpeechInput from '../components/SpeechInput';
import ConversationThread from '../components/ConversationThread';
import { controlColors } from '../utils/theme';

const logo = require('../logo_UnMute.jpg-.png');

// Agora RTC view helper
function AgoraView({ remoteUid, cameraEnabled, cameraType }) {
  if (AGORA_APP_ID === 'YOUR_AGORA_APP_ID_HERE') {
    return cameraEnabled ? (
      <CameraView style={StyleSheet.absoluteFill} facing={cameraType} />
    ) : (
      <View style={[StyleSheet.absoluteFill, styles.cameraOff]}>
        <Text style={styles.cameraOffText}>Camera Off</Text>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Local Video Preview */}
      <RtcSurfaceView
        canvas={{ uid: 0 }}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Remote Video (Small Overlay) */}
      {remoteUid !== 0 && (
        <View style={styles.remoteView}>
          <RtcSurfaceView
            canvas={{ uid: remoteUid }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}
    </View>
  );
}

// ViewfinderOverlay — four purple corner brackets positioned absolutely
function ViewfinderOverlay() {
  const bracketSize = 24;
  const bracketThickness = 3;
  const bracketColor = '#7c3aed';
  const offset = 12;

  const cornerStyle = {
    position: 'absolute',
    width: bracketSize,
    height: bracketSize,
  };

  return (
    <>
      {/* Top-left */}
      <View style={[cornerStyle, { top: offset, left: offset }]}>
        <View style={{ position: 'absolute', top: 0, left: 0, width: bracketSize, height: bracketThickness, backgroundColor: bracketColor }} />
        <View style={{ position: 'absolute', top: 0, left: 0, width: bracketThickness, height: bracketSize, backgroundColor: bracketColor }} />
      </View>
      {/* Top-right */}
      <View style={[cornerStyle, { top: offset, right: offset }]}>
        <View style={{ position: 'absolute', top: 0, right: 0, width: bracketSize, height: bracketThickness, backgroundColor: bracketColor }} />
        <View style={{ position: 'absolute', top: 0, right: 0, width: bracketThickness, height: bracketSize, backgroundColor: bracketColor }} />
      </View>
      {/* Bottom-left */}
      <View style={[cornerStyle, { bottom: offset, left: offset }]}>
        <View style={{ position: 'absolute', bottom: 0, left: 0, width: bracketSize, height: bracketThickness, backgroundColor: bracketColor }} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, width: bracketThickness, height: bracketSize, backgroundColor: bracketColor }} />
      </View>
      {/* Bottom-right */}
      <View style={[cornerStyle, { bottom: offset, right: offset }]}>
        <View style={{ position: 'absolute', bottom: 0, right: 0, width: bracketSize, height: bracketThickness, backgroundColor: bracketColor }} />
        <View style={{ position: 'absolute', bottom: 0, right: 0, width: bracketThickness, height: bracketSize, backgroundColor: bracketColor }} />
      </View>
    </>
  );
}

// ControlBar — camera, mic, speaker, END buttons
function ControlBar({ cameraEnabled, micEnabled, speakerEnabled, onCameraToggle, onMicToggle, onSpeakerToggle, onEnd }) {
  return (
    <View style={styles.controlBar}>
      <TouchableOpacity
        onPress={onCameraToggle}
        style={[styles.controlButton, { backgroundColor: controlColors.cameraBg }]}
        accessibilityLabel="Toggle camera"
      >
        <Ionicons name={cameraEnabled ? 'camera-outline' : 'camera-off-outline'} size={22} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onMicToggle}
        style={[styles.controlButton, { backgroundColor: controlColors.micBg }]}
        accessibilityLabel="Toggle microphone"
      >
        <Ionicons name={micEnabled ? 'mic-outline' : 'mic-off-outline'} size={22} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onSpeakerToggle}
        style={[styles.controlButton, { backgroundColor: controlColors.speakerBg }]}
        accessibilityLabel="Toggle speaker"
      >
        <Ionicons name={speakerEnabled ? 'volume-high-outline' : 'volume-mute-outline'} size={22} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onEnd}
        style={[styles.endButton, { backgroundColor: controlColors.endBg }]}
        accessibilityLabel="End session"
      >
        <Text style={[styles.endButtonText, { color: controlColors.endText }]}>END</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function SessionScreen({ route, navigation }) {
  const { signLanguage = 'FSL', outputLanguage = 'Tagalog' } = route.params ?? {};

  const [messages, setMessages] = useState([]);
  const [cameraType, setCameraType] = useState('front');
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [aiSpeech, setAiSpeech] = useState({ isSpeaking: false, text: '', emotion: 'casual' });

  // Agora logic
  const { isJoined, remoteUid, toggleCamera, toggleMic, switchCamera } = useAgora();

  const addMessage = (text, type) => {
    setMessages(prev => [...prev, { text, type, timestamp: Date.now() }]);
  };

  const clearMessages = () => setMessages([]);

  const flipCamera = () => {
    setCameraType(prev => (prev === 'front' ? 'back' : 'front'));
    switchCamera();
  };

  const handleCameraToggle = () => {
    const newState = !cameraEnabled;
    setCameraEnabled(newState);
    toggleCamera(newState);
  };

  const handleMicToggle = () => {
    const newState = !micEnabled;
    setMicEnabled(newState);
    toggleMic(newState);
  };

  return (
    <LinearGradient
      colors={['#ffffff', '#f2f1f6']}
      style={styles.container}
    >
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton} accessibilityLabel="Go back">
          <Text style={styles.headerButtonText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Image source={logo} style={styles.logoImage} resizeMode="contain" />
          <Text style={styles.headerTitle}>{signLanguage} → {outputLanguage}</Text>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveLabel}>Live Session</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerButton} accessibilityLabel="Settings">
          <Ionicons name="settings-outline" size={22} color="#0f0d1a" />
        </TouchableOpacity>
      </View>

      {/* Camera Viewfinder */}
      <View style={styles.viewfinderContainer}>
        <AgoraView 
          remoteUid={remoteUid}
          cameraEnabled={cameraEnabled}
          cameraType={cameraType}
        />

        {/* ViewfinderOverlay — four corner brackets */}
        <ViewfinderOverlay />

        {/* Flip button — bottom-right of viewfinder */}
        <TouchableOpacity
          onPress={flipCamera}
          style={styles.flipButton}
          accessibilityLabel="Flip camera"
        >
          <Ionicons name="camera-reverse-outline" size={20} color="#fff" />
        </TouchableOpacity>

        {aiSpeech.isSpeaking && (
          <View style={styles.aiPopup}>
            <View style={styles.aiDot} />
            <Text style={styles.aiLabel}>AI Speaking</Text>
            <Text style={styles.aiText}>"{aiSpeech.text}"</Text>
            <Text style={styles.aiTone}>{aiSpeech.emotion} tone</Text>
          </View>
        )}
      </View>

      {/* Hidden AI components — preserve existing callbacks */}
      <SpeechInput onSpeechRecognized={addMessage} />
      <SignRecognition
        signLanguage={signLanguage}
        outputLanguage={outputLanguage}
        onSignRecognized={addMessage}
        speakerEnabled={speakerEnabled}
        onAiSpeechState={setAiSpeech}
      />

      {/* Conversation Thread */}
      <ConversationThread messages={messages} onClear={clearMessages} />

      {/* Control Bar */}
      <ControlBar
        cameraEnabled={cameraEnabled}
        micEnabled={micEnabled}
        speakerEnabled={speakerEnabled}
        onCameraToggle={handleCameraToggle}
        onMicToggle={handleMicToggle}
        onSpeakerToggle={() => {
          setSpeakerEnabled(prev => !prev);
          setAiSpeech({ isSpeaking: false, text: '', emotion: 'casual' });
        }}
        onEnd={() => navigation.goBack()}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
  },
  headerButton: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: 24,
    color: '#0f0d1a',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  logoImage: {
    width: 110,
    height: 40,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f0d1a',
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00d492',
    marginRight: 5,
  },
  liveLabel: {
    fontSize: 12,
    color: '#00bc7d',
    fontWeight: '600',
  },
  // Viewfinder
  viewfinderContainer: {
    height: 240,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  cameraOff: {
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOffText: {
    color: '#71717a',
    fontSize: 14,
  },
  remoteView: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 100,
    height: 140,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#fff',
  },
  flipButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiPopup: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    maxWidth: 220,
    backgroundColor: 'rgba(124,58,237,0.92)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  aiDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  aiLabel: {
    color: '#ddd6fe',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  aiText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  aiTone: {
    color: '#ddd6fe',
    fontSize: 10,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  // Control Bar
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 28,
    backgroundColor: 'transparent',
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
