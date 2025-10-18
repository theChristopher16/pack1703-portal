/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Professional Brand Kit - SmithStation + Solyn
      colors: {
        // Sunlit Yellow - Accent/Energy
        sun: {
          DEFAULT: '#F6C945',
          50: '#FFF8E1',
          100: '#FEEFC2',
          200: '#FBE189',
          300: '#F8D455',
          400: '#F6C945',
          500: '#E0B63E',
          600: '#C8A038',
          700: '#9E7E2C',
          800: '#6E5720',
          900: '#4C3C16',
        },
        // Soft Moss Green - Primary/Action
        moss: {
          DEFAULT: '#6BAA75',
          50: '#F0F8F2',
          100: '#DDF0E2',
          200: '#BEE0C7',
          300: '#9DCEAD',
          400: '#80BE97',
          500: '#6BAA75',
          600: '#54895D',
          700: '#3F6846',
          800: '#2D4B33',
          900: '#1E3323',
        },
        // Teal-Gray - Brand Text / UI Chrome
        teal: {
          DEFAULT: '#4C6F7A',
          50: '#F1F6F7',
          100: '#E2EDF0',
          200: '#C6D9DF',
          300: '#A6C2C9',
          400: '#7FA3AD',
          500: '#4C6F7A',
          600: '#3E5963',
          700: '#2F4249',
          800: '#212E33',
          900: '#151E22',
        },
        // Ink - Headlines
        ink: '#1C1C1C',
        // Fog - Panels/Backgrounds
        fog: '#F4F6F7',
        // Cloud - Borders/Dividers
        cloud: '#E6EBED',
        
        // Legacy compatibility mappings
        primary: {
          DEFAULT: '#6BAA75',
          50: '#F0F8F2',
          100: '#DDF0E2',
          200: '#BEE0C7',
          300: '#9DCEAD',
          400: '#80BE97',
          500: '#6BAA75',
          600: '#54895D',
          700: '#3F6846',
          800: '#2D4B33',
          900: '#1E3323',
        },
        secondary: {
          DEFAULT: '#4C6F7A',
          50: '#F1F6F7',
          100: '#E2EDF0',
          200: '#C6D9DF',
          300: '#A6C2C9',
          400: '#7FA3AD',
          500: '#4C6F7A',
          600: '#3E5963',
          700: '#2F4249',
          800: '#212E33',
          900: '#151E22',
        },
        accent: {
          DEFAULT: '#F6C945',
          50: '#FFF8E1',
          100: '#FEEFC2',
          200: '#FBE189',
          300: '#F8D455',
          400: '#F6C945',
          500: '#E0B63E',
          600: '#C8A038',
          700: '#9E7E2C',
          800: '#6E5720',
          900: '#4C3C16',
        },
      },
      
      // Typography - Inter Font Family (Professional & Warm)
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Inter', 'system-ui', 'sans-serif'],
        'ui': ['Inter', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      
      // Brand Shadows
      boxShadow: {
        'card': '0 6px 18px rgba(76, 111, 122, 0.12)', // Teal tint for cards
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(246, 201, 69, 0.3), 0 0 40px rgba(107, 170, 117, 0.2)',
        'glow-primary': '0 0 20px rgba(107, 170, 117, 0.4)',
        'glow-secondary': '0 0 20px rgba(76, 111, 122, 0.4)',
        'glow-accent': '0 0 20px rgba(246, 201, 69, 0.4)',
        'inner-glow': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
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
      
      // Brand Border Radius
      borderRadius: {
        'brand': '14px', // Brand standard radius
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
      
      // Brand Gradients
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-brand': 'linear-gradient(135deg, #6BAA75 0%, #4C6F7A 100%)', // Moss to Teal
        'gradient-warm': 'linear-gradient(135deg, #F6C945 0%, #6BAA75 100%)', // Sun to Moss
        'gradient-cool': 'linear-gradient(135deg, #4C6F7A 0%, #6BAA75 100%)', // Teal to Moss
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
    // Custom plugin for brand effects
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Brand text gradients
        '.text-gradient-brand': {
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-image': 'linear-gradient(135deg, #6BAA75 0%, #4C6F7A 100%)',
        },
        '.text-gradient-warm': {
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-image': 'linear-gradient(135deg, #F6C945 0%, #6BAA75 100%)',
        },
        // Brand shadows
        '.shadow-brand': {
          'box-shadow': '0 6px 18px rgba(76, 111, 122, 0.12)',
        },
        // Brand glass effects
        '.glass-brand': {
          'background': 'rgba(244, 246, 247, 0.8)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(230, 235, 237, 0.8)',
        },
        '.glass-moss': {
          'background': 'rgba(107, 170, 117, 0.1)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(107, 170, 117, 0.2)',
        },
        '.glass-teal': {
          'background': 'rgba(76, 111, 122, 0.1)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(76, 111, 122, 0.2)',
        },
      };
      addUtilities(newUtilities);
    }
  ],
}
