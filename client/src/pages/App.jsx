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
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-xl p-8 shadow-xl">
        <h1 className="text-2xl font-semibold mb-6 text-center">Perapera</h1>
        <div className="flex justify-center mb 6">
          <button
            className={`px-3 py-1 rounded-l-full text-sm border border-slate-700 ${
              mode === "login" ? "bg-slate-100 text-slate-900" : "bg-slate-800"
            }`}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={`px-3 py-1 rounded-r-full text-sm border border-slate-700 border-l-0 ${
              mode === "register" ? "bg-slate-100 text-slate-900" : "bg-slate-800"
            }`}
            onClick={() => setMode("register")}
          >
            Sign up
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Username</label>
            <input
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition text-sm font-medium"
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <h1 className="font-semibold">Perapera</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-300">@{user.username}</span>
            <button
              onClick={onLogout}
              className="px-3 py-1 rounded-full border border-slate-700 text-xs hover:bg-slate-800"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <form
          onSubmit={createPost}
          className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3"
        >
          <textarea
            rows={3}
            className="w-full resize-none rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-full bg-indigo-500 hover:bg-indigo-400 text-xs font-medium"
            >
              Post
            </button>
          </div>
        </form>
        {error && (
          <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-slate-300">Feed</h2>
          {loading ? (
            <p className="text-xs text-slate-400">Loading posts...</p>
          ) : posts.length === 0 ? (
            <p className="text-xs text-slate-400">No posts yet. Say something!</p>
          ) : (
            <ul className="space-y-3">
              {posts.map((post) => (
                <li
                  key={post.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-sm"
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <div>
                      <p className="font-medium text-xs text-slate-200">
                        @{post.author}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(post.created_at).toLocaleString()}
                      </p>
                    </div>
                    {post.author === user.username && (
                      <button
                        onClick={() => deletePost(post.id)}
                        className="text-[11px] text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-100 whitespace-pre-wrap">
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
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-300">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuth={refresh} />;
  }

  return <Feed user={user} onLogout={handleLogout} />;
}

