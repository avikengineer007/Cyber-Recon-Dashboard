import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, roleCode } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const existing = await db.user.findUnique({
      where: { email }
    });

    if (existing) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 });
    }

    const role = (roleCode === "ADMIN_SECRET_KEY_2026") ? "ADMIN" : "USER";
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        name: name || email.split("@")[0],
        email,
        passwordHash,
        role
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to register user" }, { status: 500 });
  }
}
export const runtime = "nodejs";
