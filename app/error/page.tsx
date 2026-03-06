import Link from "next/link";

type Props = {
  searchParams: Promise<{ code?: string; host?: string; message?: string }>;
};

export default async function ErrorPage({ searchParams }: Props) {
  const params = await searchParams;
  const code = params.code;
  const host = params.host;

  if (code === "tenant") {
    return (
      <div className="card" style={{ maxWidth: 520 }}>
        <h2>Organization not found</h2>
        <p>
          No organization is configured for this address
          {host ? <> (<code>{host}</code>)</> : null}.
        </p>
        <p>This can happen when:</p>
        <ul style={{ margin: "12px 0", paddingLeft: 20 }}>
          <li>The URL does not match a registered organization hostname.</li>
          <li>Your account has not been added to this organization.</li>
          <li>The organization has been deactivated.</li>
        </ul>
        <p>
          Contact your administrator to verify the correct URL and that your
          account is provisioned.
        </p>
        <div style={{ marginTop: 16 }}>
          <Link href="/login">Back to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <h2>Something went wrong</h2>
      <p>{params.message || "An unexpected error occurred. Please try again."}</p>
      <div style={{ marginTop: 16 }}>
        <Link href="/login">Back to sign in</Link>
      </div>
    </div>
  );
}
