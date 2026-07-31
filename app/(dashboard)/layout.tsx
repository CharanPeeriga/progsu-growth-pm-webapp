import { Navbar } from "@/components/Navbar";
import { PageTransition } from "@/components/layout/page-transition";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="mx-auto w-full max-w-shell">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
    </div>
  );
}
