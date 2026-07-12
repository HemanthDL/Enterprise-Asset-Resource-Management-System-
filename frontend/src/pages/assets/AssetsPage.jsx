import { useState, useEffect } from 'react';
import { assetsAPI, categoriesAPI } from '@/api/endpoints';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, Settings, Eye, Info } from 'lucide-react';
import RegisterAssetForm from './RegisterAssetForm';
import AlterAssetForm from './AlterAssetForm';
import AssetDetailDialog from './AssetDetailDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AssetsPage() {
  const { user } = useAuth();
  const { isEmployee, isDepartmentHead, canRegisterAsset, canAlterAsset } = useRoleAccess();
  
  // View states
  const [view, setView] = useState('list'); // 'list' | 'register' | 'alter'
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Detail dialog
  const [detailAsset, setDetailAsset] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params = {};
      
      // If Department Head, filter by their department
      if (isDepartmentHead && user?.department_id) {
        params.department_id = user.department_id;
      }
      
      const res = await assetsAPI.list(params);
      let items = res.data.items || [];
      
      // If Employee, filter to show only assets allocated to them
      if (isEmployee) {
        items = items.filter((item) => item.current_holder === user?.id);
      }
      
      setAssets(items);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    categoriesAPI.list({ limit: 100 }).then((res) => setCategories(res.data.items || [])).catch(console.error);
  }, [view, isEmployee, isDepartmentHead, user]);

  const openDetails = (asset) => {
    setDetailAsset(asset);
    setIsDetailOpen(true);
  };

  // Filter assets locally based on category, status and general search input
  const filteredAssets = assets.filter((asset) => {
    const matchesCat = selectedCat === 'all' || asset.category_id === selectedCat;
    const matchesStatus = selectedStatus === 'all' || asset.current_status === selectedStatus;
    const matchesSearch =
      !search ||
      asset.asset_name.toLowerCase().includes(search.toLowerCase()) ||
      asset.asset_tag.toLowerCase().includes(search.toLowerCase()) ||
      (asset.serial_number && asset.serial_number.toLowerCase().includes(search.toLowerCase()));

    return matchesCat && matchesStatus && matchesSearch;
  });

  const columns = [
    { key: 'asset_tag', header: 'Tag', cellClassName: 'font-mono text-xs' },
    { key: 'asset_name', header: 'Asset Name', cellClassName: 'font-semibold' },
    { key: 'category_name', header: 'Category' },
    {
      key: 'asset_condition',
      header: 'Condition',
      cell: (row) => <span className="capitalize">{row.asset_condition || 'Good'}</span>
    },
    {
      key: 'current_status',
      header: 'Status',
      cell: (row) => <StatusBadge status={row.current_status} />
    },
    {
      key: 'current_holder_name',
      header: 'Custodian / Holder',
      cell: (row) => row.current_holder_name || <span className="text-muted-foreground italic">In Storage</span>
    },
    {
      key: 'actions',
      header: 'Details',
      cellClassName: 'text-right',
      cell: (row) => (
        <Button variant="ghost" size="sm" onClick={() => openDetails(row)}>
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      )
    }
  ];

  if (view === 'register') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Register New Asset"
          description="Create a unique asset record with automated tagging."
        />
        <RegisterAssetForm
          onSuccess={() => setView('list')}
          onCancel={() => setView('list')}
        />
      </div>
    );
  }

  if (view === 'alter') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Alter Existing Asset"
          description="Modify specifications, update lifecycle, or dispose of assets."
        />
        <AlterAssetForm
          onSuccess={() => setView('list')}
          onCancel={() => setView('list')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assets Directory"
        description={
          isEmployee
            ? "Your allocated resources and physical assets."
            : "Central database of all enterprise resources, equipment, and shared spaces."
        }
      >
        {canRegisterAsset && (
          <Button onClick={() => setView('register')}>
            <Plus className="h-4 w-4 mr-2" />
            Register Asset
          </Button>
        )}
        {canAlterAsset && (
          <Button variant="outline" onClick={() => setView('alter')}>
            <Settings className="h-4 w-4 mr-2" />
            Alter Asset
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="space-y-1">
              <Label>Category Filter</Label>
              <Select value={selectedCat} onValueChange={setSelectedCat}>
                <SelectTrigger>
                  <SelectValue />
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
              <Label>Status Filter</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
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
            <div className="space-y-1">
              <Label>General Search</Label>
              <input
                type="text"
                placeholder="Search name, tag, serial number..."
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredAssets}
            loading={loading}
            emptyTitle="No assets found"
            emptyDescription="Ensure filters are correct or register your first asset."
          />
        </CardContent>
      </Card>

      <AssetDetailDialog
        asset={detailAsset}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  );
}
