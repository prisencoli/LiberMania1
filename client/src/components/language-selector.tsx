import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { languageNames } from '@/lib/i18n';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  // Check if the current language is RTL (right-to-left)
  const isRTL = i18n.language === 'ar';
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="px-2"
          aria-label="Select Language"
        >
          <Globe className="h-4 w-4 mr-1" />
          <span className="text-xs font-medium">{i18n.language.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {Object.entries(languageNames).map(([code, name]) => (
          <DropdownMenuItem 
            key={code}
            className={`flex items-center ${i18n.language === code ? 'bg-primary-50 text-primary' : ''}`}
            onClick={() => handleLanguageChange(code)}
          >
            <span className={`rounded mr-2 text-xs ${i18n.language === code ? 'font-bold' : ''}`}>
              {code.toUpperCase()}
            </span>
            <span className="flex-grow">{name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}