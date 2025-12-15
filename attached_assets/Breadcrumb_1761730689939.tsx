import React from 'react';

interface BreadcrumbProps {
  category: string;
  productName: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ category, productName }) => {
  return (
    <nav aria-label="Breadcrumb" className="text-xs font-semibold uppercase tracking-widest text-gray-500">
      <ol className="flex items-center space-x-2">
        <li>
          <a href="#" className="hover:opacity-70">Home</a>
        </li>
        <li>
          <span className="mx-2">/</span>
        </li>
        <li>
          <a href="#" className="hover:opacity-70">{category}</a>
        </li>
        <li>
          <span className="mx-2">/</span>
        </li>
        <li aria-current="page" className="text-gray-800 truncate">
          {productName}
        </li>
      </ol>
    </nav>
  );
};

export default Breadcrumb;
