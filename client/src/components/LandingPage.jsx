import { NeoButton } from './ui/neo-button'
import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardTitle } from './ui/neo-card'
import { Star, Users, Shield, Globe, Award, Heart, ArrowRight, CheckCircle } from 'lucide-react'

const LandingPage = () => {
  const features = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Safe & Secure",
      description: "Verified hosts and secure payments for peace of mind"
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Global Community",
      description: "Connect with hosts from 191+ countries worldwide"
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Quality Assured",
      description: "Curated accommodations that meet our high standards"
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Local Experience",
      description: "Authentic stays that let you live like a local"
    }
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      location: "New York, NY",
      rating: 5,
      text: "Amazing experience! The host was incredibly welcoming and the place was exactly as described.",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Mike Chen",
      location: "San Francisco, CA",
      rating: 5,
      text: "Found the perfect place for our family vacation. FairBNB made everything so easy!",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Emma Rodriguez",
      location: "Miami, FL",
      rating: 5,
      text: "The community aspect is what makes FairBNB special. I felt like I was staying with friends.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
    }
  ]

  return (
    <div className="min-h-screen bg-neo-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-neo-purple via-neo-blue to-neo-green min-h-screen flex items-center overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-32 h-32 bg-neo-yellow transform rotate-45"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-neo-pink transform -rotate-12"></div>
          <div className="absolute bottom-32 left-1/3 w-40 h-40 bg-neo-orange transform rotate-90"></div>
          <div className="absolute bottom-40 right-1/4 w-20 h-20 bg-neo-red transform -rotate-45"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="bg-neo-yellow text-neo-black px-4 py-2 rounded-neo inline-block mb-6 shadow-neo">
                <span className="font-black text-sm">NEW PLATFORM</span>
              </div>
              
              <h1 className="text-6xl md:text-7xl font-black text-neo-white mb-6 leading-tight">
                WELCOME TO
                <span className="block text-neo-black bg-neo-yellow px-4 py-2 transform rotate-1 inline-block shadow-neo-lg">
                  FAIRBNB
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl font-bold text-neo-white mb-8 max-w-lg">
                The future of community-driven travel. 
                <span className="block text-neo-yellow">Fair, transparent, and authentic.</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <NeoButton size="xl" className="bg-neo-yellow text-neo-black hover:bg-neo-orange">
                  Start Exploring
                  <ArrowRight className="h-5 w-5 ml-2" />
                </NeoButton>
                <NeoButton size="xl" variant="outline" className="border-neo-white text-neo-white hover:bg-neo-white hover:text-neo-black">
                  Become a Host
                </NeoButton>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-black text-neo-yellow">4M+</div>
                  <div className="text-sm font-bold text-neo-white">Happy Guests</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-neo-yellow">191+</div>
                  <div className="text-sm font-bold text-neo-white">Countries</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-neo-yellow">4.9★</div>
                  <div className="text-sm font-bold text-neo-white">Average Rating</div>
                </div>
              </div>
            </div>

            {/* Right Content - Mockup */}
            <div className="relative">
              <div className="bg-neo-white border-2 border-neo-black shadow-neo-xl p-6 rounded-neo transform rotate-2">
                <div className="bg-neo-gray h-4 w-3/4 mb-4 rounded-neo"></div>
                <div className="bg-neo-yellow h-32 mb-4 rounded-neo"></div>
                <div className="space-y-2">
                  <div className="bg-neo-gray h-3 w-full rounded-neo"></div>
                  <div className="bg-neo-gray h-3 w-2/3 rounded-neo"></div>
                  <div className="bg-neo-gray h-3 w-1/2 rounded-neo"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-neo-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black text-neo-black mb-6">
              WHY CHOOSE
              <span className="block text-neo-purple bg-neo-yellow px-4 py-2 transform -rotate-1 inline-block shadow-neo">
                FAIRBNB?
              </span>
            </h2>
            <p className="text-xl font-bold text-neo-gray max-w-2xl mx-auto">
              We're building a better way to travel, one community at a time
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <NeoCard key={index} className="text-center hover:shadow-neo-lg transition-all duration-300 hover:-translate-y-2">
                <NeoCardHeader>
                  <div className="mx-auto w-16 h-16 bg-neo-yellow rounded-neo flex items-center justify-center mb-4 shadow-neo">
                    <div className="text-neo-black">
                      {feature.icon}
                    </div>
                  </div>
                  <NeoCardTitle className="text-xl">{feature.title}</NeoCardTitle>
                </NeoCardHeader>
                <NeoCardContent>
                  <p className="text-neo-gray font-bold">{feature.description}</p>
                </NeoCardContent>
              </NeoCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-neo-black text-neo-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-black mb-6">
            READY TO
            <span className="block text-neo-yellow bg-neo-purple px-4 py-2 transform rotate-1 inline-block shadow-neo">
              GET STARTED?
            </span>
          </h2>
          <p className="text-xl font-bold text-neo-gray mb-8 max-w-2xl mx-auto">
            Join millions of travelers who have discovered the joy of community-driven accommodation
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <NeoButton size="xl" className="bg-neo-yellow text-neo-black hover:bg-neo-orange">
              Find Your Perfect Stay
            </NeoButton>
            <NeoButton size="xl" variant="outline" className="border-neo-white text-neo-white hover:bg-neo-white hover:text-neo-black">
              Learn More
            </NeoButton>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-neo-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black text-neo-black mb-6">
              WHAT OUR
              <span className="block text-neo-green bg-neo-yellow px-4 py-2 transform -rotate-1 inline-block shadow-neo">
                COMMUNITY
              </span>
              SAYS
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <NeoCard key={index} className="hover:shadow-neo-lg transition-all duration-300">
                <NeoCardHeader>
                  <div className="flex items-center mb-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-neo mr-4 border-2 border-neo-black"
                    />
                    <div>
                      <div className="font-black text-neo-black">{testimonial.name}</div>
                      <div className="text-sm text-neo-gray font-bold">{testimonial.location}</div>
                    </div>
                  </div>
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-neo-yellow fill-current" />
                    ))}
                  </div>
                </NeoCardHeader>
                <NeoCardContent>
                  <p className="text-neo-gray font-bold italic">"{testimonial.text}"</p>
                </NeoCardContent>
              </NeoCard>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-neo-yellow to-neo-orange">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-neo-black mb-6">
            JOIN THE
            <span className="block text-neo-white bg-neo-black px-4 py-2 transform -rotate-1 inline-block shadow-neo">
              REVOLUTION
            </span>
          </h2>
          <p className="text-xl font-bold text-neo-black mb-8">
            Be part of the future of travel. Fair, transparent, and community-driven.
          </p>
          
          <NeoButton size="xl" className="bg-neo-black text-neo-white hover:bg-neo-gray">
            Get Started Today
            <ArrowRight className="h-5 w-5 ml-2" />
          </NeoButton>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
