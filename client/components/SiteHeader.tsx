import { NavLink, Link } from "react-router-dom";
import { Button } from "./ui/button";
import { DollarSign, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function SiteHeader() {
  return (
    <header className="relative z-50 border-b bg-white/95 backdrop-blur-sm sticky top-0">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img src="/image.png" alt="Score Machine" className="w-20 h-14" />
          <span className="text-2xl font-bold bg-gradient-to-r from-ocean-blue to-sea-green bg-clip-text text-transparent">
            Score Machine
          </span>
        </div>
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <NavLink
            to="/"
            className={({ isActive }) =>
              cn(
                "text-muted-foreground hover:text-ocean-blue transition-colors font-medium",
                isActive && "text-ocean-blue font-semibold"
              )
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/features"
            className={({ isActive }) =>
              cn(
                "text-muted-foreground hover:text-ocean-blue transition-colors font-medium",
                isActive && "text-ocean-blue font-semibold"
              )
            }
          >
            Features
          </NavLink>
          <NavLink
            to="/how-it-works"
            className={({ isActive }) =>
              cn(
                "text-muted-foreground hover:text-ocean-blue transition-colors font-medium",
                isActive && "text-ocean-blue font-semibold"
              )
            }
          >
            How It Works
          </NavLink>
          <NavLink
            to="/pricing"
            className={({ isActive }) =>
              cn(
                "text-muted-foreground hover:text-ocean-blue transition-colors font-medium",
                isActive && "text-ocean-blue font-semibold"
              )
            }
          >
            Pricing
          </NavLink>
          <NavLink
            to="/join-affiliate"
            className={({ isActive }) =>
              cn(
                "text-sea-green hover:text-sea-green/80 transition-colors font-semibold flex items-center gap-1",
                isActive && "text-sea-green"
              )
            }
          >
            <DollarSign className="h-4 w-4" />
            Earn with Us
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              cn(
                "text-muted-foreground hover:text-ocean-blue transition-colors font-medium",
                isActive && "text-ocean-blue font-semibold"
              )
            }
          >
            Contact
          </NavLink>
        </nav>
        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center space-x-3">
          <Button variant="ghost" className="hover:text-ocean-blue" asChild>
            <Link to="/login">Sign In</Link>
          </Button>
          <Button
            variant="outline"
            className="border-sea-green text-sea-green hover:bg-sea-green hover:text-white hidden lg:flex"
            asChild
          >
            <Link to="/join-affiliate">
              <DollarSign className="mr-2 h-4 w-4" />
              Join Affiliate
            </Link>
          </Button>
          <Button
            className="bg-gradient-to-r from-ocean-blue to-sea-green hover:from-ocean-blue/90 hover:to-sea-green/90 shadow-lg"
            asChild
          >
            <Link to="/login">Get Started Free</Link>
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="grid gap-3">
                  <NavLink
                    to="/"
                    className={({ isActive }) =>
                      cn(
                        "block px-3 py-2 rounded-md hover:bg-slate-100",
                        isActive && "bg-slate-100 font-semibold"
                      )
                    }
                  >
                    Home
                  </NavLink>
                  <NavLink
                    to="/features"
                    className={({ isActive }) =>
                      cn(
                        "block px-3 py-2 rounded-md hover:bg-slate-100",
                        isActive && "bg-slate-100 font-semibold"
                      )
                    }
                  >
                    Features
                  </NavLink>
                  <NavLink
                    to="/how-it-works"
                    className={({ isActive }) =>
                      cn(
                        "block px-3 py-2 rounded-md hover:bg-slate-100",
                        isActive && "bg-slate-100 font-semibold"
                      )
                    }
                  >
                    How It Works
                  </NavLink>
                  <NavLink
                    to="/pricing"
                    className={({ isActive }) =>
                      cn(
                        "block px-3 py-2 rounded-md hover:bg-slate-100",
                        isActive && "bg-slate-100 font-semibold"
                      )
                    }
                  >
                    Pricing
                  </NavLink>
                  <NavLink
                    to="/contact"
                    className={({ isActive }) =>
                      cn(
                        "block px-3 py-2 rounded-md hover:bg-slate-100",
                        isActive && "bg-slate-100 font-semibold"
                      )
                    }
                  >
                    Contact
                  </NavLink>
                  <NavLink
                    to="/join-affiliate"
                    className={({ isActive }) =>
                      cn(
                        "block px-3 py-2 rounded-md hover:bg-slate-100 text-sea-green",
                        isActive && "bg-slate-100 font-semibold text-sea-green"
                      )
                    }
                  >
                    Earn with Us
                  </NavLink>
                </div>

                <div className="grid gap-3 pt-4">
                  <Button variant="ghost" asChild>
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/join-affiliate">Join Affiliate</Link>
                  </Button>
                  <Button className="bg-gradient-to-r from-ocean-blue to-sea-green" asChild>
                    <Link to="/login">Get Started Free</Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}