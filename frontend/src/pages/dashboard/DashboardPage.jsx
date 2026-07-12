import { useState, useEffect } from 'react';
import { dashboardAPI } from '@/api/endpoints';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Monitor, 
  ArrowRightLeft, 
  Wrench, 
  CalendarDays,
  AlertTriangle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { isAssetManager, isAdmin, isDepartmentHead } = useAuth();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState(null);
  const [overdueReturns, setOverdueReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  const canViewOverdue = isAdmin() || isAssetManager() || isDepartmentHead();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const promises = [dashboardAPI.getKPIs()];
        if (canViewOverdue) {
          promises.push(dashboardAPI.getOverdueReturns());
        }
        
        const results = await Promise.all(promises);
        setKpis(results[0].data);
        if (canViewOverdue && results[1]) {
          setOverdueReturns(results[1].data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [canViewOverdue]);

  const statCards = [
    {
      title: 'Assets Available',
      value: kpis?.assets_available || 0,
      icon: Monitor,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Assets Allocated',
      value: kpis?.assets_allocated || 0,
      icon: ArrowRightLeft,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Maintenance Today',
      value: kpis?.maintenance_today || 0,
      icon: Wrench,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      title: 'Active Bookings',
      value: kpis?.active_bookings || 0,
      icon: CalendarDays,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
          <p className="text-muted-foreground">
            Here's what's happening with your assets today.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(isAdmin() || isAssetManager()) && (
            <Button onClick={() => navigate('/assets')}>
              Register Asset
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate('/bookings')}>
            Book Resource
          </Button>
          <Button variant="outline" onClick={() => navigate('/maintenance')}>
            Raise Maintenance
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="border-border/50 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold animate-count-up">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sub-KPIs and Alerts */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Pending Transfers / Returns Summary */}
        <Card className={canViewOverdue ? "col-span-2 shadow-sm" : "col-span-3 shadow-sm"}>
          <CardHeader>
            <CardTitle>System Activity</CardTitle>
            <CardDescription>Pending requests that require attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                <div className="p-3 bg-indigo-500/10 rounded-full">
                  <ArrowRightLeft className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Transfers</p>
                  <p className="text-2xl font-bold">{kpis?.pending_transfers || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                <div className="p-3 bg-blue-500/10 rounded-full">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Upcoming Returns (7d)</p>
                  <p className="text-2xl font-bold">{kpis?.upcoming_returns || 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Returns Alert Panel */}
        {canViewOverdue && (
          <Card className="col-span-1 border-destructive/20 shadow-sm bg-destructive/5 dark:bg-destructive/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Overdue Returns
                <Badge variant="destructive" className="ml-auto">
                  {overdueReturns.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {overdueReturns.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No overdue returns.
                </div>
              ) : (
                <div className="flex flex-col max-h-[220px] overflow-y-auto">
                  {overdueReturns.map((item) => (
                    <div key={item.allocation_id} className="flex flex-col gap-1 p-4 border-b border-destructive/10 last:border-0 hover:bg-destructive/10 transition-colors">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-sm truncate pr-2" title={item.asset_name}>
                          {item.asset_name}
                        </span>
                        <span className="text-xs font-mono text-destructive shrink-0">
                          {item.asset_tag}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                        <span className="truncate pr-2">Due: {item.expected_return_date ? format(new Date(item.expected_return_date), 'MMM dd, yyyy') : 'N/A'}</span>
                        <span className="font-medium text-foreground truncate max-w-[100px] text-right" title={item.employee_name}>
                          {item.employee_name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {overdueReturns.length > 0 && (
                <div className="p-3 border-t border-destructive/10 bg-background/50">
                  <Button variant="ghost" size="sm" className="w-full text-xs text-destructive hover:text-destructive hover:bg-destructive/10" asChild>
                    <Link to="/allocations">
                      View All Overdue <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
