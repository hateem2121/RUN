# RUN APPAREL Design System

## Color Palette

### Primary Colors
- **Brand Blue**: #3B82F6 (blue-500)
- **Brand Green**: #10B981 (green-500)
- **Brand Purple**: #8B5CF6 (purple-500)

### Theme-Specific Colors
- **Sustainability (Green)**:
  - Primary: #10B981
  - Light: #D1FAE5
  - Dark: #065F46
  
- **Manufacturing (Blue)**:
  - Primary: #3B82F6
  - Light: #DBEAFE
  - Dark: #1E3A8A
  
- **Technology (Purple)**:
  - Primary: #8B5CF6
  - Light: #EDE9FE
  - Dark: #5B21B6

### Neutral Colors
- Gray-50 to Gray-900 (Tailwind defaults)
- White: #FFFFFF
- Black: #000000

## Typography

### Font Family
- **Primary**: Neue Stance (custom font)
- **Fallback**: system-ui, -apple-system, sans-serif

### Font Sizes
- **Display**: 4xl-7xl (2.25rem-4.5rem)
- **Heading**: xl-3xl (1.25rem-1.875rem)
- **Body**: base (1rem)
- **Small**: sm-xs (0.875rem-0.75rem)

## Spacing
- Uses Tailwind's spacing scale (0-96)
- Common patterns:
  - Section padding: py-16 to py-20
  - Container padding: px-4
  - Card padding: p-4 to p-6
  - Component gaps: gap-4 to gap-8

## Components

### Cards
```css
.card {
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background: white;
  border: 1px solid theme('colors.gray.200');
}
```

### Buttons
- **Primary**: bg-{theme}-600 hover:bg-{theme}-700
- **Secondary**: bg-white border-{theme}-600
- **Outline**: border border-gray-300

### Animations

#### Sustainability (Organic)
- Spring animations
- Floating particles
- Growing/shrinking effects
- Water ripples

#### Manufacturing (Mechanical)
- Linear rotations
- Conveyor movements
- Progress bars
- Checkmark reveals

#### Technology (Digital)
- Matrix effects
- Glitch animations
- Holographic hovers
- Particle fields

## Breakpoints
- **Mobile**: < 768px (md)
- **Tablet**: 768px-1024px
- **Desktop**: > 1024px (lg)

## Accessibility
- Focus states: ring-2 ring-{theme}-500
- Skip links for navigation
- ARIA labels on interactive elements
- Reduced motion support

## Performance Guidelines
- Lazy load heavy components
- Use skeleton screens during loading
- Optimize animations for mobile
- Implement progressive enhancement