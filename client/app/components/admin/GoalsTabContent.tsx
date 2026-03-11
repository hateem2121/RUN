import type { SensorDescriptor } from "@dnd-kit/core";
import { closestCenter, DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { SustainabilityGoal } from "@shared/index";
import type { UseMutationResult } from "@tanstack/react-query";
import { Eye, LayoutTemplate, Plus, Save, Target, Target as TargetIcon, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface GoalFormData {
  title: string;
  targetYear: string;
  targetValue: string;
  currentValue: string;
  unit: string;
  description: string;
  category: string;
  isActive: boolean;
  position: number;
}

interface ValidationState {
  isValid: boolean;
  message: string;
}

interface GoalValidation {
  title: ValidationState;
  targetYear: ValidationState;
  targetValue: ValidationState;
  currentValue: ValidationState;
  unit: ValidationState;
  description: ValidationState;
  category: ValidationState;
}

interface GoalsTabContentProps {
  goals: SustainabilityGoal[] | undefined;
  paginatedGoals: SustainabilityGoal[];

  goalsPage: number;
  goalsTotalPages: number;
  sensors: SensorDescriptor<object>[];
  createGoalMutation: UseMutationResult<any, any, any>;
  updateGoalMutation: UseMutationResult<any, any, any>;
  deleteGoalMutation: UseMutationResult<unknown, unknown, number>;
  SortableGoalItem: React.ComponentType<{
    goal: SustainabilityGoal;
    onEdit: (goal: SustainabilityGoal) => void;
    onDelete: (id: number) => void;
  }>;
  onSetGoalsPage: (page: number) => void;
}

export function GoalsTabContent({
  goals,
  paginatedGoals,
  goalsPage,
  goalsTotalPages,
  sensors,
  createGoalMutation,
  updateGoalMutation,
  deleteGoalMutation,
  SortableGoalItem,
  onSetGoalsPage,
}: GoalsTabContentProps) {
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showGoalPreview, setShowGoalPreview] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SustainabilityGoal | null>(null);

  const [goalForm, setGoalForm] = useState<GoalFormData>({
    title: "",
    targetYear: "",
    targetValue: "",
    currentValue: "",
    unit: "",
    description: "",
    category: "",
    isActive: true,
    position: 1,
  });

  const [goalValidation, setGoalValidation] = useState<GoalValidation>({
    title: { isValid: true, message: "" },
    targetYear: { isValid: true, message: "" },
    targetValue: { isValid: true, message: "" },
    currentValue: { isValid: true, message: "" },
    unit: { isValid: true, message: "" },
    description: { isValid: true, message: "" },
    category: { isValid: true, message: "" },
  });

  const validateGoalForm = (field?: string): boolean => {
    const newValidation = { ...goalValidation };
    let isFormValid = true;

    if (!field || field === "title") {
      if (!goalForm.title.trim()) {
        newValidation.title = { isValid: false, message: "Title is required" };
        isFormValid = false;
      } else if (goalForm.title.length < 3) {
        newValidation.title = {
          isValid: false,
          message: "Title must be at least 3 characters",
        };
        isFormValid = false;
      } else {
        newValidation.title = { isValid: true, message: "" };
      }
    }

    if (!field || field === "targetYear") {
      if (!goalForm.targetYear.trim()) {
        newValidation.targetYear = {
          isValid: false,
          message: "Target year is required",
        };
        isFormValid = false;
      } else if (
        Number.isNaN(Number(goalForm.targetYear)) ||
        Number(goalForm.targetYear) < new Date().getFullYear()
      ) {
        newValidation.targetYear = {
          isValid: false,
          message: "Enter a valid future year",
        };
        isFormValid = false;
      } else {
        newValidation.targetYear = { isValid: true, message: "" };
      }
    }

    if (!field || field === "targetValue") {
      if (!goalForm.targetValue.trim()) {
        newValidation.targetValue = {
          isValid: false,
          message: "Target value is required",
        };
        isFormValid = false;
      } else if (Number.isNaN(Number(goalForm.targetValue))) {
        newValidation.targetValue = {
          isValid: false,
          message: "Must be a number",
        };
        isFormValid = false;
      } else {
        newValidation.targetValue = { isValid: true, message: "" };
      }
    }

    if (!field || field === "currentValue") {
      if (!goalForm.currentValue.trim()) {
        newValidation.currentValue = {
          isValid: false,
          message: "Current value is required",
        };
        isFormValid = false;
      } else if (Number.isNaN(Number(goalForm.currentValue))) {
        newValidation.currentValue = {
          isValid: false,
          message: "Must be a number",
        };
        isFormValid = false;
      } else {
        newValidation.currentValue = { isValid: true, message: "" };
      }
    }

    if (!field || field === "unit") {
      if (!goalForm.unit.trim()) {
        newValidation.unit = { isValid: false, message: "Unit is required" };
        isFormValid = false;
      } else {
        newValidation.unit = { isValid: true, message: "" };
      }
    }

    if (!field || field === "description") {
      if (!goalForm.description.trim()) {
        newValidation.description = {
          isValid: false,
          message: "Description is required",
        };
        isFormValid = false;
      } else if (goalForm.description.length < 10) {
        newValidation.description = {
          isValid: false,
          message: "Description must be at least 10 characters",
        };
        isFormValid = false;
      } else {
        newValidation.description = { isValid: true, message: "" };
      }
    }

    if (!field || field === "category") {
      if (!goalForm.category.trim()) {
        newValidation.category = {
          isValid: false,
          message: "Category is required",
        };
        isFormValid = false;
      } else {
        newValidation.category = { isValid: true, message: "" };
      }
    }

    setGoalValidation(newValidation);
    return isFormValid;
  };

  const resetGoalForm = () => {
    setGoalForm({
      title: "",
      targetYear: "",
      targetValue: "",
      currentValue: "",
      unit: "",
      description: "",
      category: "",
      isActive: true,
      position: 1,
    });
    setGoalValidation({
      title: { isValid: true, message: "" },
      targetYear: { isValid: true, message: "" },
      targetValue: { isValid: true, message: "" },
      currentValue: { isValid: true, message: "" },
      unit: { isValid: true, message: "" },
      category: { isValid: true, message: "" },
      description: { isValid: true, message: "" },
    });
  };

  const handleGoalSubmit = () => {
    const isValidForm = validateGoalForm();
    if (!isValidForm) {
      return;
    }

    const transformedGoalData = {
      title: goalForm.title,
      targetYear: parseInt(goalForm.targetYear, 10),
      targetValue: goalForm.targetValue,
      currentValue: goalForm.currentValue,
      unit: goalForm.unit,
      description: goalForm.description,
      category: goalForm.category,
      isActive: goalForm.isActive,
      sortOrder: goalForm.position,
    };

    if (editingGoal) {
      updateGoalMutation.mutate(
        { id: editingGoal.id, data: transformedGoalData },
        {
          onSuccess: () => {
            setShowGoalDialog(false);
            setEditingGoal(null);
            resetGoalForm();
          },
        },
      );
    } else {
      createGoalMutation.mutate(transformedGoalData, {
        onSuccess: () => {
          setShowGoalDialog(false);
          resetGoalForm();
        },
      });
    }
  };

  const openGoalDialog = (goal?: SustainabilityGoal) => {
    if (goal) {
      setEditingGoal(goal);
      setGoalForm({
        title: goal.title || "",
        targetYear: goal.targetYear?.toString() || "",
        targetValue: goal.targetValue || "",
        currentValue: goal.currentValue || "",
        unit: goal.unit || "",
        description: goal.description || "",
        category: goal.category || "",
        isActive: goal.isActive ?? true,
        position: goal.sortOrder || 1,
      });
    } else {
      setEditingGoal(null);
      resetGoalForm();
    }
    setShowGoalDialog(true);
  };

  const handleOpenDialog = openGoalDialog;

  return (
    <>
      <TabsContent value="goals" className="outline-none">
        <Card className="glass-premium p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Mission Critical Goals
              </h2>
              <p className="text-sm text-[#68869A]">
                Define and track high-level sustainability targets and trajectories
              </p>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-[10px] tracking-widest h-11 px-6 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Plus className="mr-2 h-4 w-4" />
              Initialise Goal
            </Button>
          </div>

          {goals && goals.length > 0 ? (
            <div className="space-y-6">
              <DndContext sensors={sensors} collisionDetection={closestCenter}>
                <SortableContext
                  items={paginatedGoals.map((g) => g.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid gap-3">
                    {paginatedGoals.map((goal) => (
                      <SortableGoalItem
                        key={goal.id}
                        goal={goal}
                        onEdit={handleOpenDialog}
                        onDelete={(id) => deleteGoalMutation.mutate(id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {goalsTotalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <Pagination>
                    <PaginationContent className="bg-white/5 border border-white/10 rounded-xl p-1">
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => onSetGoalsPage(Math.max(1, goalsPage - 1))}
                          className={cn(
                            "rounded-lg text-[#68869A] hover:bg-white/10 hover:text-white",
                            goalsPage === 1 && "pointer-events-none opacity-30",
                          )}
                        />
                      </PaginationItem>
                      {[...Array(goalsTotalPages)].map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink
                            onClick={() => onSetGoalsPage(i + 1)}
                            isActive={goalsPage === i + 1}
                            className={cn(
                              "rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                              goalsPage === i + 1
                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                : "text-[#68869A] hover:bg-white/10",
                            )}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => onSetGoalsPage(Math.min(goalsTotalPages, goalsPage + 1))}
                          className={cn(
                            "rounded-lg text-[#68869A] hover:bg-white/10 hover:text-white",
                            goalsPage === goalsTotalPages && "pointer-events-none opacity-30",
                          )}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
              <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Target className="h-8 w-8 text-[#68869A]/40" />
              </div>
              <h3 className="text-white font-bold mb-1">No Objectives Identified</h3>
              <p className="text-[#68869A] text-sm max-w-[280px]">
                Strategic goals have not been initialised in the ecosystem.
              </p>
            </div>
          )}
        </Card>
      </TabsContent>

      {/* Goal Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent
          contentType="form"
          className="max-w-2xl bg-[#0A0A0A] border-white/10 p-0 overflow-hidden rounded-[32px] shadow-2xl ring-1 ring-white/10"
        >
          <DialogHeader className="p-8 pb-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <TargetIcon className="h-5 w-5" />
                </div>
                <DialogTitle className="text-xl font-bold text-white tracking-tight">
                  {editingGoal ? "Refine Objective" : "New Ecosystem Objective"}
                </DialogTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowGoalDialog(false)}
                className="rounded-full hover:bg-white/5 text-[#68869A]"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <DialogDescription className="text-[#68869A] ml-13">
              Configure strategic parameters for long-term sustainability trajectories.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="p-8 space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="goal-title"
                className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
              >
                Objective Title
              </Label>
              <Input
                id="goal-title"
                value={goalForm.title}
                onChange={(e) => {
                  setGoalForm((prev) => ({ ...prev, title: e.target.value }));
                  validateGoalForm("title");
                }}
                placeholder="e.g., Net Zero Operational Impact"
                className={cn(
                  "bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-emerald-500/50 placeholder:text-white/20",
                  !goalValidation.title.isValid && "border-red-500/50 bg-red-500/5",
                )}
              />
              {!goalValidation.title.isValid && (
                <p className="mt-1 text-red-400 text-[10px] font-bold uppercase tracking-widest ml-1">
                  {goalValidation.title.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="targetYear"
                  className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                >
                  Target Horizon (Year)
                </Label>
                <Input
                  id="targetYear"
                  type="number"
                  value={goalForm.targetYear}
                  onChange={(e) => {
                    setGoalForm((prev) => ({
                      ...prev,
                      targetYear: e.target.value,
                    }));
                    validateGoalForm("targetYear");
                  }}
                  placeholder="2030"
                  className={cn(
                    "bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-emerald-500/50 placeholder:text-white/20",
                    !goalValidation.targetYear.isValid && "border-red-500/50 bg-red-500/5",
                  )}
                />
                {!goalValidation.targetYear.isValid && (
                  <p className="mt-1 text-red-400 text-[10px] font-bold uppercase tracking-widest ml-1">
                    {goalValidation.targetYear.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="category"
                  className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                >
                  Sector Category
                </Label>
                <Input
                  id="category"
                  value={goalForm.category}
                  onChange={(e) => {
                    setGoalForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }));
                    validateGoalForm("category");
                  }}
                  placeholder="e.g., Carbon Sequestration"
                  className={cn(
                    "bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-emerald-500/50 placeholder:text-white/20",
                    !goalValidation.category.isValid && "border-red-500/50 bg-red-500/5",
                  )}
                />
                {!goalValidation.category.isValid && (
                  <p className="mt-1 text-red-400 text-[10px] font-bold uppercase tracking-widest ml-1">
                    {goalValidation.category.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="currentValue"
                  className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                >
                  Base value
                </Label>
                <Input
                  id="currentValue"
                  value={goalForm.currentValue}
                  onChange={(e) => {
                    setGoalForm((prev) => ({
                      ...prev,
                      currentValue: e.target.value,
                    }));
                    validateGoalForm("currentValue");
                  }}
                  placeholder="50"
                  className={cn(
                    "bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-emerald-500/50 placeholder:text-white/20",
                    !goalValidation.currentValue.isValid && "border-red-500/50 bg-red-500/5",
                  )}
                />
                {!goalValidation.currentValue.isValid && (
                  <p className="mt-1 text-red-400 text-[10px] font-bold uppercase tracking-widest ml-1">
                    {goalValidation.currentValue.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="targetValue"
                  className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                >
                  Terminal Value
                </Label>
                <Input
                  id="targetValue"
                  value={goalForm.targetValue}
                  onChange={(e) => {
                    setGoalForm((prev) => ({
                      ...prev,
                      targetValue: e.target.value,
                    }));
                    validateGoalForm("targetValue");
                  }}
                  placeholder="100"
                  className={cn(
                    "bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-emerald-500/50 placeholder:text-white/20",
                    !goalValidation.targetValue.isValid && "border-red-500/50 bg-red-500/5",
                  )}
                />
                {!goalValidation.targetValue.isValid && (
                  <p className="mt-1 text-red-400 text-[10px] font-bold uppercase tracking-widest ml-1">
                    {goalValidation.targetValue.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="unit"
                  className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                >
                  Measurement Unit
                </Label>
                <Input
                  id="unit"
                  value={goalForm.unit}
                  onChange={(e) => {
                    setGoalForm((prev) => ({
                      ...prev,
                      unit: e.target.value,
                    }));
                    validateGoalForm("unit");
                  }}
                  placeholder="e.g., metric tons"
                  className={cn(
                    "bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-emerald-500/50 placeholder:text-white/20",
                    !goalValidation.unit.isValid && "border-red-500/50 bg-red-500/5",
                  )}
                />
                {!goalValidation.unit.isValid && (
                  <p className="mt-1 text-red-400 text-[10px] font-bold uppercase tracking-widest ml-1">
                    {goalValidation.unit.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="goal-description"
                className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
              >
                Strategic Description
              </Label>
              <Textarea
                id="goal-description"
                value={goalForm.description}
                onChange={(e) => {
                  setGoalForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }));
                  validateGoalForm("description");
                }}
                placeholder="Elaborate on the strategic importance and execution roadmap..."
                rows={4}
                className={cn(
                  "bg-white/5 border-white/10 text-white rounded-xl min-h-[100px] focus:ring-emerald-500/50 placeholder:text-white/20 resize-none",
                  !goalValidation.description.isValid && "border-red-500/50 bg-red-500/5",
                )}
              />
              {!goalValidation.description.isValid && (
                <p className="mt-1 text-red-400 text-[10px] font-bold uppercase tracking-widest ml-1">
                  {goalValidation.description.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex flex-col gap-0.5">
                <Label
                  htmlFor="goal-active"
                  className="text-sm font-bold text-white tracking-tight"
                >
                  Active Protocol
                </Label>
                <p className="text-[10px] text-[#68869A] uppercase font-bold tracking-widest">
                  Visibility in Ecosystem Dashboards
                </p>
              </div>
              <Switch
                id="goal-active"
                checked={goalForm.isActive}
                onCheckedChange={(checked) =>
                  setGoalForm((prev) => ({ ...prev, isActive: checked }))
                }
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>
          </DialogBody>

          <DialogFooter className="p-8 pt-0 border-0 bg-transparent">
            <div className="flex w-full items-center justify-between gap-4">
              <Button
                variant="ghost"
                onClick={() => setShowGoalPreview(true)}
                className="h-12 px-6 rounded-xl text-[#68869A] hover:bg-white/5 font-bold uppercase text-[10px] tracking-widest"
              >
                <Eye className="mr-2 h-4 w-4" />
                Live Preview
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowGoalDialog(false)}
                  className="h-12 px-6 rounded-xl text-[#68869A] hover:bg-white/5 font-bold uppercase text-[10px] tracking-widest"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGoalSubmit}
                  disabled={createGoalMutation.isPending || updateGoalMutation.isPending}
                  className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all outline-none border-0"
                >
                  {createGoalMutation.isPending || updateGoalMutation.isPending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white mr-2" />
                  ) : editingGoal ? (
                    <Save className="h-4 w-4 mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {editingGoal ? "Sync Objective" : "Initialise Objective"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Goal Preview Modal */}
      <Dialog open={showGoalPreview} onOpenChange={setShowGoalPreview}>
        <DialogContent
          contentType="form"
          className="max-w-md bg-[#0A0A0A] border-white/10 p-0 overflow-hidden rounded-[32px] shadow-2xl ring-1 ring-white/10"
        >
          <DialogHeader className="p-8 pb-4">
            <div className="items-center gap-2 mb-2 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 inline-flex w-fit mx-auto">
              <LayoutTemplate className="h-4 w-4 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                Mobile Viewport Simulation
              </span>
            </div>
            <DialogTitle className="text-xl font-bold text-white tracking-tight text-center">
              Protocol Preview
            </DialogTitle>
          </DialogHeader>

          <div className="px-8 pb-8 flex justify-center">
            <div className="aspect-[9/16] w-full max-w-[280px] rounded-[32px] border-[8px] border-white/10 bg-black overflow-hidden relative shadow-2xl ring-1 ring-white/5 p-6">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-transparent to-black z-0" />

              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <TargetIcon className="h-5 w-5" />
                  </div>
                  <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                    Target: {goalForm.targetYear || "2030"}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white tracking-tight leading-tight">
                    {goalForm.title || "Carbon Neutrality Milestone"}
                  </h3>
                  <p className="text-[10px] text-white/50 leading-relaxed line-clamp-4">
                    {goalForm.description ||
                      "The future of sportswear is circular. Our objective is to reduce operational impact by 40% across all tier-1 facilities."}
                  </p>
                </div>

                <div className="pt-4 space-y-3">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">
                        Current Status
                      </span>
                      <span className="text-xl font-bold text-white tracking-tight">
                        {goalForm.currentValue || "42"}{" "}
                        <span className="text-xs font-normal text-white/40 ml-0.5 uppercase tracking-widest">
                          {goalForm.unit || "Metric Tons"}
                        </span>
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">
                        Objective
                      </span>
                      <span className="text-sm font-bold text-emerald-400">
                        {goalForm.targetValue || "100"}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] w-[42%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 border-0">
            <Button
              onClick={() => setShowGoalPreview(false)}
              className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-white/10"
            >
              Terminate Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
