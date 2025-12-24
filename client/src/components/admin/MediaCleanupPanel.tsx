import {
	AlertTriangle,
	CheckCircle,
	Clock,
	Database,
	FileX,
	HardDrive,
	Link2Off,
	RefreshCw,
	Trash2,
} from "lucide-react";
import { useState } from "react";
// import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";

interface CleanupReport {
	timestamp: string;
	orphanedFiles: string[];
	brokenReferences: number[];
	cleanedFiles: string[];
	cleanedReferences: number[];
	totalFilesScanned: number;
	totalReferencesChecked: number;
	spaceSaved: number;
	errors: string[];
}

export function MediaCleanupPanel() {
	const [isScanning, setIsScanning] = useState(false);
	const [isCleaning, setIsCleaning] = useState(false);
	const [autoClean, setAutoClean] = useState(false);
	const [lastReport, setLastReport] = useState<CleanupReport | null>(null);
	const [cleanupStatus, setCleanupStatus] = useState<
		"idle" | "scanning" | "cleaning" | "complete" | "error"
	>("idle");

	const handleScan = async () => {
		setIsScanning(true);
		setCleanupStatus("scanning");

		try {
			const response = await apiRequest("/api/admin/cleanup/trigger", {
				method: "POST",
				body: { autoClean: false },
			});

			if (response.success) {
				setLastReport(response.report);
				setCleanupStatus("complete");
			} else {
				setCleanupStatus("error");
			}
		} catch (error) {
			setCleanupStatus("error");
		} finally {
			setIsScanning(false);
		}
	};

	const handleCleanup = async () => {
		setIsCleaning(true);
		setCleanupStatus("cleaning");

		try {
			const response = await apiRequest("/api/admin/cleanup/trigger", {
				method: "POST",
				body: { autoClean: true },
			});

			if (response.success) {
				setLastReport(response.report);
				setCleanupStatus("complete");
			} else {
				setCleanupStatus("error");
			}
		} catch (error) {
			setCleanupStatus("error");
		} finally {
			setIsCleaning(false);
		}
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / k ** i).toFixed(1)) + " " + sizes[i];
	};

	const formatTimestamp = (timestamp: string) => {
		return new Date(timestamp).toLocaleString();
	};

	return (
		<div className="space-y-6">
			{/* Control Panel */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Trash2 className="w-5 h-5" />
						Media Cleanup System
					</CardTitle>
					<CardDescription>
						Scan for orphaned files and broken references in the media library.
						This helps maintain system efficiency and free up storage space.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center space-x-2">
						<Switch
							id="auto-clean"
							checked={autoClean}
							onCheckedChange={setAutoClean}
						/>
						<Label htmlFor="auto-clean">
							Automatically clean issues when found (use with caution)
						</Label>
					</div>

					<Separator />

					<div className="flex gap-3">
						<Button
							onClick={handleScan}
							disabled={isScanning || isCleaning}
							className="flex items-center gap-2"
						>
							{isScanning ? (
								<RefreshCw className="w-4 h-4 animate-spin" />
							) : (
								<Database className="w-4 h-4" />
							)}
							{isScanning ? "Scanning..." : "Scan for Issues"}
						</Button>

						{lastReport &&
							lastReport.orphanedFiles.length +
								lastReport.brokenReferences.length >
								0 && (
								<Button
									onClick={handleCleanup}
									disabled={isScanning || isCleaning}
									variant="destructive"
									className="flex items-center gap-2"
								>
									{isCleaning ? (
										<RefreshCw className="w-4 h-4 animate-spin" />
									) : (
										<Trash2 className="w-4 h-4" />
									)}
									{isCleaning ? "Cleaning..." : "Clean Issues"}
								</Button>
							)}
					</div>

					{/* Status Indicator */}
					{cleanupStatus !== "idle" && (
						<Alert
							className={
								cleanupStatus === "error"
									? "border-red-200 bg-red-50"
									: cleanupStatus === "complete"
										? "border-green-200 bg-green-50"
										: "border-blue-200 bg-blue-50"
							}
						>
							<div className="flex items-center gap-2">
								{cleanupStatus === "error" && (
									<AlertTriangle className="w-4 h-4 text-red-500" />
								)}
								{cleanupStatus === "complete" && (
									<CheckCircle className="w-4 h-4 text-green-500" />
								)}
								{(cleanupStatus === "scanning" ||
									cleanupStatus === "cleaning") && (
									<Clock className="w-4 h-4 text-blue-500" />
								)}

								<AlertDescription className="text-sm">
									{cleanupStatus === "scanning" &&
										"Scanning media library for issues..."}
									{cleanupStatus === "cleaning" &&
										"Cleaning up detected issues..."}
									{cleanupStatus === "complete" &&
										"Cleanup operation completed successfully"}
									{cleanupStatus === "error" &&
										"An error occurred during the cleanup operation"}
								</AlertDescription>
							</div>
						</Alert>
					)}
				</CardContent>
			</Card>

			{/* Results Panel */}
			{lastReport && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<HardDrive className="w-5 h-5" />
							Cleanup Report
						</CardTitle>
						<CardDescription>
							Last scan: {formatTimestamp(lastReport.timestamp)}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Summary Stats */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
								<div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
									{lastReport.totalFilesScanned}
								</div>
								<div className="text-sm text-gray-600 dark:text-gray-400">
									Files Scanned
								</div>
							</div>

							<div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
								<div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
									{lastReport.orphanedFiles.length}
								</div>
								<div className="text-sm text-gray-600 dark:text-gray-400">
									Orphaned Files
								</div>
							</div>

							<div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
								<div className="text-2xl font-bold text-red-600 dark:text-red-400">
									{lastReport.brokenReferences.length}
								</div>
								<div className="text-sm text-gray-600 dark:text-gray-400">
									Broken References
								</div>
							</div>

							<div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
								<div className="text-2xl font-bold text-green-600 dark:text-green-400">
									{formatFileSize(lastReport.spaceSaved)}
								</div>
								<div className="text-sm text-gray-600 dark:text-gray-400">
									Space Saved
								</div>
							</div>
						</div>

						{/* Issues Found */}
						{(lastReport.orphanedFiles.length > 0 ||
							lastReport.brokenReferences.length > 0) && (
							<div className="space-y-4">
								<Separator />
								<div className="grid md:grid-cols-2 gap-4">
									{/* Orphaned Files */}
									{lastReport.orphanedFiles.length > 0 && (
										<div className="space-y-2">
											<div className="flex items-center gap-2">
												<FileX className="w-4 h-4 text-orange-500" />
												<h4 className="font-semibold">Orphaned Files</h4>
												<Badge
													variant="outline"
													className="text-orange-600 border-orange-600"
												>
													{lastReport.orphanedFiles.length}
												</Badge>
											</div>
											<div className="max-h-32 overflow-y-auto space-y-1 text-sm text-gray-600 dark:text-gray-400">
												{lastReport.orphanedFiles
													.slice(0, 5)
													.map((file, index) => (
														<div key={index} className="truncate">
															• {file}
														</div>
													))}
												{lastReport.orphanedFiles.length > 5 && (
													<div className="text-xs text-gray-500">
														... and {lastReport.orphanedFiles.length - 5} more
													</div>
												)}
											</div>
										</div>
									)}

									{/* Broken References */}
									{lastReport.brokenReferences.length > 0 && (
										<div className="space-y-2">
											<div className="flex items-center gap-2">
												<Link2Off className="w-4 h-4 text-red-500" />
												<h4 className="font-semibold">Broken References</h4>
												<Badge
													variant="outline"
													className="text-red-600 border-red-600"
												>
													{lastReport.brokenReferences.length}
												</Badge>
											</div>
											<div className="max-h-32 overflow-y-auto space-y-1 text-sm text-gray-600 dark:text-gray-400">
												{lastReport.brokenReferences
													.slice(0, 5)
													.map((id, index) => (
														<div key={index}>• Asset ID: {id}</div>
													))}
												{lastReport.brokenReferences.length > 5 && (
													<div className="text-xs text-gray-500">
														... and {lastReport.brokenReferences.length - 5}{" "}
														more
													</div>
												)}
											</div>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Clean Status */}
						{lastReport.orphanedFiles.length === 0 &&
							lastReport.brokenReferences.length === 0 && (
								<Alert className="border-green-200 bg-green-50">
									<CheckCircle className="w-4 h-4 text-green-500" />
									<AlertDescription>
										No issues found! Your media library is clean and optimized.
									</AlertDescription>
								</Alert>
							)}

						{/* Errors */}
						{lastReport.errors.length > 0 && (
							<Alert className="border-red-200 bg-red-50">
								<AlertTriangle className="w-4 h-4 text-red-500" />
								<AlertDescription>
									<div className="font-semibold">Errors during cleanup:</div>
									<div className="mt-1 space-y-1 text-sm">
										{lastReport.errors.map((error, index) => (
											<div key={index}>• {error}</div>
										))}
									</div>
								</AlertDescription>
							</Alert>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
