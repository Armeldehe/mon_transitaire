import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import FAB from '@/components/layout/FAB'
import { getCurrentUser } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      {/* Sidebar — desktop uniquement */}
      <Sidebar />

      {/* Contenu principal */}
      <div className="md:ml-56 flex flex-col min-h-screen">
        <Header userName={user?.fullName} userRole={user?.role} />

        <main className="flex-1 px-4 py-5 md:px-6 md:py-6 page-content animate-fade-in">
          {children}
        </main>
      </div>

      {/* Navigation mobile */}
      <BottomNav />

      {/* FAB (+) mobile */}
      <FAB />
    </div>
  )
}
