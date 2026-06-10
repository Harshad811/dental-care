import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Plus, Search, Edit, Trash2, Shield } from "lucide-react"
import { format } from "date-fns"
import PageHeader from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { groupsApi } from "@/services/endpoints"
import { useToast } from "@/components/ui/toast"
import type { AdminGroup } from "@/types"

interface GroupForm {
  name: string
  description: string
  is_active: boolean
}

const emptyForm: GroupForm = { name: "", description: "", is_active: true }

export default function AdminGroups() {
  console.log("[PAGE] AdminGroups mounted", { path: window.location.pathname })
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<AdminGroup | null>(null)
  const [deletingGroup, setDeletingGroup] = useState<AdminGroup | null>(null)
  const [form, setForm] = useState<GroupForm>(emptyForm)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-groups", { search }],
    queryFn: () => groupsApi.list({ search, page_size: 100 }),
  })

  const createMutation = useMutation({
    mutationFn: (data: GroupForm) => groupsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] })
      addToast({ title: "Success", description: "Group created successfully", variant: "success" })
      closeDialog()
    },
    onError: () => {
      addToast({ title: "Error", description: "Failed to create group", variant: "destructive" })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: GroupForm }) => groupsApi.update(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] })
      addToast({ title: "Success", description: "Group updated successfully", variant: "success" })
      closeDialog()
    },
    onError: () => {
      addToast({ title: "Error", description: "Failed to update group", variant: "destructive" })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => groupsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] })
      addToast({ title: "Success", description: "Group deleted successfully", variant: "success" })
      setDeleteDialogOpen(false)
      setDeletingGroup(null)
    },
    onError: () => {
      addToast({ title: "Error", description: "Failed to delete group", variant: "destructive" })
    },
  })

  const groups: AdminGroup[] = data || []

  function openCreateDialog() {
    setEditingGroup(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEditDialog(group: AdminGroup) {
    setEditingGroup(group)
    setForm({ name: group.name, description: group.description || "", is_active: group.is_active })
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingGroup(null)
    setForm(emptyForm)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup.id, payload: form })
    } else {
      createMutation.mutate(form)
    }
  }

  function confirmDelete(group: AdminGroup) {
    setDeletingGroup(group)
    setDeleteDialogOpen(true)
  }

  function handleDelete() {
    if (deletingGroup) {
      deleteMutation.mutate(deletingGroup.id)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Groups" description="Manage admin groups and their permissions">
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4" /> Create Group
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-6">
          <div className="relative w-full sm:w-72 mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Shield className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No admin groups yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by creating your first admin group.
              </p>
              <Button className="mt-4" onClick={openCreateDialog}>
                <Plus className="h-4 w-4" /> Create Group
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Hospitals</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created At</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <motion.tr
                      key={group.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="px-4 py-3 font-medium">{group.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {group.description || "—"}
                      </td>
                      <td className="px-4 py-3">{(group as any).hospitals_count ?? 0}</td>
                      <td className="px-4 py-3">
                        <Badge variant={group.is_active ? "success" : "secondary"}>
                          {group.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {format(new Date(group.created_at), "MMM dd, yyyy")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(group)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => confirmDelete(group)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingGroup ? "Edit Group" : "Create Group"}</DialogTitle>
            <DialogDescription>
              {editingGroup ? "Update the admin group details." : "Fill in the details to create a new admin group."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingGroup?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
