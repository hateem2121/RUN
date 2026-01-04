"use client";

import {
  closestCenter,
  closestCorners,
  DndContext,
  type DndContextProps,
  type DragEndEvent,
  type DraggableSyntheticListeners,
  DragOverlay,
  type DropAnimation,
  defaultDropAnimationSideEffects,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  restrictToHorizontalAxis,
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  type SortableContextProps,
  type SortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Slot, type SlotProps } from "@radix-ui/react-slot";
import * as React from "react";
import * as ReactDOM from "react-dom";

import { cn } from "@/lib/utils";

const orientationConfig = {
  vertical: {
    modifiers: [restrictToVerticalAxis, restrictToParentElement],
    strategy: verticalListSortingStrategy,
    collisionDetection: closestCenter,
  },
  horizontal: {
    modifiers: [restrictToHorizontalAxis, restrictToParentElement],
    strategy: horizontalListSortingStrategy,
    collisionDetection: closestCenter,
  },
  mixed: {
    modifiers: [restrictToParentElement],
    strategy: undefined,
    collisionDetection: closestCorners,
  },
};

const ROOT_NAME = "Sortable";
const CONTENT_NAME = "SortableContent";
const ITEM_NAME = "SortableItem";
const ITEM_HANDLE_NAME = "SortableItemHandle";
const OVERLAY_NAME = "SortableOverlay";

const SORTABLE_ERROR = {
  [ROOT_NAME]: `${ROOT_NAME} components must be within ${ROOT_NAME}`,
  [CONTENT_NAME]: `${CONTENT_NAME} must be within ${ROOT_NAME}`,
  [ITEM_NAME]: `${ITEM_NAME} must be within ${CONTENT_NAME}`,
  [ITEM_HANDLE_NAME]: `${ITEM_HANDLE_NAME} must be within ${ITEM_NAME}`,
  [OVERLAY_NAME]: `${OVERLAY_NAME} must be within ${ROOT_NAME}`,
} as const;

type SortableNames = keyof typeof SORTABLE_ERROR;

interface SortableRootContextValue<T> {
  id: string;
  items: T[];
  modifiers: DndContextProps["modifiers"];
  strategy: SortableContextProps["strategy"];
  activeId: UniqueIdentifier | null;
  setActiveId: (id: UniqueIdentifier | null) => void;
  getItemValue: (item: T) => UniqueIdentifier;
  flatCursor: boolean;
}

const SortableRootContext = React.createContext<SortableRootContextValue<unknown> | null>(null);
SortableRootContext.displayName = ROOT_NAME;

function useSortableContext(name: SortableNames) {
  const context = React.useContext(SortableRootContext);
  if (!context) {
    throw new Error(SORTABLE_ERROR[name]);
  }
  return context;
}

interface GetItemValue<T> {
  /**
   * Callback that returns a unique identifier for each sortable item. Required for array of objects.
   * @example getItemValue={(item) => item.id}
   */
  getItemValue: (item: T) => UniqueIdentifier;
}

type SortableProps<T> = DndContextProps & {
  value: T[];
  onValueChange?: (items: T[]) => void;
  onMove?: (event: DragEndEvent) => void;
  strategy?: SortableContextProps["strategy"];
  orientation?: "vertical" | "horizontal" | "mixed";
  flatCursor?: boolean | undefined;
} & (T extends object ? GetItemValue<T> : Partial<GetItemValue<T>>);

