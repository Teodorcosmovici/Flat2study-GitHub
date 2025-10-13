import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, Phone, User, Home, Eye, MessageSquare } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface VisitRequest {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_phone: string;
  sender_university: string;
  sender_email: string;
  message: string;
  listing_id: string;
  listing_title: string;
  listing_address_line: string;
  created_at: string;
  read_at: string | null;
  replied_at: string | null;
}

export const AdminVisitRequests = () => {
  const navigate = useNavigate();
  const [visitRequests, setVisitRequests] = useState<VisitRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisitRequests();
  }, []);

  const fetchVisitRequests = async () => {
    try {
      setLoading(true);
      
      // Fetch all messages (visit requests)
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      if (!messagesData || messagesData.length === 0) {
        setVisitRequests([]);
        return;
      }

      // Get unique sender IDs and listing IDs
      const senderIds = [...new Set(messagesData.map(m => m.sender_id).filter(Boolean))];
      const listingIds = [...new Set(messagesData.map(m => m.listing_id))];

      // Fetch sender profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email')
        .in('user_id', senderIds);

      if (profilesError) throw profilesError;

      // Fetch listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('id, title, address_line')
        .in('id', listingIds);

      if (listingsError) throw listingsError;

      // Create lookup maps
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      const listingsMap = new Map(listingsData?.map(l => [l.id, l]) || []);

      // Combine the data
      const formattedRequests: VisitRequest[] = messagesData.map((message: any) => {
        const profile = profilesMap.get(message.sender_id);
        const listing = listingsMap.get(message.listing_id);

        return {
          id: message.id,
          sender_id: message.sender_id,
          sender_name: message.sender_name || 'N/A',
          sender_phone: message.sender_phone || 'N/A',
          sender_university: message.sender_university || 'N/A',
          sender_email: profile?.email || 'N/A',
          message: message.message,
          listing_id: message.listing_id,
          listing_title: listing?.title || 'N/A',
          listing_address_line: listing?.address_line || 'N/A',
          created_at: message.created_at,
          read_at: message.read_at,
          replied_at: message.replied_at,
        };
      });

      setVisitRequests(formattedRequests);
    } catch (error) {
      console.error('Error fetching visit requests:', error);
      toast({
        title: "Error",
        description: "Failed to load visit requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (readAt: string | null, repliedAt: string | null) => {
    if (repliedAt) {
      return <Badge className="bg-green-100 text-green-800">Replied</Badge>;
    }
    if (readAt) {
      return <Badge className="bg-blue-100 text-blue-800">Read</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">New</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-muted-foreground">Loading visit requests...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Visit Requests</span>
          <Badge variant="outline">{visitRequests.length} Total</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {visitRequests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No visit requests found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requester</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Listing</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{request.sender_name}</span>
                        </div>
                        {request.sender_university !== 'N/A' && (
                          <div className="text-xs text-muted-foreground">{request.sender_university}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{request.sender_email}</span>
                        </div>
                        {request.sender_phone !== 'N/A' && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{request.sender_phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 max-w-xs">
                        <div className="flex items-start gap-2">
                          <Home className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="font-medium text-sm">{request.listing_title}</div>
                            <div className="text-xs text-muted-foreground">{request.listing_address_line}</div>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {request.message}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(request.created_at).toLocaleDateString()}
                        <div className="text-xs text-muted-foreground">
                          {new Date(request.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.read_at, request.replied_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/listing/${request.listing_id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
