# Submissions Management Feature

## Overview

The Submissions Management feature provides a comprehensive admin interface for reviewing and managing quest submissions from users. It includes role-based access control, real-time updates, and a world-class UI.

## Security Model

### Role-Based Access Control

The system implements strict role-based access control:

1. **Super Admin (`super_admin`)**
   - Can view ALL submissions across all quests
   - Can approve/reject ANY submission
   - Has full administrative privileges

2. **Sub Admin (`sub_admin`)**
   - Can only view submissions for quests they created
   - Can only approve/reject submissions for their own quests
   - Cannot access submissions from other admins

3. **Moderator (`moderator`)**
   - Can only view submissions for quests they created
   - Can only approve/reject submissions for their own quests
   - Limited to their own quest submissions

4. **Viewer (`viewer`)**
   - Can only view submissions for quests they created
   - Cannot approve/reject submissions
   - Read-only access to their own quest submissions

### Security Features

- **API-Level Security**: All operations go through secure API routes with proper authentication
- **Database-Level Security**: Row-level security ensures users can only access their own data
- **Token-Based Authentication**: Uses Supabase JWT tokens for secure API calls
- **Permission Validation**: Server-side validation of all permissions before any operation

## Database Schema

### Core Tables

```sql
-- Submissions table
CREATE TABLE public.admin_quest_submissions (
  id serial not null,
  quest_id integer not null,
  user_address text not null,
  proof_url text not null,
  proof_data jsonb null,
  submitted_at timestamp with time zone not null default now(),
  status public.admin_submission_status not null default 'pending'::admin_submission_status,
  reviewed_by uuid null,
  reviewed_at timestamp with time zone null,
  review_notes text null,
  constraint admin_quest_submissions_pkey primary key (id),
  constraint admin_quest_submissions_quest_id_fkey foreign KEY (quest_id) references admin_quests (id) on delete CASCADE,
  constraint admin_quest_submissions_user_address_fkey foreign KEY (user_address) references users (address) on delete CASCADE
);

-- Indexes for performance
CREATE INDEX idx_admin_submissions_by_user ON public.admin_quest_submissions (user_address);
CREATE INDEX idx_admin_submissions_by_status ON public.admin_quest_submissions (status);
CREATE INDEX idx_admin_submissions_by_date ON public.admin_quest_submissions (submitted_at);
```

## Features

### 1. Dashboard Overview
- **Statistics Cards**: Real-time counts of total, pending, approved, and rejected submissions
- **Visual Indicators**: Color-coded status badges with icons
- **Refresh Functionality**: Manual refresh button with loading states

### 2. Advanced Filtering & Search
- **Search by User**: Search submissions by user wallet address
- **Search by Quest**: Search submissions by quest title
- **Status Filtering**: Filter by pending, approved, or rejected status
- **Real-time Filtering**: Instant results as you type

### 3. Submission Review Interface
- **Detailed View**: Comprehensive submission details in a slide-out panel
- **Proof Viewer**: Built-in proof URL viewer with external link support
- **Proof Data Display**: JSON data viewer for complex proof structures
- **Review Notes**: Rich text area for detailed review comments

### 4. Batch Operations
- **Multi-Select**: Checkbox selection for multiple submissions
- **Batch Approve**: Approve multiple submissions at once
- **Batch Reject**: Reject multiple submissions at once
- **Progress Indicators**: Loading states during batch operations

### 5. Role-Based Actions
- **Conditional Buttons**: Approve/reject buttons only show for authorized users
- **Permission Checks**: Server-side validation of all actions
- **Audit Trail**: Complete tracking of who reviewed what and when

## API Endpoints

### GET /api/admin/submissions
Fetches submissions based on user role and permissions.

**Response:**
```json
{
  "submissions": [
    {
      "id": 1,
      "quest_id": 123,
      "user_address": "0x1234...5678",
      "proof_url": "https://example.com/proof",
      "proof_data": { "transaction": "0xabc..." },
      "submitted_at": "2024-01-20T10:30:00Z",
      "status": "pending",
      "reviewed_by": null,
      "reviewed_at": null,
      "review_notes": null,
      "quest": {
        "id": 123,
        "title": "Complete DeFi Swap",
        "description": "Swap tokens on Uniswap",
        "xp_reward": 500,
        "multiplier": 1.5,
        "category": { "id": 1, "name": "DeFi" }
      },
      "reviewer": null
    }
  ]
}
```

