// Define which routes are for guests only (redirect to home if logged in)
const GUEST_ONLY_ROUTES = ["/login", "/register"];

// Define which routes require authentication
const PROTECTED_ROUTES = ["/upload", "/settings", "/profile", "/admin"];

export default function proxy(req) {
  const token = req.cookies.get("token");
  const pathname = req.nextUrl.pathname;
  
  // Check if route is for guests only (login/register)
  const isGuestRoute = GUEST_ONLY_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + "/")
  );
  
  // Check if route requires authentication
  const needsAuth = PROTECTED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + "/")
  );

  // If logged in and trying to access guest route (login/register) -> redirect to home
  if (token && isGuestRoute) {
    const homeUrl = new URL("/", req.url);
    return Response.redirect(homeUrl);
  }

  // If not logged in and trying to access protected route -> redirect to login
  if (needsAuth && !token) {
    const loginUrl = new URL("/login", req.url);
    return Response.redirect(loginUrl);
  }

  return undefined;
}

export const config = {
  matcher: [
    "/upload/:path*", 
    "/settings/:path*", 
    "/profile/:path*",
    "/admin/:path*",
    "/login",
    "/register"
  ],
};
