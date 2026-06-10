import type { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number; positive: boolean }
  description?: string
  className?: string
}

export default function KpiCard({ title, value, icon: Icon, trend, description, className }: KpiCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn("group rounded-xl border border-gray-100 bg-white shadow-card transition-all duration-200 hover:shadow-card-hover", className)}
    >
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold tracking-tight text-gray-900">{value}</p>
            {trend && (
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                  trend.positive ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
                )}>
                  {trend.positive ? "\u2191" : "\u2193"} {Math.abs(trend.value)}%
                </span>
                {description && <span className="text-xs text-gray-400">{description}</span>}
              </div>
            )}
            {!trend && description && <p className="text-xs text-gray-400">{description}</p>}
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
