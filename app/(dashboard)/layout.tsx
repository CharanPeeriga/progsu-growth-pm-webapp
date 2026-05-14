import { Navbar } from "@/components/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-8 min-w-0">{children}</main>
    </div>
  );
}
