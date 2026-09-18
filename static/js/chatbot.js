/* ============================================================
   KrishiSathi India - Chatbot & Voice Assistant
   ============================================================ */

// ---- Knowledge Base ----
const farmingKnowledge = {
  greetings: {
    patterns: ['hello', 'hi', 'namaste', 'hey', 'नमस्ते', 'good morning', 'good evening'],
    responses: [
      '🙏 Namaste! I am AgroBot, your smart farming assistant. How can I help you today?',
      '🌱 Hello, farmer friend! Ready to help with your farming questions. Ask me about crops, weather, pests, or schemes!',
      '👋 Welcome to KrishiSathi! I can help with crop advice, pest control, fertilizer tips, and government schemes. What do you need?'
    ]
  },

  crops: {
    patterns: ['crop', 'crops', 'which crop', 'best crop', 'grow', 'plant', 'sow', 'seed', 'फसल', 'what to grow', 'suggest crop'],
    responses: [
      '🌾 For the best crop recommendation, please tell me your:\n• State and district\n• Season (Kharif/Rabi/Zaid)\n• Soil type\n• Land area\n\nOr visit our **Crop Prediction** page for a complete AI analysis!',
      '🌱 Popular Kharif crops: Rice, Maize, Cotton, Groundnut, Soybean\n🌾 Popular Rabi crops: Wheat, Mustard, Peas, Gram\n☀️ Zaid crops: Maize, Vegetables, Watermelon\n\nWhich season are you planning for?',
      '🤖 Use our AI Crop Prediction tool for personalized recommendations based on your soil, climate, and location!'
    ]
  },

  pest: {
    patterns: ['pest', 'insect', 'disease', 'attack', 'fungus', 'borer', 'aphid', 'whitefly', 'rust', 'blight', 'कीट', 'रोग'],
    responses: [
      '🪲 Common pest solutions:\n\n**Aphids**: Spray imidacloprid 0.3ml/L water\n**Stem Borer**: Use chlorpyrifos 2ml/L water\n**Whitefly**: Thiamethoxam 0.2g/L spray\n**Fungal Disease**: Mancozeb or Propiconazole fungicide\n\n⚠️ Always follow label directions. Consult local agriculture officer for severe attacks.',
      '🌿 Integrated Pest Management (IPM) Tips:\n1. Use resistant varieties\n2. Set pheromone traps early\n3. Apply neem-based sprays (organic)\n4. Maintain field hygiene\n5. Crop rotation helps reduce soil-borne pests\n\nWhat crop are you worried about?',
      '🧪 For pest identification, send a photo to your nearest Krishi Vigyan Kendra (KVK) or call the farmer helpline: 1800-180-1551'
    ]
  },

  fertilizer: {
    patterns: ['fertilizer', 'urea', 'npk', 'dap', 'manure', 'compost', 'nutrient', 'खाद', 'उर्वरक', 'nitrogen', 'phosphorus', 'potassium'],
    responses: [
      '🧪 Basic Fertilizer Guide:\n\n**Nitrogen (N)**: Promotes leaf/stem growth → Use Urea\n**Phosphorus (P)**: Root and flower development → Use DAP or SSP\n**Potassium (K)**: Fruit quality, disease resistance → Use MOP\n\n💡 Always do a soil test before applying fertilizers for best results!',
      '🌱 Organic Alternatives:\n• Vermicompost (3-5 tonnes/acre) → Excellent for all crops\n• Green manure crops (Dhaincha, Sunn hemp)\n• FYM (Farm Yard Manure) 10 tonnes/acre\n• Biofertilizers: Rhizobium, Azospirillum, PSB\n\nOrganic farming improves long-term soil health!',
      '📊 General NPK recommendations:\n- Rice: 120:60:60 kg/ha\n- Wheat: 120:60:40 kg/ha\n- Maize: 150:75:40 kg/ha\n- Cotton: 80:40:40 kg/ha\n- Groundnut: 20:40:40 + Gypsum 250 kg/ha\n\nAlways split nitrogen into 2-3 applications.'
    ]
  },

  water: {
    patterns: ['water', 'irrigation', 'drip', 'sprinkler', 'drought', 'flood', 'पानी', 'सिंचाई', 'rain', 'moisture'],
    responses: [
      '💧 Irrigation Methods:\n\n**Drip Irrigation** (Best for water saving):\n• Saves 40-60% water vs flood irrigation\n• Reduces weed growth\n• Get 90% subsidy under PM Krishi Sinchayee Yojana!\n\n**Sprinkler**: Good for vegetables, wheat\n**Furrow**: Traditional, suitable for row crops',
      '🌧️ Water Management Tips:\n1. Irrigate in early morning (5-8 AM) to reduce evaporation\n2. Mulching saves 30-40% soil moisture\n3. Raised bed farming improves drainage\n4. Monitor soil moisture at 10 cm depth\n5. Rainwater harvesting for farm ponds\n\nNeed help selecting the right irrigation system?',
      '📍 For drip/sprinkler subsidy: Apply online at pmksy.gov.in or visit your block agriculture office.'
    ]
  },

  weather: {
    patterns: ['weather', 'rain', 'temperature', 'forecast', 'monsoon', 'मौसम', 'बारिश', 'climate', 'season'],
    responses: [
      '🌦️ Check real-time weather in our **Weather section**! It provides:\n• Current temperature & humidity\n• 5-day forecast\n• Rain alerts\n• Farming recommendations based on weather',
      '🌧️ Monsoon Tips:\n• Kharif sowing starts when cumulative rainfall reaches 100-150mm\n• Prepare field bunds before monsoon\n• Ensure drainage channels are clear\n• Store seeds in dry, safe containers',
      '📱 For weather alerts, you can also register at IMD (India Meteorological Department) website: mausam.imd.gov.in'
    ]
  },

  schemes: {
    patterns: ['scheme', 'government', 'subsidy', 'pm kisan', 'insurance', 'loan', 'kcc', 'pmfby', 'योजना', 'सरकार', 'बीमा', 'ऋण'],
    responses: [
      '🏛️ Key Government Schemes:\n\n**PM-KISAN**: ₹6,000/year direct benefit, apply at pmkisan.gov.in\n**PMFBY**: Crop insurance at 1.5-5% premium, apply at pmfby.gov.in\n**Kisan Credit Card**: Short-term credit up to ₹3 lakh at 7% interest\n**Soil Health Card**: Free soil testing, apply at nearest agriculture office',
      '💰 PM-KISAN Eligibility:\n• Small/marginal farmer with cultivable land\n• Not a government employee or taxpayer\n• Apply with Aadhaar + land records + bank account\n• Check status: pmkisan.gov.in/Benificiary_Status',
      '📋 For all government agricultural schemes, visit: agricoop.nic.in or call helpline: 1800-180-1551 (toll-free)'
    ]
  },

  soil: {
    patterns: ['soil', 'ph', 'test', 'black soil', 'alluvial', 'red soil', 'मिट्टी', 'भूमि', 'land', 'fertility'],
    responses: [
      '🌍 Soil Types in India:\n\n**Alluvial** (53%): Most fertile, found in Indo-Gangetic plains → Rice, Wheat, Sugarcane\n**Black/Regur**: High moisture retention → Cotton, Soybean\n**Red**: Less fertile, needs more fertilizer → Millets, Pulses\n**Laterite**: Poor fertility → Tea, Coffee, Rubber\n**Sandy**: Low fertility, well-drained → Groundnut, Millets',
      '🧪 Soil Testing:\n• Get free Soil Health Card from agriculture department\n• Ideal pH: 6.0-7.5 for most crops\n• If pH < 6 (acidic): Apply lime\n• If pH > 8 (alkaline): Apply gypsum/sulfur\n• Test every 2-3 years for best results',
      '🌱 Improving Soil Health:\n1. Add organic matter (compost, FYM)\n2. Practice crop rotation\n3. Avoid excessive plowing\n4. Use cover crops in off-season\n5. Reduce chemical fertilizer dependency'
    ]
  },

  market: {
    patterns: ['price', 'market', 'msp', 'minimum support', 'sell', 'mandis', 'बाज़ार', 'भाव', 'दाम'],
    responses: [
      '💰 Crop Price Tips:\n\n• Check **Market Prices** section for live rates\n• Register on eNAM (National Agriculture Market) at enam.gov.in for better prices\n• MSP (Minimum Support Price) is the guaranteed floor price\n• Avoid distress selling - use Warehouse Receipt Scheme',
      '📊 How to get best prices:\n1. Join Farmer Producer Organizations (FPOs)\n2. Use eNAM for online trading\n3. Store in government warehouses (NABARD/NWR)\n4. Process/value-add before selling\n5. Track market trends before harvest',
      '🏪 Nearest mandi information: agmarknet.gov.in\nFor eNAM registration: enam.gov.in\nFarmer helpline: 1800-270-0224'
    ]
  },

  organic: {
    patterns: ['organic', 'natural', 'chemical-free', 'jaivik', 'जैविक', 'bio', 'pesticide-free'],
    responses: [
      '🌿 Organic Farming Benefits:\n• Premium prices (20-30% higher)\n• Healthier soil in long term\n• Lower input costs\n• Export opportunities\n\n**Certification**: Apply for PGS-India organic certification (free)\nVisit: pgsindia-ncof.gov.in',
      '🍃 Starting Organic Farming:\n1. Stop all synthetic chemicals\n2. Build compost unit on farm\n3. Start with small area (0.5-1 acre)\n4. Document all practices for certification\n5. Join local organic farmer groups'
    ]
  }
};

