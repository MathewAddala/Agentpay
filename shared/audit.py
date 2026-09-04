import json
import structlog
from pydantic import BaseModel
from typing import Optional, Dict, Any, Union
from shared.models import AuditEntry, HandshakeStep
from shared.database import insert_audit_entry

logger = structlog.get_logger(__name__)

class AuditLogger:
    def __init__(self, db_path: str, actor_name: str):
        self.db_path = db_path
        self.actor_name = actor_name

    async def log(
        self, 
        session_id: str, 
        step: HandshakeStep, 
        direction: str, 
        message: Union[BaseModel, Dict, str], 
        policy_decision: Optional[str] = None, 
        razorpay_event: Optional[str] = None, 
        llm_input: Optional[str] = None, 
        llm_output: Optional[str] = None, 
        status: str = 'success', 
        error_details: Optional[str] = None
    ):
        if isinstance(message, BaseModel):
            message_json = message.model_dump_json()
        elif isinstance(message, dict):
            message_json = json.dumps(message)
        else:
            message_json = str(message)

        entry = AuditEntry(
            session_id=session_id,
            step=step,
            direction=direction,
            actor=self.actor_name,
            message_json=message_json,
            policy_decision=policy_decision,
            razorpay_event=razorpay_event,
            llm_input=llm_input,
            llm_output=llm_output,
            status=status,
            error_details=error_details
        )
        
        await insert_audit_entry(self.db_path, entry)
        
        logger.info(
            "audit_log", 
            actor=self.actor_name,
            session_id=session_id,
            step=step,
            direction=direction,
            status=status
        )

    async def log_razorpay_call(self, session_id: str, method: str, endpoint: str, request_data: Any, response_data: Any, status: str):
        await self.log(
            session_id=session_id,
            step='OFFER', # Generic step for API call context if needed
            direction='outbound',
            message=json.dumps({"method": method, "endpoint": endpoint, "request": request_data, "response": response_data}),
            razorpay_event=f"{method} {endpoint}",
            status=status
        )

    async def log_llm_call(self, session_id: str, step: HandshakeStep, prompt: str, response: str, status: str):
        await self.log(
            session_id=session_id,
            step=step,
            direction='internal',
            message=json.dumps({"prompt": prompt, "response": response}),
            llm_input=prompt,
            llm_output=response,
            status=status
        )
