/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Solarpunk Design System - Earth tones with vibrant accents
      colors: {
        // Forest Green - Primary Earth Tone
        forest: {
          DEFAULT: '#2D5016',
          50: '#F0F8F2',
          100: '#DDF0E2',
          200: '#BEE0C7',
          300: '#9DCEAD',
          400: '#6BAA75',
          500: '#4A7C59',
          600: '#2D5016',
          700: '#1E3323',
          800: '#151E22',
          900: '#0F1416',
        },
        // Solar Yellow - Energy & Light
        solar: {
          DEFAULT: '#F4D03F',
          50: '#FFF8E1',
          100: '#FEEFC2',
          200: '#FBE189',
          300: '#F8D455',
          400: '#F4D03F',
          500: '#E0B63E',
          600: '#C8A038',
          700: '#9E7E2C',
          800: '#6E5720',
          900: '#4C3C16',
        },
        // Sky Blue - Air & Water
        sky: {
          DEFAULT: '#5DADE2',
          50: '#F0F8FF',
          100: '#E0F2FF',
          200: '#B3E0FF',
          300: '#85C1E9',
          400: '#5DADE2',
          500: '#3498DB',
          600: '#2980B9',
          700: '#1F618D',
          800: '#154360',
          900: '#0B2634',
        },
        // Ocean Teal - Deep Water
        ocean: {
          DEFAULT: '#17A2B8',
          50: '#F0FDFF',
          100: '#E0FAFF',
          200: '#B3F0FF',
          300: '#48C9B0',
          400: '#17A2B8',
          500: '#138496',
          600: '#0F6674',
          700: '#0B4A52',
          800: '#072D30',
          900: '#031F22',
        },
        // Terracotta - Earth & Clay
        terracotta: {
          DEFAULT: '#D2691E',
          50: '#FDF2E9',
          100: '#FCE4D3',
          200: '#F9C9A7',
          300: '#E67E22',
          400: '#D2691E',
          500: '#B8541A',
          600: '#9E3F16',
          700: '#842A12',
          800: '#6A150E',
          900: '#50000A',
        },
        // Earth Brown - Ground & Soil
        earth: {
          DEFAULT: '#8B4513',
          50: '#F5F1ED',
          100: '#EBE3DB',
          200: '#D7C7B7',
          300: '#A0522D',
          400: '#8B4513',
          500: '#7A3D11',
          600: '#69350F',
          700: '#582D0D',
          800: '#47250B',
          900: '#361D09',
        },
        // Ink - Dark Text
        ink: '#1A1A1A',
        // Fog - Light Backgrounds
        fog: '#F8F9FA',
        // Cloud - Borders/Dividers
        cloud: '#E9ECEF',
        
        // Legacy compatibility mappings (keeping existing colors)
        sun: {
          DEFAULT: '#F4D03F',
          50: '#FFF8E1',
          100: '#FEEFC2',
          200: '#FBE189',
          300: '#F8D455',
          400: '#F4D03F',
          500: '#E0B63E',
          600: '#C8A038',
          700: '#9E7E2C',
          800: '#6E5720',
          900: '#4C3C16',
        },
        moss: {
          DEFAULT: '#2D5016',
          50: '#F0F8F2',
          100: '#DDF0E2',
          200: '#BEE0C7',
          300: '#9DCEAD',
          400: '#6BAA75',
          500: '#4A7C59',
          600: '#2D5016',
          700: '#1E3323',
          800: '#151E22',
          900: '#0F1416',
        },
        teal: {
          DEFAULT: '#17A2B8',
          50: '#F0FDFF',
          100: '#E0FAFF',
          200: '#B3F0FF',
          300: '#48C9B0',
          400: '#17A2B8',
          500: '#138496',
          600: '#0F6674',
          700: '#0B4A52',
          800: '#072D30',
          900: '#031F22',
        },
        
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
      
      // Solarpunk Typography - Nature-inspired fonts
      fontFamily: {
        'sans': ['Space Grotesk', 'system-ui', 'sans-serif'],
        'display': ['Poppins', 'system-ui', 'sans-serif'],
        'ui': ['Space Grotesk', 'system-ui', 'sans-serif'],
        'body': ['Space Grotesk', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
        'solarpunk-display': ['Poppins', 'system-ui', 'sans-serif'],
        'solarpunk-body': ['Space Grotesk', 'system-ui', 'sans-serif'],
        'solarpunk-mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
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
      
      // Solarpunk Animations - Nature-inspired motion
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
        'solarpunk-float': 'solarpunkFloat 6s ease-in-out infinite',
        'solarpunk-glow': 'solarpunkGlow 2s ease-in-out infinite',
        'solarpunk-pulse': 'solarpunkPulse 2s ease-in-out infinite',
        'solarpunk-slide-up': 'solarpunkSlideUp 0.6s ease-out',
        'solarpunk-fade-in': 'solarpunkFadeIn 0.8s ease-out',
        'nature-flow': 'natureFlow 8s ease-in-out infinite',
        'earth-breath': 'earthBreath 4s ease-in-out infinite',
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
        // Solarpunk Keyframes
        solarpunkFloat: {
          '0%, 100%': { 
            transform: 'translateY(0px) rotate(0deg)',
            filter: 'hue-rotate(0deg)'
          },
          '50%': { 
            transform: 'translateY(-20px) rotate(2deg)',
            filter: 'hue-rotate(15deg)'
          },
        },
        solarpunkGlow: {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(244, 208, 63, 0.3)',
            transform: 'scale(1)'
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(244, 208, 63, 0.6)',
            transform: 'scale(1.02)'
          },
        },
        solarpunkPulse: {
          '0%, 100%': { 
            transform: 'scale(1)',
            opacity: '1'
          },
          '50%': { 
            transform: 'scale(1.05)',
            opacity: '0.8'
          },
        },
        solarpunkSlideUp: {
          '0%': { 
            transform: 'translateY(30px)',
            opacity: '0'
          },
          '100%': { 
            transform: 'translateY(0)',
            opacity: '1'
          },
        },
        solarpunkFadeIn: {
          '0%': { 
            opacity: '0'
          },
          '100%': { 
            opacity: '1'
          },
        },
        natureFlow: {
          '0%, 100%': { 
            transform: 'translateX(0px) translateY(0px)',
            filter: 'hue-rotate(0deg)'
          },
          '25%': { 
            transform: 'translateX(10px) translateY(-5px)',
            filter: 'hue-rotate(90deg)'
          },
          '50%': { 
            transform: 'translateX(0px) translateY(-10px)',
            filter: 'hue-rotate(180deg)'
          },
          '75%': { 
            transform: 'translateX(-10px) translateY(-5px)',
            filter: 'hue-rotate(270deg)'
          },
        },
        earthBreath: {
          '0%, 100%': { 
            transform: 'scale(1)',
            filter: 'brightness(1)'
          },
          '50%': { 
            transform: 'scale(1.02)',
            filter: 'brightness(1.1)'
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
      
      // Solarpunk Gradients - Nature-inspired color combinations
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-brand': 'linear-gradient(135deg, #2D5016 0%, #17A2B8 100%)', // Forest to Ocean
        'gradient-warm': 'linear-gradient(135deg, #F4D03F 0%, #D2691E 100%)', // Solar to Terracotta
        'gradient-cool': 'linear-gradient(135deg, #5DADE2 0%, #17A2B8 100%)', // Sky to Ocean
        'gradient-solar': 'linear-gradient(135deg, #F4D03F 0%, #E67E22 100%)', // Solar Energy
        'gradient-forest': 'linear-gradient(135deg, #2D5016 0%, #4A7C59 100%)', // Forest Depths
        'gradient-sky': 'linear-gradient(135deg, #5DADE2 0%, #17A2B8 100%)', // Sky to Ocean
        'gradient-earth': 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)', // Earth to Terracotta
        'gradient-nature': 'linear-gradient(135deg, #2D5016 0%, #5DADE2 50%, #F4D03F 100%)', // Full Nature Spectrum
        'gradient-solarpunk': 'linear-gradient(135deg, #2D5016 0%, #5DADE2 30%, #F4D03F 60%, #D2691E 100%)', // Complete Solarpunk
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
