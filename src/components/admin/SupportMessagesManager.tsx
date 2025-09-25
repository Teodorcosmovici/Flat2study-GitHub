import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Phone, User, Clock, Check, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface SupportMessage {
  id: string;
  sender_name: string;
  phone_number: string;
  country_code: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  created_at: string;
  admin_notes?: string;
  user_id?: string;
}

export const SupportMessagesManager: React.FC = () => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages((data || []).map(item => ({
        ...item,
        status: item.status as 'unread' | 'read' | 'replied'
      })));
    } catch (error) {
      console.error('Error fetching support messages:', error);
      toast({
        title: "Error",
        description: "Failed to load support messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMessageStatus = async (messageId: string, status: SupportMessage['status'], notes?: string) => {
    try {
      setUpdating(true);
      
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (notes !== undefined) {
        updateData.admin_notes = notes;
      }
      
      if (status === 'replied') {
        updateData.replied_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_messages')
        .update(updateData)
        .eq('id', messageId);

      if (error) throw error;

      await fetchMessages();
      toast({
        title: "Success",
        description: `Message marked as ${status}`,
      });
    } catch (error) {
      console.error('Error updating message:', error);
      toast({
        title: "Error",
        description: "Failed to update message",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: SupportMessage['status']) => {
    switch (status) {
      case 'unread':
        return <Badge variant="destructive">Unread</Badge>;
      case 'read':
        return <Badge variant="secondary">Read</Badge>;
      case 'replied':
        return <Badge variant="default">Replied</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatPhoneNumber = (countryCode: string, phoneNumber: string) => {
    return `${countryCode} ${phoneNumber}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

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
          <div className="text-center py-8">Loading messages...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Support Messages ({messages.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No support messages yet
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`border rounded-lg p-4 transition-colors ${
                  message.status === 'unread' ? 'bg-red-50 dark:bg-red-950/20 border-red-200' : 'bg-card'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{message.sender_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        <span className="text-sm text-muted-foreground">
                          {formatPhoneNumber(message.country_code, message.phone_number)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm text-muted-foreground">
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                      {getStatusBadge(message.status)}
                    </div>
                    
                    <div className="bg-muted p-3 rounded text-sm">
                      {message.message}
                    </div>
                    
                    {message.admin_notes && (
                      <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded text-sm border border-blue-200">
                        <strong>Admin Notes:</strong> {message.admin_notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {message.status === 'unread' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateMessageStatus(message.id, 'read')}
                        disabled={updating}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Mark Read
                      </Button>
                    )}
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant={message.status === 'replied' ? 'outline' : 'default'}
                          onClick={() => {
                            setSelectedMessage(message);
                            setAdminNotes(message.admin_notes || '');
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {message.status === 'replied' ? 'View Notes' : 'Add Notes & Reply'}
                        </Button>
                      </DialogTrigger>
                      
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Message from {message.sender_name}</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Original Message:</h4>
                            <div className="bg-muted p-3 rounded text-sm">
                              {message.message}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Contact:</h4>
                            <p className="text-sm text-muted-foreground">
                              {formatPhoneNumber(message.country_code, message.phone_number)}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Admin Notes:</h4>
                            <Textarea
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              placeholder="Add notes about this support request..."
                              rows={4}
                            />
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => updateMessageStatus(message.id, 'read', adminNotes)}
                              disabled={updating}
                              className="flex-1"
                            >
                              Save Notes
                            </Button>
                            <Button
                              onClick={() => updateMessageStatus(message.id, 'replied', adminNotes)}
                              disabled={updating}
                              className="flex-1"
                            >
                              Mark as Replied
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};