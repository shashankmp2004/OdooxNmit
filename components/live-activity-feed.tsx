import React from 'react';
import { useDashboardUpdates } from '@/hooks/use-socket';
import { Activity, Clock, Package, Wrench, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const ActivityIcon = ({ type }: { type: string }) => {
  const iconMap = {
    workorder: <Wrench className="h-4 w-4 text-blue-500" />,
    mo: <Package className="h-4 w-4 text-green-500" />,
    stock: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    default: <Activity className="h-4 w-4 text-gray-500" />
  };
  
  return iconMap[type as keyof typeof iconMap] || iconMap.default;
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
};

const getActivityMessage = (update: any) => {
  switch (update.type) {
    case 'workorder':
      if (update.data?.type === 'started') {
        return `Work order ${update.workOrderId?.slice(-8)} started by ${update.data.startedBy}`;
      }
      if (update.data?.type === 'completed') {
        return `Work order ${update.workOrderId?.slice(-8)} completed by ${update.data.completedBy}`;
      }
      return `Work order ${update.workOrderId?.slice(-8)} updated`;
    
    case 'mo':
      if (update.data?.type === 'completed') {
        return `Manufacturing order ${update.moId?.slice(-8)} completed`;
      }
      return `Manufacturing order ${update.moId?.slice(-8)} updated`;
    
    case 'stock':
      if (update.data?.type === 'manual_adjustment') {
        return `Stock adjusted for ${update.data.productName} by ${update.data.adjustedBy}`;
      }
      if (update.data?.type === 'low_stock') {
        return `Low stock alert: ${update.data.productName}`;
      }
      return `Stock updated for product ${update.productId?.slice(-8)}`;
    
    default:
      return 'Activity update';
  }
};

const getStatusBadge = (update: any) => {
  switch (update.type) {
    case 'workorder':
      if (update.data?.type === 'started') {
        return <Badge variant="default">Started</Badge>;
      }
      if (update.data?.type === 'completed') {
        return <Badge variant="default">Completed</Badge>;
      }
      return <Badge variant="secondary">Updated</Badge>;
    
    case 'mo':
      if (update.data?.type === 'completed') {
        return <Badge variant="default">Completed</Badge>;
      }
      return <Badge variant="secondary">Updated</Badge>;
    
    case 'stock':
      if (update.data?.type === 'low_stock') {
        return <Badge variant="destructive">Low Stock</Badge>;
      }
      return <Badge variant="outline">Stock Change</Badge>;
    
    default:
      return <Badge variant="secondary">Update</Badge>;
  }
};

export function LiveActivityFeed() {
  const updates = useDashboardUpdates();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <CardTitle className="text-sm font-medium">Live Activity</CardTitle>
        </div>
        <div className="flex items-center space-x-1 ml-auto">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {updates.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="text-center">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
                <p className="text-xs">Updates will appear here in real-time</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {updates.map((update, index) => (
                <div
                  key={`${update.timestamp}-${index}`}
                  className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <ActivityIcon type={update.type} />
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium leading-none">
                        {getActivityMessage(update)}
                      </p>
                      {getStatusBadge(update)}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimestamp(update.timestamp)}</span>
                    </div>
                    {update.data?.stockConsumption && (
                      <div className="text-xs text-muted-foreground">
                        Materials consumed, finished goods produced
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default LiveActivityFeed;