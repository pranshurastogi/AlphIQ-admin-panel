# AlphIQ Admin Panel — Working Flow (as of current state)

## 1. Authentication & Session Management
- **Supabase Auth** is used for authentication (email/password).
- The app is wrapped in an `<AuthProvider>` which:
  - Checks for an existing session on mount.
  - Listens for auth state changes and updates the user/session/profile context.
  - Fetches the admin profile from the `admin_user_profiles` table after login.
- **Session state** is available via the `useAuth` hook, providing `user`, `profile`, `session`, and `loading`.
- If the user is not logged in or not approved, they are shown the login form or a pending approval message.

## 2. Registration & Onboarding
- **Standard Registration**
  - Accessible at `/admin/register`.
  - User provides email, password, full name, role (sub_admin/moderator/viewer), and partner name.
  - On successful sign up:
    - A Supabase Auth user is created.
    - An entry is inserted into `admin_user_profiles` (with `approved: false`).
    - User must be approved by a super_admin before accessing the dashboard.
- **Invite-based Super Admin Onboarding**
  - Special invite links (e.g., `/admin/invite/[id]`) allow onboarding of super_admins.
  - The invite code is validated (not used, not expired, matches RLS policy).
  - On success, a super_admin profile is created and the user is logged in.

## 3. Login Flow
- **Login page** at `/admin/login`.
- User enters email and password.
- On success:
  - User is redirected to `/dashboard`.
  - The session and profile are loaded into context.
- If login fails, an error is shown.

## 4. Password Reset
- **Forgot password** link on login page.
- User enters email, receives a reset link from Supabase.
- After reset, user is redirected to `/admin/login`.

## 5. Dashboard Access & Layout
- All dashboard routes are under `/dashboard` (e.g., `/dashboard/quests`, `/dashboard/users`).
- The dashboard layout checks:
  - If `loading`, shows a spinner.
  - If not logged in or no profile, shows the login form.
  - If not approved, shows a pending approval message.
  - If all good, renders the dashboard UI.
- The dashboard UI includes:
  - **Sidebar** with navigation (items shown/hidden based on permissions).
  - **Header** with user info, environment badge, and dropdown menu.

## 6. Role-Based Access & Permissions
- Roles: `super_admin`, `sub_admin`, `moderator`, `viewer`.
- Permissions are checked via `hasPermission(permission: string)` from context.
- Sidebar and dashboard features are conditionally rendered based on role permissions.
- Only approved users can access dashboard features.

## 7. Logout Flow
- **Logout** is available in both the sidebar (red button) and header dropdown.
- On logout:
  - Session and profile are cleared from context.
  - User is redirected to `/admin/login`.

## 8. Error Handling & Edge Cases
- RLS (Row Level Security) errors are handled and surfaced to the user.
- All forms show clear error/success/loading states.
- Debug code has been removed for production readiness.

## 9. Technical Notes
- Uses Next.js App Router (`app/` directory structure).
- All UI uses custom and shadcn/ui components for a modern, consistent look.
- Supabase client is initialized in `lib/supabaseClient.ts`.
- All auth/session/profile logic is centralized in `components/auth-provider.tsx`.

---

**This document reflects the current working state of the AlphIQ admin panel, including all major flows and technical details.** 