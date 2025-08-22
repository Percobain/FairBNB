import Navigation from './Navigation'
import HeroSection from './HeroSection'
import FeaturedListings from './FeaturedListings'
import Footer from './Footer'

const HomePage = () => {
  return (
    <div className="min-h-screen bg-neo-white font-neo">
      <Navigation />
      <HeroSection />
      <FeaturedListings />
      <Footer />
    </div>
  )
}

export default HomePage
