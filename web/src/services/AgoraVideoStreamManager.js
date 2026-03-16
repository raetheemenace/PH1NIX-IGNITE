import AgoraRTC from 'agora-rtc-sdk-ng';

/**
 * AgoraVideoStreamManager - Manages video stream capture and frame extraction using Agora Video SDK
 * Provides continuous frame extraction capabilities for sign language recognition
 */
class AgoraVideoStreamManager {
  constructor() {
    this.client = null;
    this.localVideoTrack = null;
    this.localAudioTrack = null;
    this.isInitialized = false;
    this.frameExtractionInterval = null;
    this.frameCallbacks = [];
    this.canvas = null;
    this.context = null;
    this.videoElement = null;
    this.frameRate = 15; // Default 15 FPS as per requirements
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.processingStats = {
      framesExtracted: 0,
      averageExtractionTime: 0,
      lastExtractionTime: 0
    };
  }

  /**
   * Initialize the video stream with Agora SDK
   * @param {string} appId - Agora App ID
   * @param {string} channelName - Channel name to join
   * @param {string} token - Optional token for authentication
   * @param {string} userId - Optional user ID
   */
  async initializeVideoStream(appId, channelName, token = null, userId = null) {
    try {
      if (this.isInitialized) {
        console.warn('AgoraVideoStreamManager already initialized');
        return;
      }

      // Create Agora client
      this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

      // Create local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks({
        videoConfig: {
          width: 640,
          height: 480,
          frameRate: this.frameRate
        }
      });

      this.localAudioTrack = audioTrack;
      this.localVideoTrack = videoTrack;

      // Join channel
      await this.client.join(appId, channelName, token, userId);
      await this.client.publish([audioTrack, videoTrack]);

      // Set up frame extraction
      this.setupFrameExtraction();

      this.isInitialized = true;
      console.log('AgoraVideoStreamManager initialized successfully');

    } catch (error) {
      console.error('Failed to initialize AgoraVideoStreamManager:', error);
      throw error;
    }
  }

  /**
   * Set up frame extraction from video track
   */
  setupFrameExtraction() {
    if (!this.localVideoTrack) return;

    // Create canvas for frame extraction
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');

    // Create video element for frame capture
    this.videoElement = document.createElement('video');
    this.videoElement.muted = true;
    this.videoElement.playsInline = true;

    // Get media stream from Agora track
    const mediaStreamTrack = this.localVideoTrack.getMediaStreamTrack();
    if (mediaStreamTrack) {
      this.videoElement.srcObject = new MediaStream([mediaStreamTrack]);
      this.videoElement.play().catch(console.error);
    }

    // Start frame extraction interval
    this.startFrameExtraction();
  }

  /**
   * Start continuous frame extraction
   */
  startFrameExtraction() {
    if (this.frameExtractionInterval) return;

    const intervalMs = 1000 / this.frameRate;
    this.frameExtractionInterval = setInterval(() => {
      this.extractAndNotifyFrame();
    }, intervalMs);
  }

  /**
   * Stop frame extraction
   */
  stopFrameExtraction() {
    if (this.frameExtractionInterval) {
      clearInterval(this.frameExtractionInterval);
      this.frameExtractionInterval = null;
    }
  }

  /**
   * Extract frame and notify callbacks
   */
  extractAndNotifyFrame() {
    const startTime = performance.now();
    const frameData = this.extractFrame();
    
    if (frameData) {
      const extractionTime = performance.now() - startTime;
      this.updateProcessingStats(extractionTime);

      // Notify all registered callbacks
      this.frameCallbacks.forEach(callback => {
        try {
          callback(frameData);
        } catch (error) {
          console.error('Error in frame callback:', error);
        }
      });
    }
  }

  /**
   * Extract a single frame from the video stream
   * @returns {string|null} Base64 encoded frame data or null if extraction fails
   */
  extractFrame() {
    try {
      if (!this.videoElement || !this.canvas || !this.context) {
        return null;
      }

      // Check if video is ready
      if (this.videoElement.videoWidth === 0 || this.videoElement.videoHeight === 0) {
        return null;
      }

      // Set canvas dimensions to match video
      this.canvas.width = this.videoElement.videoWidth;
      this.canvas.height = this.videoElement.videoHeight;

      // Draw current video frame to canvas
      this.context.drawImage(this.videoElement, 0, 0);

      // Convert to base64
      const base64Data = this.canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      this.frameCount++;
      return base64Data;

    } catch (error) {
      console.error('Frame extraction error:', error);
      return null;
    }
  }

  /**
   * Register callback for frame ready events
   * @param {Function} callback - Function to call when new frame is available
   */
  onFrameReady(callback) {
    if (typeof callback === 'function') {
      this.frameCallbacks.push(callback);
    }
  }

  /**
   * Remove frame ready callback
   * @param {Function} callback - Callback to remove
   */
  removeFrameCallback(callback) {
    const index = this.frameCallbacks.indexOf(callback);
    if (index > -1) {
      this.frameCallbacks.splice(index, 1);
    }
  }

  /**
   * Set frame rate for extraction
   * @param {number} fps - Frames per second (minimum 15 as per requirements)
   */
  setFrameRate(fps) {
    const newFrameRate = Math.max(15, fps); // Ensure minimum 15 FPS
    if (newFrameRate !== this.frameRate) {
      this.frameRate = newFrameRate;
      
      // Restart frame extraction with new rate
      if (this.frameExtractionInterval) {
        this.stopFrameExtraction();
        this.startFrameExtraction();
      }
    }
  }

  /**
   * Update processing statistics
   * @param {number} extractionTime - Time taken for frame extraction in ms
   */
  updateProcessingStats(extractionTime) {
    this.processingStats.framesExtracted++;
    this.processingStats.lastExtractionTime = extractionTime;
    
    // Calculate rolling average
    const alpha = 0.1; // Smoothing factor
    this.processingStats.averageExtractionTime = 
      this.processingStats.averageExtractionTime * (1 - alpha) + extractionTime * alpha;
  }

  /**
   * Get processing statistics
   * @returns {Object} Processing statistics
   */
  getProcessingStats() {
    return {
      ...this.processingStats,
      frameRate: this.frameRate,
      frameCount: this.frameCount,
      isExtracting: !!this.frameExtractionInterval
    };
  }

  /**
   * Get local video track for UI display
   * @returns {Object|null} Local video track
   */
  getLocalVideoTrack() {
    return this.localVideoTrack;
  }

  /**
   * Check if stream is active
   * @returns {boolean} True if stream is active
   */
  isStreamActive() {
    return this.isInitialized && this.localVideoTrack && !this.localVideoTrack.muted;
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    try {
      // Stop frame extraction
      this.stopFrameExtraction();

      // Clear callbacks
      this.frameCallbacks = [];

      // Clean up video element
      if (this.videoElement) {
        this.videoElement.srcObject = null;
        this.videoElement = null;
      }

      // Clean up canvas
      this.canvas = null;
      this.context = null;

      // Clean up Agora tracks
      if (this.localAudioTrack) {
        this.localAudioTrack.stop();
        this.localAudioTrack.close();
        this.localAudioTrack = null;
      }

      if (this.localVideoTrack) {
        this.localVideoTrack.stop();
        this.localVideoTrack.close();
        this.localVideoTrack = null;
      }

      // Leave channel
      if (this.client && this.client.connectionState !== 'DISCONNECTED') {
        await this.client.leave();
      }

      this.client = null;
      this.isInitialized = false;

      console.log('AgoraVideoStreamManager cleaned up successfully');

    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

export default AgoraVideoStreamManager;