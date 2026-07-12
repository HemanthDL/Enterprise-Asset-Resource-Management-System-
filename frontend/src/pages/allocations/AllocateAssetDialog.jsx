import { useState, useEffect } from 'react';
import { allocationsAPI, assetsAPI, usersAPI, departmentsAPI } from '@/api/endpoints';
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

export default function AllocateAssetDialog({ open, onOpenChange, onSuccess }) {
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form values
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [assigneeType, setAssigneeType] = useState('employee'); // 'employee' | 'department'
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');

  useEffect(() => {
    if (open) {
      // Fetch available assets
      assetsAPI.list({ limit: 100 }).then((res) => {
        const available = (res.data.items || []).filter(
          (a) => a.current_status?.toLowerCase() === 'available'
        );
        setAssets(available);
      }).catch(console.error);

      // Fetch employees & departments
      usersAPI.list({ limit: 100 }).then((res) => setEmployees(res.data.items || [])).catch(console.error);
      departmentsAPI.list({ limit: 100 }).then((res) => setDepartments(res.data.items || [])).catch(console.error);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssetId) {
      toast.error('Please select an asset to allocate.');
      return;
    }
    if (assigneeType === 'employee' && !selectedEmployeeId) {
      toast.error('Please select an employee.');
      return;
    }
    if (assigneeType === 'department' && !selectedDeptId) {
      toast.error('Please select a department.');
      return;
    }

    setLoading(true);
    const payload = {
      asset_id: selectedAssetId,
      employee_id: assigneeType === 'employee' ? selectedEmployeeId : null,
      department_id: assigneeType === 'department' ? selectedDeptId : null,
      expected_return_date: expectedReturnDate ? new Date(expectedReturnDate).toISOString() : null,
    };

    try {
      await allocationsAPI.allocate(payload);
      toast.success('Asset allocated successfully');
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to allocate asset:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Allocate Asset</DialogTitle>
          <DialogDescription>
            Assign an available physical asset to an individual employee or department.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Select Asset *</Label>
            <Select value={selectedAssetId} onValueChange={setSelectedAssetId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Search or select available asset..." />
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
            <Label>Assignee Type *</Label>
            <Select value={assigneeType} onValueChange={setAssigneeType} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Individual Employee</SelectItem>
                <SelectItem value="department">Department-wide</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {assigneeType === 'employee' ? (
            <div className="space-y-1">
              <Label>Select Employee *</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select custodian..." />
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
          ) : (
            <div className="space-y-1">
              <Label>Select Department *</Label>
              <Select value={selectedDeptId} onValueChange={setSelectedDeptId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department..." />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.department_name} ({d.department_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="expected_return">Expected Return Date (Optional)</Label>
            <Input
              id="expected_return"
              type="date"
              value={expectedReturnDate}
              onChange={(e) => setExpectedReturnDate(e.target.value)}
              disabled={loading}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Allocate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
