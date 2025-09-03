import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Code, 
  Database, 
  Server, 
  Users, 
  Building2, 
  Package, 
  Search, 
  Map,
  Settings,
  GitBranch,
  FileText
} from "lucide-react";

interface DocumentationSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  type: 'technical' | 'user';
}

const DocumentationSidebar = ({ activeSection, onSectionChange, type }: DocumentationSidebarProps) => {
  const technicalSections = [
    { id: "overview", label: "System Overview", icon: Code },
    { id: "architecture", label: "Architecture", icon: Settings },
    { id: "data-models", label: "Data Models", icon: Database },
    { id: "api-endpoints", label: "API Endpoints", icon: Server },
    { id: "realtime", label: "Real-time Features", icon: GitBranch },
    { id: "deployment", label: "Deployment", icon: FileText },
  ];

  const userSections = [
    { id: "getting-started", label: "Getting Started", icon: Users },
    { id: "registration", label: "Business Registration", icon: Building2 },
    { id: "products", label: "Product Management", icon: Package },
    { id: "directory", label: "Using Directory", icon: Search },
    { id: "maps", label: "Map Features", icon: Map },
    { id: "troubleshooting", label: "Troubleshooting", icon: Settings },
  ];

  const sections = type === 'technical' ? technicalSections : userSections;

  return (
    <div className="w-64 border-r bg-muted/50">
      <div className="p-4">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
          {type === 'technical' ? 'Technical Docs' : 'User Manual'}
        </h3>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Button
                  key={section.id}
                  variant={activeSection === section.id ? "secondary" : "ghost"}
                  className="w-full justify-start text-left"
                  onClick={() => onSectionChange(section.id)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {section.label}
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default DocumentationSidebar;