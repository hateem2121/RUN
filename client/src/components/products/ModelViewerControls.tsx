import {
	Camera,
	Download,
	Layers3,
	Maximize,
	Move,
	RotateCw,
	ZoomIn,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface ModelViewerControlsProps {
	modelViewerRef: React.RefObject<any>;
	productName: string;
	cameraPositions?: Array<{
		name: string;
		orbit: string;
		target?: string;
		fieldOfView?: string;
	}>;
	className?: string;
}

export function ModelViewerControls({
	modelViewerRef,
	productName,
	cameraPositions = [],
	className,
}: ModelViewerControlsProps) {
	const [isAutoRotating, setIsAutoRotating] = useState(true);
	const [zoomLevel, setZoomLevel] = useState(50);
	const [showAnnotations, setShowAnnotations] = useState(true);

	// Default camera positions if none provided
	const defaultPositions = [
		{ name: "Front", orbit: "0deg 75deg 105%" },
		{ name: "Back", orbit: "180deg 75deg 105%" },
		{ name: "Left", orbit: "90deg 75deg 105%" },
		{ name: "Right", orbit: "-90deg 75deg 105%" },
		{ name: "Top", orbit: "0deg 0deg 105%" },
		{ name: "Detail", orbit: "45deg 55deg 50%" },
	];

	const positions =
		cameraPositions.length > 0 ? cameraPositions : defaultPositions;

	useEffect(() => {
		if (modelViewerRef.current) {
			modelViewerRef.current.autoRotate = isAutoRotating;
		}
	}, [isAutoRotating, modelViewerRef]);

	useEffect(() => {
		if (modelViewerRef.current) {
			const camera = modelViewerRef.current.getCameraOrbit();
			const radius = camera.radius;
			const newRadius = radius * (zoomLevel / 50);
			modelViewerRef.current.cameraOrbit = `${camera.theta}rad ${camera.phi}rad ${newRadius}m`;
		}
	}, [zoomLevel, modelViewerRef]);

	const setCameraPosition = (position: (typeof positions)[0]) => {
		if (modelViewerRef.current) {
			modelViewerRef.current.cameraOrbit = position.orbit;
			if ("target" in position && position.target) {
				modelViewerRef.current.cameraTarget = position.target;
			}
			if ("fieldOfView" in position && position.fieldOfView) {
				modelViewerRef.current.fieldOfView = position.fieldOfView;
			}
			setIsAutoRotating(false);
		}
	};

	const resetCamera = () => {
		if (modelViewerRef.current) {
			modelViewerRef.current.resetTurntableRotation();
			modelViewerRef.current.jumpCameraToGoal();
			setZoomLevel(50);
			setIsAutoRotating(true);
		}
	};

	const downloadScreenshot = async () => {
		if (modelViewerRef.current) {
			try {
				const blob = await modelViewerRef.current.toBlob({ idealAspect: true });
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `${productName.replace(/\s+/g, "-").toLowerCase()}-3d-view.png`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			} catch (error) {}
		}
	};

	const toggleFullscreen = () => {
		if (modelViewerRef.current) {
			if (document.fullscreenElement) {
				document.exitFullscreen();
			} else {
				modelViewerRef.current.requestFullscreen();
			}
		}
	};

	const toggleAnnotations = () => {
		if (modelViewerRef.current) {
			const annotations =
				modelViewerRef.current.querySelectorAll('[slot^="hotspot"]');
			annotations.forEach((annotation: HTMLElement) => {
				annotation.style.display = showAnnotations ? "none" : "block";
			});
			setShowAnnotations(!showAnnotations);
		}
	};

	return (
		<div
			className={cn(
				"bg-white/95 rounded-lg shadow-lg p-4 space-y-4",
				className,
			)}
		>
			{/* Camera Presets */}
			<div>
				<h3 className="text-sm font-medium mb-2 flex items-center gap-2">
					<Camera className="w-4 h-4" />
					Camera Views
				</h3>
				<div className="grid grid-cols-3 gap-2">
					{positions.map((position) => (
						<Button
							key={position.name}
							variant="outline"
							size="sm"
							onClick={() => setCameraPosition(position)}
							className="text-xs"
						>
							{position.name}
						</Button>
					))}
				</div>
			</div>

			{/* Zoom Control */}
			<div>
				<h3 className="text-sm font-medium mb-2 flex items-center gap-2">
					<ZoomIn className="w-4 h-4" />
					Zoom Level
				</h3>
				<Slider
					value={[zoomLevel]}
					onValueChange={([value]) => setZoomLevel(value!)}
					min={10}
					max={200}
					step={10}
					className="w-full"
				/>
			</div>

			{/* Control Buttons */}
			<div className="grid grid-cols-2 gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={() => setIsAutoRotating(!isAutoRotating)}
					className={cn(isAutoRotating && "bg-blue-50 border-blue-300")}
				>
					<RotateCw
						className={cn("w-4 h-4 mr-1", isAutoRotating && "animate-spin")}
					/>
					{isAutoRotating ? "Stop" : "Auto"} Rotate
				</Button>

				<Button variant="outline" size="sm" onClick={resetCamera}>
					<Move className="w-4 h-4 mr-1" />
					Reset View
				</Button>

				<Button
					variant="outline"
					size="sm"
					onClick={toggleAnnotations}
					className={cn(showAnnotations && "bg-blue-50 border-blue-300")}
				>
					<Layers3 className="w-4 h-4 mr-1" />
					{showAnnotations ? "Hide" : "Show"} Labels
				</Button>

				<Button variant="outline" size="sm" onClick={downloadScreenshot}>
					<Download className="w-4 h-4 mr-1" />
					Screenshot
				</Button>
			</div>

			{/* Fullscreen Button */}
			<Button
				variant="default"
				size="sm"
				onClick={toggleFullscreen}
				className="w-full"
			>
				<Maximize className="w-4 h-4 mr-1" />
				Fullscreen View
			</Button>

			{/* Instructions */}
			<div className="text-xs text-gray-500 space-y-1">
				<p>• Drag to rotate • Scroll to zoom</p>
				<p>• Double-click to reset</p>
			</div>
		</div>
	);
}
