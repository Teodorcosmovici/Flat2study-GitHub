import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Phone, Mail, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface ContactAccessRequestProps {
  targetProfileId: string;
  listingId?: string;
  landlordName: string;
  children: React.ReactNode;
}

export const ContactAccessRequest: React.FC<ContactAccessRequestProps> = ({
  targetProfileId,
  listingId,
  landlordName,
  children
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitRequest = async () => {
    if (!user || !reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for requesting contact information.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('contact_access_requests')
        .insert({
          requester_id: user.id,
          target_profile_id: targetProfileId,
          listing_id: listingId,
          reason: reason.trim()
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Request Already Exists",
            description: "You have already requested access to this contact information.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Request Submitted",
          description: `Your request to access ${landlordName}'s contact information has been sent.`,
        });
        setIsOpen(false);
        setReason('');
      }
    } catch (error) {
      console.error('Error submitting contact access request:', error);
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Request Contact Access
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="flex gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Contact information is protected</p>
              <p className="text-xs text-muted-foreground">
                Request access to view {landlordName}'s phone and email
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for request *</Label>
            <Textarea
              id="reason"
              placeholder="Please explain why you need access to the contact information (e.g., interested in viewing the property, have questions about the lease terms, etc.)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/500 characters
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRequest}
              disabled={!reason.trim() || loading}
              className="flex-1"
            >
              {loading ? "Sending..." : "Send Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};