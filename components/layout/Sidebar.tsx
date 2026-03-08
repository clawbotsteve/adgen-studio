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
      </nav>

      <div className="sidebar-section">
        <div className="sidebar-section-header">Manage</div>
        <Link
          href="/clients"
          className={`sidebar-link ${isActive("/clients") ? "active" : ""}`}
        >
          <span className="sidebar-icon">👥</span>
          <span>Clients</span>
        </Link>
        <Link
          href="/references"
          className={`sidebar-link ${isActive("/references") ? "active" : ""}`}
        >
          <span className="sidebar-icon">🖼</span>
          <span>References</span>
        </Link>
        <Link
          href="/profiles"
          className={`sidebar-link ${isActive("/profiles") ? "active" : ""}`}
        >
          <span className="sidebar-icon">⚙</span>
          <span>Profiles</span>
        </Link>
        <Link
          href="/prompt-packs"
          className={`sidebar-link ${isActive("/prompt-packs") ? "active" : ""}`}
        >
          <span className="sidebar-icon">📦</span>
          <span>Prompt Packs</span>
        </Link>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-header">Create</div>
        <Link
          href="/ugc-studio"
          className={`sidebar-link ${isActive("/ugc-studio") ? "active" : ""}`}
        >
          <span className="sidebar-icon">🎬</span>
          <span>UGC Studio</span>
        </Link>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-header">Generate</div>
        <Link
          href="/batch/create"
          className={`sidebar-link ${isActive("/batch/create") ? "active" : ""}`}
        >
          <span className="sidebar-icon">▶</span>
          <span>Generate</span>
        </Link>
        <Link
          href="/batch/generate"
          className={`sidebar-link ${isActive("/batch/generate") ? "active" : ""}`}
        >
          <span className="sidebar-icon">⚡</span>
          <span>Batch Generate</span>
        </Link>
        <Link
          href="/history"
          className={`sidebar-link ${isActive("/history") ? "active" : ""}`}
        >
          <span className="sidebar-icon">📋</span>
          <span>Run History</span>
        </Link>
      </div>
    </aside>
  );
}
