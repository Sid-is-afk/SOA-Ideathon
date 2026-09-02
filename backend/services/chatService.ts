import { GoogleGenAI } from '@google/genai';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequestPayload {
  message: string;
  role: 'shipper' | 'agent' | 'business';
  language: 'en' | 'hi' | 'or' | 'bn' | 'te';
  history?: ChatMessage[];
  context?: {
    activeRoute?: any;
    activeShipment?: any;
    user?: any;
  };
}

export interface ChatResponsePayload {
  reply: string;
  role: string;
  language: string;
  provider: string;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  try {
    return new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('[ChatService] Error initializing GoogleGenAI:', err);
    return null;
  }
}

// Language Instructions Mapping
const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  en: 'You MUST respond entirely in fluent, professional English.',
  hi: 'आप अनिवार्य रूप से पूरी प्रतिक्रिया स्पष्ट, शुद्ध और स्वाभाविक हिन्दी (Hindi) में ही दें।',
  or: 'ଆପଣ ନିଜର ସମସ୍ତ ଉତ୍ତର ସ୍ପଷ୍ଟ ଏବଂ ପ୍ରାକୃତିକ ଓଡ଼ିଆ ଭାଷା (Odia) ରେ ଦିଅନ୍ତୁ। ଆଞ୍ଚଳିକ ପରିଭାଷା ବ୍ୟବହାର କରନ୍ତୁ।',
  bn: 'আপনি অবশ্যই আপনার সম্পূর্ণ উত্তর স্পষ্ট এবং প্রাঞ্জল বাংলা ভাষায় (Bengali) প্রদান করুন।',
  te: 'మీరు మీ పూర్తి సమాధానాన్ని స్పష్టమైన మరియు సహజమైన తెలుగు భాషలో (Telugu) మాత్రమే అందించండి.',
};

