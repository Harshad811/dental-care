import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { motion } from "framer-motion"
import {
  Plus,
  Search,
  Eye,
  Calendar,
  List,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from "date-fns"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { appointmentsApi } from "@/services/endpoints"
import type { Appointment, PaginatedResponse } from "@/types"
import { cn } from "@/lib/utils"

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive" | "success" | "warning"> = {
  SCHEDULED: "default",
  CONFIRMED: "success",
  IN_PROGRESS: "warning",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
  NO_SHOW: "outline",
}

export default function AppointmentList() {
  const queryClient = useQueryClient()
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [view, setView] = useState<"list" | "calendar">("list")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [form, setForm] = useState({
    patient_id: "",
    doctor_id: "",
    appointment_date: "",
    appointment_time: "",
    notes: "",
  })

  const { data, isLoading } = useQuery<PaginatedResponse<Appointment>>({
    queryKey: ["appointments"],
    queryFn: () => appointmentsApi.list({ page_size: 100 }),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => appointmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
      setDialogOpen(false)
      setForm({ patient_id: "", doctor_id: "", appointment_date: "", appointment_time: "", notes: "" })
    },
  })

  const appointments: Appointment[] = useMemo(
    () => (data?.items || data || []) as Appointment[],
    [data]
  )

  const columns = useMemo<ColumnDef<Appointment>[]>(
    () => [
      {
        accessorKey: "patient.full_name",
        header: "Patient Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.patient?.full_name || "—"}</span>
        ),
      },
      {
        accessorKey: "doctor.full_name",
        header: "Doctor",
        cell: ({ row }) => row.original.doctor?.full_name || "—",
      },
      {
        accessorKey: "appointment_date",
        header: "Date",
        cell: ({ row }) =>
          format(new Date(row.original.appointment_date), "MMM dd, yyyy"),
      },
      {
        accessorKey: "appointment_time",
        header: "Time",
        cell: ({ row }) => row.original.appointment_time || "—",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={statusVariant[row.original.status] || "default"}>
            {row.original.status.replace(/_/g, " ")}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: () => (
          <Button variant="ghost" size="icon">
            <Eye className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: appointments,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  const startDay = getDay(startOfMonth(currentMonth))
  const calendarDays: (Date | null)[] = [
    ...Array.from({ length: startDay }, () => null),
    ...monthDays,
  ]

  const appointmentsByDate = useMemo(() => {
    const map: Record<string, number> = {}
    appointments.forEach((a) => {
      const key = format(new Date(a.appointment_date), "yyyy-MM-dd")
      map[key] = (map[key] || 0) + 1
    })
    return map
  }, [appointments])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(form)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Appointments" description="Manage appointments">
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> New Appointment
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search appointments..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={view === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "calendar" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("calendar")}
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {view === "calendar" && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {format(currentMonth, "MMMM yyyy")}
                </h3>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setCurrentMonth(
                        new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
                      )
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentMonth(new Date())}
                  >
                    <CalendarDays className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setCurrentMonth(
                        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                      )
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div
                    key={d}
                    className="py-2 text-center text-xs font-medium text-muted-foreground"
                  >
                    {d}
                  </div>
                ))}
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} />
                  const key = format(day, "yyyy-MM-dd")
                  const count = appointmentsByDate[key]
                  const isToday = isSameDay(day, new Date())
                  return (
                    <div
                      key={key}
                      className={cn(
                        "relative flex h-16 flex-col items-center justify-center rounded-lg border text-sm transition-colors hover:bg-muted/50 cursor-pointer",
                        isToday && "border-primary bg-primary/5"
                      )}
                    >
                      <span className="text-xs">{format(day, "d")}</span>
                      {count && (
                        <span className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">
                          {count}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {view === "list" && (
            <>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <CalendarDays className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">No appointments yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Schedule your first appointment.
                  </p>
                  <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4" /> New Appointment
                  </Button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        {table.getHeaderGroups().map((hg) => (
                          <tr key={hg.id} className="border-b bg-muted/50">
                            {hg.headers.map((header) => (
                              <th
                                key={header.id}
                                className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none"
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                <div className="flex items-center gap-1">
                                  {flexRender(header.column.columnDef.header, header.getContext())}
                                  {{
                                    asc: " ↑",
                                    desc: " ↓",
                                  }[header.column.getIsSorted() as string] ?? null}
                                </div>
                              </th>
                            ))}
                          </tr>
                        ))}
                      </thead>
                      <tbody>
                        {table.getRowModel().rows.map((row) => (
                          <motion.tr
                            key={row.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="border-b transition-colors hover:bg-muted/50"
                          >
                            {row.getVisibleCells().map((cell) => (
                              <td key={cell.id} className="px-4 py-3">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            ))}
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New Appointment</DialogTitle>
            <DialogDescription>
              Schedule a new appointment for a patient.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="patient">Patient</Label>
                <Select
                  value={form.patient_id}
                  onValueChange={(v) => setForm({ ...form, patient_id: v })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient-1">Patient 1</SelectItem>
                    <SelectItem value="patient-2">Patient 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="doctor">Doctor</Label>
                <Select
                  value={form.doctor_id}
                  onValueChange={(v) => setForm({ ...form, doctor_id: v })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor-1">Doctor 1</SelectItem>
                    <SelectItem value="doctor-2">Doctor 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.appointment_date}
                    onChange={(e) =>
                      setForm({ ...form, appointment_date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={form.appointment_time}
                    onChange={(e) =>
                      setForm({ ...form, appointment_time: e.target.value })
                    }
                    required
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
