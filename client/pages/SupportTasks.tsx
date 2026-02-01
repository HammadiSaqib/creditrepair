import { useEffect, useMemo, useState } from "react";
import SupportLayout from "@/components/SupportLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supportApi } from "@/lib/api";
import { Image as ImageIcon, Loader2, Pencil, Plus, Trash2, CheckCircle2, Clock, AlertCircle, ListTodo } from "lucide-react";

type TaskStatus = "pending" | "in_progress" | "completed";
type TaskPriority = "normal" | "medium" | "priority";

type Task = {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  screenshot_url: string | null;
  created_at?: string;
  updated_at?: string;
  created_by_first_name?: string;
  created_by_last_name?: string;
  created_by_email?: string;
  updated_by_first_name?: string;
  updated_by_last_name?: string;
  updated_by_email?: string;
};

const statusOptions: Array<{ value: TaskStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const priorityOptions: Array<{ value: TaskPriority; label: string }> = [
  { value: "normal", label: "Normal" },
  { value: "medium", label: "Medium" },
  { value: "priority", label: "Priority" },
];

const statusBadgeClasses: Record<TaskStatus, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
};

const formatStatus = (status: TaskStatus) =>
  status === "in_progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1);

const priorityBadgeClasses: Record<TaskPriority, string> = {
  normal: "bg-slate-100 text-slate-700 border-slate-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  priority: "bg-rose-100 text-rose-700 border-rose-200",
};

const formatPriority = (priority: TaskPriority) =>
  priority === "priority" ? "Priority" : priority.charAt(0).toUpperCase() + priority.slice(1);

