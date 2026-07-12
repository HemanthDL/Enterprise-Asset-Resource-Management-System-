import PageHeader from '@/components/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DepartmentTab from './DepartmentTab';
import CategoryTab from './CategoryTab';
import EmployeeTab from './EmployeeTab';
import { Building2, Layers, Users } from 'lucide-react';

export default function OrganizationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Setup"
        description="Manage departments, asset categories, and promote or assign employees."
      />

      <Tabs defaultValue="departments" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[500px] mb-6">
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Employees
          </TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="space-y-4">
          <DepartmentTab />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <CategoryTab />
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <EmployeeTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
