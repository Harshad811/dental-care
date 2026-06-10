import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Plus, Stethoscope, Clock, DollarSign, FileText } from "lucide-react"
import { format } from "date-fns"
import PageHeader from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { treatmentApi } from "@/services/endpoints"
import type { TreatmentPlan, PaginatedResponse } from "@/types"

export default function TreatmentList() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    case_id: "",
    treatment_name: "",
    description: "",
    cost: 0,
    duration_minutes: 0,
    notes: "",
  })

  const { data, isLoading } = useQuery<PaginatedResponse<TreatmentPlan>>({
    queryKey: ["treatment-plans"],
    queryFn: () => treatmentApi.list({ page_size: 100 }),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => treatmentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatment-plans"] })
      setDialogOpen(false)
      setForm({ case_id: "", treatment_name: "", description: "", cost: 0, duration_minutes: 0, notes: "" })
    },
  })

  const plans: TreatmentPlan[] = useMemo(
    () => (data?.items || data || []) as TreatmentPlan[],
    [data]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(form)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Treatment Plans" description="Manage treatment plans">
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> New Plan
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No treatment plans yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first treatment plan.
          </p>
          <Button className="mt-4" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> New Plan
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const totalSittings = plan.sittings?.length || 0
            const progress = totalSittings > 0 ? Math.min(100, Math.round((totalSittings / 5) * 100)) : 0

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{plan.treatment_name}</CardTitle>
                      <Badge variant="outline">{totalSittings} sittings</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {plan.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {plan.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        {plan.cost.toLocaleString()}
                      </span>
                      {plan.duration_minutes && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {plan.duration_minutes} min
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created {format(new Date(plan.created_at), "MMM dd, yyyy")}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New Treatment Plan</DialogTitle>
            <DialogDescription>
              Create a new treatment plan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="case">Case ID</Label>
                <Input
                  id="case"
                  value={form.case_id}
                  onChange={(e) => setForm({ ...form, case_id: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Treatment Name</Label>
                <Input
                  id="name"
                  value={form.treatment_name}
                  onChange={(e) =>
                    setForm({ ...form, treatment_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cost">Cost</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={form.cost}
                    onChange={(e) =>
                      setForm({ ...form, cost: Number(e.target.value) })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={form.duration_minutes}
                    onChange={(e) =>
                      setForm({ ...form, duration_minutes: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
