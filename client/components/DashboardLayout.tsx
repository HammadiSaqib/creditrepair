import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Bell, Search, Settings, Menu, Moon, Sun, Monitor, UserPlus, Crown } from "lucide-react";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import AdminNotifications from "./AdminNotifications";
import AdminContractPrompt from "./AdminContractPrompt";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  onAddClient?: () => void;
}

export default function DashboardLayout({
  children,
  title,
  description,
  onAddClient,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userProfile } = useAuthContext();
  const { hasActiveSubscription } = useSubscriptionStatus();
  
  // Debug logging
  console.log('🔍 DashboardLayout - hasActiveSubscription:', hasActiveSubscription);
  console.log('🔍 DashboardLayout - userProfile:', userProfile);
  
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) return savedTheme;
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove existing theme classes
    root.classList.remove("light", "dark");

    let effectiveTheme = theme;
    if (theme === "system") {
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    if (effectiveTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.add("light");
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        if (mediaQuery.matches) {
          root.classList.add("dark");
        } else {
          root.classList.add("light");
        }
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  const toggleTheme = (newTheme: string) => {
    setTheme(newTheme);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/80 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`lg:block ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transform transition-transform duration-300 ease-in-out lg:transform-none`}
      >
        <Sidebar onAddClient={onAddClient} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Top header */}
        <header className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-border/40 sticky top-0 z-30">
          <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:inline-flex"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              {title && (
                <div>
                  <h1 className="text-base sm:text-xl font-semibold gradient-text-primary truncate">
                    {title}
                  </h1>
                  {description && (
                    <p className="hidden sm:block text-sm text-muted-foreground">
                      {description}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-nowrap sm:flex-wrap w-full sm:w-auto ml-auto justify-end">
              {/* Search */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search anything..."
                  className="pl-10 pr-4 py-2 w-80 text-sm border border-border/40 rounded-lg bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-ocean-blue/20 focus:border-ocean-blue/40"
                />
              </div>

              {/* Notifications */}
              <AdminNotifications />

              {/* Admin Onboarding Agreement Prompt */}
              <AdminContractPrompt />

              {/* Theme Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-gradient-soft"
                  >
                    {theme === "light" ? (
                      <Sun className="h-4 w-4" />
                    ) : theme === "dark" ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Monitor className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toggleTheme("light")}>
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleTheme("dark")}>
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleTheme("system")}>
                    <Monitor className="h-4 w-4 mr-2" />
                    System
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Add Client - icon on mobile, full button on larger screens */}
              {userProfile?.role === 'admin' && (
                <>
                  {/* Mobile icon-only, placed next to theme switcher */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="sm:hidden hover:bg-gradient-soft"
                    onClick={onAddClient}
                    aria-label="Add New Client"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>

                  {/* Desktop/full button */}
                  <Button
                    variant="default"
                    size="sm"
                    className="hidden sm:inline-flex gradient-primary hover:opacity-90"
                    onClick={onAddClient}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add New Client
                  </Button>
                </>
              )}

              {/* Upgrade to Pro - Crown Hover Card */}
              {!hasActiveSubscription && (
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-gradient-soft"
                    >
                      <Crown className="h-4 w-4 text-purple-600" />
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent align="end" className="w-80">
                    <div className="flex items-start space-x-3">
                      <Crown className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div className="space-y-2">
                        <div className="text-sm font-semibold">Upgrade to Pro</div>
                        <p className="text-xs text-muted-foreground">Unlock premium benefits:</p>
                        <ul className="text-xs list-disc pl-4 space-y-1">
                          <li>Advanced analytics and reporting</li>
                          <li>Priority support</li>
                          <li>Higher commissions</li>
                          <li>Exclusive marketing materials</li>
                        </ul>
                        <Link to="/subscription" className="block">
                          <Button
                            size="sm"
                            className="mt-2 w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                          >
                            Upgrade Now
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              )}

              {/* Settings */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-gradient-soft"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="w-full cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User menu */}
              <div className="flex items-center space-x-3 pl-3 border-l border-border/40">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium">
                    {userProfile ?
                      `${userProfile.first_name} ${userProfile.last_name}` :
                      'Loading...'
                    }
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {userProfile?.role === 'admin' ? 'Admin Account' : 'Pro Account'}
                  </div>
                </div>
                <Avatar className="h-8 w-8">
                  {userProfile?.avatar && (
                    <AvatarImage src={userProfile.avatar} alt="Profile" />
                  )}
                  <AvatarFallback className="gradient-primary text-white">
                    {userProfile ?
                      `${userProfile.first_name?.[0] || ''}${userProfile.last_name?.[0] || ''}` :
                      'U'
                    }
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
