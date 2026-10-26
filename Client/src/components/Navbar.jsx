import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { FaTicketAlt, FaArrowRight, FaBars, FaTimes } from "react-icons/fa";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login");
  };

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navLinkClass =
    "text-sm font-medium text-gray-700 transition-colors duration-200 hover:text-black dark:text-gray-200 dark:hover:text-white";

  const glassButton =
    "inline-flex min-h-10 items-center justify-center rounded-full border border-white/50 bg-white/40 px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm backdrop-blur-xl transition hover:bg-white/65 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.12]";

  return (
    <nav className="sticky top-0 z-50 w-full px-3 pt-3 sm:px-5 sm:pt-4">
      <div className="relative mx-auto w-full max-w-7xl">
        {/* Floating glass navbar */}
        <div className="relative rounded-full border border-white/60 bg-white/55 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-2xl backdrop-saturate-150 transition-colors duration-300 dark:border-white/[0.12] dark:bg-[#17191f]/65 dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
          <div className="flex h-[62px] items-center justify-between gap-3 px-3 min-[480px]:h-[68px] min-[480px]:px-5 sm:px-6">
            {/* Logo */}
            <Link
              to="/"
              aria-label="Gatherr home"
              className="group flex shrink-0 items-center gap-2"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-950 text-white shadow-sm transition-transform duration-200 group-hover:scale-105 dark:bg-white dark:text-gray-950">
                <FaTicketAlt className="text-base" />
              </span>

              <span className="text-lg font-bold tracking-tight text-gray-950 min-[480px]:text-xl dark:text-white">
                Gatherr<span className="text-gray-400">.</span>
              </span>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden items-center gap-4 md:flex lg:gap-7">
              <Link to="/" className={navLinkClass}>
                Events
              </Link>

              {user && (
                <Link
                  to={user.role === "admin" ? "/admin" : "/dashboard"}
                  className={navLinkClass}
                >
                  Dashboard
                </Link>
              )}

              <ThemeToggle />

              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className={glassButton}
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link to="/login" className={navLinkClass}>
                    Login
                  </Link>

                  <Link
                    to="/register"
                    className="inline-flex min-h-10 items-center gap-2 rounded-full bg-gray-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 min-[480px]:px-5 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
                  >
                    Get Started
                    <FaArrowRight className="text-xs" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile controls */}
            <div className="flex shrink-0 items-center gap-2 md:hidden">
              <ThemeToggle />

              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls="mobile-nav-menu"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/40 text-gray-800 shadow-sm backdrop-blur-xl transition hover:bg-white/70 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.12]"
              >
                {menuOpen ? (
                  <FaTimes className="text-lg" />
                ) : (
                  <FaBars className="text-lg" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile glass dropdown */}
        {menuOpen && (
          <div
            id="mobile-nav-menu"
            className="absolute left-3 right-3 top-full z-50 mt-3 overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#191b22]/90 dark:shadow-black/30"
          >
            <div className="flex flex-col gap-1">
              <Link
                to="/"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-11 items-center rounded-2xl px-4 text-sm font-medium text-gray-800 transition hover:bg-black/5 dark:text-gray-100 dark:hover:bg-white/10"
              >
                Events
              </Link>

              {user ? (
                <>
                  <Link
                    to={user.role === "admin" ? "/admin" : "/dashboard"}
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-11 items-center rounded-2xl px-4 text-sm font-medium text-gray-800 transition hover:bg-black/5 dark:text-gray-100 dark:hover:bg-white/10"
                  >
                    Dashboard
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex min-h-11 w-full items-center rounded-2xl px-4 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-11 items-center rounded-2xl px-4 text-sm font-medium text-gray-800 transition hover:bg-black/5 dark:text-gray-100 dark:hover:bg-white/10"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="mt-1 flex min-h-11 items-center justify-center gap-2 rounded-full bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
                  >
                    Get Started
                    <FaArrowRight className="text-xs" />
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
