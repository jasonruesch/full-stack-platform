import { Link, type LinkProps, cn } from '@jasonruesch/react';
import type { ReactNode } from 'react';
import {
  NavLink as RouterNavLink,
  Link as RouterLink,
  type LinkProps as RouterLinkProps,
} from 'react-router';

/**
 * Client-side link with design-system styling. Renders React Router's `Link`
 * as the base via the DS `Link`'s `asChild`, keeping anchor semantics, SPA
 * navigation, and DS styling together. This is the app's standard link.
 */
export function AppLink({
  to,
  children,
  variant,
  className,
  ...rest
}: RouterLinkProps & Pick<LinkProps, 'variant'> & { children: ReactNode }) {
  return (
    <Link asChild variant={variant} className={className}>
      <RouterLink to={to} {...rest}>
        {children}
      </RouterLink>
    </Link>
  );
}

/**
 * Sidebar navigation item: a router `NavLink` styled by active state. Not a DS
 * `Link` (which is anchor-text styled) — nav items want a button-like surface.
 */
export function NavItem({
  to,
  end,
  icon,
  children,
  onClick,
}: {
  to: string;
  end?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <RouterNavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
          isActive
            ? 'bg-accent-subtle text-accent'
            : 'text-fg-muted hover:bg-surface hover:text-fg',
        )
      }
    >
      {icon}
      {children}
    </RouterNavLink>
  );
}
