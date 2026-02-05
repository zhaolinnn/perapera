import { Link } from "react-router-dom";

export default function Header({ user, onLogout }) {
  return (
    <header className="border-b border-emerald-100 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
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
      </div>
    </header>
  );
}
