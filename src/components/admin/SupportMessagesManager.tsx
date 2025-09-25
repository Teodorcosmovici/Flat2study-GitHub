import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Phone, Clock, CheckCheck, Reply, ChevronDown, ChevronUp, User } from 'lucide-react';
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
  const [sectionExpanded, setSectionExpanded] = useState(false);
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

  const unreadCount = messages.filter(m => m.status === 'unread').length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Support Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Collapsible open={sectionExpanded} onOpenChange={setSectionExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Support Messages from Chat Widget
                <Badge variant="outline">{messages.length} total</Badge>
                {unreadCount > 0 && (
                  <Badge variant="destructive">{unreadCount} unread</Badge>
                )}
              </CardTitle>
              {sectionExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent>
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                <p className="text-muted-foreground">Support messages will appear here when users contact you.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <Card key={message.id} className={`${message.status === 'unread' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Message Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{message.sender_name}</span>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span className="font-mono">{message.country_code} {message.phone_number}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{formatDistanceToNow(new Date(message.created_at))} ago</span>
                            </div>
                          </div>
                          {getStatusBadge(message.status)}
                        </div>

                        {/* Message Content */}
                        <div>
                          <p className="text-sm bg-muted/50 p-3 rounded-lg whitespace-pre-wrap border">
                            {message.message}
                          </p>
                        </div>

                        {/* Admin Notes */}
                        {message.admin_notes && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Admin Notes:</h4>
                            <p className="text-sm bg-accent/20 p-2 rounded border">{message.admin_notes}</p>
                          </div>
                        )}

                        {/* Admin Notes Input */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Admin Notes:</label>
                          <Textarea
                            placeholder="Add admin notes..."
                            value={adminNotes[message.id] || message.admin_notes || ''}
                            onChange={(e) => setAdminNotes({ ...adminNotes, [message.id]: e.target.value })}
                            className="min-h-[60px] text-sm"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 flex-wrap">
                          {message.status === 'unread' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateMessageStatus(message.id, 'read', adminNotes[message.id])}
                            >
                              <CheckCheck className="h-3 w-3 mr-1" />
                              Mark as Read
                            </Button>
                          )}
                          
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => updateMessageStatus(message.id, 'replied', adminNotes[message.id])}
                          >
                            <Reply className="h-3 w-3 mr-1" />
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

                        {/* Reply Status */}
                        {message.replied_at && (
                          <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 p-2 rounded border border-green-200 dark:border-green-800">
                            ✅ Replied {formatDistanceToNow(new Date(message.replied_at))} ago
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};