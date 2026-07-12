import { useState } from 'react';
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
import { Loader2 } from 'lucide-react';

export default function ApprovalDialog({ open, onOpenChange, onApprove, onReject, loading }) {
  const [comments, setComments] = useState('');

  const handleApprove = () => {
    onApprove(comments);
  };

  const handleReject = () => {
    onReject(comments);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Review Transfer Request</DialogTitle>
          <DialogDescription>
            Provide any review comments or notes before approving or rejecting this request.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="comments">Approver Comments (Optional)</Label>
            <Input
              id="comments"
              placeholder="e.g. Approved, asset reassigned for project Q3"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="destructive"
            onClick={handleReject}
            disabled={loading}
          >
            Reject Request
          </Button>
          <Button
            type="button"
            onClick={handleApprove}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Approve Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
