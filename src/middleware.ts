import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
  const isOnTools = nextUrl.pathname.startsWith("/tools");
  const isOnAdmin = nextUrl.pathname.startsWith("/admin");

  if (isOnAdmin) {
    if (!isLoggedIn || !req.auth) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    const role = (req.auth.user as any)?.role;
    if (role !== "ADMIN") {
      return new NextResponse(
        JSON.stringify({ error: "Access Denied: Administrative privileges required." }),
        { status: 403, headers: { "content-type": "application/json" } }
      );
    }
  }

  if (isOnDashboard || isOnTools) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/tools/:path*", "/admin/:path*"],
};
