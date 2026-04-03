import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Calendar, Loader2, CheckCircle2, Clock, Circle } from "lucide-react";

interface Task {
  id: number; title: string; priority: "high" | "medium" | "low";
  status: "todo" | "in_progress" | "done"; dueDate?: string; createdAt: string;
}

const PRIORITY_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  high: { label: "High", bg: "hsl(0 72% 51% / 0.15)", color: "hsl(0 72% 65%)" },
  medium: { label: "Medium", bg: "hsl(38 92% 50% / 0.15)", color: "hsl(38 92% 65%)" },
  low: { label: "Low", bg: "hsl(240 5% 18%)", color: "hsl(240 5% 55%)" },
};

const STATUS_OPTIONS = [
  { value: "todo", label: "To Do", icon: Circle },
  { value: "in_progress", label: "In Progress", icon: Clock },
  { value: "done", label: "Done", icon: CheckCircle2 },
];

function StatusIcon({ status }: { status: string }) {
  if (status === "done") return <CheckCircle2 size={15} style={{ color: "hsl(142 71% 50%)" }} />;
  if (status === "in_progress") return <Clock size={15} style={{ color: "hsl(38 92% 55%)" }} />;
  return <Circle size={15} style={{ color: "hsl(240 5% 45%)" }} />;
}

export default function Tasks() {
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
  const [newDue, setNewDue] = useState("");
  const qc = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: () => fetch("/api/tasks").then(r => r.json()).then(d => Array.isArray(d) ? d : (d.tasks ?? [])),
  });

  const addMut = useMutation({
    mutationFn: (body: any) => fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); setShowAdd(false); setNewTitle(""); setNewDue(""); setNewPriority("medium"); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...body }: any) => fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => fetch(`/api/tasks/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const filtered = tasks.filter(t => filter === "all" || t.status === filter);

  const tabs = [
    { key: "all", label: "All", count: tasks.length },
    { key: "todo", label: "To Do", count: tasks.filter(t => t.status === "todo").length },
    { key: "in_progress", label: "In Progress", count: tasks.filter(t => t.status === "in_progress").length },
    { key: "done", label: "Done", count: tasks.filter(t => t.status === "done").length },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Tasks</h1>
          <p className="text-sm mt-0.5" style={{ color: "hsl(240 5% 50%)" }}>Track your career action items</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
          style={{ background: "hsl(263 70% 58%)" }}>
          <Plus size={15} /> Add Task
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="rounded-xl border p-4 mb-5 space-y-3" style={{ background: "hsl(240 8% 7%)", borderColor: "hsl(263 70% 58% / 0.3)" }}>
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Task title..."
            className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: "hsl(240 8% 10%)", border: "1px solid hsl(240 5% 18%)", color: "hsl(0 0% 90%)" }} />
          <div className="flex gap-3">
            <select value={newPriority} onChange={e => setNewPriority(e.target.value as any)}
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" style={{ background: "hsl(240 8% 10%)", border: "1px solid hsl(240 5% 18%)", color: "hsl(0 0% 90%)" }}>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <input type="date" value={newDue} onChange={e => setNewDue(e.target.value)}
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" style={{ background: "hsl(240 8% 10%)", border: "1px solid hsl(240 5% 18%)", color: "hsl(0 0% 90%)", colorScheme: "dark" }} />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: "hsl(240 5% 50%)" }}>Cancel</button>
            <button onClick={() => addMut.mutate({ title: newTitle, priority: newPriority, dueDate: newDue || undefined })}
              disabled={!newTitle.trim() || addMut.isPending}
              className="px-4 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
              style={{ background: "hsl(263 70% 58%)" }}>
              {addMut.isPending ? "Adding..." : "Add Task"}
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: "hsl(240 8% 7%)", border: "1px solid hsl(240 5% 14%)" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={filter === t.key
              ? { background: "hsl(263 70% 58% / 0.15)", color: "hsl(263 70% 75%)" }
              : { color: "hsl(240 5% 50%)" }}>
            {t.label} <span className="ml-1 opacity-60">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="flex justify-center pt-10"><Loader2 size={22} className="animate-spin" style={{ color: "hsl(263 70% 58%)" }} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: "hsl(240 5% 40%)" }}>
          <CheckCircle2 size={36} className="mx-auto mb-3 opacity-30" />
          <div className="text-sm">No tasks here. Add one above!</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const p = PRIORITY_STYLES[task.priority];
            return (
              <div key={task.id} className="rounded-xl border p-4 flex items-start gap-3 transition-all hover:border-opacity-60"
                style={{ background: "hsl(240 8% 7%)", borderColor: "hsl(240 5% 16%)", opacity: task.status === "done" ? 0.6 : 1 }}>
                <StatusIcon status={task.status} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white" style={{ textDecoration: task.status === "done" ? "line-through" : "none" }}>{task.title}</div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: p.bg, color: p.color }}>{p.label}</span>
                    {task.dueDate && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "hsl(240 5% 45%)" }}>
                        <Calendar size={11} /> {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select value={task.status} onChange={e => updateMut.mutate({ id: task.id, status: e.target.value })}
                    className="text-xs rounded-lg px-2 py-1 outline-none cursor-pointer"
                    style={{ background: "hsl(240 8% 11%)", border: "1px solid hsl(240 5% 18%)", color: "hsl(0 0% 80%)" }}>
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <button onClick={() => deleteMut.mutate(task.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: "hsl(240 5% 40%)" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
