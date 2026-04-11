import { useState, useEffect } from 'react';
import { useSettings } from '../lib/hooks';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AntiAdBlock() {
  const { settings, loading } = useSettings();
  const [isAdBlockerActive, setIsAdBlockerActive] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (loading || !settings?.antiAdBlockEnabled) return;

    const checkAdBlocker = async () => {
      // Method 1: Try to fetch a common ad script
      try {
        const url = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        const response = await fetch(url, { mode: 'no-cors', cache: 'no-store' });
        // If fetch fails or is blocked, it might throw an error or return a blocked response
      } catch (error) {
        setIsAdBlockerActive(true);
        return;
      }

      // Method 2: Check for a hidden dummy element
      const dummy = document.createElement('div');
      dummy.innerHTML = '&nbsp;';
      dummy.className = 'adsbox';
      dummy.style.position = 'absolute';
      dummy.style.top = '-1000px';
      dummy.style.left = '-1000px';
      document.body.appendChild(dummy);
      
      window.setTimeout(() => {
        if (dummy.offsetHeight === 0) {
          setIsAdBlockerActive(true);
        }
        document.body.removeChild(dummy);
      }, 100);
    };

    checkAdBlocker();
  }, [settings, loading]);

  if (!isAdBlockerActive || dismissed || !settings?.antiAdBlockEnabled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg border border-destructive/20 flex gap-3 items-start">
        <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
        <div className="flex-1">
          <h4 className="font-bold text-sm">Ad Blocker Detected</h4>
          <p className="text-xs mt-1 opacity-90">
            {settings.antiAdBlockMessage || "Please disable your ad blocker to support our blog. Ads help us keep the content free!"}
          </p>
          <div className="mt-3 flex gap-2">
            <Button 
              size="sm" 
              variant="secondary" 
              className="h-7 text-xs"
              onClick={() => window.location.reload()}
            >
              I've disabled it
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 text-xs hover:bg-white/10"
              onClick={() => setDismissed(true)}
            >
              Dismiss
            </Button>
          </div>
        </div>
        <button onClick={() => setDismissed(true)} className="hover:opacity-70">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
