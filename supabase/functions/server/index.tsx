import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-e0a50523/health", (c) => {
  return c.json({ status: "ok" });
});

// Translation endpoint using Microsoft Translator API
app.post("/make-server-e0a50523/translate", async (c) => {
  try {
    const { text, from, to } = await c.req.json();
    
    if (!text || !to) {
      return c.json({ error: "Missing required fields: text and to" }, 400);
    }

    console.log(`Translation request: "${text}" from ${from || 'auto'} to ${to}`);

    // Try Microsoft Translator API first (already configured)
    const msApiKey = Deno.env.get('MICROSOFT_TRANSLATOR_API_KEY');
    
    if (msApiKey) {
      try {
        const msUrl = 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0';
        const params = new URLSearchParams();
        params.append('to', to);
        if (from && from !== 'auto' && from !== null) {
          params.append('from', from);
        }
        
        const msResponse = await fetch(`${msUrl}&${params.toString()}`, {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': msApiKey,
            'Ocp-Apim-Subscription-Region': 'global',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([{ text }]),
        });

        if (msResponse.ok) {
          const msData = await msResponse.json();
          if (msData && msData[0] && msData[0].translations && msData[0].translations[0]) {
            const result = {
              translatedText: msData[0].translations[0].text,
              detectedLanguage: msData[0].detectedLanguage?.language || from || 'unknown'
            };
            console.log(`Translation successful via Microsoft: ${result.translatedText}`);
            return c.json(result);
          }
        } else {
          const errorText = await msResponse.text();
          console.log(`Microsoft Translator error: ${msResponse.status} - ${errorText}`);
        }
      } catch (msError) {
        console.log(`Microsoft Translator failed: ${msError.message}`);
      }
    }

    // Fallback to Google Translate via RapidAPI
    const rapidApiKey = '48ee68b2dcmsha1b4b92776621f4p151e90jsna17c78afdc2b';
    
    try {
      const url = 'https://google-translate1.p.rapidapi.com/language/translate/v2';
      
      const formData = new URLSearchParams();
      formData.append('q', text);
      formData.append('target', to);
      if (from && from !== 'auto' && from !== null) {
        formData.append('source', from);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'google-translate1.p.rapidapi.com',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`RapidAPI Translation error: ${response.status} - ${errorText}`);
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || !data.data || !data.data.translations || !data.data.translations[0]) {
        throw new Error('Invalid response from translation API');
      }

      const result = {
        translatedText: data.data.translations[0].translatedText,
        detectedLanguage: data.data.translations[0].detectedSourceLanguage || from || 'unknown'
      };

      console.log(`Translation successful via RapidAPI: ${result.translatedText}`);
      return c.json(result);
    } catch (apiError) {
      console.log(`All translation APIs failed. Using fallback demo mode.`);
      
      // Ultimate fallback - demo mode
      const demoTranslations: any = {
        'hello': { es: 'hola', fr: 'bonjour', de: 'hallo', it: 'ciao', pt: 'olá', ja: 'こんにちは', zh: '你好', ar: 'مرحبا', hi: 'नमस्ते' },
        'thank you': { es: 'gracias', fr: 'merci', de: 'danke', it: 'grazie', pt: 'obrigado', ja: 'ありがとう', zh: '谢谢', ar: 'شكرا', hi: 'धन्यवाद' },
        'goodbye': { es: 'adiós', fr: 'au revoir', de: 'auf wiedersehen', it: 'arrivederci', pt: 'adeus', ja: 'さようなら', zh: '再见', ar: 'وداعا', hi: 'अलविदा' },
        'yes': { es: 'sí', fr: 'oui', de: 'ja', it: 'sì', pt: 'sim', ja: 'はい', zh: '是', ar: 'نعم', hi: 'हाँ' },
        'no': { es: 'no', fr: 'non', de: 'nein', it: 'no', pt: 'não', ja: 'いいえ', zh: '不', ar: 'لا', hi: 'नहीं' },
      };
      
      const lowerText = text.toLowerCase().trim();
      let translatedText = text;
      
      if (demoTranslations[lowerText] && demoTranslations[lowerText][to]) {
        translatedText = demoTranslations[lowerText][to];
      } else {
        translatedText = `[Demo] ${text} (${to})`;
      }
      
      return c.json({
        translatedText,
        detectedLanguage: from || 'en',
        demo: true
      });
    }
  } catch (error) {
    console.log(`Translation error: ${error.message}`);
    return c.json({ error: `Translation failed: ${error.message}` }, 500);
  }
});

