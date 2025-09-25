import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from './button';

interface WhatsAppChatButtonProps {
  phoneNumber?: string;
  message?: string;
}

export const WhatsAppChatButton: React.FC<WhatsAppChatButtonProps> = ({
  phoneNumber = "+393520488172",
  message = "Hi! I'm interested in your student housing options."
}) => {
  const handleWhatsAppClick = () => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\+/g, '').replace(/\s/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={handleWhatsAppClick}
        size="icon"
        className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse hover:animate-none group"
        aria-label="Chat with us on WhatsApp"
      >
        <MessageCircle className="h-6 w-6 text-primary-foreground group-hover:scale-110 transition-transform duration-200" />
      </Button>
      
      {/* Tooltip */}
      <div className="absolute bottom-16 right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="bg-card text-card-foreground px-3 py-2 rounded-lg shadow-md text-sm whitespace-nowrap border">
          Chat with us on WhatsApp
        </div>
      </div>
    </div>
  );
};