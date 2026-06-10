import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { Eye, EyeOff, LogIn, Stethoscope } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { authApi } from "@/services/endpoints"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from || "/"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      console.log("[LOGIN] Attempting login", { email })
      const res = await authApi.login({ email, password })
      console.log("[LOGIN] Login successful", { role: res.user.role, hasTokens: !!res.access_token })
      setAuth(res.user, res.access_token, res.refresh_token)
      console.log("[LOGIN] Navigate to", from)
      navigate(from, { replace: true })
    } catch (err: any) {
      console.log("[LOGIN] Login failed", err?.response?.data?.detail || err.message)
      setError(err?.response?.data?.detail || "Invalid credentials")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-[#1a3a5c]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/10 to-transparent" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">DentalCare</span>
          </div>
          <div className="max-w-md">
            <blockquote className="text-2xl font-light leading-relaxed text-white/90">
              "The best dental practice management platform. Streamlines operations, enhances patient care, and drives growth."
            </blockquote>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">DR</div>
              <div>
                <p className="text-sm font-medium text-white">Dr. Sarah Mitchell</p>
                <p className="text-xs text-white/60">Chief Dental Officer, SmileCare Group</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-white/40">&copy; 2026 DentalCare. All rights reserved.</p>
        </div>
      </motion.div>

      <div className="flex w-full items-center justify-center lg:w-1/2 bg-bg p-6 sm:p-12">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full max-w-sm">
          <div className="mb-10 flex lg:hidden items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">DentalCare</span>
          </div>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="mt-1.5 text-sm text-gray-500">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" value={email}
                onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-xs text-primary hover:text-primary-dark transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password"
                  value={password} onChange={(e) => setPassword(e.target.value)} required className="pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-danger-soft px-4 py-2.5 text-sm text-danger">
                {error}
              </motion.p>
            )}

            <Button type="submit" disabled={loading} className="w-full h-11">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" /> Sign in
                </span>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
