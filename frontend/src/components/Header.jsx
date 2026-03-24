import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Images, FolderOpen, LayoutDashboard, Trash2, LogOut } from "lucide-react";

const NAV = [
  { to: "/overview", label: "Overview",   Icon: LayoutDashboard },
  { to: "/images",   label: "All Images", Icon: Images },
  { to: "/folders",  label: "Folders",    Icon: FolderOpen },
  { to: "/recycle",  label: "Recycle Bin",Icon: Trash2 },
];

export default function Header() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/overview" className="flex items-center gap-2 font-bold text-lg text-brand-600">
          <Images size={22} />
          PixVault
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === to
                  ? "bg-brand-50 text-brand-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        {/* User + logout */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-gray-500 truncate max-w-[180px]">
            {user?.email}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="md:hidden flex border-t border-gray-100 overflow-x-auto">
        {NAV.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              pathname === to ? "text-brand-600" : "text-gray-500"
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}