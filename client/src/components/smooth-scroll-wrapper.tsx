// DISABLED: Smooth scroll wrapper causing Visual Editor issues
interface SmoothScrollWrapperProps {
	children: React.ReactNode;
}

export function SmoothScrollWrapper({ children }: SmoothScrollWrapperProps) {
	// Return children without any scroll or animation interference
	return <>{children}</>;
}
