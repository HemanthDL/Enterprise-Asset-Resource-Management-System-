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
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { CONDITION } from '@/constants/roles';

export default function RegisterAssetForm({ onSuccess, onCancel }) {
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form values
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [condition, setCondition] = useState('new');
  const [location, setLocation] = useState('');
  const [departmentId, setDepartmentId] = useState('none');
  const [isBookable, setIsBookable] = useState(false);
  const [warrantyMonths, setWarrantyMonths] = useState('');

  useEffect(() => {
    // Load categories & departments for dropdowns
    categoriesAPI.list({ limit: 100 }).then((res) => setCategories(res.data.items || [])).catch(console.error);
    departmentsAPI.list({ limit: 100 }).then((res) => setDepartments(res.data.items || [])).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Asset Name is required.');
      return;
    }
    if (!categoryId) {
      toast.error('Please select a category.');
      return;
    }

    setLoading(true);
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
      const res = await assetsAPI.create(payload);
      toast.success(`Asset created successfully! Tag: ${res.data.asset_tag}`);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to create asset:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-border/60 shadow-sm max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Register Asset</CardTitle>
        <CardDescription>
          Enter the technical specifications, purchase metadata, and initial custody setup below.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="asset_name">Asset Name *</Label>
              <Input
                id="asset_name"
                placeholder="e.g. MacBook Pro M3"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select asset category" />
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
                placeholder="Apple, Dell, Herman Miller"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                placeholder="A2918, Latitude 7440"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="serial_number">Serial Number</Label>
              <Input
                id="serial_number"
                placeholder="Unique identifier / S/N"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                disabled={loading}
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
                disabled={loading}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="purchase_cost">Purchase Cost ($)</Label>
              <Input
                id="purchase_cost"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="warranty">Warranty (Months)</Label>
              <Input
                id="warranty"
                type="number"
                placeholder="36"
                value={warrantyMonths}
                onChange={(e) => setWarrantyMonths(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Condition</Label>
              <Select value={condition} onValueChange={setCondition} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select initial condition" />
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
                placeholder="Building A, Room 302"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1">
              <Label>Department</Label>
              <Select value={departmentId} onValueChange={setDepartmentId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
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
              id="is_bookable"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={isBookable}
              onChange={(e) => setIsBookable(e.target.checked)}
              disabled={loading}
            />
            <Label htmlFor="is_bookable" className="cursor-pointer select-none">
              Mark as bookable (Enable meeting room / desk bookings)
            </Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Register Asset
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
