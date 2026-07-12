import { useState, useEffect } from 'react';
import { bookingsAPI, assetsAPI, departmentsAPI } from '@/api/endpoints';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function BookResourceDialog({ open, onOpenChange, onSuccess }) {
  const [resources, setResources] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form values
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('none');
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');
  const [purpose, setPurpose] = useState('');

  useEffect(() => {
    if (open) {
      // Fetch bookable assets
      assetsAPI.list({ limit: 100 }).then((res) => {
        const bookable = (res.data.items || []).filter((a) => a.is_bookable);
        setResources(bookable);
      }).catch(console.error);

      // Fetch departments
      departmentsAPI.list({ limit: 100 }).then((res) => {
        setDepartments(res.data.items || []);
      }).catch(console.error);

      setSelectedAssetId('');
      setSelectedDeptId('none');
      setStartDatetime('');
      setEndDatetime('');
      setPurpose('');
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssetId) {
      toast.error('Please select a resource to book.');
      return;
    }
    if (!startDatetime || !endDatetime) {
      toast.error('Please specify start and end times.');
      return;
    }

    const start = new Date(startDatetime);
    const end = new Date(endDatetime);
    if (end <= start) {
      toast.error('End date/time must be strictly after start date/time.');
      return;
    }

    setLoading(true);
    const payload = {
      asset_id: selectedAssetId,
      department_id: selectedDeptId === 'none' ? null : selectedDeptId,
      start_datetime: start.toISOString(),
      end_datetime: end.toISOString(),
      purpose: purpose || null,
    };

    try {
      await bookingsAPI.create(payload);
      toast.success('Resource booked successfully!');
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      // Axios interceptor will output standard detail/conflict error toast automatically
      console.error('Failed to create booking:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book Shared Resource</DialogTitle>
          <DialogDescription>
            Schedule a room, vehicle, or equipment. Overlap reservations will be rejected.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Select Resource *</Label>
            <Select value={selectedAssetId} onValueChange={setSelectedAssetId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select space or equipment..." />
              </SelectTrigger>
              <SelectContent>
                {resources.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.asset_name} ({r.asset_tag} — {r.location || 'No Location'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Booking Department (Optional)</Label>
            <Select value={selectedDeptId} onValueChange={setSelectedDeptId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select department..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.department_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={startDatetime}
                onChange={(e) => setStartDatetime(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={endDatetime}
                onChange={(e) => setEndDatetime(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="purpose">Purpose of Booking</Label>
            <Input
              id="purpose"
              placeholder="e.g. Design review meeting, client visit transport"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              disabled={loading}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reserve Slot
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