export default function SupportTasks() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<TaskStatus>("pending");
  const [formPriority, setFormPriority] = useState<TaskPriority>("normal");
  const [formScreenshot, setFormScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<TaskStatus>("pending");
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<number>>(new Set());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTask, setPreviewTask] = useState<Task | null>(null);
  const [previewStatus, setPreviewStatus] = useState<TaskStatus>("pending");
  const [previewStatusSaving, setPreviewStatusSaving] = useState(false);
  const [editPriority, setEditPriority] = useState<TaskPriority>("normal");
  const [editScreenshot, setEditScreenshot] = useState<File | null>(null);
  const [editScreenshotPreview, setEditScreenshotPreview] = useState<string | null>(null);

  const isImageUrl = (text: string) => {
    try {
      const url = new URL(text);
      const pathname = url.pathname.toLowerCase();
      return (
        pathname.endsWith(".png") ||
        pathname.endsWith(".jpg") ||
        pathname.endsWith(".jpeg") ||
        pathname.endsWith(".gif") ||
        pathname.endsWith(".webp") ||
        pathname.endsWith(".bmp") ||
        pathname.endsWith(".svg")
      );
    } catch {
      return text.startsWith("data:image/");
    }
  };

  const handleTitlePasteCreate = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const cd = e.clipboardData;
    if (!cd) return;

    for (const item of Array.from(cd.items)) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file && file.type.startsWith("image/")) {
          e.preventDefault();
          setFormScreenshot(file);
          toast({ title: "Screenshot added", description: "Image pasted into Title moved to Screenshot." });
          return;
        }
      }
    }

    const text = cd.getData("text");
    if (text && isImageUrl(text.trim())) {
      try {
        const resp = await fetch(text.trim());
        const blob = await resp.blob();
        if (blob.type.startsWith("image/")) {
          e.preventDefault();
          const name = (text.split("/").pop() || "pasted-image").split("?")[0];
          const file = new File([blob], name, { type: blob.type });
          setFormScreenshot(file);
          toast({ title: "Screenshot added", description: "Image URL pasted moved to Screenshot." });
        }
      } catch {
        // Allow normal paste if fetch fails
      }
    }
  };

  const handleTitlePasteEdit = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const cd = e.clipboardData;
    if (!cd) return;

    for (const item of Array.from(cd.items)) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file && file.type.startsWith("image/")) {
          e.preventDefault();
          setEditScreenshot(file);
          toast({ title: "Screenshot added", description: "Image pasted into Title moved to Screenshot." });
          return;
        }
      }
    }

    const text = cd.getData("text");
    if (text && isImageUrl(text.trim())) {
      try {
        const resp = await fetch(text.trim());
        const blob = await resp.blob();
        if (blob.type.startsWith("image/")) {
          e.preventDefault();
          const name = (text.split("/").pop() || "pasted-image").split("?")[0];
          const file = new File([blob], name, { type: blob.type });
          setEditScreenshot(file);
          toast({ title: "Screenshot added", description: "Image URL pasted moved to Screenshot." });
        }
      } catch {
      }
    }
  };

  useEffect(() => {
    if (!editScreenshot) {
      setEditScreenshotPreview(null);
      return;
    }
    const url = URL.createObjectURL(editScreenshot);
    setEditScreenshotPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [editScreenshot]);
  useEffect(() => {
    if (!formScreenshot) {
      setScreenshotPreview(null);
      return;
    }
    const url = URL.createObjectURL(formScreenshot);
    setScreenshotPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [formScreenshot]);

  useEffect(() => {
    if (previewTask) {
      setPreviewStatus(previewTask.status);
    }
  }, [previewTask]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await supportApi.getTasks();
      setTasks(response.data?.data || []);
    } catch {
      toast({
        title: "Failed to load tasks",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = tasks.filter((task) => {
      const statusMatch = statusFilter === "all" || task.status === statusFilter;
      if (!statusMatch) return false;
      if (!query) return true;
      const text = [
        task.title,
        task.description,
        task.created_by_first_name,
        task.created_by_last_name,
        task.created_by_email,
        task.updated_by_first_name,
        task.updated_by_last_name,
        task.updated_by_email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(query);
    });
    const priorityOrder: Record<TaskPriority, number> = {
      priority: 3,
      medium: 2,
      normal: 1,
    };
    return filtered.sort((a, b) => {
      const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
    });
  }, [tasks, searchQuery, statusFilter]);

  const taskStats = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "completed");
    const pending = tasks.filter((t) => t.status === "pending");
    return {
      totalTasks: tasks.length,
      completedTasks: completed.length,
      completedBreakdown: {
        normal: completed.filter((t) => t.priority === "normal").length,
        medium: completed.filter((t) => t.priority === "medium").length,
        priority: completed.filter((t) => t.priority === "priority").length,
      },
      pendingTasks: pending.length,
      pendingBreakdown: {
        normal: pending.filter((t) => t.priority === "normal").length,
        medium: pending.filter((t) => t.priority === "medium").length,
        priority: pending.filter((t) => t.priority === "priority").length,
      },
      normalPriority: tasks.filter((t) => t.priority === "normal").length,
      mediumPriority: tasks.filter((t) => t.priority === "medium").length,
      priorityTasks: tasks.filter((t) => t.priority === "priority").length,
    };
  }, [tasks]);

  const resetCreateForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormStatus("pending");
    setFormPriority("normal");
    setFormScreenshot(null);
    setScreenshotPreview(null);
  };

  const handleCreate = async () => {
    const title = formTitle.trim();
    const description = formDescription.trim();
    if (!title || !description) {
      toast({
        title: "Missing fields",
        description: "Title and description are required.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const response = await supportApi.createTask({
        title,
        description,
        status: formStatus,
        priority: formPriority,
        screenshot: formScreenshot,
      });
      const created = response.data?.data as Task | undefined;
      if (created) {
        setTasks((prev) => [created, ...prev]);
      }
      setCreateOpen(false);
      resetCreateForm();
      toast({ title: "Task created" });
    } catch {
      toast({
        title: "Failed to create task",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (task: Task) => {
    setSelectedTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditStatus(task.status);
    setEditPriority(task.priority);
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedTask) return;
    const title = editTitle.trim();
    const description = editDescription.trim();
    if (!title || !description) {
      toast({
        title: "Missing fields",
        description: "Title and description are required.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const response = await supportApi.updateTask(selectedTask.id, {
        title,
        description,
        status: editStatus,
        priority: editPriority,
        screenshot: editScreenshot || undefined,
      });
      const updated = response.data?.data as Task | undefined;
      if (updated) {
        setTasks((prev) => prev.map((task) => (task.id === updated.id ? updated : task)));
      }
      setEditOpen(false);
      setSelectedTask(null);
      setEditScreenshot(null);
      setEditScreenshotPreview(null);
      toast({ title: "Task updated" });
    } catch {
      toast({
        title: "Failed to update task",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (task: Task, status: TaskStatus) => {
    if (status === task.status) return;
    try {
      const response = await supportApi.updateTask(task.id, { status });
      const updated = response.data?.data as Task | undefined;
      if (updated) {
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      }
    } catch {
      toast({
        title: "Failed to update status",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePreviewStatusSave = async () => {
    if (!previewTask) return;
    if (previewStatus === previewTask.status) return;
    setPreviewStatusSaving(true);
    try {
      const response = await supportApi.updateTask(previewTask.id, { status: previewStatus });
      const updated = response.data?.data as Task | undefined;
      if (updated) {
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setPreviewTask(updated);
        toast({ title: "Status updated" });
      }
    } catch {
      toast({
        title: "Failed to update status",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPreviewStatusSaving(false);
    }
  };

  const handleDelete = async (task: Task) => {
    const confirmed = window.confirm("Delete this task?");
    if (!confirmed) return;
    try {
      await supportApi.deleteTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      toast({ title: "Task deleted" });
    } catch {
      toast({
        title: "Failed to delete task",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <SupportLayout title="Project Tasks" description="Track and manage support tasks and project updates">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>Create, update, and track task progress</CardDescription>
            </div>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[640px]">
                <DialogHeader>
                  <DialogTitle>Create Task</DialogTitle>
                  <DialogDescription>Share task details and optional screenshot</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} onPaste={handleTitlePasteCreate} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={4} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select value={formStatus} onValueChange={(value) => setFormStatus(value as TaskStatus)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Priority</label>
                      <Select value={formPriority} onValueChange={(value) => setFormPriority(value as TaskPriority)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Screenshot</label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFormScreenshot(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                  {screenshotPreview && (
                    <div className="rounded-lg border p-3">
                      <img src={screenshotPreview} alt="Screenshot preview" className="w-full h-48 object-cover rounded-md" />
                    </div>
                  )}
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">All Tasks</p>
                      <h3 className="text-2xl font-bold">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : taskStats.totalTasks}</h3>
                    </div>
                    <div className="p-2 bg-slate-100 rounded-full">
                      <ListTodo className="h-4 w-4 text-slate-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Completed</p>
                      <h3 className="text-2xl font-bold">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : taskStats.completedTasks}</h3>
                    </div>
                    <div className="p-2 bg-green-100 rounded-full">
                      <CheckCircle2 className="h-4 w-4 text-green-700" />
                    </div>
                  </div>
                  {!loading && (
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground border-t pt-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700">Normal</span>
                        <span>{taskStats.completedBreakdown.normal}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-amber-700">Medium</span>
                        <span>{taskStats.completedBreakdown.medium}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-rose-700">Priority</span>
                        <span>{taskStats.completedBreakdown.priority}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Pending</p>
                      <h3 className="text-2xl font-bold">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : taskStats.pendingTasks}</h3>
                    </div>
                    <div className="p-2 bg-amber-100 rounded-full">
                      <Clock className="h-4 w-4 text-amber-700" />
                    </div>
                  </div>
                  {!loading && (
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground border-t pt-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700">Normal</span>
                        <span>{taskStats.pendingBreakdown.normal}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-amber-700">Medium</span>
                        <span>{taskStats.pendingBreakdown.medium}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-rose-700">Priority</span>
                        <span>{taskStats.pendingBreakdown.priority}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="relative w-full lg:max-w-md">
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="w-full lg:max-w-xs">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | TaskStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Update</TableHead>
                    <TableHead>Screenshot</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Updated By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading tasks
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                        No tasks found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell className="max-w-[320px] text-sm text-muted-foreground">
                          <div className={expandedTaskIds.has(task.id) ? "" : "line-clamp-2"}>{task.description}</div>
                          {expandedTaskIds.has(task.id) ? (
                            <button
                              type="button"
                              className="mt-1 text-sm text-emerald-600"
                              onClick={() =>
                                setExpandedTaskIds((prev) => {
                                  const next = new Set(prev);
                                  next.delete(task.id);
                                  return next;
                                })
                              }
                            >
                              Read less
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="mt-1 text-sm text-emerald-600"
                              onClick={() =>
                                setExpandedTaskIds((prev) => {
                                  const next = new Set(prev);
                                  next.add(task.id);
                                  return next;
                                })
                              }
                            >
                              Read more
                            </button>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusBadgeClasses[task.status]}>
                            {formatStatus(task.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={priorityBadgeClasses[task.priority]}>
                            {formatPriority(task.priority)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select value={task.status} onValueChange={(value) => handleStatusChange(task, value as TaskStatus)}>
                            <SelectTrigger className="h-9 w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {task.screenshot_url ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-sm text-primary"
                              onClick={() => {
                                setPreviewTask(task);
                            setPreviewStatus(task.status);
                                setPreviewOpen(true);
                              }}
                            >
                              <ImageIcon className="h-4 w-4" />
                              View
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {task.created_by_first_name || task.created_by_last_name
                            ? `${task.created_by_first_name || ""} ${task.created_by_last_name || ""}`.trim()
                            : task.created_by_email || "System"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {task.updated_by_first_name || task.updated_by_last_name
                            ? `${task.updated_by_first_name || ""} ${task.updated_by_last_name || ""}`.trim()
                            : task.updated_by_email || "System"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEdit(task)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(task)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details and status</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onPaste={handleTitlePasteEdit} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={editStatus} onValueChange={(value) => setEditStatus(value as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={editPriority} onValueChange={(value) => setEditPriority(value as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Screenshot</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setEditScreenshot(e.target.files?.[0] || null)}
              />
            </div>
            {(editScreenshotPreview || selectedTask?.screenshot_url) && (
              <div className="rounded-lg border p-3">
                <img
                  src={editScreenshotPreview || selectedTask?.screenshot_url || ""}
                  alt="Screenshot preview"
                  className="w-full h-48 object-cover rounded-md"
                />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{previewTask?.title}</DialogTitle>
            <DialogDescription>{previewTask?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={previewStatus} onValueChange={(value) => setPreviewStatus(value as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {previewTask?.screenshot_url ? (
              <img
                src={previewTask.screenshot_url}
                alt="Task screenshot"
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg border"
              />
            ) : (
              <span className="text-sm text-muted-foreground">No screenshot</span>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button onClick={handlePreviewStatusSave} disabled={previewStatusSaving || !previewTask}>
              {previewStatusSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
            <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SupportLayout>
  );
}
