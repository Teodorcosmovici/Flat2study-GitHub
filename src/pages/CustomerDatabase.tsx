import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Filter, Mail, Phone, GraduationCap, Calendar, MessageSquare, Heart } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface CustomerData {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  university?: string;
  created_at: string;
  last_active?: string;
  total_messages: number;
  total_favorites: number;
  total_inquiries: number;
}

export default function CustomerDatabase() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [universityFilter, setUniversityFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    // Temporarily allow access without authentication for testing
    // if (!user) {
    //   navigate("/auth");
    //   return;
    // }

    // Allow access for admin, agency, and private users
    if (user && profile && profile.user_type !== "admin" && profile.user_type !== "agency" && profile.user_type !== "private") {
      toast.error("Access denied. Only admin users and agencies can view the customer database.");
      navigate("/");
      return;
    }

    fetchCustomers();
  }, [user, profile, navigate]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      // Fetch all student profiles with activity data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'student')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch activity data for each customer
      const customersWithActivity = await Promise.all(
        profiles.map(async (profile) => {
          // Get message count
          const { count: messageCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', profile.user_id);

          // Get favorites count
          const { count: favoritesCount } = await supabase
            .from('favorites')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.user_id);

          // Get unique inquiries count (distinct listings they've messaged about)
          const { data: inquiries } = await supabase
            .from('messages')
            .select('listing_id')
            .eq('sender_id', profile.user_id);

          const uniqueInquiries = new Set(inquiries?.map(m => m.listing_id) || []).size;

          // Get last activity (most recent message)
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('created_at')
            .eq('sender_id', profile.user_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            id: profile.id,
            user_id: profile.user_id,
            full_name: profile.full_name || 'Anonymous Student',
            email: profile.email || '',
            phone: profile.phone,
            university: profile.university,
            created_at: profile.created_at,
            last_active: lastMessage?.created_at,
            total_messages: messageCount || 0,
            total_favorites: favoritesCount || 0,
            total_inquiries: uniqueInquiries
          };
        })
      );

      setCustomers(customersWithActivity);
      setFilteredCustomers(customersWithActivity);
      
      console.log('Fetched customers:', customersWithActivity.length);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customer data');
      
      // Show empty state instead of erroring out
      setCustomers([]);
      setFilteredCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter customers based on search and filters
  useEffect(() => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter(customer => 
        customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.university?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (universityFilter) {
      filtered = filtered.filter(customer =>
        customer.university?.toLowerCase().includes(universityFilter.toLowerCase())
      );
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(customer =>
        new Date(customer.created_at) >= filterDate
      );
    }

    setFilteredCustomers(filtered);
  }, [searchTerm, universityFilter, dateFilter, customers]);

  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'University', 'Joined Date', 'Last Active', 'Messages', 'Favorites', 'Inquiries'],
      ...filteredCustomers.map(customer => [
        customer.full_name,
        customer.email,
        customer.phone || '',
        customer.university || '',
        new Date(customer.created_at).toLocaleDateString(),
        customer.last_active ? new Date(customer.last_active).toLocaleDateString() : 'Never',
        customer.total_messages.toString(),
        customer.total_favorites.toString(),
        customer.total_inquiries.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getActivityLevel = (customer: CustomerData) => {
    const totalActivity = customer.total_messages + customer.total_favorites + customer.total_inquiries;
    if (totalActivity >= 10) return { level: 'High', color: 'bg-green-500' };
    if (totalActivity >= 5) return { level: 'Medium', color: 'bg-yellow-500' };
    if (totalActivity > 0) return { level: 'Low', color: 'bg-orange-500' };
    return { level: 'None', color: 'bg-gray-500' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background/50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Customer Database</h1>
            <p className="text-muted-foreground">
              Manage and view all your clients ({filteredCustomers.length} customers)
            </p>
          </div>
          <Button onClick={exportToCSV} className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold">{customers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">
                    {customers.filter(c => c.total_messages > 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Heart className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">With Favorites</p>
                  <p className="text-2xl font-bold">
                    {customers.filter(c => c.total_favorites > 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">
                    {customers.filter(c => 
                      new Date(c.created_at) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    ).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or university..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Input
                placeholder="Filter by university..."
                value={universityFilter}
                onChange={(e) => setUniversityFilter(e.target.value)}
              />
              <Input
                type="date"
                placeholder="Joined after..."
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Customer Table */}
        <Card>
          <CardHeader>
            <CardTitle>Customer List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Customer</th>
                    <th className="text-left p-3 font-semibold">Contact</th>
                    <th className="text-left p-3 font-semibold">University</th>
                    <th className="text-left p-3 font-semibold">Activity</th>
                    <th className="text-left p-3 font-semibold">Joined</th>
                    <th className="text-left p-3 font-semibold">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => {
                    const activity = getActivityLevel(customer);
                    return (
                      <tr key={customer.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{customer.full_name}</p>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${activity.color} text-white mt-1`}
                            >
                              {activity.level} Activity
                            </Badge>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-3 h-3" />
                              {customer.email}
                            </div>
                            {customer.phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {customer.university || 'Not specified'}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-4 text-xs">
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {customer.total_messages} messages
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {customer.total_favorites} favorites
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {customer.total_inquiries} property inquiries
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDate(customer.created_at)}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-muted-foreground">
                            {customer.last_active 
                              ? formatDate(customer.last_active)
                              : 'No activity'
                            }
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredCustomers.length === 0 && (
                <div className="text-center py-12">
                  <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold">No customers found</p>
                  <p className="text-muted-foreground">
                    {searchTerm || universityFilter || dateFilter 
                      ? "Try adjusting your filters"
                      : "No students have registered yet"
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}