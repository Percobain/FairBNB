import { NeoButton } from './ui/neo-button'
import { Search, Menu, User, Heart } from 'lucide-react'

const Navigation = () => {
  return (
    <nav className="sticky top-0 z-50 bg-neo-white border-b-2 border-neo-black shadow-neo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-neo-black">
              FairBNB
            </h1>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-neo-gray" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border-2 border-neo-black bg-neo-white text-neo-black placeholder-neo-gray focus:outline-none focus:ring-2 focus:ring-neo-yellow focus:border-transparent rounded-neo shadow-neo"
                placeholder="Where to?"
              />
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-4">
            <NeoButton variant="ghost" size="sm" className="hidden md:flex">
              Become a Host
            </NeoButton>
            
            <NeoButton variant="ghost" size="icon" className="hidden md:flex">
              <Heart className="h-5 w-5" />
            </NeoButton>

            <NeoButton variant="outline" size="sm" className="hidden md:flex">
              <User className="h-4 w-4 mr-2" />
              Sign In
            </NeoButton>

            {/* Mobile menu button */}
            <NeoButton variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </NeoButton>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
