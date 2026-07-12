import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-primary">AssetFlow</h1>
          <p className="text-muted-foreground mt-2">Enterprise Asset & Resource Management</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
