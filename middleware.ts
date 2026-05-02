import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const middleware = auth((request) => {
  const { pathname } = request.nextUrl;
  const isAuthenticated = Boolean(request.auth);

  if (pathname.startsWith("/api/admin") && !isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (pathname.startsWith("/admin/login") && isAuthenticated) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  if (
    pathname.startsWith("/admin") &&
    !pathname.startsWith("/admin/login") &&
    !isAuthenticated
  ) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