// Enhanced AI assistant endpoint with detailed word information
app.post("/make-server-e0a50523/ai-assistant", async (c) => {
  try {
    const { text, sourceLang, targetLang } = await c.req.json();
    
    if (!text || !targetLang) {
      return c.json({ error: "Missing required fields: text and targetLang" }, 400);
    }

    console.log(`AI Assistant request: "${text}" from ${sourceLang || 'auto'} to ${targetLang}`);

    // Get translation - use direct translation logic instead of making another HTTP call
    let translatedText = text;
    let detectedLang = sourceLang || 'auto';
    
    try {
      // Try Microsoft Translator API first
      const msApiKey = Deno.env.get('MICROSOFT_TRANSLATOR_API_KEY');
      
      if (msApiKey) {
        const msUrl = 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0';
        const params = new URLSearchParams();
        params.append('to', targetLang);
        if (sourceLang && sourceLang !== 'auto' && sourceLang !== null) {
          params.append('from', sourceLang);
        }
        
        const msResponse = await fetch(`${msUrl}&${params.toString()}`, {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': msApiKey,
            'Ocp-Apim-Subscription-Region': 'global',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([{ text }]),
        });

        if (msResponse.ok) {
          const msData = await msResponse.json();
          if (msData && msData[0] && msData[0].translations && msData[0].translations[0]) {
            translatedText = msData[0].translations[0].text;
            detectedLang = msData[0].detectedLanguage?.language || sourceLang || 'en';
            console.log(`AI Assistant translation successful via Microsoft: ${translatedText}`);
          }
        }
      }
    } catch (translateError) {
      console.log(`Translation error in AI Assistant: ${translateError.message}`);
      // Continue with original text if translation fails
    }

    // Enhanced word information database
    const wordInfo = getWordInformation(text.toLowerCase().trim(), detectedLang, targetLang);

    // Build comprehensive response
    const response = {
      originalText: text,
      translatedText: translatedText,
      sourceLanguage: getLanguageName(detectedLang),
      targetLanguage: getLanguageName(targetLang),
      detailedInfo: wordInfo
    };

    console.log(`AI Assistant response generated successfully`);
    return c.json(response);
  } catch (error) {
    console.log(`AI Assistant error: ${error.message}`);
    return c.json({ error: `AI Assistant failed: ${error.message}` }, 500);
  }
});

