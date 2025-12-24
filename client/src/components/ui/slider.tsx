"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import type * as React from "react";

import { cn } from "@/lib/utils";

const Slider = ({
	className,
	ref,
	...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
	ref?: React.Ref<React.ElementRef<typeof SliderPrimitive.Root>>;
}) => (
	<SliderPrimitive.Root
		ref={ref}
		className={cn(
			"relative flex w-full touch-none select-none items-center",
			className,
		)}
		{...props}
	/>
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
