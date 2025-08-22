/**
 * @fileoverview Landing page component
 */

import { Link } from 'react-router-dom';
import { NBCard } from '@/components/NBCard';
import { NBButton } from '@/components/NBButton';
import { Building, Search, Gavel, Shield, Coins, Users, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

/**
 * Landing page with hero, features, and CTAs
 */
export function Landing() {
  const [openFaq, setOpenFaq] = useState(null);

  const roleCards = [
    {
      role: 'landlord',
      title: 'I\'m a Landlord',
      description: 'List your properties as NFTs and earn secure, transparent rental income.',
      icon: Building,
      color: 'nb-accent',
      features: ['NFT-backed listings', 'Automated escrow', 'Dispute protection'],
      testId: 'cta-landlord'
    },
    {
      role: 'tenant',
      title: 'I\'m a Tenant',
      description: 'Find verified properties with transparent terms and dispute resolution.',
      icon: Search,
      color: 'nb-accent-2',
      features: ['Verified listings', 'Escrow protection', 'Fair dispute process'],
      testId: 'cta-tenant'
    },
    {
      role: 'jury',
      title: 'I\'m a Juror',
      description: 'Participate in decentralized dispute resolution and earn rewards.',
      icon: Gavel,
      color: 'nb-warn',
      features: ['Earn rewards', 'Fair voting', 'Transparent process'],
      testId: 'cta-jury'
    }
  ];

  const features = [
    {
      icon: Shield,
      title: 'NFT-backed Agreements',
      description: 'Every rental is secured by blockchain technology with immutable terms.'
    },
    {
      icon: Coins,
      title: 'Escrowed Funds',
      description: 'Funds are held safely in smart contracts until rental completion.'
    },
    {
      icon: Gavel,
      title: 'DAO-style Disputes',
      description: 'Community-driven dispute resolution ensures fair outcomes for all.'
    },
    {
      icon: Users,
      title: 'No Intermediaries',
      description: 'Direct peer-to-peer rentals without traditional middlemen fees.'
    }
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Mint NFT',
      description: 'Landlords create NFT listings with verified property details and rental terms.'
    },
    {
      step: '02',
      title: 'Escrow',
      description: 'Tenants book properties and funds are held securely in smart contracts.'
    },
    {
      step: '03',
      title: 'DAO Dispute',
      description: 'Any disputes are resolved fairly by the decentralized community of jurors.'
    }
  ];

  const faqs = [
    {
      question: 'How does the escrow system work?',
      answer: 'Funds are held in smart contracts and automatically released when rental terms are met or disputes are resolved.'
    },
    {
      question: 'What happens if there\'s a dispute?',
      answer: 'Disputes are resolved by a decentralized jury system where community members vote on fair outcomes based on evidence.'
    },
    {
      question: 'Are the properties real?',
      answer: 'This is a demo application. All properties and transactions are simulated for demonstration purposes only.'
    },
    {
      question: 'How do I become a juror?',
      answer: 'Simply switch to the Jury role in the header and start participating in dispute resolution to earn rewards.'
    }
  ];

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
              Trustless rentals.{' '}
              <span className="text-nb-accent">Transparent</span>{' '}
              outcomes.
            </h1>
            <p className="font-body text-lg md:text-xl text-nb-ink/80 mb-8 max-w-2xl mx-auto">
              The future of property rental powered by blockchain technology. 
              Secure, transparent, and fair for everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/tenant">
                <NBButton size="lg" className="w-full sm:w-auto">
                  Explore Properties
                </NBButton>
              </Link>
              <Link to="/landlord">
                <NBButton variant="secondary" size="lg" className="w-full sm:w-auto">
                  List Your Property
                </NBButton>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Role Cards */}
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
                    <Link to={`/${role}`}>
                      <NBButton className="w-full" data-testid={testId}>
                        Get Started
                      </NBButton>
                    </Link>
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
              Three simple steps to secure, transparent rentals
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
