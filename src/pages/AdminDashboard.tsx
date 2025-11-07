import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Clock, Eye, MessageSquare, Calendar, Download, MapPin, Loader2, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Logo } from '@/components/ui/logo';
import { SupportMessagesManager } from '@/components/admin/SupportMessagesManager';
import { UserImpersonation } from '@/components/admin/UserImpersonation';
import { AdminBookingRequests } from '@/components/admin/AdminBookingRequests';
import { AdminVisitRequests } from '@/components/admin/AdminVisitRequests';
import { FeedImportButton } from '@/components/admin/FeedImportButton';
import { geocodeAllListings } from '@/utils/geocoding';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

export const AdminDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [pendingListings, setPendingListings] = useState<PendingListing[]>([]);
  const [selectedListing, setSelectedListing] = useState<PendingListing | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [importingSpacest, setImportingSpacest] = useState(false);
  const [spacestFeedUrl, setSpacestFeedUrl] = useState('');
  const [spacestListingUrl, setSpacestListingUrl] = useState('');
  const [importingSingleListing, setImportingSingleListing] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingResults, setGeocodingResults] = useState<any>(null);
  const [isUpdatingPostcodes, setIsUpdatingPostcodes] = useState(false);
  const [postcodeResults, setPostcodeResults] = useState<any>(null);

  const handleApproveAll = async () => {
    if (pendingListings.length === 0) {
      toast({
        title: "No listings to approve",
        description: "There are no pending listings at the moment.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('listings')
        .update({
          review_status: 'approved',
          review_notes: 'Bulk approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: profile?.id,
          status: 'PUBLISHED'
        })
        .eq('review_status', 'pending_review');

      if (error) throw error;

      toast({
        title: "Success",
        description: `Approved and published ${pendingListings.length} listing(s)`,
      });

      fetchPendingListings();
      setSelectedListing(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error approving listings:', error);
      toast({
        title: "Error",
        description: "Failed to approve listings",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (profile?.user_type !== 'admin') {
      navigate('/');
      return;
    }
    fetchPendingListings();
  }, [profile, navigate]);

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
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (listingId: string, action: 'approved' | 'rejected', notes: string) => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({
          review_status: action,
          review_notes: notes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: profile?.id,
          status: action === 'approved' ? 'PUBLISHED' : 'DRAFT'
        })
        .eq('id', listingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Listing ${action} successfully${action === 'approved' ? ' and published' : ''}`,
      });

      fetchPendingListings();
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

  const handleSpacestImport = async () => {
    setImportingSpacest(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-spacest-listings', {
        body: spacestFeedUrl ? { feed_url: spacestFeedUrl } : undefined,
      });

      if (error) throw error;

      const result = data as { imported: number; updated: number; skipped: number; errors: string[] };

      toast({
        title: "Import Completed",
        description: `Imported: ${result.imported}, Updated: ${result.updated}, Skipped: ${result.skipped}`,
      });

      if (result.errors.length > 0) {
        console.error('Import errors:', result.errors);
      }

      fetchPendingListings();
    } catch (error) {
      console.error('Error importing Spacest listings:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import Spacest listings",
        variant: "destructive",
      });
    } finally {
      setImportingSpacest(false);
    }
  };

  const handleGeocodeAllListings = async () => {
    setIsGeocoding(true);
    setGeocodingResults(null);
    
    try {
      const results = await geocodeAllListings();
      setGeocodingResults(results);
      
      const successCount = results.results.filter((r: any) => r.success).length;
      const failCount = results.results.filter((r: any) => !r.success).length;
      
      toast({
        title: "Geocoding Complete",
        description: `${successCount} successful, ${failCount} failed`,
      });
    } catch (error) {
      console.error('Error geocoding listings:', error);
      toast({
        title: "Error",
        description: "Failed to geocode listings",
        variant: "destructive",
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleUpdatePostcodes = async () => {
    setIsUpdatingPostcodes(true);
    setPostcodeResults(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('update-postcodes');
      
      if (error) throw error;
      
      setPostcodeResults(data);
      
      toast({
        title: "Postcode Update Complete",
        description: `${data.updated} updated, ${data.failed} failed`,
      });
    } catch (error) {
      console.error('Error updating postcodes:', error);
      toast({
        title: "Error",
        description: "Failed to update postcodes",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPostcodes(false);
    }
  };

  const handleImportSingleListing = async () => {
    if (!spacestListingUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Spacest listing URL",
        variant: "destructive",
      });
      return;
    }

    setImportingSingleListing(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-spacest-listing-by-url', {
        body: { listing_url: spacestListingUrl },
      });

      if (error) throw error;

      toast({
        title: "Import Successful",
        description: `Listing ${data.action} successfully`,
      });

      setSpacestListingUrl('');
      fetchPendingListings();
    } catch (error) {
      console.error('Error importing listing:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import Spacest listing",
        variant: "destructive",
      });
    } finally {
      setImportingSingleListing(false);
    }
  };


  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="hover:bg-accent"
            title="Back to homepage"
          >
            <Logo size={24} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Trust & Safety Review Portal</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <Button 
              onClick={handleApproveAll} 
              disabled={pendingListings.length === 0}
              variant="default"
              size="sm"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve All
            </Button>
            <Badge variant="outline" className="text-orange-600">
              {pendingListings.length} Pending Review
            </Badge>
          </div>
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Spacest listing URL (e.g., https://spacest.com/it/rent-listing/180298)"
              value={spacestListingUrl}
              onChange={(e) => setSpacestListingUrl(e.target.value)}
              className="w-96"
            />
            <Button 
              onClick={handleImportSingleListing} 
              disabled={importingSingleListing}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              {importingSingleListing ? 'Importing...' : 'Import Single Listing'}
            </Button>
          </div>
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Feed URL (optional, leave empty for default)"
              value={spacestFeedUrl}
              onChange={(e) => setSpacestFeedUrl(e.target.value)}
              className="w-96"
            />
            <Button 
              onClick={handleSpacestImport} 
              disabled={importingSpacest}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              {importingSpacest ? 'Importing...' : 'Import Feed'}
            </Button>
            <FeedImportButton />
          </div>
        </div>
      </div>

      <Tabs defaultValue="visits" className="space-y-6">
        <TabsList>
          <TabsTrigger value="visits">
            <MessageSquare className="w-4 h-4 mr-2" />
            Visit Requests
          </TabsTrigger>
          <TabsTrigger value="bookings">
            <Calendar className="w-4 h-4 mr-2" />
            Booking Requests
          </TabsTrigger>
          <TabsTrigger value="pending">
            <Clock className="w-4 h-4 mr-2" />
            Pending Reviews ({pendingListings.length})
          </TabsTrigger>
          <TabsTrigger value="geocoding">
            <MapPin className="w-4 h-4 mr-2" />
            Geocoding
          </TabsTrigger>
          <TabsTrigger value="support">
            <MessageSquare className="w-4 h-4 mr-2" />
            Support Messages
          </TabsTrigger>
          <TabsTrigger value="impersonation">
            <Eye className="w-4 h-4 mr-2" />
            User Impersonation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visits">
          <AdminVisitRequests />
        </TabsContent>

        <TabsContent value="bookings">
          <AdminBookingRequests />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {// ... keep existing code
          }
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Listings Awaiting Review</h2>
              
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
                        <h3 className="font-semibold">{listing.title}</h3>
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
                    <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                    <p className="text-muted-foreground">
                      No listings pending review at the moment.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              {selectedListing ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Review Listing
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg">{selectedListing.title}</h3>
                        <p className="text-muted-foreground">{selectedListing.address_line}, {selectedListing.city}</p>
                        <p className="text-lg font-bold text-green-600 mt-2">
                          €{selectedListing.rent_monthly_eur}/month
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-sm text-muted-foreground">{selectedListing.description}</p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Landlord Details</h4>
                        <p className="text-sm">Name: {selectedListing.profiles?.full_name}</p>
                        <p className="text-sm">Email: {selectedListing.profiles?.email}</p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Photos ({selectedListing.images.length})</h4>
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
                        <h4 className="font-medium mb-2">Review Notes (Optional)</h4>
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
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Select a listing to review</h3>
                    <p className="text-muted-foreground">
                      Click on a listing from the left panel to start reviewing.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="geocoding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geocoding Management</CardTitle>
              <CardDescription>
                Fix property coordinates by geocoding addresses from titles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={handleUpdatePostcodes}
                  disabled={isUpdatingPostcodes}
                  variant="outline"
                >
                  {isUpdatingPostcodes ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Postcodes...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-4 w-4" />
                      Update Missing Postcodes
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleGeocodeAllListings}
                  disabled={isGeocoding}
                >
                  {isGeocoding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Geocoding All Listings...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-4 w-4" />
                      Geocode All Published Listings
                    </>
                  )}
                </Button>
              </div>

              {postcodeResults && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Postcode Update Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm">Total: {postcodeResults.total}</p>
                      <p className="text-sm text-green-600">Updated: {postcodeResults.updated}</p>
                      <p className="text-sm text-red-600">Failed: {postcodeResults.failed}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {geocodingResults && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{geocodingResults.total_listings}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {geocodingResults.results.filter((r: any) => r.success).length} / {geocodingResults.total_listings}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Old Coordinates</TableHead>
                          <TableHead>New Coordinates</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {geocodingResults.results.map((result: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>
                              {result.success ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-600" />
                              )}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {result.address}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {result.old_coordinates ? 
                                `${result.old_coordinates.lat.toFixed(4)}, ${result.old_coordinates.lng.toFixed(4)}` 
                                : '-'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {result.new_coordinates ? 
                                `${result.new_coordinates.lat.toFixed(4)}, ${result.new_coordinates.lng.toFixed(4)}` 
                                : '-'}
                            </TableCell>
                            <TableCell className="text-sm text-red-600">
                              {result.error || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support">
          <SupportMessagesManager />
        </TabsContent>
        
        <TabsContent value="impersonation">
          <UserImpersonation />
        </TabsContent>
      </Tabs>
    </div>
  );
};