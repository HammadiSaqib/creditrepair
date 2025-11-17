import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { contractsApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Edit, Trash2, CheckCircle2, Eye } from "lucide-react";

type TemplateStatus = "draft" | "active" | "archived";

interface ContractTemplate {
  id: number;
  admin_id: number;
  name: string;
  description?: string | null;
  content_html?: string | null;
  content_text?: string | null;
  status: TemplateStatus;
  created_at: string;
  updated_at: string;
}

interface TemplateForm {
  name: string;
  description?: string;
  content_html?: string;
  content_text?: string;
  status: TemplateStatus;
}

const emptyForm: TemplateForm = {
  name: "",
  description: "",
  content_html: "",
  content_text: "",
  status: "draft",
};

export default function ContractsManagement() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TemplateStatus | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContractTemplate | null>(null);
  const [form, setForm] = useState<TemplateForm>(emptyForm);
  const [previewOpen, setPreviewOpen] = useState(false);

  const looksLikeHtml = (s?: string | null) => {
    if (!s) return false;
    // Basic heuristic: contains HTML tags
    return /<[^>]+>/.test(s);
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await contractsApi.getTemplates();
      const data = (res.data?.data ?? res.data ?? []) as ContractTemplate[];
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load templates", err);
      toast.error("Failed to load contract templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    const q = search.toLowerCase().trim();
    return templates.filter((t) => {
      const matchesSearch = !q || t.name.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [templates, search, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (t: ContractTemplate) => {
    setEditing(t);
    setForm({
      name: t.name,
      description: t.description || "",
      content_html: t.content_html || "",
      content_text: t.content_text || "",
      status: t.status,
    });
    setDialogOpen(true);
  };

  const saveTemplate = async () => {
    try {
      if (!form.name.trim()) {
        toast.error("Template name is required");
        return;
      }
      if (editing) {
        await contractsApi.updateTemplate(editing.id, form);
        toast.success("Template updated");
      } else {
        await contractsApi.createTemplate(form);
        toast.success("Template created");
      }
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await loadTemplates();
    } catch (err) {
      console.error("Save template failed", err);
      toast.error("Failed to save template");
    }
  };

  const deleteTemplate = async (id: number) => {
    try {
      if (!confirm("Delete this template?")) return;
      await contractsApi.deleteTemplate(id);
      toast.success("Template deleted");
      await loadTemplates();
    } catch (err) {
      console.error("Delete template failed", err);
      toast.error("Failed to delete template");
    }
  };

  const setActive = async (t: ContractTemplate) => {
    try {
      await contractsApi.updateTemplate(t.id, { status: "active" });
      toast.success("Template activated");
      await loadTemplates();
    } catch (err) {
      console.error("Activate template failed", err);
      toast.error("Failed to activate template");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Contracts</h2>
          <p className="text-muted-foreground">Create and edit contract templates for admins</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Search by name or description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates table */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Templates ({filteredTemplates.length})</CardTitle>
          <CardDescription>Manage reusable admin contract templates</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="font-medium">{t.name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.status === "active" ? "default" : t.status === "archived" ? "secondary" : "outline"}>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[360px] truncate text-muted-foreground">
                      {t.description || ""}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(t.updated_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setEditing(t); setPreviewOpen(true); }}>
                          <Eye className="h-4 w-4 mr-1" /> Preview
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEdit(t)}>
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        {t.status !== "active" && (
                          <Button variant="outline" size="sm" onClick={() => setActive(t)}>
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Activate
                          </Button>
                        )}
                        <Button variant="destructive" size="sm" onClick={() => deleteTemplate(t.id)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Template" : "New Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as TemplateStatus }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>

            <Tabs defaultValue="html">
              <TabsList>
                <TabsTrigger value="html">HTML Content</TabsTrigger>
                <TabsTrigger value="text">Plain Text</TabsTrigger>
              </TabsList>
              <TabsContent value="html">
                <Textarea rows={10} placeholder="Enter HTML content" value={form.content_html}
                  onChange={(e) => setForm((f) => ({ ...f, content_html: e.target.value }))}
                />
              </TabsContent>
              <TabsContent value="text">
                <Textarea rows={10} placeholder="Enter plain text content" value={form.content_text}
                  onChange={(e) => setForm((f) => ({ ...f, content_text: e.target.value }))}
                />
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveTemplate}>{editing ? "Save Changes" : "Create Template"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview: {editing?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(() => {
              const content = editing?.content_html || editing?.content_text || "";
              if (!content) {
                return <p className="text-muted-foreground">No content to preview</p>;
              }
              const isHtml = looksLikeHtml(content);
              if (isHtml) {
                return (
                  <Card>
                    <CardHeader>
                      <CardTitle>HTML</CardTitle>
                      <CardDescription>Rendered version</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
                    </CardContent>
                  </Card>
                );
              }
              return (
                <Card>
                  <CardHeader>
                    <CardTitle>Plain Text</CardTitle>
                    <CardDescription>Raw content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap text-sm">{content}</pre>
                  </CardContent>
                </Card>
              );
            })()}
          </div>
          <DialogFooter>
            <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}