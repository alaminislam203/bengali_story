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
