/**
 * PuntoGPSInput - Componente genérico reutilizable para captura de coordenadas GPS
 * Maneja Latitud + Longitud con sincronización bidireccional Decimal ↔ DMS
 * 
 * @author ERP Megui
 * @version 1.1.0
 */

import React, { useState, useEffect } from "react";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import {
  capturarGPS,
  descomponerDMS,
  convertirDMSADecimal,
} from "../../utils/gpsUtils";

/**
 * PuntoGPSInput Component
 * 
 * @param {Object} props
 * @param {string} props.labelLatitud - Label para latitud (ej: "Latitud Descarga")
 * @param {string} props.labelLongitud - Label para longitud (ej: "Longitud Descarga")
 * @param {string} props.labelBotonGPS - Label del botón GPS (ej: "Capturar GPS Inicio Retorno")
 * 
 * // Opción 1: Con react-hook-form
 * @param {string} props.fieldNameLatitud - Nombre del campo latitud en formulario
 * @param {string} props.fieldNameLongitud - Nombre del campo longitud en formulario
 * @param {Object} props.control - Control de react-hook-form
 * @param {Function} props.setValue - setValue de react-hook-form
 * @param {Function} props.watch - watch de react-hook-form
 * 
 * // Opción 2: Con useState
 * @param {number} props.latitudValue - Valor de latitud (decimal)
 * @param {number} props.longitudValue - Valor de longitud (decimal)
 * @param {Function} props.onLatitudChange - Callback cuando cambia latitud
 * @param {Function} props.onLongitudChange - Callback cuando cambia longitud
 * 
 * // Callbacks
 * @param {Function} props.onGPSCapture - Callback al capturar GPS: ({ latitud, longitud, accuracy }) => Promise<void>
 * @param {Function} props.onLatitudDecimalChange - Callback cuando cambia latitud decimal
 * @param {Function} props.onLongitudDecimalChange - Callback cuando cambia longitud decimal
 * 
 * // Estados
 * @param {boolean} props.readOnly - Solo lectura (default: false)
 * @param {boolean} props.disabled - Deshabilitado (default: false)
 * @param {boolean} props.loading - Loading externo (default: false)
 * @param {boolean} props.mostrarDMS - Mostrar inputs DMS (default: true)
 * @param {boolean} props.mostrarBotonGPS - Mostrar botón GPS (default: true)
 * 
 * // Estilos
 * @param {string} props.className - Clases CSS adicionales
 * @param {Object} props.style - Estilos personalizados
 */
