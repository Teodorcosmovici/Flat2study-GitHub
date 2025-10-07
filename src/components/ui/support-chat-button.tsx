import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from './button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { Input } from './input';
import { Textarea } from './textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Label } from './label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

const countries = [
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+31', name: 'Netherlands', flag: '🇳🇱' },
  { code: '+32', name: 'Belgium', flag: '🇧🇪' },
  { code: '+41', name: 'Switzerland', flag: '🇨🇭' },
  { code: '+43', name: 'Austria', flag: '🇦🇹' },
];

const supportMessageSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  countryCode: z.string().min(1, 'Country code is required'),
  phoneNumber: z.string().trim().min(1, 'Phone number is required').max(20, 'Phone number must be less than 20 characters'),
  message: z.string().trim().min(1, 'Message is required').max(1000, 'Message must be less than 1000 characters')
});

export const SupportChatButton: React.FC = () => {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    countryCode: '+39',
    phoneNumber: '',
    message: ''
  });

  useEffect(() => {
    if (user && profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.full_name || '',
        phoneNumber: profile.phone || ''
      }));
    }
  }, [user, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form data
      const validatedData = supportMessageSchema.parse(formData);
      
      setIsSubmitting(true);

      const { error } = await supabase
        .from('support_messages')
        .insert([
          {
            user_id: user?.id || null,
            sender_name: validatedData.name,
            phone_number: validatedData.phoneNumber,
            country_code: validatedData.countryCode,
            message: validatedData.message
          }
        ]);

      if (error) throw error;

      setShowSuccessMessage(true);
      setFormData({
        name: profile?.full_name || '',
        countryCode: '+39',
        phoneNumber: profile?.phone || '',
        message: ''
      });

      toast({
        title: "Message sent successfully",
        description: "We'll reply as fast as possible!",
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive",
        });
      } else {
        console.error('Error sending support message:', error);
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 300);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse hover:animate-none group"
            aria-label="Contact support"
            data-chat-button
          >
            <MessageCircle className="h-6 w-6 text-primary-foreground group-hover:scale-110 transition-transform duration-200" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Contact Support
            </DialogTitle>
          </DialogHeader>

          {showSuccessMessage ? (
            <div className="text-center py-6">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-lg font-semibold mb-2">Message Sent!</h3>
              <p className="text-muted-foreground mb-4">
                Thank you for contacting us. We'll reply as fast as possible!
              </p>
              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!user && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your full name"
                    required
                    maxLength={100}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select
                    value={formData.countryCode}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, countryCode: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          <span className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{country.code}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="1234567890"
                    required
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="How can we help you?"
                  required
                  maxLength={1000}
                  rows={4}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {formData.message.length}/1000
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Tooltip */}
      <div className="absolute bottom-16 right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="bg-card text-card-foreground px-3 py-2 rounded-lg shadow-md text-sm whitespace-nowrap border">
          Contact Support
        </div>
      </div>
    </div>
  );
};