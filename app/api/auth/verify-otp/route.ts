import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { phone, token } = await req.json();

    if (!phone || !token) {
      return NextResponse.json(
        { error: "Phone number and verification code are required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: "Invalid or expired verification code. Please try again." },
        { status: 401 }
      );
    }

    const user = data.user;
    const admin = createAdminClient();

    // Ensure user profile exists
    const { data: existing } = await admin
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!existing) {
      await admin.from("users").insert({
        id: user.id,
        phone,
        name: null,
        role: "customer",
        notification_preference: "sms",
      });
    }

    // Get final profile (may have been pre-seeded as technician)
    const { data: profile } = await admin
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        phone,
        role: profile?.role || "customer",
        name: profile?.name || null,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
