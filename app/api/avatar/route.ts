import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return new NextResponse("User ID required", { status: 400 });
    }

    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("useraccount")
      .select("avatar_url, updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !profile || !profile.avatar_url) {
      return new NextResponse("Avatar not found", { status: 404 });
    }

    const avatarData = profile.avatar_url;

    // If it's a data URI
    if (avatarData.startsWith("data:")) {
      const commaIndex = avatarData.indexOf(",");
      const meta = avatarData.substring(5, commaIndex);
      const mimeType = meta.split(";")[0] || "image/png";
      const base64Content = avatarData.substring(commaIndex + 1);
      const buffer = Buffer.from(base64Content, "base64");

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Content-Length": buffer.length.toString(),
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    }

    // If it's a direct URL
    return NextResponse.redirect(avatarData);
  } catch (error) {
    console.error("Avatar serving error:", error);
    return new NextResponse("Error fetching avatar", { status: 500 });
  }
}
