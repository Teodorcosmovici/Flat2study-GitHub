import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useImpersonation } from '@/hooks/useImpersonation';
import { useToast } from '@/hooks/use-toast';
import { User, Shield, Clock, X } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  user_type: string;
  created_at: string;
}

interface ImpersonationHistory {
  id: string;
  admin_user_id: string;
  impersonated_user_id: string;
  started_at: string;
  ended_at: string | null;
  reason: string;
  admin_ip_address: unknown;
}

export function UserImpersonation() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [reason, setReason] = useState('Support assistance');
  const [history, setHistory] = useState<ImpersonationHistory[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const { isImpersonating, impersonationSession, startImpersonation, endImpersonation, loading } = useImpersonation();
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchImpersonationHistory();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_type', 'admin')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchImpersonationHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_impersonation_sessions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleStartImpersonation = async () => {
    if (!selectedUser) return;

    const { error } = await startImpersonation(selectedUser.user_id, reason);
    
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to start impersonation",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Impersonation Started",
        description: `Now impersonating ${selectedUser.full_name}`,
      });
      setSelectedUser(null);
      setReason('Support assistance');
      fetchImpersonationHistory();
    }
  };

  const handleEndImpersonation = async () => {
    const { error } = await endImpersonation();
    
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to end impersonation",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Impersonation Ended",
        description: "You are now back to your admin account",
      });
      fetchImpersonationHistory();
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loadingUsers) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      {isImpersonating && impersonationSession && (
        <Alert className="border-warning bg-warning/10">
          <Shield className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              You are currently impersonating a user. Started at{' '}
              {new Date(impersonationSession.started_at).toLocaleString()}
            </span>
            <Button
              onClick={handleEndImpersonation}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <X className="w-4 h-4 mr-2" />
              End Impersonation
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            User Impersonation
          </CardTitle>
          <CardDescription>
            Impersonate users for support purposes. All sessions are logged for audit purposes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid gap-2 max-h-64 overflow-y-auto">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedUser?.id === user.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                }`}
                onClick={() => setSelectedUser(user)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{user.full_name || 'No name'}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                  <Badge variant="outline">{user.user_type}</Badge>
                </div>
              </div>
            ))}
          </div>

          {selectedUser && (
            <div className="border-t pt-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Selected User:</label>
                <div className="text-sm text-muted-foreground">
                  {selectedUser.full_name} ({selectedUser.email})
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Reason for Impersonation:</label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for impersonation..."
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleStartImpersonation}
                  disabled={loading || isImpersonating || !reason.trim()}
                >
                  {loading ? 'Starting...' : 'Start Impersonation'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedUser(null)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Impersonation History
          </CardTitle>
          <CardDescription>
            Recent impersonation sessions for audit purposes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {history.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No impersonation history found.
              </div>
            ) : (
              history.map((session) => (
                <div key={session.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        User ID: {session.impersonated_user_id}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Reason: {session.reason}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Started: {new Date(session.started_at).toLocaleString()}
                        {session.ended_at && (
                          <> • Ended: {new Date(session.ended_at).toLocaleString()}</>
                        )}
                      </div>
                    </div>
                    <Badge variant={session.ended_at ? "outline" : "default"}>
                      {session.ended_at ? 'Ended' : 'Active'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}