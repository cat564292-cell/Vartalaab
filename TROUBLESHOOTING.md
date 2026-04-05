# VarTalaab Troubleshooting Guide

## 🔧 Common Issues & Solutions

### 1. Translation Error (404)

**Error Message:** `Translation failed: Translation API error: 404`

**Possible Causes:**
- Backend server not deployed or not running
- API endpoint not accessible
- Network connectivity issues

**Solutions:**

#### Solution A: Check Backend Deployment
1. Verify the Supabase Edge Function is deployed
2. Check the server logs in Supabase dashboard
3. Test the health endpoint: `https://{projectId}.supabase.co/functions/v1/make-server-e0a50523/health`

#### Solution B: Use Fallback Demo Mode
The app now has a built-in fallback system:
- **Primary**: Microsoft Translator API (if MICROSOFT_TRANSLATOR_API_KEY is set)
- **Secondary**: Google Translate via RapidAPI
- **Fallback**: Demo mode with common phrases

Demo mode supports these phrases:
- hello, thank you, goodbye, yes, no
- Translation to: Spanish, French, German, Italian, Portuguese, Japanese, Chinese, Arabic, Hindi

#### Solution C: Test Translation Manually
```bash
curl -X POST https://{projectId}.supabase.co/functions/v1/make-server-e0a50523/translate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {publicAnonKey}" \
  -d '{"text": "hello", "to": "es"}'
```

Expected response:
```json
{
  "translatedText": "hola",
  "detectedLanguage": "en"
}
```

---

### 2. Microphone Access Denied

**Error Message:** `Speech recognition error: not-allowed`

**Possible Causes:**
- Microphone permission denied by user
- Browser doesn't have microphone access
- App not running on HTTPS
- Microphone in use by another application

**Solutions:**

#### Solution A: Grant Microphone Permission
1. **Chrome/Edge:**
   - Click the lock icon in address bar
   - Find "Microphone" permission
   - Change to "Allow"
   - Refresh the page

2. **Firefox:**
   - Click the lock icon
   - Clear the microphone block
   - Reload page and allow when prompted

3. **Safari:**
   - Go to Safari > Settings > Websites > Microphone
   - Find your site and set to "Allow"

#### Solution B: Check HTTPS
- Voice features require HTTPS (secure connection)
- If testing locally, use `https://localhost` instead of `http://`
- On deployment platforms (Vercel, Netlify), HTTPS is automatic

#### Solution C: Check Browser Support
Voice input is supported in:
- ✅ Chrome (recommended)
- ✅ Edge (recommended)
- ✅ Safari (limited)
- ❌ Firefox (not supported)

#### Solution D: Check System Settings
**Windows:**
1. Settings > Privacy > Microphone
2. Enable "Allow apps to access your microphone"
3. Enable for your browser

**macOS:**
1. System Preferences > Security & Privacy > Microphone
2. Check your browser in the list
3. Restart browser if needed

**Linux:**
```bash
# Check if microphone is detected
arecord -l

# Test microphone
arecord -d 5 test.wav
aplay test.wav
```

---

### 3. No Speech Detected

**Error Message:** `Speech recognition error: no-speech`

**Solutions:**
1. Speak louder and clearer
2. Check microphone is not muted
3. Test microphone in another app
4. Move closer to microphone
5. Reduce background noise
6. Try in a quieter environment

---

### 4. Text-to-Speech Not Working

**Possible Causes:**
- Browser doesn't support speech synthesis
- System volume muted
- Language voices not installed

**Solutions:**

#### Solution A: Check Browser Support
- ✅ All modern browsers support TTS
- Test with: `window.speechSynthesis.speak(new SpeechSynthesisUtterance('test'))`

#### Solution B: Check System Volume
- Ensure system volume is not muted
- Ensure browser tab is not muted
- Check audio output device

#### Solution C: Install Language Voices
**Windows:**
- Settings > Time & Language > Speech > Manage voices
- Download additional language voices

**macOS:**
- System Preferences > Accessibility > Spoken Content
- Click "System Voice" and download languages

---

### 5. History Not Saving

**Possible Causes:**
- localStorage disabled
- Browser in incognito/private mode
- Storage quota exceeded
- Browser extensions blocking storage

**Solutions:**

#### Solution A: Enable localStorage
```javascript
// Test localStorage in browser console
localStorage.setItem('test', 'value');
console.log(localStorage.getItem('test'));
localStorage.removeItem('test');
```

#### Solution B: Check Browser Mode
- Disable incognito/private mode
- Use regular browser window

