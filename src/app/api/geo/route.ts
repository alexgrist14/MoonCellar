import { NextResponse } from "next/server";
import { getClientGeo } from "@/src/lib/shared/utils/geo.utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const geo = await getClientGeo();
  return NextResponse.json(geo);
}
