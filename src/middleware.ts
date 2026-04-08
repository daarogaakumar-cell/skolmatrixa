import NextAuth from "next-auth";
import { authConfigEdge } from "@/lib/auth.edge";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfigEdge);

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const pathname = nextUrl.pathname;

  // Public paths that don't require auth
  const publicPaths = ["/", "/login", "/register", "/forgot-password", "/reset-password"];
  const isPublicPath = publicPaths.includes(pathname);
  const isApiAuth = pathname.startsWith("/api/auth");
  const isApiWebhook = pathname.startsWith("/api/webhooks/");
  const isApiCron = pathname.startsWith("/api/cron/");
  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/manifest.json" ||
    pathname === "/apple-touch-icon.png" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml";

  if (isApiAuth || isPublicAsset || isApiWebhook || isApiCron) {
    return NextResponse.next();
  }

  // Redirect logged-in users away from login/register
  if (isLoggedIn && isPublicPath) {
    const role = session.user.role;
    if (role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/super-admin", nextUrl));
    }
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !isPublicPath) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based route protection
  if (isLoggedIn) {
    const role = session.user.role;

    // Super admin only routes
    if (pathname.startsWith("/super-admin") && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    // Admin only routes (settings, staff management, bulk email, whatsapp logs)
    const adminOnlyPaths = ["/settings", "/staff", "/bulk-email", "/whatsapp-logs"];
    const isAdminOnlyPath = adminOnlyPaths.some((p) => pathname.startsWith(`/dashboard${p}`));
    if (isAdminOnlyPath && !["TENANT_ADMIN", "VICE_ADMIN"].includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    // Fee routes - only admin, vice admin, and accountant
    if (pathname.startsWith("/dashboard/fees") && !["TENANT_ADMIN", "VICE_ADMIN", "ACCOUNTANT"].includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    // Library routes - only admin, vice admin, and librarian
    if (pathname.startsWith("/dashboard/library") && !["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"].includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    // Analytics/Reports/Export - only admin and vice admin (+ accountant for export)
    if (pathname.startsWith("/dashboard/analytics") && !["TENANT_ADMIN", "VICE_ADMIN"].includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    if (pathname.startsWith("/dashboard/reports") && !["TENANT_ADMIN", "VICE_ADMIN"].includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    if (pathname.startsWith("/dashboard/export") && !["TENANT_ADMIN", "VICE_ADMIN", "ACCOUNTANT"].includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    // Attendance marking - only admin, vice admin, teacher
    if (pathname.startsWith("/dashboard/attendance") && !["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"].includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    // Classes/Batches/Subjects/Timetable/Exams - admin, vice admin, teacher
    const teacherAdminPaths = ["/classes", "/batches", "/subjects", "/timetable", "/exams"];
    const isTeacherAdminPath = teacherAdminPaths.some((p) => pathname.startsWith(`/dashboard${p}`));
    if (isTeacherAdminPath && !["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"].includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    // Student portal routes - only students and parents
    const studentPortalPaths = ["/my-attendance", "/my-timetable", "/my-fees"];
    const isStudentPortalPath = studentPortalPaths.some((p) => pathname.startsWith(`/dashboard${p}`));
    if (isStudentPortalPath && !["STUDENT", "PARENT"].includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    // Prevent accountant/librarian from accessing class management, attendance etc
    const classManagementPaths = ["/students", "/classes", "/batches", "/subjects", "/attendance", "/timetable", "/exams", "/homework", "/leaves"];
    const isClassPath = classManagementPaths.some((p) => pathname === `/dashboard${p}` || pathname.startsWith(`/dashboard${p}/`));
    if (isClassPath && ["ACCOUNTANT", "LIBRARIAN"].includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  // Forward pathname as a header so server components (e.g. layout.tsx) can read it
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|apple-touch-icon.png|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml)$).*)"],
};
