import { NeoButton } from './ui/neo-button'
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-neo-black text-neo-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <h3 className="text-3xl font-black mb-4">FairBNB</h3>
            <p className="text-neo-gray mb-6 font-bold">
              The world's leading community-driven marketplace for unique accommodations.
            </p>
            <div className="flex space-x-4">
              <NeoButton variant="outline" size="icon" className="bg-neo-black border-neo-white text-neo-white hover:bg-neo-white hover:text-neo-black">
                <Facebook className="h-5 w-5" />
              </NeoButton>
              <NeoButton variant="outline" size="icon" className="bg-neo-black border-neo-white text-neo-white hover:bg-neo-white hover:text-neo-black">
                <Twitter className="h-5 w-5" />
              </NeoButton>
              <NeoButton variant="outline" size="icon" className="bg-neo-black border-neo-white text-neo-white hover:bg-neo-white hover:text-neo-black">
                <Instagram className="h-5 w-5" />
              </NeoButton>
              <NeoButton variant="outline" size="icon" className="bg-neo-black border-neo-white text-neo-white hover:bg-neo-white hover:text-neo-black">
                <Youtube className="h-5 w-5" />
              </NeoButton>
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xl font-black mb-6 text-neo-yellow">SUPPORT</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-neo-gray hover:text-neo-white font-bold transition-colors">Help Center</a></li>
              <li><a href="#" className="text-neo-gray hover:text-neo-white font-bold transition-colors">Safety Information</a></li>
              <li><a href="#" className="text-neo-gray hover:text-neo-white font-bold transition-colors">Cancellation Options</a></li>
              <li><a href="#" className="text-neo-gray hover:text-neo-white font-bold transition-colors">Our COVID-19 Response</a></li>
              <li><a href="#" className="text-neo-gray hover:text-neo-white font-bold transition-colors">Report a Problem</a></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-xl font-black mb-6 text-neo-pink">COMMUNITY</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-neo-gray hover:text-neo-white font-bold transition-colors">Disaster Relief</a></li>
              <li><a href="#" className="text-neo-gray hover:text-neo-white font-bold transition-colors">Support Afghan Refugees</a></li>
              <li><a href="#" className="text-neo-gray hover:text-neo-white font-bold transition-colors">Combating Discrimination</a></li>
              <li><a href="#" className="text-neo-gray hover:text-neo-white font-bold transition-colors">FairBNB.org</a></li>
            </ul>
          </div>

          {/* Hosting */}
          <div>
            <h4 className="text-xl font-black mb-6 text-neo-green">HOSTING</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-neo-gray hover:text-neo-white font-bold transition-colors">Try Hosting</a></li>
              <li><a href="#" className="text-neo-gray hover:text-neo-white font-bold transition-colors">AirCover for Hosts</a></li>
              <li><a href="#" className="text-neo-gray hover:text-neo-white font-bold transition-colors">Hosting Resources</a></li>
              <li><a href="#" className="text-neo-gray hover:text-neo-white font-bold transition-colors">Community Forum</a></li>
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t-2 border-neo-gray mt-12 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-neo-yellow mr-3" />
              <span className="font-bold">support@fairbnb.com</span>
            </div>
            <div className="flex items-center">
              <Phone className="h-5 w-5 text-neo-pink mr-3" />
              <span className="font-bold">+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-neo-green mr-3" />
              <span className="font-bold">San Francisco, CA</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t-2 border-neo-gray mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-neo-gray font-bold mb-4 md:mb-0">
            © 2024 FairBNB, Inc. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-neo-gray hover:text-neo-white font-bold transition-colors">Privacy</a>
            <a href="#" className="text-neo-gray hover:text-neo-white font-bold transition-colors">Terms</a>
            <a href="#" className="text-neo-gray hover:text-neo-white font-bold transition-colors">Sitemap</a>
            <a href="#" className="text-neo-gray hover:text-neo-white font-bold transition-colors">Cookie Preferences</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