const PuntoGPSInput = ({
  labelLatitud = "Latitud",
  labelLongitud = "Longitud",
  labelBotonGPS = "Capturar GPS",
  colorBoton = "info", // info, success, warning, danger, help, secondary

  // react-hook-form
  fieldNameLatitud,
  fieldNameLongitud,
  control,
  setValue,
  watch,

  // useState
  latitudValue,
  longitudValue,
  onLatitudChange,
  onLongitudChange,

  // Callbacks
  onGPSCapture,
  onLatitudDecimalChange,
  onLongitudDecimalChange,

  // Estados
  readOnly = false,
  disabled = false,
  loading = false,
  mostrarDMS = true,
  mostrarBotonGPS = true,

  // Estilos
  className = "",
  style = {},
}) => {
  // ========== ESTADOS INTERNOS ==========

  // Estados DMS para Latitud
  const [latGrados, setLatGrados] = useState(0);
  const [latMinutos, setLatMinutos] = useState(0);
  const [latSegundos, setLatSegundos] = useState(0);
  const [latDireccion, setLatDireccion] = useState("S");

  // Estados DMS para Longitud
  const [lonGrados, setLonGrados] = useState(0);
  const [lonMinutos, setLonMinutos] = useState(0);
  const [lonSegundos, setLonSegundos] = useState(0);
  const [lonDireccion, setLonDireccion] = useState("W");

  // Estado de loading GPS
  const [loadingGPS, setLoadingGPS] = useState(false);

  // Flag para evitar sincronización durante edición manual
  const [editandoManualmente, setEditandoManualmente] = useState(false);

  // ========== VALORES CONTROLADOS ==========

  const latitudActual = fieldNameLatitud && watch
    ? watch(fieldNameLatitud)
    : latitudValue ?? 0;

  const longitudActual = fieldNameLongitud && watch
    ? watch(fieldNameLongitud)
    : longitudValue ?? 0;

  // ========== SINCRONIZACIÓN DECIMAL → DMS ==========

  // Latitud Decimal → DMS (solo si NO está editando manualmente)
  useEffect(() => {
    if (editandoManualmente) return; // Evitar sobrescritura durante edición

    if (
      latitudActual !== "" &&
      latitudActual !== null &&
      latitudActual !== undefined &&
      latitudActual !== 0
    ) {
      const dms = descomponerDMS(Number(latitudActual), true);
      setLatGrados(dms.grados);
      setLatMinutos(dms.minutos);
      setLatSegundos(parseFloat(dms.segundos.toFixed(2))); // 2 decimales
      setLatDireccion(dms.direccion);
    }
  }, [latitudActual, editandoManualmente]);

  // Longitud Decimal → DMS (solo si NO está editando manualmente)
  useEffect(() => {
    if (editandoManualmente) return; // Evitar sobrescritura durante edición

    if (
      longitudActual !== "" &&
      longitudActual !== null &&
      longitudActual !== undefined &&
      longitudActual !== 0
    ) {
      const dms = descomponerDMS(Number(longitudActual), false);
      setLonGrados(dms.grados);
      setLonMinutos(dms.minutos);
      setLonSegundos(parseFloat(dms.segundos.toFixed(2))); // 2 decimales
      setLonDireccion(dms.direccion);
    }
  }, [longitudActual, editandoManualmente]);

  // ========== ACTUALIZAR DECIMAL DESDE DMS ==========

  const actualizarLatitudDesdeDMS = () => {
    setEditandoManualmente(false); // Permitir sincronización nuevamente

    const decimal = convertirDMSADecimal(
      latGrados,
      latMinutos,
      latSegundos,
      latDireccion
    );

    // Actualizar según modo
    if (fieldNameLatitud && setValue) {
      setValue(fieldNameLatitud, decimal);
    } else if (onLatitudChange) {
      onLatitudChange(decimal);
    }

    // Callback adicional
    onLatitudDecimalChange?.(decimal);
  };

  const actualizarLongitudDesdeDMS = () => {
    setEditandoManualmente(false); // Permitir sincronización nuevamente

    const decimal = convertirDMSADecimal(
      lonGrados,
      lonMinutos,
      lonSegundos,
      lonDireccion
    );

    // Actualizar según modo
    if (fieldNameLongitud && setValue) {
      setValue(fieldNameLongitud, decimal);
    } else if (onLongitudChange) {
      onLongitudChange(decimal);
    }

    // Callback adicional
    onLongitudDecimalChange?.(decimal);
  };

  // ========== CAPTURAR GPS ==========

  const handleCapturarGPS = async () => {
    setLoadingGPS(true);

    try {
      await capturarGPS(
        async (latitude, longitude, accuracy) => {
          // Actualizar latitud
          if (fieldNameLatitud && setValue) {
            setValue(fieldNameLatitud, latitude);
          } else if (onLatitudChange) {
            onLatitudChange(latitude);
          }

          // Actualizar longitud
          if (fieldNameLongitud && setValue) {
            setValue(fieldNameLongitud, longitude);
          } else if (onLongitudChange) {
            onLongitudChange(longitude);
          }

          // Callback custom del padre
          await onGPSCapture?.({
            latitud: latitude,
            longitud: longitude,
            accuracy: accuracy,
          });
        },
        (errorMessage) => {
          // El padre maneja el error mediante onGPSCapture
          console.error("Error capturando GPS:", errorMessage);
        }
      );
    } finally {
      setLoadingGPS(false);
    }
  };

  // ========== RENDER ==========

  const isDisabled = disabled || loading || readOnly;
  const isResponsive = window.innerWidth < 768;

  return (
    <div className={className} style={style}>
      {/* LATITUD */}
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="latitud-decimal" style={{ fontWeight: "bold", marginBottom: "0.5rem", display: "block" }}>
          {labelLatitud}
        </label>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: "0.5rem",
            flexDirection: isResponsive ? "column" : "row",
          }}
        >
          {/* Input Decimal Latitud */}
          <div style={{ flex: 1 }}>
            <InputNumber
              id="latitud-decimal"
              value={latitudActual}
              onValueChange={(e) => {
                if (fieldNameLatitud && setValue) {
                  setValue(fieldNameLatitud, e.value);
                } else if (onLatitudChange) {
                  onLatitudChange(e.value);
                }
                onLatitudDecimalChange?.(e.value);
              }}
              disabled={isDisabled}
              mode="decimal"
              minFractionDigits={6}
              maxFractionDigits={8}
              placeholder="Decimal"
              style={{ width: "100%", fontSize: "16px" }}
            />
          </div>

          {/* Inputs DMS Latitud */}
          {mostrarDMS && (
            <div style={{ flex: 1, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="number"
                value={latGrados}
                onChange={(e) => {
                  setEditandoManualmente(true);
                  setLatGrados(Number(e.target.value) || 0);
                }}
                onBlur={actualizarLatitudDesdeDMS}
                onFocus={(e) => e.target.select()}
                disabled={isDisabled}
                placeholder="°"
                style={{
                  width: isResponsive ? "70px" : "80px",
                  padding: "10px",
                  border: "2px solid #059669",
                  borderRadius: "6px",
                  textAlign: "center",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              />
              <span style={{ fontSize: "18px", fontWeight: "bold" }}>°</span>

              <input
                type="number"
                value={latMinutos}
                onChange={(e) => {
                  setEditandoManualmente(true);
                  const val = Number(e.target.value) || 0;
                  setLatMinutos(Math.min(59, Math.max(0, val)));
                }}
                onBlur={actualizarLatitudDesdeDMS}
                onFocus={(e) => e.target.select()}
                disabled={isDisabled}
                placeholder="'"
                style={{
                  width: isResponsive ? "70px" : "80px",
                  padding: "10px",
                  border: "2px solid #059669",
                  borderRadius: "6px",
                  textAlign: "center",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              />
              <span style={{ fontSize: "18px", fontWeight: "bold" }}>'</span>

              <input
                type="number"
                value={latSegundos}
                onChange={(e) => {
                  setEditandoManualmente(true);
                  const val = parseFloat(e.target.value) || 0;
                  setLatSegundos(Math.min(59.99, Math.max(0, val)));
                }}
                onBlur={actualizarLatitudDesdeDMS}
                onFocus={(e) => e.target.select()}
                disabled={isDisabled}
                placeholder='"'
                step="0.01"
                style={{
                  width: isResponsive ? "80px" : "90px",
                  padding: "10px",
                  border: "2px solid #059669",
                  borderRadius: "6px",
                  textAlign: "center",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              />
              <span style={{ fontSize: "18px", fontWeight: "bold" }}>"</span>

              <Dropdown
                value={latDireccion}
                options={[
                  { label: "S", value: "S" },
                  { label: "N", value: "N" },
                ]}
                onChange={(e) => {
                  setLatDireccion(e.value);
                  actualizarLatitudDesdeDMS();
                }}
                disabled={isDisabled}
                style={{ width: isResponsive ? "70px" : "80px", fontSize: "16px" }}
              />
            </div>
          )}
        </div>
      </div>

      {/* LONGITUD */}
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="longitud-decimal" style={{ fontWeight: "bold", marginBottom: "0.5rem", display: "block" }}>
          {labelLongitud}
        </label>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: "0.5rem",
            flexDirection: isResponsive ? "column" : "row",
          }}
        >
          {/* Input Decimal Longitud */}
          <div style={{ flex: 1 }}>
            <InputNumber
              id="longitud-decimal"
              value={longitudActual}
              onValueChange={(e) => {
                if (fieldNameLongitud && setValue) {
                  setValue(fieldNameLongitud, e.value);
                } else if (onLongitudChange) {
                  onLongitudChange(e.value);
                }
                onLongitudDecimalChange?.(e.value);
              }}
              disabled={isDisabled}
              mode="decimal"
              minFractionDigits={6}
              maxFractionDigits={8}
              placeholder="Decimal"
              style={{ width: "100%", fontSize: "16px" }}
            />
          </div>

          {/* Inputs DMS Longitud */}
          {mostrarDMS && (
            <div style={{ flex: 1, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="number"
                value={lonGrados}
                onChange={(e) => {
                  setEditandoManualmente(true);
                  setLonGrados(Number(e.target.value) || 0);
                }}
                onBlur={actualizarLongitudDesdeDMS}
                onFocus={(e) => e.target.select()}
                disabled={isDisabled}
                placeholder="°"
                style={{
                  width: isResponsive ? "70px" : "80px",
                  padding: "10px",
                  border: "2px solid #2563eb",
                  borderRadius: "6px",
                  textAlign: "center",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              />
              <span style={{ fontSize: "18px", fontWeight: "bold" }}>°</span>

              <input
                type="number"
                value={lonMinutos}
                onChange={(e) => {
                  setEditandoManualmente(true);
                  const val = Number(e.target.value) || 0;
                  setLonMinutos(Math.min(59, Math.max(0, val)));
                }}
                onBlur={actualizarLongitudDesdeDMS}
                onFocus={(e) => e.target.select()}
                disabled={isDisabled}
                placeholder="'"
                style={{
                  width: isResponsive ? "70px" : "80px",
                  padding: "10px",
                  border: "2px solid #2563eb",
                  borderRadius: "6px",
                  textAlign: "center",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              />
              <span style={{ fontSize: "18px", fontWeight: "bold" }}>'</span>

              <input
                type="number"
                value={lonSegundos}
                onChange={(e) => {
                  setEditandoManualmente(true);
                  const val = parseFloat(e.target.value) || 0;
                  setLonSegundos(Math.min(59.99, Math.max(0, val)));
                }}
                onBlur={actualizarLongitudDesdeDMS}
                onFocus={(e) => e.target.select()}
                disabled={isDisabled}
                placeholder='"'
                step="0.01"
                style={{
                  width: isResponsive ? "80px" : "90px",
                  padding: "10px",
                  border: "2px solid #2563eb",
                  borderRadius: "6px",
                  textAlign: "center",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              />
              <span style={{ fontSize: "18px", fontWeight: "bold" }}>"</span>

              <Dropdown
                value={lonDireccion}
                options={[
                  { label: "W", value: "W" },
                  { label: "E", value: "E" },
                ]}
                onChange={(e) => {
                  setLonDireccion(e.value);
                  actualizarLongitudDesdeDMS();
                }}
                disabled={isDisabled}
                style={{ width: isResponsive ? "70px" : "80px", fontSize: "16px" }}
              />
            </div>
          )}
        </div>
      </div>

      {/* BOTÓN GPS */}
      {mostrarBotonGPS && (
        <Button
          type="button"
          label={labelBotonGPS}
          icon="pi pi-map-marker"
          onClick={handleCapturarGPS}
          loading={loadingGPS}
          disabled={isDisabled}
          className={`p-button-${colorBoton}`}
          style={{ width: "100%", fontSize: "16px", padding: "12px" }}
        />
      )}
    </div>
  );
};

export default PuntoGPSInput;