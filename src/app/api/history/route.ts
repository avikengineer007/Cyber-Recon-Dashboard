import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  try {
    const whois = await db.whoisSearch.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    const dns = await db.dnsSearch.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    const ssl = await db.sslCheck.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    const reports = await db.uploadedReport.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    const cve = await db.cveSearch.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    return NextResponse.json({ whois, dns, ssl, reports, cve });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load telemetry logs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  try {
    const { targetId, targetType, isFavorite } = await req.json();

    if (targetType === "WHOIS") {
      await db.whoisSearch.updateMany({
        where: { id: targetId, userId },
        data: { isFavorite }
      });
    } else if (targetType === "DNS") {
      await db.dnsSearch.updateMany({
        where: { id: targetId, userId },
        data: { isFavorite }
      });
    } else if (targetType === "SSL") {
      await db.sslCheck.updateMany({
        where: { id: targetId, userId },
        data: { isFavorite }
      });
    }

    if (isFavorite) {
      await db.favorite.upsert({
        where: {
          userId_targetId_targetType: { userId, targetId, targetType }
        },
        create: { userId, targetId, targetType },
        update: {}
      });
    } else {
      await db.favorite.deleteMany({
        where: { userId, targetId, targetType }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update favorite status" }, { status: 500 });
  }
}
