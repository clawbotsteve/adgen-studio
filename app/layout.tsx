import "./globals.css";
import Link from "next/link";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h1 style={{ margin: 0 }}>AdGen Studio</h1>
            <nav className="nav">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/brands">Brands</Link>
              <Link href="/history">History</Link>
            </nav>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
