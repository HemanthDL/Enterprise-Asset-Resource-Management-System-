import { useState, useEffect } from 'react';
import { categoriesAPI } from '@/api/endpoints';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
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
import { toast } from 'sonner';
import { Edit, Plus } from 'lucide-react';

export default function CategoryTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await categoriesAPI.list({ limit: 100 });
      setCategories(res.data.items || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateDialog = () => {
    setSelectedCategory(null);
    setName('');
    setDescription('');
    setIcon('');
    setIsFormOpen(true);
  };

  const openEditDialog = (cat) => {
    setSelectedCategory(cat);
    setName(cat.category_name);
    setDescription(cat.description || '');
    setIcon(cat.icon || '');
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category name is required.');
      return;
    }

    setSubmitLoading(true);
    const payload = {
      category_name: name,
      description: description || null,
      icon: icon || null,
    };

    try {
      if (selectedCategory) {
        await categoriesAPI.update(selectedCategory.id, payload);
        toast.success('Category updated successfully');
      } else {
        await categoriesAPI.create(payload);
        toast.success('Category created successfully');
      }
      setIsFormOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    { key: 'category_name', header: 'Category Name', cellClassName: 'font-semibold' },
    {
      key: 'description',
      header: 'Description',
      cell: (row) => row.description || <span className="text-muted-foreground italic">No description</span>
    },
    {
      key: 'icon',
      header: 'Icon Name',
      cell: (row) => row.icon ? <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{row.icon}</code> : <span className="text-muted-foreground italic">None</span>
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
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={categories}
        searchKey="category_name"
        searchPlaceholder="Search categories by name..."
        loading={loading}
        emptyTitle="No categories found"
        emptyDescription="Create your first category to group assets."
        actions={
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create Category
          </Button>
        }
      />

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
            <DialogDescription>
              Provide the asset category details. Click save when complete.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                placeholder="e.g. Laptops, Office Chairs, Sedans"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitLoading}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Brief description of category"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitLoading}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="icon">Lucide Icon Name (Optional)</Label>
              <Input
                id="icon"
                placeholder="e.g. Laptop, Sofa, Car, Key"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                disabled={submitLoading}
              />
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
    </div>
  );
}
