import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, User, MessageSquare, Calendar } from 'lucide-react';

interface ContactRequest {
  id: string;
  requester_id: string;
  target_profile_id: string;
  listing_id: string;
  reason: string;
  status: string;
  created_at: string;
  expires_at: string;
  requester_profile?: {
    full_name: string;
    email: string;
    user_type: string;
  };
  listing?: {
    title: string;
    address_line: string;
    city: string;
  };
}

export const ContactRequestsManager: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchContactRequests();
    }
  }, [user]);

  const fetchContactRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_access_requests')
        .select(`
          id,
          requester_id,
          target_profile_id,
          listing_id,
          reason,
          status,
          created_at,
          expires_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch related data separately
      const requestsWithDetails = await Promise.all(
        (data || []).map(async (request) => {
          // Fetch requester profile
          const { data: requesterProfile } = await supabase
            .from('profiles')
            .select('full_name, email, user_type')
            .eq('user_id', request.requester_id)
            .single();

          // Fetch listing details if listing_id exists
          let listing = null;
          if (request.listing_id) {
            const { data: listingData } = await supabase
              .from('listings')
              .select('title, address_line, city')
              .eq('id', request.listing_id)
              .single();
            listing = listingData;
          }

          return {
            ...request,
            requester_profile: requesterProfile,
            listing
          };
        })
      );

      setRequests(requestsWithDetails);

    } catch (error) {
      console.error('Error fetching contact requests:', error);
      toast({
        title: "Error",
        description: "Failed to load contact requests.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('contact_access_requests')
        .update({
          status: action,
          approved_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Update local state
      setRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: action }
            : req
        )
      );

      toast({
        title: "Success",
        description: `Contact access request ${action} successfully.`,
      });
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: "Error",
        description: `Failed to ${action} request.`,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-orange-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Contact Access Requests
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No contact access requests yet.</p>
          </div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {request.requester_profile?.full_name || 'Unknown User'}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {request.requester_profile?.user_type || 'student'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {request.requester_profile?.email}
                  </p>
                </div>
                {getStatusBadge(request.status)}
              </div>

              {request.listing && (
                <div className="text-sm text-muted-foreground">
                  <strong>Property:</strong> {request.listing.title} - {request.listing.address_line}, {request.listing.city}
                </div>
              )}

              <div className="bg-muted/50 p-3 rounded">
                <p className="text-sm"><strong>Reason:</strong></p>
                <p className="text-sm text-muted-foreground mt-1">{request.reason}</p>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Requested: {formatDate(request.created_at)}
                </div>
                {request.expires_at && (
                  <div>Expires: {formatDate(request.expires_at)}</div>
                )}
              </div>

              {request.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRequestAction(request.id, 'rejected')}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleRequestAction(request.id, 'approved')}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};