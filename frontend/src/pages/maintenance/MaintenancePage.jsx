import { useState, useEffect } from 'react';
import { maintenanceAPI } from '@/api/endpoints';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { Plus, Wrench, Eye, ArrowRight } from 'lucide-react';
import RaiseMaintenanceDialog from './RaiseMaintenanceDialog';
import MaintenanceActionDialog from './MaintenanceActionDialog';

export default function MaintenancePage() {
  const { user } = useAuth();
  const { isEmployee, canManageMaintenanceKanban } = useRoleAccess();

  // Dialog states
  const [isRaiseOpen, setIsRaiseOpen] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // List states
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await maintenanceAPI.list({ limit: 100 });
      let items = res.data.items || [];
      if (isEmployee) {
        // Employees only see their own requests
        items = items.filter((r) => r.raised_by === user?.id);
      }
      setRequests(items);
    } catch (error) {
      console.error('Failed to fetch maintenance requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [isEmployee, user]);

  const openAction = (request) => {
    setSelectedRequest(request);
    setIsActionOpen(true);
  };

  // Columns for list view
  const columns = [
    { key: 'asset_tag', header: 'Tag', cellClassName: 'font-mono text-xs' },
    { key: 'asset_name', header: 'Asset Name', cellClassName: 'font-semibold' },
    { key: 'raiser_name', header: 'Raised By' },
    {
      key: 'priority',
      header: 'Priority',
      cell: (row) => <StatusBadge status={row.priority} />
    },
    {
      key: 'created_datetime',
      header: 'Date Raised',
      cell: (row) => row.created_datetime ? format(new Date(row.created_datetime), 'MMM dd, yyyy') : 'N/A'
    },
    {
      key: 'approval_status',
      header: 'Status',
      cell: (row) => <StatusBadge status={row.approval_status} />
    },
    {
      key: 'actions',
      header: 'Actions',
      cellClassName: 'text-right',
      cell: (row) => {
        const canAction = canManageMaintenanceKanban && row.approval_status !== 'resolved' && row.approval_status !== 'rejected';
        return canAction ? (
          <Button variant="ghost" size="sm" onClick={() => openAction(row)}>
            Update
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => openAction(row)}>
            <Eye className="h-4 w-4 mr-1" />
            Details
          </Button>
        );
      }
    }
  ];

  // Helper to filter requests by status for Kanban Board
  const getRequestsByStatus = (status) => {
    return requests.filter((r) => r.approval_status === status);
  };

  const boardColumns = [
    { id: 'pending', title: 'Pending Review', bg: 'bg-yellow-500/10 text-yellow-600 border-yellow-200' },
    { id: 'approved', title: 'Approved / Ready', bg: 'bg-blue-500/10 text-blue-600 border-blue-200' },
    { id: 'assigned', title: 'Assigned', bg: 'bg-indigo-500/10 text-indigo-600 border-indigo-200' },
    { id: 'in_progress', title: 'In Progress', bg: 'bg-purple-500/10 text-purple-600 border-purple-200' },
    { id: 'resolved', title: 'Resolved', bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Tickets"
        description="Raise repair requests, assign technicians, and track resolution lifecycles."
      >
        <Button onClick={() => setIsRaiseOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Raise Request
        </Button>
      </PageHeader>

      {canManageMaintenanceKanban ? (
        /* Kanban Board View for Admins / Asset Managers */
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {boardColumns.map((col) => {
            const colRequests = getRequestsByStatus(col.id);
            return (
              <div key={col.id} className="flex flex-col min-w-[250px] bg-muted/20 border rounded-lg p-3 h-[calc(100vh-14rem)]">
                <div className={`flex items-center justify-between p-2 mb-3 border rounded font-semibold text-xs uppercase tracking-wider ${col.bg}`}>
                  <span>{col.title}</span>
                  <span>{colRequests.length}</span>
                </div>
                
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {colRequests.map((req) => (
                    <Card
                      key={req.id}
                      className="border border-border/60 hover:shadow transition-shadow cursor-pointer bg-card"
                      onClick={() => openAction(req)}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-semibold text-sm truncate max-w-[130px]">{req.asset_name}</span>
                          <StatusBadge status={req.priority} />
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{req.issue_description}</p>
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1 border-t">
                          <span>{req.asset_tag}</span>
                          <span>{req.created_datetime ? format(new Date(req.created_datetime), 'MMM dd') : ''}</span>
                        </div>
                        {req.technician_name && (
                          <div className="text-[10px] bg-primary/5 text-primary rounded px-1.5 py-0.5 mt-1 truncate">
                            Tech: {req.technician_name}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {colRequests.length === 0 && (
                    <div className="h-24 flex items-center justify-center border border-dashed border-muted rounded-lg text-xs text-muted-foreground">
                      No tickets
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Standard List View for Employees / Department Heads */
        <Card>
          <CardContent className="pt-6">
            <DataTable
              columns={columns}
              data={requests}
              loading={loading}
              emptyTitle="No maintenance tickets found"
              emptyDescription="If you raise a repair request for your assets, they will appear here."
            />
          </CardContent>
        </Card>
      )}

      {/* Raise Dialog */}
      <RaiseMaintenanceDialog
        open={isRaiseOpen}
        onOpenChange={setIsRaiseOpen}
        onSuccess={fetchRequests}
      />

      {/* Action Dialog */}
      <MaintenanceActionDialog
        request={selectedRequest}
        open={isActionOpen}
        onOpenChange={setIsActionOpen}
        onSuccess={fetchRequests}
      />
    </div>
  );
}
