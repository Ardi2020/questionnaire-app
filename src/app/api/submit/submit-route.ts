import { NextResponse } from "next/server";
import { fullSurveySchema } from "@/lib/schemas";
import { sql } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate with Zod
    const result = fullSurveySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    const id = uuidv4();

    await sql`
      INSERT INTO responses (
        id, submitted_at,
        jenis_rs, kelas_rs, provinsi, hospital_id, nama_rs, wilayah, profesi, pengalaman,
        ti1, ti2, ti3, ti4,
        os1, os2, os3, os4,
        dc1, dc2, dc3, dc4,
        peou1, peou2, peou3, peou4,
        pu1, pu2, pu3, pu4,
        bi1, bi2, bi3,
        read1, read2, read3, read4, read_g1
      ) VALUES (
        ${id}, NOW(),
        ${data.jenisRS}, ${data.kelasRS}, ${data.provinsiDetail || null},
        ${data.hospitalId || null}, ${data.namaRS || null}, ${data.wilayah},
        ${data.profesi}, ${data.pengalaman},
        ${data.TI1}, ${data.TI2}, ${data.TI3}, ${data.TI4},
        ${data.OS1}, ${data.OS2}, ${data.OS3}, ${data.OS4},
        ${data.DC1}, ${data.DC2}, ${data.DC3}, ${data.DC4},
        ${data.PEOU1}, ${data.PEOU2}, ${data.PEOU3}, ${data.PEOU4},
        ${data.PU1}, ${data.PU2}, ${data.PU3}, ${data.PU4},
        ${data.BI1}, ${data.BI2}, ${data.BI3},
        ${data.READ1}, ${data.READ2}, ${data.READ3}, ${data.READ4}, ${data.READ_G1}
      )
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
