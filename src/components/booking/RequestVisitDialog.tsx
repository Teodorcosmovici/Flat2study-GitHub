import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Listing } from '@/types';

interface RequestVisitDialogProps {
  listing: Listing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestVisitDialog({ listing, open, onOpenChange }: RequestVisitDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Create a message in the messages table
      const { error } = await supabase
        .from('messages')
        .insert({
          listing_id: listing.id,
          agency_id: listing.landlord.id,
          sender_id: user?.id || null,
          sender_name: formData.name,
          sender_phone: formData.phone,
          message: t('booking.visitRequest.message'),
          conversation_id: `visit-${Date.now()}`
        });

      if (error) throw error;

      toast({
        title: t('booking.visitRequest.success'),
        description: t('booking.visitRequest.successDesc'),
      });

      // Reset form and close dialog
      setFormData({ name: '', email: '', phone: '' });
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending visit request:', error);
      toast({
        title: t('booking.visitRequest.error'),
        description: t('booking.visitRequest.errorDesc'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('booking.visitRequest.title')}</DialogTitle>
          <DialogDescription>
            {t('booking.visitRequest.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('booking.visitRequest.name')}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              maxLength={100}
              placeholder={t('booking.visitRequest.namePlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('booking.visitRequest.email')}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              maxLength={255}
              placeholder={t('booking.visitRequest.emailPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t('booking.visitRequest.phone')}</Label>
            <PhoneInput
              value={formData.phone}
              onChange={(value) => setFormData({ ...formData, phone: value })}
              defaultCountry="IT"
              placeholder={t('booking.visitRequest.phonePlaceholder')}
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              {t('booking.visitRequest.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? t('booking.loading') : t('booking.visitRequest.submit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
