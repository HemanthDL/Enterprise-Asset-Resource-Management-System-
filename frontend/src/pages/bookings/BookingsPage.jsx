import { useState, useEffect } from 'react';
import { bookingsAPI, assetsAPI } from '@/api/endpoints';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { CalendarRange, CalendarCheck2, X, Plus, AlertCircle } from 'lucide-react';
import BookResourceDialog from './BookResourceDialog';
import { toast } from 'sonner';

export default function BookingsPage() {
  const { user } = useAuth();
  
  // Dialog state
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  
  // Data lists
  const [bookings, setBookings] = useState([]);
  const [bookableResources, setBookableResources] = useState([]);
  const [resourceBookings, setResourceBookings] = useState([]);
  
  // Selection states
  const [selectedResourceId, setSelectedResourceId] = useState('none');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await bookingsAPI.list({ limit: 100 });
      setBookings(res.data.items || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookableResources = async () => {
    try {
      const res = await assetsAPI.list({ limit: 100 });
      const bookable = (res.data.items || []).filter((a) => a.is_bookable);
      setBookableResources(bookable);
      if (bookable.length > 0) {
        setSelectedResourceId(bookable[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch bookable resources:', error);
    }
  };

  const fetchCalendar = async (resourceId) => {
    if (!resourceId || resourceId === 'none') {
      setResourceBookings([]);
      return;
    }
    setCalendarLoading(true);
    try {
      const res = await bookingsAPI.getResourceCalendar(resourceId);
      // Backend returns list[BookingResponse]
      setResourceBookings(res.data || []);
    } catch (error) {
      console.error('Failed to fetch resource calendar:', error);
    } finally {
      setCalendarLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchBookableResources();
  }, []);

  useEffect(() => {
    if (selectedResourceId && selectedResourceId !== 'none') {
      fetchCalendar(selectedResourceId);
    }
  }, [selectedResourceId]);

  const openCancelDialog = (booking) => {
    setSelectedBooking(booking);
    setIsCancelOpen(true);
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    setActionLoading(true);
    try {
      await bookingsAPI.cancel(selectedBooking.id);
      toast.success('Reservation cancelled successfully');
      setIsCancelOpen(false);
      fetchBookings();
      if (selectedResourceId === selectedBooking.asset_id) {
        fetchCalendar(selectedResourceId);
      }
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { key: 'asset_tag', header: 'Tag', cellClassName: 'font-mono text-xs' },
    { key: 'asset_name', header: 'Resource Name', cellClassName: 'font-semibold' },
    { key: 'booker_name', header: 'Reserved By' },
    {
      key: 'start_datetime',
      header: 'Start Date/Time',
      cell: (row) => format(new Date(row.start_datetime), 'MMM dd, yyyy hh:mm a')
    },
    {
      key: 'end_datetime',
      header: 'End Date/Time',
      cell: (row) => format(new Date(row.end_datetime), 'MMM dd, yyyy hh:mm a')
    },
    {
      key: 'booking_status',
      header: 'Status',
      cell: (row) => <StatusBadge status={row.booking_status} />
    },
    {
      key: 'actions',
      header: 'Actions',
      cellClassName: 'text-right',
      cell: (row) => {
        const canCancel =
          (row.booking_status === 'upcoming' || row.booking_status === 'ongoing') &&
          row.booked_by === user?.id;
        
        return canCancel ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => openCancelDialog(row)}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        ) : null;
      }
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shared Resource Bookings"
        description="Book meeting rooms, company vehicles, or shared testing devices."
      >
        <Button onClick={() => setIsBookOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Book Resource
        </Button>
      </PageHeader>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <CalendarCheck2 className="h-4 w-4" />
            My Bookings
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4" />
            Availability Finder
          </TabsTrigger>
        </TabsList>

        {/* My Bookings Tab */}
        <TabsContent value="list">
          <Card>
            <CardContent className="pt-6">
              <DataTable
                columns={columns}
                data={bookings}
                loading={loading}
                emptyTitle="No bookings found"
                emptyDescription="Reserve shared workspaces or devices to see them here."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Availability Finder Tab */}
        <TabsContent value="calendar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-1 border-border/60 shadow-sm h-fit">
              <CardHeader>
                <CardTitle>Resource Scheduler</CardTitle>
                <CardDescription>Select a shared room or device to inspect its reservation timeline.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label>Select shared resource</Label>
                  <Select value={selectedResourceId} onValueChange={setSelectedResourceId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose resource..." />
                    </SelectTrigger>
                    <SelectContent>
                      {bookableResources.map((res) => (
                        <SelectItem key={res.id} value={res.id}>
                          {res.asset_name} ({res.asset_tag})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-2 border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>Schedule Timeline</CardTitle>
                <CardDescription>Upcoming active bookings for this resource.</CardDescription>
              </CardHeader>
              <CardContent>
                {calendarLoading ? (
                  <div className="py-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                    Loading schedule...
                  </div>
                ) : resourceBookings.filter(b => b.booking_status !== 'cancelled').length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <CalendarCheck2 className="h-8 w-8 text-muted-foreground/60 mb-2" />
                    <span>No active reservations. This resource is fully available!</span>
                  </div>
                ) : (
                  <div className="relative border-l border-border pl-6 space-y-6 max-h-[450px] overflow-y-auto pr-1">
                    {resourceBookings
                      .filter((b) => b.booking_status !== 'cancelled')
                      .map((book) => (
                        <div key={book.id} className="relative">
                          {/* Dot indicator */}
                          <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border border-background bg-destructive"></div>
                          
                          <div className="bg-muted/30 hover:bg-muted/50 p-4 rounded-lg border transition-colors space-y-1.5">
                            <div className="flex justify-between items-start gap-4">
                              <h4 className="font-semibold text-sm">{book.purpose || 'Reserved Slot'}</h4>
                              <StatusBadge status={book.booking_status} />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Reserved By: <span className="font-medium text-foreground">{book.booker_name}</span>
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {format(new Date(book.start_datetime), 'MMM dd, yyyy hh:mm a')} ➔ {format(new Date(book.end_datetime), 'MMM dd, yyyy hh:mm a')}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Book Dialog */}
      <BookResourceDialog
        open={isBookOpen}
        onOpenChange={setIsBookOpen}
        onSuccess={() => {
          fetchBookings();
          if (selectedResourceId !== 'none') {
            fetchCalendar(selectedResourceId);
          }
        }}
      />

      {/* Cancel Confirm Dialog */}
      <ConfirmDialog
        open={isCancelOpen}
        onOpenChange={setIsCancelOpen}
        title="Cancel Booking Reservation?"
        description={`Are you sure you want to cancel the reservation for ${selectedBooking?.asset_name}?`}
        confirmLabel="Cancel Booking"
        loading={actionLoading}
        onConfirm={handleCancelBooking}
      />
    </div>
  );
}
