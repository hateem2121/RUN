import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'wouter';
// import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const moduleLabels: Record<string, string> = {
  products: 'Products',
  categories: 'Categories',
  media: 'Media Library',
  fabrics: 'Fabrics',
  fibers: 'Fibers',
  certificates: 'Certificates',
  'size-charts': 'Size Charts',
  accessories: 'Accessories',
  navigation: 'Navigation',
  footer: 'Footer',
  homepage: 'Homepage',
  about: 'About Us',
  sustainability: 'Sustainability',
  manufacturing: 'Manufacturing',
  technology: 'Technology',
  'storage-optimization': 'Storage Optimization'
};

export const AdminBreadcrumb = React.memo(function AdminBreadcrumb() {
  const [location] = useLocation();
  const pathSegments = location.split('/').filter(Boolean);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/admin' }
  ];

  if (pathSegments[1]) {
    const module = pathSegments[1];
    const label = moduleLabels[module] || module.charAt(0).toUpperCase() + module.slice(1);
    breadcrumbs.push({ label });
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-600 mb-4">
      <Link
        href="/admin"
        className="flex items-center hover:text-gray-900 transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>

      {breadcrumbs.slice(1).map((crumb, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {crumb.href ? (
            <Link
              href={crumb.href}
              className="hover:text-gray-900 transition-colors"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{crumb.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
});