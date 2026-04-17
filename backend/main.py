"""
VarTalaab FastAPI backend
Run: uvicorn main:app --reload --port 8000
"""
from __future__ import annotations
import os, json, re, httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="VarTalaab API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

RAPIDAPI_KEY  = os.getenv("VITE_RAPIDAPI_KEY", "48ee68b2dcmsha1b4b92776621f4p151e90jsna17c78afdc2b")
GOOGLE_KEY    = os.getenv("VITE_GOOGLE_TRANSLATE_API_KEY", "")
OPENAI_KEY    = os.getenv("VITE_OPENAI_API_KEY", "")

LANG_MAP = {"zh-Hans": "zh-CN", "zh-Hant": "zh-TW"}

def to_code(code: str) -> str:
    return LANG_MAP.get(code, code)

# ── Models ────────────────────────────────────────────────────────────────────

class TranslateReq(BaseModel):
    text: str
    from_lang: str = "auto"
    to_lang: str = "en"

class AIReq(BaseModel):
    text: str
    sourceLang: str = "en"
    targetLang: str = "es"

class SmartReq(BaseModel):
    text: str
    targetLang: str = "en"

class GrammarReq(BaseModel):
    text: str

# ── Translation helpers ───────────────────────────────────────────────────────

async def rapidapi_translate(text: str, source: str, target: str) -> str:
    src = "auto" if source == "auto" else to_code(source)
    tgt = to_code(target)
    async with httpx.AsyncClient(timeout=10) as c:
        r = await c.post(
            "https://google-translate113.p.rapidapi.com/api/v1/translator/text",
            headers={
                "Content-Type": "application/json",
                "X-RapidAPI-Key": RAPIDAPI_KEY,
                "X-RapidAPI-Host": "google-translate113.p.rapidapi.com",
            },
            json={"from": src, "to": tgt, "text": text[:5000]},
        )
        if r.status_code == 200:
            d = r.json()
            result = d.get("trans") or d.get("translation") or d.get("translatedText")
            if result:
                return result
    raise ValueError("RapidAPI translation failed")

async def google_translate(text: str, source: str, target: str) -> str:
    if not GOOGLE_KEY:
        raise ValueError("No Google key")
    params: dict = {"key": GOOGLE_KEY, "q": text, "target": to_code(target), "format": "text"}
    if source != "auto":
        params["source"] = to_code(source)
    async with httpx.AsyncClient(timeout=8) as c:
        r = await c.post("https://translation.googleapis.com/language/translate/v2", params=params)
        r.raise_for_status()
        return r.json()["data"]["translations"][0]["translatedText"]

async def mymemory_translate(text: str, source: str, target: str) -> str:
    src = "en" if source == "auto" else to_code(source)
    async with httpx.AsyncClient(timeout=8) as c:
        r = await c.get(
            "https://api.mymemory.translated.net/get",
            params={"q": text[:450], "langpair": f"{src}|{to_code(target)}"},
        )
        r.raise_for_status()
        return r.json()["responseData"]["translatedText"]

async def best_translate(text: str, source: str, target: str) -> tuple[str, str]:
    """Returns (translated_text, provider)"""
    for fn, name in [
        (rapidapi_translate, "rapidapi"),
        (google_translate, "google"),
        (mymemory_translate, "mymemory"),
    ]:
        try:
            return await fn(text, source, target), name
        except Exception:
            continue
    raise HTTPException(502, "All translation engines failed")

# ── Grammar helpers ───────────────────────────────────────────────────────────

GRAMMAR_RULES = [
    (r"\bhe go\b",      "he goes",    "Subject-verb agreement"),
    (r"\bshe go\b",     "she goes",   "Subject-verb agreement"),
    (r"\bit go\b",      "it goes",    "Subject-verb agreement"),
    (r"\bi goes\b",     "I go",       "Subject-verb agreement"),
    (r"\bthey goes\b",  "they go",    "Subject-verb agreement"),
    (r"\ba apple\b",    "an apple",   "Article usage"),
    (r"\ba orange\b",   "an orange",  "Article usage"),
    (r"\ban car\b",     "a car",      "Article usage"),
    (r"\bim\b",         "I'm",        "Contraction spelling"),
    (r"\bdont\b",       "don't",      "Contraction spelling"),
    (r"\bcant\b",       "can't",      "Contraction spelling"),
    (r"\bwont\b",       "won't",      "Contraction spelling"),
    (r"\bisnt\b",       "isn't",      "Contraction spelling"),
    (r"\barent\b",      "aren't",     "Contraction spelling"),
    (r"\bwasnt\b",      "wasn't",     "Contraction spelling"),
    (r"\bwerent\b",     "weren't",    "Contraction spelling"),
    (r"\bhasnt\b",      "hasn't",     "Contraction spelling"),
    (r"\bhavent\b",     "haven't",    "Contraction spelling"),
    (r"\bhadnt\b",      "hadn't",     "Contraction spelling"),
    (r"\bwouldnt\b",    "wouldn't",   "Contraction spelling"),
    (r"\bcouldnt\b",    "couldn't",   "Contraction spelling"),
    (r"\bshouldnt\b",   "shouldn't",  "Contraction spelling"),
]

