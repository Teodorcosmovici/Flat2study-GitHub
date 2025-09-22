import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Home, Calendar, BarChart3, Edit, Eye, Trash2, LogOut, User, CheckCircle } from 'lucide-react';
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
      // Fetch listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .eq('agency_id', profile.id)
        .order('created_at', { ascending: false });

      if (listingsError) throw listingsError;

      setListings((listingsData || []).map(listing => ({
        ...listing,
        images: Array.isArray(listing.images) ? listing.images.map(img => String(img)) : []
      })));
      
      // Skip bookings for now due to database relationship issues
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

  const getStatusBadge = (status: string, reviewStatus: string) => {
    if (reviewStatus === 'pending_review') {
      return <Badge variant="outline" className="text-orange-600">Pending Review</Badge>;
    }
    if (reviewStatus === 'rejected') {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    if (status === 'PUBLISHED') {
      return <Badge variant="default" className="bg-green-600">Published</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <>
      {/* Dedicated Landlord Dashboard Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-black">Landlord Dashboard</h1>
                <p className="text-gray-600">Welcome back, {profile?.full_name || 'Property Manager'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="text-black border-gray-300 hover:bg-gray-100"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="text-black border-gray-300 hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl font-semibold text-black">Property Management</h2>
            <p className="text-gray-600">Manage your listings, bookings, and analytics</p>
          </div>
          <Button onClick={() => navigate('/create-listing')} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Add New Listing
          </Button>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? "..." : activeListingsCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {listings.filter(l => l.review_status === 'pending_review').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{bookings.reduce((sum, booking) => sum + (booking.monthly_rent || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="listings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="listings">My Listings</TabsTrigger>
          <TabsTrigger value="bookings">Rented Out</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">My Properties</h2>
            <Button onClick={() => navigate('/create-listing')}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Listing
            </Button>
          </div>

          <div className="grid gap-4">
            {listings.filter(listing => listing.status !== 'RENTED').map((listing) => (
              <Card key={listing.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      {listing.images[0] && (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{listing.title}</h3>
                          {getStatusBadge(listing.status, listing.review_status)}
                        </div>
                        <p className="text-muted-foreground">
                          {listing.bedrooms} bed, {listing.bathrooms} bath • {listing.city}
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          €{listing.rent_monthly_eur}/month
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Created: {new Date(listing.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                     <div className="flex gap-2">
                       <Button variant="outline" size="sm" onClick={() => navigate(`/listing/${listing.id}`)}>
                         <Eye className="w-4 h-4" />
                       </Button>
                       <Button variant="outline" size="sm" onClick={() => navigate(`/edit-listing/${listing.id}`)}>
                         <Edit className="w-4 h-4" />
                       </Button>
                       <Button 
                         variant="outline" 
                         size="sm" 
                         onClick={() => handleDeleteListing(listing.id)}
                         className="text-red-600 hover:text-red-700"
                       >
                         <Trash2 className="w-4 h-4" />
                       </Button>
                       <AlertDialog>
                         <AlertDialogTrigger asChild>
                           <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                             <CheckCircle className="w-4 h-4 mr-1" />
                             Rented Out!
                           </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent>
                           <AlertDialogHeader>
                             <AlertDialogTitle>Are you sure it was rented out?</AlertDialogTitle>
                             <AlertDialogDescription>
                               This action will move the listing to your past listings and mark it as rented out.
                             </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                             <AlertDialogCancel>Cancel</AlertDialogCancel>
                             <AlertDialogAction onClick={() => handleRentedOut(listing.id)}>
                               Yes, mark as rented out
                             </AlertDialogAction>
                           </AlertDialogFooter>
                         </AlertDialogContent>
                       </AlertDialog>
                     </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {listings.filter(listing => listing.status !== 'RENTED').length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Home className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first property listing to start attracting tenants.
                  </p>
                  <Button onClick={() => navigate('/create-listing')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Listing
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <h2 className="text-2xl font-bold">Rented Out</h2>
          
          <div className="grid gap-4">
            {listings.filter(listing => listing.status === 'RENTED').map((listing) => (
              <Card key={listing.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      {listing.images[0] && (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{listing.title}</h3>
                          <Badge variant="default" className="bg-gray-600">Rented Out</Badge>
                        </div>
                        <p className="text-muted-foreground">
                          {listing.bedrooms} bed, {listing.bathrooms} bath • {listing.city}
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          €{listing.rent_monthly_eur}/month
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Created: {new Date(listing.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {listings.filter(listing => listing.status === 'RENTED').length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No rented out listings yet</h3>
                  <p className="text-muted-foreground">
                    Listings marked as rented out will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <h2 className="text-2xl font-bold">Analytics</h2>
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
              <p className="text-muted-foreground">
                Detailed analytics and insights about your property performance will be available here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
};