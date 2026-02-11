import { Search } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useHotkeys } from "@/hooks/use-hotkeys";

interface Module {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface ModuleSearchProps {
  links: Module[];
}

export function ModuleSearch({ links }: ModuleSearchProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const toggle = useCallback(() => setOpen((o) => !o), []);

  useHotkeys("k", toggle);

  const onSelect = useCallback(
    (href: string) => {
      setOpen(false);
      navigate(href);
    },
    [navigate],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-muted-foreground text-sm hover:bg-accent hover:text-accent-foreground"
      >
        <Search className="h-4 w-4" />
        <span className="hidden lg:inline-flex">Search modules...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a module name or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Modules">
            {links.map((link) => (
              <CommandItem key={link.href} value={link.label} onSelect={() => onSelect(link.href)}>
                {link.icon && <div className="mr-2">{link.icon}</div>}
                <span>{link.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
