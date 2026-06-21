import { auth } from "@/auth"
import { NextResponse } from "next/server"

const PUBLIC_PATHS = ["/login", "/register"]

export default auth((req) => {
  const isLoggedIn  = !!req.auth
  const isPublicPage = PUBLIC_PATHS.includes(req.nextUrl.pathname)

  if (!isLoggedIn && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (isLoggedIn && isPublicPage) {
    return NextResponse.redirect(new URL("/escalas", req.url))
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
