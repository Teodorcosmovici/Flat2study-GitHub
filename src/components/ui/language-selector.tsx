import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'default' | 'compact' | 'mobile-icon';
}

export function LanguageSelector({ variant = 'default' }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'it' : 'en');
  };

  const buttonText = language === 'en' ? 'Italiano' : 'English';

  if (variant === 'mobile-icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleLanguage}
        className="h-auto w-auto p-1"
      >
        <Globe className="h-5 w-5 text-current" />
      </Button>
    );
  }

  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleLanguage}
        className="flex items-center gap-2 h-auto px-2 py-1"
      >
        <Globe className="h-4 w-4 text-current opacity-70" />
        <span className="text-sm">{buttonText}</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={toggleLanguage}
      className="flex items-center gap-2"
    >
      <Globe className="h-4 w-4 text-current opacity-70" />
      <span>{buttonText}</span>
    </Button>
  );
}