"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  UserCircle,
  UserPlus,
  Layers,
  Play,
  Clock,
  CreditCard,
  Brain,
} from "lucide-react";

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
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">{"\u25C6"}</span>
        <span className="sidebar-logo-text">AdGen Studio</span>
      </div>

      <nav className="sidebar-section">
        <Link
          href="/dashboard"
          className={`sidebar-link ${isActive("/dashboard") ? "active" : ""}`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </Link>
      </nav>

      <div className="sidebar-section">
        <div className="sidebar-section-header">Manage</div>
        <Link
          href="/profiles"
          className={`sidebar-link ${isActive("/profiles") ? "active" : ""}`}
        >
          <UserCircle size={18} />
          <span>Profiles</span>
        </Link>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-header">Context</div>
        <Link
          href="/brain"
          className={`sidebar-link ${isActive("/brain") ? "active" : ""}`}
        >
          <Brain size={18} />
          <span>Brain</span>
        </Link>
        <Link
          href="/client-generator"
          className={`sidebar-link ${isActive("/client-generator") ? "active" : ""}`}
        >
          <UserPlus size={18} />
          <span>Client Generator</span>
        </Link>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-header">Generate</div>
        <Link
          href="/batch/create"
          className={`sidebar-link ${isActive("/batch/create") ? "active" : ""}`}
        >
          <Play size={18} />
          <span>Generate</span>
        </Link>
        <Link
          href="/smart-batch"
          className={`sidebar-link ${isActive("/smart-batch") ? "active" : ""}`}
        >
          <Layers size={18} />
          <span>Smart Batch</span>
        </Link>
        <Link
          href="/history"
          className={`sidebar-link ${isActive("/history") ? "active" : ""}`}
        >
          <Clock size={18} />
          <span>Run History</span>
        </Link>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-header">Admin</div>
        <Link
          href="/admin/billing"
          className={`sidebar-link ${isActive("/admin/billing") ? "active" : ""}`}
        >
          <CreditCard size={18} />
          <span>Billing</span>
        </Link>
      </div>
    </aside>
  );
}
