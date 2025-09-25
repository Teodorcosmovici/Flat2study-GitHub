import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Home, Calendar, BarChart3, Edit, Eye, Trash2, LogOut, User, CheckCircle, Search, Building2, MessageSquare, Clock, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface Listing {
  id: string;
  title: string;
  type: string;
  city: string;
  rent_monthly_eur: number;
  status: string;
  review_status: string;
  images: string[];
  created_at: string;
  published_at: string;
  bedrooms: number;
  bathrooms: number;
  booking_requests_count?: number;
}

interface Booking {
  id: string;
  check_in_date: string;
  check_out_date: string;
  monthly_rent: number;
  status: string;
  created_at: string;
  listing: {
    title: string;
    address_line: string;
  };
}

export const LandlordDashboard = () => {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use the dashboard stats hook for real-time updates
  const { activeListingsCount, uniqueInquiriesCount, loading: statsLoading } = useDashboardStats();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  useEffect(() => {
    // Only redirect if we have a profile and it's definitely not private
    if (profile && profile.user_type !== 'private') {
      navigate('/');
      return;
    }
    
    // Only fetch data if we have a profile
    if (profile) {
      fetchDashboardData();
    }

    // Set up real-time subscription for listings updates
    const channel = supabase
      .channel('landlord-dashboard-listings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listings',
          filter: `agency_id=eq.${profile?.id}`
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, navigate]);

  const fetchDashboardData = async () => {
    if (!profile) return;

    try {
      // Fetch listings with booking request counts
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .eq('agency_id', profile.id)
        .order('created_at', { ascending: false });

      if (listingsError) throw listingsError;

      // For each listing, count booking requests
      const listingsWithCounts = await Promise.all(
        (listingsData || []).map(async (listing) => {
          const { count } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('listing_id', listing.id)
            .eq('payment_status', 'authorized');
          
          return {
            ...listing,
            images: Array.isArray(listing.images) ? listing.images.map(img => String(img)) : [],
            booking_requests_count: count || 0
          };
        })
      );

      setListings(listingsWithCounts);
      
      // Fetch booking requests with payment_status = 'authorized'
      const { data: bookingRequestsData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          listing:listings(title, address_line, images),
          tenant:profiles!bookings_tenant_id_fkey(full_name, university, email, phone)
        `)
        .eq('landlord_id', profile.id)
        .eq('payment_status', 'authorized')
        .order('created_at', { ascending: false });

      if (bookingError) {
        console.error('Error fetching booking requests:', bookingError);
      } else {
        setBookingRequests(bookingRequestsData || []);
      }
      
      setBookings([]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookingResponse = async (bookingId: string, response: 'accepted' | 'refused') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: response === 'accepted' ? 'confirmed' : 'cancelled',
          landlord_response: response,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Refresh the booking requests
      await fetchDashboardData();
      
      toast({
        title: "Success",
        description: `Booking request ${response} successfully`,
      });
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: "Failed to update booking request",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string, reviewStatus: string) => {
    if (status === 'RENTED') {
      return <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">Rented</Badge>;
    }
    if (status === 'PUBLISHED') {
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Published</Badge>;
    }
    if (reviewStatus === 'rejected') {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    // Default for DRAFT, pending_review, etc.
    return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Pending</Badge>;
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Listing deleted successfully",
      });
      
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast({
        title: "Error",
        description: "Failed to delete listing",
        variant: "destructive",
      });
    }
  };

  const handleRentedOut = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ status: 'RENTED' })
        .eq('id', listingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Listing marked as rented out successfully",
      });
      
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating listing status:', error);
      toast({
        title: "Error",
        description: "Failed to update listing status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-semibold">Dashboard</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button onClick={() => navigate('/create-listing')} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add listing
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
              
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6">
        <Tabs defaultValue="listings" className="w-full">
          <div className="border-b">
            <TabsList className="h-14 bg-transparent gap-8 px-0">
              <TabsTrigger 
                value="listings" 
                className="h-full border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent bg-transparent px-1 rounded-none font-medium"
              >
                Listings
              </TabsTrigger>
              <TabsTrigger 
                value="booking-requests" 
                className="h-full border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent bg-transparent px-1 rounded-none font-medium"
              >
                Booking requests
              </TabsTrigger>
              <TabsTrigger 
                value="confirmed-bookings" 
                className="h-full border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent bg-transparent px-1 rounded-none font-medium"
              >
                Confirmed bookings
              </TabsTrigger>
              <TabsTrigger 
                value="account" 
                className="h-full border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent bg-transparent px-1 rounded-none font-medium"
              >
                Account
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Listings Tab */}
          <TabsContent value="listings" className="py-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold">{listings.length} Listings</h2>
              </div>
              <div className="flex items-center gap-4">
                <Button onClick={() => navigate('/create-listing')} className="bg-primary hover:bg-primary/90 px-6">
                  <Plus className="w-4 h-4 mr-2" />
                  Add a listing
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Quick find"
                className="pl-10 bg-muted/30 border-muted"
              />
            </div>

            {/* Listings Table */}
            <div className="bg-card rounded-lg border">
              {/* Table Header */}
              <div className="grid grid-cols-10 gap-4 p-4 border-b bg-muted/20 rounded-t-lg font-medium text-sm text-muted-foreground">
                <div className="col-span-1">
                  <input type="checkbox" className="rounded" />
                </div>
                <div className="col-span-3">ADDRESS / REFERENCE</div>
                <div className="col-span-1">PRICE</div>
                <div className="col-span-2">VERIFICATION</div>
                <div className="col-span-2">TENANTS INTERESTED</div>
                <div className="col-span-1">ACTIONS</div>
              </div>

              {/* Table Content */}
              {listings.map((listing) => (
                <div key={listing.id} className="grid grid-cols-10 gap-4 p-4 border-b hover:bg-muted/5">
                  <div className="col-span-1">
                    <input type="checkbox" className="rounded" />
                  </div>
                  <div className="col-span-3">
                    <div className="flex gap-3">
                      {listing.images[0] && (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <h3 className="font-medium">{listing.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {listing.bedrooms} bed, {listing.bathrooms} bath • {listing.city}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          REF {listing.id.slice(0, 8)} | Bedroom {listing.bedrooms}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-1">
                    <span className="font-medium">€{listing.rent_monthly_eur}</span>
                  </div>
                  <div className="col-span-2">
                    {getStatusBadge(listing.status, listing.review_status)}
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{listing.booking_requests_count || 0}</span>
                      <span className="text-sm text-muted-foreground">requests</span>
                    </div>
                  </div>
                  <div className="col-span-1">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => navigate(`/listing/${listing.id}`)}
                        className="hover:bg-muted"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          console.log('Edit button clicked for listing:', listing.id);
                          navigate(`/edit-listing/${listing.id}`);
                        }}
                        className="hover:bg-muted"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {listings.length === 0 && (
                <div className="p-12 text-center">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first property listing to start attracting tenants.
                  </p>
                  <Button onClick={() => navigate('/create-listing')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Listing
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Booking Requests Tab */}
          <TabsContent value="booking-requests" className="py-6">
            {bookingRequests.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">It looks like you don't have any booking requests at the moment.</h3>
                <p className="text-muted-foreground mb-4">
                  Once you receive booking requests, you can see them here.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-bold">{bookingRequests.length} Booking Requests</h2>
                </div>

                <div className="space-y-4">
                  {bookingRequests.map((request) => (
                    <Card key={request.id} className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Tenant Info */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{request.tenant?.full_name}</h3>
                              <p className="text-sm text-muted-foreground">{request.tenant?.email}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">University:</span>
                              <span className="text-sm">{request.tenant?.university || 'Not specified'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">Phone:</span>
                              <span className="text-sm">{request.tenant?.phone || 'Not provided'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">Check-in:</span>
                              <span className="text-sm">{new Date(request.check_in_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">Check-out:</span>
                              <span className="text-sm">{new Date(request.check_out_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">Monthly Rent:</span>
                              <span className="text-sm font-semibold">€{request.monthly_rent}</span>
                            </div>
                          </div>
                        </div>

                        {/* Middle Column - Listing Info & Application */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Property</h4>
                            <div className="flex gap-3">
                              {request.listing?.images?.[0] && (
                                <img
                                  src={request.listing.images[0]}
                                  alt={request.listing.title}
                                  className="w-16 h-16 object-cover rounded-lg"
                                />
                              )}
                              <div>
                                <p className="font-medium text-sm">{request.listing?.title}</p>
                                <p className="text-xs text-muted-foreground">{request.listing?.address_line}</p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">Application Message</h4>
                            <div className="bg-muted/30 p-3 rounded-lg text-sm">
                              {request.application_message ? (
                                <p>{request.application_message}</p>
                              ) : (
                                <p className="text-muted-foreground italic">No message provided</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">Supporting Document</h4>
                            {request.application_document_url ? (
                              <a 
                                href={request.application_document_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-2"
                              >
                                View Document ({request.application_document_type || 'PDF'})
                              </a>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                No document uploaded
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Column - Actions */}
                        <div className="space-y-4">
                          <div className="text-center space-y-2">
                            <div className="text-sm text-muted-foreground">
                              Request received: {new Date(request.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Payment authorized until: {new Date(request.authorization_expires_at).toLocaleDateString()}
                            </div>
                          </div>

                          {request.status === 'pending_landlord_response' ? (
                            <div className="space-y-3">
                              <Button 
                                onClick={() => handleBookingResponse(request.id, 'accepted')}
                                className="w-full bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Accept Application
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50">
                                    Refuse Application
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Refuse Application</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to refuse this rental application? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleBookingResponse(request.id, 'refused')}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Refuse Application
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Badge 
                                variant={request.status === 'confirmed' ? 'default' : 'destructive'}
                                className={request.status === 'confirmed' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                              >
                                {request.status === 'confirmed' ? 'Accepted' : 'Refused'}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Confirmed Bookings Tab */}
          <TabsContent value="confirmed-bookings" className="py-6">
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="py-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Full Name</label>
                      <Input value={profile?.full_name || ''} readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input value={user?.email || ''} readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">User Type</label>
                      <Input value="Private Landlord" readOnly className="mt-1" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-4">
                      <Button 
                        variant="outline" 
                        onClick={() => navigate('/')}
                        className="flex-1"
                      >
                        <Home className="w-4 h-4 mr-2" />
                        Back to Home
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleLogout}
                        className="flex-1"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};