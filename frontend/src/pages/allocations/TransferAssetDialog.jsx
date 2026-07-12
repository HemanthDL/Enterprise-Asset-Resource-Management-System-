import { useState, useEffect } from 'react';
import { transfersAPI, assetsAPI, usersAPI } from '@/api/endpoints';
import { useAuth } from '@/contexts/AuthContext';
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

export default function TransferAssetDialog({ open, onOpenChange, onSuccess }) {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form values
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [toEmployeeId, setToEmployeeId] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      // Fetch allocated assets
      assetsAPI.list({ limit: 100 }).then((res) => {
        const allocated = (res.data.items || []).filter(
          (a) => a.current_status === 'allocated'
        );
        setAssets(allocated);
      }).catch(console.error);

      // Fetch employees
      usersAPI.list({ limit: 100 }).then((res) => {
        setEmployees(res.data.items || []);
      }).catch(console.error);

      // Default destination to current user
      if (user) {
        setToEmployeeId(user.id);
      }
      setReason('');
      setSelectedAssetId('');
    }
  }, [open, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssetId) {
      toast.error('Please select an asset to transfer.');
      return;
    }
    if (!toEmployeeId) {
      toast.error('Please select the receiving employee.');
      return;
    }

    setLoading(true);
    const payload = {
      asset_id: selectedAssetId,
      to_employee: toEmployeeId,
      reason: reason || null,
    };

    try {
      await transfersAPI.create(payload);
      toast.success('Transfer request submitted successfully. Awaiting approval.');
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to request transfer:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Asset Transfer</DialogTitle>
          <DialogDescription>
            Request custody of an allocated asset from another user. Requires department head or asset manager approval.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Select Allocated Asset *</Label>
            <Select value={selectedAssetId} onValueChange={setSelectedAssetId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select asset..." />
              </SelectTrigger>
              <SelectContent>
                {assets.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.asset_name} ({a.asset_tag} — Holder: {a.current_holder_name || 'Unknown'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Transfer Custody To *</Label>
            <Select value={toEmployeeId} onValueChange={setToEmployeeId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select receiving employee..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name || ''} {emp.id === user?.id ? '(Me)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="reason">Reason for Transfer (Optional)</Label>
            <Input
              id="reason"
              placeholder="e.g. Employee changed departments, project requirements"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
