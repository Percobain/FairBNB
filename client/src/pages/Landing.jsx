/**
 * @fileoverview Landing page component
 */

import { Link } from 'react-router-dom';
import { NBCard } from '@/components/NBCard';
import { NBButton } from '@/components/NBButton';
import { Building, Search, Gavel, Shield, Coins, Users, ChevronDown, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAppStore } from '../lib/stores/useAppStore.js';
import { toast } from 'sonner';

/**
 * Landing page with hero, features, and CTAs
 */
export function Landing() {
  const [openFaq, setOpenFaq] = useState(null);
  const { web3, initializeWeb3, disconnectWeb3 } = useAppStore();

  const roleCards = [
    {
      role: 'landlord',
      title: "I'm a Landlord",
      description: 'List your rentals as NFTs and receive payments securely on-chain.',
      icon: Building,
      color: 'nb-accent',
      features: ['On-chain property ownership', 'Automated rent escrow'],
      testId: 'cta-landlord'
    },
    {
      role: 'tenant',
      title: "I'm a Tenant",
      description: 'Book verified rentals with confidence and full transparency.',
      icon: Search,
      color: 'nb-accent-2',
      features: ['Secure escrowed payments', 'Transparent rental terms'],
      testId: 'cta-tenant'
    },
    {
      role: 'jury',
      title: "I'm a Juror",
      description: 'Help resolve rental disputes fairly and earn rewards.',
      icon: Gavel,
      color: 'nb-warn',
      features: ['Decentralized dispute voting', 'Earn juror incentives'],
      testId: 'cta-jury'
    }
  ];

  const features = [
    {
      icon: Shield,
      title: 'On-chain Agreements',
      description: 'Rentals are recorded as NFTs with tamper-proof terms on BNB Chain.'
    },
    {
      icon: Coins,
      title: 'Smart Escrow',
      description: 'Payments are locked in escrow and released only when both sides agree.'
    },
    {
      icon: Gavel,
      title: 'Community Disputes',
      description: 'Unresolved conflicts are settled by a jury of community members.'
    },
    {
      icon: Users,
      title: 'Peer-to-Peer Rentals',
      description: 'Connect landlords and tenants directly with no centralized middlemen.'
    }
  ];


  const howItWorks = [
    {
      step: '01',
      title: 'Connect Your Wallet',
      description: 'Smooth onboarding experience by connecting MetaMask to our platform FairBNB.'
    },
    {
      step: '02',
      title: 'List or Browse Properties',
      description: 'Landlords list rentals as NFTs with property details, while tenants browse available stays.'
    },
    {
      step: '03',
      title: 'Book with Escrow',
      description: 'Tenants pay rent into a smart escrow contract, released only after a successful stay.'
    },
    {
      step: '04',
      title: 'Fair Resolution',
      description: 'If a dispute arises, community jurors step in to deliver a transparent, fair outcome.'
    }
  ];

  const faqs = [
    {
      question: 'How does FairBNB ensure safe payments?',
      answer: 'When a tenant books a property, the rent is locked in a smart escrow contract. The landlord only receives the funds after the stay is completed or the terms are verified.'
    },
    {
      question: 'What if there is a dispute between landlord and tenant?',
      answer: 'Disputes are handled by our community-driven jury system. Jurors review the evidence from both sides and vote on a fair resolution, ensuring transparency and trust.'
    },
    {
      question: 'How do I get started as a tenant or landlord?',
      answer: 'Just connect your wallet, then either browse available rentals as a tenant or create a property listing as a landlord. Everything runs directly on-chain.'
    },
    {
      question: 'Can anyone become a juror?',
      answer: 'Yes! By switching to the Juror role in the platform, you can participate in resolving disputes and earn rewards for fair decisions.'
    }
  ];

  const handleConnectWallet = async () => {
    try {
      await initializeWeb3();
      if (web3.isConnected) {
        toast.success('Wallet connected successfully!', {
          description: `Connected to ${web3.account.slice(0, 6)}...${web3.account.slice(-4)}`
        });
      }
    } catch (error) {
      toast.error('Failed to connect wallet', {
        description: error.message
      });
    }
  };

  const handleDisconnectWallet = () => {
    disconnectWeb3();
    toast.success('Wallet disconnected');
  };

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display font-bold text-4xl md:text-6xl text-nb-ink mb-6">
              Decentralized rentals.{' '}
              <span className="text-nb-accent">Transparent</span>{' '}
              outcomes.
            </h1>
            <p className="font-body text-lg md:text-xl text-nb-ink/80 mb-8 max-w-2xl mx-auto">
              The future of rentals reimagined with blockchain. <br />
              Open, secure, and truly fair for every renter and owner.
            </p>
            
                {/* Wallet Connection */}
                  <div className="mb-8">
                    {!web3.isConnected && (
                    <NBButton 
                      size="lg" 
                      onClick={handleConnectWallet}
                      disabled={web3.isInitializing}
                      className="mb-4"
                    >
                      <Wallet className="w-5 h-5 mr-2" />
                      {web3.isInitializing ? 'Connecting...' : 'Connect Wallet'}
                    </NBButton>
                    )}
                    
                    {web3.error && (
                    <div className="bg-nb-error/20 border-2 border-nb-error rounded-nb p-4 mb-4">
                      <p className="text-sm text-nb-error">{web3.error}</p>
                    </div>
                    )}
                  </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/tenant">
                <NBButton size="lg" className="w-full sm:w-auto" disabled={!web3.isConnected}>
                  Explore Properties
                </NBButton>
              </Link>
              <Link to="/landlord">
                <NBButton variant="secondary" size="lg" className="w-full sm:w-auto" disabled={!web3.isConnected}>
                  List Your Property
                </NBButton>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
        <section className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl text-nb-ink mb-4">
            Choose Your Role
          </h2>
          <p className="font-body text-lg text-nb-ink/70">
            Get started with the role that best describes you
          </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {roleCards.map(({ role, title, description, icon: Icon, color, features, testId }, index) => (
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <NBCard className="h-full hover:-translate-y-2 transition-transform duration-300">
            <div className="text-center space-y-4">
              <div className={`w-16 h-16 bg-${color} border-2 border-nb-ink rounded-nb mx-auto flex items-center justify-center`}>
                <Icon className="w-8 h-8 text-nb-ink" />
              </div>
              <h3 className="font-display font-bold text-xl text-nb-ink">
                {title}
              </h3>
              <p className="font-body text-nb-ink/70">
                {description}
              </p>
              <ul className="space-y-2 text-sm">
                {features.map((feature, idx) => (
              <li key={idx} className="text-nb-ink/80 flex items-center justify-center">
                <span className="w-2 h-2 bg-nb-ink rounded-full mr-2"></span>
                {feature}
              </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link to={`/${role}`}>
              <NBButton 
                className="w-full" 
                data-testid={testId}
                disabled={!web3.isConnected}
              >
                Get Started
              </NBButton>
                </Link>
              </div>
            </div>
              </NBCard>
            </motion.div>
          ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
      <section className="px-4 sm:px-6 lg:px-8 bg-nb-accent/10 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl text-nb-ink mb-4">
              How It Works
            </h2>
            <p className="font-body text-lg text-nb-ink/70">
              Four simple steps to secure, transparent rentals
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map(({ step, title, description }, index) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-nb-accent border-2 border-nb-ink rounded-nb mx-auto flex items-center justify-center mb-4">
                  <span className="font-display font-bold text-2xl text-nb-ink">
                    {step}
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl text-nb-ink mb-2">
                  {title}
                </h3>
                <p className="font-body text-nb-ink/70">
                  {description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl text-nb-ink mb-4">
              Platform Features
            </h2>
            <p className="font-body text-lg text-nb-ink/70">
              Built on blockchain technology for maximum security and transparency
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, description }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <NBCard className="text-center h-full">
                  <Icon className="w-12 h-12 text-nb-accent mx-auto mb-4" />
                  <h3 className="font-display font-bold text-lg text-nb-ink mb-2">
                    {title}
                  </h3>
                  <p className="font-body text-sm text-nb-ink/70">
                    {description}
                  </p>
                </NBCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl text-nb-ink mb-4">
              Frequently Asked Questions
            </h2>
            <p className="font-body text-lg text-nb-ink/70">
              Everything you need to know about FairBNB
            </p>
          </div>
          
          <div className="space-y-4">
            {faqs.map(({ question, answer }, index) => (
              <NBCard key={index} className="overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full text-left flex justify-between items-center"
                >
                  <h3 className="font-display font-bold text-lg text-nb-ink">
                    {question}
                  </h3>
                  <ChevronDown 
                    className={`w-5 h-5 text-nb-ink transition-transform duration-200 ${
                      openFaq === index ? 'rotate-180' : ''
                    }`} 
                  />
                </button>
                {openFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 pt-4 border-t-2 border-nb-ink/20"
                  >
                    <p className="font-body text-nb-ink/70">
                      {answer}
                    </p>
                  </motion.div>
                )}
              </NBCard>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
