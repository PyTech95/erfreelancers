"""Real provider deltas over SSE; failures are explicit, never simulated replies."""
import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from emergentintegrations.llm.chat import TextDelta, StreamDone, UserMessage
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from chat import make_chat
from store import db

router = APIRouter(prefix="/api/chat")
logger = logging.getLogger(__name__)


class Message(BaseModel):
    role: Literal["user", "assistant"]
    text: str = Field(min_length=1, max_length=8000)


class StreamBody(BaseModel):
    sessionId: str = Field(pattern=r"^[a-zA-Z0-9_-]{16,80}$")
    messages: list[Message] = Field(min_length=1, max_length=60)
    userContext: dict | None = None


def event(kind, **data):
    return f"event: {kind}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@router.post("/stream")
async def stream_chat(body: StreamBody, request: Request):
    async def generate():
        turn_id = str(uuid4())
        messages = [m.model_dump() for m in body.messages]
        reply = ""
        yield event("start", sessionId=body.sessionId, turnId=turn_id)
        try:
            async with asyncio.timeout(75):
                await db.chat_turns.insert_one({"id": turn_id, "sessionId": body.sessionId,
                    "messages": messages, "createdAt": datetime.now(timezone.utc), "status": "streaming"})
                chat = make_chat(messages, body.userContext, body.sessionId)
                async for chunk in chat.stream_message(UserMessage(text=messages[-1]["text"])):
                    if await request.is_disconnected():
                        raise asyncio.CancelledError()
                    if isinstance(chunk, TextDelta) and chunk.content:
                        reply += chunk.content
                        yield event("delta", text=chunk.content)
                    elif isinstance(chunk, StreamDone):
                        break
                if not reply.strip():
                    raise ValueError("Empty provider response")
                await db.chat_turns.update_one({"id": turn_id}, {"$set": {"reply": reply, "status": "completed"}})
                yield event("done", sessionId=body.sessionId)
        except asyncio.CancelledError:
            await db.chat_turns.update_one({"id": turn_id}, {"$set": {"reply": reply, "status": "cancelled"}})
            raise
        except Exception as exc:
            logger.warning("Chat stream failed: %s", type(exc).__name__)
            await db.chat_turns.update_one({"id": turn_id}, {"$set": {"reply": reply, "status": "failed"}})
            yield event("error", message="The reply was interrupted. Please retry, or save your enquiry for our team.")
    return StreamingResponse(generate(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no"})