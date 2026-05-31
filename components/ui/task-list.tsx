"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, ClipboardList, CheckCircle, RotateCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type UITaskStatus = "Done" | "In Progress" | "In Review" | "Pending";

export interface Task {
  id: number;
  task: string;
  assignee: string;
  assigner: string;
  status: UITaskStatus;
  dueDate: string;
  rejectionReason?: string | null;
}

export interface TaskListProps {
  title?: string;
  tasks: Task[];
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onApprove?: (task: Task) => void;
  onReject?: (task: Task) => void;
  renderDueDate?: (task: Task) => React.ReactNode;
  renderAssignee?: (task: Task) => React.ReactNode;
  renderTeam?: (task: Task) => React.ReactNode;
  renderCollaborators?: (task: Task) => React.ReactNode;
  emptyTitle?: string;
  emptySubtitle?: string;
  EmptyIcon?: LucideIcon;
}

const StatusBadge = ({ status }: { status: UITaskStatus }) => {
  const base = "inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full";
  const map: Record<UITaskStatus, string> = {
    "Done": "bg-green-950/60 text-green-400",
    "In Progress": "bg-yellow-950/60 text-yellow-400",
    "In Review": "bg-purple-950/60 text-purple-400",
    "Pending": "bg-zinc-800 text-zinc-300",
  };
  return <span className={cn(base, map[status])}>{status}</span>;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 },
  },
};

export const TaskList = ({
  title = "Task List",
  tasks,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  renderDueDate,
  renderAssignee,
  renderTeam,
  renderCollaborators,
  emptyTitle = "No tasks found.",
  emptySubtitle,
  EmptyIcon = ClipboardList,
}: TaskListProps) => {
  return (
    <div className="w-full rounded-xl border border-border bg-card shadow-sm">
      {title !== "Task List" && (
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
      )}
      <div className="overflow-x-auto">
        {tasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-muted-foreground"
          >
            <EmptyIcon size={40} className="mb-3 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">{emptyTitle}</p>
            {emptySubtitle && (
              <p className="text-xs text-muted-foreground/70 mt-1">{emptySubtitle}</p>
            )}
          </motion.div>
        ) : (
          <table className="w-full text-sm text-left min-w-[860px]">
            <motion.thead
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-16">
                  ID
                </th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Task
                </th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Assignee
                </th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Assigner
                </th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                {renderTeam && (
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Team
                  </th>
                )}
                {renderCollaborators && (
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Collaborators
                  </th>
                )}
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
                  Due Date
                </th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </motion.thead>
            <motion.tbody
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence>
                {tasks.map((task) => (
                  <motion.tr
                    key={task.id}
                    variants={itemVariants}
                    className="border-b border-border last:border-none hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-4 text-xs text-muted-foreground font-mono">
                      #{task.id}
                    </td>
                    <td className="px-4 py-4 max-w-[220px]">
                      <p className="font-medium text-foreground truncate">{task.task}</p>
                      {task.rejectionReason && (
                        <p className="text-xs text-red-400 mt-0.5 truncate">
                          ↩️ Sent back: {task.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs">
                      {renderAssignee ? renderAssignee(task) : (
                        <span className="text-muted-foreground font-mono">{task.assignee}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground font-mono text-xs">
                      {task.assigner}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={task.status} />
                    </td>
                    {renderTeam && (
                      <td className="px-4 py-4">{renderTeam(task)}</td>
                    )}
                    {renderCollaborators && (
                      <td className="px-4 py-4 max-w-[180px]">{renderCollaborators(task)}</td>
                    )}
                    <td className="px-4 py-4 text-right">
                      {renderDueDate ? (
                        renderDueDate(task)
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {task.dueDate}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {task.status === "In Review" && onApprove && (
                          <button
                            onClick={() => onApprove(task)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-green-400 hover:bg-green-950/30 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                        {task.status === "In Review" && onReject && (
                          <button
                            onClick={() => onReject(task)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-yellow-400 hover:bg-yellow-950/30 transition-colors"
                            title="Send back"
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(task)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                            title="Edit task"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(task)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete task"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </motion.tbody>
          </table>
        )}
      </div>
    </div>
  );
};
