import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ContactRequestsManager } from '@/components/contact/ContactRequestsManager';
import { 
  Users, 
  Building, 
  MessageCircle, 
  TrendingUp, 
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  LogOut,
  ChevronDown,
  ChevronRight,
  Filter,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { blurPhoneNumber, blurEmailAddress, blurContactInfo } from '@/utils/contactBlur';
import { PlatformCommunicationNotice } from '@/components/communication/PlatformCommunicationNotice';

interface Conversation {
  listing_id: string;
  listing_title: string;
  listing_images: string[];
  listing_rent_monthly_eur: number;
  listing_city: string;
  listing_address_line: string;
  agency_id: string;
  agency_name: string;
  agency_phone: string;
  agency_email: string;
  student_sender_id: string;
  student_name: string;
  last_message_id: string;
  last_message_content: string;
  last_message_created_at: string;
  message_count: number;
  messages?: Message[];
}

interface Message {
  id: string;
  message: string;
  sender_name: string;
  sender_phone: string;
  sender_university: string;
  created_at: string;
  read_at: string;
  listing_id: string;
  agency_id: string;
  sender_id: string;
}


interface PendingListing {
  id: string;
  title: string;
  description: string;
  address_line: string;
  city: string;
  rent_monthly_eur: number;
  review_status: string;
  review_notes: string;
  images: string[];
  created_at: string;
  agency_id: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

const OwnerDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    totalMessages: 0,
    activeAgencies: 0,
    recentUsers: [],
    allUsers: [],
    recentListings: [],
    recentMessages: []
  });
  const [pendingListings, setPendingListings] = useState<PendingListing[]>([]);
  const [selectedListing, setSelectedListing] = useState<PendingListing | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const [emailDomainFilter, setEmailDomainFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: 30, end: 0 }); // last 30 days
  const [showConversations, setShowConversations] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchPendingListings();
    fetchAnalytics();
    fetchConversations();
  }, [dateRange]);

  const fetchPendingListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          profiles!listings_agency_id_fkey (
            full_name,
            email
          )
        `)
        .eq('review_status', 'pending_review')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPendingListings((data || []).map(listing => ({
        ...listing,
        images: Array.isArray(listing.images) ? listing.images.map(img => String(img)) : []
      })));
    } catch (error) {
      console.error('Error fetching pending listings:', error);
      toast({
        title: "Error",
        description: "Failed to load pending listings",
        variant: "destructive",
      });
    }
  };

  const handleReviewAction = async (listingId: string, action: 'approved' | 'rejected', notes: string) => {
    try {
      if (action === 'rejected') {
        // Delete the listing when rejected
        const { error } = await supabase
          .from('listings')
          .delete()
          .eq('id', listingId);

        if (error) throw error;

        // Remove from local state immediately
        setPendingListings(prev => prev.filter(listing => listing.id !== listingId));

        toast({
          title: "Success",
          description: "Listing rejected and deleted successfully",
        });
      } else {
        // Approve and publish the listing
        const { error } = await supabase
          .from('listings')
          .update({
            review_status: 'approved',
            review_notes: notes,
            reviewed_at: new Date().toISOString(),
            status: 'PUBLISHED'
          })
          .eq('id', listingId);

        if (error) throw error;

        // Remove from local state immediately
        setPendingListings(prev => prev.filter(listing => listing.id !== listingId));

        toast({
          title: "Success",
          description: "Listing approved and published successfully",
        });
      }

      setSelectedListing(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error updating listing:', error);
      toast({
        title: "Error",
        description: "Failed to update listing",
        variant: "destructive",
      });
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch total counts
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Get total users from auth.users table (all registered email addresses)
      const { count: totalUsersCount } = await supabase
        .from('profiles')
        .select('user_id', { count: 'exact', head: true });

      const { data: listings } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      const activeAgencies = profiles?.filter(p => p.user_type === 'agency').length || 0;

      setStats({
        totalUsers: totalUsersCount || 0,
        totalListings: listings?.length || 0,
        totalMessages: messages?.length || 0,
        activeAgencies,
        recentUsers: profiles?.slice(0, 5) || [],
        allUsers: profiles || [],
        recentListings: listings?.slice(0, 5) || [],
        recentMessages: messages?.slice(0, 5) || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange.start);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - dateRange.end);

      console.log('Fetching analytics with date range:', { 
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      });

      const { data, error } = await supabase.rpc('get_platform_analytics', {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      });

      if (error) {
        console.error('Error fetching analytics:', error);
      } else {
        console.log('Analytics data received:', data);
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTimeSpent = (seconds: number) => {
    if (!seconds || seconds === 0) return '0s';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    } else if (remainingSeconds === 0) {
      return `${minutes}m`;
    } else {
      return `${minutes}m ${remainingSeconds}s`;
    }
  };

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_conversations_for_owner');

      if (error) {
        console.error('Error fetching conversations:', error);
      } else {
        console.log('Conversations data:', data);
        // Convert the data to match our interface
        const conversations = (data || []).map((conv: any) => ({
          ...conv,
          listing_images: Array.isArray(conv.listing_images) 
            ? conv.listing_images.map((img: any) => String(img))
            : []
        }));
        setConversations(conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchConversationMessages = async (conversation: Conversation) => {
    try {
      const { data, error } = await supabase.rpc('get_conversation_messages_for_owner', {
        p_listing_id: conversation.listing_id,
        p_student_sender_id: conversation.student_sender_id
      });

      if (error) {
        console.error('Error fetching conversation messages:', error);
      } else {
        const conversationWithMessages = { ...conversation, messages: data || [] };
        setSelectedConversation(conversationWithMessages);
      }
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
    }
  };

  const toggleUserExpansion = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const filteredUsers = useMemo(() => {
    let users = showAllUsers ? stats.allUsers : stats.recentUsers;
    
    // Filter by user type
    if (userTypeFilter !== 'all') {
      users = users.filter((user: any) => user.user_type === userTypeFilter);
    }
    
    // Filter by email domain
    if (emailDomainFilter.trim() && emailDomainFilter !== 'all') {
      users = users.filter((user: any) => 
        user.email && user.email.toLowerCase().includes(emailDomainFilter.toLowerCase())
      );
    }
    
    return users;
  }, [stats.allUsers, stats.recentUsers, showAllUsers, userTypeFilter, emailDomainFilter]);

  const uniqueUserTypes = useMemo(() => {
    const types = new Set(stats.allUsers.map((user: any) => user.user_type));
    return Array.from(types);
  }, [stats.allUsers]);

  const uniqueEmailDomains = useMemo(() => {
    const domains = new Set(
      stats.allUsers
        .filter((user: any) => user.email)
        .map((user: any) => user.email.split('@')[1])
        .filter(Boolean)
    );
    return Array.from(domains).sort();
  }, [stats.allUsers]);

  if (showConversations) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Flat2Study Owner Dashboard</h1>
              <p className="text-muted-foreground">Platform overview and management</p>
            </div>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              <LogOut className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </header>
        <div className="container mx-auto px-4 py-6 h-[calc(100vh-80px)]">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Conversations</h2>
            <p className="text-muted-foreground">Messaging system has been removed</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Flat2Study Owner Dashboard</h1>
            <p className="text-muted-foreground">Platform overview and management</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.href = '/customer-database'}>
              <Users className="h-4 w-4 mr-2" />
              Customer Database
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              <LogOut className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Pending Listings Review Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">Listings Approval</h2>
              <p className="text-muted-foreground">Review and approve pending property listings</p>
            </div>
            <Badge variant="outline" className="text-orange-600">
              {pendingListings.length} Pending Review
            </Badge>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Listings List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Listings Awaiting Review</h3>
              
              {pendingListings.map((listing) => (
                <Card 
                  key={listing.id}
                  className={`cursor-pointer transition-colors ${
                    selectedListing?.id === listing.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedListing(listing)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {listing.images[0] && (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 space-y-1">
                        <h4 className="font-semibold">{listing.title}</h4>
                        <p className="text-sm text-muted-foreground">{listing.address_line}, {listing.city}</p>
                        <p className="text-sm font-medium text-green-600">€{listing.rent_monthly_eur}/month</p>
                        <p className="text-xs text-muted-foreground">
                          By: {listing.profiles?.full_name} • {new Date(listing.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {pendingListings.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                    <h4 className="text-lg font-semibold mb-2">All caught up!</h4>
                    <p className="text-muted-foreground">
                      No listings pending review at the moment.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Review Panel */}
            <div className="space-y-4">
              {selectedListing ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Review Listing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-lg">{selectedListing.title}</h4>
                      <p className="text-muted-foreground">{selectedListing.address_line}, {selectedListing.city}</p>
                      <p className="text-lg font-bold text-green-600 mt-2">
                        €{selectedListing.rent_monthly_eur}/month
                      </p>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">Description</h5>
                      <p className="text-sm text-muted-foreground">{selectedListing.description}</p>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">Landlord Details</h5>
                      <p className="text-sm">Name: {selectedListing.profiles?.full_name}</p>
                      <p className="text-sm">Email: {selectedListing.profiles?.email}</p>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">Photos ({selectedListing.images.length})</h5>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedListing.images.slice(0, 6).map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Property photo ${index + 1}`}
                            className="w-full h-20 object-cover rounded"
                          />
                        ))}
                        {selectedListing.images.length > 6 && (
                          <div className="w-full h-20 bg-muted rounded flex items-center justify-center text-sm">
                            +{selectedListing.images.length - 6} more
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">Review Notes (Optional)</h5>
                      <Textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Add notes about your review decision..."
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => handleReviewAction(selectedListing.id, 'approved', reviewNotes)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve & Publish
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleReviewAction(selectedListing.id, 'rejected', reviewNotes)}
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject & Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h4 className="text-lg font-semibold mb-2">Select a listing to review</h4>
                    <p className="text-muted-foreground">
                      Click on a listing from the left panel to start reviewing.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Analytics Time Range Selector */}
        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Analytics Time Range</h3>
                <div className="flex gap-2">
                  <Button 
                    variant={dateRange.start === 7 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateRange({ start: 7, end: 0 })}
                  >
                    Last 7 days
                  </Button>
                  <Button 
                    variant={dateRange.start === 30 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateRange({ start: 30, end: 0 })}
                  >
                    Last 30 days
                  </Button>
                  <Button 
                    variant={dateRange.start === 90 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateRange({ start: 90, end: 0 })}
                  >
                    Last 3 months
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Requests Section */}
        <div className="mb-8">
          <ContactRequestsManager />
        </div>

        {/* Website Analytics Stats */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Page Views</p>
                    <div className="text-2xl font-bold">{analytics.total_page_views}</div>
                  </div>
                  <Eye className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Unique Visitors</p>
                    <div className="text-2xl font-bold">{analytics.unique_visitors}</div>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg. Time on Page</p>
                    <div className="text-2xl font-bold">{formatTimeSpent(analytics.avg_time_per_page || 0)}</div>
                  </div>
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Price Increases</p>
                    <div className="text-2xl font-bold">{analytics.price_increases_count}</div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Platform Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <div className="text-2xl font-bold">{analytics?.total_registered_users || stats.totalUsers}</div>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Listings</p>
                  <div className="text-2xl font-bold">{stats.totalListings}</div>
                </div>
                <Building className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow" 
            onClick={() => setShowConversations(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                  <div className="text-2xl font-bold">{stats.totalMessages}</div>
                  <Button variant="ghost" size="sm" className="mt-2 p-0 h-auto text-xs">
                    View all conversations →
                  </Button>
                </div>
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Agencies</p>
                  <div className="text-2xl font-bold">{stats.activeAgencies}</div>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Database Overview */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold">Customer Database</h2>
              <p className="text-muted-foreground">Overview of all registered students and their activity</p>
            </div>
            <Button onClick={() => window.location.href = '/customer-database'}>
              View Full Database
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                    <div className="text-2xl font-bold">{stats.allUsers.filter(u => u.user_type === 'student').length}</div>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active This Month</p>
                    <div className="text-2xl font-bold">
                      {stats.recentUsers.filter(u => u.user_type === 'student').length}
                    </div>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">With Messages</p>
                    <div className="text-2xl font-bold">
                      {stats.allUsers.filter(u => u.user_type === 'student' && u.message_count > 0).length}
                    </div>
                  </div>
                  <MessageCircle className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Student Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Student Registrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentUsers.filter(u => u.user_type === 'student').slice(0, 5).map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{user.full_name || 'Anonymous Student'}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {user.email}
                        {user.university && (
                          <>
                            <span>•</span>
                            <span>{user.university}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {formatDate(user.created_at)}
                      </p>
                      {user.message_count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {user.message_count} messages
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {stats.recentUsers.filter(u => u.user_type === 'student').length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent student registrations</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts and Details */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Most Viewed Listings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Most Viewed Properties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.most_viewed_listings && analytics.most_viewed_listings.length > 0 ? (
                    analytics.most_viewed_listings.map((listing: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium line-clamp-1">{listing.title}</h4>
                          <p className="text-sm text-muted-foreground">ID: {listing.listing_id}</p>
                        </div>
                        <Badge variant="secondary">{listing.view_count} views</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No property views tracked yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Popular Pages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Popular Pages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.popular_pages && analytics.popular_pages.length > 0 ? (
                    analytics.popular_pages.map((page: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{page.page}</h4>
                          <p className="text-sm text-muted-foreground">Avg. time: {formatTimeSpent(page.avg_time || 0)}</p>
                        </div>
                        <Badge variant="secondary">{page.views} views</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No page views tracked yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Market Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Market Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">Properties Taken Off Market</span>
                    <Badge variant="destructive">{analytics.properties_taken_off_market}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">Price Increases</span>
                    <Badge variant="default">{analytics.price_increases_count}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Listings Per Month */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Listings Added per Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.listings_per_month && analytics.listings_per_month.length > 0 ? (
                    analytics.listings_per_month.map((month: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">{month.month}</span>
                        <Badge variant="outline">{month.count} listings</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No listing data for this period</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Customer Database */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center mb-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Database ({filteredUsers.length} of {stats.totalUsers} total)
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAllUsers(!showAllUsers)}
              >
                {showAllUsers ? 'Show Recent' : 'Show All'}
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm">Type:</span>
                <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {uniqueUserTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm">Email Domain:</span>
                <Select value={emailDomainFilter} onValueChange={setEmailDomainFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All domains" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Domains</SelectItem>
                    {uniqueEmailDomains.map((domain) => (
                      <SelectItem key={domain} value={domain}>
                        @{domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(userTypeFilter !== 'all' || emailDomainFilter !== 'all') && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setUserTypeFilter('all');
                    setEmailDomainFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredUsers.map((user: any, index) => {
                const isExpanded = expandedUsers.has(user.id);
                return (
                  <div key={index} className="border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                    {/* Compact Header - Always Visible */}
                    <div 
                      className="p-3 cursor-pointer flex items-center justify-between"
                      onClick={() => toggleUserExpansion(user.id)}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">
                          {user.full_name || 'Anonymous User'}
                        </span>
                        <Badge variant={user.user_type === 'agency' ? 'default' : user.user_type === 'student' ? 'secondary' : 'outline'}>
                          {user.user_type}
                        </Badge>
                        {user.email && (
                          <span className="text-sm text-muted-foreground">
                            @{user.email.split('@')[1]}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(user.created_at)}
                      </div>
                    </div>

                    {/* Expanded Details - Show when clicked */}
                    {isExpanded && (
                      <div className="px-6 pb-4 border-t bg-muted/20">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                          {/* Contact Info */}
                          <div>
                            <h5 className="font-medium mb-2 text-sm">Contact Information</h5>
                            <div className="space-y-2 text-sm">
                              {user.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <span className="break-all">{user.email}</span>
                                </div>
                              )}
                              {user.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <span>{user.phone}</span>
                                </div>
                              )}
                              {!user.email && !user.phone && (
                                <span className="text-muted-foreground text-xs">No contact info</span>
                              )}
                            </div>
                          </div>

                          {/* Additional Info */}
                          <div>
                            <h5 className="font-medium mb-2 text-sm">Additional Details</h5>
                            <div className="space-y-2 text-sm text-muted-foreground">
                              {user.university && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">University:</span>
                                  <span>{user.university}</span>
                                </div>
                              )}
                              {user.agency_name && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Agency:</span>
                                  <span>{user.agency_name}</span>
                                </div>
                              )}
                              {user.company_size && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Company Size:</span>
                                  <span>{user.company_size}</span>
                                </div>
                              )}
                              {user.description && (
                                <div>
                                  <span className="font-medium">Description:</span>
                                  <p className="mt-1 text-xs bg-muted/50 p-2 rounded">{user.description}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Account Info */}
                          <div>
                            <h5 className="font-medium mb-2 text-sm">Account Information</h5>
                            <div className="space-y-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Joined: {formatDate(user.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Updated: {formatDate(user.updated_at)}</span>
                              </div>
                              <div className="text-xs text-muted-foreground/70 font-mono">
                                ID: {user.id}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No users found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversations Dashboard */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                All Conversations ({conversations.length})
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchConversations}
              >
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Conversations List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Property Conversations</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {conversations.length > 0 ? (
                    conversations.map((conversation) => (
                      <Card 
                        key={`${conversation.listing_id}-${conversation.student_sender_id}`}
                        className={`cursor-pointer transition-colors ${
                          selectedConversation?.listing_id === conversation.listing_id && 
                          selectedConversation?.student_sender_id === conversation.student_sender_id 
                            ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => fetchConversationMessages(conversation)}
                      >
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            {conversation.listing_images && conversation.listing_images[0] && (
                              <img
                                src={conversation.listing_images[0]}
                                alt={conversation.listing_title}
                                className="w-16 h-16 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 space-y-1">
                              <h4 className="font-semibold text-sm">{conversation.listing_title}</h4>
                              <p className="text-xs text-muted-foreground">{conversation.listing_address_line}, {conversation.listing_city}</p>
                              <p className="text-xs font-medium text-green-600">€{conversation.listing_rent_monthly_eur}/month</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium">{conversation.student_name}</span>
                                  <Badge variant="outline" className="text-xs">{conversation.message_count} messages</Badge>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(conversation.last_message_created_at)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">{conversation.last_message_content}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No conversations yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Conversation Messages */}
              <div className="space-y-4">
                {selectedConversation ? (
                  <>
                    <div className="border-b pb-4">
                      <h3 className="text-lg font-semibold">{selectedConversation.listing_title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Conversation with {selectedConversation.student_name}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Agency: {selectedConversation.agency_name}</span>
                        <span>Messages: {selectedConversation.message_count}</span>
                      </div>
                    </div>
                    
                    <PlatformCommunicationNotice variant="compact" className="mb-3" />
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedConversation.messages?.map((message) => (
                        <div key={message.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{message.sender_name}</span>
                               {message.sender_phone && (
                                <Badge variant="outline" className="text-xs">
                                  📱 {blurPhoneNumber(message.sender_phone)}
                                </Badge>
                              )}
                               {message.sender_university && (
                                <Badge variant="secondary" className="text-xs">
                                  🎓 {message.sender_university}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(message.created_at)}
                            </span>
                          </div>
                          <div className="bg-muted/30 rounded-md p-3">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{blurContactInfo(message.message)}</p>
                          </div>
                          {message.read_at && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              Read: {formatDate(message.read_at)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <h4 className="text-lg font-semibold mb-2">Select a conversation</h4>
                    <p>Click on a conversation from the left panel to view the messages.</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OwnerDashboard;