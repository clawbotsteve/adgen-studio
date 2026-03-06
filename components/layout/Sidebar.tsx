"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export function Sidebar() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/error") {
    return null;
  }

  const isActive = (href) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">AdGen Studio</div>
      <nav className="sidebar-section">
        <Link href="/dashboard" className={`sidebar-link ${isActive("/dashboard") ? "active" : ""}`}>
          <span className="sidebar-icon">H</span><span>Dashboard</span>
        </Link>
      </nav>
      <div className="sidebar-section">
        <div className="sidebar-section-header">Manage</div>
        <Link href="/clients" className={`sidebar-link ${isActive("/clients") ? "active" : ""}`}>
          <span className="sidebar-icon">C</span><span>Clients</span>
        </Link>
        <Link href="/references" className={`sidebar-link ${isActive("/references") ? "active" : ""}`}>
          <span className="sidebar-icon">R</span><span>References</span>
        </Link>
        <Link href="/profiles" className={`sidebar-link ${isActive("/profiles") ? "active" : ""}`}>
          <span className="sidebar-icon">P</span><span>Profiles</span>
        </Link>
        <Link href="/prompt-packs" className={`sidebar-link ${isActive("/prompt-packs") ? "active" : ""}`}>
          <span className="sidebar-icon">K</span><span>Prompt Packs</span>
        </Link>
      </div>
      <div className="sidebar-section">
        <div className="sidebar-section-header">Generate</div>
        <Link href="/batch/create" className={`sidebar-link ${isActive("/batch") ? "active" : ""}`}>
          <span className="sidebar-icon">B</span><span>Batch Runner</span>
        </Link>
        <Link href="/history" className={`sidebar-link ${isActive("/history") ? "active" : ""}`}>
          <span className="sidebar-icon">H</span><span>Run History</span>
        </Link>
      </div>
    </aside>
  );
}
