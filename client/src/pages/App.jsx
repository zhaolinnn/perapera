import React, { useEffect, useState, useRef } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import PostCard from "../components/PostCard.jsx";
import Profile from "./Profile.jsx";
import Landing from "./Landing.jsx";

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


function Feed({ user, onLogout }) {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const tagMenuRef = useRef(null);

  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    try {
      const res = await fetch("/api/tags", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load tags");
      const data = await res.json();
      setAvailableTags(data);
    } catch (err) {
      console.error("Failed to load tags:", err);
    }
  }

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

  useEffect(() => {
    function handleClickOutside(event) {
      if (showTagMenu && tagMenuRef.current && !tagMenuRef.current.contains(event.target)) {
        setShowTagMenu(false);
      }
    }
    if (showTagMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showTagMenu]);

  function toggleTag(tagName) {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    );
  }

  async function createPost(e) {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content, tags: selectedTags }),
      });
      if (!res.ok) throw new Error("Failed to create post");
      setContent("");
      setSelectedTags([]);
      setShowTagMenu(false);
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

  async function votePost(postId, voteType) {
    try {
      const currentPost = posts.find((p) => p.id === postId);
      const currentVote = currentPost.user_vote;

      // If clicking the same vote, remove it
      if (currentVote === voteType) {
        const res = await fetch(`/api/posts/${postId}/vote`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to remove vote");
      } else {
        // Otherwise, set the new vote
        const endpoint =
          voteType === 1
            ? `/api/posts/${postId}/upvote`
            : `/api/posts/${postId}/downvote`;
        const res = await fetch(endpoint, {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to vote");
      }
      loadPosts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleFollow(username, isFollowing) {
    try {
      const endpoint = isFollowing
        ? `/api/unfollow/${username}`
        : `/api/follow/${username}`;
      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update follow status");
      }
      // Update the specific post's follow status without reloading all posts
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.author === username
            ? { ...post, is_following: !isFollowing }
            : post
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function createComment(postId, content) {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to post comment");
      }
      loadPosts();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function deleteComment(commentId) {
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete comment");
      loadPosts();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-emerald-100">
      <Header user={user} onLogout={onLogout} />
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
          <div className="flex items-center justify-between">
            <div className="relative" ref={tagMenuRef}>
              <button
                type="button"
                onClick={() => setShowTagMenu(!showTagMenu)}
                className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition"
              >
                Add tag(s)
              </button>
              {showTagMenu && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-emerald-100 rounded-xl shadow-lg p-2 z-10 min-w-[200px]">
                  {availableTags.map((tag) => {
                    const isChinese = tag.name === "chinese";
                    const isJapanese = tag.name === "japanese";
                    const isSelected = selectedTags.includes(tag.name);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.name)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${
                          isSelected
                            ? isChinese
                              ? "bg-red-100 text-red-700 font-medium"
                              : isJapanese
                              ? "bg-blue-100 text-blue-700 font-medium"
                              : "bg-emerald-100 text-emerald-700 font-medium"
                            : isChinese
                            ? "text-red-700 hover:bg-red-50"
                            : isJapanese
                            ? "text-blue-700 hover:bg-blue-50"
                            : "text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {tag.display_name}
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedTags.map((tagName) => {
                    const tag = availableTags.find((t) => t.name === tagName);
                    const isChinese = tagName === "chinese";
                    const isJapanese = tagName === "japanese";
                    return (
                      <span
                        key={tagName}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          isChinese
                            ? "bg-red-50 border border-red-200 text-red-700"
                            : isJapanese
                            ? "bg-blue-50 border border-blue-200 text-blue-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {tag?.display_name || tagName}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
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
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={user}
                  onDelete={deletePost}
                  onVote={votePost}
                  onToggleFollow={toggleFollow}
                  onComment={createComment}
                  onDeleteComment={deleteComment}
                  onRefresh={loadPosts}
                />
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

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            <Feed user={user} onLogout={handleLogout} />
          ) : (
            <Landing onAuth={refresh} />
          )
        }
      />
      <Route
        path="/users/:username"
        element={
          user ? (
            <Profile user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
  );
}

