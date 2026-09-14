import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { revalidateGamePage } from "@/src/lib/entities/game/api/game.actions";

const SECRET_HEADER = "x-revalidate-secret";

const RevalidateRequestSchema = z.object({
  slugs: z.string().nonempty().array().min(1).max(200),
});

const isAuthorized = (provided: string | null, expected: string) => {
  if (!provided) return false;

  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);

  return (
    providedBytes.length === expectedBytes.length &&
    timingSafeEqual(providedBytes, expectedBytes)
  );
};

export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "REVALIDATE_SECRET is not configured" },
      { status: 503 }
    );
  }

  if (!isAuthorized(request.headers.get(SECRET_HEADER), secret)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = RevalidateRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", errors: parsed.error.issues },
      { status: 400 }
    );
  }

  const revalidated = await revalidateGamePage(...parsed.data.slugs);

  return NextResponse.json({ revalidated, count: revalidated.length });
}
