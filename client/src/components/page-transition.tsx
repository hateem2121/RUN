import { AnimatePresence, motion } from "framer-motion";
import { useConcurrentLocation } from "../hooks/useConcurrentLocation";

interface PageTransitionProps {
	children: React.ReactNode;
}
// ... variants ...
const pageVariants = {
	initial: {
		opacity: 0,
	},
	in: {
		opacity: 1,
	},
	out: {
		opacity: 0,
	},
};

const pageTransition = {
	type: "tween",
	ease: "anticipate",
	duration: 0.4,
} as any;

export function PageTransition({ children }: PageTransitionProps) {
	const [location] = useConcurrentLocation();

	return (
		<AnimatePresence mode="wait">
			<motion.div
				key={location}
				initial="initial"
				animate="in"
				exit="out"
				variants={pageVariants}
				transition={pageTransition}
			>
				{children}
			</motion.div>
		</AnimatePresence>
	);
}
