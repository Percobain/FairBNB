import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardTitle } from './ui/neo-card'
import { NeoButton } from './ui/neo-button'
import { Star, Heart, MapPin } from 'lucide-react'

const FeaturedListings = () => {
  const listings = [
    {
      id: 1,
      title: "Cozy Mountain Cabin",
      location: "Aspen, Colorado",
      price: "$150",
      rating: 4.9,
      reviews: 127,
      image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop",
      tags: ["Mountain", "Cabin", "Skiing"]
    },
    {
      id: 2,
      title: "Modern Beach House",
      location: "Malibu, California",
      price: "$300",
      rating: 4.8,
      reviews: 89,
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
      tags: ["Beach", "Ocean", "Luxury"]
    },
    {
      id: 3,
      title: "Urban Loft Studio",
      location: "Brooklyn, New York",
      price: "$120",
      rating: 4.7,
      reviews: 203,
      image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=300&fit=crop",
      tags: ["City", "Modern", "Artsy"]
    },
    {
      id: 4,
      title: "Desert Oasis Villa",
      location: "Palm Springs, California",
      price: "$250",
      rating: 4.9,
      reviews: 156,
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop",
      tags: ["Desert", "Pool", "Luxury"]
    },
    {
      id: 5,
      title: "Treehouse Retreat",
      location: "Portland, Oregon",
      price: "$180",
      rating: 4.8,
      reviews: 94,
      image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
      tags: ["Nature", "Unique", "Forest"]
    },
    {
      id: 6,
      title: "Historic Townhouse",
      location: "Charleston, South Carolina",
      price: "$200",
      rating: 4.6,
      reviews: 178,
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
      tags: ["Historic", "Charm", "Southern"]
    }
  ]

  return (
    <section className="py-20 bg-neo-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black text-neo-black mb-6">
            FEATURED
            <span className="block text-neo-purple bg-neo-yellow px-4 py-2 transform -rotate-1 inline-block shadow-neo">
              STAYS
            </span>
          </h2>
          <p className="text-xl font-bold text-neo-gray max-w-2xl mx-auto">
            Discover handpicked accommodations that offer unique experiences and unforgettable memories
          </p>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {listings.map((listing) => (
            <NeoCard key={listing.id} className="group hover:shadow-neo-lg transition-all duration-300 hover:-translate-y-2">
              <div className="relative">
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="w-full h-48 object-cover rounded-neo"
                />
                <NeoButton
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 bg-neo-white/90 hover:bg-neo-white"
                >
                  <Heart className="h-5 w-5" />
                </NeoButton>
                <div className="absolute bottom-4 left-4">
                  <div className="bg-neo-yellow text-neo-black px-3 py-1 rounded-neo text-sm font-bold shadow-neo">
                    {listing.tags[0]}
                  </div>
                </div>
              </div>

              <NeoCardHeader>
                <div className="flex justify-between items-start mb-2">
                  <NeoCardTitle className="text-xl">{listing.title}</NeoCardTitle>
                  <div className="text-right">
                    <div className="text-2xl font-black text-neo-black">{listing.price}</div>
                    <div className="text-sm text-neo-gray">per night</div>
                  </div>
                </div>
                
                <div className="flex items-center text-neo-gray mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm font-bold">{listing.location}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-neo-yellow fill-current mr-1" />
                    <span className="font-bold text-neo-black">{listing.rating}</span>
                    <span className="text-neo-gray ml-1">({listing.reviews})</span>
                  </div>
                </div>
              </NeoCardHeader>

              <NeoCardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {listing.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-neo-gray text-neo-white px-2 py-1 text-xs font-bold rounded-neo"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <NeoButton variant="outline" className="w-full">
                  View Details
                </NeoButton>
              </NeoCardContent>
            </NeoCard>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <NeoButton size="lg" variant="secondary">
            View All Listings
          </NeoButton>
        </div>
      </div>
    </section>
  )
}

export default FeaturedListings
