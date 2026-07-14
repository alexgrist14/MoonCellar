import { NextRequest, NextResponse } from "next/server";

const LOKI_HOST =
  process.env.LOKI_HOST || "http://host.containers.internal:3100";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    const response = await fetch(`${LOKI_HOST}/loki/api/v1/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: "Loki push failed", details: text },
        { status: response.status }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to reach Loki", details: String(error) },
      { status: 502 }
    );
  }
}
