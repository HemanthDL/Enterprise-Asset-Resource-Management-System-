import { useState, useEffect } from 'react';
import { departmentsAPI, usersAPI } from '@/api/endpoints';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Edit, Trash, Plus } from 'lucide-react';

export default function DepartmentTab() {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [parentDeptId, setParentDeptId] = useState('none');
  const [deptHeadId, setDeptHeadId] = useState('none');

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await departmentsAPI.list({ limit: 100 });
      // The API return shape is PaginatedResponse, so data.items
      setDepartments(res.data.items || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await usersAPI.list({ limit: 200 });
      setEmployees(res.data.items || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, []);

  const openCreateDialog = () => {
    setSelectedDept(null);
    setName('');
    setCode('');
    setDescription('');
    setParentDeptId('none');
    setDeptHeadId('none');
    setIsFormOpen(true);
  };

  const openEditDialog = (dept) => {
    setSelectedDept(dept);
    setName(dept.department_name);
    setCode(dept.department_code);
    setDescription(dept.description || '');
    setParentDeptId(dept.parent_department_id || 'none');
    setDeptHeadId(dept.department_head_id || 'none');
    setIsFormOpen(true);
  };

  const openDeactivateDialog = (dept) => {
    setSelectedDept(dept);
    setIsConfirmOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error('Department name and code are required.');
      return;
    }

    setSubmitLoading(true);
    const payload = {
      department_name: name,
      department_code: code,
      description: description || null,
      parent_department_id: parentDeptId === 'none' ? null : parentDeptId,
      department_head_id: deptHeadId === 'none' ? null : deptHeadId,
    };

    try {
      if (selectedDept) {
        await departmentsAPI.update(selectedDept.id, payload);
        toast.success('Department updated successfully');
      } else {
        await departmentsAPI.create(payload);
        toast.success('Department created successfully');
      }
      setIsFormOpen(false);
      fetchDepartments();
    } catch (error) {
      console.error('Failed to save department:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedDept) return;
    setSubmitLoading(true);
    try {
      await departmentsAPI.deactivate(selectedDept.id);
      toast.success('Department deactivated successfully');
      setIsConfirmOpen(false);
      fetchDepartments();
    } catch (error) {
      console.error('Failed to deactivate department:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    { key: 'department_code', header: 'Code', cellClassName: 'font-mono' },
    { key: 'department_name', header: 'Name', cellClassName: 'font-semibold' },
    {
      key: 'department_head_name',
      header: 'Head of Department',
      cell: (row) => row.department_head_name || <span className="text-muted-foreground italic">None Assigned</span>
    },
    {
      key: 'parent_department_id',
      header: 'Parent Department',
      cell: (row) => {
        if (!row.parent_department_id) return <span className="text-muted-foreground italic">None</span>;
        const parent = departments.find((d) => d.id === row.parent_department_id);
        return parent ? parent.department_name : 'Unknown';
      }
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
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(row)}>
            <Edit className="h-4 w-4" />
          </Button>
          {row.status === 'active' && (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => openDeactivateDialog(row)}
            >
              <Trash className="h-4 w-4" />
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
        data={departments}
        searchKey="department_name"
        searchPlaceholder="Search departments by name..."
        loading={loading}
        emptyTitle="No departments found"
        emptyDescription="Get started by creating your first department."
        actions={
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create Department
          </Button>
        }
      />

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedDept ? 'Edit Department' : 'Create Department'}
            </DialogTitle>
            <DialogDescription>
              Provide the department details below. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="code">Department Code</Label>
              <Input
                id="code"
                placeholder="e.g. ENG, HR, MKT"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={submitLoading}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="name">Department Name</Label>
              <Input
                id="name"
                placeholder="e.g. Engineering, Human Resources"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitLoading}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Brief description of the department"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitLoading}
              />
            </div>
            
            <div className="space-y-1">
              <Label>Parent Department (Optional)</Label>
              <Select value={parentDeptId} onValueChange={setParentDeptId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {departments
                    .filter((d) => !selectedDept || d.id !== selectedDept.id)
                    .map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.department_name} ({d.department_code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Department Head (Optional)</Label>
              <Select value={deptHeadId} onValueChange={setDeptHeadId}>
                <SelectTrigger>
                  <SelectValue placeholder="Assign a head of department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name || ''} ({emp.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
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

      {/* Deactivate Confirm */}
      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Deactivate Department?"
        description={`Are you sure you want to deactivate ${selectedDept?.department_name}? Users and assets under this department may need reassignment.`}
        confirmLabel="Deactivate"
        loading={submitLoading}
        onConfirm={handleDeactivate}
      />
    </div>
  );
}
