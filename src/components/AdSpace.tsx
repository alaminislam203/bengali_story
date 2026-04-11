import { useSettings } from '../lib/hooks';

interface AdSpaceProps {
  slot: 'adHeader' | 'adSidebar' | 'adFooter' | 'adInPost';
  className?: string;
}

export default function AdSpace({ slot, className }: AdSpaceProps) {
  const { settings, loading } = useSettings();

  if (loading || !settings || !settings[slot]) {
    return null;
  }

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: settings[slot] as string }}
    />
  );
}
