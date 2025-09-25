import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Phone, Clock, CheckCheck, Reply } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SupportMessage {
  id: string;
  sender_name: string;
  phone_number: string;
  country_code: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  created_at: string;
  updated_at: string;
  replied_at: string | null;
  admin_notes: string | null;
}

export const SupportMessagesManager: React.FC = () => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('support-messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_messages'
      }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages((data || []) as SupportMessage[]);
    } catch (error) {
      console.error('Error fetching support messages:', error);
      toast({
        title: "Error",
        description: "Failed to load support messages.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMessageStatus = async (messageId: string, status: 'read' | 'replied', notes?: string) => {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (status === 'replied') {
        updateData.replied_at = new Date().toISOString();
      }
      
      if (notes !== undefined) {
        updateData.admin_notes = notes;
      }

      const { error } = await supabase
        .from('support_messages')
        .update(updateData)
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Message marked as ${status}.`,
      });

      fetchMessages();
    } catch (error) {
      console.error('Error updating message:', error);
      toast({
        title: "Error",
        description: "Failed to update message.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unread':
        return <Badge variant="destructive">Unread</Badge>;
      case 'read':
        return <Badge variant="secondary">Read</Badge>;
      case 'replied':
        return <Badge variant="default">Replied</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-4">Support Messages</h2>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Support Messages</h2>
        <Badge variant="outline">{messages.length} total</Badge>
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
            <p className="text-muted-foreground">Support messages will appear here when users contact you.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <Card key={message.id} className={message.status === 'unread' ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{message.sender_name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{message.country_code} {message.phone_number}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{formatDistanceToNow(new Date(message.created_at))} ago</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(message.status)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Message:</h4>
                    <p className="text-sm bg-muted p-3 rounded-lg">{message.message}</p>
                  </div>

                  {message.admin_notes && (
                    <div>
                      <h4 className="font-medium mb-2">Admin Notes:</h4>
                      <p className="text-sm bg-accent/20 p-3 rounded-lg">{message.admin_notes}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add admin notes..."
                      value={adminNotes[message.id] || message.admin_notes || ''}
                      onChange={(e) => setAdminNotes({ ...adminNotes, [message.id]: e.target.value })}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="flex gap-2">
                    {message.status === 'unread' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateMessageStatus(message.id, 'read', adminNotes[message.id])}
                      >
                        <CheckCheck className="h-4 w-4 mr-2" />
                        Mark as Read
                      </Button>
                    )}
                    
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => updateMessageStatus(message.id, 'replied', adminNotes[message.id])}
                    >
                      <Reply className="h-4 w-4 mr-2" />
                      Mark as Replied
                    </Button>

                    {adminNotes[message.id] !== (message.admin_notes || '') && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => updateMessageStatus(message.id, message.status as 'read' | 'replied', adminNotes[message.id])}
                      >
                        Save Notes
                      </Button>
                    )}
                  </div>

                  {message.replied_at && (
                    <div className="text-sm text-muted-foreground">
                      Replied {formatDistanceToNow(new Date(message.replied_at))} ago
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};