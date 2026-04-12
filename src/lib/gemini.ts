import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set. AI features will not work.");
}

export const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export async function detectMood(text: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the mood of the following text and return ONLY one word from this list: [scary, happy, sad, neutral, exciting, mysterious, romantic, angry, peaceful].
      
      Text: ${text.substring(0, 1000)}`,
    });
    
    const mood = response.text?.trim().toLowerCase() || "neutral";
    return mood;
  } catch (error) {
    console.error("Error detecting mood:", error);
    return "neutral";
  }
}

export async function generateAIVoice(text: string, mood: string, voiceName: string = 'Aoide'): Promise<string | null> {
  try {
    // Improved prompt for emotional range and storyteller persona
    const prompt = `You are a professional storyteller. Read the following text with a deep ${mood} emotion. 
    Use a natural, expressive, and human-like tone. 
    Vary your pitch, speed, and volume to match the ${mood} atmosphere. 
    Add dramatic pauses where appropriate to make the story more engaging.
    
    Text to read: ${text}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("Error generating AI voice:", error);
    return null;
  }
}

export interface ModerationResult {
  safe: boolean;
  reason?: string;
  category?: string;
  confidence: "low" | "medium" | "high";
}

export async function moderateContent(text: string): Promise<ModerationResult> {
  // Helper to normalize text for bypass detection
  const normalizeText = (str: string) => {
    return str
      .toLowerCase()
      // Remove common masking characters
      .replace(/[*._\-@$!?]/g, '')
      // Basic leetspeak normalization
      .replace(/0/g, 'o')
      .replace(/1/g, 'i')
      .replace(/3/g, 'e')
      .replace(/4/g, 'a')
      .replace(/5/g, 's')
      .replace(/7/g, 't')
      .replace(/8/g, 'b');
  };

  const normalizedText = normalizeText(text);

  // First line of defense: Local Profanity Filter (Instant & Reliable)
  // Includes common English and Bengali prohibited terms
  const prohibitedPatterns = [
    /fuck/i, /shit/i, /bitch/i, /asshole/i,
    /nigger/i, /chink/i, /spic/i, /retard/i, /fag[g]ot/i,
    /khanki/i, /magi/i, /chuda/i, /gandu/i, /bal/i,
    /sala/i, /khachra/i, /behaya/i, /harami/i, /shala/i
  ];

  if (prohibitedPatterns.some(pattern => pattern.test(normalizedText) || pattern.test(text))) {
    return {
      safe: false,
      reason: "Content contains prohibited language or masked profanity.",
      category: "toxic",
      confidence: "high"
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are the ULTIMATE AI Security Sentinel for a high-traffic blog. Your duty is to maintain a professional, safe, and inclusive environment.
      
      STRICT MODERATION GUIDELINES:
      1. PROFANITY: Block all vulgarity, including MASKED words (e.g., f*ck, sh!t, b.i.t.c.h, c#uda).
      2. LEETSPEAK: Detect and block words using numbers or symbols (e.g., f0ck, 5hit).
      3. HARASSMENT: Block direct attacks, name-calling, or persistent bullying.
      4. HATE SPEECH: Zero tolerance for attacks based on race, religion, gender, or identity.
      5. TOXICITY: Block extreme negativity, "trolling", or attempts to derail conversations.
      6. PII: Block phone numbers, home addresses, or private emails.
      7. MALICIOUS: Block phishing attempts, suspicious links, or scam patterns.
      8. BENGALI TOXICITY: Be extra vigilant for toxic content written in Bengali (Bangla), including masked Bengali slurs.
      
      EVALUATION LOGIC:
      - If the user is trying to bypass filters using symbols, it is an automatic BLOCK.
      - If the content is "borderline", err on the side of caution (Block it).
      - If it's a personal attack ("You are..."), it's NOT SAFE.
      
      Return ONLY a JSON object:
      {
        "safe": boolean,
        "reason": "Professional explanation of the decision",
        "category": "toxic|spam|hate|explicit|pii|violence|other",
        "confidence": "low|medium|high"
      }
      
      Content to scan: ${text.substring(0, 3000)}`,
    });
    
    const resultText = response.text?.trim() || '{"safe": true, "confidence": "high"}';
    const jsonString = resultText.replace(/```json|```/g, "").trim();
    const result = JSON.parse(jsonString);

    // Double check: Override if local filter catches something AI missed
    if (result.safe && (prohibitedPatterns.some(pattern => pattern.test(normalizedText) || pattern.test(text)))) {
      return {
        safe: false,
        reason: "Security Sentinel Override: Masked profanity detected.",
        category: "toxic",
        confidence: "high"
      };
    }

    return result;
  } catch (error) {
    console.error("AI Security Sentinel Error:", error);
    return { safe: true, confidence: "low", reason: "Sentinel fallback: AI temporarily unavailable" };
  }
}

export interface ContentQualityResult {
  score: number;
  feedback: string[];
  suggestions: string;
  readability: string;
}

export async function analyzeContentQuality(title: string, content: string): Promise<ContentQualityResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following blog post for quality. 
      Title: ${title}
      Content: ${content.substring(0, 5000)}
      
      Evaluate based on:
      1. Readability
      2. Grammar and Clarity
      3. Engagement potential
      4. Structure
      
      Return ONLY a JSON object:
      {
        "score": number (0-100),
        "feedback": ["point 1", "point 2", ...],
        "suggestions": "one paragraph of constructive advice",
        "readability": "Easy|Medium|Difficult"
      }`,
    });
    
    const resultText = response.text?.trim() || "";
    const jsonString = resultText.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("AI Quality Analysis Error:", error);
    return { score: 0, feedback: [], suggestions: "Analysis unavailable", readability: "Unknown" };
  }
}

export async function suggestTags(title: string, content: string): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest 5 relevant tags for a blog post with this title and content. 
      Title: ${title}
      Content: ${content.substring(0, 2000)}
      
      Return ONLY a comma-separated list of tags. No numbering, no extra text.`,
    });
    
    const tags = response.text?.split(',').map(t => t.trim()) || [];
    return tags.slice(0, 5);
  } catch (error) {
    console.error("AI Tag Suggestion Error:", error);
    return [];
  }
}

export async function playRawPCM(base64Data: string, sampleRate: number = 24000) {
  try {
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Int16Array(len / 2);
    for (let i = 0; i < len; i += 2) {
      // L16 PCM is little-endian
      bytes[i / 2] = (binaryString.charCodeAt(i + 1) << 8) | binaryString.charCodeAt(i);
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass();
    const audioBuffer = audioContext.createBuffer(1, bytes.length, sampleRate);
    const channelData = audioBuffer.getChannelData(0);

    for (let i = 0; i < bytes.length; i++) {
      channelData[i] = bytes[i] / 32768; // Convert Int16 to Float32
    }

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
    return { source, audioContext };
  } catch (error) {
    console.error("Error playing raw PCM:", error);
    return null;
  }
}
