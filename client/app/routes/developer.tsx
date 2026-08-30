import { IconBook, IconCode, IconTerminal2, IconWebhook } from "@tabler/icons-react";
import { useState } from "react";
import { Outlet } from "react-router";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function meta() {
  return [
    { title: "Developer Portal | RUN APPAREL" },
    {
      name: "description",
      content:
        "Developer documentation, authentication guides, webhooks, and API playground for RUN APPAREL B2B manufacturing.",
    },
  ];
}

export default function Component() {
  const links = [
    {
      label: "Getting Started",
      href: "/developer",
      icon: <IconBook className="h-5 w-5 shrink-0 text-muted-foreground" />,
    },
    {
      label: "Authentication",
      href: "/developer/guides/authentication",
      icon: <IconTerminal2 className="h-5 w-5 shrink-0 text-muted-foreground" />,
    },
    {
      label: "Webhooks",
      href: "/developer/guides/webhooks",
      icon: <IconWebhook className="h-5 w-5 shrink-0 text-muted-foreground" />,
    },
    {
      label: "Playground",
      href: "/developer/playground",
      icon: <IconCode className="h-5 w-5 shrink-0 text-muted-foreground" />,
    },
  ];
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "bg-background-alt flex flex-col md:flex-row w-full flex-1 mx-auto border border-border overflow-hidden",
        "h-screen",
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link) => (
                <SidebarLink key={link.href} link={link} />
              ))}
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
      <main
        id="main-content"
        className="flex-1 overflow-y-auto bg-background p-4 md:p-10 outline-hidden"
      >
        <div className="max-w-4xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
