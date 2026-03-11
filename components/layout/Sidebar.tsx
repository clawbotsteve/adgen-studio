"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export function Sidebar() {
  const pathname = usePathname();

  // Hide sidebar on login and error pages
  if (pathname === "/login" || pathname === "/error") {
    return null;
  }

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">◆ AdGen Studio</div>

      <nav className="sidebar-section">
        <Link
          href="/dashboard"
          className={`sidebar-link ${isActive("/dashboard") ? "active" : ""}`}
        >
          <span className="sidebar-icon">⌂</span>
          <span>Dashboard</span>
        </Link>

        <Link
          href="/client-generator"
          className={`sidebar-link ${isActive("/client-generator") ? "active" : ""}`}
        >
          <span className="sidebar-icon">👤</span>
          <span>Client Generator</span>
        </Link>

        <Link
          href="/brief-generator"
          className={`sidebar-link ${isActive("/brief-generator") ? "active" : ""}`}
        >
          <span className="sidebar-icon">⚡</span>
          <span>Brief Generator</span>
        </Link>
      </nav>
    </aside>
  );
}
