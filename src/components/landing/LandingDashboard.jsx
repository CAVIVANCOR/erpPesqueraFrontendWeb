// src/components/landing/LandingDashboard.jsx
import React from 'react';
import DashboardCards from './DashboardCards';
import logotipoMeguiCuadrado from '../../assets/Isotipo/Isotipo_Megui_Negativo.png';
import './LandingDashboard.css';

const LandingDashboard = ({ menuItems, onModuleClick, user, onLogout }) => {
  return (
    <div className="landing-dashboard-container">
      {/* Navbar flotante estilo NavbarFlow */}
      <nav className="navbar-floating">
        <div className="navbar-content">
          {/* Logo */}
          <div className="navbar-logo">
            <img src={logotipoMeguiCuadrado} alt="Megui" className="logo-small" />
            <span className="logo-text">ERP MEGUI</span>
          </div>

          {/* Usuario y logout */}
          <div className="navbar-right">
            <div className="user-info">
              <i className="pi pi-user" />
              <span>{user?.nombre || 'Usuario'}</span>
            </div>
            <button 
              className="logout-btn"
              onClick={onLogout}
              title="Cerrar Sesión"
            >
              <i className="pi pi-sign-out" />
            </button>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <div className="dashboard-content">
        <h2 className="dashboard-title">Seleccione un Módulo</h2>
        <DashboardCards 
          menuItems={menuItems}
          onModuleClick={onModuleClick}
        />
      </div>
    </div>
  );
};

export default LandingDashboard;