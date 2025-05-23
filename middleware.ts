import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Check if the path is for admin routes
  const isAdminPath = path.startsWith("/admin") && !path.startsWith("/admin/login")

  // Get the auth cookie
  const authCookie = request.cookies.get("auth")?.value

  // If trying to access admin routes without auth cookie, redirect to login
  if (isAdminPath && authCookie !== "admin") {
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }

  // If trying to access user dashboard without user cookie, redirect to login
  if (path === "/dashboard" && !request.cookies.get("user_data")?.value) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Continue with the request
  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
}
