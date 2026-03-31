-- Extend user_role enum to 4-level system
-- Migration: admin → super_admin, user → teacher

-- Step 1: Add new enum values (PostgreSQL allows adding, not removing directly)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'teacher';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'parent';

-- Step 2: Migrate existing data
-- admin users → super_admin (课题负责人，保留全部权限)
UPDATE users SET role = 'super_admin' WHERE role = 'admin';

-- regular users → teacher (教师用户，可浏览、下载、收藏、反馈)
UPDATE users SET role = 'teacher' WHERE role = 'user';

-- Step 3: Drop old enum values (safe after data migration)
ALTER TYPE user_role DROP VALUE IF EXISTS 'admin';
ALTER TYPE user_role DROP VALUE IF EXISTS 'user';
