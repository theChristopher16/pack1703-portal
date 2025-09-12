import React from 'react';
import { useLoginModal } from '../../contexts/LoginModalContext';
import LoginModal from './LoginModal';

const LoginModalWrapper: React.FC = () => {
  const { isOpen, closeModal } = useLoginModal();

  const handleLoginSuccess = (user: any) => {
    console.log('Login successful:', user);
    closeModal();
    // The AdminContext will automatically update the currentUser state
  };

  return (
    <LoginModal
      isOpen={isOpen}
      onClose={closeModal}
      onSuccess={handleLoginSuccess}
    />
  );
};

export default LoginModalWrapper;
