import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const auditLogs = await db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    });

    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            whoisSearches: true,
            dnsSearches: true,
            sslChecks: true,
            reports: true,
          }
        }
      }
    });

    const metrics = {
      totalUsers: users.length,
      whoisTotal: await db.whoisSearch.count(),
      dnsTotal: await db.dnsSearch.count(),
      sslTotal: await db.sslCheck.count(),
      reportsTotal: await db.uploadedReport.count(),
      auditLogsTotal: await db.auditLog.count(),
    };

    return NextResponse.json({ auditLogs, users, metrics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load admin logs" }, { status: 500 });
  }
}
