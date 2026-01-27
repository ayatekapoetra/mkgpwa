import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Block access to old PWA/service worker files
  const blockedPaths = [
    "/manifest.json",
    "/sw.js",
    "/workbox-",
    "/fallback-",
    "/precache-",
    "/service-worker.js",
  ];

  if (blockedPaths.some((path) => pathname.includes(path))) {
    console.log("Blocking access to PWA file:", pathname);
    return new Response("Service Worker files have been disabled", {
      status: 404,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }

  // Aggressive headers to prevent any PWA/service worker interference
  const response = NextResponse.next();

  // Nuclear cache control - prevent any caching
  response.headers.set(
    "Cache-Control",
    "no-cache, no-store, must-revalidate, max-age=0, private",
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  // Block service worker completely
  response.headers.set("Service-Worker-Allowed", "/");
  response.headers.set("Service-Worker", "none");

  // Clear all possible cached data
  response.headers.set(
    "Clear-Site-Data",
    '"cache", "storage", "executionContexts"',
  );

  // Prevent any PWA manifest loading
  response.headers.set("X-PWA-Disabled", "true");
  response.headers.set("X-Service-Worker-Disabled", "true");
  response.headers.set("X-Web-App-Manifest", "none");

  // Force no transformation
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Get the token from the request
  const token = await getToken({ req: request });

  // If user is trying to access root page, redirect based on session
  if (pathname === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/home", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // If user is trying to access login page and has a token, redirect to /home
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // If user is trying to access protected routes without token, redirect to login
  // Make signage dashboards public (no login required)
  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/check-mail",
    "/panel/timesheet",
    "/panel/kehadiran-karyawan"
  ];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (!isPublicRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icons|public).*)",
  ],
};
