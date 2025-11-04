import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Search, User, Heart, MapPin, LogOut, Home } from "lucide-react";

const Navbar = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Memoize navigation items to prevent unnecessary re-renders
  const navigationItems = useMemo(() => [
    {
      title: "Directory",
      items: [
        { title: "All Businesses", href: "/directory" },
        { title: "Restaurants", href: "/directory/restaurants" },
        { title: "Hotels", href: "/directory/hotels" },
        { title: "Tourism", href: "/directory/tourism" },
        { title: "Services", href: "/directory/services" }
      ]
    },
    {
      title: "Islands",
      items: [
        { title: "Mahé", href: "/islands/mahe" },
        { title: "Praslin", href: "/islands/praslin" },
        { title: "La Digue", href: "/islands/la-digue" },
        { title: "Other Islands", href: "/islands/others" }
      ]
    }
  ], []);

  // Memoize navigation handlers to prevent unnecessary re-renders
  const handleHomeClick = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/');
  }, [signOut, navigate]);

  const handleMobileMenuToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-ocean-gradient rounded-lg flex items-center justify-center">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">iCompass</span>
          </Link>

          {/* Home Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHomeClick}
            className="flex items-center gap-2 text-sm font-medium hover:bg-primary/10"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <NavigationMenu>
              <NavigationMenuList>
                {navigationItems.map((item) => (
                  <NavigationMenuItem key={item.title}>
                    <NavigationMenuTrigger className="text-foreground hover:text-primary">
                      {item.title}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid w-48 gap-1 p-2">
                        {item.items.map((subItem) => (
                         <NavigationMenuLink key={subItem.title} asChild>
                            <Link
                              to={subItem.href}
                              className="block px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md hover:text-primary transition-colors"
                            >
                              {subItem.title}
                            </Link>
                          </NavigationMenuLink>
                        ))}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ))}
                
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link to="/events" className="text-foreground hover:text-primary font-medium">
                      Events
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link to="/products" className="text-foreground hover:text-primary font-medium">
                      Products
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-foreground hover:text-primary" asChild>
              <Link to="/directory">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-foreground hover:text-primary" asChild>
              <Link to="/docs">
                <Heart className="h-4 w-4 mr-2" />
                Documentation
              </Link>
            </Button>
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  Welcome, {user.email?.split('@')[0]}
                </span>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link to="/auth">
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Link>
              </Button>
            )}
            <Button size="sm" className="bg-primary hover:bg-primary-dark" asChild>
              <Link to="/business">Register Business</Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col gap-6 pt-6">
                  <Link to="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                    <div className="w-8 h-8 bg-ocean-gradient rounded-lg flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-foreground">iCompass</span>
                  </Link>
                  
                  <div className="flex flex-col gap-4">
                    {navigationItems.map((item) => (
                      <div key={item.title}>
                        <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                        <div className="flex flex-col gap-2 pl-4">
                          {item.items.map((subItem) => (
                            <Link
                              key={subItem.title}
                              to={subItem.href}
                              className="text-muted-foreground hover:text-primary transition-colors"
                              onClick={() => setIsOpen(false)}
                            >
                              {subItem.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    <Link to="/events" className="font-semibold text-foreground hover:text-primary" onClick={() => setIsOpen(false)}>
                      Events
                    </Link>
                    <Link to="/products" className="font-semibold text-foreground hover:text-primary" onClick={() => setIsOpen(false)}>
                      Products
                    </Link>
                  </div>
                  
                  <div className="flex flex-col gap-3 pt-6 border-t border-border">
                    {user ? (
                      <>
                        <div className="text-sm text-muted-foreground">
                          Welcome, {user.email?.split('@')[0]}
                        </div>
                        <Button variant="outline" className="justify-start" onClick={() => { signOut(); setIsOpen(false); }}>
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" className="justify-start" asChild>
                        <Link to="/auth" onClick={() => setIsOpen(false)}>
                          <User className="h-4 w-4 mr-2" />
                          Sign In
                        </Link>
                      </Button>
                    )}
                    <Button className="bg-primary hover:bg-primary-dark justify-start" asChild>
                      <Link to="/business" onClick={() => setIsOpen(false)}>List Your Business</Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;