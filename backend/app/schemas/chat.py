from pydantic import BaseModel
from typing import List, Optional

class ChatMessage(BaseModel):
    role: str  # 'user', 'assistant', 'system'
    content: str
    evidence_ids: Optional[List[str]] = []
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    analysis_id: str
    message: str
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    response: str
    referenced_evidence_ids: List[str]
    suggested_followups: List[str]
    is_grounded: bool = True
