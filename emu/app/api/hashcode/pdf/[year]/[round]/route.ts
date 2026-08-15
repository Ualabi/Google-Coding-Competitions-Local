import { readFile } from "node:fs/promises";
import { resolveHashcodePdfPath } from "@/lib/catalog";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ year: string; round: string }> },
) {
  const { year, round } = await params;

  const pdfPath = await resolveHashcodePdfPath(year, round);
  if (!pdfPath) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const data = await readFile(pdfPath);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
