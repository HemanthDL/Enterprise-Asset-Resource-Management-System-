import { useState, useEffect } from 'react';
import { allocationsAPI, assetsAPI } from '@/api/endpoints';
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

export default function ReturnAssetDialog({ open, onOpenChange, onSuccess }) {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form values
  const [selectedAllocId, setSelectedAllocId] = useState('');
  const [condition, setCondition] = useState('good');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      // Fetch active allocations
      allocationsAPI.list({ limit: 100 }).then((res) => {
        const active = (res.data.items || []).filter(
          (a) => a.allocation_status === 'allocated'
        );
        setAllocations(active);
      }).catch(console.error);

      setSelectedAllocId('');
      setCondition('good');
      setNotes('');
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAllocId) {
      toast.error('Please select an allocated asset to return.');
      return;
    }

    setLoading(true);
    const payload = {
      check_in_notes: notes || null,
      asset_condition: condition,
    };

    try {
      await allocationsAPI.return(selectedAllocId, payload);
      toast.success('Asset returned and checked back in successfully');
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to return asset:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Return & Check In Asset</DialogTitle>
          <DialogDescription>
            Check back in an allocated asset to storage. Specify condition updates and check-in notes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Select Active Allocation *</Label>
            <Select value={selectedAllocId} onValueChange={setSelectedAllocId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select asset..." />
              </SelectTrigger>
              <SelectContent>
                {allocations.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.asset_name} ({a.asset_tag} — Holder: {a.employee_name || a.department_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Condition on Return *</Label>
            <Select value={condition} onValueChange={setCondition} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="poor">Poor</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Check-in Notes (Optional)</Label>
            <Input
              id="notes"
              placeholder="e.g. Scratches on back cover, power brick included"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Return
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
