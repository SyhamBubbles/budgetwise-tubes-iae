import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Receipt, PiggyBank, Users, Bell, Menu, X, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { authService, type User } from "@/services/authService";
import { notificationService } from "@/services/notificationService";

export default function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
            navigate("/login");
        } else {
            setUser(currentUser);
        }
    }, [navigate]);

    const handleLogoutClick = () => {
        setIsLogoutDialogOpen(true);
    };

    const handleLogoutConfirm = async () => {
        await authService.logout();
        setIsLogoutDialogOpen(false);
        navigate("/login");
    };

    const handleLogoutCancel = () => {
        setIsLogoutDialogOpen(false);
    };

    const navigation = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Transactions", href: "/transactions", icon: Receipt },
        { name: "Budgets", href: "/budgets", icon: PiggyBank },
        { name: "Rooms", href: "/rooms", icon: Users },
        { name: "Notifications", href: "/notifications", icon: Bell },
    ];

    // Fetch unread notification count
    const { data: unreadCount } = useQuery({
        queryKey: ["notifications", "unread"],
        queryFn: notificationService.getUnreadCount,
        enabled: !!user,
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-200 ease-in-out dark:bg-gray-800 lg:static lg:translate-x-0",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex h-full flex-col">
                    {/* Logo */}
                    <div className="flex h-16 items-center justify-between px-6 border-b dark:border-gray-700">
                        <span className="text-xl font-bold text-primary">BudgetWise</span>
                        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 px-4 py-6">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.href ||
                                (item.href === "/dashboard" && location.pathname === "/");
                            const isNotifications = item.name === "Notifications";
                            const showBadge = isNotifications && unreadCount && unreadCount > 0;

                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={cn(
                                        "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-primary text-primary-foreground"
                                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                                    )}
                                >
                                    <div className="flex items-center space-x-3">
                                        <Icon className="h-5 w-5" />
                                        <span>{item.name}</span>
                                    </div>
                                    {showBadge && (
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile / Logout */}
                    <div className="border-t p-4 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                                    {user?.name?.charAt(0).toUpperCase() || "U"}
                                </div>
                                <div className="text-sm">
                                    <p className="font-medium text-gray-700 dark:text-gray-200">{user?.name || "User"}</p>
                                    <p className="text-xs text-gray-500 truncate max-w-[120px]">{user?.email || ""}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleLogoutClick} title="Logout">
                                <LogOut className="h-5 w-5 text-gray-500" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen lg:pl-0">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-white px-6 shadow-sm dark:bg-gray-800 lg:hidden">
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
                        <Menu className="h-6 w-6" />
                    </Button>
                    <span className="text-lg font-semibold">BudgetWise</span>
                    <Button variant="ghost" size="icon" asChild className="relative">
                        <Link to="/notifications">
                            <Bell className="h-5 w-5" />
                            {unreadCount && unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                        </Link>
                    </Button>
                </header>

                <main className="flex-1 p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>

            {/* Logout Confirmation Dialog */}
            <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Logout</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin keluar dari akun Anda?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={handleLogoutCancel}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleLogoutConfirm}>
                            Ya, Logout
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
