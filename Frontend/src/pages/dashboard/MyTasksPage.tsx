import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import {
  Plus,
  Calendar,
  Loader2,
  Trash2,
  GripVertical,
  ListTodo,
} from "lucide-react";

// ── Palette ───────────────────────────────────────────────────────────────────

const C = {
  cream: "#FFF8E7",
  creamDeep: "#FFFDF5",
  white: "#FFFFFF",
  border: "#F0E4C8",
  textMain: "#1A1A1A",
  textMid: "#8A8578",
  textFaint: "#B0A99A",
  yellow: "#FFC107",
  yellowDark: "#B8860B",
  yellowBg: "#FFF3CD",
  yellowBorder: "#FFE082",
  green:    "#B8860B",
  greenBg:  "#FFF3CD",
  blue: "#185FA5",
  blueBg: "#E6F1FB",
  purple: "#534AB7",
  purpleBg: "#EEEDFE",
  amber: "#854F0B",
  amberBg: "#FAEEDA",
  red: "#A32D2D",
  redBg: "#FCEBEB",
  redBorder: "#F7C1C1",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface Task {
  _id: string;
  title: string;
  description?: string;
  ticketId?: string;
  customerId?: {
    _id: string;
    name: string;
    email: string;
    healthScore: number;
    healthStatus: string;
  };
  assignedTo: {
    _id: string;
    name: string;
    email: string;
  };
  createdBy: {
    _id: string;
    name: string;
  };
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | "critical";
  dueDate?: string;
  completedAt?: string;
  channel?: string;
  sentiment?: string;
  category?: string;
  notes?: string;
  createdAt: string;
}

interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
}

type ColumnId = "todo" | "in_progress" | "done";

const COLUMNS: { id: ColumnId; title: string; color: string }[] = [
  { id: "todo", title: "To Do", color: C.textMid },
  { id: "in_progress", title: "In Progress", color: C.yellow },
  { id: "done", title: "Done", color: C.green },
];

