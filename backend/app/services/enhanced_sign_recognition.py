import time
import threading
import queue
import psutil
from collections import deque, defaultdict
from typing import Dict, List, Optional, Any
import numpy as np
from dataclasses import dataclass, asdict
from app.services.inference import predict_sign, load_models
from app.services.gesture_aggregation import GestureAggregationService
from app.services.silent_frame_handler import SilentFrameHandler, SilentFrameReason

@dataclass
class FrameMetadata:
    """Metadata for video frames from Agora streams"""
    frame_id: str
    timestamp: float
    channel_name: str
    user_id: str
    width: int
    height: int
    quality: int

@dataclass
class ProcessingStats:
    """Statistics for frame processing performance"""
    frames_processed: int = 0
    frames_dropped: int = 0
    average_processing_time: float = 0.0
    current_fps: float = 0.0
    queue_size: int = 0
    cpu_usage: float = 0.0
    memory_usage: float = 0.0
    last_updated: float = 0.0

@dataclass
class RecognitionResult:
    """Enhanced recognition result with metadata"""
    sign: str
    confidence: float
    timestamp: float
    processing_time: float
    model_language: str
    requested_language: str
    frame_id: str
    metadata: FrameMetadata

class EnhancedSignRecognitionService:
    """Enhanced sign recognition service for real-time Agora video processing"""
    
    def __init__(self, max_queue_size: int = 30, target_fps: int = 15):
        self.max_queue_size = max_queue_size
        self.target_fps = target_fps
        self.current_fps = target_fps
        
        # Frame processing queue
        self.frame_queue = queue.Queue(maxsize=max_queue_size)
        
        # Processing statistics
        self.stats = ProcessingStats()
        self.processing_times = deque(maxlen=100)  # Keep last 100 processing times
        
        # Gesture aggregation service
        self.gesture_aggregator = GestureAggregationService(
            confidence_threshold=0.3,
            sequence_timeout=3.0,
            min_gesture_duration=0.2
        )
        
        # Silent frame handler
        self.silent_frame_handler = SilentFrameHandler(
            confidence_threshold=0.3,
            motion_threshold=0.1,
            silent_period_threshold=1.0
        )
        
        # Gesture aggregation storage (legacy - kept for compatibility)
        self.gesture_history = deque(maxlen=10)  # Keep last 10 gestures for aggregation
        self.gesture_confidence_buffer = defaultdict(list)  # Buffer for confidence aggregation
        
        # System monitoring
        self.last_system_check = 0
        self.system_check_interval = 5.0  # Check system resources every 5 seconds
        
        # Processing control
        self.processing_enabled = True
        self.confidence_threshold = 0.3  # Minimum confidence for gesture detection
        
        # Thread safety
        self.stats_lock = threading.Lock()
        
        # Load models on initialization
        load_models()
    
    def process_agora_frame(self, frame_data: str, metadata: Dict[str, Any]) -> Optional[RecognitionResult]:
        """
        Process a single frame from Agora video stream
        
        Args:
            frame_data: Base64 encoded frame data
            metadata: Frame metadata dictionary
            
        Returns:
            RecognitionResult or None if processing fails/skipped
        """
        start_time = time.time()
        
        # Create frame metadata object
        frame_metadata = FrameMetadata(
            frame_id=metadata.get('frame_id', f"frame_{int(start_time * 1000)}"),
            timestamp=metadata.get('timestamp', start_time),
            channel_name=metadata.get('channel_name', 'default'),
            user_id=metadata.get('user_id', 'unknown'),
            width=metadata.get('width', 640),
            height=metadata.get('height', 480),
            quality=metadata.get('quality', 100)
        )
        
        # Check if we should process this frame based on adaptive rate control
        if not self._should_process_frame():
            with self.stats_lock:
                self.stats.frames_dropped += 1
            return None
        
        # Get sign language from metadata or default to ASL
        sign_language = metadata.get('sign_language', 'ASL')
        
        try:
            # Run inference using existing predict_sign function
            prediction_result = predict_sign(frame_data, sign_language)
            
            processing_time = time.time() - start_time
            
            if prediction_result is None:
                # Handle silent frame (no recognizable gestures)
                return self._handle_silent_frame(frame_metadata, processing_time, SilentFrameReason.NO_HANDS_DETECTED)
            
            # Check if confidence is too low
            if prediction_result['confidence'] < self.confidence_threshold:
                return self._handle_silent_frame(frame_metadata, processing_time, SilentFrameReason.LOW_CONFIDENCE, prediction_result['confidence'])
            
            # Create enhanced result
            result = RecognitionResult(
                sign=prediction_result['sign'],
                confidence=prediction_result['confidence'],
                timestamp=start_time,
                processing_time=processing_time,
                model_language=prediction_result['model_language'],
                requested_language=prediction_result['requested_language'],
                frame_id=frame_metadata.frame_id,
                metadata=frame_metadata
            )
            
            # Notify silent frame handler that gesture was detected
            self.silent_frame_handler.handle_gesture_detected(
                start_time, 
                result.sign, 
                result.confidence
            )
            
            # Update processing statistics
            self._update_processing_stats(processing_time)
            
            # Add to gesture aggregation service for advanced processing
            aggregated_result = self.gesture_aggregator.add_recognition_result(
                result.sign, 
                result.confidence, 
                result.timestamp
            )
            
            # Add to legacy gesture history for compatibility
            self._add_to_gesture_history(result)
            
            # If we have an aggregated result, enhance the original result
            if aggregated_result:
                result.confidence = aggregated_result.get('confidence', result.confidence)
                # Add aggregation metadata
                setattr(result, 'aggregation_info', aggregated_result)
            
            return result
            
        except Exception as e:
            print(f"Error processing frame {frame_metadata.frame_id}: {e}")
            with self.stats_lock:
                self.stats.frames_dropped += 1
            return self._handle_silent_frame(frame_metadata, time.time() - start_time, SilentFrameReason.PROCESSING_ERROR)
    
    def _should_process_frame(self) -> bool:
        """Determine if current frame should be processed based on adaptive rate control"""
        current_time = time.time()
        
        # Check system resources periodically
        if current_time - self.last_system_check > self.system_check_interval:
            self._update_system_stats()
            self._adapt_processing_rate()
            self.last_system_check = current_time
        
        # Simple frame skipping based on current FPS setting
        if hasattr(self, '_last_process_time'):
            time_since_last = current_time - self._last_process_time
            min_interval = 1.0 / self.current_fps
            
            if time_since_last < min_interval:
                return False
        
        self._last_process_time = current_time
        return True
    
    def _handle_silent_frame(self, metadata: FrameMetadata, processing_time: float, reason: SilentFrameReason = SilentFrameReason.NO_HANDS_DETECTED, confidence: float = 0.0) -> None:
        """Handle frames with no recognizable gestures using the silent frame handler"""
        # Update stats but don't return a result
        self._update_processing_stats(processing_time)
        
        # Use silent frame handler for sophisticated analysis
        silent_analysis = self.silent_frame_handler.handle_silent_frame(
            frame_id=metadata.frame_id,
            timestamp=metadata.timestamp,
            reason=reason,
            confidence=confidence,
            landmarks=None,  # Could extract landmarks if needed
            metadata={
                'channel_name': metadata.channel_name,
                'user_id': metadata.user_id,
                'width': metadata.width,
                'height': metadata.height,
                'quality': metadata.quality
            }
        )
        
        # Clear gesture confidence buffer if we have too many silent frames
        if len(self.gesture_confidence_buffer) > 0:
            # Decay confidence buffers for silent frames
            for gesture in list(self.gesture_confidence_buffer.keys()):
                if len(self.gesture_confidence_buffer[gesture]) > 5:
                    self.gesture_confidence_buffer[gesture] = self.gesture_confidence_buffer[gesture][-3:]
        
        # Store silent analysis for monitoring but don't return it as a recognition result
        # This maintains compatibility with the existing API
        return None
    
    def _add_to_gesture_history(self, result: RecognitionResult):
        """Add recognition result to gesture history for aggregation"""
        self.gesture_history.append(result)
        
        # Add to confidence buffer for this gesture
        if result.confidence >= self.confidence_threshold:
            self.gesture_confidence_buffer[result.sign].append(result.confidence)
            
            # Keep only recent confidences (last 5)
            if len(self.gesture_confidence_buffer[result.sign]) > 5:
                self.gesture_confidence_buffer[result.sign] = self.gesture_confidence_buffer[result.sign][-5:]
    
    def get_aggregated_gesture(self, window_size: int = 5) -> Optional[Dict[str, Any]]:
        """
        Get aggregated gesture recognition from recent frames
        
        Args:
            window_size: Number of recent frames to consider
            
        Returns:
            Dictionary with aggregated gesture info or None
        """
        if len(self.gesture_history) < 2:
            return None
        
        # Get recent gestures
        recent_gestures = list(self.gesture_history)[-window_size:]
        
        # Count gesture occurrences and aggregate confidences
        gesture_counts = defaultdict(int)
        gesture_confidences = defaultdict(list)
        
        for result in recent_gestures:
            if result.confidence >= self.confidence_threshold:
                gesture_counts[result.sign] += 1
                gesture_confidences[result.sign].append(result.confidence)
        
        if not gesture_counts:
            return None
        
        # Find most frequent gesture
        most_frequent_gesture = max(gesture_counts.items(), key=lambda x: x[1])
        gesture_name = most_frequent_gesture[0]
        occurrence_count = most_frequent_gesture[1]
        
        # Calculate aggregated confidence
        confidences = gesture_confidences[gesture_name]
        avg_confidence = np.mean(confidences)
        max_confidence = np.max(confidences)
        
        # Temporal consistency bonus
        consistency_bonus = min(occurrence_count / window_size, 0.2)
        final_confidence = min(avg_confidence + consistency_bonus, 1.0)
        
        return {
            'gesture': gesture_name,
            'confidence': final_confidence,
            'avg_confidence': avg_confidence,
            'max_confidence': max_confidence,
            'occurrence_count': occurrence_count,
            'window_size': len(recent_gestures),
            'temporal_consistency': occurrence_count / len(recent_gestures)
        }
    
    def _update_processing_stats(self, processing_time: float):
        """Update processing statistics"""
        with self.stats_lock:
            self.stats.frames_processed += 1
            self.processing_times.append(processing_time)
            
            # Calculate average processing time
            if self.processing_times:
                self.stats.average_processing_time = np.mean(self.processing_times)
            
            # Calculate current FPS based on recent processing times
            if len(self.processing_times) >= 10:
                recent_times = list(self.processing_times)[-10:]
                avg_time = np.mean(recent_times)
                self.stats.current_fps = min(1.0 / avg_time if avg_time > 0 else 0, self.target_fps)
            
            self.stats.last_updated = time.time()
    
    def _update_system_stats(self):
        """Update system resource statistics"""
        try:
            with self.stats_lock:
                self.stats.cpu_usage = psutil.cpu_percent(interval=0.1)
                self.stats.memory_usage = psutil.virtual_memory().percent
                self.stats.queue_size = self.frame_queue.qsize() if hasattr(self, 'frame_queue') else 0
        except Exception as e:
            print(f"Error updating system stats: {e}")
    
    def _adapt_processing_rate(self):
        """Adapt processing rate based on system load"""
        with self.stats_lock:
            cpu_usage = self.stats.cpu_usage
            memory_usage = self.stats.memory_usage
            
            # Reduce FPS if system is under high load
            if cpu_usage > 80 or memory_usage > 85:
                self.current_fps = max(self.target_fps * 0.5, 5)  # Reduce to 50% but not below 5 FPS
            elif cpu_usage > 60 or memory_usage > 70:
                self.current_fps = max(self.target_fps * 0.75, 8)  # Reduce to 75% but not below 8 FPS
            else:
                self.current_fps = self.target_fps  # Normal processing rate
    
    def set_processing_rate(self, fps: int):
        """Set target processing rate"""
        self.target_fps = max(1, min(fps, 30))  # Clamp between 1 and 30 FPS
        self.current_fps = self.target_fps
    
    def get_processing_stats(self) -> Dict[str, Any]:
        """Get current processing statistics"""
        with self.stats_lock:
            stats_dict = asdict(self.stats)
            stats_dict['target_fps'] = self.target_fps
            stats_dict['confidence_threshold'] = self.confidence_threshold
            stats_dict['gesture_buffer_size'] = len(self.gesture_history)
            
            # Add gesture aggregation stats
            if hasattr(self, 'gesture_aggregator'):
                stats_dict['aggregation_stats'] = self.gesture_aggregator.get_aggregation_stats()
            
            # Add silent frame stats
            if hasattr(self, 'silent_frame_handler'):
                stats_dict['silent_frame_stats'] = self.silent_frame_handler.get_statistics()
            
            return stats_dict
    
    def get_current_gesture_sequence(self) -> Optional[List[Dict[str, Any]]]:
        """Get current gesture sequence from aggregation service"""
        if hasattr(self, 'gesture_aggregator'):
            return self.gesture_aggregator.get_current_sequence()
        return None
    
    def get_recent_aggregated_gestures(self, count: int = 5) -> List[Dict[str, Any]]:
        """Get recent aggregated gestures"""
        if hasattr(self, 'gesture_aggregator'):
            return self.gesture_aggregator.get_recent_gestures(count)
        return []
    
    def get_gesture_transition_patterns(self, gesture: str) -> Dict[str, Any]:
        """Get transition patterns for a specific gesture"""
        if hasattr(self, 'gesture_aggregator'):
            return self.gesture_aggregator.get_gesture_patterns(gesture)
        return {'gesture': gesture, 'patterns': []}
    
    def get_silent_frame_analysis(self, time_window: float = 30.0) -> Dict[str, Any]:
        """Get analysis of silent frames within a time window"""
        if hasattr(self, 'silent_frame_handler'):
            return self.silent_frame_handler.get_silent_frame_analysis(time_window)
        return {'time_window': time_window, 'silent_frame_count': 0}
    
    def get_silent_frame_statistics(self) -> Dict[str, Any]:
        """Get silent frame handling statistics"""
        if hasattr(self, 'silent_frame_handler'):
            return self.silent_frame_handler.get_statistics()
        return {}
    
    def set_confidence_threshold(self, threshold: float):
        """Set minimum confidence threshold for gesture detection"""
        self.confidence_threshold = max(0.0, min(threshold, 1.0))
        
        # Update thresholds in related services
        if hasattr(self, 'gesture_aggregator'):
            self.gesture_aggregator.confidence_threshold = self.confidence_threshold
        
        if hasattr(self, 'silent_frame_handler'):
            self.silent_frame_handler.set_thresholds(confidence_threshold=self.confidence_threshold)
    
    def reset_stats(self):
        """Reset processing statistics"""
        with self.stats_lock:
            self.stats = ProcessingStats()
            self.processing_times.clear()
            self.gesture_history.clear()
            self.gesture_confidence_buffer.clear()
            
            # Reset gesture aggregation service
            if hasattr(self, 'gesture_aggregator'):
                self.gesture_aggregator.reset()
            
            # Reset silent frame handler
            if hasattr(self, 'silent_frame_handler'):
                self.silent_frame_handler.reset()
    
    def cleanup(self):
        """Cleanup resources"""
        self.processing_enabled = False
        self.reset_stats()