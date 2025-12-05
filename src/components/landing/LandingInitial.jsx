// src/components/landing/LandingInitial.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VenomBeamBackground from './VenomBeamBackground';
import logotipoMegui from '../../assets/Logotipo/Logotipo_Megui_Negativo.png';
import logoCerebro13 from '../../assets/LogoCerebro13.png';
import fotoGrupal001 from '../../assets/imgWeb/personal/fotoGrupal001.jpg';
import fotoGrupal002 from '../../assets/imgWeb/personal/fotoGrupal002.jpg';
import fotoGrupal003 from '../../assets/imgWeb/personal/fotoGrupal003.jpg';
import fotoGrupal004 from '../../assets/imgWeb/personal/fotoGrupal004.jpg';
import './LandingInitial.css';

const LandingInitial = ({ onClickAnimation }) => {
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [currentMessage, setCurrentMessage] = useState(0);

  const messages = [
    {
      title: "ERP MEGUI INVESTMENT",
      subtitle: "Sistema Multiempresa con Información en Línea",
      description: "Trazabilidad completa y control total de todos los procesos empresariales en tiempo real",
      image: fotoGrupal001
    },
    {
      title: "TRAZABILIDAD TOTAL",
      subtitle: "Seguimiento Completo de Operaciones",
      description: "Control y registro detallado desde el origen hasta el destino final de cada proceso",
      image: fotoGrupal002
    },
    {
      title: "INFORMACIÓN EN LÍNEA",
      subtitle: "Datos en Tiempo Real 24/7",
      description: "Acceso instantáneo a toda la información operativa y financiera desde cualquier ubicación",
      image: fotoGrupal003
    },
    {
      title: "DOCUMENTACIÓN DIGITAL",
      subtitle: "File Virtual con Registro PDF",
      description: "Almacenamiento automático de todos los documentos en PDF para consulta en línea permanente",
      image: fotoGrupal004
    },
    {
      title: "CONTROL DE PROCESOS",
      subtitle: "Gestión Integral Pesquera y Agroindustrial",
      description: "Supervisión completa de pesca industrial, consumo humano, compras, ventas y producción",
      image: fotoGrupal001
    },
    {
      title: "VENTAS Y EXPORTACIÓN",
      subtitle: "Mercado Local e Internacional",
      description: "Control de congelados, conservas, harina de pescado, frutas y hortalizas con trazabilidad",
      image: fotoGrupal002
    },
    {
      title: "INVENTARIOS INTELIGENTES",
      subtitle: "Almacenes Internos y Externos",
      description: "Trazabilidad en línea de materia prima y producto terminado con información actualizada",
      image: fotoGrupal003
    },
    {
      title: "MANTENIMIENTO Y CONTROL",
      subtitle: "Órdenes de Trabajo Documentadas",
      description: "Registro digital de mantenimiento de maquinarias, equipos y locales con historial completo",
      image: fotoGrupal004
    },
    {
      title: "FLUJO DE CAJA INTEGRADO",
      subtitle: "Control Financiero en Tiempo Real",
      description: "Gestión de entregas a rendir con trazabilidad y documentación digital de todos los procesos",
      image: fotoGrupal001
    },
    {
      title: "EQUIPO MEGUI",
      subtitle: "Profesionales Comprometidos",
      description: "Personal altamente capacitado y dedicado al éxito de tu empresa con atención personalizada",
      image: fotoGrupal002
    },
    {
      title: "INTEGRACIÓN CONTABLE",
      subtitle: "Conexión API con Sistemas Administrativos",
      description: "Interfaces en línea con módulos contables y financieros para gestión empresarial completa",
      image: fotoGrupal003
    }
  ];

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    
    // Cambiar mensaje cada 5 segundos
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 5000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(messageInterval);
    };
  }, []);

  // Calcular tamaños responsive
  const getResponsiveSizes = () => {
    const width = screenSize.width;
    
    if (width >= 1920) {
      return { particleCount: 120 };
    } else if (width >= 1200) {
      return { particleCount: 100 };
    } else if (width >= 992) {
      return { particleCount: 90 };
    } else if (width >= 768) {
      return { particleCount: 80 };
    } else if (width >= 480) {
      return { particleCount: 60 };
    } else {
      return { particleCount: 50 };
    }
  };

  const { particleCount } = getResponsiveSizes();

  return (
    <div className="landing-initial-container" onClick={onClickAnimation}>
      {/* Fondo animado */}
      <VenomBeamBackground
        color="#009fe3"
        particleCount={particleCount}
        speed={0.5}
      />

      {/* Efectos de fondo */}
      <div className="landing-effects">
        <div className="effect-circle effect-circle-1"></div>
        <div className="effect-circle effect-circle-2"></div>
        <div className="effect-circle effect-circle-3"></div>
      </div>

      {/* Contenido central */}
      <div className="landing-initial-content">
        {/* Sección de mensajes con imágenes */}
        <div className="messages-spectacular-container">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMessage}
              className="message-spectacular"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
            >
              {/* Imagen de fondo */}
              <div className="message-image-container">
                <motion.div
                  className="message-background-image"
                  style={{
                    backgroundImage: `url(${messages[currentMessage].image})`
                  }}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.5 }}
                />
                <div className="message-image-overlay" />
                
                {/* Logo como marca de agua */}
                <motion.img 
                  src={logotipoMegui}
                  alt="ERP Megui"
                  className="watermark-logo"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>

              {/* Contenido del mensaje */}
              <div className="message-content-wrapper">
                <motion.div 
                  className="message-accent-line-spectacular"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
                
                <motion.h1 
                  className="message-title-spectacular"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  {messages[currentMessage].title}
                </motion.h1>
                
                <motion.h2 
                  className="message-subtitle-spectacular"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  {messages[currentMessage].subtitle}
                </motion.h2>
                
                <motion.p 
                  className="message-description-spectacular"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                >
                  {messages[currentMessage].description}
                </motion.p>
                
                {/* Indicadores */}
                <motion.div 
                  className="message-indicators-spectacular"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  {messages.map((_, index) => (
                    <button
                      key={index}
                      className={`indicator-spectacular ${index === currentMessage ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentMessage(index);
                      }}
                    />
                  ))}
                </motion.div>

                {/* Hint de clic */}
                <motion.div 
                  className="click-hint-spectacular"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, y: [0, -10, 0] }}
                  transition={{ 
                    opacity: { delay: 1.2 },
                    y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                  }}
                >
                  <i className="pi pi-hand-pointer" />
                  <span>Haz clic en cualquier parte para ingresar</span>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer espectacular */}
      <motion.div 
        className="landing-footer-spectacular"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.5 }}
      >
        <div className="footer-content-spectacular">
          {/* Copyright - Ultra moderno con efectos glassmorphism */}
          <div className="copyright-section-spectacular">
            <div className="copyright-badge">
              <span className="copyright-icon">©</span>
              <span className="copyright-year">2026</span>
            </div>
            <div className="copyright-divider"></div>
            <div className="copyright-content">
              <span className="copyright-company">MEGUI INVESTMENT SAC</span>
              <span className="copyright-tagline">Sistema ERP Integral para Gestión Empresarial</span>
            </div>
          </div>

          {/* Desarrollador */}
          <div className="developer-section-spectacular">
            <span className="developed-by-spectacular">Desarrollado por</span>
            <motion.a 
              href="https://www.13elfuturohoy.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="developer-link-spectacular"
              onClick={(e) => e.stopPropagation()}
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="developer-logo-spectacular">
                <img src={logoCerebro13} alt="13 El Futuro Hoy" />
              </div>
              <span className="developer-name-spectacular">13 El Futuro Hoy</span>
            </motion.a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LandingInitial;