import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOST_SUFFIXES = [
  "amazonaws.com",
];

function isAllowedImageUrl(url: string) {
  try {
    const parsed = new URL(url);
    return ALLOWED_HOST_SUFFIXES.some((suffix) =>
      parsed.hostname.endsWith(suffix),
    );
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url || !isAllowedImageUrl(url)) {
    return NextResponse.json({ error: "Invalid image url" }, { status: 400 });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: response.status },
      );
    }

    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }
}
