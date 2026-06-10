import { motion } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import { Calendar, DollarSign, Users, FolderOpen, Sparkles } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { dashboardApi } from "@/services/endpoints"
import { Skeleton } from "@/components/ui/skeleton"
import KpiCard from "@/components/layout/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

export default function HospitalAdminDashboard() {
  const { user } = useAuthStore()
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dash", "hospital", user?.id],
    queryFn: () => dashboardApi.hospitalAdmin(),
  })

  if (!user) return null

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-80" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)}</div>
      </div>
    )
  }

  const hasData = stats && (stats.total_patients || stats.today_appointments || stats.total_cases)

  return (
    <motion.div className="space-y-8" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{user.full_name}</h1>
            <span className="hidden sm:flex h-2 w-2 rounded-full bg-success animate-pulse" />
          </div>
          <p className="mt-1 text-gray-500">Hospital operations at a glance</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-soft border border-primary-100">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">Hospital Dashboard</span>
        </div>
      </motion.div>

      <motion.div variants={container} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Calendar} title="Today Appointments" value={stats?.today_appointments ?? 0} />
        <KpiCard icon={DollarSign} title="Revenue" value={stats?.total_revenue != null ? `$${(stats.total_revenue / 1000).toFixed(1)}k` : "$0"} />
        <KpiCard icon={Users} title="Total Patients" value={stats?.total_patients ?? 0} />
        <KpiCard icon={FolderOpen} title="Total Cases" value={stats?.total_cases ?? 0} />
      </motion.div>

      {!hasData ? (
        <motion.div variants={item} className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white px-6 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">No activity yet</h2>
          <p className="mt-1.5 text-sm text-gray-500 max-w-sm">Patient registrations and appointments will appear here.</p>
        </motion.div>
      ) : (
        <motion.div variants={item}>
          <Card>
            <CardHeader><CardTitle>Hospital Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Today</p>
                  <p className="mt-1.5 text-2xl font-bold text-gray-900">{stats?.today_appointments ?? 0}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Patients</p>
                  <p className="mt-1.5 text-2xl font-bold text-gray-900">{stats?.total_patients ?? 0}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cases</p>
                  <p className="mt-1.5 text-2xl font-bold text-gray-900">{stats?.total_cases ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
