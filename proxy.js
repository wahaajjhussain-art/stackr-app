import withAuth from "next-auth/middleware";
import { NextResponse } from "next/server";

// Protect /app — unauthenticated users are redirected to /login
export const proxy = withAuth(
  function proxy(req) {
    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/app/:path*"],
};
