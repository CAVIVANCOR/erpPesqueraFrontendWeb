/**
 * AuditInfo - Componente genérico para mostrar información de auditoría
 * Muestra fechas de creación/actualización y usuarios responsables
 * 
 * @author ERP Megui
 * @version 2.0.0
 */

import React, { useState, useEffect } from "react";
import { Tag } from "primereact/tag";
import { getPersonalPorId } from "../../api/personal";
import { formatearFechaHora } from "../../utils/utils";

/**
 * Obtiene el nombre completo de un personal
 * @param {Object} personal - Objeto con nombres y apellidos
 * @returns {string} Nombre completo o null
 */
const obtenerNombreCompleto = (personal) => {
  if (!personal) return null;
  
  const { nombres, apellidos } = personal;
  if (!nombres && !apellidos) return null;
  
  return `${nombres || ""} ${apellidos || ""}`.trim();
};

/**
 * Hook personalizado para cargar datos de personal por ID
 * @param {number|null} personalId - ID del personal a buscar
 * @returns {Object} { personal, loading }
 */
const usePersonal = (personalId) => {
  const [personal, setPersonal] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!personalId) {
      setPersonal(null);
      return;
    }

    const cargarPersonal = async () => {
      try {
        setLoading(true);
        const data = await getPersonalPorId(personalId);
        setPersonal(data);
      } catch (error) {
        console.error(`Error al cargar personal ${personalId}:`, error);
        setPersonal(null);
      } finally {
        setLoading(false);
      }
    };

    cargarPersonal();
  }, [personalId]);

  return { personal, loading };
};

/**
 * AuditInfo Component
 * 
 * @param {Object} props
 * @param {Object} props.data - Objeto con información de auditoría
 * @param {string|Date} props.data.fechaCreacion - Fecha de creación
 * @param {string|Date} props.data.fechaActualizacion - Fecha de actualización
 * @param {number} props.data.creadoPor - ID del personal que creó el registro
 * @param {number} props.data.actualizadoPor - ID del personal que actualizó el registro
 * @param {Object} props.data.personalCreador - (Opcional) Objeto del personal creador si ya viene incluido
 * @param {Object} props.data.personalActualizador - (Opcional) Objeto del personal actualizador si ya viene incluido
 * @param {Object} props.style - Estilos adicionales para el contenedor principal
 * 
 * @example
 * // Uso con IDs (busca automáticamente)
 * <AuditInfo data={{
 *   fechaCreacion: "2024-01-15T10:30:00",
 *   creadoPor: 1,
 *   fechaActualizacion: "2024-01-20T15:45:00",
 *   actualizadoPor: 2
 * }} />
 * 
 * @example
 * // Uso con objetos completos (no busca)
 * <AuditInfo data={{
 *   fechaCreacion: "2024-01-15T10:30:00",
 *   personalCreador: { nombres: "Juan", apellidos: "Pérez" },
 *   fechaActualizacion: "2024-01-20T15:45:00",
 *   personalActualizador: { nombres: "María", apellidos: "García" }
 * }} />
 */
const AuditInfo = ({ data, style = {} }) => {
  // Si no hay datos, no renderizar nada
  if (!data) return null;

  const {
    fechaCreacion,
    fechaActualizacion,
    creadoPor,
    actualizadoPor,
    personalCreador: personalCreadorProp,
    personalActualizador: personalActualizadorProp,
  } = data;

  // Buscar personal por ID si no viene en el objeto
  const { personal: personalCreadorBuscado } = usePersonal(
    !personalCreadorProp && creadoPor ? creadoPor : null
  );
  const { personal: personalActualizadorBuscado } = usePersonal(
    !personalActualizadorProp && actualizadoPor ? actualizadoPor : null
  );

  // Usar el personal que venga en el prop o el buscado
  const personalCreador = personalCreadorProp || personalCreadorBuscado;
  const personalActualizador = personalActualizadorProp || personalActualizadorBuscado;

  const nombreCreador = obtenerNombreCompleto(personalCreador);
  const nombreActualizador = obtenerNombreCompleto(personalActualizador);

  return (
    <div
      style={{
        marginTop: 10,
        padding: 10,
        backgroundColor: "#f8f9fa",
        borderRadius: 5,
        border: "1px solid #dee2e6",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 20,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        {/* Información de Creación */}
        <div style={{ flex: 1 }}>
          <strong style={{ fontSize: "0.9rem", color: "#495057" }}>
            Creado:
          </strong>
          <div style={{ marginTop: 5 }}>
            <div style={{ fontSize: "0.85rem", color: "#6c757d" }}>
              {formatearFechaHora(fechaCreacion, "N/A")}
            </div>
            {nombreCreador && (
              <Tag
                value={nombreCreador}
                style={{
                  marginTop: 5,
                  backgroundColor: "#cfe2ff",
                  color: "#000",
                  fontSize: "0.8rem",
                }}
              />
            )}
          </div>
        </div>

        {/* Información de Actualización */}
        <div style={{ flex: 1 }}>
          <strong style={{ fontSize: "0.9rem", color: "#495057" }}>
            Actualizado:
          </strong>
          <div style={{ marginTop: 5 }}>
            <div style={{ fontSize: "0.85rem", color: "#6c757d" }}>
              {formatearFechaHora(fechaActualizacion, "N/A")}
            </div>
            {nombreActualizador && (
              <Tag
                value={nombreActualizador}
                style={{
                  marginTop: 5,
                  backgroundColor: "#f8d7da",
                  color: "#000",
                  fontSize: "0.8rem",
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditInfo;