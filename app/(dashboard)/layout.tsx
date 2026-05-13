import { redirect } from "next/navigation"
import { Navbar } from "@/components/Navbar"
import { createServerSupabase } from "@/lib/supabase-server"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar email={user.email ?? null} />
      <div className="md:pl-64">
        <main className="px-6 py-8 md:px-10 md:py-10 max-w-[1400px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
