/**
 * DetMovsEntregaRendirForm.jsx
 *
 * Formulario para crear y editar registros de DetMovsEntregaRendir.
 * Implementa validaciones y sigue el patrón estándar MEGUI.
 * Aplica la regla crítica de usar Number() para comparaciones de IDs.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import DocumentoCapture from "../shared/DocumentoCapture";
import PDFViewer from "../shared/PDFViewer";
import { abrirPdfEnNuevaPestana } from "../../utils/pdfUtils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import {
  crearDetMovsEntregaRendir,
  actualizarDetMovsEntregaRendir,
} from "../../api/detMovsEntregaRendir";
import { getModulos } from "../../api/moduloSistema";

const DetMovsEntregaRendirForm = ({
  movimiento = null,
  entregaARendirId,
  personal = [],
  centrosCosto = [],
  tiposMovimiento = [],
  onGuardadoExitoso,
  onCancelar,
}) => {
  const toast = useRef(null);
  const isEditing = !!movimiento;
  const { usuario } = useAuthStore();

  // Estados para captura de comprobante
  const [mostrarCaptura, setMostrarCaptura] = useState(false);
  
  // Estados para módulos del sistema
  const [modulosPescaIndustrial, setModulosPescaIndustrial] = useState(null);

  // Configuración del formulario con react-hook-form
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      entregaARendirId: entregaARendirId || "",
      responsableId: "",
      fechaMovimiento: new Date(),
      tipoMovimientoId: "",
      centroCostoId: "",
      monto: 0,
      descripcion: "",
      urlComprobanteMovimiento: "",
      validadoTesoreria: false,
      fechaValidacionTesoreria: null,
      operacionSinFactura: false,
      fechaOperacionMovCaja: null,
      operacionMovCajaId: null,
      moduloOrigenMovCajaId: 2, // Valor automático para "PESCA INDUSTRIAL"
    },
  });

  // Observar cambios en urlComprobanteMovimiento
  const urlComprobanteMovimiento = watch("urlComprobanteMovimiento");

  // Observar cambios en validadoTesoreria
  const validadoTesoreria = watch("validadoTesoreria");

  // Observar cambios en los nuevos campos
  const operacionSinFactura = watch("operacionSinFactura");
  const fechaOperacionMovCaja = watch("fechaOperacionMovCaja");
  const operacionMovCajaId = watch("operacionMovCajaId");
  const moduloOrigenMovCajaId = watch("moduloOrigenMovCajaId");

  // Cargar datos del registro en edición
  useEffect(() => {
    if (isEditing && movimiento) {
      reset({
        entregaARendirId: Number(movimiento.entregaARendirId),
        responsableId: movimiento.responsableId
          ? Number(movimiento.responsableId)
          : null,
        fechaMovimiento: movimiento.fechaMovimiento
          ? new Date(movimiento.fechaMovimiento)
          : new Date(),
        tipoMovimientoId: movimiento.tipoMovimientoId
          ? Number(movimiento.tipoMovimientoId)
          : null,
        centroCostoId: movimiento.centroCostoId
          ? Number(movimiento.centroCostoId)
          : null,
        monto: Number(movimiento.monto) || 0,
        descripcion: movimiento.descripcion || "",
        urlComprobanteMovimiento: movimiento.urlComprobanteMovimiento || "",
        validadoTesoreria: movimiento.validadoTesoreria || false,
        fechaValidacionTesoreria: movimiento.fechaValidacionTesoreria || null,
        operacionSinFactura: movimiento.operacionSinFactura || false,
        fechaOperacionMovCaja: movimiento.fechaOperacionMovCaja ? new Date(movimiento.fechaOperacionMovCaja) : null,
        operacionMovCajaId: movimiento.operacionMovCajaId ? Number(movimiento.operacionMovCajaId) : null,
        moduloOrigenMovCajaId: movimiento.moduloOrigenMovCajaId ? Number(movimiento.moduloOrigenMovCajaId) : 2,
      });
    } else {
      // Para nuevo registro, establecer entregaARendirId y asignar responsable automáticamente
      setValue("entregaARendirId", Number(entregaARendirId));
      setValue("fechaMovimiento", new Date());
      setValue("moduloOrigenMovCajaId", 2); // Establecer valor por defecto para PESCA INDUSTRIAL
      
      // Asignar automáticamente el responsable basado en el usuario logueado
      if (usuario?.personalId) {
        setValue("responsableId", Number(usuario.personalId));
        
        // Mostrar toast informativo después de un breve delay
        setTimeout(() => {
          toast.current?.show({
            severity: "info",
            summary: "Responsable Asignado",
            detail: "Se ha asignado automáticamente como responsable del movimiento",
            life: 3000,
          });
        }, 500);
      }
    }
  }, [movimiento, isEditing, entregaARendirId, reset, setValue, usuario]);

  // Cargar módulo "PESCA INDUSTRIAL" al montar el componente
  useEffect(() => {
    const cargarModuloPescaIndustrial = async () => {
      try {
        const modulos = await getModulos();
        const moduloPesca = modulos.find(m => m.nombre === "PESCA INDUSTRIAL");
        if (moduloPesca) {
          setModulosPescaIndustrial(moduloPesca);
          // Solo establecer el valor si no estamos editando
          if (!isEditing) {
            setValue("moduloOrigenMovCajaId", Number(moduloPesca.id));
          }
        }
      } catch (error) {
        console.error("Error al cargar módulo PESCA INDUSTRIAL:", error);
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "No se pudo cargar el módulo PESCA INDUSTRIAL",
          life: 3000,
        });
      }
    };

    cargarModuloPescaIndustrial();
  }, [setValue, isEditing]);

  // Preparar opciones para dropdowns aplicando regla Number()
  const personalOptions = personal.map((p) => ({
    label: p.nombreCompleto || `${p.nombres} ${p.apellidos}`,
    value: Number(p.id),
  }));

  const centroCostoOptions = centrosCosto.map((cc) => ({
    label: cc.Codigo + " - " + cc.Nombre || "N/A",
    value: Number(cc.id),
  }));

  const tipoMovimientoOptions = tiposMovimiento.map((tm) => ({
    label: tm.nombre || "N/A",
    value: Number(tm.id),
  }));

  // Función para manejar el toggle de operacionSinFactura
  const handleToggleOperacionSinFactura = () => {
    const valorActual = getValues("operacionSinFactura");
    setValue("operacionSinFactura", !valorActual);
    
    toast.current?.show({
      severity: "info",
      summary: "Estado Actualizado",
      detail: !valorActual ? "Operación marcada como SIN FACTURA" : "Operación marcada como CON FACTURA",
      life: 2000,
    });
  };

  // Función para manejar el envío del formulario
  const onSubmit = async (data, event) => {
    event?.preventDefault();
    event?.stopPropagation();

    try {
      // Validaciones de negocio
      if (!data.monto || data.monto <= 0) {
        toast.current?.show({
          severity: "error",
          summary: "Error de Validación",
          detail: "El monto debe ser mayor a cero",
          life: 3000,
        });
        return;
      }

      // Normalizar datos aplicando regla Number() para IDs
      const datosNormalizados = {
        entregaARendirId: Number(data.entregaARendirId),
        responsableId: data.responsableId ? Number(data.responsableId) : null,
        tipoMovimientoId: data.tipoMovimientoId
          ? Number(data.tipoMovimientoId)
          : null,
        centroCostoId: data.centroCostoId ? Number(data.centroCostoId) : null,
        monto: Number(data.monto),
        fechaMovimiento: data.fechaMovimiento,
        descripcion: data.descripcion ? data.descripcion.toUpperCase() : null,
        urlComprobanteMovimiento: data.urlComprobanteMovimiento?.trim() || null,
        validadoTesoreria: data.validadoTesoreria,
        fechaValidacionTesoreria: data.fechaValidacionTesoreria,
        operacionSinFactura: data.operacionSinFactura,
        fechaOperacionMovCaja: data.fechaOperacionMovCaja,
        operacionMovCajaId: data.operacionMovCajaId ? Number(data.operacionMovCajaId) : null,
        moduloOrigenMovCajaId: data.moduloOrigenMovCajaId ? Number(data.moduloOrigenMovCajaId) : null,
        actualizadoEn: new Date(),
      };

      if (!isEditing) {
        datosNormalizados.creadoEn = new Date();
      }

      // Pasar los datos al componente padre para que maneje la operación
      onGuardadoExitoso?.(datosNormalizados);
    } catch (error) {
      console.error("Error al procesar datos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al procesar los datos del formulario",
        life: 3000,
      });
    }
  };

  // Función para ver PDF
  const handleVerPDF = () => {
    if (urlComprobanteMovimiento) {
      abrirPdfEnNuevaPestana(
        urlComprobanteMovimiento,
        toast,
        "No hay comprobante PDF disponible"
      );
    }
  };

  // Función para manejar comprobante subido
  const handleComprobanteSubido = (urlDocumento) => {
    setValue("urlComprobanteMovimiento", urlDocumento);
    setMostrarCaptura(false);
    toast.current?.show({
      severity: "success",
      summary: "Comprobante Subido",
      detail: "El comprobante PDF se ha subido correctamente",
      life: 3000,
    });
  };

  // Función para validar tesorería
  const handleValidarTesoreria = () => {
    // Obtener valores actuales del formulario
    const valores = getValues();
    
    // Validar campos obligatorios
    const camposFaltantes = [];
    
    if (!valores.fechaMovimiento) {
      camposFaltantes.push("Fecha del Movimiento");
    }
    
    if (!valores.responsableId) {
      camposFaltantes.push("Responsable");
    }
    
    if (!valores.tipoMovimientoId) {
      camposFaltantes.push("Tipo de Movimiento");
    }
    
    if (!valores.centroCostoId) {
      camposFaltantes.push("Centro de Costo");
    }
    
    if (!valores.descripcion || valores.descripcion.trim() === "") {
      camposFaltantes.push("Descripción");
    }
    
    if (!valores.monto || Number(valores.monto) <= 0) {
      camposFaltantes.push("Monto");
    }
    
    // Verificar si faltan campos
    if (camposFaltantes.length > 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Campos Incompletos",
        detail: `Faltan los siguientes campos: ${camposFaltantes.join(", ")}`,
        life: 5000,
      });
      return;
    }
    
    // Verificar que existe el comprobante PDF
    if (!valores.urlComprobanteMovimiento || valores.urlComprobanteMovimiento.trim() === "") {
      toast.current?.show({
        severity: "warn",
        summary: "Comprobante Requerido",
        detail: "Debe adjuntar el comprobante para poder validar la Operación",
        life: 5000,
      });
      return;
    }
    
    // Si todas las validaciones pasan, proceder con la validación
    setValue("validadoTesoreria", true);
    setValue("fechaValidacionTesoreria", new Date());
    
    toast.current?.show({
      severity: "success",
      summary: "Validación Exitosa",
      detail: "Operación validada Exitosamente",
      life: 3000,
    });
  };

  // Verificar si el formulario debe estar deshabilitado
  const formularioDeshabilitado = getValues("validadoTesoreria");

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <form>
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: "0.5rem",
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label className="block text-900 font-medium mb-2">
              Fecha de Creación
            </label>
            <InputText
              value={
                movimiento?.creadoEn
                  ? new Date(movimiento.creadoEn).toLocaleString("es-PE")
                  : new Date().toLocaleString("es-PE")
              }
              readOnly
              className="p-inputtext-sm"
            />
          </div>
          <div style={{ flex: 1 }}>
            {/* Fecha del Movimiento */}
            <label
              htmlFor="fechaMovimiento"
              className="block text-900 font-medium mb-2"
            >
              Fecha del Movimiento *
            </label>
            <Controller
              name="fechaMovimiento"
              control={control}
              rules={{ required: "La fecha es obligatoria" }}
              render={({ field }) => (
                <Calendar
                  id="fechaMovimiento"
                  {...field}
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  showIcon
                  showTime
                  hourFormat="24"
                  dateFormat="dd/mm/yy"
                  placeholder="Seleccione fecha y hora"
                  className={classNames({
                    "p-invalid": errors.fechaMovimiento,
                  })}
                  inputStyle={{ fontWeight: "bold" }}
                  disabled={formularioDeshabilitado}
                />
              )}
            />
            {errors.fechaMovimiento && (
              <Message severity="error" text={errors.fechaMovimiento.message} />
            )}
          </div>

          <div style={{ flex: 2 }}>
            {/* Responsable */}
            <label
              htmlFor="responsableId"
              className="block text-900 font-medium mb-2"
            >
              Responsable *
            </label>
            <Controller
              name="responsableId"
              control={control}
              rules={{ required: "El responsable es obligatorio" }}
              render={({ field }) => (
                <Dropdown
                  id="responsableId"
                  {...field}
                  value={field.value}
                  options={personalOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione responsable"
                  className={classNames({
                    "p-invalid": errors.responsableId,
                  })}
                  filter
                  showClear
                  style={{ fontWeight: "bold" }}
                  disabled={formularioDeshabilitado}
                />
              )}
            />
            {errors.responsableId && (
              <Message severity="error" text={errors.responsableId.message} />
            )}
          </div>
          <div style={{ flex: 2 }}>
            {/* Tipo de Movimiento */}
            <label
              htmlFor="tipoMovimientoId"
              className="block text-900 font-medium mb-2"
            >
              Tipo de Movimiento *
            </label>
            <Controller
              name="tipoMovimientoId"
              control={control}
              rules={{ required: "El tipo de movimiento es obligatorio" }}
              render={({ field }) => (
                <Dropdown
                  id="tipoMovimientoId"
                  {...field}
                  value={field.value}
                  options={tipoMovimientoOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione tipo"
                  className={classNames({
                    "p-invalid": errors.tipoMovimientoId,
                  })}
                  filter
                  showClear
                  style={{ fontWeight: "bold" }}
                  disabled={formularioDeshabilitado}
                />
              )}
            />
            {errors.tipoMovimientoId && (
              <Message
                severity="error"
                text={errors.tipoMovimientoId.message}
              />
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: "0.5rem",
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 2 }}>
            {/* Centro de Costo */}
            <label
              htmlFor="centroCostoId"
              className="block text-900 font-medium mb-2"
            >
              Centro de Costo *
            </label>
            <Controller
              name="centroCostoId"
              control={control}
              rules={{ required: "El centro de costo es obligatorio" }}
              render={({ field }) => (
                <Dropdown
                  id="centroCostoId"
                  {...field}
                  value={field.value}
                  options={centroCostoOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione centro de costo"
                  className={classNames({
                    "p-invalid": errors.centroCostoId,
                  })}
                  filter
                  showClear
                  style={{ fontWeight: "bold" }}
                  disabled={formularioDeshabilitado}
                />
              )}
            />
            {errors.centroCostoId && (
              <Message severity="error" text={errors.centroCostoId.message} />
            )}
          </div>

          <div style={{ flex: 3 }}>
            {/* Descripción */}
            <label
              htmlFor="descripcion"
              className="block text-900 font-medium mb-2"
            >
              Descripción
            </label>
            <Controller
              name="descripcion"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="descripcion"
                  {...field}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  rows={1}
                  placeholder="Ingrese una descripción del movimiento"
                  className={classNames({
                    "p-invalid": errors.descripcion,
                  })}
                  style={{
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    color: "red",
                  }}
                  disabled={formularioDeshabilitado}
                />
              )}
            />
            {errors.descripcion && (
              <Message severity="error" text={errors.descripcion.message} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            {/* Monto */}
            <label htmlFor="monto" className="block text-900 font-medium mb-2">
              Monto (S/) *
            </label>
            <Controller
              name="monto"
              control={control}
              rules={{
                required: "El monto es obligatorio",
                min: { value: 0.01, message: "El monto debe ser mayor a cero" },
              }}
              render={({ field }) => (
                <InputNumber
                  id="monto"
                  value={field.value || null}
                  onValueChange={(e) => field.onChange(e.value)}
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  min={0}
                  className={classNames({
                    "p-invalid": errors.monto,
                  })}
                  inputStyle={{ fontWeight: "bold" }}
                  disabled={formularioDeshabilitado}
                />
              )}
            />
            {errors.monto && (
              <Message severity="error" text={errors.monto.message} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label className="block text-900 font-medium mb-2">
              Última Actualización
            </label>
            <InputText
              value={
                movimiento?.actualizadoEn
                  ? new Date(movimiento.actualizadoEn).toLocaleString("es-PE")
                  : ""
              }
              readOnly
              className="p-inputtext-sm"
            />
          </div>
        </div>

        {/* Sección de Comprobante PDF */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: "0.5rem",
            alignItems: "end",
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 2 }}>
            <label
              htmlFor="urlComprobanteMovimiento"
              className="block text-900 font-medium mb-2"
            >
              Comprobante PDF
            </label>
            <Controller
              name="urlComprobanteMovimiento"
              control={control}
              render={({ field }) => (
                <InputText
                  id="urlComprobanteMovimiento"
                  {...field}
                  placeholder="URL del comprobante PDF"
                  className={classNames({
                    "p-invalid": errors.urlComprobanteMovimiento,
                  })}
                  style={{ fontWeight: "bold" }}
                  readOnly
                  disabled={formularioDeshabilitado}
                />
              )}
            />
            {errors.urlComprobanteMovimiento && (
              <Message
                severity="error"
                text={errors.urlComprobanteMovimiento.message}
              />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div className="flex gap-2 mt-4">
              <Button
                type="button"
                label="Capturar/Subir"
                icon="pi pi-camera"
                className="p-button-info"
                onClick={() => setMostrarCaptura(true)}
                size="small"
                disabled={formularioDeshabilitado}
              />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            {urlComprobanteMovimiento && (
              <Button
                type="button"
                label="Ver PDF"
                icon="pi pi-eye"
                className="p-button-secondary"
                onClick={handleVerPDF}
                size="small"
              />
            )}
          </div>
        </div>

        {/* Sección de Validación de Tesorería */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: "0.5rem",
            alignItems: "end",
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label className="block text-900 font-medium mb-2">
              Estado de Validación
            </label>
            <Button
              type="button"
              label={validadoTesoreria ? "VALIDADO" : "PENDIENTE"}
              icon={validadoTesoreria ? "pi pi-check-circle" : "pi pi-clock"}
              className={
                validadoTesoreria ? "p-button-primary" : "p-button-danger"
              }
              disabled
              size="small"
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="block text-900 font-medium mb-2">
              Fecha de Validación
            </label>
            <Controller
              name="fechaValidacionTesoreria"
              control={control}
              render={({ field }) => (
                <InputText
                  {...field}
                  value={
                    field.value
                      ? new Date(field.value).toLocaleString("es-PE", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })
                      : ""
                  }
                  placeholder="Pendiente"
                  readOnly
                  disabled
                  className="p-inputtext-sm"
                />
              )}
            />
          </div>
          <div style={{ flex: 1 }}>
            {!validadoTesoreria && (
              <Button
                type="button"
                label={
                  <span className="flex align-items-center gap-1">
                    <i className="pi pi-check"></i>
                    <i className="pi pi-dollar"></i>
                    <span>Validar Movimiento</span>
                  </span>
                }
                className="p-button-danger"
                onClick={handleValidarTesoreria}
                size="small"
                severity="danger"
                disabled={formularioDeshabilitado}
              />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <Button
              type="button"
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-warning"
              size="small"
              severity="warning"
              onClick={onCancelar}
              disabled={formularioDeshabilitado}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Button
              type="button"
              label={isEditing ? "Actualizar" : "Crear"}
              icon={isEditing ? "pi pi-check" : "pi pi-plus"}
              className="p-button-success"
              size="small"
              severity="success"
              onClick={handleSubmit(onSubmit)}
              disabled={formularioDeshabilitado}
            />
          </div>
        </div>

        {/* Sección Movimiento de Caja */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: "0.5rem",
            alignItems: "end",
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label className="block text-900 font-medium mb-2">
              Estado Facturación
            </label>
            <Button
              type="button"
              label={operacionSinFactura ? "S/FACTURA" : "C/FACTURA"}
              icon={operacionSinFactura ? "pi pi-exclamation-triangle" : "pi pi-check-circle"}
              className={operacionSinFactura ? "p-button-warning" : "p-button-primary"}
              onClick={handleToggleOperacionSinFactura}
              size="small"
              style={{ width: "100%" }}
              disabled={formularioDeshabilitado}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="block text-900 font-medium mb-2">
              Fecha Operación Mov. Caja
            </label>
            <Controller
              name="fechaOperacionMovCaja"
              control={control}
              render={({ field }) => (
                <InputText
                  value={
                    field.value
                      ? new Date(field.value).toLocaleString("es-PE")
                      : ""
                  }
                  placeholder="Pendiente"
                  readOnly
                  disabled
                  className="p-inputtext-sm"
                />
              )}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="block text-900 font-medium mb-2">
              ID Operación Mov. Caja
            </label>
            <Controller
              name="operacionMovCajaId"
              control={control}
              render={({ field }) => (
                <InputText
                  value={field.value ? field.value.toString() : ""}
                  placeholder="Pendiente"
                  readOnly
                  disabled
                  className="p-inputtext-sm"
                />
              )}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="block text-900 font-medium mb-2">
              Módulo Origen
            </label>
            <InputText
              value={modulosPescaIndustrial ? `${modulosPescaIndustrial.id} - ${modulosPescaIndustrial.nombre}` : "2 - PESCA INDUSTRIAL"}
              readOnly
              disabled
              className="p-inputtext-sm"
              style={{ color: "#2196F3" }}
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-content-end gap-2 mt-4"></div>
      </form>

      {/* Visor de PDF */}
      {urlComprobanteMovimiento && (
        <div style={{ marginTop: "1rem" }}>
          <PDFViewer urlDocumento={urlComprobanteMovimiento} />
        </div>
      )}

      {/* Modal de captura de comprobante */}
      {mostrarCaptura && (
        <DocumentoCapture
          visible={mostrarCaptura}
          onHide={() => setMostrarCaptura(false)}
          onDocumentoSubido={handleComprobanteSubido}
          endpoint="/api/det-movs-entrega-rendir/upload"
          titulo="Capturar Comprobante de Movimiento"
          toast={toast}
          extraData={{ detMovsEntregaRendirId: movimiento?.id }}
        />
      )}
    </div>
  );
};
export default DetMovsEntregaRendirForm;
