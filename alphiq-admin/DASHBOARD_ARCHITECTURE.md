# Dashboard Architecture

## Overview

The dashboard has been completely refactored to use dynamic data from the database instead of hardcoded values. The new architecture is modular, maintainable, and easily extensible.

## Architecture Components

### 1. API Layer (`/app/api/dashboard/metrics/route.ts`)
- **Purpose**: Fetches all dashboard data from the database
- **Features**: 
  - Parallel data fetching for better performance
  - Comprehensive error handling
  - Data processing and formatting
- **Data Sources**:
  - `admin_quests` - Active quests count
  - `admin_quest_submissions` - Submission statistics and recent activity
  - `admin_user_xp_history` - XP distribution and trends
  - `users` - Top users by XP
  - `admin_quests` - Partner statistics

### 2. Custom Hook (`/hooks/useDashboardData.ts`)
- **Purpose**: Manages data fetching, loading states, and error handling
- **Features**:
  - Automatic refresh every 5 minutes (configurable)
  - Loading and error states
  - Manual refresh capability
- **Returns**: `{ data, loading, error, refetch }`

### 3. Reusable Components

#### Core Components
- **`MetricsCard`**: Displays KPI metrics with icons and change indicators
- **`ChartCard`**: Wrapper for all chart components with consistent styling
- **`ErrorBoundary`**: Handles errors gracefully with retry functionality
- **`LoadingSkeleton`**: Shows loading state while data is being fetched

#### Chart Components
- **`XPChart`**: Area chart for XP distribution trends
- **`SubmissionsChart`**: Pie chart for submission status distribution
- **`TopUsersChart`**: Horizontal bar chart for top users by XP
- **`TopPartnersChart`**: Bar chart for partner statistics

#### Data Components
- **`RecentActivity`**: Displays latest system events

### 4. Utility Functions (`/lib/dashboard-utils.ts`)
- **`formatNumber()`**: Formats large numbers (K, M suffixes)
- **`formatXP()`**: Formats XP values
- **`formatTime()`**: Formats time values (hours, minutes, days)
- **`getChangeIndicator()`**: Calculates change percentages and indicators

## Data Flow

1. **Dashboard Page** → Uses `useDashboardData` hook
2. **Hook** → Fetches data from `/api/dashboard/metrics`
3. **API** → Queries database and processes data
4. **Components** → Receive data and render accordingly

## Adding New Metrics

### 1. Add to API
```typescript
// In /app/api/dashboard/metrics/route.ts
const newMetricResult = await supabase
  .from('your_table')
  .select('your_fields')

// Process the data
const newMetric = processNewMetric(newMetricResult.data)

// Add to return object
return NextResponse.json({
  success: true,
  data: {
    // ... existing data
    newMetric
  }
})
```

### 2. Update Type Definitions
```typescript
// In /hooks/useDashboardData.ts
export interface DashboardMetrics {
  // ... existing properties
  newMetric: NewMetricType
}
```

### 3. Create Component
```typescript
// In /components/dashboard/NewMetricComponent.tsx
interface NewMetricComponentProps {
  data: NewMetricType
}

export function NewMetricComponent({ data }: NewMetricComponentProps) {
  // Your component logic
}
```

### 4. Use in Dashboard
```typescript
// In dashboard page
<NewMetricComponent data={data.newMetric} />
```

## Performance Optimizations

1. **Parallel Data Fetching**: All database queries run simultaneously
2. **Automatic Refresh**: Data refreshes every 5 minutes (configurable)
3. **Loading States**: Smooth transitions between data states
4. **Error Boundaries**: Graceful error handling without breaking the UI

## Error Handling

- **API Errors**: Caught and returned with meaningful messages
- **Network Errors**: Displayed with retry functionality
- **Data Validation**: Ensures data integrity before rendering
- **Fallback States**: Shows appropriate messages when data is unavailable

## Styling

- **Consistent Design**: All components use the same glass-card styling
- **Responsive Layout**: Grid system adapts to different screen sizes
- **Theme Integration**: Uses CSS variables for consistent theming
- **Hover Effects**: Interactive elements with smooth transitions

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live data
2. **Advanced Filtering**: Date ranges, user roles, partner filtering
3. **Export Functionality**: CSV/PDF export of dashboard data
4. **Custom Dashboards**: User-configurable dashboard layouts
5. **Performance Metrics**: Query optimization and caching strategies

## Environment Variables

Ensure these are set in your `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Database Schema Requirements

The dashboard expects these tables with specific structures:
- `admin_quests` - Quest information and status
- `admin_quest_submissions` - User submissions and reviews
- `admin_user_xp_history` - XP transaction history
- `users` - User profiles and XP totals
- `admin_user_profiles` - Admin user information

## Testing

1. **API Testing**: Test `/api/dashboard/metrics` endpoint
2. **Component Testing**: Test individual dashboard components
3. **Integration Testing**: Test complete dashboard functionality
4. **Error Testing**: Test error scenarios and edge cases

## Troubleshooting

### Common Issues
1. **No Data Displayed**: Check database connections and table structures
2. **Charts Not Rendering**: Verify data format matches component expectations
3. **Performance Issues**: Check database query optimization
4. **Styling Issues**: Ensure CSS variables are properly defined

### Debug Steps
1. Check browser console for errors
2. Verify API endpoint responses
3. Check database table structures
4. Validate environment variables
