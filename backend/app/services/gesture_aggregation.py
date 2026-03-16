import time
import numpy as np
from collections import deque, defaultdict
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum

class GestureState(Enum):
    """States for gesture sequence tracking"""
    IDLE = "idle"
    DETECTING = "detecting"
    CONFIRMED = "confirmed"
    TRANSITIONING = "transitioning"

@dataclass
class GestureSequence:
    """Represents a sequence of gestures forming a meaningful sign"""
    gestures: List[str]
    confidences: List[float]
    timestamps: List[float]
    duration: float
    overall_confidence: float
    state: GestureState

@dataclass
class GestureTransition:
    """Represents a transition between gestures"""
    from_gesture: str
    to_gesture: str
    transition_time: float
    confidence_drop: float

class GestureAggregationService:
    """Advanced gesture aggregation with sequence tracking and temporal consistency"""
    
    def __init__(self, 
                 confidence_threshold: float = 0.3,
                 sequence_timeout: float = 3.0,
                 min_gesture_duration: float = 0.2,
                 max_sequence_length: int = 5):
        
        self.confidence_threshold = confidence_threshold
        self.sequence_timeout = sequence_timeout
        self.min_gesture_duration = min_gesture_duration
        self.max_sequence_length = max_sequence_length
        
        # Gesture tracking
        self.current_gesture = None
        self.current_gesture_start = None
        self.current_gesture_confidences = deque(maxlen=10)
        
        # Sequence tracking
        self.current_sequence = []
        self.sequence_start_time = None
        self.gesture_state = GestureState.IDLE
        
        # History for analysis
        self.gesture_history = deque(maxlen=100)
        self.sequence_history = deque(maxlen=20)
        self.transition_patterns = defaultdict(list)
        
        # Confidence aggregation
        self.gesture_confidence_buffer = defaultdict(lambda: deque(maxlen=15))
        self.temporal_weights = self._generate_temporal_weights()
        
        # Performance tracking
        self.stats = {
            'gestures_detected': 0,
            'sequences_completed': 0,
            'false_positives_filtered': 0,
            'temporal_consistency_improvements': 0
        }
    
    def _generate_temporal_weights(self) -> np.ndarray:
        """Generate temporal weights for confidence aggregation (more recent = higher weight)"""
        weights = np.exp(np.linspace(-2, 0, 15))  # Exponential decay
        return weights / np.sum(weights)  # Normalize
    
    def add_recognition_result(self, gesture: str, confidence: float, timestamp: float) -> Optional[Dict[str, Any]]:
        """
        Add a new recognition result and perform aggregation
        
        Args:
            gesture: Recognized gesture name
            confidence: Recognition confidence
            timestamp: Timestamp of recognition
            
        Returns:
            Aggregated result if a stable gesture is detected, None otherwise
        """
        current_time = timestamp
        
        # Filter low confidence detections
        if confidence < self.confidence_threshold:
            return self._handle_low_confidence(current_time)
        
        # Add to confidence buffer
        self.gesture_confidence_buffer[gesture].append((confidence, timestamp))
        
        # Check if this is a new gesture or continuation
        if self.current_gesture != gesture:
            return self._handle_gesture_change(gesture, confidence, current_time)
        else:
            return self._handle_gesture_continuation(gesture, confidence, current_time)
    
    def _handle_low_confidence(self, timestamp: float) -> Optional[Dict[str, Any]]:
        """Handle low confidence detections"""
        # If we were tracking a gesture, check if we should end it
        if self.current_gesture and self.current_gesture_start:
            duration = timestamp - self.current_gesture_start
            
            # If gesture was held long enough, finalize it
            if duration >= self.min_gesture_duration:
                return self._finalize_current_gesture(timestamp)
            else:
                # Too short, likely noise
                self._reset_current_gesture()
                self.stats['false_positives_filtered'] += 1
        
        return None
    
    def _handle_gesture_change(self, new_gesture: str, confidence: float, timestamp: float) -> Optional[Dict[str, Any]]:
        """Handle transition to a new gesture"""
        result = None
        
        # Finalize previous gesture if it existed and was long enough
        if self.current_gesture and self.current_gesture_start:
            duration = timestamp - self.current_gesture_start
            if duration >= self.min_gesture_duration:
                result = self._finalize_current_gesture(timestamp)
                
                # Record transition pattern
                transition = GestureTransition(
                    from_gesture=self.current_gesture,
                    to_gesture=new_gesture,
                    transition_time=timestamp - self.current_gesture_start,
                    confidence_drop=confidence - np.mean([c for c, _ in self.current_gesture_confidences])
                )
                self.transition_patterns[self.current_gesture].append(transition)
        
        # Start tracking new gesture
        self.current_gesture = new_gesture
        self.current_gesture_start = timestamp
        self.current_gesture_confidences.clear()
        self.current_gesture_confidences.append(confidence)
        self.gesture_state = GestureState.DETECTING
        
        return result
    
    def _handle_gesture_continuation(self, gesture: str, confidence: float, timestamp: float) -> Optional[Dict[str, Any]]:
        """Handle continuation of current gesture"""
        self.current_gesture_confidences.append(confidence)
        
        # Check if gesture is stable enough to confirm
        if self.gesture_state == GestureState.DETECTING:
            duration = timestamp - self.current_gesture_start
            
            if duration >= self.min_gesture_duration and len(self.current_gesture_confidences) >= 3:
                # Check temporal consistency
                recent_confidences = list(self.current_gesture_confidences)[-5:]
                consistency = self._calculate_temporal_consistency(recent_confidences)
                
                if consistency > 0.7:  # High consistency threshold
                    self.gesture_state = GestureState.CONFIRMED
                    return self._create_aggregated_result(gesture, timestamp)
        
        return None
    
    def _finalize_current_gesture(self, timestamp: float) -> Optional[Dict[str, Any]]:
        """Finalize the current gesture and add to sequence"""
        if not self.current_gesture or not self.current_gesture_start:
            return None
        
        duration = timestamp - self.current_gesture_start
        confidences = [c for c in self.current_gesture_confidences]
        
        # Calculate aggregated confidence with temporal weighting
        aggregated_confidence = self._calculate_weighted_confidence(confidences)
        
        # Create gesture result
        gesture_result = {
            'gesture': self.current_gesture,
            'confidence': aggregated_confidence,
            'duration': duration,
            'timestamp': self.current_gesture_start,
            'end_timestamp': timestamp,
            'consistency': self._calculate_temporal_consistency(confidences),
            'sample_count': len(confidences)
        }
        
        # Add to history
        self.gesture_history.append(gesture_result)
        self.stats['gestures_detected'] += 1
        
        # Update sequence tracking
        self._update_sequence_tracking(gesture_result)
        
        # Reset current gesture
        self._reset_current_gesture()
        
        return gesture_result
    
    def _calculate_weighted_confidence(self, confidences: List[float]) -> float:
        """Calculate weighted confidence using temporal weights"""
        if not confidences:
            return 0.0
        
        # Pad or truncate to match weight array size
        conf_array = np.array(confidences[-len(self.temporal_weights):])
        weights = self.temporal_weights[-len(conf_array):]
        
        # Apply temporal weighting
        weighted_conf = np.average(conf_array, weights=weights)
        
        # Apply consistency bonus
        consistency = self._calculate_temporal_consistency(confidences)
        consistency_bonus = min(consistency * 0.1, 0.15)  # Up to 15% bonus
        
        final_confidence = min(weighted_conf + consistency_bonus, 1.0)
        
        if consistency_bonus > 0.05:
            self.stats['temporal_consistency_improvements'] += 1
        
        return final_confidence
    
    def _calculate_temporal_consistency(self, confidences: List[float]) -> float:
        """Calculate temporal consistency of confidence values"""
        if len(confidences) < 2:
            return 1.0
        
        # Calculate coefficient of variation (lower = more consistent)
        mean_conf = np.mean(confidences)
        std_conf = np.std(confidences)
        
        if mean_conf == 0:
            return 0.0
        
        cv = std_conf / mean_conf
        consistency = max(0.0, 1.0 - cv)  # Convert to consistency score
        
        return consistency
    
    def _update_sequence_tracking(self, gesture_result: Dict[str, Any]):
        """Update gesture sequence tracking"""
        current_time = gesture_result['end_timestamp']
        
        # Initialize sequence if needed
        if not self.current_sequence:
            self.sequence_start_time = gesture_result['timestamp']
        
        # Check sequence timeout
        if self.sequence_start_time and (current_time - self.sequence_start_time) > self.sequence_timeout:
            self._finalize_sequence()
            self.sequence_start_time = gesture_result['timestamp']
        
        # Add to current sequence
        self.current_sequence.append(gesture_result)
        
        # Check if sequence is complete (max length reached)
        if len(self.current_sequence) >= self.max_sequence_length:
            self._finalize_sequence()
    
    def _finalize_sequence(self):
        """Finalize current gesture sequence"""
        if not self.current_sequence:
            return
        
        # Create sequence object
        gestures = [g['gesture'] for g in self.current_sequence]
        confidences = [g['confidence'] for g in self.current_sequence]
        timestamps = [g['timestamp'] for g in self.current_sequence]
        
        duration = timestamps[-1] - timestamps[0] if len(timestamps) > 1 else 0
        overall_confidence = np.mean(confidences)
        
        sequence = GestureSequence(
            gestures=gestures,
            confidences=confidences,
            timestamps=timestamps,
            duration=duration,
            overall_confidence=overall_confidence,
            state=GestureState.CONFIRMED
        )
        
        # Add to sequence history
        self.sequence_history.append(sequence)
        self.stats['sequences_completed'] += 1
        
        # Reset current sequence
        self.current_sequence = []
        self.sequence_start_time = None
    
    def _create_aggregated_result(self, gesture: str, timestamp: float) -> Dict[str, Any]:
        """Create aggregated result for confirmed gesture"""
        confidences = list(self.current_gesture_confidences)
        duration = timestamp - self.current_gesture_start
        
        return {
            'gesture': gesture,
            'confidence': self._calculate_weighted_confidence(confidences),
            'raw_confidence': np.mean(confidences),
            'duration': duration,
            'timestamp': self.current_gesture_start,
            'consistency': self._calculate_temporal_consistency(confidences),
            'sample_count': len(confidences),
            'state': self.gesture_state.value,
            'aggregation_type': 'temporal_weighted'
        }
    
    def _reset_current_gesture(self):
        """Reset current gesture tracking"""
        self.current_gesture = None
        self.current_gesture_start = None
        self.current_gesture_confidences.clear()
        self.gesture_state = GestureState.IDLE
    
    def get_current_sequence(self) -> Optional[List[Dict[str, Any]]]:
        """Get current gesture sequence"""
        return self.current_sequence.copy() if self.current_sequence else None
    
    def get_recent_gestures(self, count: int = 5) -> List[Dict[str, Any]]:
        """Get recent confirmed gestures"""
        return list(self.gesture_history)[-count:] if self.gesture_history else []
    
    def get_gesture_patterns(self, gesture: str) -> Dict[str, Any]:
        """Get transition patterns for a specific gesture"""
        transitions = self.transition_patterns.get(gesture, [])
        
        if not transitions:
            return {'gesture': gesture, 'patterns': []}
        
        # Analyze patterns
        to_gestures = defaultdict(list)
        for transition in transitions:
            to_gestures[transition.to_gesture].append(transition.transition_time)
        
        patterns = []
        for to_gesture, times in to_gestures.items():
            patterns.append({
                'to_gesture': to_gesture,
                'frequency': len(times),
                'avg_transition_time': np.mean(times),
                'std_transition_time': np.std(times)
            })
        
        return {
            'gesture': gesture,
            'total_transitions': len(transitions),
            'patterns': sorted(patterns, key=lambda x: x['frequency'], reverse=True)
        }
    
    def get_aggregation_stats(self) -> Dict[str, Any]:
        """Get aggregation statistics"""
        return {
            **self.stats,
            'current_gesture': self.current_gesture,
            'current_sequence_length': len(self.current_sequence),
            'gesture_history_size': len(self.gesture_history),
            'sequence_history_size': len(self.sequence_history),
            'confidence_threshold': self.confidence_threshold,
            'min_gesture_duration': self.min_gesture_duration
        }
    
    def reset(self):
        """Reset all tracking state"""
        self._reset_current_gesture()
        self.current_sequence = []
        self.sequence_start_time = None
        self.gesture_history.clear()
        self.sequence_history.clear()
        self.gesture_confidence_buffer.clear()
        self.transition_patterns.clear()
        self.stats = {
            'gestures_detected': 0,
            'sequences_completed': 0,
            'false_positives_filtered': 0,
            'temporal_consistency_improvements': 0
        }