import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
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
import { Plus, Search, Eye, Receipt, DollarSign, CreditCard, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import PageHeader from "@/components/layout/page-header"
import KpiCard from "@/components/layout/kpi-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { billingApi } from "@/services/endpoints"
import type { Billing, PaginatedResponse } from "@/types"

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive" | "success" | "warning"> = {
  PAID: "success",
  PARTIAL: "warning",
  PENDING: "default",
  OVERDUE: "destructive",
}

export default function BillingList() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading } = useQuery<PaginatedResponse<Billing>>({
    queryKey: ["billings"],
    queryFn: () => billingApi.list({ page_size: 100 }),
  })

  const billings: Billing[] = useMemo(
    () => (data?.items || data || []) as Billing[],
    [data]
  )

  const kpis = useMemo(() => {
    const total = billings.reduce((s, b) => s + b.total_amount, 0)
    const paid = billings.reduce((s, b) => s + b.paid_amount, 0)
    const pending = billings.reduce((s, b) => s + b.pending_amount, 0)
    return { total, paid, pending }
  }, [billings])

  const columns = useMemo<ColumnDef<Billing>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Invoice #",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            #{row.original.id.slice(0, 8)}
          </span>
        ),
      },
      {
        accessorKey: "case.patient.full_name",
        header: "Patient",
        cell: ({ row }) => row.original.case?.patient?.full_name || "—",
      },
      {
        accessorKey: "case.chief_complaint",
        header: "Case",
        cell: ({ row }) => {
          const complaint = row.original.case?.chief_complaint
          return complaint ? (
            <span className="max-w-[120px] truncate block">{complaint}</span>
          ) : (
            "—"
          )
        },
      },
      {
        accessorKey: "total_amount",
        header: "Total",
        cell: ({ row }) => (
          <span className="font-medium">
            ${row.original.total_amount.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "paid_amount",
        header: "Paid",
        cell: ({ row }) => (
          <span className="text-green-600">
            ${row.original.paid_amount.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "pending_amount",
        header: "Pending",
        cell: ({ row }) => (
          <span className="text-amber-600">
            ${row.original.pending_amount.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "payment_status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={statusVariant[row.original.payment_status] || "default"}>
            {row.original.payment_status}
          </Badge>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Date",
        cell: ({ row }) =>
          format(new Date(row.original.created_at), "MMM dd, yyyy"),
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
    data: billings,
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

  return (
    <div className="space-y-6">
      <PageHeader title="Billing" description="Manage invoices and payments">
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> New Invoice
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          title="Total Revenue"
          value={`$${kpis.total.toLocaleString()}`}
          icon={DollarSign}
          description="All time revenue"
        />
        <KpiCard
          title="Paid Amount"
          value={`$${kpis.paid.toLocaleString()}`}
          icon={CreditCard}
          description="Total collected"
        />
        <KpiCard
          title="Pending Amount"
          value={`$${kpis.pending.toLocaleString()}`}
          icon={AlertCircle}
          description="Outstanding payments"
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : billings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Receipt className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No invoices yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first invoice.
              </p>
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" /> New Invoice
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
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New Invoice</DialogTitle>
            <DialogDescription>
              Create a new invoice for a patient.
            </DialogDescription>
          </DialogHeader>
          <form>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="case">Case</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select case" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="case-1">Case 1</SelectItem>
                    <SelectItem value="case-2">Case 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="total">Total Amount</Label>
                <Input id="total" type="number" placeholder="0" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="paid">Paid Amount</Label>
                <Input id="paid" type="number" placeholder="0" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="INSURANCE">Insurance</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" />
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
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