// ---- Get Bot Response ----
function getBotResponse(userMessage) {
  const msg = userMessage.toLowerCase().trim();

  // Check each knowledge category
  for (const [category, data] of Object.entries(farmingKnowledge)) {
    if (data.patterns.some(pattern => msg.includes(pattern))) {
      const responses = data.responses;
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }

  // Default responses
  const defaults = [
    '🌱 That\'s a great question! Please be more specific so I can help better. You can ask about:\n• Crop selection & sowing\n• Pest & disease control\n• Fertilizer recommendations\n• Water management\n• Government schemes\n• Market prices',
    '🤔 I\'m not sure about that. Try asking about specific topics like crop care, fertilizers, pest control, or government schemes.',
    '📱 For complex farming queries, please contact your nearest Krishi Vigyan Kendra (KVK) or call 1800-180-1551 (free helpline).',
    '🌾 I specialize in farming advice! Ask me about crops, soils, weather, schemes, or market prices.'
  ];

  return defaults[Math.floor(Math.random() * defaults.length)];
}

// ---- Chat UI Functions ----
let isTyping = false;

function addMessage(text, type = 'bot') {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const msg = document.createElement('div');
  msg.className = type === 'bot' ? 'msg-bot' : 'msg-user';

  // Format text: **bold** → <strong>, line breaks
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

  msg.innerHTML = formatted;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function showTypingIndicator() {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const indicator = document.createElement('div');
  indicator.className = 'msg-bot';
  indicator.id = 'typing-indicator';
  indicator.innerHTML = '<span style="color:var(--green-300)">● ● ●</span>';
  indicator.style.animation = 'none';
  container.appendChild(indicator);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
  document.getElementById('typing-indicator')?.remove();
}

function sendMessage(text) {
  if (!text?.trim() || isTyping) return;

  addMessage(text, 'user');
  isTyping = true;

  const input = document.getElementById('chat-input-field');
  if (input) input.value = '';

  showTypingIndicator();

  // Simulate bot processing delay
  const delay = 800 + Math.random() * 800;
  setTimeout(() => {
    removeTypingIndicator();
    const response = getBotResponse(text);
    addMessage(response, 'bot');
    isTyping = false;
  }, delay);
}

// ---- Quick Replies ----
function setupQuickReplies() {
  document.querySelectorAll('.quick-reply').forEach(btn => {
    btn.addEventListener('click', () => {
      sendMessage(btn.textContent);
    });
  });
}

// ---- Voice Input ----
let recognition = null;
let isListening = false;

function initVoiceInput(targetInputId = 'chat-input-field') {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.log('Speech recognition not supported');
    return false;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    updateMicUI(true);

    // Clear any placeholder text so onend's "was anything said?" check is accurate
    const transcriptEl = document.getElementById('voice-transcript');
    if (transcriptEl) transcriptEl.textContent = '';
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(result => result[0].transcript)
      .join('');

    const inputEl = document.getElementById(targetInputId);
    if (inputEl) inputEl.value = transcript;

    // Update voice transcript if on voice page
    const transcriptEl = document.getElementById('voice-transcript');
    if (transcriptEl) transcriptEl.textContent = transcript;
  };

  recognition.onerror = (event) => {
    console.error('Speech error:', event.error);
    isListening = false;
    updateMicUI(false);

    const errorMessages = {
      'not-allowed': 'Microphone access denied. Please allow microphone access.',
      'no-speech': 'No speech detected. Please try again.',
      'network': 'Network error during speech recognition.',
      'aborted': 'Speech input was stopped.'
    };

    window.KrishiSathi?.showToast(errorMessages[event.error] || 'Voice input error', 'warning');
  };

  recognition.onend = () => {
    isListening = false;
    updateMicUI(false);

    // Auto-send on voice page
    const voiceOrb = document.getElementById('voice-orb');
    if (voiceOrb) {
      const transcriptEl = document.getElementById('voice-transcript');
      if (transcriptEl?.textContent) {
        processVoiceQuery(transcriptEl.textContent);
      }
    }
  };

  return true;
}

function toggleListening(targetInputId = 'chat-input-field') {
  if (!recognition) {
    const supported = initVoiceInput(targetInputId);
    if (!supported) {
      window.KrishiSathi?.showToast('Voice input not supported in this browser', 'warning');
      return;
    }
  }

  if (isListening) {
    recognition.stop();
  } else {
    // Set language based on preference
    recognition.lang = localStorage.getItem('agro-lang') === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.start();
  }
}

/** Update the voice-recognition language, live if a session is already open. */
function setVoiceLang(lang) {
  const short = String(lang).toLowerCase().startsWith('hi') ? 'hi' : 'en';
  localStorage.setItem('agro-lang', short);
  if (recognition) {
    recognition.lang = short === 'hi' ? 'hi-IN' : 'en-IN';
  }
}

function updateMicUI(listening) {
  const micBtns = document.querySelectorAll('.mic-btn, #voice-orb');
  micBtns.forEach(btn => {
    btn.classList.toggle('listening', listening);
    btn.classList.toggle('active', listening);
  });

  const statusEl = document.getElementById('voice-status');
  if (statusEl) {
    statusEl.textContent = listening ? '🎤 Listening... Speak now' : '🔇 Tap microphone to speak';
    statusEl.style.color = listening ? 'var(--green-300)' : 'var(--green-200)';
  }
}

// ---- Voice Page Query Processing ----
function processVoiceQuery(text) {
  const responseEl = document.getElementById('voice-response');
  if (!responseEl) return;

  const response = getBotResponse(text);
  const formatted = response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

  responseEl.innerHTML = `
    <div style="padding:1.2rem;background:rgba(61,185,106,0.1);border:1px solid rgba(61,185,106,0.2);border-radius:16px;margin-top:1rem">
      <div style="font-size:0.8rem;color:var(--green-300);margin-bottom:0.5rem;font-weight:700">🤖 AgroBot Response:</div>
      <div style="font-size:0.95rem;line-height:1.6;color:var(--green-100)">${formatted}</div>
    </div>
  `;

  // Text-to-speech output
  if ('speechSynthesis' in window) {
    const cleanText = response.replace(/\*\*/g, '').replace(/•/g, '').replace(/📊|🌱|🌾|🤖|💧|🌿|🍃|🏛️|💰|🧪|🌍|🪲/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = localStorage.getItem('agro-lang') === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }
}

// ---- Initialize Chat ----
document.addEventListener('DOMContentLoaded', () => {
  const chatInput = document.getElementById('chat-input-field');
  const chatSendBtn = document.getElementById('chat-send-btn');
  const chatMicBtn = document.getElementById('chat-mic-btn');
  const voiceOrb = document.getElementById('voice-orb');
  const voiceMicBtn = document.getElementById('voice-mic-btn');

  // Send on button click
  if (chatSendBtn) {
    chatSendBtn.addEventListener('click', () => {
      sendMessage(chatInput?.value);
    });
  }

  // Send on Enter key
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(chatInput.value);
      }
    });
  }

  // Chat mic button
  if (chatMicBtn) {
    chatMicBtn.addEventListener('click', () => toggleListening('chat-input-field'));
  }

  // Voice orb
  if (voiceOrb) {
    voiceOrb.addEventListener('click', () => toggleListening('voice-input-display'));
  }

  // Voice page mic button
  if (voiceMicBtn) {
    voiceMicBtn.addEventListener('click', () => toggleListening('voice-input-display'));
  }

  // Quick replies
  setupQuickReplies();

  // Welcome message (delay for chat page load)
  if (document.getElementById('chat-messages')) {
    setTimeout(() => {
      addMessage('🙏 Namaste! I am **AgroBot**, your AI farming assistant!\n\nI can help you with:\n• 🌾 Crop selection & care\n• 🪲 Pest & disease control\n• 🧪 Fertilizer advice\n• 💧 Irrigation guidance\n• 🏛️ Government schemes\n• 💰 Market prices\n\nAsk me anything in English or Hindi!', 'bot');
    }, 500);
  }
});

// Export — every function other pages call via window.ChatBot must be listed here
window.ChatBot = { sendMessage, getBotResponse, toggleListening, addMessage, processVoiceQuery, setVoiceLang };
