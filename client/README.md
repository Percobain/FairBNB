# FairBNB - Decentralized Rental Platform (Demo)

A production-quality frontend demo for a decentralized rental escrow platform built with React.js, featuring Neo-Brutalist design and comprehensive property rental workflows.

## 🚀 Features

- **Neo-Brutalist Design**: Bold, high-contrast UI with thick borders and offset shadows
- **Complete User Flows**: Landlord, Tenant, and Jury experiences
- **Property Management**: Create, list, and manage rental properties
- **Escrow System**: Mock blockchain-based escrow for secure transactions  
- **Dispute Resolution**: DAO-style jury voting system for fair outcomes
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Mock Services**: Deterministic seed data for consistent demo experience

## 🛠 Tech Stack

- **Framework**: React.js 19 with Vite
- **Styling**: Tailwind CSS with custom Neo-Brutalism theme
- **UI Components**: shadcn/ui primitives + custom components
- **State Management**: Zustand for global state
- **Forms**: react-hook-form + Zod validation
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: Sonner

## 🎨 Design System

### Colors
- **Background**: `#F7F5F2` (nb-bg)
- **Primary Text**: `#111111` (nb-ink) 
- **Accent**: `#6EE7B7` (nb-accent)
- **Secondary**: `#60A5FA` (nb-accent-2)
- **Warning**: `#F59E0B` (nb-warn)
- **Error**: `#EF4444` (nb-error)
- **Success**: `#10B981` (nb-ok)

### Typography
- **Display Font**: Space Grotesk (headings)
- **Body Font**: Inter (body text)

### Shadows & Borders
- **Shadow**: `8px 8px 0 0 rgba(0,0,0,0.9)` (nb)
- **Small Shadow**: `4px 4px 0 0 rgba(0,0,0,0.9)` (nb-sm)
- **Borders**: 2-3px solid `#111111`
- **Radius**: `1.25rem` (nb)

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── NBCard.jsx      # Neo-Brutalist card wrapper
│   ├── NBButton.jsx    # Primary button component
│   ├── StatPill.jsx    # Dashboard statistics
│   ├── ListingCard.jsx # Property preview cards
│   ├── FilterBar.jsx   # Search and filters
│   ├── Gallery.jsx     # Image carousel
│   ├── PricingWidget.jsx # Booking interface
│   └── Layout.jsx      # Main app layout
├── pages/              # Route components
│   ├── Landing.jsx     # Homepage
│   ├── LandlordDashboard.jsx
│   ├── AddListing.jsx  # Multi-step form
│   ├── TenantExplore.jsx
│   ├── ListingDetails.jsx
│   ├── EscrowActions.jsx
│   ├── NewDispute.jsx
│   ├── JuryDashboard.jsx
│   └── JuryCase.jsx
├── lib/
│   ├── services/       # Mock API services
│   │   ├── mockData.js
│   │   ├── propertiesService.js
│   │   ├── rentalsService.js
│   │   └── disputesService.js
│   ├── stores/         # Zustand stores
│   │   └── useAppStore.js
│   ├── types.js        # JSDoc type definitions
│   └── utils.js        # Utility functions
└── App.jsx             # Root component with routing
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fairbnb/client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   Navigate to `http://localhost:5173`

## 🎯 User Flows

### Landlord Journey
1. **Dashboard**: View owned properties and statistics
2. **Add Listing**: Multi-step form (Basics → Pricing → Media → Availability → Review)
3. **Manage Properties**: View, edit, archive listings
4. **Handle Disputes**: Respond to tenant disputes

### Tenant Journey  
1. **Explore**: Search and filter properties with advanced filters
2. **Property Details**: View gallery, amenities, terms, reviews
3. **Book Rental**: Select duration, confirm pricing, mock escrow
4. **Escrow Actions**: Complete rental or raise dispute

### Jury Journey
1. **Dashboard**: View active disputes and statistics
2. **Case Review**: Read both parties' statements and evidence
3. **Vote**: Cast vote for tenant, landlord, or abstain
4. **Resolution**: View final outcomes and fee distribution

## 🧪 Demo Data

The application uses deterministic seed data (seeded with "fairbnb") including:
- 12 properties across Mumbai, Delhi, Bangalore
- 5 landlords, 7 tenants, 3 jurors
- 8 sample rentals in various states
- 5 dispute cases with evidence

## 🎨 Key Components

### NBCard
```jsx
<NBCard className="hover:-translate-y-1">
  <h3>Card Title</h3>
  <p>Card content with Neo-Brutalist styling</p>
</NBCard>
```

### NBButton
```jsx
<NBButton 
  variant="primary" 
  size="lg"
  icon={<Plus className="w-4 h-4" />}
  data-testid="add-listing"
>
  Add Listing
</NBButton>
```

### FilterBar
```jsx
<FilterBar
  query={searchQuery}
  onChange={handleFilterChange}
  cities={availableCities}
  propertyTypes={propertyTypes}
/>
```

## 🧭 Routing

- `/` - Landing page with role selection
- `/landlord` - Landlord dashboard
- `/landlord/new` - Add new listing form
- `/tenant` - Property exploration with filters
- `/tenant/listing/:id` - Property details and booking
- `/tenant/escrow/:rentalId` - Escrow actions
- `/disputes/new` - Create dispute form
- `/jury` - Jury dashboard
- `/jury/case/:id` - Case voting interface

## 🎛 State Management

Uses Zustand for:
- Current user and role switching
- Global UI state (sidebar, loading, notifications)
- Toast notifications

URL search params for:
- Property filters (city, price, type, etc.)
- Pagination state
- Search queries

## 📱 Responsive Design

- **Mobile-first**: Designed for mobile and scales up
- **Breakpoints**: sm, md, lg, xl following Tailwind conventions
- **Navigation**: Collapsible mobile menu
- **Cards**: Responsive grid layouts
- **Forms**: Stack on mobile, side-by-side on desktop

## ♿ Accessibility

- **WCAG 2.1 AA** compliance targeted
- **Keyboard Navigation**: All interactive elements accessible
- **Focus Indicators**: Visible focus outlines with nb-accent
- **Semantic HTML**: Proper landmarks and structure
- **Alt Text**: All images have descriptive alt text
- **Screen Readers**: aria-live regions for dynamic content

## 🧪 Testing

Test IDs included for E2E testing:
- `data-testid="cta-landlord"` - Landing page CTAs
- `data-testid="add-listing"` - Add listing button
- `data-testid="filter-city"` - City filter dropdown
- `data-testid="book-listing"` - Property booking button
- `data-testid="escrow-happy"` - Confirm satisfaction
- `data-testid="vote-tenant"` - Jury voting buttons

## 🚀 Build & Deploy

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🎯 Demo Highlights

1. **Neo-Brutalist Design**: Thick borders, bold shadows, high contrast
2. **Comprehensive Flows**: Complete user journeys for all three roles
3. **Responsive**: Works seamlessly on mobile and desktop
4. **Interactive**: Hover effects, smooth transitions, micro-animations
5. **Accessible**: Keyboard navigation, focus indicators, semantic HTML
6. **Professional**: Production-ready code structure and patterns

## 📄 License

MIT License - This is a demonstration project.

## 🤝 Contributing

This is a demo project built according to specific requirements. For improvements or suggestions, please open an issue.

---

**Note**: This is a frontend-only demo. No real blockchain transactions or payments are processed. All data is mocked for demonstration purposes.