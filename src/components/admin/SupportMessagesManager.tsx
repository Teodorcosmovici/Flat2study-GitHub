import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Phone, Clock, CheckCheck, Reply, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [expandedMessages, setExpandedMessages] = useState<{ [key: string]: boolean }>({});
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

  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessages(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
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
            <Collapsible 
              key={message.id} 
              open={expandedMessages[message.id] || false}
              onOpenChange={() => toggleMessageExpansion(message.id)}
            >
              <Card className={message.status === 'unread' ? 'border-primary' : ''}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{message.sender_name}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span className="font-mono">{message.country_code} {message.phone_number}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{formatDistanceToNow(new Date(message.created_at))} ago</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {message.message}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(message.status)}
                        {expandedMessages[message.id] ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Full Message:</h4>
                        <p className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">{message.message}</p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Contact Information:</h4>
                        <div className="bg-accent/20 p-3 rounded-lg space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">Name:</span>
                            <span>{message.sender_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4" />
                            <span className="font-medium">Phone:</span>
                            <span className="font-mono">{message.country_code} {message.phone_number}</span>
                          </div>
                        </div>
                      </div>

                      {message.admin_notes && (
                        <div>
                          <h4 className="font-medium mb-2">Admin Notes:</h4>
                          <p className="text-sm bg-accent/20 p-3 rounded-lg">{message.admin_notes}</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <h4 className="font-medium">Admin Notes:</h4>
                        <Textarea
                          placeholder="Add admin notes..."
                          value={adminNotes[message.id] || message.admin_notes || ''}
                          onChange={(e) => setAdminNotes({ ...adminNotes, [message.id]: e.target.value })}
                          className="min-h-[80px]"
                        />
                      </div>

                      <div className="flex gap-2 flex-wrap">
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
                        <div className="text-sm text-muted-foreground bg-green-50 dark:bg-green-950/20 p-2 rounded">
                          ✅ Replied {formatDistanceToNow(new Date(message.replied_at))} ago
                        </div>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
};