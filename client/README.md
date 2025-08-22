# FairBNB - Neobrutalist Frontend

A modern, bold, and community-driven AirBNB clone built with React, Vite, and Tailwind CSS featuring a neobrutalist design system.

## 🎨 Design Philosophy

This project embraces the **neobrutalist** design movement, characterized by:
- **Bold, high-contrast colors** (yellow, orange, purple, pink, etc.)
- **Sharp, geometric shapes** with no rounded corners
- **Heavy shadows** and thick borders
- **Typography-focused** layouts with strong visual hierarchy
- **Raw, unapologetic** aesthetic that prioritizes function and impact

## 🚀 Features

### Homepage (`/`)
- **Navigation Bar**: Sticky navigation with search functionality
- **Hero Section**: Bold gradient background with search form
- **Featured Listings**: Property cards with neobrutalist styling
- **Footer**: Comprehensive site information and links

### Landing Page (`/landing`)
- **Hero Section**: Purple gradient with platform introduction
- **Features Section**: Four key value propositions
- **Testimonials**: User reviews with avatar images
- **Call-to-Action Sections**: Multiple conversion points

## 🛠️ Tech Stack

- **React 19** - Modern React with latest features
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **React Router** - Client-side routing
- **shadcn/ui** - Reusable component library (modified for neobrutalist)

## 🎨 Design System

### Colors
```css
neo-yellow: #FFD93D
neo-orange: #FF6B35
neo-red: #FF2E2E
neo-pink: #FF69B4
neo-purple: #8B5CF6
neo-blue: #3B82F6
neo-green: #10B981
neo-black: #000000
neo-white: #FFFFFF
neo-gray: #6B7280
```

### Shadows
```css
shadow-neo: 4px 4px 0px 0px #000000
shadow-neo-lg: 8px 8px 0px 0px #000000
shadow-neo-xl: 12px 12px 0px 0px #000000
```

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 400, 500, 600, 700, 800, 900
- **Style**: Bold, high-contrast, geometric

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── neo-button.jsx  # Neobrutalist button component
│   │   └── neo-card.jsx    # Neobrutalist card component
│   ├── Navigation.jsx      # Main navigation bar
│   ├── HeroSection.jsx     # Hero section with search
│   ├── FeaturedListings.jsx # Property listings grid
│   ├── Footer.jsx          # Site footer
│   ├── HomePage.jsx        # Complete homepage
│   └── LandingPage.jsx     # Marketing landing page
├── lib/
│   └── utils.js           # Utility functions
├── App.jsx                # Main app with routing
└── index.css              # Global styles and neobrutalist utilities
```

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to `http://localhost:5173`

4. **Switch between pages**:
   - Homepage: `http://localhost:5173/`
   - Landing Page: `http://localhost:5173/landing`

## 🎯 Key Components

### NeoButton
A neobrutalist button component with multiple variants:
- `default`: Yellow background with black text
- `destructive`: Red background
- `outline`: White background with black border
- `secondary`: Purple background
- `success`: Green background
- `warning`: Orange background

### NeoCard
A neobrutalist card component with:
- Sharp corners (no border radius)
- Heavy black border
- Drop shadow effect
- Hover animations

## 🎨 Customization

### Adding New Colors
1. Add to `tailwind.config.js` in the `neo` color palette
2. Use in components with `bg-neo-[color]`, `text-neo-[color]`, etc.

### Creating New Components
1. Follow the neobrutalist design principles
2. Use sharp corners (`rounded-neo`)
3. Apply heavy shadows (`shadow-neo`)
4. Use bold typography (`font-black`)
5. Maintain high contrast

## 📱 Responsive Design

The application is fully responsive with:
- Mobile-first approach
- Breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Flexible grid layouts
- Adaptive typography

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Design Inspiration

This project draws inspiration from:
- **Neobrutalism** design movement
- **AirBNB's** functionality and user experience
- **Modern web design** trends
- **Community-driven** platforms

## 🤝 Contributing

1. Follow the neobrutalist design principles
2. Maintain high contrast and bold styling
3. Use the established color palette
4. Keep components modular and reusable

## 📄 License

This project is part of the FairBNB platform - a community-driven alternative to traditional accommodation booking platforms.
