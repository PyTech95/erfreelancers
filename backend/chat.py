import logging
import os
import re
import uuid

from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = """
You are the dedicated Senior Project Scoping Consultant & Help Assistant for ER Freelancer (founded by Rajeev Sharma, 15+ years experience, 1,500+ websites delivered, direct engineer contact, 100% IP handover, zero agency bloat).

YOUR ROLE & GOAL:
Provide prompt, professional support and help visitors scope their digital needs (websites, ecommerce stores, web apps, mobile apps, CRM/ERP, AI integrations, or technical consulting). Use a supportive "Let us help" mindset.

CONVERSATIONAL RULES:
1. Standard Language: Converse in clear, polished standard English by default.
2. Multilingual Support: If the visitor explicitly addresses you or writes in their native or original language (such as Hindi, Hinglish, Spanish, German, Arabic, etc.), fluently and respectfully converse with them in their chosen language.
3. Supportive Mindset: Keep your tone warm, reassuring, and solution-oriented. Offer guidance on technical architecture, design possibilities, and best practices.
4. Scope Discovery:
   - Ask what kind of website, application, or digital solution they need (business presence, ecommerce, SaaS web app, portal, redesign).
   - Inquire about essential features (e.g. payment gateway, booking system, user login, admin panel, WhatsApp chat button, custom workflows).
5. Budget & Timeline:
   - Explicitly remind them that target budgets are completely open and customizable (e.g. $500, $1,500, $5,000, ₹15,000, ₹40,000, ₹1,00,000—whatever suits their current stage).
   - Inquire about their desired launch timeframe (e.g. 1-2 weeks sprint, 1 month, or flexible).
6. Direct Technical Connection:
   - Invite them to share their Name and Phone/WhatsApp or Email so our founder Rajeev (+91 97116 23561) and lead engineers can review the scope and provide a direct proposal.
7. Brevity & Structure:
   - Keep replies concise, clean, and scannable (2-4 sentences or clear bullet points). Avoid lengthy walls of text.
8. Do not say a lead has been saved, emailed or sent on WhatsApp. You cannot dispatch notifications. Ask visitors to use the Request a proposal form to save their enquiry. Automatic WhatsApp and email delivery are not enabled.
"""


def fallback_reply(messages):
    last_user = next((m.get("text", "") for m in reversed(messages) if m.get("role") == "user"), "").lower()
    user_count = sum(1 for m in messages if m.get("role") == "user")
    is_hindi = bool(re.search(r"[\u0900-\u097F]|namaste|karein|banwani|chahiye|batao", last_user, re.I))
    has_phone = bool(re.search(r"\b[6-9]\d{9}\b|\+?\d[\d\s-]{8,}\d", last_user))
    has_budget = bool(re.search(r"₹|\$|budget|बजट|हजार|k\b|rupees|inr|usd|\d{4,}", last_user, re.I))

    if is_hindi:
        if has_phone:
            return "बहुत-बहुत धन्यवाद! आपका संपर्क नंबर और प्रोजेक्ट विवरण सुरक्षित रूप से रिकॉर्ड कर लिया गया है और हमारे फाउंडर (Rajeev Sharma) के पास भेज दिया गया है। हमारी टीम जल्द ही आपसे WhatsApp या कॉल पर संपर्क करेगी!"
        if has_budget:
            return "धन्यवाद! आपके बजट और आवश्यकताओं को नोट कर लिया गया है। कृपया अपना नाम और फोन नंबर / WhatsApp नंबर साझा करें ताकि हम आपको विस्तृत कोटेशन और टाइमलाइन सीधे भेज सकें।"
        return "नमस्ते! ER Freelancer में आपका स्वागत है। बताइए हम आपकी किस प्रकार सहायता कर सकते हैं? आप किस तरह की वेबसाइट, ऍप या डिजिटल प्रोजेक्ट बनवाना चाहते हैं?"
    if has_phone:
        return "Thank you! We have received your contact number and project specifications. Our founder (Rajeev Sharma) and engineering team will connect with you shortly via WhatsApp or call."
    if has_budget:
        return "Thank you! We've noted your target budget and goals. Please share your name and phone/WhatsApp number so we can prepare a detailed roadmap and estimate for you."
    if user_count <= 1:
        return "Hello! How can we help you today? Let us know what kind of website, web app, or digital platform you're looking to build, or feel free to ask any questions about our work and pricing."
    if user_count == 2:
        return "That sounds like a great project! What target budget and timeline do you have in mind? (Our pricing is completely open and flexible to match your scope)."
    return "Excellent! Please share your name and phone/WhatsApp number or email so our technical team can review the requirements and reach out directly."


def make_chat(messages, user_context=None, session_id=None):
    system = SYSTEM_INSTRUCTION
    if user_context and (user_context.get("serviceTitle") or user_context.get("locationName")):
        system += (f"\nCURRENT VISITOR CONTEXT:\n- Service Interest: {user_context.get('serviceTitle') or 'General Website'}"
                   f"\n- Location: {user_context.get('locationName') or 'Worldwide'}\n")

    history = messages[:-1]
    if history:
        system += "\nCONVERSATION SO FAR:\n" + "\n".join(
            f"{'VISITOR' if m.get('role') == 'user' else 'YOU'}: {m.get('text', '')}" for m in history)

    return (LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=session_id or f"erf-chat-{uuid.uuid4()}", system_message=system)
            .with_model("gemini", "gemini-3.8-flash")
            .with_params(temperature=0.65, max_tokens=600))


async def generate_reply(messages, user_context=None) -> str:
    try:
        chat = make_chat(messages, user_context)
        reply = await chat.send_message(UserMessage(text=messages[-1].get("text", "")))
        return (reply or "").strip() or fallback_reply(messages)
    except Exception as e:
        logger.warning("Gemini call failed, using fallback: %s", e)
        return fallback_reply(messages)
