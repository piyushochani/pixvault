import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/helpers";
import { Images, Search, Sparkles, FolderOpen, Trash2, Download } from "lucide-react";

const FEATURES = [
  { Icon: Images,     title: "Smart uploads",       desc: "Drag & drop images with AI-generated captions automatically." },
  { Icon: Sparkles,   title: "Semantic search",      desc: "Describe a photo in plain English — AI finds it visually." },
  { Icon: Search,     title: "Keyword search",       desc: "Instantly search your own descriptions." },
  { Icon: FolderOpen, title: "Folder organisation",  desc: "Create folders and organise your library." },
  { Icon: Trash2,     title: "Recycle bin",          desc: "Deleted images stay recoverable for 24 hours." },
  { Icon: Download,   title: "Download anytime",     desc: "Download any image in original quality." },
];

export default function IntroPage() {
  const { login, register } = useAuth();
  const [mode, setMode]     = useState("login");   // "login" | "signup"
  const [email, setEmail]   = useState("");
  const [password, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50">
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">

          {/* Left: hero text */}
          <div className="flex-1 text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 px-3 py-1.5 rounded-full text-sm font-medium">
              <Sparkles size={14} /> AI-powered image management
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight">
              Your images,<br />
              <span className="text-brand-500">intelligently organised.</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-lg leading-relaxed">
              Upload photos, let AI describe them, then find any image just by
              describing what you remember — no manual tagging needed.
            </p>

            {/* Features grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {FEATURES.map(({ Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={15} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: auth card */}
          <div className="w-full max-w-sm flex-shrink-0">
            <div className="card p-8 shadow-xl">
              {/* Logo */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <Images size={24} className="text-brand-500" />
                <span className="text-xl font-bold text-gray-900">PixVault</span>
              </div>

              {/* Tab toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                {["login", "signup"].map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError(null); }}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                      mode === m
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {m === "login" ? "Log in" : "Sign up"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder="••••••••"
                    className="input-base"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full mt-2"
                >
                  {loading
                    ? "Please wait…"
                    : mode === "login" ? "Log in" : "Get started"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}