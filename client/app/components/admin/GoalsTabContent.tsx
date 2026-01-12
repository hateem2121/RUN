import { closestCenter, DndContext } from "@dnd-kit/core";
import type { SensorDescriptor } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { InsertSustainabilityGoal, SustainabilityGoal } from "@shared/schema";
import type { UseMutationResult } from "@tanstack/react-query";
import { Eye, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  createGoalMutation: UseMutationResult<unknown, unknown, InsertSustainabilityGoal>;
  updateGoalMutation: UseMutationResult<unknown, unknown, { id: number; data: InsertSustainabilityGoal }>;
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
    if (!isValidForm) return;

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
      <TabsContent value="goals" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sustainability Goals</CardTitle>
                <CardDescription>
                  Manage your sustainability targets and track progress
                </CardDescription>
              </div>
              <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Goal
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {goals && goals.length > 0 ? (
              <>
                <DndContext sensors={sensors} collisionDetection={closestCenter}>
                  <SortableContext
                    items={paginatedGoals.map((g) => g.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {paginatedGoals.map((goal) => (
                      <SortableGoalItem
                        key={goal.id}
                        goal={goal}
                        onEdit={handleOpenDialog}
                        onDelete={(id) => deleteGoalMutation.mutate(id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
                {goalsTotalPages > 1 && (
                  <div className="mt-6 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => onSetGoalsPage(Math.max(1, goalsPage - 1))}
                            className={
                              goalsPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                        {[...Array(goalsTotalPages)].map((_, i) => (
                          <PaginationItem key={i}>
                            <PaginationLink
                              onClick={() => onSetGoalsPage(i + 1)}
                              isActive={goalsPage === i + 1}
                              className="cursor-pointer"
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => onSetGoalsPage(Math.min(goalsTotalPages, goalsPage + 1))}
                            className={
                              goalsPage === goalsTotalPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No goals yet. Create your first sustainability goal.
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Goal Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent contentType="form">
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Edit Goal" : "Add New Goal"}</DialogTitle>
            <DialogDescription>
              {editingGoal
                ? "Update the sustainability goal details"
                : "Create a new sustainability goal"}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div>
                <Label htmlFor="goal-title">Title</Label>
                <Input
                  id="goal-title"
                  value={goalForm.title}
                  onChange={(e) => {
                    setGoalForm((prev) => ({ ...prev, title: e.target.value }));
                    validateGoalForm("title");
                  }}
                  placeholder="e.g., Reduce Carbon Emissions"
                  className={!goalValidation.title.isValid ? "border-red-500" : ""}
                />
                {!goalValidation.title.isValid && (
                  <p className="mt-1 text-red-500 text-sm">{goalValidation.title.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetYear">Target Year</Label>
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
                    className={!goalValidation.targetYear.isValid ? "border-red-500" : ""}
                  />
                  {!goalValidation.targetYear.isValid && (
                    <p className="mt-1 text-red-500 text-sm">{goalValidation.targetYear.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
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
                    placeholder="e.g., Carbon Reduction"
                    className={!goalValidation.category.isValid ? "border-red-500" : ""}
                  />
                  {!goalValidation.category.isValid && (
                    <p className="mt-1 text-red-500 text-sm">{goalValidation.category.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="currentValue">Current Value</Label>
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
                    className={!goalValidation.currentValue.isValid ? "border-red-500" : ""}
                  />
                  {!goalValidation.currentValue.isValid && (
                    <p className="mt-1 text-red-500 text-sm">
                      {goalValidation.currentValue.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="targetValue">Target Value</Label>
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
                    className={!goalValidation.targetValue.isValid ? "border-red-500" : ""}
                  />
                  {!goalValidation.targetValue.isValid && (
                    <p className="mt-1 text-red-500 text-sm">
                      {goalValidation.targetValue.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
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
                    placeholder="tonnes CO2"
                    className={!goalValidation.unit.isValid ? "border-red-500" : ""}
                  />
                  {!goalValidation.unit.isValid && (
                    <p className="mt-1 text-red-500 text-sm">{goalValidation.unit.message}</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="goal-description">Description</Label>
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
                  placeholder="Describe this goal and how it will be achieved..."
                  rows={3}
                  className={!goalValidation.description.isValid ? "border-red-500" : ""}
                />
                {!goalValidation.description.isValid && (
                  <p className="mt-1 text-red-500 text-sm">{goalValidation.description.message}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="goal-active"
                  checked={goalForm.isActive}
                  onCheckedChange={(checked) =>
                    setGoalForm((prev) => ({ ...prev, isActive: checked }))
                  }
                />
                <Label htmlFor="goal-active">Active</Label>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <div className="flex w-full justify-between">
              <Button variant="secondary" onClick={() => setShowGoalPreview(true)}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowGoalDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleGoalSubmit}
                  disabled={createGoalMutation.isPending || updateGoalMutation.isPending}
                >
                  {editingGoal ? "Update" : "Create"} Goal
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Goal Preview Modal */}
      <Dialog open={showGoalPreview} onOpenChange={setShowGoalPreview}>
        <DialogContent contentType="form">
          <DialogHeader>
            <DialogTitle>Goal Preview</DialogTitle>
            <DialogDescription>
              This is how your goal will appear on the sustainability page
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border-2 border-border border-dashed bg-background p-6">
            <div className="rounded-xl bg-white p-6 shadow-lg">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded bg-muted px-2 py-1 font-medium text-muted-foreground text-sm">
                  {goalForm.category || "Category"}
                </span>
                <span className="rounded bg-blue-50 px-2 py-1 font-medium text-blue-600 text-sm">
                  Target: {goalForm.targetYear || "2030"}
                </span>
              </div>
              <h3 className="mb-3 font-semibold text-foreground text-lg">
                {goalForm.title || "Goal Title"}
              </h3>
              <p className="mb-4 text-foreground/80 text-sm">
                {goalForm.description || "Goal description..."}
              </p>
              <div className="rounded-lg bg-linear-to-r from-blue-50 to-purple-50 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Current:</span>
                    <span className="ml-2 text-foreground">
                      {goalForm.currentValue || "0"} {goalForm.unit || "units"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Target:</span>
                    <span className="ml-2 font-medium text-purple-600">
                      {goalForm.targetValue || "100"} {goalForm.unit || "units"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoalPreview(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
