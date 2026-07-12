import { useState, useEffect } from 'react';
import { auditsAPI, assetsAPI, usersAPI, departmentsAPI } from '@/api/endpoints';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { format } from 'date-fns';
import { ClipboardCheck, Plus, CheckSquare, ChevronLeft, ShieldAlert, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function AuditsPage() {
  const { user } = useAuth();
  
  // View mode
  const [view, setView] = useState('list'); // 'list' | 'detail' | 'discrepancies'
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAddAssetsOpen, setIsAddAssetsOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Selected entities
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [cycleAssets, setCycleAssets] = useState([]);
  const [discrepancyReport, setDiscrepancyReport] = useState(null);

  // Form parameters
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  
  // New cycle form
  const [auditName, setAuditName] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('none');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Add asset to cycle form
  const [targetAssetIds, setTargetAssetIds] = useState([]);
  const [targetAuditorId, setTargetAuditorId] = useState('');

  // Verify asset form
  const [verificationStatus, setVerificationStatus] = useState('verified');
  const [remarks, setRemarks] = useState('');

  const fetchCycles = async () => {
    setLoading(true);
    try {
      const res = await auditsAPI.listCycles({ limit: 100 });
      setCycles(res.data.items || []);
    } catch (error) {
      console.error('Failed to fetch audit cycles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentsAndEmployees = async () => {
    try {
      const [deptRes, empRes] = await Promise.all([
        departmentsAPI.list({ limit: 100 }),
        usersAPI.list({ limit: 100 }),
      ]);
      setDepartments(deptRes.data.items || []);
      setEmployees(empRes.data.items || []);
    } catch (error) {
      console.error('Failed to fetch dropdown metadata:', error);
    }
  };

  useEffect(() => {
    fetchCycles();
    fetchDepartmentsAndEmployees();
  }, []);

  const openCreateDialog = () => {
    setAuditName('');
    setSelectedDeptId('none');
    setLocation('');
    setStartDate('');
    setEndDate('');
    setIsCreateOpen(true);
  };

  const handleCreateCycle = async (e) => {
    e.preventDefault();
    if (!auditName.trim() || !startDate || !endDate) {
      toast.error('Audit Name, Start Date, and End Date are required.');
      return;
    }

    setSubmitLoading(true);
    const payload = {
      audit_name: auditName,
      department_id: selectedDeptId === 'none' ? null : selectedDeptId,
      location: location || null,
      start_date: startDate,
      end_date: endDate,
    };

    try {
      await auditsAPI.createCycle(payload);
      toast.success('Audit cycle created successfully');
      setIsCreateOpen(false);
      fetchCycles();
    } catch (error) {
      console.error('Failed to create cycle:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleViewDetail = async (cycle) => {
    setSelectedCycle(cycle);
    setLoading(true);
    try {
      const res = await auditsAPI.listAssetsInCycle(cycle.id);
      setCycleAssets(res.data || []);
      setView('detail');
    } catch (error) {
      console.error('Failed to load cycle assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDiscrepancies = async (cycle) => {
    setSelectedCycle(cycle);
    setLoading(true);
    try {
      const res = await auditsAPI.getDiscrepancies(cycle.id);
      setDiscrepancyReport(res.data);
      setView('discrepancies');
    } catch (error) {
      console.error('Failed to load discrepancies report:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddAssets = async () => {
    if (!selectedCycle) return;
    setLoading(true);
    try {
      const res = await assetsAPI.list({ limit: 100 });
      // Filter out assets already added to this cycle
      const currentAssetIds = new Set(cycleAssets.map((a) => a.asset_id));
      const available = (res.data.items || []).filter(
        (a) => a.current_status !== 'retired' && a.current_status !== 'disposed' && !currentAssetIds.has(a.id)
      );
      setAvailableAssets(available);
      setTargetAssetIds([]);
      setTargetAuditorId('');
      setIsAddAssetsOpen(true);
    } catch (error) {
      console.error('Failed to load available assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAssets = async (e) => {
    e.preventDefault();
    if (targetAssetIds.length === 0 || !targetAuditorId) {
      toast.error('Please select assets and assign an auditor.');
      return;
    }

    setSubmitLoading(true);
    try {
      await auditsAPI.addAssets(selectedCycle.id, {
        asset_ids: targetAssetIds,
        auditor_id: targetAuditorId,
      });
      toast.success('Assets added to cycle successfully');
      setIsAddAssetsOpen(false);
      handleViewDetail(selectedCycle);
    } catch (error) {
      console.error('Failed to add assets:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const openVerifyDialog = (item) => {
    setSelectedItem(item);
    setVerificationStatus('verified');
    setRemarks('');
    setIsVerifyOpen(true);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSubmitLoading(true);

    try {
      await auditsAPI.verifyAsset(selectedCycle.id, {
        audit_asset_id: selectedItem.id,
        verification_status: verificationStatus,
        remarks: remarks || null,
      });
      toast.success('Asset verification logged');
      setIsVerifyOpen(false);
      handleViewDetail(selectedCycle);
    } catch (error) {
      console.error('Failed to verify asset:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCloseCycle = async () => {
    if (!selectedCycle) return;
    setSubmitLoading(true);
    try {
      await auditsAPI.closeCycle(selectedCycle.id);
      toast.success('Audit cycle locked and closed successfully');
      setIsCloseOpen(false);
      setView('list');
      fetchCycles();
    } catch (error) {
      console.error('Failed to close cycle:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Columns for main cycle list
  const cycleColumns = [
    { key: 'audit_name', header: 'Audit Name', cellClassName: 'font-semibold' },
    {
      key: 'department_name',
      header: 'Department / Scope',
      cell: (row) => row.department_name || row.location || <span className="text-muted-foreground italic">Global</span>
    },
    {
      key: 'start_date',
      header: 'Start Date',
      cell: (row) => row.start_date ? format(new Date(row.start_date), 'MMM dd, yyyy') : 'N/A'
    },
    {
      key: 'end_date',
      header: 'End Date',
      cell: (row) => row.end_date ? format(new Date(row.end_date), 'MMM dd, yyyy') : 'N/A'
    },
    {
      key: 'progress',
      header: 'Progress',
      cell: (row) => (
        <span className="text-xs font-mono font-semibold">
          {row.verified_count} / {row.total_assets} Checked
        </span>
      )
    },
    {
      key: 'audit_status',
      header: 'Status',
      cell: (row) => <StatusBadge status={row.audit_status} />
    },
    {
      key: 'actions',
      header: 'Actions',
      cellClassName: 'text-right',
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleViewDetail(row)}>
            <CheckSquare className="h-4 w-4 mr-1" />
            Checklist
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleViewDiscrepancies(row)}>
            <FileText className="h-4 w-4 mr-1" />
            Discrepancies
          </Button>
        </div>
      )
    }
  ];

  // Columns for cycle assets list
  const itemColumns = [
    { key: 'asset_tag', header: 'Tag', cellClassName: 'font-mono text-xs' },
    { key: 'asset_name', header: 'Asset Name', cellClassName: 'font-semibold' },
    { key: 'auditor_name', header: 'Auditor Assigned' },
    {
      key: 'verification_status',
      header: 'Status',
      cell: (row) => <StatusBadge status={row.verification_status || 'Pending'} />
    },
    {
      key: 'remarks',
      header: 'Remarks',
      cell: (row) => row.remarks || <span className="text-muted-foreground italic">-</span>
    },
    {
      key: 'actions',
      header: 'Actions',
      cellClassName: 'text-right',
      cell: (row) => {
        const canVerify = selectedCycle?.audit_status !== 'closed' && (row.auditor === user?.id || user?.role === 'admin');
        return canVerify ? (
          <Button size="sm" onClick={() => openVerifyDialog(row)}>
            Verify
          </Button>
        ) : null;
      }
    }
  ];

  if (view === 'detail') {
    const verifiedPercent = selectedCycle?.total_assets > 0 ? Math.round((selectedCycle.verified_count / selectedCycle.total_assets) * 100) : 0;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setView('list')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{selectedCycle.audit_name} Details</h2>
            <p className="text-xs text-muted-foreground">Scope: {selectedCycle.department_name || selectedCycle.location || 'Global'}</p>
          </div>
          <div className="ml-auto flex gap-2">
            {selectedCycle.audit_status !== 'closed' && (
              <>
                <Button onClick={openAddAssets}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Assets
                </Button>
                <Button variant="destructive" onClick={() => setIsCloseOpen(true)}>
                  Close & Lock Audit
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Progress Card */}
        <Card className="border border-border/60">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center text-sm font-semibold mb-2">
              <span>Verification Progress</span>
              <span>{verifiedPercent}% ({selectedCycle.verified_count} / {selectedCycle.total_assets} Verified)</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3.5 overflow-hidden border">
              <div
                className="bg-primary h-full transition-all duration-500"
                style={{ width: `${verifiedPercent}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Checklist */}
        <Card>
          <CardContent className="pt-6">
            <DataTable
              columns={itemColumns}
              data={cycleAssets}
              loading={loading}
              emptyTitle="No assets in this audit cycle"
              emptyDescription="Click 'Add Assets' to choose items to audit."
            />
          </CardContent>
        </Card>

        {/* Close confirmation */}
        <ConfirmDialog
          open={isCloseOpen}
          onOpenChange={setIsCloseOpen}
          title="Close and Lock Audit Cycle?"
          description="Closing this cycle locks all verification results. Missing items will be automatically updated to LOST in the database."
          confirmLabel="Close Cycle"
          loading={submitLoading}
          onConfirm={handleCloseCycle}
        />

        {/* Verify asset dialog */}
        <Dialog open={isVerifyOpen} onOpenChange={setIsVerifyOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Verify Asset</DialogTitle>
              <DialogDescription>
                Asset: <span className="font-semibold">{selectedItem?.asset_name}</span> ({selectedItem?.asset_tag})
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleVerify} className="space-y-4 py-2">
              <div className="space-y-1">
                <Label>Verification Status *</Label>
                <Select value={verificationStatus} onValueChange={setVerificationStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verified">Verified & In-Place</SelectItem>
                    <SelectItem value="missing">Missing / Unaccounted</SelectItem>
                    <SelectItem value="damaged">Damaged / Malfunctioning</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="remarks">Verification Remarks / Audit Notes</Label>
                <Input
                  id="remarks"
                  placeholder="e.g. Verified serial number, screen cracked"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  disabled={submitLoading}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsVerifyOpen(false)} disabled={submitLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitLoading}>
                  {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Verification
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Assets Dialog */}
        <Dialog open={isAddAssetsOpen} onOpenChange={setIsAddAssetsOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Assets to Audit Cycle</DialogTitle>
              <DialogDescription>Select the assets you wish to audit and assign an auditor.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddAssets} className="space-y-4 py-2">
              <div className="space-y-1">
                <Label>Select Assets (Select Multiple) *</Label>
                <div className="border rounded-md max-h-[200px] overflow-y-auto p-2 space-y-2 bg-muted/20">
                  {availableAssets.map((asset) => (
                    <div key={asset.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`check-${asset.id}`}
                        className="rounded h-4 w-4 border-gray-300 text-primary"
                        checked={targetAssetIds.includes(asset.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTargetAssetIds([...targetAssetIds, asset.id]);
                          } else {
                            setTargetAssetIds(targetAssetIds.filter((id) => id !== asset.id));
                          }
                        }}
                      />
                      <label htmlFor={`check-${asset.id}`} className="text-sm font-medium cursor-pointer">
                        {asset.asset_name} ({asset.asset_tag} — {asset.serial_number || 'No S/N'})
                      </label>
                    </div>
                  ))}
                  {availableAssets.length === 0 && (
                    <div className="text-center text-xs text-muted-foreground py-4">No available assets to add.</div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label>Assign Auditor User *</Label>
                <Select value={targetAuditorId} onValueChange={setTargetAuditorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select auditor..." />
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

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddAssetsOpen(false)} disabled={submitLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitLoading}>
                  {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add to Cycle
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (view === 'discrepancies') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setView('list')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Audit Discrepancies Report</h2>
            <p className="text-xs text-muted-foreground">{selectedCycle.audit_name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border border-border/60 shadow-sm bg-muted/20">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Total Audited</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{discrepancyReport?.total_assets || 0}</div>
            </CardContent>
          </Card>
          <Card className="border border-border/60 shadow-sm bg-emerald-500/5 text-emerald-700">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-semibold">Verified In-Place</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{discrepancyReport?.verified || 0}</div>
            </CardContent>
          </Card>
          <Card className="border border-border/60 shadow-sm bg-red-500/5 text-red-700">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-semibold">Missing Items</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{discrepancyReport?.missing || 0}</div>
            </CardContent>
          </Card>
          <Card className="border border-border/60 shadow-sm bg-amber-500/5 text-amber-700">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-semibold">Damaged Items</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{discrepancyReport?.damaged || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              Flagged Items Checklist
            </CardTitle>
            <CardDescription>Verified items with critical discrepancy tags (Missing or Damaged).</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <DataTable
              columns={[
                { key: 'asset_tag', header: 'Tag', cellClassName: 'font-mono text-xs' },
                { key: 'asset_name', header: 'Asset Name', cellClassName: 'font-semibold' },
                { key: 'auditor_name', header: 'Auditor' },
                {
                  key: 'verification_status',
                  header: 'Discrepancy',
                  cell: (row) => <StatusBadge status={row.verification_status} />
                },
                { key: 'remarks', header: 'Auditor Remarks' }
              ]}
              data={discrepancyReport?.flagged_items || []}
              loading={loading}
              emptyTitle="No discrepancies flagged"
              emptyDescription="All audited assets are verified in-place and good."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asset Audits"
        description="Verify physical inventory integrity and resolve missing or damaged assets cycles."
      >
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Audit Cycle
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={cycleColumns}
            data={cycles}
            loading={loading}
            emptyTitle="No audit cycles active"
            emptyDescription="Create your first cycle to launch auditor reviews."
          />
        </CardContent>
      </Card>

      {/* Create Cycle Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Audit Cycle</DialogTitle>
            <DialogDescription>Set up a scope and duration for asset verification.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCycle} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="auditName">Audit Cycle Name *</Label>
              <Input
                id="auditName"
                placeholder="e.g. Q3 Electronics Audit, Annual Office Inventory"
                value={auditName}
                onChange={(e) => setAuditName(e.target.value)}
                disabled={submitLoading}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Scope Department (Optional)</Label>
              <Select value={selectedDeptId} onValueChange={setSelectedDeptId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All (Global)</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.department_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="location">Scope Location (Optional)</Label>
              <Input
                id="location"
                placeholder="e.g. Office Building A"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={submitLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="start">Start Date *</Label>
                <Input
                  id="start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={submitLoading}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="end">End Date *</Label>
                <Input
                  id="end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={submitLoading}
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={submitLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitLoading}>
                {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Cycle
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
