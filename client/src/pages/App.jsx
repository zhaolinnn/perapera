import React, { useEffect, useState } from "react";

function useMe() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const res = await fetch("/api/auth/me", {
      credentials: "include",
    });
    const data = await res.json();
    setUser(data.user);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  return { user, loading, refresh, setUser };
}

function AuthForm({ onAuth }) {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-emerald-100">
      <div className="w-full max-w-md bg-white border border-emerald-100 rounded-3xl p-8 shadow-[0_18px_60px_rgba(15,118,110,0.18)]">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-9 w-9 rounded-2xl bg-emerald-400 flex items-center justify-center shadow-inner">
            <span className="text-xl font-black text-white leading-none">ぺ</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-emerald-700">
            Perapera
          </h1>
        </div>
        <p className="text-sm text-emerald-800/80 text-center mb-6">
          Share short language thoughts with friends.
        </p>
        <div className="flex justify-center mb-6 bg-emerald-50 rounded-full p-0.5">
          <button
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
              mode === "login"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-emerald-600"
            }`}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
              mode === "register"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-emerald-600"
            }`}
            onClick={() => setMode("register")}
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
  );
}

function Feed({ user, onLogout }) {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPosts() {
    setLoading(true);
    try {
      const res = await fetch("/api/posts", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load posts");
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  async function createPost(e) {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to create post");
      setContent("");
      loadPosts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deletePost(id) {
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-emerald-100">
      <header className="border-b border-emerald-100 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full text-xs">
              @{user.username}
            </span>
            <button
              onClick={onLogout}
              className="px-3 py-1 rounded-full border border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <form
          onSubmit={createPost}
          className="bg-white border border-emerald-100 rounded-3xl p-4 space-y-3 shadow-sm"
        >
          <textarea
            rows={3}
            className="w-full resize-none rounded-2xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            placeholder="Share a phrase, vocab, or thought…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-xs font-semibold text-white shadow-[0_10px_30px_rgba(16,185,129,0.6)]"
            >
              Post
            </button>
          </div>
        </form>
        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </p>
        )}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-emerald-900">
            Community feed
          </h2>
          {loading ? (
            <p className="text-xs text-emerald-700/70">Loading posts...</p>
          ) : posts.length === 0 ? (
            <p className="text-xs text-emerald-700/70">
              No posts yet. Be the first to share something!
            </p>
          ) : (
            <ul className="space-y-3">
              {posts.map((post) => (
                <li
                  key={post.id}
                  className="bg-white border border-emerald-100 rounded-2xl p-3 text-sm shadow-sm"
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <div>
                      <p className="font-semibold text-xs text-emerald-800">
                        @{post.author}
                      </p>
                      <p className="text-[11px] text-emerald-700/70">
                        {new Date(post.created_at).toLocaleString()}
                      </p>
                    </div>
                    {post.author === user.username && (
                      <button
                        onClick={() => deletePost(post.id)}
                        className="text-[11px] text-red-500 hover:text-red-400"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">
                    {post.content}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default function App() {
  const { user, loading, refresh } = useMe();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-emerald-700">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuth={refresh} />;
  }

  return <Feed user={user} onLogout={handleLogout} />;
}

