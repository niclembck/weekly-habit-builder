// src/components/NavBar.tsx
import React from "react";
import { NavLink, useLocation } from "react-router-dom";

type Orientation = "top" | "left";
type Props = { orientation?: Orientation; collapseKey?: string };

export default function NavBar({
  orientation = "top",
  collapseKey = "whb.ui.nav.collapsed",
}: Props) {
  const isLeft = orientation === "left";
  const { pathname } = useLocation();

  // Desktop collapse (persisted)
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(collapseKey);
      return raw ? raw === "1" : false;
    } catch { return false; }
  });
  React.useEffect(() => {
    if (isLeft) localStorage.setItem(collapseKey, collapsed ? "1" : "0");
  }, [collapsed, isLeft, collapseKey]);

  // Mobile drawer state (not persisted)
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Close the drawer when route changes
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    const open = () => setMobileOpen(true);
    const close = () => setMobileOpen(false);
    const toggle = () => setMobileOpen((v) => !v);

    // Custom “events” for mobile drawer control
    const onOpen = () => open();
    const onClose = () => close();
    const onToggle = () => toggle();

    // Use addEventListener with custom event names; cast to any to satisfy TS
    window.addEventListener("whb:nav:open" as any, onOpen as any);
    window.addEventListener("whb:nav:close" as any, onClose as any);
    window.addEventListener("whb:nav:toggle" as any, onToggle as any);

    return () => {
      window.removeEventListener("whb:nav:open" as any, onOpen as any);
      window.removeEventListener("whb:nav:close" as any, onClose as any);
      window.removeEventListener("whb:nav:toggle" as any, onToggle as any);
    };
  }, []);

  // Decide action for the toggle button based on viewport
  const onToggle = () => {
    const isMobile = window.matchMedia("(max-width: 960px)").matches;
    if (isMobile) setMobileOpen((o) => !o);
    else setCollapsed((c) => !c);
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    "whb-nav__link" + (isActive ? " is-active" : "");

  return (
    <>
      <nav
        className={[
          "whb-nav",
          isLeft ? "whb-nav--left" : "whb-nav--top",
          isLeft && collapsed ? "is-collapsed" : "",
          isLeft && mobileOpen ? "is-open" : "",
        ].filter(Boolean).join(" ")}
        aria-label="Primary"
      >
        {isLeft && (
          <div className="whb-nav__header">
            <button
              className="whb-nav__toggle"
              onClick={onToggle}
              aria-expanded={isLeft ? (mobileOpen ? true : !collapsed) : undefined}
              aria-label="Toggle navigation"
              title="Toggle navigation"
            >
              ☰
            </button>
            {!collapsed && <span className="whb-nav__brand">WHB</span>}
          </div>
        )}

        <ul className="whb-nav__list">
          <li><NavLink to="/week" className={linkClass}>
            <span className="whb-nav__dot" aria-hidden /><span className="whb-nav__text">Week</span>
          </NavLink></li>

          <li><NavLink to="/insights" className={linkClass}>
            <span className="whb-nav__dot" aria-hidden /><span className="whb-nav__text">Insights</span>
          </NavLink></li>

          {!collapsed && <div className="whb-nav__group-label">Library</div>}
          <li><NavLink to="/library" className={linkClass}>
            <span className="whb-nav__dot" aria-hidden /><span className="whb-nav__text">Projects</span>
          </NavLink></li>
          <li><NavLink to="/library/activities" className={linkClass}>
            <span className="whb-nav__dot" aria-hidden /><span className="whb-nav__text">Activities</span>
          </NavLink></li>
          <li><NavLink to="/library/templates" className={linkClass}>
            <span className="whb-nav__dot" aria-hidden /><span className="whb-nav__text">Templates</span>
          </NavLink></li>
          <li><NavLink to="/library/patterns" className={linkClass}>
            <span className="whb-nav__dot" aria-hidden /><span className="whb-nav__text">Patterns</span>
          </NavLink></li>
          <li><NavLink to="/library/defaults" className={linkClass}>
            <span className="whb-nav__dot" aria-hidden /><span className="whb-nav__text">Defaults</span>
          </NavLink></li>

          {!collapsed && <div className="whb-nav__group-label">System</div>}
          <li><NavLink to="/settings" className={linkClass}>
            <span className="whb-nav__dot" aria-hidden /><span className="whb-nav__text">Settings</span>
          </NavLink></li>
        </ul>
      </nav>

      {/* Backdrop for the mobile drawer */}
      {isLeft && mobileOpen && (
        <div
          className="whb-nav__backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}
    </>
  );
}
