import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_HOSTNAME_PATTERNS = [
  /^s3\.regru\.cloud$/,
  /^mooncellar-[^.]+\.s3\.regru\.cloud$/,
  /^[^.]+\.sfo3\.cdn\.digitaloceanspaces\.com$/,
  /^[^.]+\.sfo3\.digitaloceanspaces\.com$/,
  /^images\.igdb\.com$/,
];

const isAllowedHostname = (hostname: string) =>
  ALLOWED_HOSTNAME_PATTERNS.some((pattern) => pattern.test(hostname));

export async function GET(request: NextRequest) {
  const targetUrl = request.nextUrl.searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ message: "Missing url" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    return NextResponse.json({ message: "Invalid url" }, { status: 400 });
  }

  if (
    parsedUrl.protocol !== "https:" ||
    !isAllowedHostname(parsedUrl.hostname)
  ) {
    return NextResponse.json({ message: "Host not allowed" }, { status: 403 });
  }

  const upstreamResponse = await fetch(parsedUrl, {
    next: { revalidate: 3600 },
  });

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    return NextResponse.json(
      { message: "Failed to fetch image" },
      { status: 502 }
    );
  }

  const contentType = upstreamResponse.headers.get("content-type");
  if (!contentType || !contentType.startsWith("image/")) {
    return NextResponse.json({ message: "Not an image" }, { status: 502 });
  }

  return new NextResponse(upstreamResponse.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
