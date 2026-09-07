import { Factory, Layers, Moon, Package, Send, Shirt, Sparkles, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useQuoteStore } from "@/stores/useQuoteStore";

interface NavCommandSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NavCommandSearch({ open, onOpenChange }: NavCommandSearchProps) {
  const navigate = useNavigate();
  const { setTheme, resolvedTheme } = useTheme();
  const openDrawer = useQuoteStore((state) => state.openDrawer);

  // Global Cmd+K / Ctrl+K keyboard shortcut - stable ref avoids re-attaching listener
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        const target = e.target as HTMLElement | null;
        if (target?.isContentEditable) {
          return;
        }
        e.preventDefault();
        onOpenChange(!openRef.current);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange]);

  const handleSelect = useCallback(
    (action: () => void) => {
      onOpenChange(false);
      action();
    },
    [onOpenChange],
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search fabrics, products, capabilities, or commands (⌘K)..."
        aria-label="Search catalog, fabrics, and site commands"
      />
      <CommandList>
        <CommandEmpty>No results found for your search.</CommandEmpty>

        <CommandGroup heading="Navigation & Core Capabilities">
          <CommandItem onSelect={() => handleSelect(() => navigate("/products"))}>
            <Package className="mr-2 h-4 w-4 text-blue-500" />
            <span>Product Catalog</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/fabrics"))}>
            <Layers className="mr-2 h-4 w-4 text-purple-500" />
            <span>Fabric Library & Tech Specs</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/manufacturing"))}>
            <Factory className="mr-2 h-4 w-4 text-amber-500" />
            <span>Manufacturing Facility & Assembly</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/sustainability"))}>
            <Sparkles className="mr-2 h-4 w-4 text-emerald-500" />
            <span>Sustainability & Certifications (GOTS/OEKO-TEX)</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/technology"))}>
            <Sparkles className="mr-2 h-4 w-4 text-cyan-500" />
            <span>Technology, R&D & 3D Garment Lab</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Apparel Categories">
          <CommandItem onSelect={() => handleSelect(() => navigate("/categories/team-wear"))}>
            <Shirt className="mr-2 h-4 w-4 text-orange-500" />
            <span>Team Wear (Jerseys, Uniforms, Kits)</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/categories/active-wear"))}>
            <Shirt className="mr-2 h-4 w-4 text-emerald-500" />
            <span>Active Wear (Compression, Running, Gym)</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/categories/casual-wear"))}>
            <Shirt className="mr-2 h-4 w-4 text-indigo-500" />
            <span>Casual Wear (Hoodies, Sweats, Tees)</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/categories/outer-wear"))}>
            <Shirt className="mr-2 h-4 w-4 text-rose-500" />
            <span>Outer Wear (Softshell, Windbreakers, Parkas)</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => navigate("/categories/sports-accessories"))}
          >
            <Package className="mr-2 h-4 w-4 text-teal-500" />
            <span>Sports Accessories (Bags, Socks, Sleeves)</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="B2B Procurement Actions">
          <CommandItem onSelect={() => handleSelect(openDrawer)}>
            <Send className="mr-2 h-4 w-4 text-primary" />
            <span>Open Request for Quote (RFQ) Drawer</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              handleSelect(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))
            }
          >
            {resolvedTheme === "dark" ? (
              <Sun className="mr-2 h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="mr-2 h-4 w-4 text-blue-400" />
            )}
            <span>Switch Theme to {resolvedTheme === "dark" ? "Light" : "Dark"} Mode</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
