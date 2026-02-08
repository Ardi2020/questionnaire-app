import { NextResponse } from "next/server";
import { fullSurveySchema } from "@/lib/schemas";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

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

    // Insert into Supabase
    const { error } = await supabase.from("responses").insert({
      id: uuidv4(),
      submitted_at: new Date().toISOString(),
      jenis_rs: data.jenisRS,
      kelas_rs: data.kelasRS,
      wilayah: data.wilayah,
      profesi: data.profesi,
      pengalaman: data.pengalaman,
      ti1: data.TI1,
      ti2: data.TI2,
      ti3: data.TI3,
      ti4: data.TI4,
      os1: data.OS1,
      os2: data.OS2,
      os3: data.OS3,
      os4: data.OS4,
      dc1: data.DC1,
      dc2: data.DC2,
      dc3: data.DC3,
      dc4: data.DC4,
      peou1: data.PEOU1,
      peou2: data.PEOU2,
      peou3: data.PEOU3,
      peou4: data.PEOU4,
      pu1: data.PU1,
      pu2: data.PU2,
      pu3: data.PU3,
      pu4: data.PU4,
      bi1: data.BI1,
      bi2: data.BI2,
      bi3: data.BI3,
      read1: data.READ1,
      read2: data.READ2,
      read3: data.READ3,
      read4: data.READ4,
      read_g1: data.READ_G1,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Gagal menyimpan data" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