### PATCH /api/admin/submissions
Updates a single submission with review status and notes.

**Request:**
```json
{
  "submissionId": 1,
  "status": "approved",
  "reviewNotes": "Valid proof submitted"
}
```

### PATCH /api/admin/submissions/batch
Updates multiple submissions in batch.

**Request:**
```json
{
  "submissionIds": [1, 2, 3],
  "status": "approved"
}
```

## UI Components

### 1. Statistics Cards
- **Total Submissions**: Blue card with trophy icon
- **Pending Submissions**: Yellow card with clock icon
- **Approved Submissions**: Green card with check icon
- **Rejected Submissions**: Red card with X icon

### 2. Submission Table
- **User Column**: Avatar with truncated wallet address
- **Quest Column**: Title and description with truncation
- **Category Column**: Badge showing quest category
- **Date Column**: Formatted submission date with calendar icon
- **Proof Column**: Type indicator with preview button
- **XP Column**: Reward amount with multiplier badge
- **Status Column**: Color-coded status badge with icon
- **Actions Column**: Review buttons based on permissions

### 3. Review Panel
- **User Information**: Full wallet address with copy functionality
- **Quest Details**: Complete quest information including description
- **Proof Viewer**: URL display with external link button
- **Proof Data**: JSON viewer for complex proof structures
- **Review Notes**: Rich text area for detailed comments
- **Review History**: Shows who reviewed and when (for completed reviews)
- **Action Buttons**: Approve/reject buttons with loading states

## Error Handling

### Client-Side Error Handling
- **Network Errors**: Graceful handling of API failures
- **Permission Errors**: Clear messaging for unauthorized actions
- **Validation Errors**: Real-time validation feedback
- **Loading States**: Proper loading indicators for all operations

### Server-Side Error Handling
- **Authentication Errors**: 401 for invalid tokens
- **Permission Errors**: 403 for insufficient permissions
- **Validation Errors**: 400 for invalid request data
- **Database Errors**: 500 for server-side issues

## Performance Optimizations

### 1. Database Indexes
- User address index for quick user lookups
- Status index for status-based filtering
- Date index for chronological sorting

### 2. Client-Side Optimizations
- **Debounced Search**: Prevents excessive API calls during typing
- **Local State Management**: Optimistic updates for better UX
- **Virtual Scrolling**: Ready for large datasets (future enhancement)

### 3. API Optimizations
- **Efficient Queries**: Single query with joins for all data
- **Role-Based Filtering**: Database-level filtering for security
- **Pagination Ready**: Structure supports pagination (future enhancement)

## Usage Examples

### For Super Admins
1. Navigate to Submissions page
2. View all submissions across all quests
3. Use search and filters to find specific submissions
4. Click "View" to see detailed submission information
5. Add review notes and approve/reject as needed
6. Use batch operations for multiple submissions

### For Sub Admins/Moderators
1. Navigate to Submissions page
2. View only submissions for quests you created
3. Search and filter within your submissions
4. Review and approve/reject your quest submissions
5. Cannot access submissions from other admins

### For Viewers
1. Navigate to Submissions page
2. View only submissions for quests you created
3. Read-only access - no approve/reject buttons
4. Can view detailed submission information

## Security Checklist

- [x] Role-based access control implemented
- [x] Server-side permission validation
- [x] API-level authentication
- [x] Database-level security
- [x] Input validation and sanitization
- [x] Error handling without information leakage
- [x] Audit trail for all actions
- [x] Secure token-based authentication
- [x] Protection against unauthorized access
- [x] Proper error messages without sensitive data

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live updates
2. **Advanced Filtering**: Date range, category, XP range filters
3. **Export Functionality**: CSV/Excel export of submission data
4. **Bulk Import**: Batch import of submissions
5. **Notification System**: Email/SMS notifications for new submissions
6. **Analytics Dashboard**: Detailed submission analytics
7. **Mobile Optimization**: Responsive design for mobile devices
8. **Offline Support**: PWA capabilities for offline review 