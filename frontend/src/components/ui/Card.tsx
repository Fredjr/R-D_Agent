'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  "",
  {
    variants: {
      variant: {
        default: "card-palantir transition-palantir bg-[var(--palantir-card-bg)] border-[var(--palantir-card-border)]",
        elevated: "card-palantir transition-palantir bg-[var(--palantir-card-bg)] border-[var(--palantir-card-border)] shadow-palantir-lg",
        outlined: "card-palantir transition-palantir bg-transparent border-2 border-[var(--palantir-primary-300)]",
        filled: "card-palantir transition-palantir bg-[var(--palantir-primary-50)] border-[var(--palantir-primary-200)]",
        dark: "card-palantir transition-palantir bg-[var(--palantir-primary-800)] border-[var(--palantir-primary-600)] text-white",
        glass: "card-palantir transition-palantir bg-white/80 backdrop-blur-sm border-[var(--palantir-primary-200)]",

        // Spotify-inspired variants - NO palantir classes to avoid conflicts
        spotify: "rounded-lg border transition-all duration-200 bg-[var(--spotify-dark-gray)] border-[var(--spotify-border-gray)] text-[var(--spotify-white)] hover:bg-[var(--spotify-medium-gray)] transform hover:-translate-y-1",
        spotifyElevated: "rounded-lg border transition-all duration-200 bg-[var(--spotify-dark-gray)] border-[var(--spotify-border-gray)] text-[var(--spotify-white)] shadow-lg hover:bg-[var(--spotify-medium-gray)] transform hover:-translate-y-2",
        spotifyGlass: "rounded-lg border transition-all duration-200 bg-[var(--spotify-dark-gray)]/80 backdrop-blur-sm border-[var(--spotify-border-gray)] text-[var(--spotify-white)]",
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        default: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
      radius: {
        sm: "rounded-[var(--palantir-radius-md)]",
        default: "rounded-[var(--palantir-radius-lg)]",
        lg: "rounded-[var(--palantir-radius-xl)]",
        xl: "rounded-[var(--palantir-radius-2xl)]",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
      radius: "default",
    },
  }
);

const cardHeaderVariants = cva(
  "flex flex-col space-y-1.5",
  {
    variants: {
      padding: {
        none: "p-0",
        sm: "p-3",
        default: "p-4",
        lg: "p-6",
      },
    },
    defaultVariants: {
      padding: "default",
    },
  }
);

const cardContentVariants = cva(
  "",
  {
    variants: {
      padding: {
        none: "p-0",
        sm: "p-3",
        default: "p-4",
        lg: "p-6",
      },
    },
    defaultVariants: {
      padding: "default",
    },
  }
);

const cardFooterVariants = cva(
  "flex items-center",
  {
    variants: {
      padding: {
        none: "p-0",
        sm: "p-3",
        default: "p-4",
        lg: "p-6",
      },
    },
    defaultVariants: {
      padding: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  hover?: boolean;
  interactive?: boolean;
}

export interface CardHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardHeaderVariants> {}

export interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardContentVariants> {}

export interface CardFooterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardFooterVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, radius, hover = false, interactive = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant, padding, radius }),
        hover && "hover:shadow-palantir-lg hover:border-[var(--palantir-primary-400)]",
        interactive && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardHeaderVariants({ padding }), className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-lg font-semibold leading-none tracking-tight text-[var(--palantir-primary-900)] font-palantir",
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        "text-sm text-[var(--palantir-gray-600)] font-palantir",
        className
      )}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardContentVariants({ padding }), className)}
      {...props}
    />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardFooterVariants({ padding }), className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

// Specialized Card Components for R&D Agent

const ProjectCard = React.forwardRef<HTMLDivElement, CardProps & {
  title: string;
  description?: string;
  status?: 'active' | 'completed' | 'archived';
  lastUpdated?: string;
  reportCount?: number;
  onClick?: () => void;
}>(({ title, description, status = 'active', lastUpdated, reportCount, onClick, className, ...props }, ref) => {
  const statusColors = {
    active: 'bg-[var(--palantir-success)] text-white',
    completed: 'bg-[var(--palantir-accent-blue)] text-white',
    archived: 'bg-[var(--palantir-gray-400)] text-white'
  };

  return (
    <Card
      ref={ref}
      variant="default"
      hover
      interactive={!!onClick}
      onClick={onClick}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="line-clamp-2">{title}</CardTitle>
          <span className={cn(
            "px-2 py-1 text-xs font-medium rounded-full",
            statusColors[status]
          )}>
            {status}
          </span>
        </div>
        {description && (
          <CardDescription className="line-clamp-3">{description}</CardDescription>
        )}
      </CardHeader>
      <CardFooter className="justify-between text-sm text-[var(--palantir-gray-500)]">
        <span>{reportCount || 0} reports</span>
        {lastUpdated && <span>Updated {lastUpdated}</span>}
      </CardFooter>
    </Card>
  );
});
ProjectCard.displayName = "ProjectCard";