const PRIORITY_META: Record<string, { color: string; bg: string }> = {
  low: { color: C.green, bg: C.greenBg },
  medium: { color: C.green, bg: C.greenBg },
  high: { color: C.amber, bg: C.amberBg },
  critical: { color: C.red, bg: C.redBg },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso?: string) {
  if (!iso) return null;
  const date = new Date(iso);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days}d`;
}

// ── Task Card Component ───────────────────────────────────────────────────────

function TaskCard({
  task,
  onDelete,
}: {
  task: Task;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
  const pm = PRIORITY_META[task.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="task-card"
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <div
          {...listeners}
          style={{
            cursor: "grab",
            color: "#D8CFA8",
            padding: "4px 0",
            flexShrink: 0,
          }}
        >
          <GripVertical style={{ width: 16, height: 16 }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 500,
              fontSize: 14,
              color: C.textMain,
              marginBottom: 6,
              lineHeight: 1.4,
            }}
          >
            {task.title}
          </div>
          {task.description && (
            <div
              style={{
                fontSize: 12,
                color: C.textMid,
                marginBottom: 8,
                lineHeight: 1.4,
              }}
            >
              {task.description}
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                background: pm.bg,
                color: pm.color,
                textTransform: "capitalize",
              }}
            >
              {task.priority}
            </span>
            {task.channel && (
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 500,
                  background: C.blueBg,
                  color: C.blue,
                  textTransform: "capitalize",
                }}
              >
                {task.channel}
              </span>
            )}
            {task.category && (
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 500,
                  background: C.purpleBg,
                  color: C.purple,
                  textTransform: "capitalize",
                }}
              >
                {task.category}
              </span>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 11,
              color: C.textFaint,
            }}
          >
            {task.dueDate && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  color: isOverdue ? C.red : C.textMid,
                }}
              >
                <Calendar style={{ width: 12, height: 12 }} />
                {formatDate(task.dueDate)}
              </div>
            )}
            {task.customerId && (
              <div
                style={{
                  fontSize: 10,
                  color: C.textFaint,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {task.customerId.name}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(task._id)}
          style={{
            padding: 4,
            borderRadius: 6,
            border: "none",
            background: "transparent",
            color: C.textFaint,
            cursor: "pointer",
            flexShrink: 0,
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = C.red)}
          onMouseOut={(e) => (e.currentTarget.style.color = C.textFaint)}
        >
          <Trash2 style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
}

// ── Column Component ──────────────────────────────────────────────────────────

function Column({
  column,
  tasks,
  onDelete,
}: {
  column: { id: ColumnId; title: string; color: string };
  tasks: Task[];
  onDelete: (id: string) => void;
}) {
  return (
    <div
      style={{
        background: C.white,
        border: `0.5px solid ${C.border}`,
        borderRadius: 14,
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column",
        minHeight: 400,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: `0.5px solid ${C.border}`,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: column.color,
            flexShrink: 0,
          }}
        />
        <h3
          style={{
            fontWeight: 500,
            fontSize: 13,
            color: C.textMain,
            margin: 0,
            flex: 1,
          }}
        >
          {column.title}
        </h3>
        <span
          style={{
            fontSize: 11,
            color: C.textFaint,
            fontWeight: 500,
          }}
        >
          {tasks.length}
        </span>
      </div>
      <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MyTasksPage() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
  });

  // Fetch tasks
  const tasksQuery = useQuery<{ success: boolean; data: Task[] }>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  });

  // Fetch stats
  const statsQuery = useQuery<{ success: boolean; data: TaskStats }>({
    queryKey: ["task-stats"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tasks/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  });

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: async (task: typeof newTask) => {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tasks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(task),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-stats"] });
      setShowNewTaskForm(false);
      setNewTask({ title: "", description: "", priority: "medium", dueDate: "" });
      toast.success("Task created!");
    },
  });

  // Update task mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ColumnId }) => {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-stats"] });
    },
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-stats"] });
      toast.success("Task deleted");
    },
  });

  const tasks = tasksQuery.data?.data ?? [];
  const stats = statsQuery.data?.data;

  // Group tasks by status
  const tasksByColumn = useMemo(() => {
    const grouped: Record<ColumnId, Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };
    tasks.forEach((task) => {
      grouped[task.status].push(task);
    });
    return grouped;
  }, [tasks]);

  // Drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTask = tasks.find((t) => t._id === active.id);
    if (!activeTask) return;

    const overColumn = over.id as ColumnId;
    if (COLUMNS.some((c) => c.id === overColumn) && activeTask.status !== overColumn) {
      updateMutation.mutate({ id: activeTask._id, status: overColumn });
    }
  };

  const activeTask = activeId ? tasks.find((t) => t._id === activeId) : null;

  return (
    <div
      style={{
        padding: "28px 32px",
        minHeight: "100vh",
        background: C.cream,
        color: C.textMain,
        fontFamily: "DM Sans, Inter, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: C.textMain,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ListTodo style={{ width: 20, height: 20, color: C.yellow }} />
          </div>
          <div>
            <h1
              style={{
                fontWeight: 500,
                fontSize: 20,
                color: C.textMain,
                margin: 0,
              }}
            >
              My Tasks
            </h1>
            <p
              style={{
                fontSize: 13,
                color: C.textMid,
                margin: 0,
              }}
            >
              Drag tasks between columns to update status
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowNewTaskForm(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            background: C.textMain,
            color: C.yellow,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          <Plus style={{ width: 16, height: 16 }} />
          New Task
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 4 }}>Total</div>
            <div style={{ fontSize: 24, fontWeight: 500, color: C.textMain }}>{stats.total}</div>
          </div>
          <div style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 4 }}>To Do</div>
            <div style={{ fontSize: 24, fontWeight: 500, color: C.textMid }}>{stats.todo}</div>
          </div>
          <div style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 4 }}>In Progress</div>
            <div style={{ fontSize: 24, fontWeight: 500, color: C.yellowDark }}>{stats.inProgress}</div>
          </div>
          <div style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 4 }}>Done</div>
            <div style={{ fontSize: 24, fontWeight: 500, color: C.green }}>{stats.done}</div>
          </div>
          {stats.overdue > 0 && (
            <div style={{ background: C.redBg, border: `0.5px solid ${C.redBorder}`, borderRadius: 10, padding: "12px 16px" }}>
              <div style={{ fontSize: 11, color: C.red, marginBottom: 4 }}>Overdue</div>
              <div style={{ fontSize: 24, fontWeight: 500, color: C.red }}>{stats.overdue}</div>
            </div>
          )}
        </div>
      )}

      {/* New Task Form */}
      {showNewTaskForm && (
        <div
          style={{
            background: C.creamDeep,
            border: `0.5px solid ${C.yellowBorder}`,
            borderRadius: 14,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 16, color: C.textMain }}>Create New Task</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="text"
              placeholder="Task title *"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              style={{
                background: C.white,
                border: `0.5px solid ${C.border}`,
                borderRadius: 8,
                padding: "10px 12px",
                color: C.textMain,
                fontSize: 13,
                outline: "none",
              }}
            />
            <textarea
              placeholder="Description (optional)"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              rows={2}
              style={{
                background: C.white,
                border: `0.5px solid ${C.border}`,
                borderRadius: 8,
                padding: "10px 12px",
                color: C.textMain,
                fontSize: 13,
                resize: "vertical",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                style={{
                  background: C.white,
                  border: `0.5px solid ${C.border}`,
                  borderRadius: 8,
                  padding: "10px 12px",
                  color: C.textMain,
                  fontSize: 13,
                  outline: "none",
                }}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical</option>
              </select>
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                style={{
                  background: C.white,
                  border: `0.5px solid ${C.border}`,
                  borderRadius: 8,
                  padding: "10px 12px",
                  color: C.textMain,
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => createMutation.mutate(newTask)}
                disabled={!newTask.title.trim() || createMutation.isPending}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: C.textMain,
                  color: C.yellow,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: !newTask.title.trim() || createMutation.isPending ? "not-allowed" : "pointer",
                  opacity: !newTask.title.trim() || createMutation.isPending ? 0.5 : 1,
                }}
              >
                {createMutation.isPending ? "Creating..." : "Create Task"}
              </button>
              <button
                onClick={() => {
                  setShowNewTaskForm(false);
                  setNewTask({ title: "", description: "", priority: "medium", dueDate: "" });
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: `0.5px solid ${C.border}`,
                  background: "transparent",
                  color: C.textMid,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {tasksQuery.isLoading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 300,
            gap: 8,
            color: C.textMid,
          }}
        >
          <Loader2 style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} />
          Loading tasks...
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
            }}
          >
            {COLUMNS.map((column) => (
              <div key={column.id} data-column={column.id}>
                <Column
                  column={column}
                  tasks={tasksByColumn[column.id]}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              </div>
            ))}
          </div>
          <DragOverlay>
            {activeTask && (
              <div
                style={{
                  background: C.creamDeep,
                  border: `0.5px solid ${C.yellowBorder}`,
                  borderRadius: 10,
                  padding: 12,
                  boxShadow: "0 10px 30px rgba(26,26,26,0.18)",
                  color: C.textMain,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {activeTask.title}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* CSS for task card styles */}
      <style>{`
        .task-card {
          background: ${C.creamDeep};
          border: 0.5px solid ${C.border};
          border-radius: 10px;
          padding: 12px;
          transition: all 0.2s;
          cursor: pointer;
        }
        .task-card:hover {
          border-color: ${C.yellowBorder};
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(26,26,26,0.08);
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}