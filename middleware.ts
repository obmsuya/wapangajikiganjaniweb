import { NextRequest, NextResponse } from 'next/server';

/**
 * Authentication middleware for Next.js
 * Protects routes and directs users based on their role
 */
export function middleware(request: NextRequest) {
  // Get the pathname from the request
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/login' || path === '/register' || path === '/forgot-password';
  
  // Get the authentication token from cookies
  const token = request.cookies.get('token')?.value || '';
  
  // Get user type from cookies if available (set during login)
  const userType = request.cookies.get('userType')?.value || '';
  
  // Check if user is a superuser (will be allowed to access any route)
  const isSuperUser = userType === 'system_admin';
  
  // If user is trying to access a public path while already authenticated, redirect them
  if (isPublicPath && token) {
    // Check for a preferred landing page in cookies first (for superusers)
    const preferredPage = request.cookies.get('preferredLandingPage')?.value;
    if (preferredPage && isSuperUser) {
      return NextResponse.redirect(new URL(preferredPage, request.url));
    }
    
    // Otherwise redirect based on user type
    if (userType === 'system_admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (userType === 'landlord') {
      return NextResponse.redirect(new URL('/client', request.url));
    }
    if (userType === 'tenant') {
      return NextResponse.redirect(new URL('/tenant/dashboard', request.url));
    }
    if (userType === 'manager') {
      return NextResponse.redirect(new URL('/manager/dashboard', request.url));
    }
    
    // Default fallback if userType is not set or recognized
    return NextResponse.redirect(new URL('/client', request.url));
  }
  
  // If user is not authenticated and trying to access a protected route, redirect to login
  if (!isPublicPath && !token) {
    // Save the original intended URL to redirect back after login
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }
  
  // Role-based access control - superusers can access any route
  if (token && !isSuperUser) {
    // Only apply these restrictions to non-superuser accounts
    
    // Protect admin/dashboard routes from non-admin users
    if (path.startsWith('/dashboard') && userType !== 'system_admin') {
      return NextResponse.redirect(new URL('/client', request.url));
    }
    
    // Protect client routes from non-landlord users
    if (path.startsWith('/client') && userType !== 'landlord') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Protect tenant routes from non-tenant users
    if (path.startsWith('/tenant') && userType !== 'tenant') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Protect manager routes from non-manager users
    if (path.startsWith('/manager') && userType !== 'manager') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Allow the request to continue
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    // Apply to all routes except for API routes, static files, and specified paths
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 