/**
 * Componente genérico para generación de Kardex
 * Patrón: Reutiliza estructura de diálogos existentes en el proyecto
 * Compatible con: OrdenCompra, PreFactura, NotaCredito, NotaDebito
 * 
 * FLUJO:
 * 1. Usuario selecciona almacén, concepto, fechas, lote, estados, direcciones
 * 2. Backend crea MovimientoAlmacen básico (PENDIENTE) con misma serie
 * 3. Redirige a edición para ajustes individuales por producto
 * 4. Usuario cierra y genera kardex con flujo profesional existente
 */

import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Message } from "primereact/message";
import { Divider } from "primereact/divider";
import { getKardexConfig } from "./kardexConfig";
import { useKardexConfig } from "./useKardexConfig";

export default function GenerarKardexDialog({
  visible,
  onHide,
  tipoDocumento,
  documentoId,
  numeroDocumento,
  serieDocumento, // ⭐ NUEVO: Serie del documento origen
  entidadComercial,
  entidadComercialId, // ⭐ NUEVO: ID de proveedor/cliente
  totalItems,
  empresaId,
  empresaEntidadComercialId, // ⭐ NUEVO: ID de entidad comercial de la empresa
  onGenerar,
  loading: externalLoading = false,
}) {
  // Obtener configuración según tipo de documento
  const config = getKardexConfig(tipoDocumento);
  console.log("GenerarKardexDialog config", config)
  // Cargar datos necesarios (almacenes, conceptos, estados, direcciones)
  const {
    almacenes,
    conceptos,
    estadosMercaderia,
    estadosCalidad,
    direccionesOrigen,
    direccionesDestino,
    loading: loadingData,
  } = useKardexConfig(
    empresaId,
    config.tipoConceptoId,
    config.tipoMovimientoId,
    config.tipoMovimiento, // "INGRESO" o "SALIDA"
    entidadComercialId, // Proveedor o Cliente
    empresaEntidadComercialId, // Mi empresa
    visible
  );

  // Estado del formulario
  const [formData, setFormData] = useState({
    almacenId: null,
    conceptoMovAlmacenId: null,
    fechaDocumento: new Date(),
    dirOrigenId: null,
    dirDestinoId: null,
    fechaIngreso: new Date(),
    fechaVencimiento: null,
    lote: "",
    estadoId: 6, // Default: LIBERADO
    estadoCalidadId: 10, // Default: CALIDAD A
    observaciones: "",
  });

  // Resetear formulario al abrir
  useEffect(() => {
    if (visible) {
      setFormData({
        almacenId: null,
        conceptoMovAlmacenId: null,
        fechaDocumento: new Date(),
        dirOrigenId: null,
        dirDestinoId: null,
        fechaIngreso: new Date(),
        fechaVencimiento: null,
        lote: "",
        estadoId: 6, // LIBERADO
        estadoCalidadId: 10, // CALIDAD A
        observaciones: `${config.tipoMovimiento === "INGRESO" ? "Ingreso" : "Salida"} por ${numeroDocumento || "documento"}`,
      });
    }
  }, [visible, numeroDocumento, config.tipoMovimiento]);

  // ⭐ PRESELECCIONAR estados cuando se cargan los datos
  useEffect(() => {
    if (visible && estadosMercaderia.length > 0 && !formData.estadoId) {
      setFormData(prev => ({ ...prev, estadoId: 6 })); // LIBERADO
    }
  }, [visible, estadosMercaderia, formData.estadoId]);

  useEffect(() => {
    if (visible && estadosCalidad.length > 0 && !formData.estadoCalidadId) {
      setFormData(prev => ({ ...prev, estadoCalidadId: 10 })); // CALIDAD A
    }
  }, [visible, estadosCalidad, formData.estadoCalidadId]);
  // Handlers
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerar = () => {
    // Validaciones
    if (!formData.almacenId) {
      return;
    }

    if (!formData.conceptoMovAlmacenId) {
      return;
    }

    if (!formData.fechaDocumento) {
      return;
    }

    if (!formData.dirOrigenId) {
      return;
    }

    if (!formData.fechaIngreso) {
      return;
    }

    if (!formData.estadoId) {
      return;
    }

    if (!formData.estadoCalidadId) {
      return;
    }

    // Llamar callback con datos completos
    onGenerar({
      almacenId: formData.almacenId,
      conceptoMovAlmacenId: formData.conceptoMovAlmacenId,
      fechaDocumento: formData.fechaDocumento,
      dirOrigenId: formData.dirOrigenId,
      dirDestinoId: formData.dirDestinoId,
      fechaIngreso: formData.fechaIngreso,
      fechaVencimiento: formData.fechaVencimiento,
      lote: formData.lote || null,
      estadoId: formData.estadoId,
      estadoCalidadId: formData.estadoCalidadId,
      observaciones: formData.observaciones,
    });
  };

  // Templates
  const almacenOptionTemplate = (option) => {
    return (
      <div>
        <strong>{option.nombre}</strong>
        {option.descripcion && (
          <div style={{ fontSize: "0.85em", color: "#666" }}>
            {option.descripcion}
          </div>
        )}
      </div>
    );
  };

  const conceptoOptionTemplate = (option) => {
    return (
      <div>
        <strong>{option.descripcion}</strong>
        {option.descripcionArmada && (
          <div style={{ fontSize: "0.85em", color: "#666" }}>
            {option.descripcionArmada}
          </div>
        )}
      </div>
    );
  };

  const direccionOptionTemplate = (option) => {
    return (
      <div>
        <strong>{option.direccion}</strong>
        {option.entidadComercial && (
          <div style={{ fontSize: "0.85em", color: "#666" }}>
            {option.entidadComercial.razonSocial}
          </div>
        )}
      </div>
    );
  };

  const footer = (
    <div>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        onClick={onHide}
        className="p-button-text"
        disabled={externalLoading}
      />
      <Button
        label="Crear Movimiento"
        icon="pi pi-check"
        onClick={handleGenerar}
        className="p-button-success"
        disabled={
          !formData.almacenId ||
          !formData.conceptoMovAlmacenId ||
          !formData.fechaDocumento ||
          !formData.dirOrigenId ||
          !formData.fechaIngreso ||
          !formData.estadoId ||
          !formData.estadoCalidadId ||
          externalLoading ||
          loadingData
        }
        loading={externalLoading}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={config.tituloDialog}
      footer={footer}
      style={{ width: "700px", maxHeight: "90vh" }}
      modal
      closable={!externalLoading}
      blockScroll
    >
      <div style={{ display: "grid", gap: "1.5rem" }}>
        {/* Información del documento */}
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #dee2e6",
          }}
        >
          <h4 style={{ margin: "0 0 0.5rem 0", color: "#495057" }}>
            📋 Documento Origen
          </h4>
          <div style={{ fontSize: "0.95rem", color: "#6c757d" }}>
            <div>
              <strong>Documento:</strong> {numeroDocumento || "N/A"}
            </div>
            <div>
              <strong>Serie:</strong> {serieDocumento || "N/A"}
            </div>
            <div>
              <strong>Entidad:</strong> {entidadComercial || "N/A"}
            </div>
            <div>
              <strong>Total items:</strong> {totalItems || 0}
            </div>
          </div>
        </div>

        {/* Tipo de operación */}
        <Message
          severity={config.colorOperacion}
          text={`Tipo de Operación: ${config.tipoMovimiento} - ${config.efectoStock} el stock`}
          style={{ width: "100%" }}
        />

        <Divider align="left">
          <span style={{ fontWeight: "bold" }}>1. Datos Generales</span>
        </Divider>

        {/* Almacén */}
        <div>
          <label
            htmlFor="almacen"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
            {config.labelAlmacen} <span style={{ color: "red" }}>*</span>
          </label>
          <Dropdown
            id="almacen"
            value={formData.almacenId}
            options={almacenes}
            onChange={(e) => handleChange("almacenId", e.value)}
            optionLabel="nombre"
            optionValue="id"
            placeholder={config.placeholderAlmacen}
            filter
            showClear
            style={{ width: "100%" }}
            itemTemplate={almacenOptionTemplate}
            disabled={loadingData || externalLoading}
            emptyMessage="No hay almacenes disponibles"
          />
        </div>

        {/* Concepto */}
        <div>
          <label
            htmlFor="concepto"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
            {config.labelConcepto} <span style={{ color: "red" }}>*</span>
          </label>
          <Dropdown
            id="concepto"
            value={formData.conceptoMovAlmacenId}
            options={conceptos}
            onChange={(e) => handleChange("conceptoMovAlmacenId", e.value)}
            optionLabel="descripcion"
            optionValue="id"
            placeholder={config.placeholderConcepto}
            filter
            showClear
            style={{ width: "100%" }}
            itemTemplate={conceptoOptionTemplate}
            disabled={loadingData || externalLoading}
            emptyMessage="No hay conceptos disponibles"
          />
          <small style={{ color: "#6c757d", fontSize: "0.85rem" }}>
            Filtrados por: {config.tipoConceptoId === 1 ? "COMPRA" : "VENTA"} +{" "}
            {config.tipoMovimientoId === 1 ? "INGRESO" : "SALIDA"}
          </small>
        </div>

        {/* Fecha Documento */}
        <div>
          <label
            htmlFor="fecha"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
            Fecha del Movimiento <span style={{ color: "red" }}>*</span>
          </label>
          <Calendar
            id="fecha"
            value={formData.fechaDocumento}
            onChange={(e) => handleChange("fechaDocumento", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            style={{ width: "100%" }}
            disabled={externalLoading}
          />
        </div>

        <Divider align="left">
          <span style={{ fontWeight: "bold" }}>2. Direcciones</span>
        </Divider>

        {/* Dirección Origen */}
        <div>
          <label
            htmlFor="dirOrigen"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
            Dirección Origen <span style={{ color: "red" }}>*</span>
          </label>
          <Dropdown
            id="dirOrigen"
            value={formData.dirOrigenId}
            options={direccionesOrigen}
            onChange={(e) => handleChange("dirOrigenId", e.value)}
            optionLabel="direccion"
            optionValue="id"
            placeholder={
              config.tipoMovimiento === "INGRESO"
                ? "Seleccione dirección del proveedor"
                : "Seleccione dirección de mi empresa"
            }
            filter
            showClear
            style={{ width: "100%" }}
            itemTemplate={direccionOptionTemplate}
            disabled={loadingData || externalLoading}
            emptyMessage="No hay direcciones disponibles"
          />
          <small style={{ color: "#6c757d", fontSize: "0.85em" }}>
            {config.tipoMovimiento === "INGRESO"
              ? "Desde donde provienen los bienes (proveedor)"
              : "Desde donde salen los bienes (mi empresa)"}
          </small>
        </div>

        {/* Dirección Destino */}
        <div>
          <label
            htmlFor="dirDestino"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
            Dirección Destino (Opcional)
          </label>
          <Dropdown
            id="dirDestino"
            value={formData.dirDestinoId}
            options={direccionesDestino}
            onChange={(e) => handleChange("dirDestinoId", e.value)}
            optionLabel="direccion"
            optionValue="id"
            placeholder={
              config.tipoMovimiento === "INGRESO"
                ? "Seleccione dirección de mi empresa"
                : "Seleccione dirección del cliente"
            }
            filter
            showClear
            style={{ width: "100%" }}
            itemTemplate={direccionOptionTemplate}
            disabled={loadingData || externalLoading}
            emptyMessage="No hay direcciones disponibles"
          />
          <small style={{ color: "#6c757d", fontSize: "0.85em" }}>
            {config.tipoMovimiento === "INGRESO"
              ? "Donde se recibirán los bienes (mi empresa)"
              : "Donde se entregarán los bienes (cliente). Opcional para exportaciones."}
          </small>
        </div>

        <Divider align="left">
          <span style={{ fontWeight: "bold" }}>
            3. Datos de Detalles (se copian a TODOS los ítems)
          </span>
        </Divider>

        {/* Fecha de Ingreso */}
        <div>
          <label
            htmlFor="fechaIngreso"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
            Fecha de Ingreso <span style={{ color: "red" }}>*</span>
          </label>
          <Calendar
            id="fechaIngreso"
            value={formData.fechaIngreso}
            onChange={(e) => handleChange("fechaIngreso", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            style={{ width: "100%" }}
            disabled={externalLoading}
          />
          <small style={{ color: "#6c757d", fontSize: "0.85em" }}>
            Se aplicará a todos los productos
          </small>
        </div>

        {/* Fecha de Vencimiento */}
        <div>
          <label
            htmlFor="fechaVencimiento"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
            Fecha de Vencimiento (Opcional)
          </label>
          <Calendar
            id="fechaVencimiento"
            value={formData.fechaVencimiento}
            onChange={(e) => handleChange("fechaVencimiento", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            showButtonBar
            style={{ width: "100%" }}
            disabled={externalLoading}
          />
          <small style={{ color: "#6c757d", fontSize: "0.85em" }}>
            Se aplicará a todos los productos (puede dejarse vacío)
          </small>
        </div>

        {/* Lote */}
        <div>
          <label
            htmlFor="lote"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
            Lote (Opcional)
          </label>
          <InputText
            id="lote"
            value={formData.lote}
            onChange={(e) => handleChange("lote", e.target.value.toUpperCase())}
            style={{ width: "100%", textTransform: "uppercase" }}
            placeholder="Ej: LOTE-2026-001"
            disabled={externalLoading}
          />
          <small style={{ color: "#6c757d", fontSize: "0.85em" }}>
            Se aplicará a todos los productos (puede dejarse vacío)
          </small>
        </div>

        {/* Estado Mercadería */}
        <div>
          <label
            htmlFor="estadoId"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
            Estado Mercadería <span style={{ color: "red" }}>*</span>
          </label>
          <Dropdown
            id="estadoId"
            value={formData.estadoId}
            options={estadosMercaderia}
            onChange={(e) => handleChange("estadoId", e.value)}
            optionLabel="descripcion"
            optionValue="id"
            placeholder="Seleccione estado"
            style={{ width: "100%" }}
            disabled={loadingData || externalLoading}
            emptyMessage="No hay estados disponibles"
          />
          <small style={{ color: "#6c757d", fontSize: "0.85em" }}>
            Se aplicará a todos los productos (default: LIBERADO)
          </small>
        </div>

        {/* Estado Calidad */}
        <div>
          <label
            htmlFor="estadoCalidadId"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
            Estado Calidad <span style={{ color: "red" }}>*</span>
          </label>
          <Dropdown
            id="estadoCalidadId"
            value={formData.estadoCalidadId}
            options={estadosCalidad}
            onChange={(e) => handleChange("estadoCalidadId", e.value)}
            optionLabel="descripcion"
            optionValue="id"
            placeholder="Seleccione calidad"
            style={{ width: "100%" }}
            disabled={loadingData || externalLoading}
            emptyMessage="No hay estados de calidad disponibles"
          />
          <small style={{ color: "#6c757d", fontSize: "0.85em" }}>
            Se aplicará a todos los productos (default: CALIDAD A)
          </small>
        </div>

        <Divider align="left">
          <span style={{ fontWeight: "bold" }}>4. Observaciones</span>
        </Divider>

        {/* Observaciones */}
        <div>
          <label
            htmlFor="observaciones"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
            Observaciones
          </label>
          <InputTextarea
            id="observaciones"
            value={formData.observaciones}
            onChange={(e) => handleChange("observaciones", e.target.value)}
            rows={3}
            style={{ width: "100%", textTransform: "uppercase" }}
            disabled={externalLoading}
          />
        </div>

        {/* Nota informativa */}
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#fff3cd",
            borderRadius: "8px",
            border: "1px solid #ffc107",
          }}
        >
          <h4 style={{ margin: "0 0 0.5rem 0", color: "#856404" }}>
            ℹ️ Información Importante
          </h4>
          <ul style={{ margin: 0, paddingLeft: "1.5rem", fontSize: "0.9rem", color: "#856404" }}>
            <li>
              Se creará un <strong>MovimientoAlmacen</strong> con serie <strong>{serieDocumento}</strong> (misma que el documento origen)
            </li>
            <li>
              Los valores de fechas, lote y estados se <strong>copiarán a TODOS los productos</strong>
            </li>
            <li>
              Podrás <strong>editar individualmente</strong> cada producto después de crear el movimiento
            </li>
            <li>
              Deberás <strong>CERRAR</strong> el movimiento y luego <strong>GENERAR KARDEX</strong>
            </li>
          </ul>
        </div>
      </div>
    </Dialog>
  );
}