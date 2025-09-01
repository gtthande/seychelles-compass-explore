import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Search, User, Heart, MapPin } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navigationItems = [
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
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-ocean-gradient rounded-lg flex items-center justify-center">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">iCompass</span>
          </div>

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
                          <NavigationMenuLink
                            key={subItem.title}
                            href={subItem.href}
                            className="block px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md hover:text-primary transition-colors"
                          >
                            {subItem.title}
                          </NavigationMenuLink>
                        ))}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ))}
                
                <NavigationMenuItem>
                  <NavigationMenuLink href="/events" className="text-foreground hover:text-primary font-medium">
                    Events
                  </NavigationMenuLink>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuLink href="/marketplace" className="text-foreground hover:text-primary font-medium">
                    Marketplace
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-foreground hover:text-primary">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button variant="ghost" size="sm" className="text-foreground hover:text-primary">
              <Heart className="h-4 w-4 mr-2" />
              Favorites
            </Button>
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-2" />
              Sign In
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary-dark">
              List Business
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
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-ocean-gradient rounded-lg flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-foreground">iCompass</span>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    {navigationItems.map((item) => (
                      <div key={item.title}>
                        <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                        <div className="flex flex-col gap-2 pl-4">
                          {item.items.map((subItem) => (
                            <a
                              key={subItem.title}
                              href={subItem.href}
                              className="text-muted-foreground hover:text-primary transition-colors"
                              onClick={() => setIsOpen(false)}
                            >
                              {subItem.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    <a href="/events" className="font-semibold text-foreground hover:text-primary">
                      Events
                    </a>
                    <a href="/marketplace" className="font-semibold text-foreground hover:text-primary">
                      Marketplace
                    </a>
                  </div>
                  
                  <div className="flex flex-col gap-3 pt-6 border-t border-border">
                    <Button variant="outline" className="justify-start">
                      <User className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                    <Button className="bg-primary hover:bg-primary-dark justify-start">
                      List Your Business
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