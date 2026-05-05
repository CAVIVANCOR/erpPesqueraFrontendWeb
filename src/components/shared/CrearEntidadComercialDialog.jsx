// src/components/shared/CrearEntidadComercialDialog.jsx
/**
 * Componente genérico reutilizable para crear/editar EntidadComercial desde cualquier módulo
 * Sigue el patrón de componentes Dialog del ERP Megui
 * 
 * @author ERP Megui
 * @version 2.0.0
 */

import React, { useRef, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import EntidadComercialForm from "../entidadComercial/EntidadComercialForm";

/**
 * Dialog genérico para crear/editar EntidadComercial
 * 
 * @param {boolean} visible - Visibilidad del dialog
 * @param {function} onHide - Callback al cerrar el dialog
 * @param {number} empresaId - ID de la empresa (heredado del módulo padre)
 * @param {string} tipoEntidad - Tipo de entidad: 'proveedor' | 'cliente' | 'ambos'
 * @param {boolean} modoEdicion - Si está en modo edición (true) o creación (false)
 * @param {object} entidadData - Datos de la entidad a editar (null si es creación)
 * @param {function} onEntidadCreada - Callback cuando se crea/edita exitosamente (entidad) => void
 * @param {object} toast - Referencia al Toast del componente padre (opcional)
 * @param {object} defaultValues - Valores por defecto adicionales para EntidadComercial
 * @param {string} headerTitle - Título personalizado del dialog
 * @param {object} permisos - Permisos del usuario
 * @param {string} dialogWidth - Ancho del dialog (default: "95vw")
 * @param {string} dialogMaxWidth - Ancho máximo del dialog (default: "1400px")
 */
export default function CrearEntidadComercialDialog({
  visible,
  onHide,
  empresaId,
  tipoEntidad = "proveedor",
  modoEdicion = false,
  entidadData = null,
  onEntidadCreada,
  toast: toastProp,
  defaultValues = {},
  headerTitle,
  permisos = { puedeCrear: true, puedeEditar: true, puedeVer: true },
  dialogWidth = "95vw",
  dialogMaxWidth = "1400px",
}) {
  const toastLocal = useRef(null);
  const toastRef = toastProp || toastLocal;

  // ═══════════════════════════════════════════════════
  // EFECTO: Limpiar estados al cerrar (SOLO visible en dependencias)
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    // No hacemos nada al abrir, solo limpiamos al cerrar si es necesario
    // La lógica de apertura está en el Button, no aquí
  }, [visible]);

  // Determinar valores por defecto según modo
  const getDefaultEntidadValues = () => {
    // Si es modo edición, retornar datos cargados
    if (modoEdicion && entidadData) {
      return entidadData;
    }

    // Si es modo creación, retornar valores por defecto
    const base = {
      empresaId: empresaId,
      agrupacionEntidadId: 1, // Default: S/A
      estado: true,
      ...defaultValues,
    };

    switch (tipoEntidad) {
      case "proveedor":
        return { ...base, esProveedor: true, esCliente: false };
      case "cliente":
        return { ...base, esCliente: true, esProveedor: false };
      case "ambos":
        return { ...base, esCliente: true, esProveedor: true };
      default:
        return base;
    }
  };

  // Determinar título del dialog
  const getHeaderTitle = () => {
    if (headerTitle) return headerTitle;

    if (modoEdicion) {
      return "Editar Entidad Comercial";
    }
    
    switch (tipoEntidad) {
      case "proveedor":
        return "Crear Nuevo Proveedor";
      case "cliente":
        return "Crear Nuevo Cliente";
      case "ambos":
        return "Crear Nueva Entidad Comercial";
      default:
        return "Crear Entidad Comercial";
    }
  };

  // Callback cuando se guarda exitosamente
  const handleGuardar = (entidad) => {
    if (onEntidadCreada && typeof onEntidadCreada === "function") {
      onEntidadCreada(entidad);
    }
    onHide();
  };

  // Callback cuando se cancela
  const handleCancelar = () => {
    onHide();
  };

  return (
    <>
      <Dialog
        header={getHeaderTitle()}
        visible={visible}
        style={{ width: dialogWidth, maxWidth: dialogMaxWidth }}
        onHide={onHide}
        modal
        maximizable
        blockScroll
      >
        {!toastProp && <Toast ref={toastLocal} />}
        <EntidadComercialForm
          entidadComercial={getDefaultEntidadValues()}
          onGuardar={handleGuardar}
          onCancelar={handleCancelar}
          toast={toastRef}
          permisos={permisos}
        />
      </Dialog>
    </>
  );
}