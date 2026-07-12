import { useState, useEffect } from 'react';
import { assetsAPI, categoriesAPI, departmentsAPI } from '@/api/endpoints';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Settings, Info, RefreshCw, Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { ASSET_STATUS, ASSET_STATUS_LABELS } from '@/constants/roles';

export default function AlterAssetForm({ onSuccess, onCancel }) {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Tab 1: Specs Form
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [condition, setCondition] = useState('good');
  const [location, setLocation] = useState('');
  const [departmentId, setDepartmentId] = useState('none');
  const [isBookable, setIsBookable] = useState(false);
  const [warrantyMonths, setWarrantyMonths] = useState('');

  // Tab 2: Status Change
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');

  useEffect(() => {
    // Load lists
    assetsAPI.list({ limit: 100 }).then((res) => setAssets(res.data.items || [])).catch(console.error);
    categoriesAPI.list({ limit: 100 }).then((res) => setCategories(res.data.items || [])).catch(console.error);
    departmentsAPI.list({ limit: 100 }).then((res) => setDepartments(res.data.items || [])).catch(console.error);
  }, []);

  const handleAssetSelect = (assetId) => {
    setSelectedAssetId(assetId);
    const asset = assets.find((a) => a.id === assetId);
    setSelectedAsset(asset);
    
    if (asset) {
      setName(asset.asset_name);
      setCategoryId(asset.category_id);
      setSerialNumber(asset.serial_number || '');
      setManufacturer(asset.manufacturer || '');
      setModel(asset.model || '');
      setPurchaseDate(asset.purchase_date || '');
      setPurchaseCost(asset.purchase_cost || '');
      setCondition(asset.asset_condition || 'good');
      setLocation(asset.location || '');
      setDepartmentId(asset.department_id || 'none');
      setIsBookable(asset.is_bookable || false);
      setWarrantyMonths(asset.warranty_months || '');
      setNewStatus(asset.current_status);
      setStatusReason('');
    }
  };

  const handleUpdateSpecs = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;
    setSubmitLoading(true);

    const payload = {
      asset_name: name,
      category_id: categoryId,
      serial_number: serialNumber || null,
      manufacturer: manufacturer || null,
      model: model || null,
      purchase_date: purchaseDate || null,
      purchase_cost: purchaseCost ? parseFloat(purchaseCost) : null,
      asset_condition: condition,
      location: location || null,
      department_id: departmentId === 'none' ? null : departmentId,
      is_bookable: isBookable,
      warranty_months: warrantyMonths ? parseInt(warrantyMonths, 10) : null,
    };

    try {
      await assetsAPI.update(selectedAsset.id, payload);
      toast.success('Asset specifications updated successfully');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to update specifications:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleStatusChange = async (e) => {
    e.preventDefault();
    if (!selectedAsset || !newStatus) return;
    setSubmitLoading(true);

    try {
      await assetsAPI.changeStatus(selectedAsset.id, {
        new_status: newStatus,
        reason: statusReason || null,
      });
      toast.success(`Asset status updated to ${ASSET_STATUS_LABELS[newStatus]}`);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to change status:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Card className="border border-border/60 shadow-sm max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Alter Asset</CardTitle>
        <CardDescription>
          Select an asset to update its technical details, change lifecycle status, or retire it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1">
          <Label className="font-semibold text-sm">Select Asset</Label>
          <Select value={selectedAssetId} onValueChange={handleAssetSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Search or select an asset..." />
            </SelectTrigger>
            <SelectContent>
              {assets.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.asset_name} ({a.asset_tag} — {a.serial_number || 'No S/N'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedAsset && (
          <Tabs defaultValue="specs" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="specs" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Modify Specs
              </TabsTrigger>
              <TabsTrigger value="status" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Change Status
              </TabsTrigger>
            </TabsList>

            {/* Modify Specs Tab */}
            <TabsContent value="specs">
              <form onSubmit={handleUpdateSpecs} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="asset_name">Asset Name *</Label>
                    <Input
                      id="asset_name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={submitLoading}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Category *</Label>
                    <Select value={categoryId} onValueChange={setCategoryId} disabled={submitLoading}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.category_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input
                      id="manufacturer"
                      value={manufacturer}
                      onChange={(e) => setManufacturer(e.target.value)}
                      disabled={submitLoading}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      disabled={submitLoading}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="serial_number">Serial Number</Label>
                    <Input
                      id="serial_number"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      disabled={submitLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="purchase_date">Purchase Date</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      disabled={submitLoading}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="purchase_cost">Purchase Cost ($)</Label>
                    <Input
                      id="purchase_cost"
                      type="number"
                      step="0.01"
                      value={purchaseCost}
                      onChange={(e) => setPurchaseCost(e.target.value)}
                      disabled={submitLoading}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="warranty">Warranty (Months)</Label>
                    <Input
                      id="warranty"
                      type="number"
                      value={warrantyMonths}
                      onChange={(e) => setWarrantyMonths(e.target.value)}
                      disabled={submitLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label>Condition</Label>
                    <Select value={condition} onValueChange={setCondition} disabled={submitLoading}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      disabled={submitLoading}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Department</Label>
                    <Select value={departmentId} onValueChange={setDepartmentId} disabled={submitLoading}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (General Store)</SelectItem>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.department_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    id="is_bookable_alter"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={isBookable}
                    onChange={(e) => setIsBookable(e.target.checked)}
                    disabled={submitLoading}
                  />
                  <Label htmlFor="is_bookable_alter" className="cursor-pointer select-none">
                    Mark as bookable (Enable meeting room / desk bookings)
                  </Label>
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                  <Button type="button" variant="outline" onClick={onCancel} disabled={submitLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitLoading}>
                    {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Change Status Tab */}
            <TabsContent value="status">
              <form onSubmit={handleStatusChange} className="space-y-4">
                <div className="space-y-1">
                  <Label>Lifecycle Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus} disabled={submitLoading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ASSET_STATUS).map((status) => (
                        <SelectItem key={status} value={status}>
                          {ASSET_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="status_reason">Reason for Status Change</Label>
                  <Input
                    id="status_reason"
                    placeholder="Provide justification for auditing..."
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    disabled={submitLoading}
                  />
                </div>
                <div className="flex justify-end gap-2 border-t pt-4">
                  <Button type="button" variant="outline" onClick={onCancel} disabled={submitLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitLoading}>
                    {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Status
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
