"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, ChevronDown, ChevronRight, UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  fetchAllTasks,
  fetchTeamMembers,
  addTeamMember,
  removeTeamMember,
} from "@/lib/supabase";
import type { DBTask, TeamMember } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const GUILD_ID = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID ?? "";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 },
  },
};

function isOverdue(t: DBTask): boolean {
  if (!t.due_date || t.status === "done") return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return new Date(t.due_date + "T00:00:00") < now;
}

export default function TeamPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<DBTask[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [rosterExpanded, setRosterExpanded] = useState(false);

  const [newUserId, setNewUserId] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [adding, setAdding] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [t, m] = await Promise.all([
        fetchAllTasks(GUILD_ID),
        fetchTeamMembers(GUILD_ID),
      ]);
      setTasks(t);
      setMembers(m);
    } catch {
      toast.error("Failed to load team data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const memberUserIds = useMemo(
    () => new Set(members.map((m) => m.user_id)),
    [members]
  );

  const memberStats = useMemo(() => {
    const map = new Map<
      string,
      { completed: number; pending: number; inReview: number; overdue: number }
    >();
    for (const m of members) {
      map.set(m.user_id, { completed: 0, pending: 0, inReview: 0, overdue: 0 });
    }
    for (const t of tasks) {
      if (!map.has(t.assignee_id)) continue;
      const s = map.get(t.assignee_id)!;
      if (t.status === "done") s.completed++;
      else if (t.status === "review") s.inReview++;
      else if (isOverdue(t)) s.overdue++;
      else s.pending++;
    }
    return map;
  }, [members, tasks]);

  const tasksWithoutMember = useMemo(
    () => tasks.filter((t) => !memberUserIds.has(t.assignee_id)),
    [tasks, memberUserIds]
  );

  const uniqueUnregistered = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasksWithoutMember) {
      map.set(t.assignee_id, (map.get(t.assignee_id) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([id, count]) => ({ id, count }));
  }, [tasksWithoutMember]);

  const totalTasks = tasks.length;
  const totalCompleted = tasks.filter((t) => t.status === "done").length;
  const completionRate =
    totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim()) return;
    setAdding(true);
    try {
      await addTeamMember(GUILD_ID, newUserId.trim(), newDisplayName.trim());
      toast.success("✅ Member added");
      setNewUserId("");
      setNewDisplayName("");
      await loadAll();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (
        msg.toLowerCase().includes("duplicate") ||
        msg.toLowerCase().includes("unique")
      ) {
        toast.warning("⚠️ Already on the team");
      } else {
        toast.error(`Failed to add member: ${msg}`);
      }
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeTeamMember(GUILD_ID, userId);
      toast.success("Removed from team");
      await loadAll();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to remove: ${msg}`);
    }
  };

  const handleAddUnregistered = async (userId: string) => {
    try {
      await addTeamMember(GUILD_ID, userId, "");
      toast.success("✅ Member added");
      await loadAll();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (
        msg.toLowerCase().includes("duplicate") ||
        msg.toLowerCase().includes("unique")
      ) {
        toast.warning("⚠️ Already on the team");
      } else {
        toast.error(`Failed to add: ${msg}`);
      }
    }
  };

  return (
    <div className="space-y-6 page-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Team</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {members.length} official member{members.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Add Member */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <UserPlus size={16} />
          Add Member
        </h2>
        <form
          onSubmit={handleAddMember}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Discord User ID *
            </Label>
            <Input
              placeholder="e.g. 123456789012345678"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              required
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Display Name (optional)
            </Label>
            <Input
              placeholder="e.g. John Doe"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              className="h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              disabled={adding}
            >
              {adding ? "Adding…" : "Add Member"}
            </Button>
          </div>
        </form>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Members", value: members.length },
          { label: "Total Tasks", value: totalTasks },
          { label: "Completion Rate", value: `${completionRate}%` },
        ].map(({ label, value }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" as const, stiffness: 100, damping: 15 }}
            className="bg-card border border-border rounded-xl p-6 shadow-sm"
          >
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Member cards */}
      {loading ? (
        <div className="text-muted-foreground text-sm py-16 text-center">
          Loading…
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Users size={40} className="mb-3 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">No team members</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Add members using the form above</p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {members.map((m) => {
            const stats = memberStats.get(m.user_id) ?? {
              completed: 0,
              pending: 0,
              inReview: 0,
              overdue: 0,
            };
            return (
              <motion.div
                key={m.id}
                variants={itemVariants}
                className="bg-card border border-border rounded-xl p-6 shadow-sm hover:bg-muted/30 transition-colors"
              >
                <p className="font-medium text-sm text-foreground truncate mb-0.5">
                  {m.display_name || m.user_id}
                </p>
                <p className="text-xs text-muted-foreground font-mono mb-4 truncate">
                  {m.user_id}
                </p>
                <div className="space-y-1.5 text-sm mb-5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">✅ Completed</span>
                    <span className="text-green-400 font-medium">
                      {stats.completed}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">🔵 Pending</span>
                    <span className="text-foreground font-medium">
                      {stats.pending}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">⏳ In Review</span>
                    <span className="text-purple-400 font-medium">
                      {stats.inReview}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">⚠️ Overdue</span>
                    <span
                      className={cn(
                        "font-medium",
                        stats.overdue > 0
                          ? "text-red-400"
                          : "text-muted-foreground"
                      )}
                    >
                      {stats.overdue}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-border text-primary hover:bg-primary/10 hover:border-primary"
                    onClick={() =>
                      router.push(
                        `/tasks?search=${encodeURIComponent(m.user_id)}`
                      )
                    }
                  >
                    View Tasks
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive"
                    onClick={() => handleRemoveMember(m.user_id)}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Tasks without team member */}
      {uniqueUnregistered.length > 0 && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => setRosterExpanded(!rosterExpanded)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-muted/30 transition-colors"
          >
            <span className="text-sm font-medium text-muted-foreground">
              {tasksWithoutMember.length} task
              {tasksWithoutMember.length !== 1 ? "s" : ""} assigned to people
              not on the official roster
            </span>
            {rosterExpanded ? (
              <ChevronDown size={16} className="text-muted-foreground" />
            ) : (
              <ChevronRight size={16} className="text-muted-foreground" />
            )}
          </button>
          {rosterExpanded && (
            <div className="border-t border-border divide-y divide-border">
              {uniqueUnregistered.map(({ id, count }) => (
                <div
                  key={id}
                  className="flex items-center justify-between px-6 py-3"
                >
                  <div>
                    <p className="text-sm font-mono text-foreground">{id}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {count} task{count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-primary/50 text-primary hover:bg-primary/10"
                    onClick={() => handleAddUnregistered(id)}
                  >
                    Add to Team
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
