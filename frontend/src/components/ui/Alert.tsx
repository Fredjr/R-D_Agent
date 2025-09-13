'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const alertVariants = cva(
  "relative w-full rounded-lg border p-4",
  {
    variants: {
      variant: {
        default: "bg-blue-50 border-blue-200 text-blue-800",
        destructive: "bg-red-50 border-red-200 text-red-800",
        success: "bg-green-50 border-green-200 text-green-800",
        warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const iconMap = {
  default: InformationCircleIcon,
  destructive: XCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  showIcon?: boolean;
  onClose?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", title, showIcon = true, onClose, children, ...props }, ref) => {
    const Icon = iconMap[variant || "default"];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <div className="flex items-start">
          {showIcon && (
            <Icon className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
          )}
          <div className="flex-1">
            {title && (
              <h3 className="text-sm font-medium mb-1">
                {title}
              </h3>
            )}
            <div className="text-sm">
              {children}
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-3 flex-shrink-0 text-current hover:opacity-70"
            >
              <XCircleIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);
Alert.displayName = "Alert";

// Convenience components for different alert types
export function ErrorAlert({ children, title = "Error", ...props }: Omit<AlertProps, 'variant'>) {
  return (
    <Alert variant="destructive" title={title} {...props}>
      {children}
    </Alert>
  );
}

export function SuccessAlert({ children, title = "Success", ...props }: Omit<AlertProps, 'variant'>) {
  return (
    <Alert variant="success" title={title} {...props}>
      {children}
    </Alert>
  );
}

export function WarningAlert({ children, title = "Warning", ...props }: Omit<AlertProps, 'variant'>) {
  return (
    <Alert variant="warning" title={title} {...props}>
      {children}
    </Alert>
  );
}

export function InfoAlert({ children, title = "Info", ...props }: Omit<AlertProps, 'variant'>) {
  return (
    <Alert variant="default" title={title} {...props}>
      {children}
    </Alert>
  );
}

// Validation error alert specifically for forms
interface ValidationErrorAlertProps {
  errors: string | string[];
  className?: string;
}

export function ValidationErrorAlert({ errors, className }: ValidationErrorAlertProps) {
  const errorArray = Array.isArray(errors) ? errors : [errors];
  
  return (
    <Alert variant="warning" title="Validation Error" className={className}>
      {errorArray.length === 1 ? (
        <p>{errorArray[0]}</p>
      ) : (
        <ul className="list-disc list-inside space-y-1">
          {errorArray.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      )}
    </Alert>
  );
}

export { Alert, alertVariants };
