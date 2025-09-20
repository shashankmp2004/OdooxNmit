import React, { useEffect, useState } from 'react';
import { useNotifications, useStockAlerts } from '@/hooks/use-socket';
import { Bell, X, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read?: boolean;
}

const NotificationIcon = ({ type }: { type: string }) => {
  const iconMap = {
    info: <Info className="h-4 w-4 text-blue-500" />,
    success: <CheckCircle className="h-4 w-4 text-green-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    error: <XCircle className="h-4 w-4 text-red-500" />
  };
  
  return iconMap[type as keyof typeof iconMap] || iconMap.info;
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

export function RealTimeNotifications() {
  const { notifications, markAsRead, clearAll, unreadCount } = useNotifications();
  const stockAlerts = useStockAlerts();
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);

  // Combine regular notifications with stock alerts
  useEffect(() => {
    const combined = [
      ...notifications,
      ...stockAlerts.map((alert: any) => ({
        id: `stock-${alert.productId}-${alert.timestamp}`,
        type: alert.type === 'low_stock' ? 'warning' : 'info',
        title: alert.type === 'low_stock' ? 'Low Stock Alert' : 'Stock Update',
        message: alert.type === 'low_stock' 
          ? `${alert.data.productName} is running low (${alert.data.currentStock} remaining)`
          : `Stock updated for ${alert.data.productName}`,
        timestamp: alert.timestamp,
        read: false
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setAllNotifications(combined);
  }, [notifications, stockAlerts]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <Card className="border-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            {allNotifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-auto p-0 text-xs"
              >
                Clear all
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {allNotifications.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <div className="text-center">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {allNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start space-x-3 p-3 border-l-2 hover:bg-muted/50 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-muted/30 border-l-primary' : 'border-l-transparent'
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <NotificationIcon type={notification.type} />
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium leading-none">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}

export default RealTimeNotifications;