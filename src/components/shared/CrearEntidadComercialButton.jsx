// src/components/shared/CrearEntidadComercialButton.jsx
/**
 * Componente wrapper que incluye botón + dialog para crear/editar EntidadComercial
 * Simplifica el uso cuando solo se necesita un botón simple
 *
 * @author ERP Megui
 * @version 2.0.0
 */

import React, { useState } from "react";
import { Button } from "primereact/button";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import CrearEntidadComercialDialog from "./CrearEntidadComercialDialog";
import { getEntidadComercialPorId } from "../../api/entidadComercial";

/**
 * Botón con Dialog integrado para crear/editar EntidadComercial
 *
 * @param {number} empresaId - ID de la empresa
 * @param {number} entidadComercialId - ID de la entidad seleccionada (null si no hay)
 * @param {string} tipoEntidad - 'proveedor' | 'cliente' | 'ambos'
 * @param {function} onEntidadCreada - Callback cuando se crea/edita (entidad) => void
 * @param {string} label - Texto del botón
 * @param {string} icon - Icono del botón (PrimeIcons)
 * @param {string} severity - Severidad del botón (info, success, warning, etc.)
 * @param {boolean} outlined - Si el botón es outlined
 * @param {boolean} disabled - Si el botón está deshabilitado
 * @param {string} className - Clases CSS adicionales
 * @param {string} tooltip - Texto del tooltip
 * @param {object} tooltipOptions - Opciones del tooltip
 * @param {object} toast - Referencia al Toast del padre
 * @param {object} defaultValues - Valores por defecto para EntidadComercial
 * @param {string} headerTitle - Título del dialog
 * @param {object} permisos - Permisos del usuario
 * @param {string} buttonStyle - Estilos inline del botón
 */
export default function CrearEntidadComercialButton({
  empresaId,
  entidadComercialId = null,
  tipoEntidad = "proveedor",
  onEntidadCreada,
  label,
  icon = "pi pi-building",
  severity = "info",
  outlined = true,
  disabled = false,
  className = "",
  tooltip,
  tooltipOptions = { position: "top" },
  toast,
  defaultValues,
  headerTitle,
  permisos,
  buttonStyle,
}) {
  const [visible, setVisible] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [entidadData, setEntidadData] = useState(null);
  const [loadingEntidad, setLoadingEntidad] = useState(false);

  // Determinar label por defecto según tipo
  const getDefaultLabel = () => {
    switch (tipoEntidad) {
      case "proveedor":
        return "Crear Proveedor";
      case "cliente":
        return "Crear Cliente";
      case "ambos":
        return "Crear Entidad";
      default:
        return "Crear";
    }
  };

  // Determinar tooltip por defecto
  const getDefaultTooltip = () => {
    switch (tipoEntidad) {
      case "proveedor":
        return "Abrir formulario para crear un nuevo proveedor";
      case "cliente":
        return "Abrir formulario para crear un nuevo cliente";
      case "ambos":
        return "Abrir formulario para crear una nueva entidad comercial";
      default:
        return "Crear entidad comercial";
    }
  };

  // ═══════════════════════════════════════════════════
  // LÓGICA DE APERTURA: Decidir si mostrar confirmación o formulario
  // ═══════════════════════════════════════════════════
  const handleClick = async () => {
    if (entidadComercialId) {
      // ✅ HAY ENTIDAD SELECCIONADA: Cargar datos y mostrar confirmación
      await cargarEntidadYConfirmar();
    } else {
      // ✅ NO HAY ENTIDAD SELECCIONADA: Abrir directamente en modo creación
      abrirDialogCreacion();
    }
  };

  // Cargar datos de la entidad y mostrar confirmación
  const cargarEntidadYConfirmar = async () => {
    setLoadingEntidad(true);
    try {
      const data = await getEntidadComercialPorId(entidadComercialId);
      setEntidadData(data);

      // Mostrar diálogo de confirmación
      confirmDialog({
        message: (
          <div>
            <p>Ya tiene seleccionada una entidad comercial:</p>
            <p style={{ marginTop: "10px", marginBottom: "10px" }}>
              <strong>{data.razonSocial || "Sin nombre"}</strong>
            </p>
            <p>
              {data.tipoDocumento?.descripcion || "RUC"}:{" "}
              {data.numeroDocumento || "N/A"}
            </p>
            <p style={{ marginTop: "15px" }}>¿Qué desea hacer?</p>
          </div>
        ),
        header: "Entidad Comercial Seleccionada",
        icon: "pi pi-question-circle",
        acceptLabel: "Crear Nueva",
        rejectLabel: "Editar Actual",
        acceptIcon: "pi pi-plus",
        rejectIcon: "pi pi-pencil",
        acceptClassName: "p-button-success",
        rejectClassName: "p-button-info",
        accept: abrirDialogCreacion,
        reject: abrirDialogEdicion,
      });
    } catch (error) {
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error?.response?.data?.message || "Error al cargar entidad comercial",
        life: 4000,
      });
    } finally {
      setLoadingEntidad(false);
    }
  };

  // Abrir dialog en modo creación
  const abrirDialogCreacion = () => {
    setModoEdicion(false);
    setEntidadData(null);
    setVisible(true);
  };

  // Abrir dialog en modo edición
  const abrirDialogEdicion = () => {
    setModoEdicion(true);
    // entidadData ya está cargada
    setVisible(true);
  };

  // Callback cuando se crea/edita una entidad
  const handleEntidadCreada = (entidad) => {
    // Limpiar estados ANTES de cerrar
    setModoEdicion(false);
    setEntidadData(null);
    setVisible(false);

    if (onEntidadCreada && typeof onEntidadCreada === "function") {
      onEntidadCreada(entidad);
    }
  };

  return (
    <>
      <Button
        type="button"
        label={label || getDefaultLabel()}
        icon={icon}
        severity={severity}
        outlined={outlined}
        onClick={handleClick}
        disabled={disabled || loadingEntidad}
        className={className}
        tooltip={tooltip || getDefaultTooltip()}
        tooltipOptions={tooltipOptions}
        style={buttonStyle}
      />

      <ConfirmDialog />

      <CrearEntidadComercialDialog
        visible={visible}
        onHide={() => setVisible(false)}
        empresaId={empresaId}
        tipoEntidad={tipoEntidad}
        modoEdicion={modoEdicion}
        entidadData={entidadData}
        onEntidadCreada={handleEntidadCreada}
        toast={toast}
        defaultValues={defaultValues}
        headerTitle={headerTitle}
        permisos={permisos}
      />
    </>
  );
}
