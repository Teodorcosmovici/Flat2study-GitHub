import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const countries = [
  { code: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+31', name: 'Netherlands', flag: '🇳🇱' },
  { code: '+32', name: 'Belgium', flag: '🇧🇪' },
  { code: '+41', name: 'Switzerland', flag: '🇨🇭' },
  { code: '+43', name: 'Austria', flag: '🇦🇹' },
];

const messageSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  countryCode: z.string().min(1, "Country code is required"),
  phoneNumber: z.string().trim().min(1, "Phone number is required").max(20, "Phone number must be less than 20 characters"),
  message: z.string().trim().min(1, "Message is required").max(1000, "Message must be less than 1000 characters"),
});

type MessageFormData = z.infer<typeof messageSchema>;

interface ChatMessageFormProps {
  onSuccess: () => void;
}

export const ChatMessageForm: React.FC<ChatMessageFormProps> = ({ onSuccess }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      name: profile?.full_name || '',
      countryCode: '+39',
      phoneNumber: profile?.phone?.replace(/^\+\d+/, '') || '',
      message: '',
    },
  });

  const onSubmit = async (data: MessageFormData) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('support_messages')
        .insert({
          user_id: user?.id || null,
          sender_name: data.name,
          phone_number: data.phoneNumber,
          country_code: data.countryCode,
          message: data.message,
        });

      if (error) throw error;

      setIsSuccess(true);
      form.reset();
      
      toast({
        title: "Message sent successfully!",
        description: "We'll reply as fast as possible.",
      });

      setTimeout(() => {
        onSuccess();
        setIsSuccess(false);
      }, 2000);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <div className="text-2xl mb-2">✅</div>
        <h3 className="text-lg font-semibold mb-2">Message Sent!</h3>
        <p className="text-muted-foreground">We'll reply as fast as possible.</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {!user && (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-3 gap-2">
          <FormField
            control={form.control}
            name="countryCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Code" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.flag} {country.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="123456789" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="How can we help you?"
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Send Message'
          )}
        </Button>
      </form>
    </Form>
  );
};