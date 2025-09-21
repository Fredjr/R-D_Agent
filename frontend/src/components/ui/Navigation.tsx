'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const navigationVariants = cva(
  "nav-palantir",
  {
    variants: {
      variant: {
        primary: "bg-[var(--palantir-primary-800)] text-white border-b border-[var(--palantir-primary-700)]",
        secondary: "bg-[var(--palantir-primary-50)] text-[var(--palantir-primary-900)] border-b border-[var(--palantir-primary-200)]",
        transparent: "bg-transparent text-[var(--palantir-primary-900)]",
      },
      size: {
        sm: "h-12",
        default: "h-16",
        lg: "h-20",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

const tabsVariants = cva(
  "flex border-b",
  {
    variants: {
      variant: {
        default: "border-[var(--palantir-primary-200)]",
        dark: "border-[var(--palantir-primary-600)]",
      },
      size: {
        sm: "h-10",
        default: "h-12",
        lg: "h-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const tabVariants = cva(
  "inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2 font-palantir",
  {
    variants: {
      variant: {
        default: "border-transparent text-[var(--palantir-gray-600)] hover:text-[var(--palantir-primary-800)] hover:border-[var(--palantir-primary-300)]",
        dark: "border-transparent text-[var(--palantir-gray-300)] hover:text-white hover:border-[var(--palantir-primary-400)]",
      },
      state: {
        default: "",
        active: "border-[var(--palantir-accent-blue)] text-[var(--palantir-accent-blue)]",
        disabled: "opacity-50 cursor-not-allowed",
      },
    },
    defaultVariants: {
      variant: "default",
      state: "default",
    },
  }
);

const breadcrumbVariants = cva(
  "flex items-center space-x-2 text-sm font-palantir",
  {
    variants: {
      variant: {
        default: "text-[var(--palantir-gray-600)]",
        light: "text-[var(--palantir-gray-300)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface NavigationProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof navigationVariants> {}

export interface TabsProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tabsVariants> {}

export interface TabProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof tabVariants> {
  active?: boolean;
}

export interface BreadcrumbProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof breadcrumbVariants> {
  items: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
    current?: boolean;
  }>;
}

const Navigation = React.forwardRef<HTMLElement, NavigationProps>(
  ({ className, variant, size, ...props }, ref) => (
    <nav
      ref={ref}
      className={cn(navigationVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Navigation.displayName = "Navigation";

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, variant, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(tabsVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Tabs.displayName = "Tabs";

const Tab = React.forwardRef<HTMLButtonElement, TabProps>(
  ({ className, variant, state, active, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        tabVariants({ 
          variant, 
          state: active ? "active" : disabled ? "disabled" : "default" 
        }),
        className
      )}
      disabled={disabled}
      {...props}
    />
  )
);
Tab.displayName = "Tab";

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, variant, items, ...props }, ref) => (
    <nav
      ref={ref}
      className={cn(breadcrumbVariants({ variant }), className)}
      {...props}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="text-[var(--spotify-muted-text)] mx-2">/</span>
          )}
          {item.current ? (
            <span className="text-[var(--spotify-white)] font-medium">
              {item.label}
            </span>
          ) : item.href ? (
            <a
              href={item.href}
              className="text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] transition-colors"
            >
              {item.label}
            </a>
          ) : item.onClick ? (
            <button
              onClick={item.onClick}
              className="text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-[var(--spotify-light-text)]">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
);
Breadcrumb.displayName = "Breadcrumb";

// Specialized Navigation Components

const ProjectNavigation = React.forwardRef<HTMLDivElement, {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    count?: number;
    disabled?: boolean;
  }>;
  className?: string;
}>(({ activeTab, onTabChange, tabs, className }, ref) => (
  <Tabs ref={ref} className={cn("space-x-8", className)}>
    {tabs.map((tab) => (
      <Tab
        key={tab.id}
        active={activeTab === tab.id}
        disabled={tab.disabled}
        onClick={() => onTabChange(tab.id)}
        className="flex items-center space-x-2"
      >
        {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
        <span>{tab.label}</span>
        {tab.count !== undefined && (
          <span className="ml-2 px-2 py-0.5 text-xs bg-[var(--palantir-primary-100)] text-[var(--palantir-primary-700)] rounded-full">
            {tab.count}
          </span>
        )}
      </Tab>
    ))}
  </Tabs>
));
ProjectNavigation.displayName = "ProjectNavigation";

const PageHeader = React.forwardRef<HTMLDivElement, {
  title: string;
  description?: string;
  breadcrumb?: BreadcrumbProps['items'];
  actions?: React.ReactNode;
  className?: string;
}>(({ title, description, breadcrumb, actions, className }, ref) => (
  <div ref={ref} className={cn("mb-8", className)}>
    {breadcrumb && (
      <div className="mb-4">
        <Breadcrumb items={breadcrumb} />
      </div>
    )}
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-3xl font-bold text-[var(--spotify-white)] font-[var(--spotify-font-family)] tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-[var(--spotify-light-text)] font-[var(--spotify-font-family)] text-lg">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center space-x-3">
          {actions}
        </div>
      )}
    </div>
  </div>
));
PageHeader.displayName = "PageHeader";

export {
  Navigation,
  Tabs,
  Tab,
  Breadcrumb,
  ProjectNavigation,
  PageHeader,
  navigationVariants,
  tabsVariants,
  tabVariants,
  breadcrumbVariants,
};
