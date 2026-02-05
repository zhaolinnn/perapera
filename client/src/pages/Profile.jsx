import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import PostCard from "../components/PostCard.jsx";

export default function Profile({ user, onLogout }) {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, [username]);

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/users/${username}`, {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 404) {
          setError("User not found");
        } else {
          throw new Error("Failed to load profile");
        }
        return;
      }
      const data = await res.json();
      setProfileUser(data.user);
      setPosts(data.posts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFollow(isFollowing) {
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
      loadProfile();
    } catch (err) {
      setError(err.message);
    }
  }

  async function votePost(postId, voteType) {
    try {
      const currentPost = posts.find((p) => p.id === postId);
      const currentVote = currentPost.user_vote;

      if (currentVote === voteType) {
        const res = await fetch(`/api/posts/${postId}/vote`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to remove vote");
      } else {
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
      loadProfile();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-emerald-100">
        <Header user={user} onLogout={onLogout} />
        <main className="mx-auto max-w-4xl px-4 py-6">
          <p className="text-sm text-emerald-700">Loading profile...</p>
        </main>
      </div>
    );
  }

  if (error && !profileUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-emerald-100">
        <Header user={user} onLogout={onLogout} />
        <main className="mx-auto max-w-4xl px-4 py-6">
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-sm text-white"
          >
            Back to feed
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-emerald-100">
      <Header user={user} onLogout={onLogout} />
      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-emerald-800 mb-2">
                @{profileUser.username}
              </h1>
              <p className="text-xs text-emerald-700/70 mb-4">
                Joined {new Date(profileUser.created_at).toLocaleDateString()}
              </p>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="font-semibold text-emerald-800">
                    {profileUser.post_count}
                  </span>
                  <span className="text-emerald-700/70 ml-1">posts</span>
                </div>
                <div>
                  <span className="font-semibold text-emerald-800">
                    {profileUser.follower_count}
                  </span>
                  <span className="text-emerald-700/70 ml-1">followers</span>
                </div>
                <div>
                  <span className="font-semibold text-emerald-800">
                    {profileUser.following_count}
                  </span>
                  <span className="text-emerald-700/70 ml-1">following</span>
                </div>
              </div>
            </div>
            {profileUser.username !== user.username && (
              <button
                onClick={() => toggleFollow(profileUser.is_following)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  profileUser.is_following
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200"
                    : "bg-emerald-500 text-white hover:bg-emerald-400 shadow-[0_10px_30px_rgba(16,185,129,0.6)]"
                }`}
              >
                {profileUser.is_following ? "Following" : "Follow"}
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-emerald-900">
            Posts by @{profileUser.username}
          </h2>
          {posts.length === 0 ? (
            <p className="text-xs text-emerald-700/70">
              No posts yet. This user hasn't shared anything!
            </p>
          ) : (
            <ul className="space-y-3">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={user}
                  onVote={votePost}
                  onToggleFollow={
                    profileUser.username !== user.username
                      ? (username, isFollowing) => {
                          if (username === profileUser.username) {
                            toggleFollow(isFollowing);
                          }
                        }
                      : null
                  }
                />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
