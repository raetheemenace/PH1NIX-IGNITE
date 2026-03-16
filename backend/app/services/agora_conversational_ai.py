import os
import json
import asyncio
import aiohttp
from typing import Dict, List, Optional
from datetime import datetime

class AgoraConversationalAIService:
    """
    Service for integrating with Agora Conversational AI for natural speech synthesis
    """
    
    def __init__(self):
        self.api_key = os.getenv('AGORA_CAI_API_KEY')
        self.app_id = os.getenv('AGORA_APP_ID')
        self.base_url = os.getenv('AGORA_CAI_BASE_URL', 'https://api.agora.io/v1/conversational-ai')
        self.session = None
        
    async def _ensure_session(self):
        """Initialize aiohttp session lazily"""
        if self.session is None:
            self.session = aiohttp.ClientSession()
    
    async def synthesize_speech(self, text: str, emotion: str = "casual", context: List[str] = None) -> Dict:
        """
        Convert text to speech using Agora Conversational AI with emotion awareness
        
        Args:
            text: Text to convert to speech
            emotion: Emotion for speech synthesis (casual, excited, warm, etc.)
            context: Previous conversation context for better synthesis
            
        Returns:
            Dict containing audio data and metadata
        """
        if not self.api_key or not self.app_id:
            raise ValueError("Agora CAI API key and App ID must be configured")
            
        await self._ensure_session()
        
        # Map emotions to Agora CAI emotion parameters
        emotion_mapping = {
            "casual": {"tone": "neutral", "energy": "medium"},
            "excited": {"tone": "happy", "energy": "high"},
            "warm": {"tone": "friendly", "energy": "medium"},
            "concerned": {"tone": "serious", "energy": "low"},
            "grateful": {"tone": "warm", "energy": "medium"},
            "joyful": {"tone": "happy", "energy": "high"},
            "playful": {"tone": "cheerful", "energy": "high"},
            "curious": {"tone": "inquisitive", "energy": "medium"}
        }
        
        emotion_params = emotion_mapping.get(emotion, {"tone": "neutral", "energy": "medium"})
        
        payload = {
            "app_id": self.app_id,
            "text": text,
            "voice_settings": {
                "voice_id": "en-US-neural-1",
                "speed": 1.0,
                "volume": 0.8,
                "tone": emotion_params["tone"],
                "energy": emotion_params["energy"]
            },
            "context": context[-3:] if context else [],
            "timestamp": datetime.utcnow().isoformat()
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            async with self.session.post(
                f"{self.base_url}/synthesize",
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=5.0)
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    return {
                        "audio_data": result.get("audio_data"),
                        "audio_format": result.get("format", "wav"),
                        "duration": result.get("duration", 0),
                        "emotion": emotion,
                        "synthesis_time": result.get("processing_time", 0),
                        "success": True
                    }
                else:
                    error_text = await response.text()
                    return {
                        "success": False,
                        "error": f"Agora CAI API error: {response.status} - {error_text}",
                        "fallback_required": True
                    }
                    
        except asyncio.TimeoutError:
            return {
                "success": False,
                "error": "Agora CAI API timeout",
                "fallback_required": True
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Agora CAI API error: {str(e)}",
                "fallback_required": True
            }
    
    async def set_voice_parameters(self, voice_id: str, speed: float = 1.0, volume: float = 0.8) -> bool:
        """
        Configure voice parameters for speech synthesis
        
        Args:
            voice_id: Voice identifier for synthesis
            speed: Speech speed (0.5 - 2.0)
            volume: Audio volume (0.0 - 1.0)
            
        Returns:
            Success status
        """
        # Store voice parameters for future synthesis calls
        self.voice_settings = {
            "voice_id": voice_id,
            "speed": max(0.5, min(2.0, speed)),
            "volume": max(0.0, min(1.0, volume))
        }
        return True
    
    async def stream_audio_to_channel(self, audio_data: bytes, channel_name: str) -> Dict:
        """
        Stream synthesized audio to Agora channel
        
        Args:
            audio_data: Audio data to stream
            channel_name: Agora channel name
            
        Returns:
            Streaming result
        """
        if not audio_data or not channel_name:
            return {"success": False, "error": "Missing audio data or channel name"}
            
        await self._ensure_session()
        
        payload = {
            "app_id": self.app_id,
            "channel_name": channel_name,
            "audio_data": audio_data.hex() if isinstance(audio_data, bytes) else audio_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            async with self.session.post(
                f"{self.base_url}/stream",
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=10.0)
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    return {
                        "success": True,
                        "stream_id": result.get("stream_id"),
                        "channel_name": channel_name
                    }
                else:
                    error_text = await response.text()
                    return {
                        "success": False,
                        "error": f"Audio streaming error: {response.status} - {error_text}"
                    }
                    
        except Exception as e:
            return {
                "success": False,
                "error": f"Audio streaming error: {str(e)}"
            }
    
    async def close(self):
        """Close the aiohttp session"""
        if self.session:
            await self.session.close()
            self.session = None

# Global instance
agora_cai_service = AgoraConversationalAIService()