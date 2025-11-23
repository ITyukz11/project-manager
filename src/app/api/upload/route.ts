import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");
  if (file && typeof file === "object") {
    // Upload to vercel blob
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });
    // blob.url is the URL!
    return NextResponse.json({ url: blob.url });
  }
  return NextResponse.json({ error: "No file received" }, { status: 400 });
}
