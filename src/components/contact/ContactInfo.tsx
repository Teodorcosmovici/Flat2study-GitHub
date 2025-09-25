import React, { useEffect, useState } from 'react';
import { Phone, Mail, Shield, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ContactAccessRequest } from './ContactAccessRequest';
import { Button } from '@/components/ui/button';

interface ContactInfoProps {
  profileId: string;
  name: string;
  phone?: string;
  email?: string;
  listingId?: string;
  isOwner?: boolean;
}

export const ContactInfo: React.FC<ContactInfoProps> = ({
  profileId,
  name,
  phone,
  email,
  listingId,
  isOwner = false
}) => {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkContactAccess();
  }, [user, profileId]);

  const checkContactAccess = async () => {
    if (!user || isOwner) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('has_contact_access', {
        requester_user_id: user.id,
        target_profile_id: profileId
      });

      if (error) {
        console.error('Error checking contact access:', error);
      } else {
        setHasAccess(data);
      }
    } catch (error) {
      console.error('Error checking contact access:', error);
    } finally {
      setLoading(false);
    }
  };

  // If user is the owner of the profile, show full contact info
  if (isOwner || (user && hasAccess)) {
    return (
      <div className="space-y-2">
        {hasAccess && !isOwner && (
          <div className="flex items-center gap-2 text-xs text-green-600 mb-2">
            <Shield className="h-3 w-3" />
            Contact access approved
          </div>
        )}
        {phone && (
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a 
              href={`tel:${phone}`} 
              className="text-primary hover:underline"
            >
              {phone}
            </a>
          </div>
        )}
        {email && (
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a 
              href={`mailto:${email}`} 
              className="text-primary hover:underline"
            >
              {email}
            </a>
          </div>
        )}
      </div>
    );
  }

  // If user is not logged in or doesn't have access, show request button
  if (!user) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>Sign in to request contact information</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <ContactAccessRequest
      targetProfileId={profileId}
      listingId={listingId}
      landlordName={name}
    >
      <Button variant="outline" size="sm" className="w-full">
        <Lock className="h-4 w-4 mr-2" />
        Request Contact Info
      </Button>
    </ContactAccessRequest>
  );
};