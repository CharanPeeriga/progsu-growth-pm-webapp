"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, ChevronDown, ChevronRight, UserPlus, Trash2, Shield, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  fetchAllTasks,
  fetchTeamMembers,
  addTeamMember,
  removeTeamMember,
  fetchVPRoles,
  addVPRole,
  removeVPRole,
} from "@/lib/supabase";
import type { DBTask, TeamMember, TeamName, VPRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AnimatedDropdown from "@/components/ui/animated-dropdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { TeamBadge, teamTabClass, TEAM_LABELS } from "@/components/ui/team-badge";

const GUILD_ID = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID ?? "";

const TEAM_FILTERS = [
  { value: "all" as const, label: "All" },
  { value: "growth" as const, label: "Growth" },
  { value: "tech" as const, label: "Tech" },
  { value: "operations" as const, label: "Operations" },
  { value: "progirls" as const, label: "Progirls" },
];

const TEAM_OPTIONS = [
  { value: "growth", label: "Growth" },
  { value: "tech", label: "Tech" },
  { value: "operations", label: "Operations" },
  { value: "progirls", label: "Progirls" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } },
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
  const [vpRoles, setVpRoles] = useState<VPRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [rosterExpanded, setRosterExpanded] = useState(false);
  const [teamFilter, setTeamFilter] = useState<"all" | TeamName>("all");

  const [newUserId, setNewUserId] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newMemberTeam, setNewMemberTeam] = useState<TeamName>("growth");
  const [adding, setAdding] = useState(false);

  // VP state — per-team inline add form + removal confirmation
  const [addingVPForTeam, setAddingVPForTeam] = useState<TeamName | null>(null);
  const [addVPUserId, setAddVPUserId] = useState("");
  const [savingVP, setSavingVP] = useState(false);
  const [removingVP, setRemovingVP] = useState<VPRole | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [t, m, vp] = await Promise.all([
        fetchAllTasks(),
        fetchTeamMembers(GUILD_ID),
        fetchVPRoles(),
      ]);
      setTasks(t);
      setMembers(m);
      setVpRoles(vp);
    } catch {
      toast.error("Failed to load team data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.user_id, m])),
    [members]
  );

  const filteredMembers = useMemo(() => {
    if (teamFilter === "all") return members;
    return members.filter((m) => m.team === teamFilter);
  }, [members, teamFilter]);

  const filteredTasks = useMemo(() => {
    if (teamFilter === "all") return tasks;
    return tasks.filter((t) => t.team === teamFilter);
  }, [tasks, teamFilter]);

  const memberUserIds = useMemo(
    () => new Set(members.map((m) => m.user_id)),
    [members]
  );

  const memberStats = useMemo(() => {
    const map = new Map<string, { completed: number; pending: number; inReview: number; overdue: number }>();
    for (const m of filteredMembers) {
      map.set(m.user_id, { completed: 0, pending: 0, inReview: 0, overdue: 0 });
    }
    for (const t of filteredTasks) {
      if (!map.has(t.assignee_id)) continue;
      const s = map.get(t.assignee_id)!;
      if (t.status === "done") s.completed++;
      else if (t.status === "review") s.inReview++;
      else if (isOverdue(t)) s.overdue++;
      else s.pending++;
    }
    return map;
  }, [filteredMembers, filteredTasks]);

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

  const totalTasks = filteredTasks.length;
  const totalCompleted = filteredTasks.filter((t) => t.status === "done").length;
  const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim()) return;
    setAdding(true);
    try {
      await addTeamMember(GUILD_ID, newUserId.trim(), newDisplayName.trim(), newMemberTeam);
      const addedName = newDisplayName.trim() || newUserId.trim();
      toast.success(`✅ ${addedName} added to the progsu Task Management System`);
      setNewUserId("");
      setNewDisplayName("");
      setNewMemberTeam("growth");
      await loadAll();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("unique")) {
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
      toast.error(`Failed to remove: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleAddUnregistered = async (userId: string) => {
    try {
      await addTeamMember(GUILD_ID, userId, "", "growth");
      toast.success("✅ Member added");
      await loadAll();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("unique")) {
        toast.warning("⚠️ Already on the team");
      } else {
        toast.error(`Failed to add: ${msg}`);
      }
    }
  };

  const handleAddVP = async (team: TeamName) => {
    if (!addVPUserId) { toast.error("Select a member"); return; }
    setSavingVP(true);
    try {
      await addVPRole(addVPUserId, team);
      const name = memberMap.get(addVPUserId)?.display_name || addVPUserId;
      toast.success(`✅ ${name} added as VP of ${TEAM_LABELS[team]} team`);
      setAddingVPForTeam(null);
      setAddVPUserId("");
      await loadAll();
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSavingVP(false);
    }
  };

  const handleRemoveVP = async () => {
    if (!removingVP) return;
    try {
      await removeVPRole(removingVP.user_id, removingVP.team);
      const name = memberMap.get(removingVP.user_id)?.display_name || removingVP.user_id;
      toast.success(`✅ ${name} removed as VP of ${TEAM_LABELS[removingVP.team]} team`);
      setRemovingVP(null);
      await loadAll();
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const vpByTeam = useMemo(() => {
    const map = new Map<TeamName, VPRole[]>();
    for (const vp of vpRoles) {
      const list = map.get(vp.team) ?? [];
      list.push(vp);
      map.set(vp.team, list);
    }
    return map;
  }, [vpRoles]);

  return (
    <div className="space-y-6 page-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Team</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {members.length} official member{members.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Team filter tabs */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
        {TEAM_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTeamFilter(value)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              teamFilter === value && value === "all"
                ? "bg-primary text-primary-foreground"
                : teamFilter === value
                ? teamTabClass(value as TeamName, true)
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Add Member */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <UserPlus size={16} />
            Add Member
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Add someone to the progsu Task Management System</p>
        </div>
        <form onSubmit={handleAddMember} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Discord User ID *</Label>
            <Input
              placeholder="e.g. 123456789012345678"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              required
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Display Name (optional)</Label>
            <Input
              placeholder="e.g. John Doe"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Team</Label>
            <AnimatedDropdown
              items={TEAM_OPTIONS}
              value={newMemberTeam}
              onSelect={(v) => setNewMemberTeam(v as TeamName)}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              className="h-10 w-full px-5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
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
          { label: "Total Members", value: filteredMembers.length },
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
        <div className="text-muted-foreground text-sm py-16 text-center">Loading…</div>
      ) : filteredMembers.length === 0 ? (
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
          {filteredMembers.map((m) => {
            const stats = memberStats.get(m.user_id) ?? { completed: 0, pending: 0, inReview: 0, overdue: 0 };
            return (
              <motion.div
                key={m.id}
                variants={itemVariants}
                className="bg-card border border-border rounded-xl p-6 shadow-sm hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-0.5">
                  <p className="font-medium text-sm text-foreground truncate">{m.display_name || m.user_id}</p>
                  {m.team && <TeamBadge team={m.team} className="ml-2 shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground font-mono mb-4 truncate">{m.user_id}</p>
                <div className="space-y-1.5 text-sm mb-5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">✅ Completed</span>
                    <span className="text-green-400 font-medium">{stats.completed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">🔵 Pending</span>
                    <span className="text-foreground font-medium">{stats.pending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">⏳ In Review</span>
                    <span className="text-purple-400 font-medium">{stats.inReview}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">⚠️ Overdue</span>
                    <span className={cn("font-medium", stats.overdue > 0 ? "text-red-400" : "text-muted-foreground")}>
                      {stats.overdue}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-border text-primary hover:bg-primary/10 hover:border-primary"
                    onClick={() => router.push(`/tasks?search=${encodeURIComponent(m.user_id)}`)}
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
              {tasksWithoutMember.length} task{tasksWithoutMember.length !== 1 ? "s" : ""} assigned to people not on the official roster
            </span>
            {rosterExpanded ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
          </button>
          {rosterExpanded && (
            <div className="border-t border-border divide-y divide-border">
              {uniqueUnregistered.map(({ id, count }) => (
                <div key={id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-mono text-foreground">{id}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{count} task{count !== 1 ? "s" : ""}</p>
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

      {/* VP Roles section */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
          <Shield size={16} />
          VP Roles
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(["growth", "tech", "operations", "progirls"] as TeamName[]).map((team) => {
            const vps = vpByTeam.get(team) ?? [];
            const isAddingHere = addingVPForTeam === team;
            // Members not already VP of this team
            const alreadyVP = new Set(vps.map((v) => v.user_id));
            const eligibleMembers = members.filter((m) => !alreadyVP.has(m.user_id));

            return (
              <div key={team} className="bg-muted/30 border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <TeamBadge team={team} />
                  <span className="text-xs text-muted-foreground">VP</span>
                </div>

                {vps.length === 0 && !isAddingHere && (
                  <p className="text-sm text-muted-foreground">(none)</p>
                )}

                {vps.map((vp) => {
                  const member = memberMap.get(vp.user_id);
                  return (
                    <div key={vp.id} className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {member?.display_name || vp.user_id}
                        </p>
                        {member?.display_name && (
                          <p className="text-xs text-muted-foreground font-mono truncate">{vp.user_id}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs ml-2 shrink-0 border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive"
                        onClick={() => setRemovingVP(vp)}
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })}

                {isAddingHere ? (
                  <div className="space-y-2 pt-1">
                    <AnimatedDropdown
                      items={eligibleMembers.map((m) => ({ label: m.display_name || m.user_id, value: m.user_id }))}
                      value={addVPUserId || undefined}
                      onSelect={setAddVPUserId}
                      placeholder="Select member…"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => handleAddVP(team)}
                        disabled={savingVP || !addVPUserId}
                      >
                        {savingVP ? "Adding…" : "Confirm"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => { setAddingVPForTeam(null); setAddVPUserId(""); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddingVPForTeam(team); setAddVPUserId(""); }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
                  >
                    <Plus size={12} />
                    Add VP
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Remove VP confirmation dialog */}
      <Dialog open={!!removingVP} onOpenChange={(open) => !open && setRemovingVP(null)}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Remove VP role?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-1">
            {removingVP && (
              <>
                Remove{" "}
                <span className="font-medium text-foreground">
                  {memberMap.get(removingVP.user_id)?.display_name || removingVP.user_id}
                </span>{" "}
                as VP of the{" "}
                <span className="font-medium text-foreground">{TEAM_LABELS[removingVP.team]}</span> team?
              </>
            )}
          </p>
          <DialogFooter className="gap-2 sm:gap-2 border-0 bg-transparent p-0 pt-2">
            <Button variant="outline" className="h-9" onClick={() => setRemovingVP(null)}>Cancel</Button>
            <Button className="h-9 bg-destructive/90 text-white hover:bg-destructive" onClick={handleRemoveVP}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
