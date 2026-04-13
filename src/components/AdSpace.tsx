import { useEffect, useRef } from 'react';
import { useSettings } from '../lib/hooks';
import { cn } from '../lib/utils';

interface AdSpaceProps {
  slot: 'adHeader' | 'adSidebar' | 'adFooter' | 'adInPost';
  className?: string;
}

export default function AdSpace({ slot, className }: AdSpaceProps) {
  const { settings, loading } = useSettings();
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && settings && settings[slot] && adRef.current) {
      // Clear previous content
      adRef.current.innerHTML = '';
      
      // Create a temporary container to parse HTML
      const container = document.createElement('div');
      container.innerHTML = settings[slot] as string;
      
      // Append non-script elements and execute scripts
      const nodes = Array.from(container.childNodes);
      nodes.forEach(node => {
        if (node.nodeName === 'SCRIPT') {
          const script = document.createElement('script');
          const scriptNode = node as HTMLScriptElement;
          
          // Copy attributes
          Array.from(scriptNode.attributes).forEach(attr => {
            script.setAttribute(attr.name, attr.value);
          });
          
          // Copy inline content
          if (scriptNode.innerHTML) {
            script.innerHTML = scriptNode.innerHTML;
          }
          
          adRef.current?.appendChild(script);
        } else {
          adRef.current?.appendChild(node.cloneNode(true));
        }
      });
    }
  }, [settings, slot, loading]);

  if (loading || !settings || !settings[slot] || (settings[slot] as string).trim() === '') {
    return null;
  }

  return (
    <div 
      ref={adRef}
      className={cn("min-h-[1px]", className)}
    />
  );
}
