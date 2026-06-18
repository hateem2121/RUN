import { IconBook, IconCode, IconTerminal2, IconWebhook } from "@tabler/icons-react";
import { useState } from "react";
import { Outlet } from "react-router";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function Component() {
  const links = [
    {
      label: "Getting Started",
      href: "/developer",
      icon: <IconBook className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Authentication",
      href: "/developer/guides/authentication",
      icon: (
        <IconTerminal2 className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Webhooks",
      href: "/developer/guides/webhooks",
      icon: (
        <IconWebhook className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Playground",
      href: "/developer/playground",
      icon: <IconCode className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
  ];
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "bg-gray-100 dark:bg-neutral-800 flex flex-col md:flex-row w-full flex-1 mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden",
        "h-screen",
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
      <main
        id="main-content"
        className="flex-1 overflow-y-auto bg-white dark:bg-neutral-900 p-4 md:p-10 outline-none"
      >
        <div className="max-w-4xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
