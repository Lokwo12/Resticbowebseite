# User Management Dashboard Guide

## Overview
A comprehensive User Management system has been added to your admin dashboard, accessible only to Super Admins. This powerful tool allows you to manage all aspects of user accounts with ease.

## Features Implemented

### 1. **User CRUD Operations**
- ✅ Create new users with custom roles and permissions
- ✅ Edit existing user details (name, email, role, status)
- ✅ Delete users (with confirmation)
- ✅ View detailed user information

### 2. **Role Management (4-Tier System)**
The system includes 4 distinct roles:

- **Super Admin**: Full access to everything including user management
- **Admin**: Manage content and users (but not other admins)
- **Editor**: Manage content only (programs, news, etc.)
- **Viewer**: View-only access (no editing permissions)

### 3. **Advanced Filtering & Search**
- Search by name or email (real-time)
- Filter by status (Active, Inactive, Suspended)
- Filter by role (Super Admin, Admin, Editor, Viewer)
- Clear all filters with one click

### 4. **Bulk Actions**
Perform actions on multiple users at once:
- Change role for multiple users
- Update status for multiple users
- Delete multiple users
- Select/deselect users easily

### 5. **User Status Management**
Three status levels:
- **Active**: Can login and perform actions
- **Inactive**: Cannot login
- **Suspended**: Temporarily blocked

### 6. **Password Management**
- Set initial password when creating user
- Reset password for existing users
- Automatic email notification on password reset
- Minimum 8 characters requirement

### 7. **User Analytics**
- View count of users by role
- Track last login date
- Monitor login count
- See user creation date

### 8. **Email Notifications**
Automatic emails sent for:
- Welcome email on user creation
- Password reset notification
- Includes login credentials and dashboard link

## How to Access

1. Login as a **Super Admin**
2. Navigate to the Admin Dashboard
3. Click on the **"Users"** tab in the navigation

> **Note**: Only Super Admins can see and access the User Management tab.

## User Interface Features

### Dashboard Stats Cards
Four cards showing user counts by role, with color-coded badges and role descriptions.

### Search & Filter Bar
- **Search field**: Type to filter by name or email instantly
- **Status dropdown**: Filter by user status
- **Role dropdown**: Filter by user role
- **Clear Filters button**: Reset all filters at once

### User Cards
Each user card displays:
- Checkbox for bulk selection
- User name and email
- Status badge (color-coded)
- Role badge (color-coded by permission level)
- Creation date
- Last login date
- Login count
- User ID (for reference)
- Action buttons (Edit, Reset Password, Delete)

### Bulk Action Bar
Appears when users are selected:
- Dropdown to change role
- Dropdown to change status
- Delete selected button
- Clear selection button

## Common Tasks

### Create a New User
1. Click "Add User" button
2. Fill in:
   - Full Name
   - Email Address
   - Password (min 8 characters)
   - Role (select from dropdown)
   - Status (Active/Inactive/Suspended)
3. Click "Create User"
4. User receives welcome email automatically

### Edit User Details
1. Find the user in the list
2. Click "Edit" button
3. Modify any field except password
4. Click "Update User"

### Reset User Password
1. Find the user in the list
2. Click "Reset Password" button
3. Enter new password (min 8 characters)
4. Click "Reset Password"
5. User receives email notification

### Delete a User
1. Find the user in the list
2. Click the delete (trash) icon
3. Confirm the deletion
4. User is permanently removed from both Auth and database

### Bulk Update Roles
1. Select users using checkboxes
2. Choose new role from "Change Role..." dropdown
3. Confirm the action
4. All selected users updated

### Bulk Update Status
1. Select users using checkboxes
2. Choose new status from "Change Status..." dropdown
3. Confirm the action
4. All selected users updated

## Security Features

- ✅ Only Super Admins can access User Management
- ✅ All actions require Super Admin role verification
- ✅ Confirmation dialogs for destructive actions
- ✅ Password minimum length enforcement
- ✅ Email confirmation on user creation
- ✅ Secure password hashing (handled by Supabase Auth)

## API Endpoints Used

All endpoints are under `/make-server-2a4be611/admin/users/`:

- `GET /admin/users` - Fetch all users
- `POST /admin/users` - Create new user
- `PUT /admin/users/:id` - Update user
- `DELETE /admin/users/:id` - Delete user
- `POST /admin/users/bulk-status` - Bulk update status
- `POST /admin/users/bulk-role` - Bulk update roles
- `POST /admin/users/bulk-delete` - Bulk delete users
- `POST /admin/users/:id/reset-password` - Reset password

## Best Practices

1. **Regular Audits**: Review user list regularly and remove inactive accounts
2. **Role Assignment**: Give users the minimum role needed for their tasks
3. **Strong Passwords**: Use strong passwords (consider 12+ characters)
4. **Status Management**: Set users to "Inactive" rather than deleting if they may return
5. **Email Notifications**: Ensure Resend API is configured for email notifications

## Troubleshooting

### Can't see Users tab
- Ensure you're logged in as a Super Admin
- Check your user role in the database

### Password reset not working
- Ensure new password is at least 8 characters
- Check that Resend API key is configured

### Email notifications not sending
- Verify RESEND_API_KEY environment variable is set
- Check server logs for email errors
- Configure your domain in Resend dashboard

### Users not loading
- Check browser console for errors
- Verify Supabase connection
- Check server logs

## Color Coding Reference

### Status Badges
- **Green (Active)**: User can login and work normally
- **Gray (Inactive)**: User account is disabled
- **Orange (Suspended)**: User temporarily blocked

### Role Badges
- **Red Border (Super Admin)**: Full system access
- **Blue Border (Admin)**: Content and user management
- **Purple Border (Editor)**: Content management only
- **Gray Border (Viewer)**: Read-only access

## Screenshots Reference

The User Management interface includes:
1. Header with title and "Add User" button
2. Filter bar with search and dropdowns
3. Role statistics cards
4. Bulk action bar (when users selected)
5. User cards with all details and actions
6. Pagination info at bottom
7. User form dialog (create/edit)
8. Password reset dialog

## Summary

The User Management Dashboard is a comprehensive, production-ready solution that provides:
- Complete CRUD operations
- Advanced filtering and search
- Bulk actions for efficiency
- Role-based access control
- Email notifications
- Secure password management
- Clean, intuitive UI
- Real-time updates

Perfect for managing your organization's admin users with ease and security!
