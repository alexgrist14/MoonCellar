import { NextRequest, NextResponse } from "next/server";
import { LOKI_HOST } from "@/src/lib/shared/utils/logger.utils";

export async function POST(request: NextRequest) {
  if (!LOKI_HOST) return new NextResponse(null, { status: 204 });

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
