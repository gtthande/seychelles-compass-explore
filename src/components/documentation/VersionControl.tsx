import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { GitBranch, Clock, User, Plus, Tag, FileText, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const versionSchema = z.object({
  version: z.string().regex(/^v\d+\.\d+\.\d+$/, "Version must be in format v1.0.0"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  changes: z.string().min(1, "Changes summary is required"),
});

type VersionFormData = z.infer<typeof versionSchema>;

interface Version {
  id: string;
  version: string;
  title: string;
  description: string;
  changes: string;
  author: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
}

const VersionControl = () => {
  const { toast } = useToast();
  const [versions, setVersions] = useState<Version[]>([
    {
      id: "1",
      version: "v1.0.0",
      title: "Initial Release",
      description: "Complete business directory platform with AI search and real-time features",
      changes: "• Business registration and management\n• AI-powered image search\n• Real-time counters\n• Interactive maps\n• Product management",
      author: "Development Team",
      date: "2024-01-15",
      type: "major"
    },
    {
      id: "2",
      version: "v0.9.0",
      title: "Beta Release",
      description: "Core functionality with basic business directory features",
      changes: "• Basic business listings\n• Search and filtering\n• User authentication\n• Admin panel setup",
      author: "Development Team",
      date: "2024-01-01",
      type: "minor"
    }
  ]);

  const form = useForm<VersionFormData>({
    resolver: zodResolver(versionSchema),
    defaultValues: {
      version: "",
      title: "",
      description: "",
      changes: "",
    },
  });

  const onSubmit = (data: VersionFormData) => {
    const newVersion: Version = {
      id: (versions.length + 1).toString(),
      version: data.version,
      title: data.title,
      description: data.description,
      changes: data.changes,
      author: "Current User",
      date: new Date().toISOString().split('T')[0],
      type: 'minor', // Could be determined by version number
    };

    setVersions([newVersion, ...versions]);
    form.reset();
    
    toast({
      title: "Version Created",
      description: `Documentation version ${data.version} has been created successfully.`,
    });
  };

  const getVersionBadgeVariant = (type: string) => {
    switch (type) {
      case 'major': return 'destructive';
      case 'minor': return 'default';
      case 'patch': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch className="h-6 w-6" />
            Version Control
          </h2>
          <p className="text-muted-foreground">
            Manage documentation versions and track changes over time
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Version
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Version</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Version Number</FormLabel>
                      <FormControl>
                        <Input placeholder="v1.1.0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Version Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Feature Update" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of changes..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="changes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Changes Summary</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="• Feature 1&#10;• Bug fix 2&#10;• Update 3"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full">
                  Create Version
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {versions.map((version, index) => (
          <Card key={version.id} className={index === 0 ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={getVersionBadgeVariant(version.type)}
                    className="flex items-center gap-1"
                  >
                    <Tag className="h-3 w-3" />
                    {version.version}
                  </Badge>
                  {index === 0 && (
                    <Badge variant="outline">Current</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  {version.author}
                  <Clock className="h-4 w-4" />
                  {version.date}
                </div>
              </div>
              <CardTitle>{version.title}</CardTitle>
              <CardDescription>{version.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Changes
                  </h4>
                  <div className="bg-muted p-3 rounded text-sm">
                    <pre className="whitespace-pre-wrap font-mono">{version.changes}</pre>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    View Docs
                  </Button>
                  <Button variant="outline" size="sm">
                    <Database className="h-4 w-4 mr-2" />
                    Export Version
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VersionControl;