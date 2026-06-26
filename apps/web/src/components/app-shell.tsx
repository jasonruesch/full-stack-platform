import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  IconButton,
} from '@jasonruesch/react';
import {
  Bookmark,
  FolderOpen,
  Menu,
  Settings as SettingsIcon,
  Tag as TagIcon,
} from 'lucide-react';
import { type ReactNode, useRef, useState } from 'react';
import { NavItem } from '~/components/app-link';
import { ThemeToggleButton } from '~/components/appearance';
import { UserMenu } from '~/components/user-menu';
import { useFocusMainOnNavigation } from '~/lib/a11y';

const NAV = [
  { to: '/collections', label: 'Collections', icon: FolderOpen },
  { to: '/tags', label: 'Tags', icon: TagIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-md bg-accent text-on-accent">
        <Bookmark size={18} aria-hidden />
      </span>
      <span className="text-lg font-bold tracking-tight">BookmarkVault</span>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Primary">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavItem
          key={to}
          to={to}
          icon={<Icon size={18} aria-hidden />}
          onClick={onNavigate}
        >
          {label}
        </NavItem>
      ))}
    </nav>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <IconButton variant="ghost" aria-label="Open menu" className="md:hidden">
          <Menu size={20} aria-hidden />
        </IconButton>
      </DialogTrigger>
      {/* Override the centered modal styling into a left edge-anchored,
          full-height sidebar drawer that slides in from the left. */}
      <DialogContent className="left-0 top-0 flex h-dvh w-64 max-w-[85vw] translate-x-0 translate-y-0 flex-col items-stretch gap-6 rounded-none border-y-0 border-l-0 border-r p-5 [--tw-enter-scale:1] [--tw-exit-scale:1] data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left">
        <DialogTitle>
          <BrandMark />
        </DialogTitle>
        <NavList onNavigate={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const mainRef = useRef<HTMLElement>(null);
  useFocusMainOnNavigation(mainRef);

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Skip link (WCAG 2.4.1): first focusable element; jumps past the nav. */}
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-accent px-4 py-2 text-on-accent outline-2 outline-offset-2 outline-focus focus:not-sr-only focus:absolute focus:left-4 focus:top-3"
      >
        Skip to main content
      </a>

      <aside className="hidden w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-line bg-surface px-4 py-5 md:flex">
        <BrandMark />
        <NavList />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-10 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-canvas/90 px-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <MobileNav />
            <div className="md:hidden">
              <BrandMark />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggleButton />
            <UserMenu />
          </div>
        </header>

        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className="min-w-0 flex-1 overflow-y-auto p-4 outline-none sm:p-6 lg:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
