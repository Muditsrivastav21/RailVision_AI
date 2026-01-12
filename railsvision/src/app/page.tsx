import { redirect } from 'next/navigation'

export default function RootRedirect() {
  // Remove the Live Ingestion page and land directly on the System Dashboard
  redirect('/dashboard')
}
