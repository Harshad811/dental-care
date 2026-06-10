import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { PanelLeftOpen, Search, Bell, ChevronDown, LogOut, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebarStore } from "@/store/sidebarStore"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default function Navbar() {
  const { collapsed, toggle, setMobileOpen } = useSidebarStore()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)

  const initials = user?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U"

  return (
    <header className={cn(
      "fixed top-0 right-0 z-20 flex h-16 items-center border-b border-gray-100 bg-white/80 backdrop-blur-md px-4 transition-all duration-300",
      collapsed ? "lg:left-[72px]" : "lg:left-[260px]"
    )}>
      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={toggle}
            className="hidden lg:flex text-gray-400 hover:text-gray-600">
            <PanelLeftOpen className={cn("h-5 w-5 transition-transform", collapsed && "rotate-180")} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setMobileOpen(true)}
            className="flex lg:hidden text-gray-400">
            <PanelLeftOpen className="h-5 w-5" />
          </Button>
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search patients, cases..." className="h-9 w-56 lg:w-72 pl-9 bg-gray-50 border-0 focus:bg-white" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" className="relative text-gray-400 hover:text-gray-600">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">3</span>
          </Button>

          <div className="relative">
            <button onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 rounded-lg pl-2 pr-3 py-1.5 transition-colors hover:bg-gray-100">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary-soft text-xs font-medium text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-gray-900 leading-tight">{user?.full_name ?? "User"}</p>
                <p className="text-xs text-gray-400 leading-tight">{user?.role?.replace("_", " ") ?? ""}</p>
              </div>
              <ChevronDown className="hidden lg:block h-3.5 w-3.5 text-gray-400" />
            </button>
            <AnimatePresence>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <motion.div initial={{ opacity: 0, y: -4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.96 }} transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full z-20 mt-1.5 w-56 rounded-xl border border-gray-100 bg-white p-1.5 shadow-dropdown">
                    <div className="border-b border-gray-100 px-3 py-3">
                      <p className="text-sm font-medium text-gray-900">{user?.full_name ?? "User"}</p>
                      <p className="text-xs text-gray-400">{user?.email ?? ""}</p>
                    </div>
                    <div className="pt-1">
                      <Link to="/settings" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900">
                        <User className="h-4 w-4" /> Profile
                      </Link>
                      <button onClick={() => { setProfileOpen(false); logout(); navigate("/login") }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger-soft">
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}
