import time
import numpy as np
from collections import deque
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum

class SilentFrameReason(Enum):
    """Reasons why a frame might be considered silent"""
    LOW_CONFIDENCE = "low_confidence"
    NO_HANDS_DETECTED = "no_hands_detected"
    PROCESSING_ERROR = "processing_error"
    MOTION_TOO_FAST = "motion_too_fast"
    HANDS_OUT_OF_FRAME = "hands_out_of_frame"
    POOR_LIGHTING = "poor_lighting"
    GESTURE_TRANSITION = "gesture_transition"

@dataclass
class SilentFrameInfo:
    """Information about a silent frame"""
    frame_id: str
    timestamp: float
    reason: SilentFrameReason
    confidence: float
    metadata: Dict[str, Any]
    processing_time: float

@dataclass
class SilentPeriod:
    """Information about a period of silent frames"""
    start_time: float
    end_time: float
    duration: float
    frame_count: int
    dominant_reason: SilentFrameReason
    reasons_breakdown: Dict[SilentFrameReason, int]

class SilentFrameHandler:
    """Handles detection and management of silent frames (frames with no recognizable gestures)"""
    
    def __init__(self, 
                 confidence_threshold: float = 0.3,
                 motion_threshold: float = 0.1,
                 silent_period_threshold: float = 1.0,
                 max_silent_history: int = 100):
        
        self.confidence_threshold = confidence_threshold
        self.motion_threshold = motion_threshold
        self.silent_period_threshold = silent_period_threshold
        self.max_silent_history = max_silent_history
        
        # Silent frame tracking
        self.silent_frames = deque(maxlen=max_silent_history)
        self.current_silent_period = None
        self.silent_periods = deque(maxlen=50)
        
        # Motion detection for transition detection
        self.previous_landmarks = None
        self.motion_history = deque(maxlen=10)
        
        # Statistics
        self.stats = {
            'total_silent_frames': 0,
            'silent_periods_detected': 0,
            'reasons_count': {reason: 0 for reason in SilentFrameReason},
            'average_silent_period_duration': 0.0,
            'longest_silent_period': 0.0
        }
        
        # Monitoring state
        self.last_gesture_time = None
        self.monitoring_active = True
    
    def handle_silent_frame(self, 
                          frame_id: str, 
                          timestamp: float, 
                          reason: SilentFrameReason,
                          confidence: float = 0.0,
                          landmarks: Optional[List[float]] = None,
                          metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Handle a silent frame and update tracking
        
        Args:
            frame_id: Unique frame identifier
            timestamp: Frame timestamp
            reason: Reason why frame is silent
            confidence: Recognition confidence (if any)
            landmarks: Hand landmarks (if detected)
            metadata: Additional frame metadata
            
        Returns:
            Dictionary with silent frame analysis
        """
        processing_start = time.time()
        
        # Create silent frame info
        silent_info = SilentFrameInfo(
            frame_id=frame_id,
            timestamp=timestamp,
            reason=reason,
            confidence=confidence,
            metadata=metadata or {},
            processing_time=0.0  # Will be updated
        )
        
        # Analyze motion if landmarks are available
        motion_analysis = self._analyze_motion(landmarks, timestamp)
        if motion_analysis and motion_analysis['excessive_motion']:
            silent_info.reason = SilentFrameReason.MOTION_TOO_FAST
        
        # Update statistics
        self.stats['total_silent_frames'] += 1
        self.stats['reasons_count'][silent_info.reason] += 1
        
        # Add to silent frame history
        self.silent_frames.append(silent_info)
        
        # Update silent period tracking
        self._update_silent_period_tracking(silent_info)
        
        # Calculate processing time
        silent_info.processing_time = time.time() - processing_start
        
        # Create response
        response = {
            'frame_id': frame_id,
            'timestamp': timestamp,
            'is_silent': True,
            'reason': reason.value,
            'confidence': confidence,
            'motion_analysis': motion_analysis,
            'current_silent_duration': self._get_current_silent_duration(timestamp),
            'monitoring_recommendations': self._get_monitoring_recommendations(silent_info)
        }
        
        return response
    
    def handle_gesture_detected(self, timestamp: float, gesture: str, confidence: float):
        """
        Handle when a gesture is detected (end of silent period)
        
        Args:
            timestamp: Detection timestamp
            gesture: Detected gesture
            confidence: Detection confidence
        """
        self.last_gesture_time = timestamp
        
        # Finalize current silent period if active
        if self.current_silent_period:
            self._finalize_silent_period(timestamp)
    
    def _analyze_motion(self, landmarks: Optional[List[float]], timestamp: float) -> Optional[Dict[str, Any]]:
        """Analyze motion between frames to detect transitions or excessive movement"""
        if not landmarks or not self.previous_landmarks:
            self.previous_landmarks = landmarks
            return None
        
        try:
            # Calculate motion between frames
            current_landmarks = np.array(landmarks).reshape(-1, 3)
            prev_landmarks = np.array(self.previous_landmarks).reshape(-1, 3)
            
            # Calculate displacement
            displacement = np.linalg.norm(current_landmarks - prev_landmarks, axis=1)
            avg_displacement = np.mean(displacement)
            max_displacement = np.max(displacement)
            
            # Add to motion history
            self.motion_history.append(avg_displacement)
            
            # Analyze motion patterns
            excessive_motion = avg_displacement > self.motion_threshold
            rapid_change = max_displacement > (self.motion_threshold * 2)
            
            # Calculate motion trend
            motion_trend = 0.0
            if len(self.motion_history) >= 3:
                recent_motion = list(self.motion_history)[-3:]
                motion_trend = (recent_motion[-1] - recent_motion[0]) / len(recent_motion)
            
            self.previous_landmarks = landmarks
            
            return {
                'avg_displacement': float(avg_displacement),
                'max_displacement': float(max_displacement),
                'excessive_motion': excessive_motion,
                'rapid_change': rapid_change,
                'motion_trend': float(motion_trend),
                'motion_history_size': len(self.motion_history)
            }
            
        except Exception as e:
            print(f"Error analyzing motion: {e}")
            self.previous_landmarks = landmarks
            return None
    
    def _update_silent_period_tracking(self, silent_info: SilentFrameInfo):
        """Update tracking of silent periods"""
        current_time = silent_info.timestamp
        
        # Start new silent period if needed
        if not self.current_silent_period:
            self.current_silent_period = {
                'start_time': current_time,
                'frame_count': 1,
                'reasons': {silent_info.reason: 1},
                'frames': [silent_info]
            }
        else:
            # Continue current silent period
            self.current_silent_period['frame_count'] += 1
            
            # Update reason counts
            if silent_info.reason in self.current_silent_period['reasons']:
                self.current_silent_period['reasons'][silent_info.reason] += 1
            else:
                self.current_silent_period['reasons'][silent_info.reason] = 1
            
            # Add frame to period
            self.current_silent_period['frames'].append(silent_info)
    
    def _finalize_silent_period(self, end_time: float):
        """Finalize the current silent period"""
        if not self.current_silent_period:
            return
        
        start_time = self.current_silent_period['start_time']
        duration = end_time - start_time
        
        # Only record periods that meet minimum duration
        if duration >= self.silent_period_threshold:
            # Find dominant reason
            reasons = self.current_silent_period['reasons']
            dominant_reason = max(reasons.items(), key=lambda x: x[1])[0]
            
            # Create silent period record
            period = SilentPeriod(
                start_time=start_time,
                end_time=end_time,
                duration=duration,
                frame_count=self.current_silent_period['frame_count'],
                dominant_reason=dominant_reason,
                reasons_breakdown=dict(reasons)
            )
            
            self.silent_periods.append(period)
            self.stats['silent_periods_detected'] += 1
            
            # Update statistics
            self._update_period_statistics(period)
        
        # Reset current period
        self.current_silent_period = None
    
    def _update_period_statistics(self, period: SilentPeriod):
        """Update statistics with new silent period"""
        # Update average duration
        total_periods = len(self.silent_periods)
        if total_periods > 0:
            total_duration = sum(p.duration for p in self.silent_periods)
            self.stats['average_silent_period_duration'] = total_duration / total_periods
        
        # Update longest period
        if period.duration > self.stats['longest_silent_period']:
            self.stats['longest_silent_period'] = period.duration
    
    def _get_current_silent_duration(self, current_time: float) -> float:
        """Get duration of current silent period"""
        if not self.current_silent_period:
            return 0.0
        
        return current_time - self.current_silent_period['start_time']
    
    def _get_monitoring_recommendations(self, silent_info: SilentFrameInfo) -> List[str]:
        """Get recommendations for improving gesture detection"""
        recommendations = []
        
        reason = silent_info.reason
        
        if reason == SilentFrameReason.LOW_CONFIDENCE:
            recommendations.append("Ensure hands are clearly visible and well-lit")
            recommendations.append("Hold gestures steady for better recognition")
        
        elif reason == SilentFrameReason.NO_HANDS_DETECTED:
            recommendations.append("Position hands within camera frame")
            recommendations.append("Ensure adequate lighting on hands")
        
        elif reason == SilentFrameReason.MOTION_TOO_FAST:
            recommendations.append("Slow down gesture movements")
            recommendations.append("Hold gestures briefly before transitioning")
        
        elif reason == SilentFrameReason.HANDS_OUT_OF_FRAME:
            recommendations.append("Keep hands within camera view")
            recommendations.append("Adjust camera position or distance")
        
        elif reason == SilentFrameReason.POOR_LIGHTING:
            recommendations.append("Improve lighting conditions")
            recommendations.append("Avoid backlighting or shadows on hands")
        
        elif reason == SilentFrameReason.GESTURE_TRANSITION:
            recommendations.append("This is normal during gesture transitions")
        
        # Add general recommendations based on recent patterns
        if len(self.silent_frames) >= 5:
            recent_reasons = [f.reason for f in list(self.silent_frames)[-5:]]
            if recent_reasons.count(SilentFrameReason.LOW_CONFIDENCE) >= 3:
                recommendations.append("Consider adjusting confidence threshold")
        
        return recommendations
    
    def get_silent_frame_analysis(self, time_window: float = 30.0) -> Dict[str, Any]:
        """
        Get analysis of silent frames within a time window
        
        Args:
            time_window: Time window in seconds to analyze
            
        Returns:
            Dictionary with silent frame analysis
        """
        current_time = time.time()
        cutoff_time = current_time - time_window
        
        # Filter recent silent frames
        recent_frames = [f for f in self.silent_frames if f.timestamp >= cutoff_time]
        
        if not recent_frames:
            return {
                'time_window': time_window,
                'silent_frame_count': 0,
                'silent_ratio': 0.0,
                'dominant_reasons': [],
                'recommendations': []
            }
        
        # Analyze reasons
        reason_counts = {}
        for frame in recent_frames:
            reason = frame.reason
            reason_counts[reason] = reason_counts.get(reason, 0) + 1
        
        # Sort reasons by frequency
        dominant_reasons = sorted(reason_counts.items(), key=lambda x: x[1], reverse=True)
        
        # Calculate silent ratio (assuming some target FPS)
        expected_frames = time_window * 15  # Assuming 15 FPS
        silent_ratio = len(recent_frames) / expected_frames if expected_frames > 0 else 0
        
        # Generate recommendations
        recommendations = self._generate_analysis_recommendations(dominant_reasons, silent_ratio)
        
        return {
            'time_window': time_window,
            'silent_frame_count': len(recent_frames),
            'silent_ratio': silent_ratio,
            'dominant_reasons': [(reason.value, count) for reason, count in dominant_reasons],
            'reason_breakdown': {reason.value: count for reason, count in reason_counts.items()},
            'recommendations': recommendations,
            'current_silent_period_duration': self._get_current_silent_duration(current_time)
        }
    
    def _generate_analysis_recommendations(self, dominant_reasons: List[Tuple], silent_ratio: float) -> List[str]:
        """Generate recommendations based on silent frame analysis"""
        recommendations = []
        
        if silent_ratio > 0.8:
            recommendations.append("Very high silent frame ratio - check camera setup and lighting")
        elif silent_ratio > 0.5:
            recommendations.append("High silent frame ratio - consider adjusting gesture technique")
        
        if dominant_reasons:
            top_reason = dominant_reasons[0][0]
            
            if top_reason == SilentFrameReason.LOW_CONFIDENCE:
                recommendations.append("Primary issue: Low confidence - improve gesture clarity")
            elif top_reason == SilentFrameReason.NO_HANDS_DETECTED:
                recommendations.append("Primary issue: Hand detection - check camera positioning")
            elif top_reason == SilentFrameReason.MOTION_TOO_FAST:
                recommendations.append("Primary issue: Fast motion - slow down gestures")
        
        return recommendations
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get silent frame handling statistics"""
        stats = self.stats.copy()
        
        # Add current state info
        stats['current_silent_period_active'] = self.current_silent_period is not None
        stats['silent_frames_in_buffer'] = len(self.silent_frames)
        stats['silent_periods_recorded'] = len(self.silent_periods)
        
        # Convert enum keys to strings for JSON serialization
        stats['reasons_count'] = {reason.value: count for reason, count in stats['reasons_count'].items()}
        
        return stats
    
    def reset(self):
        """Reset all silent frame tracking"""
        self.silent_frames.clear()
        self.current_silent_period = None
        self.silent_periods.clear()
        self.previous_landmarks = None
        self.motion_history.clear()
        self.last_gesture_time = None
        
        # Reset statistics
        self.stats = {
            'total_silent_frames': 0,
            'silent_periods_detected': 0,
            'reasons_count': {reason: 0 for reason in SilentFrameReason},
            'average_silent_period_duration': 0.0,
            'longest_silent_period': 0.0
        }
    
    def set_thresholds(self, 
                      confidence_threshold: Optional[float] = None,
                      motion_threshold: Optional[float] = None,
                      silent_period_threshold: Optional[float] = None):
        """Update detection thresholds"""
        if confidence_threshold is not None:
            self.confidence_threshold = max(0.0, min(confidence_threshold, 1.0))
        
        if motion_threshold is not None:
            self.motion_threshold = max(0.0, motion_threshold)
        
        if silent_period_threshold is not None:
            self.silent_period_threshold = max(0.0, silent_period_threshold)