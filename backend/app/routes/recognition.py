from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.inference import predict_sign
from app.services.context import apply_context_awareness
from app.services.voice_agent import voice_agent

router = APIRouter(prefix="/recognize", tags=["recognition"])

class RecognitionRequest(BaseModel):
    frame: str  # Base64 encoded image
    sign_language: str  # FSL or ASL
    output_language: str  # Tagalog or English
    recent_signs: list = []

@router.post("")
async def recognize_sign(request: RecognitionRequest):
    try:
        # Run AI inference on frame
        prediction_result = predict_sign(request.frame, request.sign_language)
        
        if prediction_result is None:
            return {
                "text": None,
                "sign": None,
                "confidence": 0.0,
                "voice_response": None
            }
        
        predicted_sign = prediction_result['sign']
        confidence = prediction_result['confidence']
        model_language = prediction_result.get('model_language')
        
        # Apply context awareness for translation
        final_text = apply_context_awareness(
            predicted_sign,
            request.recent_signs,
            request.sign_language,
            request.output_language
        )
        
        # Generate natural voice response using Groq (this is the deaf person's "voice")
        voice_response = voice_agent.process_sign_to_speech(
            predicted_sign, 
            request.recent_signs,
            sign_language=request.sign_language,
            output_language=request.output_language,
        )
        
        return {
            "text": final_text,  # Direct translation
            "sign": predicted_sign,
            "confidence": confidence,
            "model_language": model_language,
            "voice_response": voice_response  # Natural speech for hearing people
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reset-conversation")
async def reset_conversation():
    """Reset the voice agent conversation history"""
    try:
        voice_agent.reset_conversation()
        return {"message": "Conversation reset successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
