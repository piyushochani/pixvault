import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const NAV_LINKS = [
  { label: "Overview",    path: "/overview" },
  { label: "All Images",  path: "/images"   },
  { label: "Folders",     path: "/folders"  },
  { label: "Recycle Bin", path: "/recycle"  },
]

export default function Header() {
  const { email, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-white/10 h-14 flex items-center px-6">
      {/* Logo */}
      <span className="text-white font-bold text-lg mr-10">
        Pix<span className="text-blue-500">Vault</span>
      </span>

      {/* Nav */}
      <nav className="flex items-center gap-1 flex-1">
        {NAV_LINKS.map(({ label, path }) => {
          const isActive = location.pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? "text-white bg-white/10"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {label}
            </button>
          )
        })}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <span className="text-white/40 text-sm">{email}</span>
        <button
          onClick={handleLogout}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-lg font-medium transition"
        >
          Logout
        </button>
      </div>
    </header>
  )
}