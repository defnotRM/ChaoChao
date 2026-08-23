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
      .select("banner_url, updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !profile || !profile.banner_url) {
      return new NextResponse("Banner not found", { status: 404 });
    }

    const bannerData = profile.banner_url;

    // If it's a data URI
    if (bannerData.startsWith("data:")) {
      const commaIndex = bannerData.indexOf(",");
      const meta = bannerData.substring(5, commaIndex);
      const mimeType = meta.split(";")[0] || "image/jpeg";
      const base64Content = bannerData.substring(commaIndex + 1);
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
    return NextResponse.redirect(bannerData);
  } catch (error) {
    console.error("Banner serving error:", error);
    return new NextResponse("Error fetching banner", { status: 500 });
  }
}
