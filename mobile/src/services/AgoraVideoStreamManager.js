import { createAgoraRtcEngine, ChannelProfileType, ClientRoleType } from 'react-native-agora';
import { Platform, PermissionsAndroid } from 'react-native';

/**
 * AgoraVideoStreamManager for mobile
 * Manages video stream capture and frame extraction using Agora Video SDK
 */
export class AgoraVideoStreamManager {
  constructor() {
    this.engine = null;
    this.isInitialized = false;
    this.isJoined = false;
    this.frameCallbacks = [];
    this.channelName = null;
    this.frameExtractionInterval = null;
    this.frameRate = 15; // Default 15 FPS as per requirements
  }

  /**
   * Initialize the Agora Video SDK
   * @param {string} appId - Agora App ID
   * @param {string} channelName - Channel name to join
   * @returns {Promise<void>}
   */
  async initializeVideoStream(appId, channelName) {
    if (this.isInitialized) {
      console.warn('AgoraVideoStreamManager already initialized');
      return;
    }

    try {
      await this.getPermissions();
      
      this.engine = createAgoraRtcEngine();
      this.channelName = channelName;

      // Initialize engine
      this.engine.initialize({
        appId: appId,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });

      // Register event handlers
      this.engine.registerEventHandler({
        onJoinChannelSuccess: (connection, elapsed) => {
          console.log('Successfully joined channel:', connection.channelId);
          this.isJoined = true;
          this.startFrameExtraction();
        },
        onLeaveChannel: (connection, stats) => {
          console.log('Left channel');
          this.isJoined = false;
          this.stopFrameExtraction();
        },
        onError: (err, msg) => {
          console.error('Agora engine error:', err, msg);
        },
      });

      // Enable video and start preview
      this.engine.enableVideo();
      this.engine.startPreview();

      // Join channel as broadcaster
      await this.engine.joinChannel('', channelName, 0, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      });

      this.isInitialized = true;
      console.log('AgoraVideoStreamManager initialized successfully');
    } catch (error) {
      console.error('Error initializing AgoraVideoStreamManager:', error);
      throw error;
    }
  }

  /**
   * Request necessary permissions for camera and microphone
   * @returns {Promise<void>}
   */
  async getPermissions() {
    if (Platform.OS === 'android') {
      const permissions = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]);
      
      const cameraGranted = permissions[PermissionsAndroid.PERMISSIONS.CAMERA] === 'granted';
      const audioGranted = permissions[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === 'granted';
      
      if (!cameraGranted || !audioGranted) {
        throw new Error('Camera and microphone permissions are required');
      }
    }
  }

  /**
   * Extract a frame from the current video stream
   * @returns {Promise<string>} Base64 encoded frame data
   */
  async extractFrame() {
    if (!this.engine || !this.isJoined) {
      throw new Error('Video stream not initialized or not joined to channel');
    }

    try {
      // Note: react-native-agora doesn't have direct frame extraction
      // This is a placeholder for the actual implementation
      // In a real implementation, you would use takeSnapshot or similar method
      const frameData = await this.engine.takeSnapshot(this.channelName, 0, '');
      return frameData;
    } catch (error) {
      console.error('Error extracting frame:', error);
      throw error;
    }
  }

  /**
   * Register a callback for when new frames are ready
   * @param {Function} callback - Callback function to handle new frames
   */
  onFrameReady(callback) {
    if (typeof callback === 'function') {
      this.frameCallbacks.push(callback);
    }
  }

  /**
   * Remove a frame callback
   * @param {Function} callback - Callback function to remove
   */
  removeFrameCallback(callback) {
    this.frameCallbacks = this.frameCallbacks.filter(cb => cb !== callback);
  }

  /**
   * Start continuous frame extraction at specified frame rate
   */
  startFrameExtraction() {
    if (this.frameExtractionInterval) {
      return; // Already running
    }

    const intervalMs = 1000 / this.frameRate;
    this.frameExtractionInterval = setInterval(async () => {
      try {
        const frameData = await this.extractFrame();
        // Notify all registered callbacks
        this.frameCallbacks.forEach(callback => {
          try {
            callback(frameData);
          } catch (error) {
            console.error('Error in frame callback:', error);
          }
        });
      } catch (error) {
        // Silently handle frame extraction errors to avoid spam
        // console.error('Frame extraction error:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop continuous frame extraction
   */
  stopFrameExtraction() {
    if (this.frameExtractionInterval) {
      clearInterval(this.frameExtractionInterval);
      this.frameExtractionInterval = null;
    }
  }

  /**
   * Set the frame extraction rate
   * @param {number} fps - Frames per second (minimum 15 as per requirements)
   */
  setFrameRate(fps) {
    if (fps < 15) {
      console.warn('Frame rate below minimum requirement of 15 FPS, setting to 15');
      fps = 15;
    }
    
    this.frameRate = fps;
    
    // Restart frame extraction with new rate if currently running
    if (this.frameExtractionInterval) {
      this.stopFrameExtraction();
      this.startFrameExtraction();
    }
  }

  /**
   * Toggle camera on/off
   * @param {boolean} enabled - Whether to enable camera
   */
  toggleCamera(enabled) {
    if (this.engine) {
      this.engine.enableLocalVideo(enabled);
    }
  }

  /**
   * Switch between front and back camera
   */
  switchCamera() {
    if (this.engine) {
      this.engine.switchCamera();
    }
  }

  /**
   * Get current stream status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isJoined: this.isJoined,
      channelName: this.channelName,
      frameRate: this.frameRate,
      hasFrameCallbacks: this.frameCallbacks.length > 0,
    };
  }

  /**
   * Clean up resources and leave channel
   * @returns {Promise<void>}
   */
  async cleanup() {
    try {
      this.stopFrameExtraction();
      this.frameCallbacks = [];
      
      if (this.engine) {
        if (this.isJoined) {
          await this.engine.leaveChannel();
        }
        this.engine.release();
        this.engine = null;
      }
      
      this.isInitialized = false;
      this.isJoined = false;
      this.channelName = null;
      
      console.log('AgoraVideoStreamManager cleaned up successfully');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

export default AgoraVideoStreamManager;