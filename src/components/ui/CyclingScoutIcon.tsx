import React, { useState, useEffect } from 'react';
import configService from '../../services/configService';

interface CyclingScoutIconProps {
  className?: string;
  size?: number;
  interval?: number; // Time between icon changes in milliseconds
}

const CyclingScoutIcon: React.FC<CyclingScoutIconProps> = ({
  className = '',
  size = 16,
  interval = 3000
}) => {
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const [icons, setIcons] = useState<string[]>(['🏕️', '🔥', '🌲', '🏆', '⭐', '🎖️']);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Load icons from database configuration
    const loadIcons = async () => {
      try {
        const dbIcons = await configService.getConfigValue('display.cycling_scout_icons');
        if (dbIcons && Array.isArray(dbIcons) && dbIcons.length > 0) {
          setIcons(dbIcons);
        }
      } catch (error) {
        console.warn('Failed to load cycling scout icons from database, using defaults:', error);
      }
    };

    loadIcons();
  }, []);

  useEffect(() => {
    if (icons.length <= 1) return;

    const timer = setInterval(() => {
      setIsAnimating(true);
      
      // Bounce animation effect
      setTimeout(() => {
        setCurrentIconIndex((prevIndex) => (prevIndex + 1) % icons.length);
        setIsAnimating(false);
      }, 150); // Half of the bounce duration
    }, interval);

    return () => clearInterval(timer);
  }, [icons, interval]);

  const iconStyle = {
    fontSize: `${size}px`,
    display: 'inline-block',
  };

  return (
    <span 
      className={`cycling-scout-icon ${isAnimating ? 'animating' : ''} ${className}`}
      style={iconStyle}
      role="img"
      aria-label="Scout cycling icon"
    >
      {icons[currentIconIndex]}
    </span>
  );
};

export default CyclingScoutIcon;
