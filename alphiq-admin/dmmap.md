# Database Map (dmmap.md)

This document summarizes the database schema for the AlphIQ Admin Panel. Use this as a reference for all future backend and frontend changes.

---

## USER-DEFINED Types
- **role**: Used in `admin_invites` and `admin_user_profiles`. (Likely an enum for admin roles)
- **admin_submission_status**: Used in `admin_quest_submissions.status`. (Likely an enum: e.g., pending, approved, rejected)
- **admin_user_role**: Used in `admin_user_profiles.role`. (Likely an enum: e.g., viewer, editor, admin)

---

## Tables

### 1. users
- **Purpose**: Core user table. Stores all user identities and stats.
- **Key Columns**:
  - `id` (uuid, PK)
  - `address` (unique, text)
  - `title`, `xp_points`, `score`, `total_xp`, `admin_total_xp`
  - `exists_flag`, `checked_at`, `joined_at`, `updated_at`
- **Relationships**: Referenced by many tables (user_logins, user_streaks, etc.)

### 2. admin_user_profiles
- **Purpose**: Admin profile for users, with roles and partner info.
- **Key Columns**:
  - `id` (uuid, PK, FK to auth.users)
  - `full_name`, `role`, `partner_id`, `partner_name`, `approved`, `approved_by`, `approved_at`
  - `created_at`, `updated_at`
- **Relationships**:
  - `id` FK to `auth.users(id)`
  - `approved_by` FK to `auth.users(id)`

### 3. admin_invites
- **Purpose**: Tracks admin invite codes and their usage.
- **Key Columns**:
  - `invite_code` (uuid, PK)
  - `role` (USER-DEFINED)
  - `used` (boolean)
  - `created_at`

### 4. admin_quest_categories
- **Purpose**: Categories for quests.
- **Key Columns**:
  - `id` (int, PK)
  - `name` (unique)
  - `description`, `created_by`, `created_at`, `updated_at`
- **Relationships**:
  - `created_by` FK to `admin_user_profiles(id)`

### 5. admin_quests
- **Purpose**: Main quest table.
- **Key Columns**:
  - `id` (int, PK)
  - `title`, `description`, `category_id`, `xp_reward`, `multiplier`, `multiplier_start`, `multiplier_end`, `partner_id`, `created_by`, `start_at`, `end_at`, `is_active`, `prerequisites` (int[]), `meta` (jsonb), `comments`, `created_at`, `updated_at`
- **Relationships**:
  - `category_id` FK to `admin_quest_categories(id)`
  - `created_by` FK to `admin_user_profiles(id)`

### 6. admin_quest_submissions
- **Purpose**: User submissions for quests.
- **Key Columns**:
  - `id` (int, PK)
  - `quest_id`, `user_address`, `proof_url`, `proof_data` (jsonb), `submitted_at`, `status` (USER-DEFINED), `reviewed_by`, `reviewed_at`, `review_notes`
- **Relationships**:
  - `quest_id` FK to `admin_quests(id)`
  - `user_address` FK to `users(address)`

### 7. admin_user_xp_history
- **Purpose**: Tracks XP changes for users.
- **Key Columns**:
  - `id` (int, PK)
  - `user_address`, `change`, `reason`, `submission_id`, `created_at`
- **Relationships**:
  - `user_address` FK to `users(address)`
  - `submission_id` FK to `admin_quest_submissions(id)`

### 8. admin_xp_levels
- **Purpose**: XP level definitions.
- **Key Columns**:
  - `level` (int, PK)
  - `name`, `xp_min`, `xp_max`, `color_hex`

### 9. user_logins
- **Purpose**: Tracks user login events.
- **Key Columns**:
  - `id` (uuid, PK)
  - `address`, `login_date`, `created_at`
- **Relationships**:
  - `address` FK to `users(address)`

### 10. user_score_history
- **Purpose**: Tracks user score snapshots over time.
- **Key Columns**:
  - `id` (uuid, PK)
  - `address`, `snapshot_date`, `score`, `title`, `xp_points`, `created_at`
- **Relationships**:
  - `address` FK to `users(address)`

### 11. user_streaks
- **Purpose**: Tracks user login streaks.
- **Key Columns**:
  - `address` (PK, FK to users)
  - `current_streak`, `last_login_date`, `updated_at`

---

## Relationships Overview
- **users** is the central table, referenced by most others via `address` or `id`.
- **admin_user_profiles** extends user info for admins, with roles and partner info.
- **admin_quests** and **admin_quest_categories** organize quests and their categories.
- **admin_quest_submissions** and **admin_user_xp_history** track user participation and XP changes.
- **user_logins**, **user_score_history**, and **user_streaks** track user activity and progress.

---

## Notes
- USER-DEFINED types (enums) are referenced but not defined here. Ensure to update this map if you add or change enums.
- All timestamps use time zone for consistency.
- Foreign key constraints enforce data integrity across tables.

---

_Keep this file updated with any schema changes!_ 