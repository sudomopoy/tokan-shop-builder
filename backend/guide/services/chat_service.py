"""
سرویس چت RAG برای پاسخ‌گویی بر اساس مستندات.
محدودیت توکن: ورودی (پرامپت + تاریخچه) و خروجی برای جلوگیری از سوءاستفاده.
"""
import os
from typing import Optional

from ..models import PageGuide
from .vector_store import VectorStoreService

SYSTEM_PROMPT = """شما یک دستیار راهنمای فارسی برای پنل مدیریت فروشگاه اینترنتی هستید. بر اساس متن‌های زیر که از مستندات استخراج شده، به سوال کاربر پاسخ دهید. پاسخ‌ها باید کوتاه، مفید و به زبان فارسی باشند. اگر پاسخ در متن‌ها نبود، بگویید که در مستندات موجود یافت نشد."""

# حدود توکن (تقریبی: ~3 کاراکتر = 1 توکن برای فارسی/انگلیسی)
MAX_INPUT_CHARS = int(os.environ.get("GUIDE_CHAT_MAX_INPUT_CHARS", "8000"))  # پرامپت کاربر + تاریخچه
MAX_OUTPUT_TOKENS = int(os.environ.get("GUIDE_CHAT_MAX_OUTPUT_TOKENS", "500"))
MAX_MESSAGE_CHARS = int(os.environ.get("GUIDE_CHAT_MAX_MESSAGE_CHARS", "2000"))  # طول هر پیام
MAX_HISTORY_ITEMS = 6
MAX_HISTORY_ITEM_CHARS = 500
MAX_CONTEXT_CHARS = 4000  # مجموع chunkهای RAG


def _truncate(text: str, max_chars: int) -> str:
    if not text or len(text) <= max_chars:
        return text or ""
    return text[: max_chars - 20] + "… [متن کوتاه شد]"


def _find_page_guide(path: str) -> Optional[PageGuide]:
    path = (path or "").strip()
    if not path or not path.startswith("/"):
        path = "/"
    path_norm = path.rstrip("/") or "/"
    best = None
    for g in PageGuide.objects.all():
        p = (g.path or "").rstrip("/") or "/"
        if path_norm == p or path_norm.startswith(p + "/"):
            if best is None or len(p) >= len((best.path or "").rstrip("/")):
                best = g
    return best


def chat(message: str, path: str, conversation_history: Optional[list[dict]] = None) -> tuple[str, bool]:
    """
    پاسخ‌دهی به سوال کاربر با RAG.
    Returns (response_text, success).
    """
    conversation_history = conversation_history or []
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return "پیکربندی هوش مصنوعی برای فروشگاه    انجام نشده است. لطفاً با پشتیبانی تماس بگیرید.", False

    vs = VectorStoreService()
    if not vs.is_available():
        return "سیستم جستجوی مستندات در دسترس نیست.", False

    page_guide = _find_page_guide(path)
    doc_section_ids = None
    if page_guide and page_guide.doc_sections.exists():
        doc_section_ids = [str(d.id) for d in page_guide.doc_sections.all()]

    chunks = vs.query(question=message, doc_section_ids=doc_section_ids, top_k=5)
    context = ""
    if chunks:
        raw = "\n\n".join(c["content"] for c in chunks)
        context = _truncate(raw, MAX_CONTEXT_CHARS)
    else:
        context = "مستندی برای این سوال یافت نشد."

    # محدودیت ورودی: پیام فعلی و تاریخچه
    message_limited = _truncate(message, MAX_MESSAGE_CHARS)
    history_limited = []
    for h in conversation_history[-MAX_HISTORY_ITEMS:]:
        role = h.get("role", "user")
        content = h.get("content", "")
        if role in ("user", "assistant") and content:
            history_limited.append({"role": role, "content": _truncate(str(content), MAX_HISTORY_ITEM_CHARS)})

    system_content = f"{SYSTEM_PROMPT}\n\n---\nمستندات:\n{context}"
    if len(system_content) > MAX_INPUT_CHARS:
        system_content = _truncate(system_content, MAX_INPUT_CHARS)

    messages = [{"role": "system", "content": system_content}]
    for h in history_limited:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message_limited})

    try:
        from openai import OpenAI
        openai_api_base = os.environ.get("OPENAI_API_BASE")
        client_params = {"api_key": api_key}
        if openai_api_base:
            client_params["base_url"] = openai_api_base
        client = OpenAI(**client_params)
        resp = client.chat.completions.create(
            model=os.environ.get("OPENAI_CHAT_MODEL", "gpt-4o-mini"),
            messages=messages,
            max_tokens=min(MAX_OUTPUT_TOKENS, 4096),
        )
        text = (resp.choices[0].message.content or "").strip()
        return text or "پاسخی تولید نشد.", True
    except Exception as e:
        return f"خطا در تولید پاسخ: {str(e)}", False