const ReportCard = React.forwardRef<HTMLDivElement, CardProps & {
  title: string;
  objective?: string;
  status?: 'processing' | 'completed' | 'failed';
  createdAt?: string;
  onClick?: () => void;
}>(({ title, objective, status = 'completed', createdAt, onClick, className, ...props }, ref) => {
  const statusConfig = {
    processing: { color: 'bg-[var(--palantir-warning)] text-white', icon: '🔄' },
    completed: { color: 'bg-[var(--palantir-success)] text-white', icon: '✅' },
    failed: { color: 'bg-[var(--palantir-error)] text-white', icon: '❌' }
  };

  const config = statusConfig[status];

  return (
    <Card
      ref={ref}
      variant="default"
      hover
      interactive={!!onClick}
      onClick={onClick}
      className={cn("relative", className)}
      {...props}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="line-clamp-2 text-base">{title}</CardTitle>
          <span className={cn(
            "px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1",
            config.color
          )}>
            <span>{config.icon}</span>
            {status}
          </span>
        </div>
        {objective && (
          <CardDescription className="line-clamp-2">{objective}</CardDescription>
        )}
      </CardHeader>
      {createdAt && (
        <CardFooter className="text-sm text-[var(--palantir-gray-500)]">
          Created {createdAt}
        </CardFooter>
      )}
    </Card>
  );
});
ReportCard.displayName = "ReportCard";

// Spotify-Inspired Card Components

const SpotifyProjectCard = React.forwardRef<HTMLDivElement, CardProps & {
  title: string;
  description?: string;
  status?: 'active' | 'completed' | 'archived';
  lastUpdated?: string;
  reportCount?: number;
  onClick?: () => void;
  imageUrl?: string;
}>(({ title, description, status = 'active', lastUpdated, reportCount, onClick, imageUrl, className, ...props }, ref) => {
  const statusColors = {
    active: 'bg-[var(--spotify-green)] text-[var(--spotify-black)]',
    completed: 'bg-[var(--spotify-blue)] text-white',
    archived: 'bg-[var(--spotify-muted-text)] text-white'
  };

  return (
    <Card
      ref={ref}
      variant="spotify"
      hover
      interactive={!!onClick}
      onClick={onClick}
      className={cn("relative overflow-hidden group cursor-pointer", className)}
      {...props}
    >
      {/* Spotify-style gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--spotify-green)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {imageUrl && (
        <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-[var(--spotify-medium-gray)]">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
      )}

      <CardHeader className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="line-clamp-2 text-[var(--spotify-white)] group-hover:text-[var(--spotify-green)] transition-colors">
            {title}
          </CardTitle>
          <span className={cn(
            "px-2 py-1 text-xs font-bold rounded-full",
            statusColors[status]
          )}>
            {status.toUpperCase()}
          </span>
        </div>
        {description && (
          <CardDescription className="line-clamp-3 text-[var(--spotify-light-text)]">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      <CardFooter className="justify-between text-sm text-[var(--spotify-muted-text)] relative z-10">
        <span>{reportCount || 0} reports</span>
        {lastUpdated && <span>Updated {lastUpdated}</span>}
      </CardFooter>

      {/* Spotify-style play button overlay */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200">
        <div className="w-12 h-12 bg-[var(--spotify-green)] rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
          <svg className="w-5 h-5 text-[var(--spotify-black)] ml-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 5v10l8-5-8-5z"/>
          </svg>
        </div>
      </div>
    </Card>
  );
});
SpotifyProjectCard.displayName = "SpotifyProjectCard";

const SpotifyReportCard = React.forwardRef<HTMLDivElement, CardProps & {
  title: string;
  objective?: string;
  status?: 'processing' | 'completed' | 'failed';
  createdAt?: string;
  onClick?: () => void;
}>(({ title, objective, status = 'completed', createdAt, onClick, className, ...props }, ref) => {
  const statusConfig = {
    processing: { color: 'bg-[var(--spotify-orange)] text-[var(--spotify-black)]', icon: '🔄' },
    completed: { color: 'bg-[var(--spotify-green)] text-[var(--spotify-black)]', icon: '✅' },
    failed: { color: 'bg-[var(--spotify-red)] text-white', icon: '❌' }
  };

  const config = statusConfig[status];

  return (
    <Card
      ref={ref}
      variant="spotify"
      hover
      interactive={!!onClick}
      onClick={onClick}
      className={cn("relative group", className)}
      {...props}
    >
      {/* Spotify-style gradient based on status */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg",
        status === 'completed' && "bg-gradient-to-br from-[var(--spotify-green)]/10 to-transparent",
        status === 'processing' && "bg-gradient-to-br from-[var(--spotify-orange)]/10 to-transparent",
        status === 'failed' && "bg-gradient-to-br from-[var(--spotify-red)]/10 to-transparent"
      )} />

      <CardHeader className="relative z-10">
        <div className="flex items-start justify-between">
          <CardTitle className="line-clamp-2 text-base text-[var(--spotify-white)] group-hover:text-[var(--spotify-green)] transition-colors">
            {title}
          </CardTitle>
          <span className={cn(
            "px-2 py-1 text-xs font-bold rounded-full flex items-center gap-1 ml-2",
            config.color
          )}>
            <span>{config.icon}</span>
            {status.toUpperCase()}
          </span>
        </div>
        {objective && (
          <CardDescription className="line-clamp-2 text-[var(--spotify-light-text)]">
            {objective}
          </CardDescription>
        )}
      </CardHeader>

      {createdAt && (
        <CardFooter className="text-sm text-[var(--spotify-muted-text)] relative z-10">
          Created {createdAt}
        </CardFooter>
      )}
    </Card>
  );
});
SpotifyReportCard.displayName = "SpotifyReportCard";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  ProjectCard,
  ReportCard,
  SpotifyProjectCard,
  SpotifyReportCard,
  cardVariants,
};
