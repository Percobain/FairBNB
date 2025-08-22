import { NeoButton } from './ui/neo-button'
import { Search, MapPin, Calendar, Users } from 'lucide-react'

const HeroSection = () => {
  return (
    <section className="relative bg-gradient-to-br from-neo-yellow via-neo-orange to-neo-pink min-h-[80vh] flex items-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 bg-neo-black transform rotate-45"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-neo-purple transform -rotate-12"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-neo-green transform rotate-90"></div>
        <div className="absolute bottom-32 right-1/3 w-12 h-12 bg-neo-red transform -rotate-45"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Main Heading */}
          <h1 className="text-6xl md:text-8xl font-black text-neo-black mb-6 leading-tight">
            FIND YOUR
            <span className="block text-neo-white bg-neo-black px-4 py-2 transform rotate-1 inline-block shadow-neo-lg">
              PERFECT
            </span>
            <span className="block text-neo-black">STAY</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl font-bold text-neo-black mb-12 max-w-3xl mx-auto">
            Discover unique places to stay with local hosts in 191+ countries. 
            <span className="block text-neo-purple">Belong anywhere.</span>
          </p>

          {/* Search Card */}
          <div className="bg-neo-white border-2 border-neo-black shadow-neo-lg max-w-4xl mx-auto p-8 rounded-neo">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Where */}
              <div className="relative">
                <label className="block text-sm font-bold text-neo-black mb-2">WHERE</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neo-gray" />
                  <input
                    type="text"
                    placeholder="Search destinations"
                    className="w-full pl-10 pr-3 py-3 border-2 border-neo-black bg-neo-white text-neo-black placeholder-neo-gray focus:outline-none focus:ring-2 focus:ring-neo-yellow focus:border-transparent rounded-neo"
                  />
                </div>
              </div>

              {/* Check In */}
              <div>
                <label className="block text-sm font-bold text-neo-black mb-2">CHECK IN</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neo-gray" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-3 py-3 border-2 border-neo-black bg-neo-white text-neo-black focus:outline-none focus:ring-2 focus:ring-neo-yellow focus:border-transparent rounded-neo"
                  />
                </div>
              </div>

              {/* Check Out */}
              <div>
                <label className="block text-sm font-bold text-neo-black mb-2">CHECK OUT</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neo-gray" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-3 py-3 border-2 border-neo-black bg-neo-white text-neo-black focus:outline-none focus:ring-2 focus:ring-neo-yellow focus:border-transparent rounded-neo"
                  />
                </div>
              </div>

              {/* Guests */}
              <div>
                <label className="block text-sm font-bold text-neo-black mb-2">GUESTS</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neo-gray" />
                  <select className="w-full pl-10 pr-3 py-3 border-2 border-neo-black bg-neo-white text-neo-black focus:outline-none focus:ring-2 focus:ring-neo-yellow focus:border-transparent rounded-neo appearance-none">
                    <option>1 guest</option>
                    <option>2 guests</option>
                    <option>3 guests</option>
                    <option>4+ guests</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Search Button */}
            <div className="mt-6">
              <NeoButton size="xl" className="w-full">
                <Search className="h-5 w-5 mr-2" />
                Search
              </NeoButton>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-neo-black">
            <div className="text-center">
              <div className="text-3xl font-black">191+</div>
              <div className="text-sm font-bold">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black">4M+</div>
              <div className="text-sm font-bold">Hosts</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black">150M+</div>
              <div className="text-sm font-bold">Guests</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
