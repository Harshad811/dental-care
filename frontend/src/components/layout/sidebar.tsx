import { Link, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Users, FolderOpen, CalendarDays, Stethoscope, Receipt, UserCog, Settings,
  ChevronLeft, Activity, X, Building2, Shield, MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebarStore } from "@/store/sidebarStore"
import { useAuthStore } from "@/store/authStore"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface NavItem { label: string; icon: React.ElementType; path: string; badge?: string }

const roleNav: Record<string, { label: string; items: NavItem[] }[]> = {
  SUPER_ADMIN: [
    { label: "Overview", items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    ]},
    { label: "Administration", items: [
      { label: "Admin Groups", icon: Shield, path: "/admin/groups" },
      { label: "Hospitals", icon: Building2, path: "/admin/hospitals" },
    ]},
    { label: "Settings", items: [
      { label: "Settings", icon: Settings, path: "/settings" },
    ]},
  ],
  GROUP_ADMIN: [
    { label: "Overview", items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    ]},
    { label: "Management", items: [
      { label: "Hospitals", icon: Building2, path: "/admin/hospitals" },
    ]},
    { label: "Settings", items: [
      { label: "Settings", icon: Settings, path: "/settings" },
    ]},
  ],
  HOSPITAL_ADMIN: [
    { label: "Overview", items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    ]},
    { label: "Staff", items: [
      { label: "Consultants", icon: UserCog, path: "/consultants" },
    ]},
    { label: "Operations", items: [
      { label: "Patients", icon: Users, path: "/patients" },
      { label: "Appointments", icon: CalendarDays, path: "/appointments" },
      { label: "Cases", icon: FolderOpen, path: "/cases" },
      { label: "Treatments", icon: Stethoscope, path: "/treatments" },
    ]},
    { label: "Finance", items: [
      { label: "Billing", icon: Receipt, path: "/billing" },
    ]},
    { label: "Communication", items: [
      { label: "WhatsApp", icon: MessageSquare, path: "/whatsapp" },
    ]},
    { label: "Settings", items: [
      { label: "Settings", icon: Settings, path: "/settings" },
    ]},
  ],
  DOCTOR: [
    { label: "Overview", items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    ]},
    { label: "My Work", items: [
      { label: "Patients", icon: Users, path: "/patients" },
      { label: "Appointments", icon: CalendarDays, path: "/appointments" },
      { label: "Cases", icon: FolderOpen, path: "/cases" },
      { label: "Treatments", icon: Stethoscope, path: "/treatments" },
    ]},
    { label: "Settings", items: [
      { label: "Settings", icon: Settings, path: "/settings" },
    ]},
  ],
}

export default function Sidebar() {
  const { collapsed, mobileOpen, toggle, setMobileOpen } = useSidebarStore()
  const { user } = useAuthStore()
  const location = useLocation()
  const role = user?.role || "DOCTOR"
  const sections = roleNav[role] || roleNav.DOCTOR
  const isCollapsed = collapsed

  const initials = user?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U"

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white border-r border-gray-100">
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-100">
        <Link to="/" className="flex items-center gap-3 overflow-hidden" onClick={() => setMobileOpen(false)}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <motion.span
            animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : "auto" }}
            transition={{ duration: 0.2 }}
            className="text-base font-bold text-gray-900 whitespace-nowrap"
          >
            DentalCare
          </motion.span>
        </Link>
        <Button variant="ghost" size="icon-sm" onClick={toggle}
          className="hidden lg:flex text-gray-400 hover:text-gray-600 hover:bg-gray-100">
          <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hide space-y-6">
        {sections.map((section) => (
          <div key={section.label}>
            <motion.p
              animate={{ opacity: isCollapsed ? 0 : 1, height: isCollapsed ? 0 : 18 }}
              className="overflow-hidden px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-1"
            >
              {section.label}
            </motion.p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/")
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "group relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-primary-soft text-primary"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    )}
                  >
                    {isActive && (
                      <motion.div layoutId="nav-indicator"
                        className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
                    )}
                    <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-500")} />
                    <motion.span
                      animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : "auto" }}
                      transition={{ duration: 0.2 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-100 p-3">
        <Link to="/settings" className={cn("flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-gray-100",
          location.pathname === "/settings" && "bg-primary-soft"
        )}>
          <Avatar className="h-8 w-8 shrink-0 ring-2 ring-gray-100">
            <AvatarFallback className="bg-primary-soft text-xs font-medium text-primary">{initials}</AvatarFallback>
          </Avatar>
          <motion.div
            animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : "auto" }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden min-w-0"
          >
            <p className="truncate text-sm font-medium text-gray-900">{user?.full_name ?? "User"}</p>
            <p className="truncate text-xs text-gray-400">{user?.role?.replace("_", " ") ?? ""}</p>
          </motion.div>
        </Link>
      </div>
    </div>
  )

  return (
    <>
      <motion.aside
        animate={{ width: isCollapsed ? 72 : 260 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className="fixed left-0 top-0 z-30 hidden h-screen overflow-hidden lg:block"
      >
        {sidebarContent}
      </motion.aside>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }} className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)} />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 h-screen w-[280px] lg:hidden shadow-xl">
              <Button variant="ghost" size="icon-sm" onClick={() => setMobileOpen(false)}
                className="absolute -right-10 top-3 z-10 h-8 w-8 bg-white/10 text-white hover:bg-white/20">
                <X className="h-4 w-4" />
              </Button>
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
