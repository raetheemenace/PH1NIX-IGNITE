from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.agora_conversational_ai import agora_cai_service as agora_cai


router = APIRouter(prefix="/cai", tags=["conversational-ai"])


class StartAgentRequest(BaseModel):
    channel: str


class SpeakRequest(BaseModel):
    text: str
    priority: Optional[str] = "INTERRUPT"
    interruptable: Optional[bool] = True


@router.post("/start")
def start_agent(req: StartAgentRequest):
    if not agora_cai.is_enabled():
        raise HTTPException(status_code=400, detail="USE_AGORA_CONVERSATIONAL_AI is not enabled")
    try:
        agent_id = agora_cai.ensure_agent(req.channel)
        return {"agent_id": agent_id, "channel": req.channel}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stop")
def stop_agent():
    if not agora_cai.is_enabled():
        raise HTTPException(status_code=400, detail="USE_AGORA_CONVERSATIONAL_AI is not enabled")
    try:
        agora_cai.leave_agent()
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
def status():
    return agora_cai.status()


@router.post("/speak")
def speak(req: SpeakRequest):
    if not agora_cai.is_enabled():
        raise HTTPException(status_code=400, detail="USE_AGORA_CONVERSATIONAL_AI is not enabled")
    try:
        res = agora_cai.speak(req.text, priority=req.priority or "INTERRUPT", interruptable=bool(req.interruptable))
        return {"ok": True, "result": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
