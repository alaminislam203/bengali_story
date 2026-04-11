import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, Pause } from 'lucide-react';
import { toast } from 'sonner';

interface TextToSpeechProps {
  text: string;
}

export default function TextToSpeech({ text }: TextToSpeechProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      // Try to find a Bengali voice, fallback to English or default
      const bnVoice = voices.find(v => v.lang.includes('bn'));
      const enVoice = voices.find(v => v.lang.includes('en'));
      setVoice(bnVoice || enVoice || voices[0] || null);
    };

    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handlePlay = () => {
    if (!text) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    // Strip markdown and HTML tags for better reading
    const cleanText = text.replace(/<[^>]*>?/gm, '').replace(/[#*_~`]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (voice) {
      utterance.voice = voice;
    }
    
    // Adjust rate and pitch for a "beautiful" voice feel
    utterance.rate = 0.9;
    utterance.pitch = 1.1;

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.error("Speech synthesis error", e);
      setIsSpeaking(false);
      setIsPaused(false);
      if (e.error !== 'canceled') {
        toast.error("Failed to play audio.");
      }
    };

    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsSpeaking(false);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  if (!window.speechSynthesis) {
    return null; // Browser doesn't support TTS
  }

  return (
    <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg border w-fit">
      <span className="text-sm font-medium text-muted-foreground mr-2">Listen:</span>
      {!isSpeaking ? (
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={handlePlay} title="Play Audio">
          <Play className="h-4 w-4" />
        </Button>
      ) : (
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={handlePause} title="Pause Audio">
          <Pause className="h-4 w-4" />
        </Button>
      )}
      {(isSpeaking || isPaused) && (
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={handleStop} title="Stop Audio">
          <Square className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
