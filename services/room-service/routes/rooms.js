const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const db = require('../utils/db');
const authMiddleware = require('../middleware/auth');
const { generateRoomCode } = require('../utils/roomCode');

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/rooms - Get user's rooms
router.get('/', async (req, res) => {
    try {
        const userId = req.user.userId;

        const [rooms] = await db.query(
            `SELECT r.*, rm.role, rm.status,
              (SELECT COUNT(*) FROM room_members WHERE room_id = r.id AND status = 'active') as member_count,
              (SELECT COALESCE(SUM(contribution_amount), 0) FROM room_members WHERE room_id = r.id AND status = 'active') as total_collected
       FROM rooms r
       INNER JOIN room_members rm ON r.id = rm.room_id
       WHERE rm.user_id = ? AND rm.status = 'active'
       ORDER BY r.created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: rooms,
        });
    } catch (error) {
        console.error('Get rooms error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get rooms',
            error: error.message,
        });
    }
});

// POST /api/rooms - Create new room
router.post('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, description, target_amount } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Room name is required',
            });
        }

        const roomId = uuidv4();
        const roomCode = generateRoomCode();
        const memberId = uuidv4();

        // Create room with target amount
        await db.query(
            `INSERT INTO rooms (id, name, description, target_amount, room_code, owner_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [roomId, name, description, target_amount || 0, roomCode, userId]
        );

        // Add owner as member
        await db.query(
            `INSERT INTO room_members (id, room_id, user_id, role, status, joined_at)
       VALUES (?, ?, ?, 'owner', 'active', NOW())`,
            [memberId, roomId, userId]
        );

        const [rooms] = await db.query('SELECT * FROM rooms WHERE id = ?', [roomId]);

        res.status(201).json({
            success: true,
            message: 'Room created successfully',
            data: {
                ...rooms[0],
                role: 'owner',
                member_count: 1,
            },
        });
    } catch (error) {
        console.error('Create room error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create room',
            error: error.message,
        });
    }
});

// POST /api/rooms/join - Request to join room with code (creates pending request)
router.post('/join', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { room_code } = req.body;

        if (!room_code) {
            return res.status(400).json({
                success: false,
                message: 'Room code is required',
            });
        }

        // Find room
        const [rooms] = await db.query(
            'SELECT * FROM rooms WHERE room_code = ?',
            [room_code.toUpperCase()]
        );

        if (rooms.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Room not found',
            });
        }

        const room = rooms[0];

        // Check if already a member or has pending request
        const [existingMember] = await db.query(
            'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?',
            [room.id, userId]
        );

        if (existingMember.length > 0) {
            if (existingMember[0].status === 'active') {
                return res.status(409).json({
                    success: false,
                    message: 'You are already a member of this room',
                });
            }
            if (existingMember[0].status === 'pending') {
                return res.status(409).json({
                    success: false,
                    message: 'You already have a pending join request for this room',
                });
            }
            if (existingMember[0].status === 'rejected') {
                // Update to pending again
                await db.query(
                    `UPDATE room_members SET status = 'pending', left_at = NULL
                     WHERE room_id = ? AND user_id = ?`,
                    [room.id, userId]
                );
            }
        } else {
            // Add as new pending member
            const memberId = uuidv4();
            await db.query(
                `INSERT INTO room_members (id, room_id, user_id, role, status)
                 VALUES (?, ?, ?, 'member', 'pending')`,
                [memberId, room.id, userId]
            );
        }

        // Get requester's name
        const [users] = await db.query('SELECT name FROM users WHERE id = ?', [userId]);
        const requesterName = users.length > 0 ? users[0].name : 'Unknown User';

        // Send notification to room owner
        try {
            const notificationId = uuidv4();
            await db.query(
                `INSERT INTO notifications (id, user_id, type, title, message, related_id, related_type, action_url)
                 VALUES (?, ?, 'join_request', ?, ?, ?, 'room', ?)`,
                [
                    notificationId,
                    room.owner_id,
                    'Join Request',
                    `${requesterName} wants to join "${room.name}"`,
                    room.id,
                    `/rooms/${room.id}`
                ]
            );
        } catch (notifError) {
            console.error('Failed to create notification:', notifError.message);
        }

        res.json({
            success: true,
            message: 'Join request sent successfully. Waiting for owner approval.',
            data: {
                ...room,
                request_status: 'pending'
            },
        });
    } catch (error) {
        console.error('Join room error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send join request',
            error: error.message,
        });
    }
});

