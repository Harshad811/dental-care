import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { useSidebarStore } from "@/store/sidebarStore"
import Sidebar from "./sidebar"
import Navbar from "./navbar"

export default function AppLayout({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebarStore()

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <Navbar />
      <main className={cn(
        "min-h-screen pt-16 transition-all duration-300 ease-in-out",
        collapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"
      )}>
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