export const chatService = {
  async generateResponse(payload: ChatRequestPayload): Promise<ChatResponsePayload> {
    const roleKey = payload.role === 'business' ? 'shipper' : payload.role;
    const lang = payload.language || 'en';
    const provider = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();

    // 1. Build System Prompt based on Dynamic Role Context
    const systemPrompt = this.buildSystemPrompt(roleKey, lang, payload.context);

    // 2. Route to configured provider
    try {
      if (provider === 'gemini') {
        const reply = await this.callGemini(payload.message, systemPrompt, payload.history);
        if (reply) {
          return { reply, role: roleKey, language: lang, provider: 'gemini' };
        }
      } else if (provider === 'openai') {
        const reply = await this.callOpenAI(payload.message, systemPrompt, payload.history);
        if (reply) {
          return { reply, role: roleKey, language: lang, provider: 'openai' };
        }
      } else if (provider === 'ollama') {
        const reply = await this.callOllama(payload.message, systemPrompt, payload.history);
        if (reply) {
          return { reply, role: roleKey, language: lang, provider: 'ollama' };
        }
      }
    } catch (err) {
      console.warn(`[ChatService] ${provider} call encountered an error. Engaging domain fallback:`, err);
    }

    // 3. Fallback: Highly specialized domain intelligence engine
    const fallbackReply = this.getDomainFallbackResponse(payload.message, roleKey, lang, payload.context);
    return {
      reply: fallbackReply,
      role: roleKey,
      language: lang,
      provider: 'domain_intelligence_fallback',
    };
  },

  buildSystemPrompt(role: string, language: string, context?: any): string {
    const langInstruction = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en;

    if (role === 'shipper') {
      return `
You are the **Karwaan Logistics Advisor**, an elite intelligence assistant for perishable cold-chain logistics operating in the Odisha-West Bengal-Andhra Pradesh corridor (Bhubaneswar, Cuttack, Kolkata, Visakhapatnam, Kharagpur, Berhampur).

YOUR ROLE & MISSION:
- Assist agricultural producers, farmers, food processors, and MSME shippers.
- Explain how Karwaan's AI consolidation engine reduces Less-Than-Truckload (LTL) reefer costs by 25% to 45% by clustering thermally compatible consignments.
- Detail biological shelf-life preservation: how temperature integrity and kinetic vibration reduction extend remaining shelf life and protect the Freshness Index (0-100%).
- Advocate for Multimodal Kisan Rail: Explain that Kisan Rail cold wagons provide high thermal stability, avoid highway congestion, lower carbon emissions by 40-60%, and provide reliable linehaul between coastal agro hubs.
- Keep answers professional, empowering, well-formatted with markdown bullet points and bold highlights.

LANGUAGE REQUIREMENT:
${langInstruction}
`;
    } else {
      // Delivery Agent / Driver
      return `
You are the **Karwaan Fleet Dispatch Officer**, a decisive, safety-first dispatch commander for reefer transport drivers and logistics delivery agents.

YOUR ROLE & MISSION:
- Guide reefer vehicle drivers navigating active delivery corridors.
- Provide crisp, direct Standard Operating Procedures (SOPs):
  1. Pre-cooling setpoints: Drivers must verify cabin temperature is stabilized between **+2.0°C and +4.0°C** before loading perishables.
  2. Sequence Stops: Drivers must complete stops in strict numerical sequence (Pickup -> Consolidation Hub -> Rail Cross-Dock -> Final Delivery) and tap "COMPLETE" after biometric/geo verification.
  3. Incident Management: In case of reefer compressor failure, temperature excursion (>5.0°C), vehicle breakdown, or severe highway congestion, instruct the driver to immediately trigger the **Incident Modal** ("Report Incident" button) to alert dispatch and initiate automatic AI dynamic rerouting to the nearest cold-storage terminal.
- Keep responses concise, direct, numbered or bulleted, and immediately actionable on the road.

LANGUAGE REQUIREMENT:
${langInstruction}
`;
    }
  },

  async callGemini(message: string, systemPrompt: string, history?: ChatMessage[]): Promise<string | null> {
    const ai = getGeminiClient();
    if (!ai) return null;

    // Convert history
    const contents: any[] = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Understood. I will act strictly according to these instructions and respond in the specified corridor language.' }] },
    ];

    if (history && history.length > 0) {
      for (const msg of history.slice(-6)) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        temperature: 0.3,
        maxOutputTokens: 800,
      }
    });

    return response.text?.trim() || null;
  },

  async callOpenAI(message: string, systemPrompt: string, history?: ChatMessage[]): Promise<string | null> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).slice(-6).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages,
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!res.ok) throw new Error(`OpenAI API error: ${res.statusText}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  },

  async callOllama(message: string, systemPrompt: string, history?: ChatMessage[]): Promise<string | null> {
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const model = process.env.OLLAMA_MODEL || 'llama3';

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).slice(-6).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
      }),
    });

    if (!res.ok) throw new Error(`Ollama API error: ${res.statusText}`);
    const data = await res.json();
    return data.message?.content?.trim() || null;
  },

  getDomainFallbackResponse(query: string, role: string, language: string, context?: any): string {
    const q = query.toLowerCase();

    // =========================================================================
    // SHIPPER PORTAL FALLBACK RESPONSES
    // =========================================================================
    if (role === 'shipper') {
      // 1. Freshness Index
      if (q.includes('freshness') || q.includes('ताजगी') || q.includes('ତାଜା') || q.includes('তাজাতা') || q.includes('తాజా')) {
        const map: Record<string, string> = {
          en: `### 🌿 Understanding the Karwaan Freshness Index
The **Freshness Index** measures the biological integrity and kinetic shelf-life of your perishables in real time.

- **Continuous Telemetry**: Calculates thermal exposure (°C) and humidity deviations across each transport leg.
- **Spoilage Prevention**: Predicts microbial and kinetic degradation before visual quality loss occurs.
- **SLA Threshold**: If freshness drops toward your defined limit, Karwaan automatically prioritizes express cross-dock transfer or cold depot routing.`,
          hi: `### 🌿 कारवां ताजगी सूचकांक (Freshness Index) की जानकारी
**ताजगी सूचकांक** आपके खराब होने वाले कृषि उत्पादों की जैविक गुणवत्ता और शेल्फ-लाइफ को मापता है।

- **लाइव टेलीमेट्री**: प्रत्येक मार्ग पर तापमान (°C) और आर्द्रता के उतार-चढ़ाव की निरंतर निगरानी करता है।
- **खराबी से सुरक्षा**: उत्पाद की गुणवत्ता कम होने से पहले ही संभावित जोखिम की भविष्यवाणी करता है।
- **SLA सुरक्षा**: यदि ताजगी निर्धारित सीमा से कम होती है, तो इंजन तुरंत निकटतम कोल्ड डिपो में प्राथमिकता रीरूटिंग सक्रिय करता है।`,
          or: `### 🌿 କାରୱାନ ତାଜାପଣ ସୂଚକାଙ୍କ (Freshness Index)
**ତାଜାପଣ ସୂଚକାଙ୍କ** ଆପଣଙ୍କ ପନିପରିବା ଓ ଫଳର ଜୈବିକ ଗୁଣବତ୍ତା ଏବଂ ସତେଜତା ମାପିଥାଏ।

- **ପ୍ରକୃତ ସମୟ ଟେଲିମେଟ୍ରି**: ଯାତ୍ରା ସମୟରେ ଗାଡ଼ିର ତାପମାତ୍ରା (°C) ଏବଂ ଆର୍ଦ୍ରତାର ନିରନ୍ତର ହିସାବ ରଖେ।
- **ଫସଲ ନଷ୍ଟ ରୋକିବା**: ଗୁଣବତ୍ତା ଖରାପ ହେବା ପୂର୍ବରୁ AI ଇଞ୍ଜିନ୍ ସତର୍କ କରାଏ।
- **SLA ନିରାପତ୍ତା**: ଯଦି ତାଜାପଣ ନିର୍ଦ୍ଦିଷ୍ଟ ସୀମା ତଳକୁ ଖସେ, ତେବେ ତୁରନ୍ତ ନିକଟସ୍ଥ ଶୀତଳ ଭଣ୍ଡାରକୁ ଗାଡ଼ି ପଠାଯାଏ।`,
          bn: `### 🌿 কারওয়ান সতেজতা সূচক (Freshness Index)
**সতেজতা সূচক** পণ্যের জৈবিক গুণমান এবং শেলফ-লাইফের অবস্থা রিয়েল-টাইমে পরিমাপ করে।

- **নিরবচ্ছিন্ন টেলিমেট্রি**: পুরো ট্রানজিটে তাপমাত্রা (°C) ও আর্দ্রতার বিচ্যুতি পর্যবেক্ষণ করে।
- **পচন প্রতিরোধ**: গুণমান নষ্ট হওয়ার পূর্বেই সম্ভাব্য ঝুঁকি চিহ্নিত করে।
- **SLA সুরক্ষা**: সূচক নির্দিষ্ট সীমার নিচে নামলে সিস্টেম দ্রুততম কোল্ড ডিপোতে অগ্রাধিকার রি-রুটিং সক্রিয় করে।`,
          te: `### 🌿 కార్వాన్ తాజాదనం సూచిక (Freshness Index)
**తాజాదనం సూచిక** పాడైపోయే వస్తువుల నాణ్యత మరియు షెల్ఫ్-లైఫ్‌ను రియల్-టైమ్‌లో పర్యవేక్షిస్తుంది.

- **నిరంతర టెలిమెట్రీ**: మార్గమధ్యంలో ఉష్ణోగ్రత (°C) మరియు తేమ మార్పులను లెక్కిస్తుంది.
- **నష్టం నివారణ**: నాణ్యత తగ్గకముందే ప్రమాదాన్ని గుర్తిస్తుంది.
- **SLA రక్షణ**: తాజాదనం పరిమితి దాటితే, వెంటనే సమీప కోల్డ్ డిపోకు రీరూటింగ్ ప్రారంభించబడుతుంది.`,
        };
        return map[language] || map.en;
      }

      // 2. Multimodal Rail
      if (q.includes('rail') || q.includes('multimodal') || q.includes('ट्रेन') || q.includes('রেল') || q.includes('ରେଳ') || q.includes('రైలు')) {
        const map: Record<string, string> = {
          en: `### 🚂 Why Multimodal Kisan Rail is Selected
Karwaan combines refrigerated road feeders with **Kisan Rail Cold Wagons**:

1. **Continuous Thermal Control**: Dedicated train power units prevent road vibration and compressor exhaustion over 400+ km distances.
2. **Substantial Cost Reduction**: Long-haul rail rates reduce your per-kg freight expenses by **25% to 40%**.
3. **Zero Highway Jam Risks**: Bypasses traffic choke points along the NH-16 / NH-48 corridors.
4. **Eco-Friendly**: Lowers transport CO₂ emissions by up to **55%**.`,
          hi: `### 🚂 मल्टीमॉडल किसान रेल क्यों चुनी गई?
कारवां सड़क रीफर वाहनों को **किसान रेल कोल्ड वैगनों** के साथ जोड़ता है:

1. **स्थिर तापमान नियंत्रण**: 400+ किमी की लंबी दूरी पर कंप्रेसर पर दबाव कम होता है और माल सुरक्षित रहता है।
2. **भारी लागत बचत**: रेल माल ढुलाई से प्रति किलोग्राम लागत में **25% से 40%** तक की कमी आती है।
3. **हाईवे जाम से मुक्ति**: NH-16 कॉरिडोर के ट्रैफिक जाम से बचाव होता है।
4. **पर्यावरण अनुकूल**: कार्बन उत्सर्जन (CO₂) में **55%** तक की कमी होती है।`,
          or: `### 🚂 କିଷାନ ରେଳ ଶୀତଳ ୱାଗନ୍ କାହିଁକି ବଛାଗଲା?
କାରୱାନ ସଡ଼କ ପରିବହନ ସହିତ **କିଷାନ ରେଳ କୋଲ୍ଡ ୱାଗନ୍** କୁ ସଂଯୋଗ କରେ:

୧. **ଅବିରତ ତାପମାତ୍ରା ନିୟନ୍ତ୍ରଣ**: ୪୦୦+ କିମି ଦୂରତା ମଧ୍ୟରେ ଫସଲ ହଲଚଲ ନହୋଇ ସୁରକ୍ଷିତ ରହେ।
୨. **ବ୍ୟାପକ ଖର୍ଚ୍ଚ ସଞ୍ଚୟ**: ରେଳ ପରିବହନ ଦ୍ୱାରା ପ୍ରତି କିଲୋ ଭଡ଼ାରେ **୨୫% ରୁ ୪୦%** ପର୍ଯ୍ୟନ୍ତ ସଞ୍ଚୟ ହୁଏ।
୩. **ଟ୍ରାଫିକ୍ ଜାମ୍ ମୁକ୍ତ**: ଜାତୀୟ ରାଜପଥର ବିଳମ୍ବରୁ ମୁକ୍ତି ମିଳେ।
୪. **ପରିବେଶ ଅନୁକୂଳ**: କାର୍ବନ ନିର୍ଗମନ ପ୍ରାୟ **୫୫%** କମିଥାଏ।`,
          bn: `### 🚂 মাল্টিমোডাল কিষাণ রেল কেন নির্বাচন করা হলো?
কারওয়ান সড়ক রিফার এবং **কিষাণ রেল কোল্ড ওয়াগন** সমন্বয় করে:

১. **স্থির তাপমাত্রা নিয়ন্ত্রণ**: দীর্ঘ দূরত্বের যাত্রায় পণ্যের গুণমান অটুট থাকে।
২. **উল্লেখযোগ্য খরচ সাশ্রয়**: রেল পরিবহনে প্রতি কেজিতে **২৫% থেকে ৪০%** খরচ কমে।
৩. **যানজট মুক্ত গতি**: হাইওয়ের যানজট এড়িয়ে সময়মতো ডেলিভারি নিশ্চিত হয়।
৪. **পরিবেশবান্ধব**: কার্বন নির্গমন **৫৫%** পর্যন্ত হ্রাস পায়।`,
          te: `### 🚂 మల్టీమోడల్ కిసాన్ రైలు ఎందుకు ఎంపిక చేయబడింది?
కార్వాన్ రోడ్డు రీఫర్‌లను **కిసాన్ రైల్ కోల్డ్ వ్యాగన్‌లతో** అనుసంధానిస్తుంది:

1. **స్థిరమైన ఉష్ణోగ్రత**: 400+ కి.మీ ప్రయాణంలో సరుకు సురక్షితంగా ఉంటుంది.
2. **భారీ ఖర్చు పొదుపు**: రైలు రవాణా ద్వారా కిలోకు **25% నుండి 40%** ఖర్చు ఆదా అవుతుంది.
3. **ట్రాఫిక్ రహితం**: హైవే జామ్‌లను నివారిస్తుంది.
4. **పర్యావరణ హితం**: కార్బన్ ఉద్గారాలను **55%** వరకు తగ్గిస్తుంది.`,
        };
        return map[language] || map.en;
      }

      // 3. Cold Consolidation / Cost Savings
      if (q.includes('cost') || q.includes('save') || q.includes('बचत') || q.includes('ଖର୍ଚ୍ଚ') || q.includes('সাশ্রয়') || q.includes('ఖర్చు') || q.includes('consolidat')) {
        const map: Record<string, string> = {
          en: `### 💰 How Karwaan Cold Consolidation Cuts Costs
1. **LTL Aggregation**: Instead of paying for a dedicated empty truck, your partial cargo is matched with compatible goods in the same temperature band (+2°C to +4°C).
2. **High Capacity Utilization**: Fills vehicle load factors to **85-95%**, drastically splitting linehaul fixed costs.
3. **Dynamic Cross-Docking**: Uses certified regional hubs (e.g. Bhubaneswar, Cuttack, Kolkata, Visakhapatnam) for seamless transfer with zero temperature break.`,
          hi: `### 💰 कारवां कोल्ड समेकन से लागत कैसे घटती है?
1. **एलटीएल एकत्रीकरण (LTL Clustering)**: पूरे खाली ट्रक का भाड़ा देने के बजाय, आपका माल समान तापमान वाले अन्य कृषि उत्पादों के साथ समेकित होता है।
2. **उच्च वाहन क्षमता उपयोग**: वाहन की क्षमता को **85-95%** तक भरकर प्रति टन लागत में भारी कमी लाता है।
3. **प्रमाणित हब क्रॉस-डॉकिंग**: भुवनेश्वर, कटक, कोलकाता और विशाखापट्टनम जैसे आधुनिक हब में बिना कोल्ड-चेन टूटे ट्रांसफर होता है।`,
          or: `### 💰 କାରୱାନ ଶୀତଳ ସଂଗ୍ରହ ଦ୍ୱାରା ଖର୍ଚ୍ଚ କିପରି କମେ?
୧. **କ୍ଲଷ୍ଟର ଏକତ୍ରୀକରଣ**: ପୂରା ଟ୍ରକ୍ ଭଡ଼ା ନଦେଇ, ସମାନ ତାପମାତ୍ରା ବିଶିଷ୍ଟ ଅନ୍ୟ ସାମଗ୍ରୀ ସହିତ ଆପଣଙ୍କ ମାଲ୍ ପଠାଯାଏ।
୨. **ଗାଡ଼ି କ୍ଷମତାର ସର୍ବାଧିକ ବ୍ୟବହାର**: ଗାଡ଼ିକୁ **୮୫-୯୫%** ପୂର୍ଣ୍ଣ କରି ମୁଣ୍ଡପିଛା ଭଡ଼ା କମାଯାଏ।
୩. **ହବ୍ କ୍ରସ୍-ଡକିଂ**: ଭୁବନେଶ୍ୱର, କଟକ, କୋଲକାତା ଓ ଭାଇଜାଗ୍ ହବ୍ ରେ ଶୀତଳ ଶୃଙ୍ଖଳା ଅତୁଟ ରଖି ସ୍ଥାନାନ୍ତର ହୁଏ।`,
          bn: `### 💰 কোল্ড কনসলিডেশনে খরচ কীভাবে কমে?
১. **LTL ক্লাস্টারিং**: একক ট্রাকের পুরো ভাড়ার পরিবর্তে একই তাপমাত্রার পণ্যের সাথে মিলিয়ে পরিবহন করা হয়।
২. **সর্বোচ্চ ধারণক্ষমতা ব্যবহার**: যানবাহনের ক্ষমতা **৮৫-৯৫%** ব্যবহার করে পরিবহন খরচ বহুলাংশে কমানো হয়।
৩. **আধুনিক ক্রস-ডকিং**: কোল্ড-চেইন অক্ষুণ্ণ রেখে হাবের মাধ্যমে দ্রুত স্থানান্তর করা হয়।`,
          te: `### 💰 కోల్డ్ ఏకీకరణ ద్వారా ఖర్చులు ఎలా తగ్గుతాయి?
1. **LTL ఏకీకరణ**: ఖాళీ ట్రక్ కోసం పూర్తి ఖర్చు చేయకుండా, సరిపోలే ఉష్ణోగ్రత కలిగిన సరుకులతో కలిపి పంపుతారు.
2. **గరిష్ట సామర్థ్య వినియోగం**: వాహనంలో **85-95%** లోడ్ నింపడం ద్వారా ప్రయాణ ఖర్చులు తగ్గుతాయి.
3. **ధృవీకరించబడిన హబ్‌లు**: ఉష్ణోగ్రత తగ్గకుండా హబ్‌లలో సరుకు సురక్షితంగా బదిలీ చేయబడుతుంది.`,
        };
        return map[language] || map.en;
      }

      // Default Shipper Advice
      const defaultMap: Record<string, string> = {
        en: `### 📦 Karwaan Logistics Advisory
I am monitoring your consignments across the regional corridor. 

- **Consolidation State**: Active LTL clusters are being evaluated to maximize freight margin savings.
- **Thermal Integrity**: Reefer telemetries are operating within the nominal safety envelope.
- **SLA Priority**: Delivery deadlines are tracked against live multimodal schedules.

How can I assist with your cargo planning or route analysis?`,
        hi: `### 📦 कारवां लॉजिस्टिक्स सलाहकार
मैं आपके सभी शिपमेंट और कॉरिडोर की सक्रिय रूप से निगरानी कर रहा हूँ।

- **समेकन स्थिति**: अधिकतम भाड़ा बचत के लिए सक्रिय LTL क्लस्टर का विश्लेषण किया जा रहा है।
- **तापमान सुरक्षा**: सभी रीफर वाहन निर्धारित सुरक्षा दायरे में कार्य कर रहे हैं।
- **SLA प्राथमिकता**: डिलीवरी समयसीमा की लाइव मल्टीमॉडल शेड्यूल से तुलना की जा रही है।

मैं आपके कार्गो योजना या रूट विश्लेषण में क्या सहायता कर सकता हूँ?`,
        or: `### 📦 କାରୱାନ ଲଜିଷ୍ଟିକ୍ସ ପରାମର୍ଶ
ମୁଁ ଆପଣଙ୍କ ଚାଲାଣ ଏବଂ କରିଡର ଉପରେ ନଜର ରଖିଛି।

- **ସଂଗ୍ରହ ସ୍ଥିତି**: ସର୍ବାଧିକ ଖର୍ଚ୍ଚ ସଞ୍ଚୟ ପାଇଁ ଶୀତଳ କ୍ଲଷ୍ଟର ନିର୍ଦ୍ଧାରଣ ଚାଲିଛି।
- **ତାପମାତ୍ରା ସୁରକ୍ଷା**: ଗାଡ଼ିର ତାପମାତ୍ରା ସୁରକ୍ଷିତ ସୀମା ମଧ୍ୟରେ ଅଛି।
- **SLA ଲକ୍ଷ୍ୟ**: ସମୟାନୁବର୍ତ୍ତୀ ବିତରଣ ପାଇଁ ଲାଇଭ୍ ଟ୍ରାକିଂ ସକ୍ରିୟ ଅଛି।

ଆପଣଙ୍କ ସାମଗ୍ରୀ ପରିବହନ ପାଇଁ କୌଣସି ପ୍ରଶ୍ନ ପଚାରିପାରିବେ।`,
        bn: `### 📦 কারওয়ান লজিস্টিকস উপদেষ্টা
আমি আপনার সমস্ত চালান এবং করিডোর পর্যবেক্ষণ করছি।

- **সংহতি অবস্থা**: সর্বোচ্চ সাশ্রয়ের জন্য সক্রিয় LTL ক্লাস্টার বিশ্লেষণ করা হচ্ছে।
- **তাপমাত্রা অখণ্ডতা**: রিফার তাপমাত্রা নিরাপদ সীমার মধ্যে রয়েছে।
- **SLA লক্ষ্যমাত্রা**: সময়মতো পৌঁছানোর জন্য ট্র্যাকিং সক্রিয় রয়েছে।

কীভাবে আপনাকে সাহায্য করতে পারি?`,
        te: `### 📦 కార్వాన్ లాజిస్టిక్స్ సలహాదారు
నేను మీ సరుకులను మరియు కారిడార్‌ను నిరంతరం పర్యవేక్షిస్తున్నాను.

- **ఏకీకరణ స్థితి**: గరిష్ట పొదుపు కోసం LTL క్లస్టర్‌లు విశ్లేషించబడుతున్నాయి.
- **ఉష్ణోగ్రత సమగ్రత**: రీఫర్ ఉష్ణోగ్రత సురక్షిత పరిమితిలో ఉంది.
- **SLA ప్రాధాన్యత**: సకాలంలో డెలివరీ కోసం మానిటరింగ్ జరుగుతోంది.

మీ రవాణా ప్రణాళికలో నేను ఎలా సహాయపడగలను?`,
      };
      return defaultMap[language] || defaultMap.en;
    }

    // =========================================================================
    // DELIVERY AGENT / DRIVER FALLBACK RESPONSES
    // =========================================================================
    // 1. Compressor Failure / Incident Reporting
    if (q.includes('compressor') || q.includes('incident') || q.includes('breakdown') || q.includes('fail') || q.includes('खराबी') || q.includes('ଘଟଣା') || q.includes('সমস্যা') || q.includes('వైఫల్యం')) {
      const map: Record<string, string> = {
        en: `### 🚨 SOP: Reefer Malfunction / Compressor Disruption
1. **Immediate Safety Action**: Pull over safely. Check auxiliary power cable and verify digital thermostat display.
2. **Open Incident Modal**: Tap the red **"Report Incident"** button on your dashboard.
3. **Select Disruption**: Choose \`Spoilage Risk / Thermal Excursion\` or \`Vehicle Breakdown\`.
4. **Dispatch Alert**: Once submitted, Dispatch initiates automated AI rerouting to the nearest verified cold depot (e.g. Cuttack Agro Hub, Balasore Cold Hub).`,
        hi: `### 🚨 एसओपी: कंप्रेसर या रीफर खराबी की स्थिति में कदम
1. **तत्काल सुरक्षा कार्रवाई**: वाहन को सुरक्षित स्थान पर रोकें। रीफर पावर स्विच और डिजिटल थर्मामीटर की जांच करें।
2. **घटना रिपोर्ट खोलें**: अपने डैशबोर्ड पर लाल **"Report Incident"** बटन दबाएं।
3. **समस्या का चयन करें**: \`Spoilage Risk\` या \`Vehicle Breakdown\` चुनें।
4. **ऑटोमैटिक रीरूटिंग**: सबमिट करते ही डिस्पैच अलर्ट हो जाएगा और AI निकटतम कोल्ड स्टोरेज के लिए नया रूट तैयार करेगा।`,
        or: `### 🚨 SOP: କମ୍ପ୍ରେସର ଖରାପ କିମ୍ବା ତାପମାତ୍ରା ବୃଦ୍ଧି ସମୟରେ ପଦକ୍ଷେପ
୧. **ତୁରନ୍ତ ସୁରକ୍ଷା ପଦକ୍ଷେପ**: ଗାଡ଼ିକୁ ସୁରକ୍ଷିତ ଭାବେ ରଖନ୍ତୁ ଏବଂ ଫ୍ରିଜ୍ ପାୱାର୍ କେବୁଲ୍ ଯାଞ୍ଚ କରନ୍ତୁ।
୨. **ସମସ୍ୟା ରିପୋର୍ଟ କରନ୍ତୁ**: ଡ୍ୟାସବୋର୍ଡରେ ଥିବା ନାଲି **"Report Incident"** ବଟନ୍ ଦବାନ୍ତୁ।
୩. **ବିପଦ ଚୟନ କରନ୍ତୁ**: \`Spoilage Risk\` କିମ୍ବା \`Vehicle Breakdown\` ଚୟନ କରନ୍ତୁ।
୪. **ନୂଆ ରୁଟ୍ ସକ୍ରିୟ**: ରିପୋର୍ଟ ଦାଖଲ ହେବା ମାତ୍ରେ AI ଆପଣଙ୍କୁ ନିକଟସ୍ଥ ଶୀତଳ ଭଣ୍ଡାର (ଯଥା: କଟକ ଆଗ୍ରୋ ହବ୍) କୁ ନୂତନ ରୁଟ୍ ପ୍ରଦାନ କରିବ।`,
        bn: `### 🚨 SOP: কম্প্রেসার বিকল বা তাপমাত্রা বৃদ্ধির জরুরি পদক্ষেপ
১. **নিরাপত্তা পদক্ষেপ**: গাড়ি নিরাপদ স্থানে থামান এবং রিফার পাওয়ার সংযোগ পরীক্ষা করুন।
২. **ইনসিডেন্ট রিপোর্ট খুলুন**: ড্যাশবোর্ডের লাল **"Report Incident"** বাটনে ট্যাপ করুন।
৩. **ঝুঁকি নির্বাচন**: \`Spoilage Risk\` অথবা \`Vehicle Breakdown\` নির্বাচন করুন।
৪. **স্বয়ংক্রিয় রি-রুটিং**: সাবমিট করার সাথে সাথে ডিসপ্যাচ নিকটতম কোল্ড ডিপোর পথ নির্দেশ করবে।`,
        te: `### 🚨 SOP: కంప్రెసర్ వైఫల్యం మరియు అత్యవసర చర్యలు
1. **తక్షణ భద్రత**: వాహనాన్ని సురక్షితంగా ఆపి, రీఫర్ పవర్ కనెక్షన్‌ని తనిఖీ చేయండి.
2. **సమస్యను నివేదించండి**: మీ డ్యాష్‌బోర్డ్‌లోని ఎరుపు **"Report Incident"** బటన్‌ను నొక్కండి.
3. **ఎంపిక చేయండి**: \`Spoilage Risk\` లేదా \`Vehicle Breakdown\` ఎంచుకోండి.
4. **ఆటోమేటిక్ రీరూటింగ్**: సమర్పించిన వెంటనే సమీప కోల్డ్ హబ్‌కు AI కొత్త రూట్‌ను కేటాయిస్తుంది.`,
      };
      return map[language] || map.en;
    }

    // 2. Temperature Bounds / Pre-cooling
    if (q.includes('temp') || q.includes('bound') || q.includes('तापमान') || q.includes('ତାପମାତ୍ରା') || q.includes('উষ্ণতা') || q.includes('ఉష్ణోగ్రత')) {
      const map: Record<string, string> = {
        en: `### ❄️ Critical Reefer Thermal Bounds (SOP)
- **Pre-Cooling Target**: Verify cabin stabilizes between **+2.0°C and +4.0°C** before loading produce.
- **Normal In-Transit Range**: Maintain strictly between **+1.5°C and +4.0°C**.
- **Alert Level**: If temperature rises above **+5.0°C for > 20 mins**, the system triggers a Spoilage Alert.
- **Power Check**: Ensure auxiliary battery/reefer unit maintains at least **85% power** throughout all stopovers.`,
        hi: `### ❄️ रीफर तापमान सीमा निर्देश (SOP)
- **प्री-कूलिंग लक्ष्य**: माल लोड करने से पहले केबिन तापमान **+2.0°C से +4.0°C** के बीच स्थिर होना चाहिए।
- **सामान्य पारगमन दायरा**: यात्रा के दौरान सख्ती से **+1.5°C से +4.0°C** बनाए रखें।
- **अलर्ट स्तर**: यदि तापमान 20 मिनट से अधिक समय तक **+5.0°C** से ऊपर रहता है, तो स्पॉइलेज अलर्ट सक्रिय हो जाता है।
- **पावर जांच**: स्टॉपओवर के दौरान रीफर पावर न्यूनतम **85%** सुनिश्चित करें।`,
        or: `### ❄️ ଗାଡ଼ିର ସୁରକ୍ଷିତ ତାପମାତ୍ରା ନିୟମାବଳୀ (SOP)
- **ପ୍ରି-କୁଲିଂ ଲକ୍ଷ୍ୟ**: ସାମଗ୍ରୀ ଲୋଡ୍ କରିବା ପୂର୍ବରୁ କ୍ୟାବିନ୍ ତାପମାତ୍ରା **+୨.୦°C ରୁ +୪.୦°C** ମଧ୍ୟରେ ସ୍ଥିର ରୁହନ୍ତୁ।
- **ଯାତ୍ରା ସମୟର ନିୟମ**: ସର୍ବଦା **+୧.୫°C ରୁ +୪.୦°C** ମଧ୍ୟରେ ରଖନ୍ତୁ।
- **ବିପଦ ସତର୍କତା**: ଯଦି ୨୦ ମିନିଟରୁ ଅଧିକ ସମୟ **+୫.୦°C** ରୁ ଅଧିକ ରହେ, ତେବେ ସିଷ୍ଟମ୍ ଆଲର୍ଟ ଜାରି କରିବ।
- **ଫ୍ରିଜ୍ ପାୱାର୍**: ଯାତ୍ରା ସାରା ଫ୍ରିଜ୍ ପାୱାର୍ **୮୫%** ରୁ ଅଧିକ ରହିବା ଆବଶ୍ୟକ।`,
        bn: `### ❄️ রিফার তাপমাত্রা সংক্রান্ত এসওপি (SOP)
- **প্রি-কুলিং লক্ষ্যমাত্রা**: পণ্য তোলার আগে কেবিনের তাপমাত্রা **+২.০°C থেকে +৪.০°C** এর মধ্যে স্থিতিশীল করুন।
- **ট্রানজিট তাপমাত্রা**: চলাচলের সময় কঠোরভাবে **+১.৫°C থেকে +৪.০°C** বজায় রাখুন।
- **সতর্কতা স্তর**: তাপমাত্রা ২০ মিনিটের বেশি সময় **+৫.০°C** অতিক্রম করলে স্পয়েলেজ অ্যালার্ট বাজবে।
- **রিফার পাওয়ার**: প্রতিটি স্টপেজে পাওয়ার অন্তত **৮৫%** বজায় রাখুন।`,
        te: `### ❄️ రీఫర్ ఉష్ణోగ్రత పరిమితులు (SOP)
- **ప్రీ-కూలింగ్ లక్ష్యం**: సరుకు లోడ్ చేయడానికి ముందు క్యాబిన్ ఉష్ణోగ్రత **+2.0°C నుండి +4.0°C** వద్ద స్థిరీకరించండి.
- **రవాణా పరిమితి**: ప్రయాణంలో **+1.5°C నుండి +4.0°C** మధ్య మాత్రమే నిర్వహించండి.
- **హెచ్చరిక స్థాయి**: ఉష్ణోగ్రత 20 నిమిషాలకు పైగా **+5.0°C** దాటితే స్పాయిలేజ్ అలర్ట్ వస్తుంది.
- **పవర్ చెక్**: రీఫర్ పవర్ కనీసం **85%** ఉండేలా చూసుకోండి.`,
      };
      return map[language] || map.en;
    }

    // 3. Stop Sequence
    if (q.includes('stop') || q.includes('sequence') || q.includes('स्टॉप') || q.includes('ରହଣି') || q.includes('স্টপ') || q.includes('స్టాప్')) {
      const map: Record<string, string> = {
        en: `### 📍 Sequence Stops Protocol
1. **Adhere to Waypoints**: Follow the exact numerical order shown in your manifest.
2. **Unlock at Geo-Fence**: The **"COMPLETE"** button activates automatically when GPS detects arrival within 200m of the destination.
3. **Consignment Handover**: Verify crates, cross-check temperature gauge with the recipient, and tap **"COMPLETE"**.
4. **Final Delivery**: When all stops reach 100%, tap the pulsing **"FINISH DELIVERY"** button to close the manifest.`,
        hi: `### 📍 स्टॉप सीक्वेंस प्रोटोकॉल
1. **क्रम का पालन करें**: मैनिफेस्ट में दिखाए गए सटीक संख्यात्मक क्रम का पालन करें।
2. **जियो-फेंस अनलॉकिंग**: जब आप गंतव्य के 200 मीटर के दायरे में पहुंचेंगे, **"COMPLETE"** बटन अनलॉक हो जाएगा।
3. **माल सुपुर्दगी**: प्राप्तकर्ता के साथ तापमान गेज सत्यापित करें और **"COMPLETE"** दबाएं।
4. **अंतिम डिलीवरी**: सभी स्टॉप 100% पूर्ण होने पर मैनिफेस्ट बंद करने के लिए **"FINISH DELIVERY"** दबाएं।`,
        or: `### 📍 ରହଣି କ୍ରମ ନିୟମାବଳୀ
୧. **କ୍ରମ ଅନୁସରଣ କରନ୍ତୁ**: ମ୍ୟାନିଫେଷ୍ଟରେ ଥିବା କ୍ରମ ଅନୁଯାୟୀ ପ୍ରତ୍ୟେକ ସ୍ଥାନକୁ ଯାଆନ୍ତୁ।
୨. **ଅନଲକ୍ ନିୟମ**: ଗନ୍ତବ୍ୟ ସ୍ଥଳର ୨୦୦ ମିଟର ପାଖରେ ପହଞ୍ଚିବା ପରେ **"COMPLETE"** ବଟନ୍ ସକ୍ରିୟ ହେବ।
୩. **ମାଲ୍ ହସ୍ତାନ୍ତର**: ଗ୍ରାହକଙ୍କୁ ତାପମାତ୍ରା ଯାଞ୍ଚ କରାଇ **"COMPLETE"** କ୍ଲିକ୍ କରନ୍ତୁ।
୪. **ସମାପ୍ତି**: ସବୁ ରହଣି ଶେଷ ହେବା ପରେ **"FINISH DELIVERY"** ବଟନ୍ ଦବାଇ ମ୍ୟାନିଫେଷ୍ଟ ବନ୍ଦ କରନ୍ତୁ।`,
        bn: `### 📍 স্টপ সিকোয়েন্স প্রটোকল
১. **ক্রম মেনে চলুন**: ম্যানিফেস্টে উল্লেখিত নির্দিষ্ট ক্রম অনুযায়ী প্রতিটি স্টপে যান।
২. **জিও-ফেন্স আনলক**: গন্তব্যের ২০০ মিটারের মধ্যে পৌঁছালে **"COMPLETE"** বাটন সক্রিয় হবে।
৩. **পণ্য হস্তান্তর**: প্রাপকের উপস্থিতিতে তাপমাত্রা পরীক্ষা করে **"COMPLETE"** চাপুন।
৪. **চূড়ান্ত ডেলিভারি**: সমস্ত স্টপ শেষ হলে **"FINISH DELIVERY"** চেপে ম্যানিফেস্ট বন্ধ করুন।`,
        te: `### 📍 స్టాప్ సీక్వెన్స్ నియమాలు
1. **క్రమాన్ని అనుసరించండి**: మేనిఫెస్ట్ క్రమం ప్రకారం మాత్రమే స్టాప్‌లను పూర్తి చేయండి.
2. **అన్‌లాక్ ప్రక్రియ**: గమ్యస్థానానికి 200 మీటర్ల పరిధిలోకి రాగానే **"COMPLETE"** బటన్ సక్రియం అవుతుంది.
3. **సరుకు అప్పగింత**: ఉష్ణోగ్రతను తనిఖీ చేసి **"COMPLETE"** నొక్కండి.
4. **తుది డెలివరీ**: అన్ని స్టాప్‌లు పూర్తయ్యాక **"FINISH DELIVERY"** నొక్కి మేనిఫెస్ట్‌ను ముగించండి.`,
      };
      return map[language] || map.en;
    }

    // Default Driver Guidance
    const defaultDriverMap: Record<string, string> = {
      en: `### 🚛 Karwaan Fleet Dispatch
Standing by on channel. 

- **Telemetry**: Route GPS and cabin sensors are synchronizing.
- **Safety Rule**: Keep cabin temperature strictly between **+2.0°C and +4.0°C**.
- **Incident Alert**: Use **"Report Incident"** for any congestion, mechanical issue, or excursion.

Drive safely, Captain! Let me know if you need specific waypoint or protocol guidance.`,
      hi: `### 🚛 कारवां फ्लीट डिस्पैच
डिस्पैच चैनल सक्रिय है।

- **टेलीमेट्री**: रूट GPS और केबिन सेंसर लगातार सिंक हो रहे हैं।
- **सुरक्षा नियम**: केबिन का तापमान **+2.0°C से +4.0°C** के बीच बनाए रखें।
- **अलर्ट**: किसी भी जाम या वाहन खराबी के लिए **"Report Incident"** का उपयोग करें।

सावधानी से वाहन चलाएं, कैप्टन! किसी भी सहायता के लिए बताएं।`,
      or: `### 🚛 କାରୱାନ ଫ୍ଲିଟ୍ ଡିସପାଚ୍
ଡିସପାଚ୍ ଚ୍ୟାନେଲ୍ ସକ୍ରିୟ ଅଛି।

- **ଟେଲିମେଟ୍ରି**: ରୁଟ୍ GPS ଏବଂ କ୍ୟାବିନ୍ ସେନ୍ସର ସଠିକ୍ ଭାବେ କାର୍ଯ୍ୟ କରୁଛି।
- **ସୁରକ୍ଷା ନିୟମ**: ତାପମାତ୍ରାକୁ ସର୍ବଦା **+୨.୦°C ରୁ +୪.୦°C** ମଧ୍ୟରେ ରଖନ୍ତୁ।
- **ସତର୍କତା**: କୌଣସି ଜାମ୍ ବା ଗାଡ଼ି ସମସ୍ୟା ପାଇଁ **"Report Incident"** ବ୍ୟବହାର କରନ୍ତୁ।

ସତର୍କତାର ସହ ଗାଡ଼ି ଚଳାନ୍ତୁ, କ୍ୟାପଟେନ୍!`,
      bn: `### 🚛 কারওয়ান ফ্লিট ডিসপ্যাচ
ডিসপ্যাচ চ্যানেল সক্রিয়।

- **টেলিমেট্রি**: রুট জিপিএস এবং সেন্সর স্বাভাবিকভাবে কাজ করছে।
- **নিরাপত্তা নিয়ম**: কেবিনের তাপমাত্রা **+২.০°C থেকে +৪.০°C** এর মধ্যে রাখুন।
- **জরুরি রিপোর্ট**: যানজট বা সমস্যার ক্ষেত্রে **"Report Incident"** ব্যবহার করুন।

নিরাপদে গাড়ি চালান, ক্যাপ্টেন!`,
      te: `### 🚛 కార్వాన్ ఫ్లీట్ డిస్పాచ్
డిస్పాచ్ ఛానల్ సిద్ధంగా ఉంది.

- **టెలిమెట్రీ**: GPS మరియు సెన్సార్లు సమకాలీకరించబడుతున్నాయి.
- **భద్రతా నియమం**: ఉష్ణోగ్రతను **+2.0°C నుండి +4.0°C** వద్ద నిర్వహించండి.
- **హెచ్చరిక**: ఏదైనా సమస్య వస్తే **"Report Incident"** ఉపయోగించండి.

జాగ్రత్తగా డ్రైవ్ చేయండి, కెప్టెన్!`,
    };
    return defaultDriverMap[language] || defaultDriverMap.en;
  }
};
