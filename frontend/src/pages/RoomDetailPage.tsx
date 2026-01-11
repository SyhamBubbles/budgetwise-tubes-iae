import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Users, UserPlus, Check, X, Target, Wallet, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { roomService } from "@/services/roomService";
import { cn } from "@/lib/utils";

interface ContributionForm {
    amount: string;
}

interface TargetForm {
    target_amount: string;
}

export default function RoomDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [isContributeOpen, setIsContributeOpen] = useState(false);
    const [isTargetOpen, setIsTargetOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: room, isLoading: isLoadingRoom } = useQuery({
        queryKey: ["room", id],
        queryFn: () => roomService.getRoom(id!),
        enabled: !!id,
    });

    const { data: members, isLoading: isLoadingMembers } = useQuery({
        queryKey: ["room", id, "members"],
        queryFn: () => roomService.getRoomMembers(id!),
        enabled: !!id,
    });

    // Join requests query (only for owner/admin)
    const { data: joinRequests } = useQuery({
        queryKey: ["room", id, "join-requests"],
        queryFn: () => roomService.getJoinRequests(id!),
        enabled: !!id && (room?.role === 'owner' || room?.role === 'admin'),
    });

    // Contribution mutation
    const contributeMutation = useMutation({
        mutationFn: (amount: number) => roomService.contribute(id!, amount),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["room", id] });
            queryClient.invalidateQueries({ queryKey: ["room", id, "members"] });
            queryClient.invalidateQueries({ queryKey: ["rooms"] });
            setIsContributeOpen(false);
            contributeForm.reset();
        },
    });

    // Update target mutation
    const targetMutation = useMutation({
        mutationFn: (target_amount: number) => roomService.updateTarget(id!, target_amount),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["room", id] });
            queryClient.invalidateQueries({ queryKey: ["rooms"] });
            setIsTargetOpen(false);
            targetForm.reset();
        },
    });

    // Accept join request mutation
    const acceptMutation = useMutation({
        mutationFn: (userId: string) => roomService.acceptJoinRequest(id!, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["room", id, "join-requests"] });
            queryClient.invalidateQueries({ queryKey: ["room", id, "members"] });
            queryClient.invalidateQueries({ queryKey: ["room", id] });
        },
    });

    // Reject join request mutation
    const rejectMutation = useMutation({
        mutationFn: (userId: string) => roomService.rejectJoinRequest(id!, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["room", id, "join-requests"] });
        },
    });

    const contributeForm = useForm<ContributionForm>({
        defaultValues: { amount: "" }
    });

    const targetForm = useForm<TargetForm>({
        defaultValues: { target_amount: "" }
    });

    const onContributeSubmit = (data: ContributionForm) => {
        contributeMutation.mutate(parseFloat(data.amount));
    };

    const onTargetSubmit = (data: TargetForm) => {
        targetMutation.mutate(parseFloat(data.target_amount));
    };

    if (isLoadingRoom || isLoadingMembers) {
        return <div className="p-6">Loading details...</div>;
    }

    if (!room) {
        return <div className="p-6">Room not found</div>;
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const isOwnerOrAdmin = room.role === 'owner' || room.role === 'admin';
    const pendingRequests = joinRequests || [];

    // Convert to numbers (MySQL returns DECIMAL as strings)
    const targetAmount = Number(room.target_amount) || 0;
    const totalCollected = Number(room.total_collected) || 0;
    const myContribution = Number(room.my_contribution) || 0;
    const percentage = targetAmount > 0 ? Math.min((totalCollected / targetAmount) * 100, 100) : 0;
    const isCompleted = targetAmount > 0 && totalCollected >= targetAmount;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/rooms">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        {isCompleted && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                        <h1 className="text-3xl font-bold tracking-tight">{room.name}</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Code: <span className="font-mono bg-muted px-2 py-0.5 rounded">{room.room_code}</span>
                        {room.description && <span className="ml-4">{room.description}</span>}
                    </p>
                </div>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {room.role}
                </span>
            </div>

            {/* Target Progress Card */}
            <Card className={cn(
                isCompleted && "border-green-500 bg-green-50 dark:bg-green-950/20"
            )}>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Target Patungan
                        </div>
                        {room.role === 'owner' && (
                            <Dialog open={isTargetOpen} onOpenChange={setIsTargetOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">Edit Target</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Update Target Amount</DialogTitle>
                                        <DialogDescription>
                                            Set target total patungan yang ingin dicapai.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={targetForm.handleSubmit(onTargetSubmit)} className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="target_amount">Target Amount (Rp)</Label>
                                            <Input
                                                id="target_amount"
                                                type="number"
                                                placeholder="e.g. 20000000"
                                                defaultValue={targetAmount}
                                                {...targetForm.register("target_amount")}
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={targetMutation.isPending}>
                                                {targetMutation.isPending ? "Updating..." : "Update Target"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center space-y-1">
                        <p className={cn(
                            "text-4xl font-bold",
                            isCompleted ? "text-green-600" : "text-primary"
                        )}>
                            {formatCurrency(totalCollected)}
                        </p>
                        <p className="text-muted-foreground">
                            dari target {formatCurrency(targetAmount)}
                        </p>
                    </div>
                    {targetAmount > 0 && (
                        <>
                            <Progress
                                value={percentage}
                                className={cn("h-4", isCompleted ? "bg-green-200" : "")}
                            />
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{percentage.toFixed(1)}% terkumpul</span>
                                {isCompleted ? (
                                    <span className="text-green-600 font-bold">✓ Target Tercapai!</span>
                                ) : (
                                    <span className="text-muted-foreground">
                                        Kurang {formatCurrency(targetAmount - totalCollected)}
                                    </span>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
                {/* My Contribution Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="h-5 w-5" />
                            Kontribusi Saya
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-3xl font-bold text-primary">{formatCurrency(myContribution)}</p>
                        {targetAmount > 0 && (
                            <p className="text-sm text-muted-foreground">
                                {((myContribution / targetAmount) * 100).toFixed(1)}% dari target
                            </p>
                        )}
                        <Dialog open={isContributeOpen} onOpenChange={setIsContributeOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full">Update Kontribusi</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Update Kontribusi</DialogTitle>
                                    <DialogDescription>
                                        Masukkan total kontribusi Anda untuk room ini.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={contributeForm.handleSubmit(onContributeSubmit)} className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Jumlah Kontribusi (Rp)</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            placeholder="e.g. 5000000"
                                            defaultValue={myContribution}
                                            {...contributeForm.register("amount")}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" disabled={contributeMutation.isPending}>
                                            {contributeMutation.isPending ? "Saving..." : "Update"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>

                {/* Members Column */}
                <div className="md:col-span-2 space-y-6">
                    {/* Pending Join Requests (Owner/Admin only) */}
                    {isOwnerOrAdmin && pendingRequests.length > 0 && (
                        <Card className="border-yellow-500/50 bg-yellow-500/5">
                            <CardHeader>
                                <CardTitle className="flex items-center text-yellow-600">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Join Requests ({pendingRequests.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {pendingRequests.map(request => (
                                    <div key={request.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-sm font-bold text-yellow-600">
                                                {request.name?.charAt(0) || "?"}
                                            </div>
                                            <div>
                                                <p className="font-medium">{request.name}</p>
                                                <p className="text-sm text-muted-foreground">{request.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                onClick={() => acceptMutation.mutate(request.user_id)}
                                                disabled={acceptMutation.isPending || rejectMutation.isPending}
                                            >
                                                <Check className="h-4 w-4 mr-1" />
                                                Accept
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => rejectMutation.mutate(request.user_id)}
                                                disabled={acceptMutation.isPending || rejectMutation.isPending}
                                            >
                                                <X className="h-4 w-4 mr-1" />
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Members with Contributions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Users className="mr-2 h-4 w-4" />
                                Kontribusi Anggota ({members?.length || 0})
                            </CardTitle>
                            <CardDescription>Rincian kontribusi setiap anggota</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {members?.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No members yet</p>
                            ) : (
                                members?.map(member => (
                                    <div key={member.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                                                {member.name?.charAt(0) || "?"}
                                            </div>
                                            <div>
                                                <p className="font-medium leading-none">{member.name || "Unknown"}</p>
                                                <p className="text-xs text-muted-foreground">{member.role}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-primary">
                                                {formatCurrency(member.contribution_amount || 0)}
                                            </p>
                                            {targetAmount > 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    {(((member.contribution_amount || 0) / targetAmount) * 100).toFixed(1)}%
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
