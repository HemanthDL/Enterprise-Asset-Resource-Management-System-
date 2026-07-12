import { useState, useEffect } from 'react';
import { maintenanceAPI, assetsAPI } from '@/api/endpoints';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleAccess } from '@/hooks/useRoleAccess';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function RaiseMaintenanceDialog({ open, onOpenChange, onSuccess }) {
  const { user } = useAuth();
  const { isEmployee } = useRoleAccess();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form values
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  useEffect(() => {
    if (open) {
      // Fetch assets
      assetsAPI.list({ limit: 100 }).then((res) => {
        let items = res.data.items || [];
        if (isEmployee) {
          items = items.filter((a) => a.current_holder === user?.id);
        }
        setAssets(items);
      }).catch(console.error);

      setSelectedAssetId('');
      setIssueDescription('');
      setPriority('MEDIUM');
      setAttachmentUrl('');
    }
  }, [open, isEmployee, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssetId) {
      toast.error('Please select an asset.');
      return;
    }
    if (!issueDescription.trim()) {
      toast.error('Please describe the issue.');
      return;
    }

    setLoading(true);
    const payload = {
      asset_id: selectedAssetId,
      issue_description: issueDescription,
      priority: priority,
      attachment_url: attachmentUrl || null,
    };

    try {
      await maintenanceAPI.create(payload);
      toast.success('Maintenance request raised successfully');
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to raise maintenance:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Raise Maintenance Request</DialogTitle>
          <DialogDescription>
            Report issues with physical assets or devices. Managers will review and assign technicians.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Select Asset *</Label>
            <Select value={selectedAssetId} onValueChange={setSelectedAssetId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Choose asset..." />
              </SelectTrigger>
              <SelectContent>
                {assets.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.asset_name} ({a.asset_tag})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Priority *</Label>
            <Select value={priority} onValueChange={setPriority} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Issue Description *</Label>
            <textarea
              id="description"
              placeholder="Describe the malfunction, damage, or issue..."
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="attachment">Attachment URL (Optional)</Label>
            <Input
              id="attachment"
              placeholder="Image or error log link..."
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
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
