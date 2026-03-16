import asyncio
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum

# Import the channel coordinator
from app.services.agora_channel_coordinator import agora_channel_coordinator

class SpeechPriority(Enum):
    LOW = 1
    NORMAL = 2
    HIGH = 3
    INTERRUPT = 4

@dataclass
class SpeechItem:
    """Represents a speech item in the queue"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    text: str = ""
    emotion: str = "casual"
    priority: SpeechPriority = SpeechPriority.NORMAL
    channel_name: Optional[str] = None
    audio_data: Optional[bytes] = None
    audio_format: str = "wav"
    duration: float = 0.0
    created_at: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict = field(default_factory=dict)

class SpeechQueueManager:
    """
    Manages speech synthesis queue with chronological ordering and playback coordination
    """
    
    def __init__(self):
        self.queue: List[SpeechItem] = []
        self.current_item: Optional[SpeechItem] = None
        self.is_playing = False
        self.is_paused = False
        self.playback_callbacks: List[Callable] = []
        self._lock = asyncio.Lock()
        
    async def add_speech_item(self, 
                            text: str, 
                            emotion: str = "casual",
                            priority: SpeechPriority = SpeechPriority.NORMAL,
                            channel_name: Optional[str] = None,
                            audio_data: Optional[bytes] = None,
                            audio_format: str = "wav",
                            duration: float = 0.0,
                            metadata: Dict = None) -> str:
        """
        Add a speech item to the queue
        
        Args:
            text: Text to be spoken
            emotion: Emotion for speech synthesis
            priority: Priority level for queue ordering
            channel_name: Agora channel for audio streaming
            audio_data: Pre-synthesized audio data
            audio_format: Audio format (wav, mp3, etc.)
            duration: Audio duration in seconds
            metadata: Additional metadata
            
        Returns:
            Speech item ID
        """
        async with self._lock:
            speech_item = SpeechItem(
                text=text,
                emotion=emotion,
                priority=priority,
                channel_name=channel_name,
                audio_data=audio_data,
                audio_format=audio_format,
                duration=duration,
                metadata=metadata or {}
            )
            
            # Handle interrupt priority - clear queue and add immediately
            if priority == SpeechPriority.INTERRUPT:
                self.queue.clear()
                self.queue.insert(0, speech_item)
                # Stop current playback if any
                if self.is_playing:
                    await self._stop_current_playback()
            else:
                # Insert based on priority and chronological order
                inserted = False
                for i, item in enumerate(self.queue):
                    if (priority.value > item.priority.value or 
                        (priority.value == item.priority.value and 
                         speech_item.created_at < item.created_at)):
                        self.queue.insert(i, speech_item)
                        inserted = True
                        break
                
                if not inserted:
                    self.queue.append(speech_item)
            
            return speech_item.id
    
    async def get_next_item(self) -> Optional[SpeechItem]:
        """
        Get the next speech item from the queue
        
        Returns:
            Next speech item or None if queue is empty
        """
        async with self._lock:
            if self.queue:
                return self.queue.pop(0)
            return None
    
    async def peek_next_item(self) -> Optional[SpeechItem]:
        """
        Peek at the next speech item without removing it from queue
        
        Returns:
            Next speech item or None if queue is empty
        """
        async with self._lock:
            if self.queue:
                return self.queue[0]
            return None
    
    async def remove_item(self, item_id: str) -> bool:
        """
        Remove a specific item from the queue
        
        Args:
            item_id: ID of the item to remove
            
        Returns:
            True if item was found and removed
        """
        async with self._lock:
            for i, item in enumerate(self.queue):
                if item.id == item_id:
                    self.queue.pop(i)
                    return True
            return False
    
    async def clear_queue(self):
        """Clear all items from the queue"""
        async with self._lock:
            self.queue.clear()
    
    async def get_queue_status(self) -> Dict:
        """
        Get current queue status
        
        Returns:
            Dictionary with queue information
        """
        async with self._lock:
            return {
                "queue_length": len(self.queue),
                "is_playing": self.is_playing,
                "is_paused": self.is_paused,
                "current_item_id": self.current_item.id if self.current_item else None,
                "next_items": [
                    {
                        "id": item.id,
                        "text": item.text[:50] + "..." if len(item.text) > 50 else item.text,
                        "priority": item.priority.name,
                        "created_at": item.created_at.isoformat()
                    }
                    for item in self.queue[:5]  # Show next 5 items
                ]
            }
    
    async def start_playback_loop(self):
        """
        Start the continuous playback loop
        This should be called once to begin processing the queue
        """
        while True:
            try:
                if not self.is_paused and not self.is_playing:
                    next_item = await self.get_next_item()
                    if next_item:
                        await self._play_speech_item(next_item)
                    else:
                        # No items in queue, wait a bit before checking again
                        await asyncio.sleep(0.1)
                else:
                    # Paused or already playing, wait a bit
                    await asyncio.sleep(0.1)
                    
            except Exception as e:
                print(f"Error in playback loop: {e}")
                await asyncio.sleep(1)  # Wait longer on error
    
    async def _play_speech_item(self, item: SpeechItem):
        """
        Play a single speech item with Agora channel coordination
        
        Args:
            item: Speech item to play
        """
        self.current_item = item
        self.is_playing = True
        
        try:
            # Notify callbacks that playback started
            for callback in self.playback_callbacks:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        await callback("playback_started", item)
                    else:
                        callback("playback_started", item)
                except Exception as e:
                    print(f"Error in playback callback: {e}")
            
            # If audio data and channel name are provided, stream to Agora channel
            if item.audio_data and item.channel_name:
                stream_result = await agora_channel_coordinator.stream_audio_to_channel(
                    channel_name=item.channel_name,
                    audio_data=item.audio_data,
                    audio_format=item.audio_format
                )
                
                if stream_result.get("success"):
                    # Use the actual duration from streaming if available
                    actual_duration = stream_result.get("duration", item.duration)
                    if actual_duration > 0:
                        await asyncio.sleep(actual_duration)
                    else:
                        # Fallback to estimated duration
                        await asyncio.sleep(item.duration if item.duration > 0 else len(item.text) * 0.05)
                else:
                    print(f"Failed to stream audio to channel {item.channel_name}: {stream_result.get('error')}")
                    # Still wait for estimated duration even if streaming failed
                    await asyncio.sleep(item.duration if item.duration > 0 else len(item.text) * 0.05)
            else:
                # No audio data or channel, just simulate playback duration
                if item.duration > 0:
                    await asyncio.sleep(item.duration)
                else:
                    # Estimate duration based on text length (rough approximation)
                    estimated_duration = len(item.text) * 0.05  # ~50ms per character
                    await asyncio.sleep(max(0.5, estimated_duration))
            
            # Notify callbacks that playback completed
            for callback in self.playback_callbacks:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        await callback("playback_completed", item)
                    else:
                        callback("playback_completed", item)
                except Exception as e:
                    print(f"Error in playback callback: {e}")
                    
        except Exception as e:
            print(f"Error playing speech item {item.id}: {e}")
            # Notify callbacks of error
            for callback in self.playback_callbacks:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        await callback("playback_error", item, str(e))
                    else:
                        callback("playback_error", item, str(e))
                except Exception as callback_error:
                    print(f"Error in error callback: {callback_error}")
        finally:
            self.current_item = None
            self.is_playing = False
    
    async def _stop_current_playback(self):
        """Stop current playback (for interrupt priority items)"""
        if self.current_item:
            # In real implementation, this would stop actual audio playback
            self.is_playing = False
            self.current_item = None
    
    async def pause_playback(self):
        """Pause the playback queue"""
        self.is_paused = True
    
    async def resume_playback(self):
        """Resume the playback queue"""
        self.is_paused = False
    
    def add_playback_callback(self, callback: Callable):
        """
        Add a callback function to be called on playback events
        
        Args:
            callback: Function to call on playback events
                     Signature: callback(event_type: str, item: SpeechItem, error: str = None)
        """
        self.playback_callbacks.append(callback)
    
    def remove_playback_callback(self, callback: Callable):
        """Remove a playback callback"""
        if callback in self.playback_callbacks:
            self.playback_callbacks.remove(callback)

# Global instance
speech_queue_manager = SpeechQueueManager()