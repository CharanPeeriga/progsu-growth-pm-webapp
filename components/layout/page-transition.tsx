"use client";
import { usePathname } from "next/navigation";

/**
 * CSS-only page transition. The previous version wrapped every page in
 * framer-motion's AnimatePresence with mode="wait", which kept the outgoing
 * page mounted for its exit animation before mounting the new one — so each
 * navigation paid an extra unmount/mount cycle plus ~160ms of dead time before
 * the new page began rendering. `key` alone re-mounts on route change; the
 * class runs one compositor-only opacity fade.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-fade-in">
      {children}
    </div>
  );
}
