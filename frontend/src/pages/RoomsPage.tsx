import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, LogIn, ArrowRight, Target, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { roomService } from "@/services/roomService";
import type { JoinRoomDTO } from "@/types/room";
import { cn } from "@/lib/utils";

// Schemas
const createRoomSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    target_amount: z.string().optional(),
});

const joinRoomSchema = z.object({
    room_code: z.string().min(6, "Code must be at least 6 characters"),
});

type CreateRoomFormValues = z.infer<typeof createRoomSchema>;

export default function RoomsPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isJoinOpen, setIsJoinOpen] = useState(false);
    const [joinMessage, setJoinMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const queryClient = useQueryClient();

    const { data: rooms, isLoading } = useQuery({
        queryKey: ["rooms"],
        queryFn: roomService.getRooms,
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateRoomFormValues) => roomService.createRoom({
            name: data.name,
            description: data.description,
            target_amount: data.target_amount ? parseFloat(data.target_amount) : undefined,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["rooms"] });
            setIsCreateOpen(false);
            createForm.reset();
        },
    });

    const joinMutation = useMutation({
        mutationFn: roomService.joinRoom,
        onSuccess: () => {
            setIsJoinOpen(false);
            joinForm.reset();
            setJoinMessage({
                type: 'success',
                text: 'Join request terkirim! Menunggu persetujuan dari owner.'
            });
            setTimeout(() => setJoinMessage(null), 5000);
        },
        onError: (error: any) => {
            setJoinMessage({
                type: 'error',
                text: error?.response?.data?.message || 'Gagal mengirim join request'
            });
            setTimeout(() => setJoinMessage(null), 5000);
        },
    });

    const createForm = useForm<CreateRoomFormValues>({
        resolver: zodResolver(createRoomSchema),
        defaultValues: { name: "", description: "", target_amount: "" },
    });

    const joinForm = useForm<JoinRoomDTO>({
        resolver: zodResolver(joinRoomSchema),
        defaultValues: { room_code: "" },
    });

    const onCreateSubmit = (data: CreateRoomFormValues) => createMutation.mutate(data);
    const onJoinSubmit = (data: JoinRoomDTO) => joinMutation.mutate(data);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* Join Request Feedback Message */}
            {joinMessage && (
                <div className={cn(
                    "p-4 rounded-lg border",
                    joinMessage.type === 'success'
                        ? "bg-green-50 border-green-200 text-green-800"
                        : "bg-red-50 border-red-200 text-red-800"
                )}>
                    {joinMessage.text}
                </div>
            )}

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Shared Savings</h1>
                    <p className="text-muted-foreground">
                        Patungan bersama keluarga dan teman untuk mencapai target tabungan.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <LogIn className="mr-2 h-4 w-4" /> Join Room
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Join a Room</DialogTitle>
                                <DialogDescription>
                                    Enter the room code shared by the owner.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={joinForm.handleSubmit(onJoinSubmit)} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="room_code">Room Code</Label>
                                    <Input
                                        id="room_code"
                                        placeholder="e.g. FAM123"
                                        {...joinForm.register("room_code")}
                                    />
                                    {joinForm.formState.errors.room_code && (
                                        <p className="text-xs text-red-500">{joinForm.formState.errors.room_code.message}</p>
                                    )}
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={joinMutation.isPending}>
                                        {joinMutation.isPending ? "Joining..." : "Join"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Create Room
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Room</DialogTitle>
                                <DialogDescription>
                                    Buat room patungan baru dengan target tabungan.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Room Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Trip to Malaysia"
                                        {...createForm.register("name")}
                                    />
                                    {createForm.formState.errors.name && (
                                        <p className="text-xs text-red-500">{createForm.formState.errors.name.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="target_amount">Target Amount (Rp)</Label>
                                    <Input
                                        id="target_amount"
                                        type="number"
                                        placeholder="e.g. 20000000"
                                        {...createForm.register("target_amount")}
                                    />
                                    <p className="text-xs text-muted-foreground">Target total patungan yang ingin dicapai</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <Input
                                        id="description"
                                        placeholder="Patungan untuk..."
                                        {...createForm.register("description")}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={createMutation.isPending}>
                                        {createMutation.isPending ? "Creating..." : "Create Room"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div className="col-span-full text-center py-10">Loading rooms...</div>
                ) : rooms?.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        Belum ada room. Buat room baru atau join room yang sudah ada.
                    </div>
                ) : rooms?.map((room) => {
                    // Convert to numbers (MySQL returns DECIMAL as strings)
                    const targetAmount = Number(room.target_amount) || 0;
                    const totalCollected = Number(room.total_collected) || 0;
                    const percentage = targetAmount > 0 ? Math.min((totalCollected / targetAmount) * 100, 100) : 0;
                    const isCompleted = targetAmount > 0 && totalCollected >= targetAmount;

                    return (
                        <Card
                            key={room.id}
                            className={cn(
                                "cursor-pointer hover:shadow-md transition-all",
                                isCompleted && "border-green-500 bg-green-50 dark:bg-green-950/20"
                            )}
                        >
                            <CardHeader className="pb-2">
                                <CardTitle className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                        {room.name}
                                    </div>
                                    <span className="text-xs font-normal px-2 py-1 bg-primary/10 text-primary rounded-full">
                                        {room.user_role || room.role}
                                    </span>
                                </CardTitle>
                                <CardDescription>{room.description || "No description"}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Target Info */}
                                {targetAmount > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                <Target className="h-4 w-4" />
                                                Target
                                            </span>
                                            <span className={cn(
                                                "font-bold",
                                                isCompleted ? "text-green-600" : "text-primary"
                                            )}>
                                                {formatCurrency(totalCollected)} / {formatCurrency(targetAmount)}
                                            </span>
                                        </div>
                                        <Progress
                                            value={percentage}
                                            className={cn(
                                                "h-2",
                                                isCompleted ? "bg-green-200" : ""
                                            )}
                                        />
                                        <p className="text-xs text-right text-muted-foreground">
                                            {percentage.toFixed(1)}% terkumpul
                                            {isCompleted && <span className="text-green-600 font-bold ml-1">✓ Tercapai!</span>}
                                        </p>
                                    </div>
                                )}

                                {/* Members */}
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Users className="h-4 w-4 mr-2" />
                                    {room.members_count || room.member_count || 0} Members
                                </div>

                                {/* Room Code */}
                                <div className="p-2 bg-muted rounded text-center text-sm font-mono">
                                    {room.room_code}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button variant="ghost" className="w-full" size="sm" asChild>
                                    <Link to={`/rooms/${room.id}`}>
                                        View Details <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
