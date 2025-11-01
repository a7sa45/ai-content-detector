import React from 'react';
import { Box, keyframes } from '@mui/material';

// انيميشن للخلفية
const floatingAnimation = keyframes`
  0% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.7;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 1;
  }
  100% {
    transform: translateY(0px) rotate(360deg);
    opacity: 0.7;
  }
`;

const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
`;

const AnimatedBackground: React.FC = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)',
        }
      }}
    >
      {/* عناصر متحركة */}
      {[...Array(6)].map((_, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            width: { xs: '60px', sm: '80px', md: '100px' },
            height: { xs: '60px', sm: '80px', md: '100px' },
            borderRadius: '50%',
            background: `linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)`,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            animation: `${floatingAnimation} ${4 + index * 0.5}s ease-in-out infinite`,
            animationDelay: `${index * 0.5}s`,
            top: `${10 + (index * 15)}%`,
            left: `${5 + (index * 15)}%`,
          }}
        />
      ))}
      
      {/* دوائر نابضة */}
      {[...Array(4)].map((_, index) => (
        <Box
          key={`pulse-${index}`}
          sx={{
            position: 'absolute',
            width: { xs: '120px', sm: '150px', md: '200px' },
            height: { xs: '120px', sm: '150px', md: '200px' },
            borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            animation: `${pulseAnimation} ${3 + index * 0.3}s ease-in-out infinite`,
            animationDelay: `${index * 0.7}s`,
            top: `${20 + (index * 20)}%`,
            right: `${10 + (index * 10)}%`,
          }}
        />
      ))}
    </Box>
  );
};

export default AnimatedBackground;