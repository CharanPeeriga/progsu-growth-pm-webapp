"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { T, EASE } from "@/lib/motion";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setLoading(false);

      if (authError) {
        if (authError.message?.toLowerCase().includes("invalid login credentials")) {
          setError("That email and password do not match an account.");
        } else {
          setError("Something went wrong signing in. Try again.");
        }
        return;
      }

      router.push("/tasks");
      router.refresh();
    } catch {
      setLoading(false);
      setError("Something went wrong signing in. Try again.");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(46% 38% at 50% 34%, rgba(107,138,253,0.22) 0%, rgba(107,138,253,0) 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: T.modal, ease: EASE }}
        className="relative z-[3] w-full max-w-[400px]"
      >
        <div className="mb-8 flex flex-col items-center gap-4">
          <motion.span
            initial={{ scale: 0.94 }}
            animate={{ scale: 1 }}
            transition={{ duration: T.modal, delay: 0.08, ease: EASE }}
            className="grid size-12 place-items-center rounded-[14px] font-display text-[22px] font-semibold text-[#060911]"
            style={{
              backgroundImage: "var(--grad-btn)",
              boxShadow:
                "0 8px 28px -8px rgba(107,138,253,0.75), 0 1px 0 0 rgba(255,255,255,0.22) inset",
            }}
          >
            p
          </motion.span>
          <div className="flex flex-col items-center gap-1.5">
            <h1 className="t-display t-grad">Welcome back</h1>
            <p className="t-body-sm text-[#A7B0C0]">Sign in to the progsu task manager.</p>
          </div>
        </div>

        <div className="surface-card halo-accent p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label className="t-label text-[#A7B0C0] mb-1.5 block">Email</Label>
              <Input
                type="email"
                placeholder="you@student.gsu.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="t-label text-[#A7B0C0]">Password</Label>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-9"
                />
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="iconSm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-[#6E7686] hover:text-[#E8EBF2]"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      />
                    }
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    {showPassword ? "Hide password" : "Show password"}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 rounded-control border border-[rgba(239,68,68,0.28)] bg-[rgba(239,68,68,0.10)] px-3 py-2.5 t-body-sm text-[#FCA5A5]"
              >
                <AlertCircle className="size-[15px] shrink-0 mt-0.5" />
                {error}
              </motion.div>
            )}

            <Button type="submit" size="lg" className="w-full mt-1" loading={loading}>
              {loading ? "Signing in" : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center t-caption text-[#4E5665]">
          Access is managed by the exec board. Ask a VP if you need an account.
        </p>
      </motion.div>
    </div>
  );
}
