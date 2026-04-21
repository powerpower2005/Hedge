import { Link, NavLink } from "react-router-dom";
import { NEW_PICK_URL } from "../../lib/constants";
import { ThemeToggle } from "./ThemeToggle.jsx";

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${
    isActive
      ? "bg-zinc-800 text-white dark:bg-zinc-800"
      : "text-zinc-400 hover:text-white dark:text-zinc-600 dark:hover:text-zinc-900"
  }`;

export function Header() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur dark:border-zinc-200 dark:bg-white/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="text-lg font-semibold tracking-tight text-white dark:text-zinc-900">
          Stock Challenge
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          <NavLink to="/" end className={linkClass}>
            Active
          </NavLink>
          <NavLink to="/hall-of-fame" className={linkClass}>
            Hall of Fame
          </NavLink>
          <NavLink to="/expired" className={linkClass}>
            Expired
          </NavLink>
          <NavLink to="/about" className={linkClass}>
            About
          </NavLink>
          <ThemeToggle />
          <a
            href={NEW_PICK_URL}
            className="ml-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            New pick
          </a>
        </nav>
      </div>
    </header>
  );
}
