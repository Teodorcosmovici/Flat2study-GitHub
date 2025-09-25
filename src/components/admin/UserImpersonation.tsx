import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { User, LogOut, Shield, Clock } from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  user_type: string;
  created_at: string;
}

interface ImpersonationSession {
  session_token: string;
  impersonated_user_id: string;
  admin_user_id: string;
  started_at: string;
}

export function UserImpersonation() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<ImpersonationSession | null>(null);

  useEffect(() => {
    if (profile?.user_type === 'admin') {
      fetchUsers();
      checkCurrentSession();
    }
  }, [profile]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_type', 'admin')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const checkCurrentSession = async () => {
    try {
      const { data, error } = await supabase.rpc('get_current_impersonation');
      if (error) throw error;
      
      if (data && data.length > 0) {
        setCurrentSession(data[0]);
      }
    } catch (error) {
      console.error('Error checking current session:', error);
    }
  };

  const startImpersonation = async () => {
    if (!selectedUser || !reason.trim()) {
      toast.error('Please select a user and provide a reason');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('start_impersonation', {
        target_user_id: selectedUser.user_id,
        reason_text: reason.trim()
      });

      if (error) throw error;

      // Store the session token in localStorage for the impersonation
      localStorage.setItem('impersonation_token', data);
      localStorage.setItem('impersonated_user_id', selectedUser.user_id);
      localStorage.setItem('original_admin_id', profile!.user_id);

      toast.success(`Now impersonating ${selectedUser.full_name || selectedUser.email}`);
      
      // Reload the page to apply impersonation
      window.location.reload();
    } catch (error: any) {
      console.error('Error starting impersonation:', error);
      toast.error(error.message || 'Failed to start impersonation');
    } finally {
      setLoading(false);
    }
  };

  const endImpersonation = async () => {
    const token = localStorage.getItem('impersonation_token');
    if (!token) return;

    setLoading(true);
    try {
      const { error } = await supabase.rpc('end_impersonation', { token });
      if (error) throw error;

      // Clear impersonation data
      localStorage.removeItem('impersonation_token');
      localStorage.removeItem('impersonated_user_id');
      localStorage.removeItem('original_admin_id');

      toast.success('Impersonation ended');
      
      // Reload to return to admin view
      window.location.reload();
    } catch (error: any) {
      console.error('Error ending impersonation:', error);
      toast.error(error.message || 'Failed to end impersonation');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (profile?.user_type !== 'admin') {
    return null;
  }

  // Show end impersonation if currently impersonating
  if (currentSession || localStorage.getItem('impersonation_token')) {
    const impersonatedUserId = localStorage.getItem('impersonated_user_id');
    const impersonatedUser = users.find(u => u.user_id === impersonatedUserId);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Active Impersonation Session
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              You are currently impersonating: <strong>{impersonatedUser?.full_name || impersonatedUser?.email || 'Unknown User'}</strong>
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={endImpersonation} 
            disabled={loading}
            variant="destructive"
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            End Impersonation
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          User Impersonation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="search">Search Users</Label>
          <Input
            id="search"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedUser?.id === user.id 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:bg-accent'
              }`}
              onClick={() => setSelectedUser(user)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{user.full_name || 'No name'}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Badge variant="secondary">{user.user_type}</Badge>
              </div>
            </div>
          ))}
        </div>

        {selectedUser && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="p-3 bg-accent rounded-lg">
                <p className="font-medium">Selected User:</p>
                <p className="text-sm">{selectedUser.full_name || 'No name'} ({selectedUser.email})</p>
                <Badge variant="secondary" className="mt-1">{selectedUser.user_type}</Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Impersonation</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter the reason for impersonating this user (required for audit trail)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={startImpersonation} 
                disabled={loading || !reason.trim()}
                className="w-full"
              >
                <Shield className="h-4 w-4 mr-2" />
                Start Impersonation
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}