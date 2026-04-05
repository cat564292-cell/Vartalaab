"""
VarTalaab FastAPI backend — fast translation + AI assistant.
Run: uvicorn main:app --reload --port 8000
"""
from __future__ import annotations
import os, json, httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="VarTalaab API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

GOOGLE_KEY = os.getenv("VITE_GOOGLE_TRANSLATE_API_KEY", "")
OPENAI_KEY = os.getenv("VITE_OPENAI_API_KEY", "")

# ── Models ────────────────────────────────────────────────────────────────────

class TranslateReq(BaseModel):
    text: str
    from_lang: str = "auto"
    to_lang: str = "en"

class AIReq(BaseModel):
    text: str
    sourceLang: str = "en"
    targetLang: str = "es"

# ── Helpers ───────────────────────────────────────────────────────────────────

async def google_translate(text: str, source: str, target: str) -> dict:
    if not GOOGLE_KEY:
        raise ValueError("No Google key")
    url = "https://translation.googleapis.com/language/translate/v2"
    params: dict = {"key": GOOGLE_KEY, "q": text, "target": target, "format": "text"}
    if source != "auto":
        params["source"] = source
    async with httpx.AsyncClient(timeout=8) as c:
        r = await c.post(url, params=params)
        r.raise_for_status()
        d = r.json()["data"]["translations"][0]
        return {
            "translatedText": d["translatedText"],
            "detectedSourceLanguage": d.get("detectedSourceLanguage", source),
        }

async def mymemory_translate(text: str, source: str, target: str) -> str:
    src = "en" if source == "auto" else source
    async with httpx.AsyncClient(timeout=8) as c:
        r = await c.get(
            "https://api.mymemory.translated.net/get",
            params={"q": text, "langpair": f"{src}|{target}"},
        )
        r.raise_for_status()
        return r.json()["responseData"]["translatedText"]

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/translate")
async def translate(req: TranslateReq):
    if not req.text.strip():
        raise HTTPException(400, "Empty text")
    try:
        result = await google_translate(req.text, req.from_lang, req.to_lang)
        return {"translatedText": result["translatedText"],
                "detectedSourceLanguage": result["detectedSourceLanguage"],
                "provider": "google"}
    except Exception:
        pass
    try:
        t = await mymemory_translate(req.text, req.from_lang, req.to_lang)
        return {"translatedText": t, "provider": "mymemory"}
    except Exception as e:
        raise HTTPException(502, f"All translation engines failed: {e}")

@app.post("/ai-assistant")
async def ai_assistant(req: AIReq):
    if not req.text.strip():
        raise HTTPException(400, "Empty text")

    translated = ""
    provider = "mymemory"
    try:
        r = await google_translate(req.text, req.sourceLang, req.targetLang)
        translated = r["translatedText"]
        provider = "google"
    except Exception:
        try:
            translated = await mymemory_translate(req.text, req.sourceLang, req.targetLang)
        except Exception:
            translated = req.text

    detail = None
    if OPENAI_KEY:
        try:
            prompt = (
                f"Translate '{req.text}' from {req.sourceLang} to {req.targetLang}. "
                "Return JSON with keys: translatedText, type, definition, usage, context, "
                "formality, pronunciation, partOfSpeech, examples (array), synonyms (array), cultural"
            )
            async with httpx.AsyncClient(timeout=10) as c:
                r2 = await c.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {OPENAI_KEY}"},
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [{"role": "user", "content": prompt}],
                        "response_format": {"type": "json_object"},
                        "max_tokens": 400,
                    },
                )
                r2.raise_for_status()
                detail = json.loads(r2.json()["choices"][0]["message"]["content"])
                translated = detail.pop("translatedText", translated)
        except Exception:
            pass

    return {
        "originalText": req.text,
        "translatedText": translated,
        "sourceLanguage": req.sourceLang,
        "targetLanguage": req.targetLang,
        "provider": provider,
        "detailedInfo": detail,
    }
