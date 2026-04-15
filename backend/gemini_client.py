"""
Google Gemini AI client for incident analysis, root cause detection,
fix suggestions, and avatar assistant responses.
"""
import google.generativeai as genai
from config import settings

def _get_model():
    genai.configure(api_key=settings.GEMINI_API_KEY)
    return genai.GenerativeModel("gemini-2.5-flash")

SYSTEM_CONTEXT = """
You are Aegis, an expert AI Site Reliability Engineer (SRE).
You help DevOps teams understand alerts, find root causes, and resolve incidents.
You have access to past incident history and can recognize patterns.
Be concise, technical, and actionable. When you know the fix, say it directly.
"""

def analyze_alert(alert_title: str, alert_description: str, similar_incidents: list[dict]) -> dict:
    """Analyze an incoming alert using Gemini + past incident context."""
    past_context = ""
    if similar_incidents:
        past_context = "\n\nSimilar past incidents:\n"
        for inc in similar_incidents:
            past_context += f"- [{inc['similarity_score']:.0%} match] {inc['title']} → Fixed by: {inc['resolution']}\n"

    prompt = f"""{SYSTEM_CONTEXT}

New Alert:
Title: {alert_title}
Description: {alert_description}
{past_context}

Provide:
1. Root cause (likely)
2. Recommended fix (step by step)
3. Is this a duplicate/known issue? (yes/no + reason)
4. Auto-heal possible? (yes/no + what action)

Respond in JSON format:
{{
  "root_cause": "...",
  "fix_steps": ["step1", "step2"],
  "is_duplicate": true/false,
  "duplicate_reason": "...",
  "auto_heal_possible": true/false,
  "auto_heal_action": "..."
}}"""

    response = _get_model().generate_content(prompt)
    import json, re
    text = response.text
    # extract JSON from response
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        return json.loads(match.group())
    return {"root_cause": text, "fix_steps": [], "is_duplicate": False, "auto_heal_possible": False}

def chat_with_assistant(user_message: str, incident_context: str = "", conversation_history: list = []) -> str:
    """Conversational assistant for the avatar UI."""
    history_text = ""
    for msg in conversation_history[-6:]:
        history_text += f"{msg['role'].upper()}: {msg['content']}\n"

    prompt = f"""{SYSTEM_CONTEXT}

{f'Current incident context: {incident_context}' if incident_context else ''}
{f'Conversation so far:\n{history_text}' if history_text else ''}

User: {user_message}

Respond naturally as Aegis. Be helpful, concise, and human-like. Max 3 sentences for avatar responses."""

    try:
        response = _get_model().generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Gemini error: {str(e)}"
