import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Plus, Search, Edit, Trash2, Building2 } from "lucide-react"
import { format } from "date-fns"
import PageHeader from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { hospitalsApi, groupsApi } from "@/services/endpoints"
import { useToast } from "@/components/ui/toast"
import type { Hospital, AdminGroup } from "@/types"

interface HospitalForm {
  name: string
  address: string
  phone: string
  email: string
  registration_number: string
  admin_group_id: string
}

const emptyForm: HospitalForm = {
  name: "",
  address: "",
  phone: "",
  email: "",
  registration_number: "",
  admin_group_id: "",
}

export default function AdminHospitals() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null)
  const [deletingHospital, setDeletingHospital] = useState<Hospital | null>(null)
  const [form, setForm] = useState<HospitalForm>(emptyForm)

  const { data: hospitalsData, isLoading } = useQuery({
    queryKey: ["hospitals", { search }],
    queryFn: () => hospitalsApi.list({ search, page_size: 100 }),
  })

  const { data: groupsData } = useQuery({
    queryKey: ["admin-groups"],
    queryFn: () => groupsApi.list({ page_size: 100 }),
  })

  const createMutation = useMutation({
    mutationFn: (data: HospitalForm) => hospitalsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospitals"] })
      addToast({ title: "Success", description: "Hospital created successfully", variant: "success" })
      closeDialog()
    },
    onError: () => {
      addToast({ title: "Error", description: "Failed to create hospital", variant: "destructive" })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: HospitalForm }) => hospitalsApi.update(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospitals"] })
      addToast({ title: "Success", description: "Hospital updated successfully", variant: "success" })
      closeDialog()
    },
    onError: () => {
      addToast({ title: "Error", description: "Failed to update hospital", variant: "destructive" })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hospitalsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospitals"] })
      addToast({ title: "Success", description: "Hospital deleted successfully", variant: "success" })
      setDeleteDialogOpen(false)
      setDeletingHospital(null)
    },
    onError: () => {
      addToast({ title: "Error", description: "Failed to delete hospital", variant: "destructive" })
    },
  })

  const hospitals: Hospital[] = (hospitalsData || []).filter((h: Hospital) => {
    if (statusFilter === "all") return true
    return statusFilter === "active" ? h.is_active : !h.is_active
  })

  const groups: AdminGroup[] = groupsData || []

  function openCreateDialog() {
    setEditingHospital(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEditDialog(hospital: Hospital) {
    setEditingHospital(hospital)
    setForm({
      name: hospital.name,
      address: hospital.address || "",
      phone: hospital.phone || "",
      email: hospital.email || "",
      registration_number: hospital.registration_number || "",
      admin_group_id: hospital.admin_group_id,
    })
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingHospital(null)
    setForm(emptyForm)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingHospital) {
      updateMutation.mutate({ id: editingHospital.id, payload: form })
    } else {
      createMutation.mutate(form)
    }
  }

  function confirmDelete(hospital: Hospital) {
    setDeletingHospital(hospital)
    setDeleteDialogOpen(true)
  }

  function handleDelete() {
    if (deletingHospital) {
      deleteMutation.mutate(deletingHospital.id)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <PageHeader title="Hospitals" description="Manage hospitals across admin groups">
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4" /> Add Hospital
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search hospitals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              {["all", "active", "inactive"].map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(s)}
                >
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : hospitals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Building2 className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No hospitals yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by adding your first hospital.
              </p>
              <Button className="mt-4" onClick={openCreateDialog}>
                <Plus className="h-4 w-4" /> Add Hospital
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Address</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Registration No.</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hospitals.map((hospital) => (
                    <motion.tr
                      key={hospital.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="px-4 py-3 font-medium">{hospital.name}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                        {hospital.address || "—"}
                      </td>
                      <td className="px-4 py-3">{hospital.phone || "—"}</td>
                      <td className="px-4 py-3">{hospital.email || "—"}</td>
                      <td className="px-4 py-3">{hospital.registration_number || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={hospital.is_active ? "success" : "secondary"}>
                          {hospital.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(hospital)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => confirmDelete(hospital)}>
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
            <DialogTitle>{editingHospital ? "Edit Hospital" : "Add Hospital"}</DialogTitle>
            <DialogDescription>
              {editingHospital ? "Update the hospital details." : "Fill in the details to add a new hospital."}
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
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="registration_number">Registration Number</Label>
                <Input
                  id="registration_number"
                  value={form.registration_number}
                  onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="admin_group">Admin Group</Label>
                <Select
                  value={form.admin_group_id}
                  onValueChange={(v) => setForm({ ...form, admin_group_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select admin group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <DialogTitle>Delete Hospital</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingHospital?.name}"? This action cannot be undone.
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
