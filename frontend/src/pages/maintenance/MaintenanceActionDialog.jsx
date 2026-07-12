import { useState, useEffect } from 'react';
import { maintenanceAPI, usersAPI } from '@/api/endpoints';
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

export default function MaintenanceActionDialog({ request, open, onOpenChange, onSuccess }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form values
  const [actionType, setActionType] = useState(''); // 'approve' | 'reject' | 'assign' | 'start' | 'resolve'
  const [technicianId, setTechnicianId] = useState('');
  const [comments, setComments] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    if (request && open) {
      // Determine default action type based on request status
      const status = request.approval_status;
      if (status === 'pending') {
        setActionType('approve');
      } else if (status === 'approved' || status === 'assigned') {
        setActionType('assign');
        // Load technicians/employees
        usersAPI.list({ limit: 200 }).then((res) => {
          setEmployees(res.data.items || []);
        }).catch(console.error);
      } else if (status === 'in_progress') {
        setActionType('resolve');
      }

      setTechnicianId(request.technician || '');
      setComments('');
      setResolutionNotes('');
    }
  }, [request, open]);

  if (!request) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (actionType === 'approve') {
        await maintenanceAPI.approve(request.id);
        toast.success('Maintenance request approved');
      } else if (actionType === 'reject') {
        await maintenanceAPI.reject(request.id, { comments: comments || null });
        toast.error('Maintenance request rejected');
      } else if (actionType === 'assign') {
        if (!technicianId) {
          toast.error('Please select a technician.');
          setLoading(false);
          return;
        }
        await maintenanceAPI.assign(request.id, { technician_id: technicianId });
        toast.success('Technician assigned successfully');
      } else if (actionType === 'start') {
        await maintenanceAPI.start(request.id);
        toast.success('Maintenance work started');
      } else if (actionType === 'resolve') {
        await maintenanceAPI.resolve(request.id, { resolution_notes: resolutionNotes || null });
        toast.success('Maintenance request resolved successfully');
      }
      
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to perform maintenance action:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Maintenance Request</DialogTitle>
          <DialogDescription>
            Request ID: <span className="font-mono text-xs">{request.id}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Action selection only if pending */}
          {request.approval_status === 'pending' && (
            <div className="space-y-1">
              <Label>Action</Label>
              <Select value={actionType} onValueChange={setActionType} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Approve Request</SelectItem>
                  <SelectItem value="reject">Reject Request</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Action selection if approved or assigned */}
          {(request.approval_status === 'approved' || request.approval_status === 'assigned') && (
            <div className="space-y-1">
              <Label>Action</Label>
              <Select value={actionType} onValueChange={setActionType} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assign">Assign Technician</SelectItem>
                  <SelectItem value="start">Start Repair Work</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Form fields based on actionType */}
          {actionType === 'reject' && (
            <div className="space-y-1">
              <Label htmlFor="comments">Rejection Comments</Label>
              <Input
                id="comments"
                placeholder="Reason for rejection..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          {actionType === 'assign' && (
            <div className="space-y-1">
              <Label>Assign Technician *</Label>
              <Select value={technicianId} onValueChange={setTechnicianId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select technician..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name || ''} ({emp.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {actionType === 'resolve' && (
            <div className="space-y-1">
              <Label htmlFor="notes">Resolution Notes</Label>
              <Input
                id="notes"
                placeholder="Details of repair, parts replaced..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          {actionType === 'start' && (
            <p className="text-sm text-muted-foreground">
              Transition the status to "In Progress". This indicates repair work has officially begun.
            </p>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} variant={actionType === 'reject' ? 'destructive' : 'default'}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Action
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
