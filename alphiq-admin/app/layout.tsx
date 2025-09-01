import '@/app/globals.css'
import { AuthProvider } from '@/components/auth-provider'

export const metadata = {
  title: 'AlphIQ Admin',
  description: 'Admin panel for AlphIQ',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
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