AUTOCOMPLETE = {
    "how are":    ["how are you?", "how are you doing?", "how are things going?"],
    "thank you":  ["thank you very much", "thank you for your help", "thank you so much"],
    "i would":    ["I would like to", "I would appreciate it", "I would love to"],
    "nice to":    ["nice to meet you", "nice to see you again", "nice to talk to you"],
    "good":       ["good morning", "good afternoon", "good evening", "good night"],
    "see you":    ["see you later", "see you soon", "see you tomorrow"],
    "i am":       ["I am doing well", "I am happy to help", "I am looking forward to"],
    "can you":    ["can you help me?", "can you please explain?", "can you translate this?"],
    "please":     ["please help me", "please translate", "please explain this"],
}

SYNONYMS = {
    "good":    ["great", "excellent", "wonderful", "fantastic", "superb"],
    "bad":     ["poor", "terrible", "awful", "unfortunate", "dreadful"],
    "big":     ["large", "huge", "enormous", "massive", "gigantic"],
    "small":   ["tiny", "little", "compact", "petite", "miniature"],
    "happy":   ["joyful", "delighted", "pleased", "cheerful", "elated"],
    "sad":     ["unhappy", "sorrowful", "melancholy", "dejected", "gloomy"],
    "fast":    ["quick", "rapid", "swift", "speedy", "brisk"],
    "slow":    ["sluggish", "gradual", "leisurely", "unhurried", "plodding"],
    "smart":   ["intelligent", "clever", "brilliant", "sharp", "astute"],
    "beautiful": ["gorgeous", "stunning", "lovely", "exquisite", "radiant"],
}

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0", "engines": ["rapidapi", "google", "mymemory"]}

@app.post("/translate")
async def translate(req: TranslateReq):
    if not req.text.strip():
        raise HTTPException(400, "Empty text")
    translated, provider = await best_translate(req.text, req.from_lang, req.to_lang)
    return {"translatedText": translated, "provider": provider}

@app.post("/smart-suggest")
async def smart_suggest(req: SmartReq):
    """Returns grammar corrections, autocomplete, and synonym suggestions."""
    text = req.text.strip()
    if not text:
        return {"suggestions": []}

    suggestions = []

    # 1. Grammar corrections
    corrected = text
    changes = []
    for pattern, replacement, message in GRAMMAR_RULES:
        match = re.search(pattern, corrected, re.IGNORECASE)
        if match:
            changes.append({"original": match.group(), "corrected": replacement, "message": message})
            corrected = re.sub(pattern, replacement, corrected, flags=re.IGNORECASE)

    if changes:
        suggestions.append({
            "id": "grammar",
            "type": "grammar",
            "text": corrected,
            "label": "Grammar Fix",
            "changes": changes,
        })

    # 2. Autocomplete
    lower = text.lower()
    for trigger, completions in AUTOCOMPLETE.items():
        if lower.endswith(trigger) or (trigger + " ") in lower:
            for i, c in enumerate(completions[:2]):
                if c.lower() not in lower:
                    suggestions.append({
                        "id": f"auto-{trigger}-{i}",
                        "type": "autocomplete",
                        "text": c,
                        "label": "Autocomplete",
                    })

    # 3. Synonym replacements
    words = re.findall(r"\b\w+\b", lower)
    seen_words: set[str] = set()
    for word in words:
        if word in SYNONYMS and word not in seen_words:
            seen_words.add(word)
            for i, syn in enumerate(SYNONYMS[word][:2]):
                suggestions.append({
                    "id": f"syn-{word}-{i}",
                    "type": "synonym",
                    "text": re.sub(rf"\b{word}\b", syn, text, flags=re.IGNORECASE, count=1),
                    "label": f"Replace '{word}' → '{syn}'",
                })

    # 4. If OpenAI available, get AI suggestion
    if OPENAI_KEY and len(text) > 5:
        try:
            async with httpx.AsyncClient(timeout=8) as c:
                r = await c.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {OPENAI_KEY}"},
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [{
                            "role": "user",
                            "content": f"Improve this text for translation to {req.targetLang}. Return only the improved text, nothing else: '{text}'"
                        }],
                        "max_tokens": 150,
                    },
                )
                r.raise_for_status()
                improved = r.json()["choices"][0]["message"]["content"].strip().strip("'\"")
                if improved and improved.lower() != text.lower():
                    suggestions.insert(0, {
                        "id": "ai-improve",
                        "type": "ai",
                        "text": improved,
                        "label": "AI Enhanced",
                    })
        except Exception:
            pass

    return {"suggestions": suggestions[:6]}

@app.post("/grammar-check")
async def grammar_check(req: GrammarReq):
    text = req.text.strip()
    errors = []
    for pattern, replacement, message in GRAMMAR_RULES:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            errors.append({
                "start": match.start(),
                "end": match.end(),
                "original": match.group(),
                "suggestion": replacement,
                "message": message,
            })
    return {"errors": errors, "hasErrors": len(errors) > 0}

@app.post("/ai-assistant")
async def ai_assistant(req: AIReq):
    if not req.text.strip():
        raise HTTPException(400, "Empty text")

    translated, provider = await best_translate(req.text, req.sourceLang, req.targetLang)

    detail = None
    if OPENAI_KEY:
        try:
            prompt = (
                f"Translate '{req.text}' from {req.sourceLang} to {req.targetLang}. "
                "Return JSON with keys: translatedText, type, definition, usage, context, "
                "formality, pronunciation, partOfSpeech, examples (array), synonyms (array), cultural"
            )
            async with httpx.AsyncClient(timeout=10) as c:
                r = await c.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {OPENAI_KEY}"},
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [{"role": "user", "content": prompt}],
                        "response_format": {"type": "json_object"},
                        "max_tokens": 400,
                    },
                )
                r.raise_for_status()
                detail = json.loads(r.json()["choices"][0]["message"]["content"])
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