// Helper function to get detailed word information
function getWordInformation(text: string, sourceLang: string, targetLang: string) {
  // Comprehensive word information database
  const wordDatabase: any = {
    'hello': {
      type: 'Greeting',
      definition: 'A common greeting used when meeting someone or starting a conversation',
      context: 'Informal/Formal',
      usage: 'Used at any time of day to greet someone',
      examples: [
        'Hello, how are you?',
        'Hello! Nice to meet you.',
        'Say hello to your family for me.'
      ],
      synonyms: ['Hi', 'Hey', 'Greetings', 'Good day'],
      cultural: 'Universally recognized greeting in English-speaking countries',
      formality: 'Neutral - can be used in both casual and formal settings',
      pronunciation: 'heh-LOH',
      partOfSpeech: 'Interjection / Noun'
    },
    'hi': {
      type: 'Greeting',
      definition: 'An informal greeting used in casual conversations',
      context: 'Informal',
      usage: 'Commonly used among friends, family, and in casual settings',
      examples: [
        'Hi! What\'s up?',
        'Hi there, long time no see!',
        'Just wanted to say hi.'
      ],
      synonyms: ['Hello', 'Hey', 'Howdy', 'What\'s up'],
      cultural: 'Very casual and friendly greeting, popular in modern English',
      formality: 'Informal - best for casual conversations',
      pronunciation: 'hahy',
      partOfSpeech: 'Interjection'
    },
    'thank you': {
      type: 'Expression of Gratitude',
      definition: 'A polite expression used to show appreciation or gratitude',
      context: 'Formal/Informal',
      usage: 'Used when someone does something helpful or kind',
      examples: [
        'Thank you for your help.',
        'Thank you so much!',
        'I wanted to say thank you for everything.'
      ],
      synonyms: ['Thanks', 'Many thanks', 'I appreciate it', 'Much obliged'],
      cultural: 'Essential expression of politeness in English-speaking cultures',
      formality: 'Neutral to formal - more formal than "thanks"',
      pronunciation: 'THANGK yoo',
      partOfSpeech: 'Phrase / Interjection'
    },
    'thanks': {
      type: 'Expression of Gratitude',
      definition: 'An informal way to express gratitude or appreciation',
      context: 'Informal',
      usage: 'Quick and casual way to show appreciation',
      examples: [
        'Thanks for the coffee!',
        'Thanks, I appreciate it.',
        'Thanks a lot!'
      ],
      synonyms: ['Thank you', 'Cheers', 'Ta', 'Thx'],
      cultural: 'Very common in everyday English conversations',
      formality: 'Informal - casual expression of gratitude',
      pronunciation: 'THANGKS',
      partOfSpeech: 'Interjection / Plural noun'
    },
    'goodbye': {
      type: 'Farewell',
      definition: 'A parting phrase used when leaving someone',
      context: 'Formal/Informal',
      usage: 'Used when ending a conversation or departing',
      examples: [
        'Goodbye, see you tomorrow!',
        'It\'s time to say goodbye.',
        'Goodbye and good luck!'
      ],
      synonyms: ['Bye', 'Farewell', 'See you', 'Take care'],
      cultural: 'Standard farewell in English-speaking countries',
      formality: 'Neutral - slightly more formal than "bye"',
      pronunciation: 'good-BAHY',
      partOfSpeech: 'Interjection / Noun'
    },
    'bye': {
      type: 'Farewell',
      definition: 'A casual way to say goodbye to someone',
      context: 'Informal',
      usage: 'Quick farewell in casual conversations',
      examples: [
        'Bye! See you later!',
        'Okay, bye now.',
        'Say bye to everyone for me.'
      ],
      synonyms: ['Goodbye', 'See ya', 'Later', 'Catch you later'],
      cultural: 'Very common informal farewell',
      formality: 'Informal - best for casual settings',
      pronunciation: 'bahy',
      partOfSpeech: 'Interjection'
    },
    'yes': {
      type: 'Affirmative Response',
      definition: 'Used to give an affirmative answer or show agreement',
      context: 'Formal/Informal',
      usage: 'Responding positively to questions or statements',
      examples: [
        'Yes, I agree.',
        'Yes, please!',
        'The answer is yes.'
      ],
      synonyms: ['Yeah', 'Yep', 'Affirmative', 'Indeed', 'Certainly'],
      cultural: 'Universal affirmative response in English',
      formality: 'Neutral - appropriate for all contexts',
      pronunciation: 'yes',
      partOfSpeech: 'Adverb / Interjection'
    },
    'no': {
      type: 'Negative Response',
      definition: 'Used to give a negative answer or show disagreement',
      context: 'Formal/Informal',
      usage: 'Responding negatively to questions or declining offers',
      examples: [
        'No, I don\'t think so.',
        'No, thank you.',
        'The answer is no.'
      ],
      synonyms: ['Nope', 'Nah', 'Negative', 'Not at all'],
      cultural: 'Universal negative response in English',
      formality: 'Neutral - appropriate for all contexts',
      pronunciation: 'noh',
      partOfSpeech: 'Adverb / Interjection / Adjective'
    },
    'please': {
      type: 'Polite Request',
      definition: 'Used to make a polite request or add politeness to a statement',
      context: 'Formal/Informal',
      usage: 'Essential for polite requests and showing good manners',
      examples: [
        'Please help me.',
        'Can you please pass the salt?',
        'Please, come in.'
      ],
      synonyms: ['Kindly', 'If you would', 'Could you'],
      cultural: 'Fundamental word for politeness in English',
      formality: 'Neutral - essential for politeness',
      pronunciation: 'pleez',
      partOfSpeech: 'Adverb / Verb'
    },
    'sorry': {
      type: 'Apology',
      definition: 'Used to express regret, sympathy, or ask for pardon',
      context: 'Formal/Informal',
      usage: 'Apologizing or expressing sympathy',
      examples: [
        'I\'m sorry for being late.',
        'Sorry to hear that.',
        'Sorry, I didn\'t catch that.'
      ],
      synonyms: ['Apologies', 'Pardon', 'Excuse me', 'My bad'],
      cultural: 'Important expression for showing empathy and taking responsibility',
      formality: 'Neutral - varies with tone and context',
      pronunciation: 'SAW-ree',
      partOfSpeech: 'Adjective / Interjection'
    },
    'love': {
      type: 'Emotion/Feeling',
      definition: 'An intense feeling of deep affection or strong liking',
      context: 'Personal/Emotional',
      usage: 'Expressing affection, care, or strong preference',
      examples: [
        'I love you.',
        'I love chocolate!',
        'She loves to read books.'
      ],
      synonyms: ['Adore', 'Cherish', 'Care for', 'Be fond of'],
      cultural: 'Central concept in human relationships and emotions',
      formality: 'Informal to intimate - context dependent',
      pronunciation: 'luhv',
      partOfSpeech: 'Noun / Verb'
    },
    'friend': {
      type: 'Relationship',
      definition: 'A person with whom one has a bond of mutual affection',
      context: 'Social',
      usage: 'Describing close personal relationships',
      examples: [
        'She is my best friend.',
        'I\'m meeting friends tonight.',
        'Friends help each other.'
      ],
      synonyms: ['Buddy', 'Pal', 'Companion', 'Mate'],
      cultural: 'Important social concept across all cultures',
      formality: 'Neutral - universally understood',
      pronunciation: 'frend',
      partOfSpeech: 'Noun / Verb'
    },
    'help': {
      type: 'Assistance',
      definition: 'To make it easier for someone to do something; to assist',
      context: 'Practical',
      usage: 'Offering or requesting assistance',
      examples: [
        'Can you help me?',
        'I need help with this.',
        'How can I help you?'
      ],
      synonyms: ['Assist', 'Aid', 'Support', 'Lend a hand'],
      cultural: 'Universal concept of mutual support',
      formality: 'Neutral - appropriate for all contexts',
      pronunciation: 'help',
      partOfSpeech: 'Verb / Noun'
    },
    'welcome': {
      type: 'Greeting/Response',
      definition: 'A greeting of gladness or response to thanks',
      context: 'Formal/Informal',
      usage: 'Welcoming someone or responding to "thank you"',
      examples: [
        'Welcome to our home!',
        'You\'re welcome.',
        'Welcome back!'
      ],
      synonyms: ['You\'re welcome', 'My pleasure', 'Greetings'],
      cultural: 'Expression of hospitality and courtesy',
      formality: 'Neutral - polite and friendly',
      pronunciation: 'WEL-kuhm',
      partOfSpeech: 'Verb / Noun / Adjective / Interjection'
    },
    'good morning': {
      type: 'Time-specific Greeting',
      definition: 'A greeting used in the early part of the day',
      context: 'Formal/Informal',
      usage: 'Used from sunrise until noon',
      examples: [
        'Good morning! How did you sleep?',
        'Good morning, everyone.',
        'I wanted to wish you a good morning.'
      ],
      synonyms: ['Morning', 'Top of the morning'],
      cultural: 'Standard time-appropriate greeting',
      formality: 'Neutral to formal',
      pronunciation: 'good MAWR-ning',
      partOfSpeech: 'Phrase / Interjection'
    },
    'good night': {
      type: 'Time-specific Farewell',
      definition: 'A farewell or wish used when parting at night or before sleep',
      context: 'Informal/Personal',
      usage: 'Said when going to bed or leaving late in the evening',
      examples: [
        'Good night, sleep well!',
        'It\'s time to say good night.',
        'Good night, sweet dreams.'
      ],
      synonyms: ['Night', 'Sleep well', 'Sweet dreams'],
      cultural: 'Common bedtime or late evening farewell',
      formality: 'Informal to intimate',
      pronunciation: 'good nahyt',
      partOfSpeech: 'Phrase / Interjection'
    },
    'how are you': {
      type: 'Greeting Question',
      definition: 'A polite question asking about someone\'s wellbeing',
      context: 'Formal/Informal',
      usage: 'Used after initial greeting to show interest in someone\'s state',
      examples: [
        'Hello, how are you today?',
        'How are you doing?',
        'How are you feeling?'
      ],
      synonyms: ['How are you doing', 'How\'s it going', 'What\'s up'],
      cultural: 'Standard polite inquiry in English-speaking cultures',
      formality: 'Neutral - appropriate for most contexts',
      pronunciation: 'how ar yoo',
      partOfSpeech: 'Question / Phrase'
    },
    'excuse me': {
      type: 'Polite Interjection',
      definition: 'Used to politely get attention or apologize for a minor inconvenience',
      context: 'Formal/Informal',
      usage: 'Getting someone\'s attention, passing through, or apologizing',
      examples: [
        'Excuse me, could you help me?',
        'Excuse me, I need to get through.',
        'Excuse me for interrupting.'
      ],
      synonyms: ['Pardon me', 'Sorry', 'If you don\'t mind'],
      cultural: 'Essential phrase for politeness in public spaces',
      formality: 'Neutral to formal - very polite',
      pronunciation: 'eks-KYOOZ mee',
      partOfSpeech: 'Phrase / Interjection'
    },
    'nice to meet you': {
      type: 'Greeting / Introduction',
      definition: 'A polite phrase used when meeting someone for the first time',
      context: 'Formal/Informal',
      usage: 'Said during introductions or first meetings',
      examples: [
        'Hi, I\'m Sarah. Nice to meet you!',
        'Nice to meet you too!',
        'It was nice to meet you.'
      ],
      synonyms: ['Pleased to meet you', 'Great to meet you', 'Good to meet you'],
      cultural: 'Standard phrase for introductions in English',
      formality: 'Neutral - appropriate for all introductions',
      pronunciation: 'nahys too meet yoo',
      partOfSpeech: 'Phrase'
    },
    'i love you': {
      type: 'Expression of Love',
      definition: 'A deep expression of romantic or familial love and affection',
      context: 'Personal/Intimate',
      usage: 'Expressing deep affection to romantic partners or family',
      examples: [
        'I love you so much.',
        'I just wanted to say I love you.',
        'I love you too!'
      ],
      synonyms: ['I adore you', 'I care about you deeply', 'You mean everything to me'],
      cultural: 'Profound expression used in close relationships',
      formality: 'Intimate - reserved for close relationships',
      pronunciation: 'ahy luhv yoo',
      partOfSpeech: 'Phrase / Declaration'
    },
    'happy birthday': {
      type: 'Celebration / Greeting',
      definition: 'A congratulatory phrase for someone\'s birthday',
      context: 'Celebratory',
      usage: 'Said to someone on their birthday',
      examples: [
        'Happy birthday! I hope you have a great day!',
        'Wishing you a very happy birthday!',
        'Happy birthday to you!'
      ],
      synonyms: ['Many happy returns', 'Best wishes on your birthday'],
      cultural: 'Universal birthday greeting in English-speaking countries',
      formality: 'Informal - friendly and celebratory',
      pronunciation: 'HAP-ee BURTH-day',
      partOfSpeech: 'Phrase / Exclamation'
    },
    'congratulations': {
      type: 'Expression of Joy',
      definition: 'An expression of praise for someone\'s achievement or good fortune',
      context: 'Celebratory',
      usage: 'Celebrating achievements, milestones, or good news',
      examples: [
        'Congratulations on your promotion!',
        'Congratulations! You did it!',
        'I wanted to offer my congratulations.'
      ],
      synonyms: ['Congrats', 'Well done', 'Good job', 'Kudos'],
      cultural: 'Important expression for acknowledging success',
      formality: 'Neutral to formal',
      pronunciation: 'kuhn-grach-uh-LAY-shuhnz',
      partOfSpeech: 'Interjection / Noun'
    },
    'good luck': {
      type: 'Well-wishing',
      definition: 'An expression wishing someone success in an endeavor',
      context: 'Supportive',
      usage: 'Before someone attempts something challenging',
      examples: [
        'Good luck on your exam!',
        'Good luck with your interview!',
        'Wishing you good luck!'
      ],
      synonyms: ['Best of luck', 'Break a leg', 'All the best'],
      cultural: 'Common supportive expression',
      formality: 'Informal to neutral',
      pronunciation: 'good luhk',
      partOfSpeech: 'Phrase / Exclamation'
    },
    'i\'m sorry': {
      type: 'Apology',
      definition: 'A sincere expression of regret or apology',
      context: 'Apologetic',
      usage: 'Apologizing for mistakes or expressing sympathy',
      examples: [
        'I\'m sorry for being late.',
        'I\'m sorry to hear that.',
        'I\'m so sorry, it was my fault.'
      ],
      synonyms: ['I apologize', 'My apologies', 'Please forgive me'],
      cultural: 'Important for conflict resolution and empathy',
      formality: 'Neutral - sincere and respectful',
      pronunciation: 'ahym SAW-ree',
      partOfSpeech: 'Phrase / Apology'
    },
    'you\'re welcome': {
      type: 'Response to Thanks',
      definition: 'A polite response when someone thanks you',
      context: 'Formal/Informal',
      usage: 'Responding to "thank you" or expressions of gratitude',
      examples: [
        'Thank you! - You\'re welcome!',
        'You\'re very welcome.',
        'You\'re welcome anytime.'
      ],
      synonyms: ['No problem', 'My pleasure', 'Anytime', 'Don\'t mention it'],
      cultural: 'Standard polite response to thanks',
      formality: 'Neutral - polite and friendly',
      pronunciation: 'yoor WEL-kuhm',
      partOfSpeech: 'Phrase / Response'
    }
  };

  // Check if we have detailed information for this word/phrase
  if (wordDatabase[text]) {
    return wordDatabase[text];
  }

  // Default information for unknown words
  return {
    type: 'Word/Phrase',
    definition: `"${text}" is a word or phrase in ${getLanguageName(sourceLang)}`,
    context: 'General',
    usage: 'Common usage in everyday conversation',
    examples: [`Example: ${text}`],
    synonyms: [],
    cultural: 'Used in various contexts',
    formality: 'Context dependent',
    pronunciation: 'Pronunciation varies by region',
    partOfSpeech: 'Various'
  };
}

// Helper function to get language names
function getLanguageName(code: string): string {
  const languages: any = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'zh-Hans': 'Chinese',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'bn': 'Bengali',
    'tr': 'Turkish',
    'nl': 'Dutch',
    'pl': 'Polish',
    'sv': 'Swedish',
    'th': 'Thai',
    'vi': 'Vietnamese',
    'auto': 'Auto Detect'
  };
  
  return languages[code] || code;
}

Deno.serve(app.fetch);