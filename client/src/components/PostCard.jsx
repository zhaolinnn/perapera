import { Link } from "react-router-dom";

export default function PostCard({
  post,
  currentUser,
  onDelete,
  onVote,
  onToggleFollow,
}) {
  return (
    <li className="bg-white border border-emerald-100 rounded-2xl p-3 text-sm shadow-sm">
      <div className="flex justify-between items-start gap-2 mb-1">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Link
              to={`/users/${post.author}`}
              className="font-semibold text-xs text-emerald-800 hover:text-emerald-600 transition"
            >
              @{post.author}
            </Link>
            {post.author !== currentUser.username && onToggleFollow && (
              <button
                onClick={() => onToggleFollow(post.author, post.is_following)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition ${
                  post.is_following
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                }`}
              >
                {post.is_following ? "Following" : "Follow"}
              </button>
            )}
          </div>
          <p className="text-[11px] text-emerald-700/70">
            {new Date(post.created_at).toLocaleString()}
          </p>
        </div>
        {post.author === currentUser.username && onDelete && (
          <button
            onClick={() => onDelete(post.id)}
            className="text-[11px] text-red-500 hover:text-red-400"
          >
            Delete
          </button>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">
        {post.content}
      </p>
      {onVote && (
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-emerald-50">
          <button
            onClick={() => onVote(post.id, 1)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition ${
              post.user_vote === 1
                ? "bg-emerald-100 text-emerald-700"
                : "text-emerald-600 hover:bg-emerald-50"
            }`}
          >
            <span>▲</span>
            <span>{post.upvotes || 0}</span>
          </button>
          <button
            onClick={() => onVote(post.id, -1)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition ${
              post.user_vote === -1
                ? "bg-red-100 text-red-700"
                : "text-emerald-600 hover:bg-emerald-50"
            }`}
          >
            <span>▼</span>
            <span>{post.downvotes || 0}</span>
          </button>
        </div>
      )}
    </li>
  );
}
