import { requireUserTenantPage } from "@/lib/auth";
import { Construction } from "lucide-react";

export default async function UgcStudioRoute() {
  await requireUserTenantPage();

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "70vh",
      padding: "2rem",
      textAlign: "center",
    }}>
      <div style={{
        background: "rgba(124, 92, 252, 0.08)",
        border: "1px solid rgba(124, 92, 252, 0.2)",
        borderRadius: "16px",
        padding: "3rem 2.5rem",
        maxWidth: "480px",
        width: "100%",
      }}>
        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "16px",
          background: "rgba(124, 92, 252, 0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.5rem",
        }}>
          <Construction size={32} color="#7c5cfc" />
        </div>
        <h1 style={{
          fontSize: "1.75rem",
          fontWeight: 700,
          margin: "0 0 0.5rem",
        }}>UGC Studio</h1>
        <div style={{
          display: "inline-block",
          background: "rgba(124, 92, 252, 0.15)",
          color: "#a78bfa",
          padding: "4px 14px",
          borderRadius: "20px",
          fontSize: "0.8rem",
          fontWeight: 600,
          letterSpacing: "0.05em",
          marginBottom: "1rem",
        }}>COMING SOON</div>
        <p style={{
          color: "var(--color-text-secondary, #94a3b8)",
          fontSize: "0.95rem",
          lineHeight: 1.6,
          margin: 0,
        }}>
          Create, manage, and distribute UGC video content.
          This feature is currently under development.
        </p>
      </div>
    </div>
  );
}
