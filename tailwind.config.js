/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Authentic Solar-Punk Color Palette
      colors: {
        // Primary Colors - Warm Earth & Sun Tones
        primary: {
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F', // Main primary - warm golden yellow
          400: '#FFCA28',
          500: '#FFC107', // Vibrant sun yellow
          600: '#FFB300',
          700: '#FFA000',
          800: '#FF8F00',
          900: '#FF6F00',
        },
        // Secondary Colors - Nature & Growth Greens
        secondary: {
          50: '#E8F5E8',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50', // Main secondary - vibrant nature green
          600: '#43A047',
          700: '#388E3C',
          800: '#2E7D32',
          900: '#1B5E20',
        },
        // Accent Colors - Sustainable Tech & Ocean
        accent: {
          50: '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#2196F3', // Main accent - sustainable blue
          600: '#1E88E5',
          700: '#1976D2',
          800: '#1565C0',
          900: '#0D47A1',
        },
        // Surface Colors - Natural & Organic
        surface: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
        // Text Colors - Rich & Natural
        text: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
          primary: '#2E2E2E', // Rich dark text
          secondary: '#5A5A5A', // Secondary text
          inverse: '#FAFAFA', // Text on dark backgrounds
        },
        // Special Solar-Punk Effects
        glow: {
          primary: '#FFC107', // Warm sun glow
          secondary: '#4CAF50', // Nature glow
          accent: '#2196F3', // Tech glow
          white: '#FFFFFF',
        },
        // Gradient Colors - Solar-Punk Themes
        gradient: {
          'solar-start': '#FFC107', // Sun yellow
          'solar-end': '#4CAF50', // Nature green
          'tech-start': '#2196F3', // Sustainable blue
          'tech-end': '#4CAF50', // Nature green
          'adventure-start': '#FFC107', // Sun yellow
          'adventure-end': '#2196F3', // Sustainable blue
          'earth-start': '#8D6E63', // Earth brown
          'earth-end': '#4CAF50', // Nature green
        }
      },
      
      // Typography - Futura Font Family
      fontFamily: {
        'sans': ['Futura', 'system-ui', 'sans-serif'], // Primary font - Futura
        'display': ['Futura', 'system-ui', 'sans-serif'], // Display font - Futura
        'body': ['Futura', 'system-ui', 'sans-serif'], // Body font - Futura
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'], // Tech feel
      },
      
      // Enhanced Shadows & Glows
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(255, 193, 7, 0.3), 0 0 40px rgba(76, 175, 80, 0.2)',
        'glow-primary': '0 0 20px rgba(255, 193, 7, 0.4)',
        'glow-secondary': '0 0 20px rgba(76, 175, 80, 0.4)',
        'glow-accent': '0 0 20px rgba(33, 150, 243, 0.4)',
        'inner-glow': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'tech': '0 4px 6px -1px rgba(33, 150, 243, 0.1), 0 2px 4px -1px rgba(33, 150, 243, 0.06)',
        'adventure': '0 10px 25px -3px rgba(255, 193, 7, 0.1), 0 4px 6px -2px rgba(76, 175, 80, 0.05)',
        'solar': '0 10px 25px -3px rgba(255, 193, 7, 0.15), 0 4px 6px -2px rgba(76, 175, 80, 0.1)',
      },
      
      // Custom Animations
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
        'tech-pulse': 'techPulse 2s ease-in-out infinite',
        'adventure-float': 'adventureFloat 8s ease-in-out infinite',
        'solar-glow': 'solarGlow 3s ease-in-out infinite alternate',
      },
      
      // Custom Keyframes
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { 
            boxShadow: '0 0 20px rgba(255, 193, 7, 0.3)',
            transform: 'scale(1)'
          },
          '100%': { 
            boxShadow: '0 0 30px rgba(255, 193, 7, 0.6)',
            transform: 'scale(1.02)'
          },
        },
        solarGlow: {
          '0%': { 
            boxShadow: '0 0 20px rgba(255, 193, 7, 0.3), 0 0 40px rgba(76, 175, 80, 0.2)',
            transform: 'scale(1)'
          },
          '100%': { 
            boxShadow: '0 0 30px rgba(255, 193, 7, 0.5), 0 0 50px rgba(76, 175, 80, 0.3)',
            transform: 'scale(1.01)'
          },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        techPulse: {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(33, 150, 243, 0.3)',
            transform: 'scale(1)'
          },
          '50%': { 
            boxShadow: '0 0 30px rgba(33, 150, 243, 0.6)',
            transform: 'scale(1.01)'
          },
        },
        adventureFloat: {
          '0%, 100%': { 
            transform: 'translateY(0px) rotate(0deg)',
            filter: 'hue-rotate(0deg)'
          },
          '25%': { 
            transform: 'translateY(-8px) rotate(1deg)',
            filter: 'hue-rotate(5deg)'
          },
          '50%': { 
            transform: 'translateY(-15px) rotate(0deg)',
            filter: 'hue-rotate(10deg)'
          },
          '75%': { 
            transform: 'translateY(-8px) rotate(-1deg)',
            filter: 'hue-rotate(5deg)'
          },
        },
      },
      
      // Enhanced Spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Enhanced Border Radius
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '3rem',
      },
      
      // Enhanced Transitions
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
      
      // Custom Gradients - Solar-Punk Themes
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-solar': 'linear-gradient(135deg, #FFC107 0%, #4CAF50 100%)',
        'gradient-tech': 'linear-gradient(135deg, #2196F3 0%, #4CAF50 100%)',
        'gradient-adventure': 'linear-gradient(135deg, #FFC107 0%, #2196F3 100%)',
        'gradient-earth': 'linear-gradient(135deg, #8D6E63 0%, #4CAF50 100%)',
        'gradient-mesh': 'radial-gradient(at 40% 20%, hsla(45,100%,60%,1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(120,100%,40%,1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(200,100%,60%,1) 0px, transparent 50%), radial-gradient(at 80% 50%, hsla(45,100%,50%,1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(120,100%,50%,1) 0px, transparent 50%), radial-gradient(at 80% 100%, hsla(200,100%,50%,1) 0px, transparent 50%), radial-gradient(at 0% 0%, hsla(45,100%,70%,1) 0px, transparent 50%)',
      },
      
      // Enhanced Backdrop Filters
      backdropBlur: {
        'xs': '2px',
      },
      
      // Custom Utilities
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    // Custom plugin for solar-punk effects
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.text-gradient': {
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-image': 'linear-gradient(135deg, #FFC107 0%, #4CAF50 100%)',
        },
        '.text-gradient-tech': {
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-image': 'linear-gradient(135deg, #2196F3 0%, #4CAF50 100%)',
        },
        '.text-gradient-adventure': {
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-image': 'linear-gradient(135deg, #FFC107 0%, #2196F3 100%)',
        },
        '.text-gradient-earth': {
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-image': 'linear-gradient(135deg, #8D6E63 0%, #4CAF50 100%)',
        },
        '.border-gradient': {
          'border-image': 'linear-gradient(135deg, #FFC107 0%, #4CAF50 100%) 1',
        },
        '.shadow-glow-primary': {
          'box-shadow': '0 0 20px rgba(255, 193, 7, 0.4), 0 0 40px rgba(255, 193, 7, 0.2)',
        },
        '.shadow-glow-secondary': {
          'box-shadow': '0 0 20px rgba(76, 175, 80, 0.4), 0 0 40px rgba(76, 175, 80, 0.2)',
        },
        '.shadow-glow-accent': {
          'box-shadow': '0 0 20px rgba(33, 150, 243, 0.4), 0 0 40px rgba(33, 150, 243, 0.2)',
        },
        '.shadow-glow-solar': {
          'box-shadow': '0 0 20px rgba(255, 193, 7, 0.4), 0 0 40px rgba(76, 175, 80, 0.3)',
        },
        '.glass': {
          'background': 'rgba(255, 255, 255, 0.1)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-dark': {
          'background': 'rgba(0, 0, 0, 0.1)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.glass-solar': {
          'background': 'rgba(255, 193, 7, 0.1)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 193, 7, 0.2)',
        },
        '.glass-nature': {
          'background': 'rgba(76, 175, 80, 0.1)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(76, 175, 80, 0.2)',
        },
      };
      addUtilities(newUtilities);
    }
  ],
}
