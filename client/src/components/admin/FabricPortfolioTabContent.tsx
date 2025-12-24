import type { UnifiedSustainability } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface FabricPortfolioTabContentProps {
	localForm: Partial<UnifiedSustainability>;
	hasUnsavedChanges: boolean;
	isPending: boolean;
	onLocalUpdate: (updates: Partial<UnifiedSustainability>) => void;
	onSave: () => void;
}

export function FabricPortfolioTabContent({
	localForm,
	hasUnsavedChanges,
	isPending,
	onLocalUpdate,
	onSave,
}: FabricPortfolioTabContentProps) {
	return (
		<TabsContent value="fabric-portfolio" className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Fabric Portfolio Section</CardTitle>
					<CardDescription>
						Manage the title and description for the Fabric Portfolio section.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label htmlFor="fabricPortfolioTitle">Section Title</Label>
						<Input
							id="fabricPortfolioTitle"
							value={localForm.fabricPortfolioTitle || ""}
							onChange={(e) =>
								onLocalUpdate({ fabricPortfolioTitle: e.target.value })
							}
							placeholder="e.g., Our Sustainable Fabrics"
						/>
					</div>
					<div>
						<Label htmlFor="fabricPortfolioDescription">
							Section Description
						</Label>
						<Textarea
							id="fabricPortfolioDescription"
							value={localForm.fabricPortfolioDescription || ""}
							onChange={(e) =>
								onLocalUpdate({ fabricPortfolioDescription: e.target.value })
							}
							placeholder="Description for the fabric portfolio section"
							rows={3}
						/>
					</div>
				</CardContent>
				<div className="flex justify-end p-4 border-t">
					<Button
						onClick={onSave}
						disabled={!hasUnsavedChanges || isPending}
						className="bg-green-600 hover:bg-green-700"
					>
						{isPending ? "Saving..." : "Save Fabric Portfolio Section"}
					</Button>
				</div>
			</Card>
		</TabsContent>
	);
}
