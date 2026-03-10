import { NextResponse } from "next/server";

/**
 * GET /api/download?url=...&name=...
 * Proxies an image download to avoid CORS issues with external URLs.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const name = searchParams.get("name") || "image.png";

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

    const contentType = res.headers.get("content-type") || "image/png";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[download proxy]", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
