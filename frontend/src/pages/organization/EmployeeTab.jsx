import { useState, useEffect } from 'react';
import { usersAPI, departmentsAPI } from '@/api/endpoints';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ShieldAlert, UserX, Building2 } from 'lucide-react';
import { ROLES, ROLE_LABELS } from '@/constants/roles';

export default function EmployeeTab() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [isPromoteOpen, setIsPromoteOpen] = useState(false);
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form values
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.list({ limit: 100 });
      setEmployees(res.data.items || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await departmentsAPI.list({ limit: 100 });
      setDepartments(res.data.items || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  const openPromoteDialog = (emp) => {
    setSelectedEmp(emp);
    setSelectedRole(emp.role);
    setIsPromoteOpen(true);
  };

  const openDeptDialog = (emp) => {
    setSelectedEmp(emp);
    setSelectedDeptId(emp.department_id || 'none');
    setIsDeptOpen(true);
  };

  const openDeactivateDialog = (emp) => {
    setSelectedEmp(emp);
    setIsDeactivateOpen(true);
  };

  const handlePromote = async (e) => {
    e.preventDefault();
    if (!selectedEmp || !selectedRole) return;
    setSubmitLoading(true);
    try {
      await usersAPI.promote(selectedEmp.id, { role: selectedRole });
      toast.success(`${selectedEmp.first_name}'s role updated to ${ROLE_LABELS[selectedRole]}`);
      setIsPromoteOpen(false);
      fetchEmployees();
    } catch (error) {
      console.error('Failed to promote user:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeptUpdate = async (e) => {
    e.preventDefault();
    if (!selectedEmp) return;
    setSubmitLoading(true);
    try {
      const deptId = selectedDeptId === 'none' ? null : selectedDeptId;
      await usersAPI.update(selectedEmp.id, {
        first_name: selectedEmp.first_name,
        last_name: selectedEmp.last_name,
        phone: selectedEmp.phone,
        department_id: deptId
      });
      toast.success('Department assigned successfully');
      setIsDeptOpen(false);
      fetchEmployees();
    } catch (error) {
      console.error('Failed to update employee department:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedEmp) return;
    setSubmitLoading(true);
    try {
      await usersAPI.deactivate(selectedEmp.id);
      toast.success('Employee account deactivated');
      setIsDeactivateOpen(false);
      fetchEmployees();
    } catch (error) {
      console.error('Failed to deactivate employee:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      cellClassName: 'font-semibold',
      cell: (row) => `${row.first_name} ${row.last_name || ''}`
    },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      cell: (row) => <span className="capitalize font-medium">{ROLE_LABELS[row.role] || row.role}</span>
    },
    {
      key: 'department_name',
      header: 'Department',
      cell: (row) => row.department_name || <span className="text-muted-foreground italic">Unassigned</span>
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      key: 'actions',
      header: 'Actions',
      cellClassName: 'text-right',
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            title="Update Department"
            onClick={() => openDeptDialog(row)}
          >
            <Building2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Promote / Change Role"
            onClick={() => openPromoteDialog(row)}
          >
            <ShieldAlert className="h-4 w-4" />
          </Button>
          {row.status === 'active' && row.role !== ROLES.ADMIN && (
            <Button
              variant="ghost"
              size="icon"
              title="Deactivate Account"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => openDeactivateDialog(row)}
            >
              <UserX className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={employees}
        searchKey="email"
        searchPlaceholder="Search employees by email..."
        loading={loading}
        emptyTitle="No employees found"
        emptyDescription="Employees who sign up will appear here."
      />

      {/* Role Promotion Dialog */}
      <Dialog open={isPromoteOpen} onOpenChange={setIsPromoteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Employee Role</DialogTitle>
            <DialogDescription>
              Assign a new administrative or management role to {selectedEmp?.first_name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePromote} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Select Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ROLES.EMPLOYEE}>Employee</SelectItem>
                  <SelectItem value={ROLES.DEPARTMENT_HEAD}>Department Head</SelectItem>
                  <SelectItem value={ROLES.ASSET_MANAGER}>Asset Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPromoteOpen(false)}
                disabled={submitLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitLoading}>
                {submitLoading && (
                  <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Department Assignment Dialog */}
      <Dialog open={isDeptOpen} onOpenChange={setIsDeptOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Department</DialogTitle>
            <DialogDescription>
              Assign {selectedEmp?.first_name} to a department for routing approvals.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDeptUpdate} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Select Department</Label>
              <Select value={selectedDeptId} onValueChange={setSelectedDeptId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Unassigned)</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.department_name} ({d.department_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeptOpen(false)}
                disabled={submitLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitLoading}>
                {submitLoading && (
                  <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivate Dialog */}
      <ConfirmDialog
        open={isDeactivateOpen}
        onOpenChange={setIsDeactivateOpen}
        title="Deactivate Account?"
        description={`Are you sure you want to deactivate ${selectedEmp?.first_name}'s account? They will lose access to AssetFlow.`}
        confirmLabel="Deactivate"
        loading={submitLoading}
        onConfirm={handleDeactivate}
      />
    </div>
  );
}
