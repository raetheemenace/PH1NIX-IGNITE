import os
import asyncio
import aiohttp
from typing import Dict, List, Optional
from datetime import datetime

class AgoraChannelCoordinator:
    """
    Coordinates audio playback with Agora channels for real-time streaming
    """
    
    def __init__(self):
        self.app_id = os.getenv('AGORA_APP_ID')
        self.api_key = os.getenv('AGORA_API_KEY')
        self.base_url = os.getenv('AGORA_API_BASE_URL', 'https://api.agora.io/v1')
        self.session = None
        self.active_channels: Dict[str, Dict] = {}
        
    async def _ensure_session(self):
        """Initialize aiohttp session lazily"""
        if self.session is None:
            self.session = aiohttp.ClientSession()
    
    async def create_channel(self, channel_name: str, user_id: str) -> Dict:
        """
        Create or join an Agora channel for audio streaming
        
        Args:
            channel_name: Name of the channel to create/join
            user_id: User ID for the channel
            
        Returns:
            Channel creation result
        """
        if not self.app_id or not self.api_key:
            return {
                "success": False,
                "error": "Agora credentials not configured"
            }
            
        await self._ensure_session()
        
        payload = {
            "app_id": self.app_id,
            "channel_name": channel_name,
            "user_id": user_id,
            "role": "publisher",  # Can publish audio
            "timestamp": datetime.utcnow().isoformat()
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            async with self.session.post(
                f"{self.base_url}/channels",
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=10.0)
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    
                    # Store channel info
                    self.active_channels[channel_name] = {
                        "user_id": user_id,
                        "token": result.get("token"),
                        "created_at": datetime.utcnow(),
                        "status": "active"
                    }
                    
                    return {
                        "success": True,
                        "channel_name": channel_name,
                        "token": result.get("token"),
                        "user_id": user_id
                    }
                else:
                    error_text = await response.text()
                    return {
                        "success": False,
                        "error": f"Channel creation failed: {response.status} - {error_text}"
                    }
                    
        except Exception as e:
            return {
                "success": False,
                "error": f"Channel creation error: {str(e)}"
            }
    
    async def stream_audio_to_channel(self, 
                                    channel_name: str, 
                                    audio_data: bytes, 
                                    audio_format: str = "wav") -> Dict:
        """
        Stream audio data to an Agora channel
        
        Args:
            channel_name: Target channel name
            audio_data: Audio data to stream
            audio_format: Audio format (wav, mp3, etc.)
            
        Returns:
            Streaming result
        """
        if channel_name not in self.active_channels:
            return {
                "success": False,
                "error": f"Channel {channel_name} not found or not active"
            }
            
        await self._ensure_session()
        
        # Convert audio data to base64 for transmission
        import base64
        audio_b64 = base64.b64encode(audio_data).decode('utf-8')
        
        payload = {
            "app_id": self.app_id,
            "channel_name": channel_name,
            "audio_data": audio_b64,
            "audio_format": audio_format,
            "user_id": self.active_channels[channel_name]["user_id"],
            "timestamp": datetime.utcnow().isoformat()
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            async with self.session.post(
                f"{self.base_url}/channels/{channel_name}/stream",
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=15.0)
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    return {
                        "success": True,
                        "stream_id": result.get("stream_id"),
                        "channel_name": channel_name,
                        "duration": result.get("duration", 0)
                    }
                else:
                    error_text = await response.text()
                    return {
                        "success": False,
                        "error": f"Audio streaming failed: {response.status} - {error_text}"
                    }
                    
        except Exception as e:
            return {
                "success": False,
                "error": f"Audio streaming error: {str(e)}"
            }
    
    async def leave_channel(self, channel_name: str) -> Dict:
        """
        Leave an Agora channel
        
        Args:
            channel_name: Channel to leave
            
        Returns:
            Leave result
        """
        if channel_name not in self.active_channels:
            return {
                "success": True,
                "message": "Channel not found or already left"
            }
            
        await self._ensure_session()
        
        payload = {
            "app_id": self.app_id,
            "channel_name": channel_name,
            "user_id": self.active_channels[channel_name]["user_id"],
            "timestamp": datetime.utcnow().isoformat()
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            async with self.session.delete(
                f"{self.base_url}/channels/{channel_name}/users/{self.active_channels[channel_name]['user_id']}",
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=10.0)
            ) as response:
                # Remove from active channels regardless of response
                del self.active_channels[channel_name]
                
                if response.status in [200, 404]:  # 404 is OK, means already left
                    return {
                        "success": True,
                        "channel_name": channel_name
                    }
                else:
                    error_text = await response.text()
                    return {
                        "success": False,
                        "error": f"Leave channel failed: {response.status} - {error_text}"
                    }
                    
        except Exception as e:
            # Still remove from active channels on error
            if channel_name in self.active_channels:
                del self.active_channels[channel_name]
            return {
                "success": False,
                "error": f"Leave channel error: {str(e)}"
            }
    
    async def get_channel_status(self, channel_name: str) -> Dict:
        """
        Get status of an Agora channel
        
        Args:
            channel_name: Channel to check
            
        Returns:
            Channel status information
        """
        if channel_name not in self.active_channels:
            return {
                "exists": False,
                "status": "not_found"
            }
            
        channel_info = self.active_channels[channel_name]
        return {
            "exists": True,
            "status": channel_info["status"],
            "user_id": channel_info["user_id"],
            "created_at": channel_info["created_at"].isoformat(),
            "channel_name": channel_name
        }
    
    async def list_active_channels(self) -> List[Dict]:
        """
        List all active channels
        
        Returns:
            List of active channel information
        """
        return [
            {
                "channel_name": name,
                "user_id": info["user_id"],
                "status": info["status"],
                "created_at": info["created_at"].isoformat()
            }
            for name, info in self.active_channels.items()
        ]
    
    async def close(self):
        """Close the aiohttp session and cleanup resources"""
        # Leave all active channels
        for channel_name in list(self.active_channels.keys()):
            await self.leave_channel(channel_name)
            
        if self.session:
            await self.session.close()
            self.session = None

# Global instance
agora_channel_coordinator = AgoraChannelCoordinator()