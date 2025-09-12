import React, { useState } from 'react';
import LoginModal from './LoginModal';

interface LoginRequiredProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

const LoginRequired: React.FC<LoginRequiredProps> = ({ children, fallbackPath = '/' }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLoginSuccess = (user: any) => {
    console.log('Login successful:', user);
    setIsLoginModalOpen(false);
    // The AdminContext will automatically update the currentUser state
  };

  return (
    <>
      {children}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
};

export default LoginRequired;
