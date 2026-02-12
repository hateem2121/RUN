import {
  IconArrowLeft,
  IconBolt,
  IconBrandTabler,
  IconCategory,
  IconCertificate,
  IconCpu,
  IconDatabase,
  IconFileFilled,
  IconForms,
  IconHome,
  IconInbox,
  IconLeaf,
  IconMail,
  IconNavigation,
  IconPhoto,
  IconRuler,
  IconShirt,
  IconTool,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import type React from "react";
import { useState } from "react";

import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { ModuleSearch } from "@/components/admin/ModuleSearch";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
  currentModule?: string | undefined;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // const [_location] = useLocation();

  const links = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: (
        <IconBrandTabler
          className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200"
          aria-hidden="true"
        />
      ),
    },
    {
      label: "Categories",
      href: "/admin/categories",
      icon: (
        <IconCategory
          className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200"
          aria-hidden="true"
        />
      ),
    },
    {
      label: "Products",
      href: "/admin/products",
      icon: (
        <IconShirt
          className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200"
          aria-hidden="true"
        />
      ),
    },
    {
      label: "Fibers",
      href: "/admin/fibers",
      icon: (
        <IconForms
          className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200"
          aria-hidden="true"
        />
      ),
    },
    {
      label: "Fabrics",
      href: "/admin/fabrics",
      icon: (
        <IconFileFilled
          className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200"
          aria-hidden="true"
        />
      ),
    },
    {
      label: "Certificates",
      href: "/admin/certificates",
      icon: (
        <IconCertificate
          className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200"
          aria-hidden="true"
        />
      ),
    },
    {
      label: "Size Charts",
      href: "/admin/size-charts",
      icon: (
        <IconRuler
          className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200"
          aria-hidden="true"
        />
      ),
    },
    {
      label: "Accessories",
      href: "/admin/accessories",
      icon: (
        <IconBolt
          className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200"
          aria-hidden="true"
        />
      ),
    },
    {
      label: "Media",
      href: "/admin/media",
      icon: (
        <IconPhoto
          className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200"
          aria-hidden="true"
        />
      ),
    },
    {
      label: "Storage Optimization",
      href: "/admin/storage-optimization",
      icon: (
        <IconDatabase
          className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200"
          aria-hidden="true"
        />
      ),
    },

    {
      label: "Navigation",
      href: "/admin/navigation",
      icon: (
        <IconNavigation
          className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200"
          aria-hidden="true"
        />
      ),
    },

    {
      label: "Contact",
      href: "/admin/contact",
      icon: (
        <IconMail
          className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200"
          aria-hidden="true"
        />
      ),
    },
    {
      label: "Footer",
      href: "/admin/footer",
      icon: (
        <IconForms
          className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200"
          aria-hidden="true"
        />
      ),
    },
    {
      label: "Inquiries",
      href: "/admin/inquiries",
      icon: (
        <IconInbox
          className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200"
          aria-hidden="true"
        />
      ),
    },
    {
      label: "Blog",
      href: "/admin/blog",
      icon: (
        <IconFileFilled
          className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200"
          aria-hidden="true"
        />
      ),
    },
    {
      label: "Homepage",
      href: "/admin/homepage",
      icon: (
        <IconHome
          className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200"
          aria-hidden="true"
        />
      ),
    },

    {
      label: "About Us",
      href: "/admin/about",
      icon: (
        <IconFileFilled
          className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200"
          aria-hidden="true"
        />
      ),
    },
    {
      label: "Sustainability",
      href: "/admin/sustainability",
      icon: (
        <IconLeaf
          className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200"
          aria-hidden="true"
        />
      ),
    },
    {
      label: "Manufacturing",
      href: "/admin/manufacturing",
      icon: (
        <IconTool
          className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200"
          aria-hidden="true"
        />
      ),
    },
    {
      label: "Technology",
      href: "/admin/technology",
      icon: (
        <IconCpu
          className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200"
          aria-hidden="true"
        />
      ),
    },
    {
      label: "Back to Website",
      href: "/",
      icon: (
        <IconArrowLeft
          className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200"
          aria-hidden="true"
        />
      ),
    },
  ];

  const [open, setOpen] = useState(false);

  return (
    <div className="admin-layout-root bg-white dark:bg-neutral-900">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link) => (
                <SidebarLink key={link.href} link={link} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: "RUN APPAREL Admin",
                href: "#",
                icon: (
                  <div className="h-7 w-7 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="ml-[var(--width-sidebar-collapsed)] bg-white pt-16 md:pt-0 lg:ml-[var(--width-sidebar-expanded)] dark:bg-neutral-900 transition-[margin] duration-300 ease-in-out">
        <div className="border border-neutral-200 bg-white p-8 dark:border-neutral-700 dark:bg-neutral-900">
          <div className="mb-6 flex items-center justify-between">
            <AdminBreadcrumb />
            <ModuleSearch links={links.filter((l) => l.href !== "/")} />
          </div>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export const Logo = () => {
  return (
    <div className="relative z-elevated flex items-center space-x-2 py-1 font-normal text-black text-sm">
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="whitespace-pre font-medium text-black dark:text-white"
      >
        RUN APPAREL CMS
      </motion.span>
    </div>
  );
};

export const LogoIcon = () => {
  return (
    <div className="relative z-elevated flex items-center space-x-2 py-1 font-normal text-black text-sm">
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
    </div>
  );
};
