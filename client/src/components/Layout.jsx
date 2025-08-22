/**
 * @fileoverview Main layout component with header and footer
 */

import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NBButton } from './NBButton';
import { useAppStore } from '@/lib/stores/useAppStore';
import { Home, Building, Search, Gavel, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

/**
 * Main application layout
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 */
export function Layout({ children }) {
  const location = useLocation();
  const { currentUser, switchRole } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Home', icon: Home, testId: 'nav-home' },
    { path: '/landlord', label: 'Landlord', icon: Building, testId: 'nav-landlord' },
    { path: '/tenant', label: 'Tenant', icon: Search, testId: 'nav-tenant' },
    { path: '/jury', label: 'Jury', icon: Gavel, testId: 'nav-jury' }
  ];

  const isActivePath = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-nb-bg flex flex-col">
      {/* Header */}
      <header className="bg-nb-card border-b-2 border-nb-ink shadow-nb-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-nb-accent border-2 border-nb-ink rounded flex items-center justify-center">
                <span className="font-display font-bold text-nb-ink">F</span>
              </div>
              <span className="font-display font-bold text-xl text-nb-ink">
                FairBNB
              </span>
              <span className="text-sm text-nb-ink/60 font-body">(demo)</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map(({ path, label, icon: Icon, testId }) => (
                <Link key={path} to={path}>
                  <NBButton
                    variant={isActivePath(path) ? 'primary' : 'ghost'}
                    className="flex items-center space-x-2"
                    data-testid={testId}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </NBButton>
                </Link>
              ))}
            </nav>

            {/* User Menu & Mobile Toggle */}
            <div className="flex items-center space-x-3">
              {/* Role Switcher */}
              <select
                value={currentUser.role}
                onChange={(e) => switchRole(e.target.value)}
                className="px-3 py-1 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink text-sm focus:outline-none focus:ring-4 focus:ring-nb-accent"
              >
                <option value="landlord">Landlord</option>
                <option value="tenant">Tenant</option>
                <option value="jury">Jury</option>
              </select>

              {/* Connect Wallet (Disabled) */}
              <NBButton
                variant="secondary"
                disabled
                className="hidden sm:flex opacity-50 cursor-not-allowed"
              >
                <User className="w-4 h-4 mr-2" />
                Connect Wallet
              </NBButton>

              {/* Mobile Menu Toggle */}
              <NBButton
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </NBButton>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t-2 border-nb-ink/20 py-4">
              <nav className="flex flex-col space-y-2">
                {navItems.map(({ path, label, icon: Icon, testId }) => (
                  <Link 
                    key={path} 
                    to={path}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <NBButton
                      variant={isActivePath(path) ? 'primary' : 'ghost'}
                      className="w-full justify-start"
                      data-testid={testId}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {label}
                    </NBButton>
                  </Link>
                ))}
                <NBButton
                  variant="secondary"
                  disabled
                  className="w-full justify-start opacity-50 cursor-not-allowed mt-4"
                >
                  <User className="w-4 h-4 mr-2" />
                  Connect Wallet
                </NBButton>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-nb-card border-t-2 border-nb-ink mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-nb-accent border-2 border-nb-ink rounded flex items-center justify-center">
                  <span className="font-display font-bold text-nb-ink text-sm">F</span>
                </div>
                <span className="font-display font-bold text-lg text-nb-ink">
                  FairBNB
                </span>
              </div>
              <p className="text-sm text-nb-ink/70 font-body">
                Trustless rentals. Transparent outcomes.
              </p>
              <p className="text-xs text-nb-ink/50 font-body mt-2">
                Demo application - no real transactions
              </p>
            </div>

            <div>
              <h3 className="font-display font-bold text-nb-ink mb-4">Platform</h3>
              <ul className="space-y-2">
                <li><Link to="/landlord" className="text-sm text-nb-ink/70 hover:text-nb-ink">For Landlords</Link></li>
                <li><Link to="/tenant" className="text-sm text-nb-ink/70 hover:text-nb-ink">For Tenants</Link></li>
                <li><Link to="/jury" className="text-sm text-nb-ink/70 hover:text-nb-ink">For Jurors</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-display font-bold text-nb-ink mb-4">About</h3>
              <ul className="space-y-2">
                <li><span className="text-sm text-nb-ink/70">How it Works</span></li>
                <li><span className="text-sm text-nb-ink/70">Security</span></li>
                <li><span className="text-sm text-nb-ink/70">FAQ</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t-2 border-nb-ink/20 pt-6 mt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <p className="text-sm text-nb-ink/70 font-body">
                © 2025 FairBNB Demo. Built with React + Vite.
              </p>
              <p className="text-xs text-nb-ink/50 font-body mt-2 sm:mt-0">
                v1.0.0
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