#### Solution C: Clear Browser Data
1. Keep cookies and site data
2. Clear only cached files
3. Don't clear "Site settings"

#### Solution D: Check Storage Quota
```javascript
// Check storage usage
navigator.storage.estimate().then(estimate => {
  console.log(`Using ${estimate.usage} of ${estimate.quota} bytes`);
});
```

---

### 6. Video Background Not Playing

**Possible Causes:**
- Slow internet connection
- Browser autoplay policies
- Video URL not accessible
- Mobile data saver enabled

**Solutions:**

#### Solution A: Check Internet Connection
- Ensure stable connection (minimum 5 Mbps recommended)
- Video is large (~50MB), may take time to load
- Check network tab in DevTools

#### Solution B: Enable Autoplay
**Chrome:**
- chrome://settings/content/sound
- Add site to "Allowed to play sound"

**Safari:**
- Safari > Settings > Websites > Auto-Play
- Set to "Allow All Auto-Play"

#### Solution C: Fallback
- App still works without video
- Background gradient visible while video loads
- On slow connections, video may not load

---

### 7. AI Chat Not Responding

**Possible Causes:**
- Translation API not working
- Network error
- Invalid input

**Solutions:**
1. Check if regular translation works
2. Try simpler queries like "translate hello to french"
3. Check browser console for errors
4. Refresh the page

---

### 8. Cards Not Tilting (3D Effect)

**Possible Causes:**
- GPU acceleration disabled
- Low-end device
- Browser performance mode

**Solutions:**
1. Enable hardware acceleration in browser settings
2. Close other heavy tabs
3. Effect is cosmetic - doesn't affect functionality
4. Works best on desktop/powerful devices

---

## 🩺 Diagnostic Checklist

Run through this checklist to identify issues:

```
[ ] Browser Console - Any errors?
[ ] Network Tab - API calls succeeding?
[ ] HTTPS - Is site secure?
[ ] Permissions - Microphone allowed?
[ ] Internet - Connection stable?
[ ] Browser - Chrome/Edge/Safari?
[ ] LocalStorage - Enabled?
[ ] Cookies - Enabled?
[ ] Extensions - Try disabling?
[ ] Cache - Try hard refresh (Ctrl+Shift+R)?
```

---

## 🔍 Debug Mode

### Enable Verbose Logging

Open browser console (F12) and paste:

```javascript
// Enable debug mode
localStorage.setItem('debug', 'true');

// Monitor translation calls
window.addEventListener('fetch', (e) => {
  console.log('Fetch:', e);
});

// Monitor speech events
if ('webkitSpeechRecognition' in window) {
  const recognition = new webkitSpeechRecognition();
  recognition.onstart = () => console.log('🎤 Speech started');
  recognition.onend = () => console.log('🎤 Speech ended');
  recognition.onerror = (e) => console.error('🎤 Speech error:', e);
}
```

---

## 📞 Getting Help

If problems persist:

1. **Check Browser Console** (F12) for errors
2. **Take Screenshot** of the error
3. **Note Your Setup:**
   - Browser & version
   - Operating system
   - Device type
   - Internet speed
4. **What You Tried:**
   - Steps to reproduce
   - What you expected
   - What actually happened

---

## ✅ Verification Steps

After fixing any issue:

1. ✅ Hard refresh page (Ctrl+Shift+R)
2. ✅ Try translation: type "hello"
3. ✅ Check translation appears
4. ✅ Test voice input (if needed)
5. ✅ Check history saves
6. ✅ Test AI chat
7. ✅ Verify all features work

---

## 🚀 Performance Tips

### For Best Experience:

1. **Use Chrome or Edge** - Best compatibility
2. **Stable Connection** - 5+ Mbps recommended
3. **Allow Permissions** - Microphone for voice features
4. **Enable Hardware Acceleration** - For smooth animations
5. **Close Heavy Tabs** - Reduce memory usage
6. **Use HTTPS** - Required for microphone access

---

## 🛠️ Advanced Troubleshooting

### Reset Everything

If all else fails, reset the app:

```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
location.reload(true);
```

### Check API Keys

Backend uses these APIs:
- **Microsoft Translator** (primary) - Already configured
- **Google Translate via RapidAPI** (fallback) - Hardcoded
- **Demo Mode** (last resort) - No key needed

---

## 📱 Mobile-Specific Issues

### iOS Safari
- Voice input has limited support
- Must interact with page before voice works
- Video may not autoplay on cellular data

### Android Chrome
- Works best for voice features
- Ensure Chrome has microphone permission
- Check data saver is not blocking video

---

**Still having issues? Check the browser console for specific error messages and refer to the relevant section above.**