// GET /api/rooms/:id - Get room details
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        // Check if user is a member
        const [membership] = await db.query(
            'SELECT * FROM room_members WHERE room_id = ? AND user_id = ? AND status = ?',
            [id, userId, 'active']
        );

        if (membership.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this room',
            });
        }

        const [rooms] = await db.query('SELECT * FROM rooms WHERE id = ?', [id]);

        if (rooms.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Room not found',
            });
        }

        // Get member count and total collected
        const [stats] = await db.query(
            `SELECT 
                COUNT(*) as member_count,
                COALESCE(SUM(contribution_amount), 0) as total_collected
             FROM room_members WHERE room_id = ? AND status = 'active'`,
            [id]
        );

        res.json({
            success: true,
            data: {
                ...rooms[0],
                role: membership[0].role,
                member_count: stats[0].member_count,
                total_collected: stats[0].total_collected,
                my_contribution: membership[0].contribution_amount || 0,
            },
        });
    } catch (error) {
        console.error('Get room error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get room',
            error: error.message,
        });
    }
});

// PUT /api/rooms/:id - Update room
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { name, description } = req.body;

        // Check if user is owner or admin
        const [membership] = await db.query(
            "SELECT * FROM room_members WHERE room_id = ? AND user_id = ? AND role IN ('owner', 'admin') AND status = 'active'",
            [id, userId]
        );

        if (membership.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Only room owner or admin can update room',
            });
        }

        const updates = [];
        const values = [];

        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update',
            });
        }

        values.push(id);
        await db.query(`UPDATE rooms SET ${updates.join(', ')} WHERE id = ?`, values);

        const [rooms] = await db.query('SELECT * FROM rooms WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Room updated successfully',
            data: rooms[0],
        });
    } catch (error) {
        console.error('Update room error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update room',
            error: error.message,
        });
    }
});

// DELETE /api/rooms/:id - Delete room
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        // Check if user is owner
        const [rooms] = await db.query(
            'SELECT * FROM rooms WHERE id = ? AND owner_id = ?',
            [id, userId]
        );

        if (rooms.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Only room owner can delete room',
            });
        }

        await db.query('DELETE FROM rooms WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Room deleted successfully',
        });
    } catch (error) {
        console.error('Delete room error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete room',
            error: error.message,
        });
    }
});

// POST /api/rooms/:id/leave - Leave room
router.post('/:id/leave', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        // Check if user is a member
        const [membership] = await db.query(
            "SELECT * FROM room_members WHERE room_id = ? AND user_id = ? AND status = 'active'",
            [id, userId]
        );

        if (membership.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'You are not a member of this room',
            });
        }

        // Owner cannot leave (must delete room or transfer ownership)
        if (membership[0].role === 'owner') {
            return res.status(400).json({
                success: false,
                message: 'Owner cannot leave room. Transfer ownership or delete the room.',
            });
        }

        await db.query(
            "UPDATE room_members SET status = 'left', left_at = NOW() WHERE room_id = ? AND user_id = ?",
            [id, userId]
        );

        res.json({
            success: true,
            message: 'Left room successfully',
        });
    } catch (error) {
        console.error('Leave room error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to leave room',
            error: error.message,
        });
    }
});

// GET /api/rooms/:id/members - Get room members
router.get('/:id/members', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        // Check if user is a member
        const [membership] = await db.query(
            "SELECT * FROM room_members WHERE room_id = ? AND user_id = ? AND status = 'active'",
            [id, userId]
        );

        if (membership.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this room',
            });
        }

        const [members] = await db.query(
            `SELECT rm.*, u.name, u.email 
       FROM room_members rm
       INNER JOIN users u ON rm.user_id = u.id
       WHERE rm.room_id = ? AND rm.status = 'active'
       ORDER BY rm.role, rm.joined_at`,
            [id]
        );

        res.json({
            success: true,
            data: members,
        });
    } catch (error) {
        console.error('Get room members error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get room members',
            error: error.message,
        });
    }
});

// DELETE /api/rooms/:id/members/:userId - Remove member
router.delete('/:id/members/:memberId', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id, memberId } = req.params;

        // Check if user is owner or admin
        const [membership] = await db.query(
            "SELECT * FROM room_members WHERE room_id = ? AND user_id = ? AND role IN ('owner', 'admin') AND status = 'active'",
            [id, userId]
        );

        if (membership.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Only room owner or admin can remove members',
            });
        }

        // Cannot remove owner
        const [targetMember] = await db.query(
            'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?',
            [id, memberId]
        );

        if (targetMember.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Member not found',
            });
        }

        if (targetMember[0].role === 'owner') {
            return res.status(400).json({
                success: false,
                message: 'Cannot remove room owner',
            });
        }

        await db.query(
            "UPDATE room_members SET status = 'left', left_at = NOW() WHERE room_id = ? AND user_id = ?",
            [id, memberId]
        );

        res.json({
            success: true,
            message: 'Member removed successfully',
        });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove member',
            error: error.message,
        });
    }
});

