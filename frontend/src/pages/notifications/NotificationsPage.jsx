import { useState, useEffect } from 'react';
import { notificationsAPI } from '@/api/endpoints';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { Bell, Check, MailOpen, AlertTriangle, Monitor, CalendarDays, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationsAPI.list({ limit: 100 });
      // Backend returns list[NotificationResponse]
      setNotifications(res.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      toast.success('Notification marked as read');
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      toast.success('All notifications marked as read');
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all read:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'asset_assigned':
      case 'asset_returned':
        return <Monitor className="h-5 w-5 text-blue-500" />;
      case 'maintenance_request':
      case 'maintenance_approved':
      case 'maintenance_rejected':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'transfer_requested':
      case 'transfer_approved':
      case 'transfer_rejected':
        return <ArrowRightLeft className="h-5 w-5 text-purple-500" />;
      case 'booking_confirmed':
      case 'booking_cancelled':
        return <CalendarDays className="h-5 w-5 text-emerald-500" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Notifications Center"
        description="Stay up to date with resource allocations, custody approvals, and maintenance tickets updates."
      >
        {notifications.some((n) => !n.is_read) && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <MailOpen className="h-4 w-4 mr-2" />
            Mark all read
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
              <div className="p-4 rounded-full bg-muted mb-2">
                <Bell className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <h3 className="font-semibold text-lg">Inbox fully read!</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                You have no notifications or messages at the moment.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex gap-4 p-4 transition-colors hover:bg-muted/10 ${
                    !notif.is_read ? 'bg-primary/5 dark:bg-primary/10' : ''
                  }`}
                >
                  <div className="p-2.5 bg-muted rounded-full h-fit mt-1">
                    {getIcon(notif.notification_type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="font-semibold text-sm">{notif.title}</h4>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {notif.sent_date ? format(new Date(notif.sent_date), 'MMM dd, hh:mm a') : ''}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{notif.message}</p>
                    <div className="flex items-center gap-2 pt-1.5">
                      <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider bg-muted px-1.5 py-0.5 rounded">
                        {notif.notification_type?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                  {!notif.is_read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Mark as read"
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => handleMarkRead(notif.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
