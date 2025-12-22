// import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Atom, Cpu, Dna, Edit, FlaskConical, GripVertical, Lightbulb, Microscope } from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/admin/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// Types
interface ResearchProject {
  name: string;
  status: "Planning" | "In Progress" | "Testing" | "Completed";
  progress: number;
}

interface TechnologyResearch {
  id: number;
  title: string;
  description?: string;
  currentProjects?: ResearchProject[];
  publications?: string[];
  partners?: string[];
  outcomes?: string[];
  icon?: string;
  imageId?: number | null;
  videoId?: number | null;
  isActive?: boolean;
  position?: number;
}

interface SortableResearchItemProps {
  research: TechnologyResearch;
  onEdit: (research: TechnologyResearch) => void;
  onDelete: (id: number) => void;
}

export function SortableResearchItem({ research, onEdit, onDelete }: SortableResearchItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: research.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComponent = {
    Microscope,
    Flask: FlaskConical,
    Atom,
    Dna,
    Lightbulb,
    Cpu,
  }[research.icon || "Microscope"] || Microscope;

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-lg border p-4 mb-2 shadow-sm-xs">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div {...attributes} {...listeners} className="cursor-move text-gray-400 hover:text-gray-600 mt-1">
            <GripVertical className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <IconComponent className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{research.title}</h4>
                {research.description && <p className="text-sm text-gray-600 mt-1">{research.description}</p>}
                {research.currentProjects && research.currentProjects.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-500">Current Projects:</p>
                    {research.currentProjects.slice(0, 2).map((project, index) => (
                      <div key={index} className="flex items-center justify-between text-xs mt-1">
                        <span className="text-gray-600">{project.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${project.status === 'Completed' ? 'bg-green-100 text-green-700' :
                            project.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                              project.status === 'Testing' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                            {project.status}
                          </span>
                          <div className="w-12">
                            <Progress value={project.progress} className="h-1" />
                          </div>
                          <span className="text-gray-500">{project.progress}%</span>
                        </div>
                      </div>
                    ))}
                    {research.currentProjects.length > 2 && (
                      <p className="text-xs text-gray-500 mt-1">+{research.currentProjects.length - 2} more projects</p>
                    )}
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                  {research.publications && research.publications.length > 0 && (
                    <span>📚 {research.publications.length} publication{research.publications.length !== 1 ? 's' : ''}</span>
                  )}
                  {research.partners && research.partners.length > 0 && (
                    <span>🤝 {research.partners.length} partner{research.partners.length !== 1 ? 's' : ''}</span>
                  )}
                  {research.outcomes && research.outcomes.length > 0 && (
                    <span>🎯 {research.outcomes.length} outcome{research.outcomes.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2 ml-4">
          <Badge variant={research.isActive ? "default" : "secondary"}>
            {research.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Button size="sm" variant="ghost" onClick={() => onEdit(research)}>
            <Edit className="w-4 h-4" />
          </Button>
          <DeleteConfirmationDialog
            onConfirm={() => onDelete(research.id)}
            title="Delete Research"
            description={`Are you sure you want to delete "${research.title}"? This action cannot be undone.`}
            triggerClassName="text-red-600 hover:text-red-700"
          />
        </div>
      </div>
    </div>
  );
}