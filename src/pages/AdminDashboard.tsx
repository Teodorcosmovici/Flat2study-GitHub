import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, Eye, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

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
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Trust & Safety Review Portal</p>
        </div>
        <Badge variant="outline" className="text-orange-600">
          {pendingListings.length} Pending Review
        </Badge>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">
            <Clock className="w-4 h-4 mr-2" />
            Pending Reviews ({pendingListings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Listings List */}
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

            {/* Review Panel */}
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
      </Tabs>
    </div>
  );
};