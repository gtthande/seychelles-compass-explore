import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube,
  Send
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-background to-muted border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-ocean-gradient rounded-lg flex items-center justify-center">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-foreground">iCompass</span>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Your comprehensive directory for discovering the best businesses, services, and experiences across the beautiful islands of Seychelles.
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="rounded-full w-10 h-10 p-0">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="rounded-full w-10 h-10 p-0">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="rounded-full w-10 h-10 p-0">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="rounded-full w-10 h-10 p-0">
                <Youtube className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-6">Quick Links</h3>
            <div className="space-y-3">
              <a href="/directory" className="block text-muted-foreground hover:text-primary transition-colors">
                Business Directory
              </a>
              <a href="/marketplace" className="block text-muted-foreground hover:text-primary transition-colors">
                Marketplace
              </a>
              <a href="/events" className="block text-muted-foreground hover:text-primary transition-colors">
                Events & Promotions
              </a>
              <a href="/about" className="block text-muted-foreground hover:text-primary transition-colors">
                About Us
              </a>
              <a href="/contact" className="block text-muted-foreground hover:text-primary transition-colors">
                Contact
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-foreground mb-6">Popular Categories</h3>
            <div className="space-y-3">
              <a href="/category/restaurants" className="block text-muted-foreground hover:text-primary transition-colors">
                Restaurants & Dining
              </a>
              <a href="/category/hotels" className="block text-muted-foreground hover:text-primary transition-colors">
                Hotels & Accommodation
              </a>
              <a href="/category/tourism" className="block text-muted-foreground hover:text-primary transition-colors">
                Tourism & Travel
              </a>
              <a href="/category/transport" className="block text-muted-foreground hover:text-primary transition-colors">
                Transport & Rental
              </a>
              <a href="/category/services" className="block text-muted-foreground hover:text-primary transition-colors">
                Professional Services
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-foreground mb-6">Stay Updated</h3>
            <p className="text-muted-foreground mb-4">
              Get the latest updates on new businesses, events, and promotions in Seychelles.
            </p>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter your email"
                  type="email"
                  className="flex-1"
                />
                <Button size="sm" className="bg-primary hover:bg-primary-dark">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                By subscribing, you agree to our Privacy Policy and Terms of Service.
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-12" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>© 2024 iCompass Seychelles. All rights reserved.</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <a href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </a>
            <a href="/support" className="text-muted-foreground hover:text-primary transition-colors">
              Support
            </a>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Victoria, Mahé, Seychelles</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 text-primary" />
              <span>+248 4 123 456</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 text-primary" />
              <span>info@icompass.sc</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;