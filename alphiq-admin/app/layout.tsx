import '@/app/globals.css'
import { AuthProvider } from '@/components/auth-provider'

export const metadata = {
  title: 'AlphIQ Admin',
  description: 'Admin panel for AlphIQ'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
