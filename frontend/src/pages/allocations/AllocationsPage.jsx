import { useState, useEffect } from 'react';
import { allocationsAPI, transfersAPI } from '@/api/endpoints';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { Plus, RefreshCw, ArrowLeftRight, ClipboardList, CheckCircle2, XCircle } from 'lucide-react';
import AllocateAssetDialog from './AllocateAssetDialog';
import TransferAssetDialog from './TransferAssetDialog';
import ReturnAssetDialog from './ReturnAssetDialog';
import ApprovalDialog from './ApprovalDialog';
import { toast } from 'sonner';

export default function AllocationsPage() {
  const { user } = useAuth();
  const { isEmployee, canAllocateAsset, canApproveTransfer } = useRoleAccess();

  // Dialog open states
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);

  // Loading and list states
  const [allocations, setAllocations] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAllocations = async () => {
    if (isEmployee) return;
    try {
      const res = await allocationsAPI.list({ limit: 100 });
      setAllocations(res.data.items || []);
    } catch (error) {
      console.error('Failed to fetch allocations:', error);
    }
  };

  const fetchTransfers = async () => {
    if (isEmployee) return;
    try {
      const res = await transfersAPI.list({ limit: 100 });
      setTransfers(res.data.items || []);
    } catch (error) {
      console.error('Failed to fetch transfers:', error);
    }
  };

  const loadData = async () => {
    if (!user || isEmployee) return;
    setLoading(true);
    await Promise.all([fetchAllocations(), fetchTransfers()]);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, isEmployee]);

  const handleOpenApproval = (transfer) => {
    setSelectedTransfer(transfer);
    setIsApprovalOpen(true);
  };

  const handleApproveTransfer = async (comments) => {
    if (!selectedTransfer) return;
    setActionLoading(true);
    try {
      await transfersAPI.approve(selectedTransfer.id, { comments });
      toast.success('Transfer request approved');
      setIsApprovalOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to approve transfer:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectTransfer = async (comments) => {
    if (!selectedTransfer) return;
    setActionLoading(true);
    try {
      await transfersAPI.reject(selectedTransfer.id, { comments });
      toast.error('Transfer request rejected');
      setIsApprovalOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to reject transfer:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTransfer = async (transferId) => {
    setActionLoading(true);
    try {
      await transfersAPI.complete(transferId);
      toast.success('Transfer completed! Ownership updated.');
      loadData();
    } catch (error) {
      console.error('Failed to complete transfer:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const allocationColumns = [
    { key: 'asset_tag', header: 'Tag', cellClassName: 'font-mono text-xs' },
    { key: 'asset_name', header: 'Asset Name', cellClassName: 'font-semibold' },
    {
      key: 'assignee',
      header: 'Custodian / Holder',
      cell: (row) => row.employee_name || row.department_name || <span className="text-muted-foreground italic">General</span>
    },
    {
      key: 'allocated_date',
      header: 'Allocated On',
      cell: (row) => row.allocated_date ? format(new Date(row.allocated_date), 'MMM dd, yyyy') : 'N/A'
    },
    {
      key: 'expected_return_date',
      header: 'Expected Return',
      cell: (row) => row.expected_return_date ? format(new Date(row.expected_return_date), 'MMM dd, yyyy') : 'Indefinite'
    },
    {
      key: 'allocation_status',
      header: 'Status',
      cell: (row) => <StatusBadge status={row.allocation_status} />
    }
  ];

  const transferColumns = [
    { key: 'asset_tag', header: 'Tag', cellClassName: 'font-mono text-xs' },
    { key: 'asset_name', header: 'Asset Name', cellClassName: 'font-semibold' },
    { key: 'from_employee_name', header: 'From Custodian' },
    { key: 'to_employee_name', header: 'Requested Custodian' },
    {
      key: 'approval_status',
      header: 'Status',
      cell: (row) => <StatusBadge status={row.approval_status} />
    },
    {
      key: 'actions',
      header: 'Review / Handover',
      cellClassName: 'text-right',
      cell: (row) => {
        if (row.approval_status === 'pending') {
          return canApproveTransfer ? (
            <Button size="sm" onClick={() => handleOpenApproval(row)}>
              Review Request
            </Button>
          ) : (
            <span className="text-muted-foreground text-xs italic">Awaiting Approval</span>
          );
        }
        if (row.approval_status === 'approved') {
          return canAllocateAsset ? (
            <Button
              size="sm"
              variant="outline"
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              onClick={() => handleCompleteTransfer(row.id)}
            >
              Complete Handover
            </Button>
          ) : (
            <span className="text-muted-foreground text-xs italic">Awaiting Physical Custody Handover</span>
          );
        }
        return <span className="text-muted-foreground text-xs italic">-</span>;
      }
    }
  ];

  if (isEmployee) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Custody Transfers & Returns"
          description="Initiate custody transfer requests or declare returns for resources assigned to you."
        >
          <Button onClick={() => setIsTransferOpen(true)}>
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Request Custody Transfer
          </Button>
        </PageHeader>

        <Card className="max-w-md mx-auto mt-8 border-primary/20">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="p-3 bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-primary">
              <ClipboardList className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg">Manage Allocations via Assets</h3>
            <p className="text-sm text-muted-foreground">
              To check your current allocated assets, verify serial numbers, or see return dates, please browse the **Assets Directory** tab scoped to your account.
            </p>
          </CardContent>
        </Card>

        <TransferAssetDialog
          open={isTransferOpen}
          onOpenChange={setIsTransferOpen}
          onSuccess={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Allocations & Transfers"
        description="Oversee resource assignment, review transfer pipelines, and log check-ins."
      >
        {canAllocateAsset && (
          <Button onClick={() => setIsAllocateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Allocate Asset
          </Button>
        )}
        <Button variant="outline" onClick={() => setIsTransferOpen(true)}>
          <ArrowLeftRight className="h-4 w-4 mr-2" />
          Request Transfer
        </Button>
        {canAllocateAsset && (
          <Button variant="outline" onClick={() => setIsReturnOpen(true)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Return Asset
          </Button>
        )}
      </PageHeader>

      <Tabs defaultValue="active-allocations" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
          <TabsTrigger value="active-allocations">Active Allocations</TabsTrigger>
          <TabsTrigger value="transfers">Custody Transfers</TabsTrigger>
        </TabsList>

        <TabsContent value="active-allocations">
          <Card>
            <CardContent className="pt-6">
              <DataTable
                columns={allocationColumns}
                data={allocations}
                loading={loading}
                emptyTitle="No active allocations"
                emptyDescription="Allocate an available asset to start tracking custody."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers">
          <Card>
            <CardContent className="pt-6">
              <DataTable
                columns={transferColumns}
                data={transfers}
                loading={loading}
                emptyTitle="No custody transfer requests"
                emptyDescription="When employees request resource handovers, they will appear here."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Containers */}
      <AllocateAssetDialog
        open={isAllocateOpen}
        onOpenChange={setIsAllocateOpen}
        onSuccess={loadData}
      />

      <TransferAssetDialog
        open={isTransferOpen}
        onOpenChange={setIsTransferOpen}
        onSuccess={loadData}
      />

      <ReturnAssetDialog
        open={isReturnOpen}
        onOpenChange={setIsReturnOpen}
        onSuccess={loadData}
      />

      <ApprovalDialog
        open={isApprovalOpen}
        onOpenChange={setIsApprovalOpen}
        onApprove={handleApproveTransfer}
        onReject={handleRejectTransfer}
        loading={actionLoading}
      />
    </div>
  );
}
