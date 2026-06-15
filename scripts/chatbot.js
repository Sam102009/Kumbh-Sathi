/* ============================================================
   KumbhSathi AI Chatbot — Gemini 2.0 Flash
   ============================================================ */

(function() {
  'use strict';

  var GEMINI_TOKEN = 'AQ.Ab8RN6KmfhmBynm_hmy4R4IxU8toPkHbbhe6RwNkYFsZ8GDb6g';
  var GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  var SYSTEM_PROMPT = 'You are KumbhSathi AI, a helpful assistant for pilgrims attending Simhastha Kumbh Mela Nashik-Trimbakeshwar 2027. You speak in the language the user writes in — Hindi, Marathi, or English. Keep answers short, clear and helpful. Use emojis appropriately. Always be respectful.\n\nIMPORTANT RULES:\n- Only answer questions related to Kumbh Mela Nashik 2027 and the KumbhSathi app\n- For emergencies always say "Call 112 immediately 🚨"\n- If unsure say "Please verify at nearest help desk 🙏"\n- Never give wrong information\n\nSHAHI SNAN DATES:\n- First Shahi Snan: August 2, 2027 at Ramkund & Kushavarta (Somvati Amavasya)\n- Main Shahi Snan: August 31, 2027 at Ramkund & Kushavarta (Shravan Amavasya)\n- Third Shahi Snan (Vaishnava): September 11, 2027 at Ramkund Nashik (Bhadrapada Ekadashi)\n- Third Shahi Snan (Shaiva): September 12, 2027 at Kushavarta Trimbak (Bhadrapada Ekadashi)\n\nBATHING SEQUENCE:\n- Kushavarta (Shaiva): Juna Akhara first, then Niranjani, then Mahanirvani\n- Ramkund (Vaishnava): Nirmohi, Nirvani, Digambar Ani Akharas lead\n\nGHATS:\n- Ramkund: Main ghat, Panchavati Nashik, Lord Rama bathed here, best time 4-7 AM\n- Kushavarta Kund: Origin of Godavari, Trimbakeshwar, near Jyotirlinga temple\n- Gandhi Talav: Adjoining Ramkund for overflow crowds\n- Laxman Kund & Sita Sarovar: Adjacent to Ramkund\n\n13 AKHARAS:\nShaiva (Camp: Trimbakeshwar): 1.Juna 2.Mahanirvani 3.Niranjani 4.Atal 5.Avahan 6.Agni 7.Anand\nVaishnava (Camp: Sadhugram Nashik): 8.Nirmohi Ani 9.Nirvani Ani 10.Digambar Ani\nUdaseen (Camp: Sadhugram): 11.Bada Udaseen 12.Naya Udaseen 13.Nirmal Akhara\n\nTRANSPORT:\n- Nashik Road Railway Station is 10km from Ramkund\n- Mumbai to Nashik: ~3.5 hours via expressway\n- On Shahi Snan days: private vehicles stopped 15km outside, free MSRTC shuttle buses provided\n- Auto-rickshaws banned in core zones on Shahi Snan days\n\nACCOMMODATION:\n- Sadhugram Tent City: Tapovan area, book via MTDC portal\n- Dharamshalas: ₹500-₹2500/night in Panchavati area\n- Hotels: Budget to 5-star available, book in advance\n\nEMERGENCY:\n- Police: 112\n- Ambulance: 108\n- Civil Hospital Nashik: Main government hospital\n- Apollo & Wockhardt: Private hospitals\n- Trimbak Sub-District Hospital: For Trimbakeshwar area\n\nFOOD & FACILITIES:\n- Free langar 24/7 at Sadhugram by all Akharas and NGOs including ISKCON\n- Mobile toilets installed around all ghats\n- Drinking water points every few hundred meters\n- Cloakrooms near railway station and bus drop-off points\n\nRULES:\n- Modest clothing at ghats, remove footwear near Kunds\n- No drones allowed\n- No photography of Naga Sadhus without permission\n- No soap/shampoo in Ramkund or Kushavarta\n- No plastic bags\n- Expect 10-12 hour wait on Shahi Snan days\n\nLANDMARKS:\n- Kalaram Temple: Black-stone Rama temple in Panchavati\n- Sita Gufa: Cave where Sita was abducted\n- Tapovan: Historical forest, site of Sadhugram\n- Trimbakeshwar Jyotirlinga: 30km from Nashik, one of 12 Jyotirlingas\n\nSPECIAL EVENTS:\n- Dhwajarohan (Flag Hoisting): October 31, 2026\n- Nagar Pradakshina (14km holy walk): July 29, 2027\n- Pravachans: Daily at Sadhugram pandals\n- Ganga Dussehra Utsav: May 25 - June 2, 2028\n\nKUMBHSATHI APP FEATURES:\n- Map page: Find ghats, hospitals, parking\n- Lost & Found page: Report missing persons\n- Crowd page: Live crowd density at ghats\n- News page: Latest Kumbh updates\n- Groups page: Stay connected with family\n- Emergency page: First aid and helplines';

  var chatHistory = [];
  var isOpen = false;
  var isTyping = false;

  /* ---- Build DOM ---- */
  function buildUI() {
    var btn = document.getElementById('chatbot-btn');
    var win = document.getElementById('chatbot-window');
    if (!btn || !win) return;

    win.innerHTML =
      '<div class="cb-header">' +
        '<div class="cb-header-info">' +
          '<div class="cb-avatar">🤖</div>' +
          '<div>' +
            '<div class="cb-title">KumbhSathi AI</div>' +
            '<div class="cb-status">Online • Kumbh Expert</div>' +
          '</div>' +
        '</div>' +
        '<button class="cb-close" id="chatbot-close" aria-label="Close">✕</button>' +
      '</div>' +
      '<div class="cb-messages" id="cb-messages">' +
        '<div class="cb-msg cb-msg-bot">' +
          '<span class="cb-bubble">🙏 नमस्ते! मैं KumbhSathi AI हूँ। Kumbh Mela Nashik 2027 के बारे में कोई भी सवाल पूछें — Hindi, Marathi या English में।</span>' +
        '</div>' +
      '</div>' +
      '<div class="cb-input-row">' +
        '<input class="cb-input" id="cb-input" type="text" placeholder="अपना सवाल पूछें..." autocomplete="off" maxlength="500">' +
        '<button class="cb-send" id="cb-send" aria-label="Send">➤</button>' +
      '</div>';
  }

  /* ---- Toggle open/close ---- */
  function openChat() {
    var win = document.getElementById('chatbot-window');
    var btn = document.getElementById('chatbot-btn');
    if (!win) return;
    isOpen = true;
    win.classList.add('cb-open');
    btn.classList.add('cb-btn-open');
    setTimeout(function() {
      var inp = document.getElementById('cb-input');
      if (inp) inp.focus();
      scrollToBottom();
    }, 320);
  }

  function closeChat() {
    var win = document.getElementById('chatbot-window');
    var btn = document.getElementById('chatbot-btn');
    if (!win) return;
    isOpen = false;
    win.classList.remove('cb-open');
    btn.classList.remove('cb-btn-open');
  }

  /* ---- Append message bubble ---- */
  function appendMessage(text, isUser) {
    var container = document.getElementById('cb-messages');
    if (!container) return;
    var div = document.createElement('div');
    div.className = 'cb-msg ' + (isUser ? 'cb-msg-user' : 'cb-msg-bot');
    var bubble = document.createElement('span');
    bubble.className = 'cb-bubble';
    bubble.innerHTML = formatText(text);
    div.appendChild(bubble);
    container.appendChild(div);
    scrollToBottom();
  }

  /* ---- Format AI response — bold and newlines ---- */
  function formatText(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  /* ---- Typing indicator ---- */
  function showTyping() {
    var container = document.getElementById('cb-messages');
    if (!container) return;
    var div = document.createElement('div');
    div.className = 'cb-msg cb-msg-bot cb-typing-msg';
    div.id = 'cb-typing';
    div.innerHTML = '<span class="cb-bubble cb-typing"><span></span><span></span><span></span></span>';
    container.appendChild(div);
    scrollToBottom();
  }

  function hideTyping() {
    var el = document.getElementById('cb-typing');
    if (el) el.remove();
  }

  function scrollToBottom() {
    var container = document.getElementById('cb-messages');
    if (container) container.scrollTop = container.scrollHeight;
  }

  /* ---- Send message to Gemini ---- */
  function sendMessage() {
    if (isTyping) return;
    var inp = document.getElementById('cb-input');
    if (!inp) return;
    var text = inp.value.trim();
    if (!text) return;

    inp.value = '';
    appendMessage(text, true);

    chatHistory.push({ role: 'user', parts: [{ text: text }] });
    if (chatHistory.length > 20) chatHistory = chatHistory.slice(chatHistory.length - 20);

    isTyping = true;
    showTyping();
    var sendBtn = document.getElementById('cb-send');
    if (sendBtn) sendBtn.disabled = true;

    fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + GEMINI_TOKEN
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: chatHistory.slice(),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 400,
          topP: 0.8
        }
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      hideTyping();
      isTyping = false;
      if (sendBtn) sendBtn.disabled = false;

      var reply = '';
      try {
        if (data.error) {
          var code = data.error.code || '';
          var msg  = data.error.message || '';
          if (code === 401 || code === 403 || msg.indexOf('API_KEY_INVALID') !== -1 || msg.indexOf('UNAUTHENTICATED') !== -1) {
            reply = '🔑 API key error: ' + msg + '\n\nPlease get a fresh key from aistudio.google.com and update it in scripts/chatbot.js';
          } else {
            reply = '⚠️ API error ' + code + ': ' + msg;
          }
        } else {
          reply = data.candidates[0].content.parts[0].text;
        }
      } catch (e) {
        reply = 'माफ करें, कुछ गलत हो गया। API response: ' + JSON.stringify(data).slice(0, 120) + ' 🙏';
      }
      chatHistory.push({ role: 'model', parts: [{ text: reply }] });
      if (chatHistory.length > 20) chatHistory = chatHistory.slice(chatHistory.length - 20);
      appendMessage(reply, false);
    })
    .catch(function(err) {
      hideTyping();
      isTyping = false;
      if (sendBtn) sendBtn.disabled = false;
      appendMessage('Network error: ' + (err && err.message ? err.message : 'unknown') + '. Please check your connection. 🙏', false);
    });
  }

  /* ---- Init ---- */
  function initChatbot() {
    buildUI();

    var btn = document.getElementById('chatbot-btn');
    var closeBtn = document.getElementById('chatbot-close');
    var sendBtn = document.getElementById('cb-send');
    var inp = document.getElementById('cb-input');

    if (btn) {
      btn.addEventListener('click', function() {
        if (isOpen) closeChat(); else openChat();
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        closeChat();
      });
    }
    if (sendBtn) {
      sendBtn.addEventListener('click', sendMessage);
    }
    if (inp) {
      inp.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }
  }

  window.initChatbot = initChatbot;
})();
