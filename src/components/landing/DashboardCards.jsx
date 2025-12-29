// src/components/landing/DashboardCards.jsx
import React from 'react';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import './DashboardCards.css';

const DashboardCards = ({ menuItems, onModuleClick }) => {
  // Mapeo de módulos principales con metadata
  const mainModules = [
    {
      key: 'maestros',
      label: 'MAESTROS',
      icon: 'pi pi-database',
      color: '#667eea',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      description: 'Empresas, Personal, Entidades',
      stats: { count: 'Gestión', label: 'Maestros' }
    },
    {
      key: 'pesca',
      label: 'PESCA',
      icon: 'pi pi-anchor',
      color: '#4facfe',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      description: 'Temporadas, Faenas, Embarcaciones',
      stats: { count: 'Control', label: 'Pesca' }
    },
    {
      key: 'compras',
      label: 'COMPRAS',
      icon: 'pi pi-shopping-cart',
      color: '#43e97b',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      description: 'Órdenes, Requerimientos',
      stats: { count: 'Gestión', label: 'Compras' }
    },
    {
      key: 'ventas',
      label: 'VENTAS',
      icon: 'pi pi-dollar',
      color: '#fa709a',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      description: 'Cotizaciones, Contratos',
      stats: { count: 'Gestión', label: 'Ventas' }
    },
    {
      key: 'inventarios',
      label: 'INVENTARIOS',
      icon: 'pi pi-warehouse',
      color: '#30cfd0',
      gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      description: 'Almacenes, Kardex, Saldos',
      stats: { count: 'Control', label: 'Stock' }
    },
    {
      key: 'mantenimiento',
      label: 'MANTENIMIENTO',
      icon: 'pi pi-wrench',
      color: '#a8edea',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      description: 'Órdenes de Trabajo, Activos',
      stats: { count: 'Gestión', label: 'OTs' }
    },
    {
      key: 'flujoCaja',
      label: 'FLUJO DE CAJA',
      icon: 'pi pi-money-bill',
      color: '#ff9a56',
      gradient: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
      description: 'Movimientos, Cuentas',
      stats: { count: 'Control', label: 'Caja' }
    },
    {
      key: 'finanzas',
      label: 'FINANZAS',
      icon: 'pi pi-wallet',
      color: '#667eea',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      description: 'Préstamos, Créditos, Inversiones',
      stats: { count: 'Tesorería', label: 'Avanzada' }
    },
    {
      key: 'contabilidad',
      label: 'CONTABILIDAD',
      icon: 'pi pi-calculator',
      color: '#f093fb',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      description: 'Plan Contable, Asientos, Reportes',
      stats: { count: 'Gestión', label: 'Contable' }
    },
    {
      key: 'usuarios',
      label: 'USUARIOS',
      icon: 'pi pi-users',
      color: '#fbc2eb',
      gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
      description: 'Usuarios, Accesos, Permisos',
      stats: { count: 'Gestión', label: 'Usuarios' }
    },
    {
      key: 'accesoInstalaciones',
      label: 'ACCESO INSTALACIONES',
      icon: 'pi pi-shield',
      color: '#84fab0',
      gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
      description: 'Control de Accesos',
      stats: { count: 'Control', label: 'Accesos' }
    }
  ];

  return (
    <div className="dashboard-cards-grid">
      {mainModules.map(module => (
        <Card
          key={module.key}
          className="dashboard-card"
          onClick={() => onModuleClick(module.key, module.label)}
        >
          <div className="card-content">
            {/* Icono con gradiente */}
            <div 
              className="card-icon-container"
              style={{ background: module.gradient }}
            >
              <i className={module.icon} />
            </div>

            {/* Título */}
            <h3 className="card-title">{module.label}</h3>

            {/* Descripción */}
            <p className="card-description">{module.description}</p>

            {/* Estadísticas */}
            <div className="card-stats">
              <Badge 
                value={module.stats.count} 
                severity="info"
              />
              <span className="stats-label">{module.stats.label}</span>
            </div>

            {/* Hover effect indicator */}
            <div className="card-hover-indicator">
              <i className="pi pi-arrow-right" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default DashboardCards;