function Sortable<T>(props: SortableProps<T>) {
  const {
    id = React.useId(),
    value,
    onValueChange,
    collisionDetection,
    modifiers,
    strategy,
    sensors: sensorsProp,
    onMove,
    orientation = "vertical",
    flatCursor = false,
    getItemValue: getItemValueProp,
    accessibility,
    ...sortableProps
  } = props;
  const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const config = React.useMemo(() => orientationConfig[orientation], [orientation]);
  const getItemValue = React.useCallback(
    (item: T): UniqueIdentifier => {
      if (typeof item === "object" && !getItemValueProp) {
        throw new Error("getItemValue is required when using array of objects.");
      }
      return getItemValueProp ? getItemValueProp(item) : (item as UniqueIdentifier);
    },
    [getItemValueProp],
  );

  const onDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over?.id) {
        const activeIndex = value.findIndex((item) => getItemValue(item) === active.id);
        const overIndex = value.findIndex((item) => getItemValue(item) === over.id);

        if (onMove) {
          onMove(event);
        } else {
          onValueChange?.(arrayMove(value, activeIndex, overIndex));
        }
      }
      setActiveId(null);
    },
    [value, onValueChange, onMove, getItemValue],
  );

  const contextValue = React.useMemo(
    () => ({
      id,
      items: value,
      modifiers: modifiers ?? config.modifiers,
      strategy: strategy ?? config.strategy,
      activeId,
      setActiveId,
      getItemValue,
      flatCursor,
    }),
    [
      id,
      value,
      modifiers,
      strategy,
      config.modifiers,
      config.strategy,
      activeId,
      getItemValue,
      flatCursor,
    ],
  );

  return (
    <SortableRootContext.Provider value={contextValue as SortableRootContextValue<unknown>}>
      <DndContext
        id={id}
        autoScroll={false as any}
        cancelDrop={undefined as any}
        measuring={undefined as any}
        onDragAbort={() => {}}
        onDragPending={() => {}}
        onDragMove={() => {}}
        onDragOver={() => {}}
        {...((modifiers ?? config.modifiers) ? { modifiers: modifiers ?? config.modifiers } : {})}
        {...((sensorsProp ?? sensors) ? { sensors: sensorsProp ?? sensors } : {})}
        {...((collisionDetection ?? config.collisionDetection)
          ? {
              collisionDetection: collisionDetection ?? config.collisionDetection,
            }
          : {})}
        onDragStart={({ active }) => setActiveId(active.id)}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
        accessibility={{
          announcements: {
            onDragStart({ active }) {
              const activeValue = active.id.toString();
              return `Grabbed sortable item "${activeValue}". Current position is ${
                active.data.current?.sortable.index + 1
              } of ${value.length}. Use arrow keys to move, space to drop.`;
            },
            onDragOver({ active, over }) {
              if (over) {
                const overIndex = over.data.current?.sortable.index ?? 0;
                const activeIndex = active.data.current?.sortable.index ?? 0;
                const moveDirection = overIndex > activeIndex ? "down" : "up";
                const activeValue = active.id.toString();
                return `Sortable item "${activeValue}" moved ${moveDirection} to position ${
                  overIndex + 1
                } of ${value.length}.`;
              }
              return "Sortable item is no longer over a droppable area. Press escape to cancel.";
            },
            onDragEnd({ active, over }) {
              const activeValue = active.id.toString();
              if (over) {
                const overIndex = over.data.current?.sortable.index ?? 0;
                return `Sortable item "${activeValue}" dropped at position ${
                  overIndex + 1
                } of ${value.length}.`;
              }
              return `Sortable item "${activeValue}" dropped. No changes were made.`;
            },
            onDragCancel({ active }) {
              const activeIndex = active.data.current?.sortable.index ?? 0;
              const activeValue = active.id.toString();
              return `Sorting cancelled. Sortable item "${activeValue}" returned to position ${
                activeIndex + 1
              } of ${value.length}.`;
            },
            ...accessibility?.announcements,
          },
          ...accessibility,
        }}
        {...sortableProps}
      />
    </SortableRootContext.Provider>
  );
}

const SortableContentContext = React.createContext<boolean>(false);
SortableContentContext.displayName = CONTENT_NAME;

interface SortableContentProps extends SlotProps {
  strategy?: SortableContextProps["strategy"];
  children: React.ReactNode;
  asChild?: boolean | undefined;
  ref?: React.Ref<HTMLDivElement>;
}

// Add useComposedRefs utility function
function useComposedRefs<T>(...refs: (React.Ref<T> | undefined)[]): React.RefCallback<T> {
  return React.useCallback(
    (node: T) => {
      refs.forEach((ref) => {
        if (typeof ref === "function") {
          ref(node);
        } else if (ref && typeof ref === "object") {
          (ref as React.MutableRefObject<T>).current = node;
        }
      });
    },
    [refs],
  );
}

const SortableContent = ({
  strategy: strategyProp,
  asChild,
  ref,
  ...contentProps
}: SortableContentProps & {
  ref?: React.Ref<HTMLDivElement>;
}) => {
  const context = useSortableContext(CONTENT_NAME);

  const items = React.useMemo(() => {
    return context.items.map((item) => context.getItemValue(item));
  }, [context.items, context.getItemValue]);

  const ContentSlot = asChild ? Slot : "div";

  return (
    <SortableContentContext.Provider value={true}>
      <SortableContext
        items={items}
        {...((strategyProp ?? context.strategy)
          ? { strategy: (strategyProp ?? context.strategy) as SortingStrategy }
          : {})}
      >
        <ContentSlot {...contentProps} ref={ref} />
      </SortableContext>
    </SortableContentContext.Provider>
  );
};
SortableContent.displayName = CONTENT_NAME;

interface SortableItemContextValue {
  id: string;
  attributes: React.HTMLAttributes<HTMLElement>;
  listeners: DraggableSyntheticListeners | undefined;
  setActivatorNodeRef: (node: HTMLElement | null) => void;
  isDragging?: boolean | undefined;
  disabled?: boolean | undefined;
}

const SortableItemContext = React.createContext<SortableItemContextValue>({
  id: "",
  attributes: {},
  listeners: undefined,
  setActivatorNodeRef: () => {},
  isDragging: false,
});
SortableItemContext.displayName = ITEM_NAME;

interface SortableItemProps extends SlotProps {
  value: UniqueIdentifier;
  asHandle?: boolean | undefined;
  asChild?: boolean | undefined;
  disabled?: boolean | undefined;
  ref?: React.Ref<HTMLDivElement>;
}

const SortableOverlayContext = React.createContext(false);
SortableOverlayContext.displayName = OVERLAY_NAME;

