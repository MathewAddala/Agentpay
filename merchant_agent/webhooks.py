"""
Handles Razorpay webhooks for the merchant agent.
"""
import json
import structlog
from typing import Dict, Any

logger = structlog.get_logger()

async def verify_and_process_webhook(request_body: str, signature: str, secret: str, razorpay_service: Any, audit_logger: Any) -> Dict[str, Any]:
    """
    Verifies and processes incoming Razorpay webhooks.

    Args:
        request_body: The raw webhook payload string.
        signature: The webhook signature from headers.
        secret: The secret used to verify the signature.
        razorpay_service: The Razorpay service for verification.
        audit_logger: The audit logger to record the event.

    Returns:
        A dictionary with the processing status.
    """
    is_valid = await razorpay_service.verify_webhook_signature(request_body, signature, secret)
    if not is_valid:
        logger.warning("Webhook signature verification failed")
        return {"status": "ignored", "reason": "invalid_signature"}
        
    try:
        event = json.loads(request_body)
    except Exception as e:
        logger.error("Failed to parse webhook JSON", error=str(e))
        return {"status": "error", "reason": "invalid_json"}
        
    event_type = event.get('event')
    payload = event.get('payload', {})
    
    logger.info(f"Received webhook: {event_type}")
    
    session_id = "unknown_session"
    
    if event_type == 'payment.authorized':
        payment = payload.get('payment', {}).get('entity', {})
        notes = payment.get('notes', {})
        session_id = notes.get('session_id', 'unknown_session')
        await audit_logger.log(session_id, "webhook_received", "inbound", {"event": event_type, "payment_id": payment.get("id")})
        
    elif event_type == 'payment.captured':
        payment = payload.get('payment', {}).get('entity', {})
        notes = payment.get('notes', {})
        session_id = notes.get('session_id', 'unknown_session')
        await audit_logger.log(session_id, "webhook_received", "inbound", {"event": event_type, "payment_id": payment.get("id")})
        
    elif event_type == 'payment.failed':
        payment = payload.get('payment', {}).get('entity', {})
        notes = payment.get('notes', {})
        session_id = notes.get('session_id', 'unknown_session')
        await audit_logger.log(session_id, "webhook_received", "inbound", {"event": event_type, "payment_id": payment.get("id"), "error": payment.get("error_description")})
        
    elif event_type == 'order.paid':
        order = payload.get('order', {}).get('entity', {})
        notes = order.get('notes', {})
        session_id = notes.get('session_id', 'unknown_session')
        await audit_logger.log(session_id, "webhook_received", "inbound", {"event": event_type, "order_id": order.get("id")})
        
    return {"status": "success", "event": event_type}
