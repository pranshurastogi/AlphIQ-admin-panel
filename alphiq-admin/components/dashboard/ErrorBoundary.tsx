import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  error: string | null
  onRetry: () => void
  children: React.ReactNode
}

export function ErrorBoundary({ error, onRetry, children }: ErrorBoundaryProps) {
  if (error) {
    return (
      <Alert className="border-red-500/20 bg-red-500/10">
        <RefreshCw className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Error loading dashboard data: {error}</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="ml-4"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return <>{children}</>
}
