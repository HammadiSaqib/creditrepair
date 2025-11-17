import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authApi } from "@/lib/api";

interface AffiliateProtectedRouteProps {
  children: ReactNode;
}

export default function AffiliateProtectedRoute({ children }: AffiliateProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const storedRole = localStorage.getItem("userRole");
        
        if (!token) {
          setIsAuthenticated(false);
          return;
        }

        // Verify token with backend
        const response = await authApi.verifyToken();
        
        if (response.data?.valid && response.data?.user) {
          const user = response.data.user;
          
          // Check if user has affiliate role
          if (user.role === "affiliate") {
            setIsAuthenticated(true);
            setUserRole(user.role);
            
            // Update stored user info
            localStorage.setItem("userRole", user.role);
            localStorage.setItem("userId", user.id.toString());
            localStorage.setItem("userName", `${user.first_name} ${user.last_name}`);
          } else {
            console.log("Access denied: User role is", user.role, "but affiliate required");
            setIsAuthenticated(false);
            setUserRole(user.role);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Affiliate auth check failed:", error);
        setIsAuthenticated(false);
        
        // Clear invalid tokens
        localStorage.removeItem("auth_token");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
      }
    };

    checkAuth();
  }, [location.pathname]);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50 dark:from-slate-950 dark:to-green-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Verifying affiliate access...</p>
        </div>
      </div>
    );
  }

  // Redirect to affiliate login if not authenticated or not affiliate role
  if (!isAuthenticated || userRole !== "affiliate") {
    return <Navigate to="/affiliate/login" state={{ from: location }} replace />;
  }

  // Render protected content for authenticated affiliate users
  return <>{children}</>;
}