// GET /api/rooms/:id/transactions - Get room transactions
router.get('/:id/transactions', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        // Check if user is a member
        const [membership] = await db.query(
            "SELECT * FROM room_members WHERE room_id = ? AND user_id = ? AND status = 'active'",
            [id, userId]
        );

        if (membership.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this room',
            });
        }

        const [transactions] = await db.query(
            `SELECT t.*, u.name as user_name
       FROM transactions t
       INNER JOIN users u ON t.user_id = u.id
       WHERE t.room_id = ?
       ORDER BY t.date DESC, t.created_at DESC
       LIMIT ? OFFSET ?`,
            [id, parseInt(limit), parseInt(offset)]
        );

        const [countResult] = await db.query(
            'SELECT COUNT(*) as total FROM transactions WHERE room_id = ?',
            [id]
        );

        res.json({
            success: true,
            data: transactions,
            pagination: {
                total: countResult[0].total,
                limit: parseInt(limit),
                offset: parseInt(offset),
            },
        });
    } catch (error) {
        console.error('Get room transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get room transactions',
            error: error.message,
        });
    }
});

// POST /api/rooms/:id/transactions - Add transaction to room
router.post('/:id/transactions', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { type, amount, category, description, payment_method, date } = req.body;

        // Check if user is a member
        const [membership] = await db.query(
            "SELECT * FROM room_members WHERE room_id = ? AND user_id = ? AND status = 'active'",
            [id, userId]
        );

        if (membership.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this room',
            });
        }

        if (!type || !amount || !category || !date) {
            return res.status(400).json({
                success: false,
                message: 'Type, amount, category, and date are required',
            });
        }

        const transactionId = uuidv4();

        await db.query(
            `INSERT INTO transactions (id, user_id, room_id, type, amount, category, description, payment_method, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [transactionId, userId, id, type, amount, category, description, payment_method, date]
        );

        const [transactions] = await db.query(
            `SELECT t.*, u.name as user_name
       FROM transactions t
       INNER JOIN users u ON t.user_id = u.id
       WHERE t.id = ?`,
            [transactionId]
        );

        res.status(201).json({
            success: true,
            message: 'Transaction added to room successfully',
            data: transactions[0],
        });
    } catch (error) {
        console.error('Add room transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add transaction to room',
            error: error.message,
        });
    }
});

// GET /api/rooms/:id/join-requests - Get pending join requests (owner/admin only)
router.get('/:id/join-requests', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        // Check if user is owner or admin
        const [membership] = await db.query(
            "SELECT * FROM room_members WHERE room_id = ? AND user_id = ? AND role IN ('owner', 'admin') AND status = 'active'",
            [id, userId]
        );

        if (membership.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Only room owner or admin can view join requests',
            });
        }

        const [requests] = await db.query(
            `SELECT rm.*, u.name, u.email 
             FROM room_members rm
             INNER JOIN users u ON rm.user_id = u.id
             WHERE rm.room_id = ? AND rm.status = 'pending'
             ORDER BY rm.created_at DESC`,
            [id]
        );

        res.json({
            success: true,
            data: requests,
        });
    } catch (error) {
        console.error('Get join requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get join requests',
            error: error.message,
        });
    }
});

// PUT /api/rooms/:id/members/:memberId/accept - Accept join request
router.put('/:id/members/:memberId/accept', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id, memberId } = req.params;

        // Check if user is owner or admin
        const [membership] = await db.query(
            "SELECT * FROM room_members WHERE room_id = ? AND user_id = ? AND role IN ('owner', 'admin') AND status = 'active'",
            [id, userId]
        );

        if (membership.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Only room owner or admin can accept join requests',
            });
        }

        // Check if the target has a pending request
        const [targetMember] = await db.query(
            "SELECT * FROM room_members WHERE room_id = ? AND user_id = ? AND status = 'pending'",
            [id, memberId]
        );

        if (targetMember.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No pending join request found for this user',
            });
        }

        // Update to active
        await db.query(
            "UPDATE room_members SET status = 'active', joined_at = NOW() WHERE room_id = ? AND user_id = ?",
            [id, memberId]
        );

        // Get room info for notification
        const [rooms] = await db.query('SELECT * FROM rooms WHERE id = ?', [id]);
        const room = rooms[0];

        // Send notification to the accepted user
        try {
            const notificationId = uuidv4();
            await db.query(
                `INSERT INTO notifications (id, user_id, type, title, message, related_id, related_type, action_url)
                 VALUES (?, ?, 'join_accepted', ?, ?, ?, 'room', ?)`,
                [
                    notificationId,
                    memberId,
                    'Request Accepted',
                    `Your request to join "${room.name}" has been accepted!`,
                    room.id,
                    `/rooms/${room.id}`
                ]
            );
        } catch (notifError) {
            console.error('Failed to create notification:', notifError.message);
        }

        res.json({
            success: true,
            message: 'Join request accepted successfully',
        });
    } catch (error) {
        console.error('Accept join request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to accept join request',
            error: error.message,
        });
    }
});

// PUT /api/rooms/:id/members/:memberId/reject - Reject join request
router.put('/:id/members/:memberId/reject', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id, memberId } = req.params;

        // Check if user is owner or admin
        const [membership] = await db.query(
            "SELECT * FROM room_members WHERE room_id = ? AND user_id = ? AND role IN ('owner', 'admin') AND status = 'active'",
            [id, userId]
        );

        if (membership.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Only room owner or admin can reject join requests',
            });
        }

        // Check if the target has a pending request
        const [targetMember] = await db.query(
            "SELECT * FROM room_members WHERE room_id = ? AND user_id = ? AND status = 'pending'",
            [id, memberId]
        );

        if (targetMember.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No pending join request found for this user',
            });
        }

        // Update to rejected
        await db.query(
            "UPDATE room_members SET status = 'rejected', left_at = NOW() WHERE room_id = ? AND user_id = ?",
            [id, memberId]
        );

        // Get room info for notification
        const [rooms] = await db.query('SELECT * FROM rooms WHERE id = ?', [id]);
        const room = rooms[0];

        // Send notification to the rejected user
        try {
            const notificationId = uuidv4();
            await db.query(
                `INSERT INTO notifications (id, user_id, type, title, message, related_id, related_type, action_url)
                 VALUES (?, ?, 'join_rejected', ?, ?, ?, 'room', ?)`,
                [
                    notificationId,
                    memberId,
                    'Request Rejected',
                    `Your request to join "${room.name}" has been rejected.`,
                    room.id,
                    `/rooms`
                ]
            );
        } catch (notifError) {
            console.error('Failed to create notification:', notifError.message);
        }

        res.json({
            success: true,
            message: 'Join request rejected successfully',
        });
    } catch (error) {
        console.error('Reject join request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject join request',
            error: error.message,
        });
    }
});

// PUT /api/rooms/:id/contribute - Update member's contribution
router.put('/:id/contribute', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { amount } = req.body;

        if (amount === undefined || amount < 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid contribution amount is required',
            });
        }

        // Check if user is an active member
        const [membership] = await db.query(
            "SELECT * FROM room_members WHERE room_id = ? AND user_id = ? AND status = 'active'",
            [id, userId]
        );

        if (membership.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You are not an active member of this room',
            });
        }

        // Update contribution
        await db.query(
            "UPDATE room_members SET contribution_amount = ? WHERE room_id = ? AND user_id = ?",
            [amount, id, userId]
        );

        // Get updated room info
        const [rooms] = await db.query(
            `SELECT r.*, 
              (SELECT COALESCE(SUM(contribution_amount), 0) FROM room_members WHERE room_id = r.id AND status = 'active') as total_collected
             FROM rooms r WHERE r.id = ?`,
            [id]
        );

        res.json({
            success: true,
            message: 'Contribution updated successfully',
            data: {
                contribution_amount: amount,
                total_collected: rooms[0]?.total_collected || 0,
                target_amount: rooms[0]?.target_amount || 0,
            },
        });
    } catch (error) {
        console.error('Update contribution error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update contribution',
            error: error.message,
        });
    }
});

// PUT /api/rooms/:id/target - Update room target amount (owner only)
router.put('/:id/target', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { target_amount } = req.body;

        if (target_amount === undefined || target_amount < 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid target amount is required',
            });
        }

        // Check if user is owner
        const [membership] = await db.query(
            "SELECT * FROM room_members WHERE room_id = ? AND user_id = ? AND role = 'owner' AND status = 'active'",
            [id, userId]
        );

        if (membership.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Only room owner can update target amount',
            });
        }

        // Update target
        await db.query(
            "UPDATE rooms SET target_amount = ? WHERE id = ?",
            [target_amount, id]
        );

        res.json({
            success: true,
            message: 'Target amount updated successfully',
            data: { target_amount },
        });
    } catch (error) {
        console.error('Update target error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update target amount',
            error: error.message,
        });
    }
});

module.exports = router;

