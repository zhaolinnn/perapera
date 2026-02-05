import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function FlagAnimation() {
  const flags = ["🇨🇳", "🇯🇵", "🇰🇷", "🇫🇷", "🇪🇸", "🇩🇪", "🇮🇹", "🇵🇹"];
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition((prev) => prev + 1);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Create an extended array for seamless looping
  const extendedFlags = [...flags, ...flags, ...flags];
  const centerStart = flags.length; // Start in the middle section

  return (
    <div className="relative flex items-center justify-center h-32 mt-8 overflow-hidden">
      {extendedFlags.map((flag, index) => {
        const offset = index - (centerStart + (position % flags.length));
        const absOffset = Math.abs(offset);
        const isVisible = absOffset <= 3;

        if (!isVisible) return null;

        // Calculate position and scale smoothly with bigger gaps
        const xPosition = offset * 120;
        const scale = isVisible
          ? offset === 0
            ? 1.4
            : absOffset === 1
            ? 1.1
            : absOffset === 2
            ? 0.9
            : 0.7
          : 0.5;
        const opacity = offset === 0 ? 1 : absOffset === 1 ? 0.7 : absOffset === 2 ? 0.4 : 0.2;

        // Use the actual flag index for the key to ensure React recognizes the same flag
        const flagIndex = index % flags.length;

        return (
          <div
            key={`flag-${flagIndex}-pos-${index}`}
            className="absolute transition-all duration-1000 ease-in-out"
            style={{
              transform: `translateX(${xPosition}px) scale(${scale})`,
              opacity: opacity,
              willChange: "transform, opacity",
            }}
          >
            <div className="text-7xl">{flag}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function Landing({ onAuth, user, onLogout }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Request failed");
      }
      await onAuth();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-emerald-100 to-emerald-200">
      <nav className="border-b border-emerald-100 bg-white/90 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Perapera logo"
              className="h-12 w-12 object-contain"
            />
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-emerald-700 text-sm">
                Perapera
              </span>
              <span className="text-[11px] text-emerald-700/70">
                Tiny thoughts in any language.
              </span>
            </div>
          </Link>
          {user && (
            <div className="flex items-center gap-3 text-sm">
              <Link
                to={`/users/${user.username}`}
                className="text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full text-xs hover:bg-emerald-100 transition"
              >
                @{user.username}
              </Link>
              <button
                onClick={onLogout}
                className="px-3 py-1 rounded-full border border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-50"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </nav>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-16 items-center">
            {/* Left Side - Title, Description, and Flags */}
            <div>
              <h1 className="text-5xl font-bold tracking-tight text-emerald-800 mb-4">
                Perapera　ペラペラ
              </h1>
              <p className="text-xl text-emerald-700 mb-2">
                Share short language thoughts with friends
              </p>
              <p className="text-sm text-emerald-600/80 mb-8">
                Connect with language learners and share phrases, vocab, and insights
              </p>
              <FlagAnimation />
            </div>

            {/* Right Side - Auth Card */}
            <div className="bg-white border border-emerald-100 rounded-3xl p-8 shadow-[0_18px_60px_rgba(15,118,110,0.18)] max-w-sm ml-auto lg:ml-0">
            <div className="flex justify-center mb-6 gap-2">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                  mode === "login"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                  mode === "register"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sign up
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1 text-emerald-900">
                  Username
                </label>
                <input
                  className="w-full rounded-2xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-emerald-900">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full rounded-2xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </div>
              {error && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="w-full py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 transition text-sm font-semibold text-white shadow-[0_10px_30px_rgba(16,185,129,0.6)]"
              >
                {mode === "login" ? "Login" : "Create account"}
              </button>
            </form>
            </div>
          </div>

          {/* Features */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-white/60 backdrop-blur border border-emerald-100 rounded-2xl p-6">
              <div className="text-3xl mb-2">📝</div>
              <h3 className="font-semibold text-emerald-800 mb-1">Share Posts</h3>
              <p className="text-xs text-emerald-700/80">
                Post phrases, vocab, and language insights
              </p>
            </div>
            <div className="bg-white/60 backdrop-blur border border-emerald-100 rounded-2xl p-6">
              <div className="text-3xl mb-2">🏷️</div>
              <h3 className="font-semibold text-emerald-800 mb-1">Tag Content</h3>
              <p className="text-xs text-emerald-700/80">
                Organize posts by language (Chinese, Japanese)
              </p>
            </div>
            <div className="bg-white/60 backdrop-blur border border-emerald-100 rounded-2xl p-6">
              <div className="text-3xl mb-2">👥</div>
              <h3 className="font-semibold text-emerald-800 mb-1">Connect</h3>
              <p className="text-xs text-emerald-700/80">
                Follow other learners and build your network
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
