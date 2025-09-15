import { RegisterForm } from '@/components/RegisterForm'

export default function RegisterPage() {
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #1B1B1F 0%, #FF8A65 30%, #00E6B0 70%, #1B1B1F 100%)',
      minHeight: '100vh',
      margin: 0,
      padding: 0
    }}>
      <RegisterForm />
    </div>
  )
}
