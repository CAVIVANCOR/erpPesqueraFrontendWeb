// src/components/landing/LandingPage.jsx
import React, { useState } from 'react';
import LandingInitial from './LandingInitial';
import LoginDialog from './LoginDialog';
import LandingDashboard from './LandingDashboard';

const LandingPage = ({ menuItems, onModuleClick }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const handleClickAnimation = () => {
    setShowLogin(true);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setShowLogin(false);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  // Pantalla inicial (sin login)
  if (!isAuthenticated) {
    return (
      <>
        <LandingInitial onClickAnimation={handleClickAnimation} />
        <LoginDialog
          visible={showLogin}
          onHide={() => setShowLogin(false)}
          onLogin={handleLogin}
        />
      </>
    );
  }

  // Dashboard (después del login)
  return (
    <LandingDashboard
      menuItems={menuItems}
      onModuleClick={onModuleClick}
      user={user}
      onLogout={handleLogout}
    />
  );
};

export default LandingPage;