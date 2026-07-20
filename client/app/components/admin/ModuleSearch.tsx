import { FileText, Inbox, Plus, Search, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
        className="flex items-center gap-2 rounded-md border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 text-muted-foreground text-sm hover:border-brand-manufacturing hover:text-white transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden lg:inline-flex">Search modules...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-white/[0.10] bg-black/40 px-1.5 font-medium font-mono text-xxs opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-2xl sm:max-w-search-modal border border-white/[0.08] bg-surface-black/80 backdrop-blur-xl [&>button]:text-white [&>button]:hover:bg-white/10">
          <DialogTitle className="sr-only">Command Palette</DialogTitle>
          <Command className="bg-transparent text-white [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
            <CommandInput
              placeholder="Type a command or search..."
              className="border-b border-white/[0.08] text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <CommandList className="max-h-custom-space-1 overflow-y-auto overflow-x-hidden">
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </CommandEmpty>

              <CommandGroup heading="Quick Actions" className="text-muted-foreground">
                <CommandItem
                  value="New Product"
                  onSelect={() => onSelect("/admin/products/new")}
                  className="data-custom-misc-1:bg-white/[0.06] data-custom-misc-2:text-white cursor-pointer rounded-md my-1"
                >
                  <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-sm bg-blue-500/20 text-blue-500">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span>New Product</span>
                </CommandItem>
                <CommandItem
                  value="Upload Media"
                  onSelect={() => onSelect("/admin/media")}
                  className="data-custom-misc-3:bg-white/[0.06] data-custom-misc-4:text-white cursor-pointer rounded-md my-1"
                >
                  <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-sm bg-brand-manufacturing/20 text-brand-manufacturing">
                    <Upload className="h-4 w-4" />
                  </div>
                  <span>Upload Media</span>
                </CommandItem>
                <CommandItem
                  value="New Blog Post"
                  onSelect={() => onSelect("/admin/blog/new")}
                  className="data-custom-misc-5:bg-white/[0.06] data-custom-misc-6:text-white cursor-pointer rounded-md my-1"
                >
                  <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-sm bg-emerald-500/20 text-emerald-500">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span>New Blog Post</span>
                </CommandItem>
                <CommandItem
                  value="View Inquiries"
                  onSelect={() => onSelect("/admin/inquiries")}
                  className="data-custom-misc-7:bg-white/[0.06] data-custom-misc-8:text-white cursor-pointer rounded-md my-1"
                >
                  <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-sm bg-purple-500/20 text-purple-500">
                    <Inbox className="h-4 w-4" />
                  </div>
                  <span>View Inquiries</span>
                </CommandItem>
              </CommandGroup>

              <CommandSeparator className="bg-white/[0.08]" />

              <CommandGroup heading="Navigate to Module" className="text-muted-foreground">
                {links.map((link) => (
                  <CommandItem
                    key={link.href}
                    value={link.label}
                    onSelect={() => onSelect(link.href)}
                    className="data-custom-misc-9:bg-white/[0.06] data-custom-misc-10:text-white cursor-pointer rounded-md my-1"
                  >
                    {link.icon && (
                      <div className="mr-3 flex h-6 w-6 items-center justify-center text-muted-foreground">
                        {link.icon}
                      </div>
                    )}
                    <span>{link.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
