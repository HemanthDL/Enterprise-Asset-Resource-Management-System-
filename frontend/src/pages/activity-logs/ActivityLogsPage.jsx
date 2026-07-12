import { useState, useEffect } from 'react';
import { activityLogsAPI } from '@/api/endpoints';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await activityLogsAPI.list({ limit: 100 });
      setLogs(res.data.items || []);
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns = [
    {
      key: 'created_datetime',
      header: 'Timestamp',
      cell: (row) => row.created_datetime ? format(new Date(row.created_datetime), 'MMM dd, yyyy hh:mm:ss a') : 'N/A'
    },
    {
      key: 'user_name',
      header: 'Performed By',
      cellClassName: 'font-semibold',
      cell: (row) => row.user_name || <span className="text-muted-foreground italic">System</span>
    },
    {
      key: 'module',
      header: 'Module',
      cellClassName: 'font-mono text-xs uppercase'
    },
    {
      key: 'action',
      header: 'Action',
      cellClassName: 'font-mono text-xs uppercase'
    },
    {
      key: 'record_id',
      header: 'Record ID',
      cellClassName: 'font-mono text-[10px] text-muted-foreground'
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security & Activity Logs"
        description="Audit trace and historic logs of all actions performed across departments."
      >
        <Button variant="outline" size="sm" onClick={fetchLogs}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={logs}
            searchKey="module"
            searchPlaceholder="Search logs by module name..."
            loading={loading}
            emptyTitle="No activity logs found"
            emptyDescription="Security and database actions will automatically populate here."
          />
        </CardContent>
      </Card>
    </div>
  );
}
