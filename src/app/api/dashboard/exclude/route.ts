import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function checkAuth(request: NextRequest): boolean {
  const cookie = request.cookies.get("dashboard_auth");
  return cookie?.value === process.env.DASHBOARD_PASSWORD;
}

// POST - Exclude (soft delete) a respondent
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, reason } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid id parameter" },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid reason parameter" },
        { status: 400 }
      );
    }

    const sql = getDb();

    // Check if response exists and is not already excluded
    const existing = await sql`
      SELECT id, excluded FROM responses WHERE id = ${id}
    ` as { id: string; excluded: boolean | null }[];

    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { error: "Response not found" },
        { status: 404 }
      );
    }

    if (existing[0].excluded === true) {
      return NextResponse.json(
        { error: "Response already excluded" },
        { status: 400 }
      );
    }

    // Soft delete the response
    await sql`
      UPDATE responses
      SET excluded = true, excluded_reason = ${reason}, excluded_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("Exclude error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Restore (un-exclude) a respondent
export async function DELETE(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid id parameter" },
        { status: 400 }
      );
    }

    const sql = getDb();

    // Check if response exists and is excluded
    const existing = await sql`
      SELECT id, excluded FROM responses WHERE id = ${id}
    ` as { id: string; excluded: boolean | null }[];

    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { error: "Response not found" },
        { status: 404 }
      );
    }

    if (existing[0].excluded !== true) {
      return NextResponse.json(
        { error: "Response is not excluded" },
        { status: 400 }
      );
    }

    // Restore the response
    await sql`
      UPDATE responses
      SET excluded = false, excluded_reason = NULL, excluded_at = NULL
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("Restore error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
