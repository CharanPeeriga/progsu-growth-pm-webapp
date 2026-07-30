"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, UserPlus, Users } from "lucide-react";
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
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { VpBlock, type VpEntry } from "@/components/team/vp-block";
import { MemberCard } from "@/components/team/member-card";
import { MemberDialog, RemoveMemberDialog } from "@/components/team/member-dialog";
import { TEAM_STYLE, type Status } from "@/lib/design";

const GUILD_ID = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID ?? "";

const TEAM_ORDER: TeamName[] = ["growth", "tech", "operations", "progirls"];

function statusCountsFor(userId: string, tasks: DBTask[]): Record<Status, number> {
  const counts: Record<Status, number> = { todo: 0, in_progress: 0, review: 0, done: 0 };
  for (const t of tasks) {
    if (t.assignee_id === userId) counts[t.status]++;
  }
  return counts;
}

export default function TeamPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<DBTask[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [vpRoles, setVpRoles] = useState<VPRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [rosterExpanded, setRosterExpanded] = useState(false);
  const [teamFilter, setTeamFilter] = useState<"all" | TeamName>("all");

  const [addOpen, setAddOpen] = useState(false);
  const [newDiscordId, setNewDiscordId] = useState("");
  const [newName, setNewName] = useState("");
  const [newTeam, setNewTeam] = useState<TeamName>("growth");
  const [newMakeVp, setNewMakeVp] = useState(false);
  const [adding, setAdding] = useState(false);

  const [removingMember, setRemovingMember] = useState<TeamMember | null>(null);
  const [removing, setRemoving] = useState(false);

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

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const memberMap = useMemo(() => new Map(members.map((m) => [m.user_id, m])), [members]);

  const filteredMembers = useMemo(() => {
    if (teamFilter === "all") return members;
    return members.filter((m) => m.team === teamFilter);
  }, [members, teamFilter]);

  const memberUserIds = useMemo(() => new Set(members.map((m) => m.user_id)), [members]);

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

  const vpKeySet = useMemo(
    () => new Set(vpRoles.map((v) => `${v.user_id}:${v.team}`)),
    [vpRoles]
  );

  const vpEntries: VpEntry[] = useMemo(
    () =>
      vpRoles.map((vp) => {
        const member = memberMap.get(vp.user_id);
        const name = member?.display_name || vp.user_id;
        const counts = statusCountsFor(vp.user_id, tasks);
        return {
          id: vp.id,
          user_id: vp.user_id,
          team: vp.team,
          name,
          openTasks: counts.todo + counts.in_progress,
        };
      }),
    [vpRoles, memberMap, tasks]
  );

  const teamCounts = useMemo(() => {
    const counts: Partial<Record<TeamName, number>> = {};
    for (const m of members) counts[m.team] = (counts[m.team] ?? 0) + 1;
    return counts;
  }, [members]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscordId.trim()) {
      toast.error("Please enter a Discord ID");
      return;
    }
    setAdding(true);
    try {
      await addTeamMember(GUILD_ID, newDiscordId.trim(), newName.trim(), newTeam);
      if (newMakeVp) {
        await addVPRole(newDiscordId.trim(), newTeam);
      }
      const addedName = newName.trim() || newDiscordId.trim();
      toast.success(`✅ ${addedName} added to the progsu Task Management System`);
      setAddOpen(false);
      setNewDiscordId("");
      setNewName("");
      setNewTeam("growth");
      setNewMakeVp(false);
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

  const handleConfirmRemove = async () => {
    if (!removingMember) return;
    setRemoving(true);
    try {
      await removeTeamMember(GUILD_ID, removingMember.user_id);
      toast.success("Removed from team");
      setRemovingMember(null);
      await loadAll();
    } catch (err) {
      toast.error(`Failed to remove: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setRemoving(false);
    }
  };

  const handleToggleVp = useCallback(
    async (userId: string, team: TeamName) => {
      const isVp = vpKeySet.has(`${userId}:${team}`);
      const name = memberMap.get(userId)?.display_name || userId;
      try {
        if (isVp) {
          await removeVPRole(userId, team);
          toast.success(`✅ ${name} removed as VP of ${TEAM_STYLE[team].label} team`);
        } else {
          await addVPRole(userId, team);
          toast.success(`✅ ${name} added as VP of ${TEAM_STYLE[team].label} team`);
        }
        await loadAll();
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    },
    [vpKeySet, memberMap, loadAll]
  );

  return (
    <div className="pb-16 space-y-6">
      <PageHeader
        title="Team"
        subtitle="Who is on each team and what they are carrying."
        count={members.length}
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus className="size-[15px]" />
            Add member
          </Button>
        }
      />

      <VpBlock vps={vpEntries} members={members} vpRoles={vpRoles} onToggleVp={handleToggleVp} />

      <div className="inline-flex items-center gap-1 rounded-full border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-1">
        <button
          onClick={() => setTeamFilter("all")}
          className="h-7 rounded-full px-3 t-caption font-semibold transition-colors duration-[160ms]"
          style={
            teamFilter === "all"
              ? {
                  backgroundColor: "rgba(107,138,253,0.10)",
                  color: "#C7D1FE",
                  boxShadow: "inset 0 0 0 1px rgba(107,138,253,0.24)",
                }
              : undefined
          }
        >
          <span className={teamFilter === "all" ? undefined : "text-[#6E7686] hover:text-[#A7B0C0]"}>
            All
          </span>{" "}
          <span className="font-mono text-[10px]">{members.length}</span>
        </button>
        {TEAM_ORDER.map((team) => {
          const t = TEAM_STYLE[team];
          const active = teamFilter === team;
          return (
            <button
              key={team}
              onClick={() => setTeamFilter(team)}
              className="h-7 rounded-full px-3 t-caption font-semibold transition-colors duration-[160ms]"
              style={
                active
                  ? { backgroundColor: t.fill, color: t.text, boxShadow: `inset 0 0 0 1px ${t.border}` }
                  : undefined
              }
            >
              <span className={active ? undefined : "text-[#6E7686] hover:text-[#A7B0C0]"}>
                {t.label}
              </span>{" "}
              <span className="font-mono text-[10px]">{teamCounts[team] ?? 0}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-16 text-center t-body-sm text-[#6E7686]">Loading…</div>
      ) : filteredMembers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members"
          description="Add someone to get started."
          action={<Button onClick={() => setAddOpen(true)}>Add member</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredMembers.map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              isVp={vpKeySet.has(`${m.user_id}:${m.team}`)}
              statusCounts={statusCountsFor(m.user_id, tasks)}
              onViewTasks={() => router.push(`/tasks?search=${encodeURIComponent(m.user_id)}`)}
              onToggleVp={() => handleToggleVp(m.user_id, m.team)}
              onRemove={() => setRemovingMember(m)}
            />
          ))}
        </div>
      )}

      {uniqueUnregistered.length > 0 && (
        <div className="surface-card overflow-hidden">
          <button
            onClick={() => setRosterExpanded(!rosterExpanded)}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[rgba(255,255,255,0.03)]"
          >
            <span className="t-body-sm text-[#A7B0C0]">
              {tasksWithoutMember.length} task{tasksWithoutMember.length !== 1 ? "s" : ""} assigned to
              people not on the official roster
            </span>
            {rosterExpanded ? (
              <ChevronDown className="size-4 text-[#6E7686]" />
            ) : (
              <ChevronRight className="size-4 text-[#6E7686]" />
            )}
          </button>
          {rosterExpanded && (
            <div className="border-t border-[rgba(255,255,255,0.06)]">
              {uniqueUnregistered.map(({ id, count }) => (
                <div
                  key={id}
                  className="flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] px-5 py-3 last:border-none"
                >
                  <div>
                    <p className="t-mono text-[#E8EBF2]">{id}</p>
                    <p className="t-caption text-[#6E7686] mt-0.5">
                      {count} task{count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => handleAddUnregistered(id)}>
                    Add to team
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <MemberDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        submitting={adding}
        onSubmit={handleAddMember}
        discordId={newDiscordId}
        onDiscordIdChange={setNewDiscordId}
        name={newName}
        onNameChange={setNewName}
        team={newTeam}
        onTeamChange={setNewTeam}
        makeVp={newMakeVp}
        onMakeVpChange={setNewMakeVp}
      />

      <RemoveMemberDialog
        open={!!removingMember}
        onOpenChange={(open) => !open && setRemovingMember(null)}
        name={removingMember?.display_name || removingMember?.user_id || ""}
        submitting={removing}
        onConfirm={handleConfirmRemove}
      />
    </div>
  );
}
