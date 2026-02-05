import { useState } from "react";

export default function Landing({ onAuth }) {
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
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <img
                src="/logo.png"
                alt="Perapera logo"
                className="h-16 w-16 object-contain"
              />
              <h1 className="text-5xl font-bold tracking-tight text-emerald-800">
                Perapera
              </h1>
            </div>
            <p className="text-xl text-emerald-700 mb-2">
              Share short language thoughts with friends
            </p>
            <p className="text-sm text-emerald-600/80">
              Connect with language learners and share phrases, vocab, and insights
            </p>
          </div>

          {/* Auth Card */}
          <div className="max-w-md mx-auto bg-white border border-emerald-100 rounded-3xl p-8 shadow-[0_18px_60px_rgba(15,118,110,0.18)]">
            <div className="flex justify-center mb-6 bg-emerald-50 rounded-full p-0.5">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                  mode === "login"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-emerald-600"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                  mode === "register"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-emerald-600"
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