const SortableItem = ({
  value,
  style,
  asHandle,
  asChild,
  disabled,
  className,
  ref: forwardedRef,
  ...itemProps
}: SortableItemProps & {
  ref?: React.Ref<HTMLDivElement>;
}) => {
  const inSortableContent = React.useContext(SortableContentContext);
  const inSortableOverlay = React.useContext(SortableOverlayContext);

  if (!inSortableContent && !inSortableOverlay) {
    throw new Error(SORTABLE_ERROR[ITEM_NAME]);
  }

  if (value === "") {
    throw new Error(`${ITEM_NAME} value cannot be an empty string.`);
  }

  const context = useSortableContext(ITEM_NAME);
  const id = React.useId();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: value,
    ...(disabled !== undefined ? { disabled } : {}),
  });

  const composedRef = useComposedRefs(forwardedRef, (node) => {
    if (disabled) return;
    setNodeRef(node);
    if (asHandle) setActivatorNodeRef(node);
  });

  const composedStyle = React.useMemo<React.CSSProperties>(() => {
    return {
      transform: CSS.Translate.toString(transform),
      transition,
      ...style,
    };
  }, [transform, transition, style]);

  const itemContext = React.useMemo<SortableItemContextValue>(
    () => ({
      id,
      attributes,
      listeners,
      setActivatorNodeRef,
      isDragging,
      disabled,
    }),
    [id, attributes, listeners, setActivatorNodeRef, isDragging, disabled],
  );

  const ItemSlot = asChild ? Slot : "div";

  return (
    <SortableItemContext.Provider value={itemContext}>
      <ItemSlot
        id={id}
        data-dragging={isDragging ? "" : undefined}
        {...itemProps}
        {...(asHandle ? attributes : {})}
        {...(asHandle ? listeners : {})}
        tabIndex={disabled ? undefined : 0}
        ref={composedRef}
        style={composedStyle}
        className={cn(
          "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
          {
            "touch-none select-none": asHandle,
            "cursor-default": context.flatCursor,
            "data-[dragging]:cursor-grabbing": !context.flatCursor,
            "cursor-grab": !isDragging && asHandle && !context.flatCursor,
            "opacity-50": isDragging,
            "pointer-events-none opacity-50": disabled,
          },
          className,
        )}
      />
    </SortableItemContext.Provider>
  );
};
SortableItem.displayName = ITEM_NAME;

interface SortableItemHandleProps extends React.ComponentPropsWithoutRef<"button"> {
  asChild?: boolean | undefined;
  ref?: React.Ref<HTMLButtonElement>;
}

const SortableItemHandle = ({
  asChild,
  disabled,
  className,
  ref: forwardedRef,
  ...dragHandleProps
}: SortableItemHandleProps & {
  ref?: React.Ref<HTMLButtonElement>;
}) => {
  const itemContext = React.useContext(SortableItemContext);
  if (!itemContext) {
    throw new Error(SORTABLE_ERROR[ITEM_HANDLE_NAME]);
  }
  const context = useSortableContext(ITEM_HANDLE_NAME);

  const isDisabled = disabled ?? itemContext.disabled;

  const composedRef = useComposedRefs(forwardedRef, (node) => {
    if (isDisabled) return;
    itemContext.setActivatorNodeRef(node);
  });

  const HandleSlot = asChild ? Slot : "button";

  return (
    <HandleSlot
      aria-controls={itemContext.id}
      aria-roledescription="sortable item handle"
      data-dragging={itemContext.isDragging ? "" : undefined}
      {...dragHandleProps}
      {...itemContext.attributes}
      {...itemContext.listeners}
      ref={composedRef}
      className={cn(
        "select-none disabled:pointer-events-none disabled:opacity-50",
        context.flatCursor ? "cursor-default" : "cursor-grab data-[dragging]:cursor-grabbing",
        className,
      )}
      disabled={isDisabled}
    />
  );
};
SortableItemHandle.displayName = ITEM_HANDLE_NAME;

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.4",
      },
    },
  }),
};

interface SortableOverlayProps
  extends Omit<React.ComponentPropsWithoutRef<typeof DragOverlay>, "children"> {
  container?: HTMLElement | DocumentFragment | null;
  children?: ((params: { value: UniqueIdentifier }) => React.ReactNode) | React.ReactNode;
}

function SortableOverlay(props: SortableOverlayProps) {
  const { container: containerProp, children, ...overlayProps } = props;
  const context = useSortableContext(OVERLAY_NAME);

  const [mounted, setMounted] = React.useState(false);
  React.useLayoutEffect(() => setMounted(true), []);

  const container = containerProp ?? (mounted ? globalThis.document?.body : null);

  if (!container) return null;

  return ReactDOM.createPortal(
    <DragOverlay
      {...(context.modifiers ? { modifiers: context.modifiers } : {})}
      dropAnimation={dropAnimation}
      {...overlayProps}
    >
      <SortableOverlayContext.Provider value={true}>
        {typeof children === "function" ? children({ value: context.activeId! }) : children}
      </SortableOverlayContext.Provider>
    </DragOverlay>,
    container,
  );
}
SortableOverlay.displayName = OVERLAY_NAME;

export { Sortable, SortableContent, SortableItem, SortableItemHandle, SortableOverlay };
