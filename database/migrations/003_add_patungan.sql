-- Migration to add patungan (shared savings) feature to rooms
-- Run this after 001_create_tables.sql

-- Add target_amount to rooms table for savings goal
ALTER TABLE rooms ADD COLUMN target_amount DECIMAL(15,2) DEFAULT 0 AFTER description;

-- Add contribution_amount to room_members table
ALTER TABLE room_members ADD COLUMN contribution_amount DECIMAL(15,2) DEFAULT 0 AFTER status;
