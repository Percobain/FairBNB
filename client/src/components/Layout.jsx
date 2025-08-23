/**
 * @fileoverview Main layout component with header and footer
 */

import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NBButton } from './NBButton';
import { useAppStore } from '@/lib/stores/useAppStore';
import { Home, Building, Search, Gavel, User, Menu, X, Wallet, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Main application layout
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 */
export function Layout({ children }) {
  const location = useLocation();
  const { 
    currentUser, 
    switchRole, 
    web3, 
    initializeWeb3, 
    disconnectWeb3 
  } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

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

  // Check for existing wallet connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      // Check if MetaMask is installed and has accounts
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' 
          });
          
          if (accounts.length > 0 && !web3.isConnected) {
            // Auto-connect if account is available
            await initializeWeb3();
          }
        } catch (error) {
          console.log('No existing wallet connection');
        }
      }
    };

    checkExistingConnection();
  }, []);

  // Listen for wallet events
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // User disconnected wallet
          disconnectWeb3();
          toast.info('Wallet disconnected');
        } else if (accounts[0] !== web3.account) {
          // Account changed
          initializeWeb3();
          toast.info('Wallet account changed');
        }
      };

      const handleChainChanged = (chainId) => {
        toast.info('Network changed. Please refresh the page.');
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [web3.account, initializeWeb3, disconnectWeb3]);

  const handleConnectWallet = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask is not installed. Please install MetaMask to use this app.');
      return;
    }

    setIsConnecting(true);
    try {
      await initializeWeb3();
      if (web3.isConnected) {
        toast.success('Wallet connected successfully!');
      }
    } catch (error) {
      toast.error('Failed to connect wallet: ' + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectWallet = () => {
    disconnectWeb3();
    toast.info('Wallet disconnected');
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
              <img
                src="/logoSq.png"
                alt="FairBNB Logo"
                className="w-8 h-8 border-2 border-nb-ink rounded object-cover"
              />
              </div>
              <span className="font-display font-bold text-xl text-nb-ink">
                FairBNB
              </span>
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
              {/* <select
                value={currentUser.role}
                onChange={(e) => switchRole(e.target.value)}
                className="px-3 py-1 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink text-sm focus:outline-none focus:ring-4 focus:ring-nb-accent"
              >
                <option value="landlord">Landlord</option>
                <option value="tenant">Tenant</option>
                <option value="jury">Jury</option>
              </select> */}

              {/* Wallet Connection */}
              {web3.isConnected ? (
                <div className="flex items-center space-x-2">
                  {/* Connected Status */}
                  <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-nb-accent/20 border-2 border-nb-accent rounded-nb">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-nb-ink">
                      {formatAddress(web3.account)}
                    </span>
                  </div>
                  
                  {/* Disconnect Button */}
                  <NBButton
                    variant="ghost"
                    size="sm"
                    onClick={handleDisconnectWallet}
                    className="hidden sm:flex"
                  >
                    <LogOut className="w-4 h-4" />
                  </NBButton>
                </div>
              ) : (
                <NBButton
                  variant="secondary"
                  onClick={handleConnectWallet}
                  disabled={isConnecting || web3.isInitializing}
                  className="hidden sm:flex"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  {isConnecting || web3.isInitializing ? 'Connecting...' : 'Connect Wallet'}
                </NBButton>
              )}

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
                
                {/* Mobile Wallet Connection */}
                {web3.isConnected ? (
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center space-x-2 px-3 py-2 bg-nb-accent/20 border-2 border-nb-accent rounded-nb">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-nb-ink">
                        {formatAddress(web3.account)}
                      </span>
                    </div>
                    <NBButton
                      variant="ghost"
                      onClick={handleDisconnectWallet}
                      className="w-full justify-start"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Disconnect Wallet
                    </NBButton>
                  </div>
                ) : (
                  <NBButton
                    variant="secondary"
                    onClick={handleConnectWallet}
                    disabled={isConnecting || web3.isInitializing}
                    className="w-full justify-start mt-4"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    {isConnecting || web3.isInitializing ? 'Connecting...' : 'Connect Wallet'}
                  </NBButton>
                )}
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
      <footer className="bg-nb-card border-t-2 border-nb-ink mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img
                  src="/logoSq.png"
                  alt="FairBNB Logo"
                  className="w-8 h-8 border-2 border-nb-ink rounded object-cover"
                />
                <span className="font-display font-bold text-lg text-nb-ink">
                  FairBNB
                </span>
              </div>
              <p className="text-sm text-nb-ink/70 font-body">
                Decentralized rentals. Fair resolutions.
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
                © 2025 FairBNB. Made with {'<3'} by NGM GNG.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
