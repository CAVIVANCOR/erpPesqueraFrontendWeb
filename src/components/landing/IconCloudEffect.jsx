// src/components/landing/IconCloudEffect.jsx
import React, { useState, useEffect } from 'react';

const IconCloudEffect = ({ icons = [], radius = 180, iconSize = 42 }) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => ({
        x: prev.x + 1.2,
        y: prev.y + 1.8
      }));
    }, 30);

    return () => clearInterval(interval);
  }, []);

  // Colores pastel vivos (distintos a la paleta del logo)
  const colors = [
    '#FF6B9D', // Rosa pastel vibrante
    '#C44569', // Rosa fucsia
    '#FFA07A', // Salmón claro
    '#FFB6C1', // Rosa claro
    '#FF69B4', // Rosa intenso
    '#FF1493', // Rosa profundo
    '#FFD700', // Dorado
    '#FFA500', // Naranja
    '#FF6347', // Tomate
    '#FF4500', // Naranja rojizo
    '#9B59B6', // Púrpura
    '#8E44AD', // Violeta
    '#E74C3C', // Rojo coral
    '#F39C12', // Amarillo anaranjado
    '#16A085', // Verde turquesa
    '#1ABC9C', // Turquesa
    '#2ECC71', // Verde esmeralda
    '#27AE60', // Verde
    '#3498DB', // Azul cielo
    '#2980B9', // Azul
  ];

  const getIconPosition = (index, total) => {
    const phi = Math.acos(-1 + (2 * index) / total);
    const theta = Math.sqrt(total * Math.PI) * phi;

    const x = radius * Math.cos(theta) * Math.sin(phi);
    const y = radius * Math.sin(theta) * Math.sin(phi);
    const z = radius * Math.cos(phi);

    return { x, y, z };
  };

  const rotatePoint = (x, y, z, rotX, rotY) => {
    const radX = (rotX * Math.PI) / 180;
    const radY = (rotY * Math.PI) / 180;

    const cosX = Math.cos(radX);
    const sinX = Math.sin(radX);
    const cosY = Math.cos(radY);
    const sinY = Math.sin(radY);

    const y1 = y * cosX - z * sinX;
    const z1 = y * sinX + z * cosX;

    const x2 = x * cosY + z1 * sinY;
    const z2 = -x * sinY + z1 * cosY;

    return { x: x2, y: y1, z: z2 };
  };

  return (
    <div
      style={{
        position: 'relative',
        width: radius * 2,
        height: radius * 2,
        perspective: '1000px',
      }}
    >
      {icons.map((icon, index) => {
        const pos = getIconPosition(index, icons.length);
        const rotated = rotatePoint(pos.x, pos.y, pos.z, rotation.x, rotation.y);

        const scale = (rotated.z + radius) / (2 * radius);
        const opacity = 0.4 + scale * 0.6;
        const zIndex = Math.round(scale * 100);

        // Asignar color del array de colores pastel vivos
        const iconColor = colors[index % colors.length];

        return (
          <i
            key={index}
            className={`pi ${icon}`}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              fontSize: `${iconSize * scale}px`,
              color: iconColor,
              transform: `translate(-50%, -50%) translate(${rotated.x}px, ${rotated.y}px)`,
              opacity: opacity,
              zIndex: zIndex,
              transition: 'all 0.05s linear',
              textShadow: `0 0 ${15 * scale}px ${iconColor}`,
              filter: `brightness(1.2) saturate(1.3)`,
            }}
          />
        );
      })}
    </div>
  );
};

export default IconCloudEffect;