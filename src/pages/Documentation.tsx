import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen, 
  Code, 
  Download, 
  FileText, 
  GitBranch, 
  Users, 
  Database,
  Server,
  Map,
  Search,
  Settings,
  Upload,
  UserCheck,
  Building2,
  Package
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDocumentationExport } from "@/hooks/useDocumentationExport";
import VersionControl from "@/components/documentation/VersionControl";

const Documentation = () => {
  const { toast } = useToast();
  const { exportDocumentation, isExporting } = useDocumentationExport();
  const [selectedVersion, setSelectedVersion] = useState("v1.0.0");

  const versions = [
    { value: "v1.0.0", label: "v1.0.0 - Current", date: "2024-01-15" },
    { value: "v0.9.0", label: "v0.9.0 - Beta", date: "2024-01-01" },
  ];

  const handleExport = (format: 'pdf' | 'markdown', type: 'technical' | 'user') => {
    exportDocumentation({ format, type, version: selectedVersion });
  };

  const TechnicalDocs = () => (
    <div className="space-y-8">
      {/* Architecture Overview */}
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Code className="h-6 w-6" />
          System Architecture
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>Technology Stack</CardTitle>
            <CardDescription>Overview of the platform's technical foundation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Frontend</h4>
                <div className="space-y-1">
                  <Badge variant="secondary">React 18</Badge>
                  <Badge variant="secondary">TypeScript</Badge>
                  <Badge variant="secondary">Tailwind CSS</Badge>
                  <Badge variant="secondary">Vite</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Backend</h4>
                <div className="space-y-1">
                  <Badge variant="secondary">Supabase</Badge>
                  <Badge variant="secondary">PostgreSQL</Badge>
                  <Badge variant="secondary">Edge Functions</Badge>
                  <Badge variant="secondary">Real-time</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Services</h4>
                <div className="space-y-1">
                  <Badge variant="secondary">OpenAI API</Badge>
                  <Badge variant="secondary">Resend Email</Badge>
                  <Badge variant="secondary">Google Maps</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Data Models */}
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Database className="h-6 w-6" />
          Data Models
        </h2>
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Core Entities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Business</h4>
                  <code className="text-sm bg-muted p-2 rounded block">
                    {`{
  id: uuid,
  name: string,
  category: business_category,
  description: text,
  owner_id: uuid -> profiles.id,
  status: business_status,
  address: string,
  island: string,
  phone: string,
  email: string,
  website: string,
  services: string[],
  latitude: numeric,
  longitude: numeric,
  logo_url: string,
  cover_image_url: string,
  gallery_images: string[],
  featured: boolean,
  verified: boolean,
  average_rating: numeric,
  total_reviews: integer
}`}
                  </code>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Product</h4>
                  <code className="text-sm bg-muted p-2 rounded block">
                    {`{
  id: uuid,
  business_id: uuid -> businesses.id,
  name: string,
  description: text,
  price: numeric,
  currency: string,
  category: string,
  images: string[],
  status: listing_status,
  in_stock: boolean,
  stock_quantity: integer,
  sku: string,
  unit: string,
  tags: string[],
  catalogue_url: string,
  featured: boolean
}`}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* API Endpoints */}
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Server className="h-6 w-6" />
          API Endpoints
        </h2>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edge Functions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold">POST /functions/v1/image-search</h4>
                  <p className="text-sm text-muted-foreground">AI-powered image search using OpenAI Vision API</p>
                  <code className="text-xs">Body: {`{ image: base64_string }`}</code>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold">POST /functions/v1/geocode-address</h4>
                  <p className="text-sm text-muted-foreground">Convert address to GPS coordinates</p>
                  <code className="text-xs">Body: {`{ address: string, island: string }`}</code>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold">POST /functions/v1/send-business-email</h4>
                  <p className="text-sm text-muted-foreground">Send business registration notification</p>
                  <code className="text-xs">Body: {`{ businessName: string, email: string, ... }`}</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Real-time Features */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Real-time Features</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold">Live Counters</h4>
                <p className="text-sm text-muted-foreground">
                  Real-time updates for business, product, user, and review counts using Supabase subscriptions
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Database Subscriptions</h4>
                <p className="text-sm text-muted-foreground">
                  All tables have REPLICA IDENTITY FULL and are added to supabase_realtime publication
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );

  const UserManual = () => (
    <div className="space-y-8">
      {/* Getting Started */}
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Users className="h-6 w-6" />
          Getting Started
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>Welcome to iCompass Seychelles</CardTitle>
            <CardDescription>Your comprehensive business directory for the Seychelles islands</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              iCompass is a platform that connects businesses and customers across the Seychelles islands. 
              Whether you're looking to discover local services or showcase your business, this guide will help you get started.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">For Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Browse businesses by category and location</li>
                    <li>• Use AI-powered image search</li>
                    <li>• View businesses on interactive maps</li>
                    <li>• Contact businesses directly</li>
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">For Business Owners</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Register and manage your business profile</li>
                    <li>• Upload and manage products/services</li>
                    <li>• Track engagement with analytics</li>
                    <li>• Manage customer interactions</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Business Registration */}
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          How to Register Your Business
        </h2>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Step-by-Step Registration Process</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">1</div>
                  <div>
                    <h4 className="font-semibold">Create an Account</h4>
                    <p className="text-sm text-muted-foreground">
                      Click "List Business" in the navigation bar and sign up with your email address.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">2</div>
                  <div>
                    <h4 className="font-semibold">Complete Business Information</h4>
                    <p className="text-sm text-muted-foreground">
                      Fill out your business details including name, category, description, and contact information.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">3</div>
                  <div>
                    <h4 className="font-semibold">Add Location & Services</h4>
                    <p className="text-sm text-muted-foreground">
                      Specify your location, island, and list the services you offer to help customers find you.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">4</div>
                  <div>
                    <h4 className="font-semibold">Upload Media</h4>
                    <p className="text-sm text-muted-foreground">
                      Add your business logo and cover image to make your profile more appealing.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">5</div>
                  <div>
                    <h4 className="font-semibold">Submit for Review</h4>
                    <p className="text-sm text-muted-foreground">
                      Your business will be reviewed and activated within 24-48 hours.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Product Management */}
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Package className="h-6 w-6" />
          Managing Products & Services
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>Product Management Dashboard</CardTitle>
            <CardDescription>Learn how to add and manage your business offerings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Adding a New Product/Service</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Navigate to your Business Dashboard</li>
                  <li>Click on the "Products & Services" tab</li>
                  <li>Click the "Add Product" button</li>
                  <li>Fill in product details (name, description, price)</li>
                  <li>Upload product images</li>
                  <li>Set availability and stock information</li>
                  <li>Save to publish</li>
                </ol>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Managing Existing Products</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Edit product information by clicking the edit icon</li>
                  <li>• Toggle product availability on/off</li>
                  <li>• Update stock quantities in real-time</li>
                  <li>• Upload additional product images</li>
                  <li>• Add product catalogues (PDF format)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Directory Search */}
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Search className="h-6 w-6" />
          Using the Directory
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Search Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Text Search:</strong> Type business names or keywords</li>
                <li>• <strong>Image Search:</strong> Upload photos to find similar businesses</li>
                <li>• <strong>Category Filter:</strong> Browse by business type</li>
                <li>• <strong>Location Filter:</strong> Search by island</li>
                <li>• <strong>WhatsApp Filter:</strong> Find businesses with WhatsApp</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Map Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Switch between list and map view</li>
                <li>• Click markers to see business details</li>
                <li>• Get directions to businesses</li>
                <li>• View nearby businesses</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Documentation</h1>
                <p className="text-muted-foreground">Technical docs and user guides for iCompass</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <GitBranch className="h-3 w-3" />
                {selectedVersion}
              </Badge>
            </div>
          </div>
          
          {/* Export Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExport('pdf', 'technical')}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Technical (PDF)
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExport('markdown', 'technical')}
              disabled={isExporting}
            >
              <FileText className="h-4 w-4 mr-2" />
              Export Technical (MD)
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExport('pdf', 'user')}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              Export User Manual (PDF)
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExport('markdown', 'user')}
              disabled={isExporting}
            >
              <FileText className="h-4 w-4 mr-2" />
              Export User Manual (MD)
            </Button>
          </div>
        </div>

        {/* Documentation Content */}
        <Tabs defaultValue="technical" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="technical" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Technical Documentation
            </TabsTrigger>
            <TabsTrigger value="user" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Manual
            </TabsTrigger>
            <TabsTrigger value="version" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Version Control
            </TabsTrigger>
          </TabsList>

          <TabsContent value="technical">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <TechnicalDocs />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="user">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <UserManual />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="version">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <VersionControl />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Documentation;