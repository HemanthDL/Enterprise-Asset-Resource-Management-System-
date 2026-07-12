import { useState, useEffect } from 'react';
import { assetsAPI, categoriesAPI } from '@/api/endpoints';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// Recharts imports removed to use native CSS/SVG charts.
import { FileDown, FileSpreadsheet, BarChart3, PieChartIcon } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'sonner';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

export default function ReportsPage() {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    const loadReportData = async () => {
      setLoading(true);
      try {
        const [assetRes, catRes] = await Promise.all([
          assetsAPI.list({ limit: 100 }),
          categoriesAPI.list({ limit: 100 }),
        ]);
        setAssets(assetRes.data.items || []);
        setCategories(catRes.data.items || []);
      } catch (error) {
        console.error('Failed to load reports data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadReportData();
  }, []);

  // Filtered assets for data table
  const filteredAssets = assets.filter((asset) => {
    const matchesCat = selectedCat === 'all' || asset.category_id === selectedCat;
    const matchesStatus = selectedStatus === 'all' || asset.current_status === selectedStatus;
    return matchesCat && matchesStatus;
  });

  // Calculate stats
  const totalAssets = assets.length;
  const allocatedCount = assets.filter((a) => a.current_status === 'allocated').length;
  const availableCount = assets.filter((a) => a.current_status === 'available').length;
  const maintenanceCount = assets.filter((a) => a.current_status === 'under_maintenance').length;
  const goodConditionCount = assets.filter((a) => ['new', 'good', 'fair'].includes(a.asset_condition?.toLowerCase())).length;

  const utilizationRate = totalAssets > 0 ? Math.round((allocatedCount / totalAssets) * 100) : 0;
  const healthyRate = totalAssets > 0 ? Math.round((goodConditionCount / totalAssets) * 100) : 0;

  // Recharts data format: count by category
  const categoryData = categories.map((cat) => {
    const count = assets.filter((a) => a.category_id === cat.id).length;
    return {
      name: cat.category_name,
      Count: count,
    };
  }).filter((c) => c.Count > 0);

  // Recharts data format: count by condition
  const conditionCounts = assets.reduce((acc, curr) => {
    const cond = curr.asset_condition || 'good';
    acc[cond] = (acc[cond] || 0) + 1;
    return acc;
  }, {});

  const conditionData = Object.entries(conditionCounts).map(([name, value]) => ({
    name: name.toUpperCase(),
    value,
  }));

  // PDF Export
  const exportPDF = () => {
    if (filteredAssets.length === 0) {
      toast.error('No asset data to export');
      return;
    }
    const doc = new jsPDF();
    doc.setFont('Helvetica', 'bold');
    doc.text('AssetFlow Enterprise Asset Inventory Report', 14, 15);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    const headers = [['Asset Tag', 'Asset Name', 'Category', 'Condition', 'Status', 'Custodian']];
    const tableData = filteredAssets.map((a) => [
      a.asset_tag,
      a.asset_name,
      a.category_name || 'N/A',
      a.asset_condition || 'Good',
      a.current_status,
      a.current_holder_name || 'In Storage',
    ]);

    doc.autoTable({
      head: headers,
      body: tableData,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8 },
    });
    doc.save('assetflow-report.pdf');
    toast.success('Report PDF downloaded successfully');
  };

  // Excel/CSV Export
  const exportExcel = () => {
    if (filteredAssets.length === 0) {
      toast.error('No asset data to export');
      return;
    }
    const headers = ['Asset Tag', 'Asset Name', 'Category', 'Condition', 'Status', 'Custodian', 'Serial Number', 'Location', 'Purchase Date', 'Purchase Cost'];
    const rows = filteredAssets.map((a) => [
      `"${(a.asset_tag || '').replace(/"/g, '""')}"`,
      `"${(a.asset_name || '').replace(/"/g, '""')}"`,
      `"${(a.category_name || 'N/A').replace(/"/g, '""')}"`,
      a.asset_condition || 'Good',
      a.current_status,
      `"${(a.current_holder_name || 'In Storage').replace(/"/g, '""')}"`,
      `"${(a.serial_number || 'N/A').replace(/"/g, '""')}"`,
      `"${(a.location || 'N/A').replace(/"/g, '""')}"`,
      a.purchase_date || 'N/A',
      a.purchase_cost || 'N/A',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'assetflow-inventory.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Sheet exported successfully');
  };

  const columns = [
    { key: 'asset_tag', header: 'Tag', cellClassName: 'font-mono text-xs' },
    { key: 'asset_name', header: 'Asset Name', cellClassName: 'font-semibold' },
    { key: 'category_name', header: 'Category' },
    {
      key: 'asset_condition',
      header: 'Condition',
      cell: (row) => <span className="capitalize">{row.asset_condition}</span>
    },
    {
      key: 'current_status',
      header: 'Status',
      cell: (row) => <StatusBadge status={row.current_status} />
    },
    {
      key: 'current_holder_name',
      header: 'Custodian',
      cell: (row) => row.current_holder_name || <span className="text-muted-foreground italic">In Storage</span>
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytical Reports"
        description="Monitor physical inventory conditions, audit cycles utilization rates, and generate data spreadsheets."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Overall Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{utilizationRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">{allocatedCount} of {totalAssets} assets assigned</p>
          </CardContent>
        </Card>
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Inventory Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{healthyRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Assets in good/fair condition</p>
          </CardContent>
        </Card>
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Idle Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{availableCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Available items in general storage</p>
          </CardContent>
        </Card>
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">In Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{maintenanceCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Items currently being repaired</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown bar chart */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2 pb-4 border-b">
            <BarChart3 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Asset Category Distribution</CardTitle>
              <CardDescription>Quantities grouped by registration categories</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">Loading chart...</div>
            ) : categoryData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">No data to display</div>
            ) : (
              <div className="h-[250px] flex items-end justify-between gap-4 pt-4 px-2">
                {categoryData.map((item) => {
                  const maxVal = Math.max(...categoryData.map((c) => c.Count), 1);
                  const heightPercent = (item.Count / maxVal) * 100;
                  return (
                    <div key={item.name} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      <div className="relative w-full flex justify-center items-end h-full">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-1 rounded shadow pointer-events-none z-10">
                          {item.Count} Assets
                        </div>
                        {/* Bar */}
                        <div
                          className="w-full max-w-[36px] bg-primary rounded-t-md transition-all duration-300 hover:opacity-85"
                          style={{ height: `${heightPercent}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate w-full text-center" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Condition Distribution donut chart */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2 pb-4 border-b">
            <PieChartIcon className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Asset Condition Breakdown</CardTitle>
              <CardDescription>Physical condition states of registered units</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">Loading chart...</div>
            ) : conditionData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">No data to display</div>
            ) : (
              (() => {
                const total = conditionData.reduce((acc, curr) => acc + curr.value, 0);
                let accumulatedPercent = 0;
                const gradientParts = conditionData.map((entry, idx) => {
                  const start = accumulatedPercent;
                  const percent = total > 0 ? (entry.value / total) * 100 : 0;
                  accumulatedPercent += percent;
                  return `${COLORS[idx % COLORS.length]} ${start}% ${accumulatedPercent}%`;
                });
                const backgroundStyle = `conic-gradient(${gradientParts.join(', ')})`;
                
                return (
                  <div className="h-[250px] w-full flex items-center justify-around gap-6">
                    <div className="relative w-36 h-36 rounded-full flex items-center justify-center border shadow-sm" style={{ background: backgroundStyle }}>
                      {/* Center cutout for donut style */}
                      <div className="w-24 h-24 rounded-full bg-card flex flex-col items-center justify-center shadow-inner">
                        <span className="text-xl font-bold">{total}</span>
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Total Units</span>
                      </div>
                    </div>
                    <div className="flex-1 max-w-[200px] space-y-2">
                      {conditionData.map((entry, idx) => (
                        <div key={entry.name} className="flex items-center gap-2 text-xs">
                          <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                          <span className="font-medium truncate flex-1">{entry.name}</span>
                          <span className="font-semibold font-mono text-muted-foreground">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()
            )}
          </CardContent>
        </Card>
      </div>

      {/* Export & Data Sheets */}
      <Card>
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Inventory Export Sheet</CardTitle>
              <CardDescription>Apply filters to segment inventory and generate spreadsheets or PDFs.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={exportPDF}>
                <FileDown className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" onClick={exportExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="space-y-1">
              <Label>Category Segment</Label>
              <Select value={selectedCat} onValueChange={setSelectedCat}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status Segment</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="allocated">Allocated</SelectItem>
                  <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="disposed">Disposed</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredAssets}
            loading={loading}
            emptyTitle="No records matched filters"
            emptyDescription="Adjust your segment filters to inspect other resources."
          />
        </CardContent>
      </Card>
    </div>
  );
}
