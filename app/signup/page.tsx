import { redirect } from 'next/navigation'

// O registo público foi desativado: só a administração da plataforma
// cria contas de restaurante (ver /admin) e entrega as credenciais ao cliente.
export default function SignupPage() {
  redirect('/login')
}
