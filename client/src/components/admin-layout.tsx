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
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
  currentModule?: string;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // const [_location] = useLocation();

  const links = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: <IconBrandTabler className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Categories",
      href: "/admin/categories",
      icon: <IconCategory className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Products",
      href: "/admin/products",
      icon: <IconShirt className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Fibers",
      href: "/admin/fibers",
      icon: <IconForms className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Fabrics",
      href: "/admin/fabrics",
      icon: <IconFileFilled className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Certificates",
      href: "/admin/certificates",
      icon: <IconCertificate className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Size Charts",
      href: "/admin/size-charts",
      icon: <IconRuler className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Accessories",
      href: "/admin/accessories",
      icon: <IconBolt className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Media",
      href: "/admin/media",
      icon: <IconPhoto className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Storage Optimization",
      href: "/admin/storage-optimization",
      icon: <IconDatabase className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },

    {
      label: "Navigation",
      href: "/admin/navigation",
      icon: <IconNavigation className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },

    {
      label: "Contact",
      href: "/admin/contact",
      icon: <IconMail className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Inquiries",
      href: "/admin/inquiries",
      icon: <IconInbox className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Homepage",
      href: "/admin/homepage",
      icon: <IconHome className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },

    {
      label: "About Us",
      href: "/admin/about",
      icon: <IconFileFilled className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Sustainability",
      href: "/admin/sustainability",
      icon: <IconLeaf className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Manufacturing",
      href: "/admin/manufacturing",
      icon: <IconTool className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Technology",
      href: "/admin/technology",
      icon: <IconCpu className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Back to Website",
      href: "/",
      icon: <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
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
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
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
      <div className="ml-[60px] bg-white pt-16 md:pt-0 lg:ml-[300px] dark:bg-neutral-900">
        <div className="border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
          <AdminBreadcrumb />
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export const Logo = () => {
  return (
    <div className="z-elevated relative flex items-center space-x-2 py-1 text-sm font-normal text-black">
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-black dark:text-white"
      >
        RUN APPAREL CMS
      </motion.span>
    </div>
  );
};

export const LogoIcon = () => {
  return (
    <div className="z-elevated relative flex items-center space-x-2 py-1 text-sm font-normal text-black">
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
    </div>
  );
};
