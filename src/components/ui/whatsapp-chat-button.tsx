import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from './button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { ChatMessageForm } from './chat-message-form';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export const ChatButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className={cn("fixed right-6 z-50", isMobile ? "bottom-24" : "bottom-6")}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 group"
            aria-label="Chat with support"
          >
            <MessageCircle className="h-6 w-6 text-primary-foreground group-hover:scale-110 transition-transform duration-200" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Support</DialogTitle>
          </DialogHeader>
          <ChatMessageForm onSuccess={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>
      
      {/* Tooltip */}
      <div className="absolute bottom-16 right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="bg-card text-card-foreground px-3 py-2 rounded-lg shadow-md text-sm whitespace-nowrap border">
          Chat with support
        </div>
      </div>
    </div>
  );
};