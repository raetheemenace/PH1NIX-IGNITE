import os
from groq import Groq
from typing import List, Dict
from app.utils.translations import translate_sign

class VoiceAgent:
    def __init__(self):
        self.client = None
        self.conversation_history = []
        
    def _ensure_client(self):
        """Initialize Groq client lazily"""
        if self.client is None:
            api_key = os.getenv('GROQ_API_KEY')
            if not api_key:
                raise ValueError("GROQ_API_KEY environment variable not set")
            self.client = Groq(api_key=api_key)
        
    def process_sign_to_speech(self, sign_text: str, context: List[str] = None, sign_language: str = None, output_language: str = None) -> Dict:
        """
        Convert recognized sign language to natural speech with emotion
        """
        direct_translation = ''
        if output_language:
            direct_translation = translate_sign(sign_text, sign_language or 'ASL', output_language)
        if direct_translation:
            self.conversation_history.append({
                "sign": sign_text,
                "response": direct_translation,
                "emotion": "casual",
            })
            if len(self.conversation_history) > 10:
                self.conversation_history = self.conversation_history[-10:]
            return {
                "text": direct_translation,
                "emotion": "casual",
                "original_sign": sign_text,
                "conversation_context": len(self.conversation_history),
            }

        use_groq = (os.getenv('USE_GROQ_VOICE_AGENT', '').strip().lower() == 'true')
        if not use_groq:
            fallback_text = sign_text.lower().replace('_', ' ')
            self.conversation_history.append({
                "sign": sign_text,
                "response": fallback_text,
                "emotion": "casual",
            })
            if len(self.conversation_history) > 10:
                self.conversation_history = self.conversation_history[-10:]
            return {
                "text": fallback_text,
                "emotion": "casual",
                "original_sign": sign_text,
                "conversation_context": len(self.conversation_history),
            }

        self._ensure_client()
        
        # Build context from recent signs
        context_str = ""
        if context:
            context_str = f"Recent signs: {', '.join(context[-3:])}\n"
        
        # Create prompt for direct translation
        prompt = f"""You are a direct sign language translator. The user just signed: "{sign_text}"

{context_str}IMPORTANT: You must start your response with EXACTLY one of these emotion tags:
[excited] [warm] [casual] [concerned] [grateful] [joyful] [playful] [curious]

Rules for your translation:
- Do NOT answer the user.
- Do NOT expand the sign into a sentence.
- Translate the sign into its direct word or short phrase equivalent.
- Match the emotion tag to the context of the conversation.
- Keep it under 5 words.

Examples:
- "THANK_YOU" → "[grateful] Thank you"
- "HELP" → "[concerned] I need help"
- "HOW_ARE_YOU" → "[curious] How are you?"
- "YES" → "[joyful] Yes"
- "NO" → "[casual] No"
- "SALAMAT" → "[grateful] Thank you"
- "KAMUSTA" → "[curious] How are you?"
- "OO" → "[joyful] Yes"
- "HINDI" → "[casual] No"

Your translation (must start with emotion tag):"""

        try:
            response = self.client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": "You are a professional sign language interpreter. You translate signs directly into spoken words. You do not answer the user or add extra conversational filler. Your goal is to be the literal voice of the signer."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,  # Lowered for more consistent direct translations
                max_tokens=20
            )
            
            generated_text = response.choices[0].message.content.strip()
            print(f"Groq response: {generated_text}")
            
            # Extract emotion tags and clean text
            emotion = "casual"
            clean_text = generated_text
            
            # Map all supported emotion tags
            emotions = ["excited", "warm", "casual", "concerned", "grateful", "joyful", "playful", "curious", "friendly", "calm"]
            for e in emotions:
                tag = f"[{e}]"
                if generated_text.lower().startswith(tag):
                    emotion = e
                    clean_text = generated_text[len(tag):].strip()
                    break
            
            print(f"Extracted emotion: {emotion}, text: {clean_text}")
            
            # Add to conversation history
            self.conversation_history.append({
                "sign": sign_text,
                "response": clean_text,
                "emotion": emotion
            })
            
            # Keep only last 10 exchanges
            if len(self.conversation_history) > 10:
                self.conversation_history = self.conversation_history[-10:]
            
            return {
                "text": clean_text,
                "emotion": emotion,
                "original_sign": sign_text,
                "conversation_context": len(self.conversation_history)
            }
            
        except Exception as e:
            print(f"Groq API error: {e}")
            # Fallback to simple mapping
            return {
                "text": sign_text.lower().replace('_', ' '),
                "emotion": "casual",
                "original_sign": sign_text,
                "conversation_context": 0
            }
    
    def _fallback_response(self, sign_text: str) -> str:
        """Natural fallback responses if Groq API fails"""
        fallback_map = {
            "THANK_YOU": "You're welcome!",
            "HOW_ARE_YOU": "I'm doing great, thanks!",
            "HELP": "What can I help you with?",
            "YES": "Awesome!",
            "NO": "No worries!",
            "GOOD_MORNING": "Good morning!",
            "HELLO": "Hey there!",
            "GOODBYE": "See you later!"
        }
        return fallback_map.get(sign_text, f"Got it - {sign_text.lower().replace('_', ' ')}")
    
    def reset_conversation(self):
        """Clear conversation history"""
        self.conversation_history = []

# Global instance
voice_agent = VoiceAgent()
