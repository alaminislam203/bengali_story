import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, Pause, Sparkles, Loader2, User, UserCircle, Volume2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { detectMood, generateAIVoice, playRawPCM } from '../lib/gemini';
import { cn } from '../lib/utils';

interface AITextToSpeechProps {
  text: string;
}

const VOICES = [
  { id: 'Aoide', name: 'Aoide', gender: 'Female', desc: 'Expressive' },
  { id: 'Kore', name: 'Kore', gender: 'Female', desc: 'Clear' },
  { id: 'Puck', name: 'Puck', gender: 'Male', desc: 'Playful' },
  { id: 'Charon', name: 'Charon', gender: 'Male', desc: 'Deep' },
  { id: 'Fenrir', name: 'Fenrir', gender: 'Male', desc: 'Strong' },
  { id: 'Zephyr', name: 'Zephyr', gender: 'Male', desc: 'Soft' },
];

export default function AITextToSpeech({ text }: AITextToSpeechProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mood, setMood] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('Aoide');
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  
  const audioRef = useRef<{ source: AudioBufferSourceNode; audioContext: AudioContext } | null>(null);
  const isStoppingRef = useRef(false);

  const chunkText = (input: string, maxLength: number = 2000): string[] => {
    const cleanText = input.replace(/<[^>]*>?/gm, '').replace(/[#*_~`]/g, '');
    const chunks: string[] = [];
    let currentChunk = "";
    
    // Split by common sentence delimiters including Bengali '।'
    // Also handle cases where there are no delimiters by splitting by length
    const sentences = cleanText.match(/[^.!?।]+[.!?।]+|[^.!?।]+/g) || [cleanText];
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxLength) {
        if (currentChunk) chunks.push(currentChunk.trim());
        
        // If a single sentence is longer than maxLength, split it by length
        let remainingSentence = sentence;
        while (remainingSentence.length > maxLength) {
          chunks.push(remainingSentence.substring(0, maxLength).trim());
          remainingSentence = remainingSentence.substring(maxLength);
        }
        currentChunk = remainingSentence;
      } else {
        currentChunk += sentence;
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks.filter(c => c.length > 0);
  };

  const handlePlayAI = async () => {
    if (!text) return;

    if (isPlaying) {
      handleStop();
      return;
    }

    setIsGenerating(true);
    isStoppingRef.current = false;
    
    try {
      // 1. Detect Mood
      const detectedMood = await detectMood(text);
      setMood(detectedMood);
      
      // 2. Prepare Chunks
      const chunks = chunkText(text);
      setTotalChunks(chunks.length);
      setCurrentChunkIndex(0);
      
      // 3. Sequential Playback
      await playChunks(chunks, detectedMood, selectedVoice);
      
    } catch (error) {
      console.error("AI TTS error:", error);
      toast.error("Something went wrong with the AI voice.");
    } finally {
      setIsGenerating(false);
    }
  };

  const playChunks = async (chunks: string[], detectedMood: string, voice: string) => {
    for (let i = 0; i < chunks.length; i++) {
      if (isStoppingRef.current) break;
      
      setCurrentChunkIndex(i);
      setIsGenerating(true);
      
      const base64Audio = await generateAIVoice(chunks[i], detectedMood, voice);
      setIsGenerating(false);
      
      if (!base64Audio) {
        toast.error(`Failed to generate voice for part ${i + 1}`);
        continue;
      }

      const playback = await playRawPCM(base64Audio);
      if (playback) {
        audioRef.current = playback;
        setIsPlaying(true);
        
        // Wait for this chunk to finish before moving to the next
        await new Promise<void>((resolve) => {
          playback.source.onended = () => {
            audioRef.current = null;
            resolve();
          };
        });
      }
    }
    
    if (!isStoppingRef.current) {
      setIsPlaying(false);
      setMood(null);
      toast.success("Finished reading the story.");
    }
  };

  const handleStop = () => {
    isStoppingRef.current = true;
    if (audioRef.current) {
      audioRef.current.source.stop();
      audioRef.current.audioContext.close();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsGenerating(false);
  };

  useEffect(() => {
    return () => {
      handleStop();
    };
  }, []);

  return (
    <div className="flex flex-col gap-3 bg-card border rounded-2xl p-4 shadow-sm w-full max-w-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-full">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-bold">AI Storyteller</h4>
            <p className="text-[10px] text-muted-foreground">Powered by Gemini AI</p>
          </div>
        </div>
        
        <div className="relative">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-2 text-xs"
            onClick={() => setShowVoiceSelector(!showVoiceSelector)}
          >
            <Volume2 className="h-3.5 w-3.5" />
            {selectedVoice}
            <ChevronDown className={cn("h-3 w-3 transition-transform", showVoiceSelector && "rotate-180")} />
          </Button>
          
          {showVoiceSelector && (
            <div className="absolute right-0 mt-2 w-48 bg-popover border rounded-xl shadow-lg z-50 p-1 animate-in fade-in zoom-in-95 duration-200">
              <div className="grid gap-1">
                {VOICES.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => {
                      setSelectedVoice(voice.id);
                      setShowVoiceSelector(false);
                    }}
                    className={cn(
                      "flex flex-col items-start px-3 py-2 rounded-lg text-left transition-colors",
                      selectedVoice === voice.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    )}
                  >
                    <span className="text-xs font-bold">{voice.name}</span>
                    <span className={cn("text-[10px]", selectedVoice === voice.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
                      {voice.gender} • {voice.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {isGenerating ? (
          <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-xl border border-dashed">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <div className="flex-1 space-y-1">
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {currentChunkIndex + 1 === totalChunks ? 'Finalizing...' : `Preparing Part ${currentChunkIndex + 1} of ${totalChunks}`}
              </div>
              <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${((currentChunkIndex + 1) / (totalChunks || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ) : !isPlaying ? (
          <Button 
            variant="default" 
            className="flex-1 h-10 gap-2 rounded-xl shadow-md hover:shadow-lg transition-all" 
            onClick={handlePlayAI} 
          >
            <Play className="h-4 w-4 fill-current" />
            Listen to Full Story
          </Button>
        ) : (
          <div className="flex-1 flex items-center gap-3">
            <Button 
              variant="destructive" 
              className="h-10 gap-2 rounded-xl shadow-md flex-1" 
              onClick={handleStop} 
            >
              <Square className="h-4 w-4 fill-current" />
              Stop Storyteller
            </Button>
            
            {mood && (
              <div className="px-3 py-2 bg-primary/10 rounded-xl border border-primary/20 flex flex-col items-center min-w-[80px]">
                <span className="text-[8px] font-bold text-primary/60 uppercase tracking-tighter">Mood</span>
                <span className="text-xs font-black text-primary uppercase">{mood}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {isPlaying && !isGenerating && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
            <span>Reading Part {currentChunkIndex + 1}</span>
            <span>{Math.round(((currentChunkIndex + 1) / totalChunks) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300" 
              style={{ width: `${((currentChunkIndex + 1) / totalChunks) * 100}%` }}
            />
          </div>
          <div className="flex justify-center gap-1 pt-1">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div 
                key={i} 
                className="w-1 bg-primary/40 rounded-full animate-bounce" 
                style={{ 
                  height: `${Math.random() * 16 + 4}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.6s'
                }} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
