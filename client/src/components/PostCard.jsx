import { useState } from "react";
import { Link } from "react-router-dom";

export default function PostCard({
  post,
  currentUser,
  onDelete,
  onVote,
  onToggleFollow,
  onComment,
  onDeleteComment,
  onRefresh,
}) {
  const [commentContent, setCommentContent] = useState("");
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);

  const comments = post.comments || [];
  const COMMENT_LIMIT = 5;
  const hasMoreComments = comments.length > COMMENT_LIMIT;
  const displayedComments = showAllComments
    ? comments
    : comments.slice(0, COMMENT_LIMIT);

  async function handleCommentSubmit(e) {
    e.preventDefault();
    if (!commentContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onComment(post.id, commentContent.trim());
      setCommentContent("");
      setShowCommentForm(false);
    } catch (err) {
      console.error("Failed to post comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  }
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
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleFollow(post.author, post.is_following);
                }}
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
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {post.tags.map((tag) => {
            const isChinese = tag.name === "chinese";
            const isJapanese = tag.name === "japanese";
            return (
              <span
                key={tag.id}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  isChinese
                    ? "bg-red-50 border border-red-200 text-red-700"
                    : isJapanese
                    ? "bg-blue-50 border border-blue-200 text-blue-700"
                    : "bg-emerald-50 border border-emerald-100 text-emerald-700"
                }`}
              >
                {tag.display_name}
              </span>
            );
          })}
        </div>
      )}
      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-emerald-50">
        {onVote && (
          <>
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
          </>
        )}
        {onComment && (
          <button
            onClick={() => setShowCommentForm(!showCommentForm)}
            className="px-2 py-1 rounded-lg text-xs text-emerald-600 hover:bg-emerald-50 transition"
          >
            💬 {post.comments?.length || 0}
          </button>
        )}
      </div>

      {onComment && showCommentForm && (
        <form onSubmit={handleCommentSubmit} className="mt-2 pt-2 border-t border-emerald-50">
          <div className="flex gap-2">
            <input
              type="text"
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 rounded-lg bg-emerald-50 border border-emerald-100 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={!commentContent.trim() || isSubmitting}
              className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-xs font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Post
            </button>
          </div>
        </form>
      )}

      {comments.length > 0 && (
        <div className="mt-2 pt-2 border-t border-emerald-50 space-y-2">
          {displayedComments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/users/${comment.author}`}
                    className="font-medium text-[10px] text-emerald-800 hover:text-emerald-600"
                  >
                    @{comment.author}
                  </Link>
                  <span className="text-[10px] text-emerald-700/70">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                  {comment.author === currentUser.username && onDeleteComment && (
                    <button
                      onClick={() => onDeleteComment(comment.id)}
                      className="text-[10px] text-red-500 hover:text-red-400"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-700 mt-0.5">{comment.content}</p>
              </div>
            </div>
          ))}
          {hasMoreComments && (
            <button
              onClick={() => setShowAllComments(!showAllComments)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium mt-1"
            >
              {showAllComments
                ? "Show less"
                : `Read more (${comments.length - COMMENT_LIMIT} more comment${
                    comments.length - COMMENT_LIMIT === 1 ? "" : "s"
                  })`}
            </button>
          )}
        </div>
      )}
    </li>
  );
}
