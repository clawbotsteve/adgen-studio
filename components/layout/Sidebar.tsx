"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Package,
  Palette,
  UserPlus,
  Video,
  Zap,
  Layers,
  Play,
  Clock,
  CreditCard,
  FileText,
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
        <span className="sidebar-logo-icon">◆</span>
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
          href="/clients"
          className={`sidebar-link ${isActive("/clients") ? "active" : ""}`}
        >
          <Users size={18} />
          <span>Clients</span>
        </Link>
        <Link
          href="/profiles"
          className={`sidebar-link ${isActive("/profiles") ? "active" : ""}`}
        >
          <UserCircle size={18} />
          <span>Profiles</span>
        </Link>
        <Link
          href="/prompt-packs"
          className={`sidebar-link ${isActive("/prompt-packs") ? "active" : ""}`}
        >
          <Package size={18} />
          <span>Prompt Packs</span>
        </Link>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-header">Context</div>
        <Link
          href="/brand-context"
          className={`sidebar-link ${isActive("/brand-context") ? "active" : ""}`}
        >
          <Palette size={18} />
          <span>Brand Context</span>
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
        <div className="sidebar-section-header">Create</div>
        <Link
          href="/ugc-studio"
          className={`sidebar-link ${isActive("/ugc-studio") ? "active" : ""}`}
        >
          <Video size={18} />
          <span>UGC Studio</span>
        </Link>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-header">Generate</div>
        <Link
          href="/brief-generator"
          className={`sidebar-link ${isActive("/brief-generator") ? "active" : ""}`}
        >
          <FileText size={18} />
          <span>Brief Generator</span>
        </Link>
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
          href="/batch/generate"
          className={`sidebar-link ${isActive("/batch/generate") ? "active" : ""}`}
        >
          <Zap size={18} />
          <span>Batch Generate</span>
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
