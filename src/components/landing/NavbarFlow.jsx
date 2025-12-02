// src/components/landing/NavbarFlow.jsx
import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import './NavbarFlow.css';

const NavbarFlow = ({ user, onLogout }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar-flow ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <i className="pi pi-chart-line" style={{ fontSize: '24px' }} />
          <span className="logo-text">ERP MEGUI</span>
        </div>

        {/* Center - Info */}
        <div className="navbar-center">
          <span className="navbar-info">
            <i className="pi pi-building" />
            {user?.empresa || 'Sistema Empresarial'}
          </span>
        </div>

        {/* Right - User */}
        <div className="navbar-right">
          <div className="user-info">
            <i className="pi pi-user" />
            <span>{user?.nombre || 'Usuario'}</span>
          </div>
          <Button
            icon="pi pi-sign-out"
            className="p-button-rounded p-button-text"
            onClick={onLogout}
            tooltip="Cerrar Sesión"
            tooltipOptions={{ position: 'bottom' }}
          />
        </div>
      </div>
    </nav>
  );
};

export default NavbarFlow;