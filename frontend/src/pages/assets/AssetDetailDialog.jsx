import { useState, useEffect } from 'react';
import { assetsAPI } from '@/api/endpoints';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatusBadge from '@/components/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { Calendar, DollarSign, Tag, Info, User, Clock, Wrench } from 'lucide-react';

export default function AssetDetailDialog({ asset, open, onOpenChange }) {
  const [history, setHistory] = useState({ status_history: [], allocation_history: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (asset && open) {
      setLoading(true);
      assetsAPI
        .getHistory(asset.id)
        .then((res) => {
          setHistory(res.data.data || { status_history: [], allocation_history: [] });
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [asset, open]);

  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4 mt-2">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {asset.asset_name}
                <StatusBadge status={asset.current_status} />
              </DialogTitle>
              <DialogDescription className="font-mono text-xs mt-1">
                Asset Tag: {asset.asset_tag}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" className="flex items-center gap-1.5">
              <Info className="h-4 w-4" />
              Specs & Info
            </TabsTrigger>
            <TabsTrigger value="allocations" className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              Allocation History
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Status History
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-muted/30">
                <CardContent className="p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Specifications</h4>
                  <div className="text-sm">
                    <span className="font-medium">Category:</span> {asset.category_name || 'N/A'}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Manufacturer:</span> {asset.manufacturer || 'N/A'}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Model:</span> {asset.model || 'N/A'}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Serial Number:</span> <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{asset.serial_number || 'N/A'}</code>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Condition:</span> <span className="capitalize">{asset.asset_condition || 'N/A'}</span>
                  </div>
                  <div className="text-sm flex items-center gap-1 mt-2">
                    <span className="font-medium">Bookable for meetings:</span>
                    <span className={asset.is_bookable ? 'text-emerald-600 font-semibold' : 'text-muted-foreground'}>
                      {asset.is_bookable ? 'Yes' : 'No'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardContent className="p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Purchase & Custody</h4>
                  <div className="text-sm flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Purchased:</span> {asset.purchase_date ? format(new Date(asset.purchase_date), 'MMM dd, yyyy') : 'N/A'}
                  </div>
                  <div className="text-sm flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Cost:</span> {asset.purchase_cost ? `$${parseFloat(asset.purchase_cost).toLocaleString()}` : 'N/A'}
                  </div>
                  <div className="text-sm flex items-center gap-1.5">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Warranty:</span> {asset.warranty_months ? `${asset.warranty_months} Months` : 'N/A'}
                  </div>
                  <div className="text-sm flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Location:</span> {asset.location || 'N/A'}
                  </div>
                  <div className="text-sm border-t pt-2 mt-2">
                    <span className="font-medium">Current Holder:</span>{' '}
                    {asset.current_holder_name ? (
                      <span className="font-semibold text-primary">{asset.current_holder_name}</span>
                    ) : (
                      <span className="text-muted-foreground italic">In Storage / Available</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Allocation History Tab */}
          <TabsContent value="allocations" className="mt-4">
            <Card>
              <CardContent className="p-4">
                {loading ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">Loading allocation history...</div>
                ) : history.allocation_history.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">No allocation records for this asset.</div>
                ) : (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {history.allocation_history.map((alloc, idx) => (
                      <div key={alloc.id || idx} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">{alloc.employee_name || 'Employee'}</p>
                          <p className="text-xs text-muted-foreground">
                            Allocated on: {alloc.allocated_date ? format(new Date(alloc.allocated_date), 'MMM dd, yyyy') : 'N/A'}
                          </p>
                          {alloc.return_date && (
                            <p className="text-xs text-muted-foreground">
                              Returned on: {format(new Date(alloc.return_date), 'MMM dd, yyyy')}
                            </p>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          <StatusBadge status={alloc.allocation_status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Status History Tab */}
          <TabsContent value="status" className="mt-4">
            <Card>
              <CardContent className="p-4">
                {loading ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">Loading status history...</div>
                ) : history.status_history.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">No status transitions recorded.</div>
                ) : (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {history.status_history.map((hist, idx) => (
                      <div key={hist.id || idx} className="flex justify-between items-start border-b pb-2 last:border-0 last:pb-0">
                        <div className="space-y-1 flex-1 pr-4">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={hist.old_status} label={hist.old_status ? undefined : 'Unset'} />
                            <span className="text-muted-foreground text-xs">➔</span>
                            <StatusBadge status={hist.new_status} />
                          </div>
                          {hist.reason && (
                            <p className="text-xs text-muted-foreground mt-1 bg-muted/50 p-2 rounded">
                              Reason: {hist.reason}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-xs text-muted-foreground shrink-0">
                          {hist.changed_on ? format(new Date(hist.changed_on), 'MMM dd, yyyy hh:mm a') : 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
