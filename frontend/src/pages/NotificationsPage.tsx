import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, Trash2, UserPlus, AlertTriangle, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { notificationService, type Notification } from "@/services/notificationService";
import { format } from "date-fns";

const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
        case 'join_request':
            return <UserPlus className="h-5 w-5 text-yellow-500" />;
        case 'join_accepted':
            return <Check className="h-5 w-5 text-green-500" />;
        case 'join_rejected':
            return <AlertTriangle className="h-5 w-5 text-red-500" />;
        case 'budget_alert':
            return <AlertTriangle className="h-5 w-5 text-orange-500" />;
        case 'transaction_added':
            return <DollarSign className="h-5 w-5 text-blue-500" />;
        default:
            return <Bell className="h-5 w-5 text-gray-500" />;
    }
};

const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
        case 'join_request':
            return 'border-l-yellow-500 bg-yellow-500/5';
        case 'join_accepted':
            return 'border-l-green-500 bg-green-500/5';
        case 'join_rejected':
            return 'border-l-red-500 bg-red-500/5';
        case 'budget_alert':
            return 'border-l-orange-500 bg-orange-500/5';
        default:
            return 'border-l-primary bg-primary/5';
    }
};

export default function NotificationsPage() {
    const queryClient = useQueryClient();

    const { data: notifications, isLoading } = useQuery({
        queryKey: ["notifications"],
        queryFn: () => notificationService.getNotifications({ limit: 50 }),
    });

    const { data: unreadCount } = useQuery({
        queryKey: ["notifications", "unread"],
        queryFn: notificationService.getUnreadCount,
    });

    const markAsReadMutation = useMutation({
        mutationFn: notificationService.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: notificationService.markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: notificationService.deleteNotification,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground">
                        Stay updated with room requests and budget alerts.
                    </p>
                </div>
                {unreadCount && unreadCount > 0 && (
                    <Button
                        variant="outline"
                        onClick={() => markAllAsReadMutation.mutate()}
                        disabled={markAllAsReadMutation.isPending}
                    >
                        <CheckCheck className="mr-2 h-4 w-4" />
                        Mark All as Read ({unreadCount})
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Notifications</CardTitle>
                    <CardDescription>
                        {notifications?.length || 0} notifications
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p>Loading notifications...</p>
                    ) : notifications?.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No notifications yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {notifications?.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`flex items-start gap-4 p-4 rounded-lg border-l-4 ${getNotificationColor(notification.type)} ${!notification.is_read ? 'font-medium' : 'opacity-75'
                                        }`}
                                >
                                    <div className="mt-0.5">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-medium">{notification.title}</p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    {format(new Date(notification.created_at), "MMM d, yyyy 'at' HH:mm")}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {notification.action_url && (
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link to={notification.action_url}>View</Link>
                                                    </Button>
                                                )}
                                                {!notification.is_read && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => markAsReadMutation.mutate(notification.id)}
                                                        disabled={markAsReadMutation.isPending}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-600"
                                                    onClick={() => deleteMutation.mutate(notification.id)}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
