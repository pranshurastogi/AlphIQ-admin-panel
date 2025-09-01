# Dashboard Setup Guide

## Environment Configuration

Create a `.env.local` file in your project root with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Service Role Key (for admin operations)
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Database Setup

Ensure your Supabase database has the following tables with the correct structure:

### Required Tables

1. **`admin_quests`**
   - `id` (integer, primary key)
   - `title` (text)
   - `description` (text)
   - `category_id` (integer, foreign key)
   - `xp_reward` (integer)
   - `is_active` (boolean)
   - `partner_id` (uuid)
   - `created_by` (uuid)
   - `start_at` (date)
   - `end_at` (date)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

2. **`admin_quest_submissions`**
   - `id` (integer, primary key)
   - `quest_id` (integer, foreign key)
   - `user_address` (text)
   - `proof_url` (text)
   - `status` (enum: 'pending', 'approved', 'rejected')
   - `submitted_at` (timestamp)
   - `reviewed_at` (timestamp)
   - `reviewed_by` (uuid)

3. **`admin_user_xp_history`**
   - `id` (integer, primary key)
   - `user_address` (text)
   - `change` (integer)
   - `reason` (text)
   - `submission_id` (integer, foreign key)
   - `created_at` (timestamp)

4. **`users`**
   - `id` (uuid, primary key)
   - `address` (text, unique)
   - `admin_total_xp` (integer)
   - `title` (text)
   - `score` (integer)
   - `joined_at` (timestamp)
   - `updated_at` (timestamp)

5. **`admin_quest_categories`**
   - `id` (integer, primary key)
   - `name` (text, unique)
   - `description` (text)
   - `created_by` (uuid)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

### Optional Tables

6. **`admin_user_profiles`**
   - `id` (uuid, primary key)
   - `full_name` (text)
   - `partner_name` (text)
   - `role` (enum: 'viewer', 'editor', 'admin')
   - `partner_id` (uuid)
   - `approved` (boolean)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

## Row Level Security (RLS)

If you have RLS enabled, ensure the following policies are in place:

```sql
-- Allow read access to quests
CREATE POLICY "Allow read access to quests" ON admin_quests
FOR SELECT USING (true);

-- Allow read access to submissions
CREATE POLICY "Allow read access to submissions" ON admin_quest_submissions
FOR SELECT USING (true);

-- Allow read access to XP history
CREATE POLICY "Allow read access to XP history" ON admin_user_xp_history
FOR SELECT USING (true);

-- Allow read access to users
CREATE POLICY "Allow read access to users" ON users
FOR SELECT USING (true);
```

## Testing the Setup

1. **Start the development server**:
   ```bash
   npm run dev
   # or
   pnpm dev
   # or
   yarn dev
   ```

2. **Navigate to the dashboard**: `http://localhost:3000/dashboard`

3. **Check the API endpoint**: `http://localhost:3000/api/dashboard/metrics`

4. **Verify data loading**: The dashboard should show loading skeletons, then real data

## Troubleshooting

### Common Issues

1. **"No data available" message**
   - Check if your database tables exist and have data
   - Verify environment variables are correct
   - Check browser console for errors

2. **Charts not rendering**
   - Ensure data format matches expected structure
   - Check if Recharts library is properly installed
   - Verify CSS variables are defined

3. **API errors**
   - Check Supabase connection
   - Verify table permissions
   - Check environment variable configuration

4. **Styling issues**
   - Ensure Tailwind CSS is properly configured
   - Check if glass-card classes are defined
   - Verify CSS custom properties

### Debug Steps

1. **Check browser console** for JavaScript errors
2. **Check network tab** for API request failures
3. **Verify environment variables** are loaded correctly
4. **Test database connection** using Supabase dashboard
5. **Check table structures** match the expected schema

## Performance Optimization

1. **Database Indexes**: Add indexes on frequently queried columns
2. **Query Optimization**: Monitor query performance in Supabase
3. **Caching**: Consider implementing Redis or similar caching layer
4. **Pagination**: For large datasets, implement pagination

## Security Considerations

1. **Row Level Security**: Implement appropriate RLS policies
2. **API Rate Limiting**: Consider rate limiting for the metrics endpoint
3. **Data Validation**: Validate all data before processing
4. **Error Handling**: Don't expose sensitive information in error messages
