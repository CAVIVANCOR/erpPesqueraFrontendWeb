/**
 * DetMovsEntregaRendirMovAlmacenForm.jsx
 *
 * Formulario para crear y editar movimientos de entregas a rendir en movimientos de almacén.
 * Incluye navegación por cards y gestión de PDFs.
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
import { Card } from "primereact/card";
import { classNames } from "primereact/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const DetMovsEntregaRendirMovAlmacenForm = ({
  movimiento = null,
  entregaARendirMovAlmacenId,
  personal = [],
  centrosCosto = [],
  tiposMovimiento = [],
  entidadesComerciales = [],
  monedas = [],
  tiposDocumento = [],
  productos = [],
  onGuardadoExitoso,
  onCancelar,
}) => {
  const toast = useRef(null);
  const isEditing = !!movimiento;
  const { usuario } = useAuthStore();

  // Configuración del formulario
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      entregaARendirMovAlmacenId: entregaARendirMovAlmacenId || "",
      responsableId: "",
      fechaMovimiento: new Date(),
      tipoMovimientoId: "",
      centroCostoId: "",
      monto: 0,
      monedaId: "",
      descripcion: "",
      entidadComercialId: "",
      urlComprobanteMovimiento: "",
      validadoTesoreria: false,
      fechaValidacionTesoreria: null,
      operacionSinFactura: false,
      fechaOperacionMovCaja: null,
      operacionMovCajaId: null,
      moduloOrigenMovCajaId: 1,
      urlComprobanteOperacionMovCaja: "",
      tipoDocumentoId: "",
      numeroSerieComprobante: "",
      numeroCorrelativoComprobante: "",
      productoId: "",
    },
  });

  // Cargar datos del registro en edición
  useEffect(() => {
    if (isEditing && movimiento) {
      reset({
        entregaARendirMovAlmacenId: Number(movimiento.entregaARendirMovAlmacenId),
        responsableId: movimiento.responsableId ? Number(movimiento.responsableId) : null,
        fechaMovimiento: movimiento.fechaMovimiento ? new Date(movimiento.fechaMovimiento) : new Date(),
        tipoMovimientoId: movimiento.tipoMovimientoId ? Number(movimiento.tipoMovimientoId) : null,
        centroCostoId: movimiento.centroCostoId ? Number(movimiento.centroCostoId) : null,
        monto: Number(movimiento.monto) || 0,
        monedaId: movimiento.monedaId ? Number(movimiento.monedaId) : null,
        descripcion: movimiento.descripcion || "",
        entidadComercialId: movimiento.entidadComercialId ? Number(movimiento.entidadComercialId) : null,
        urlComprobanteMovimiento: movimiento.urlComprobanteMovimiento || "",
        validadoTesoreria: movimiento.validadoTesoreria || false,
        fechaValidacionTesoreria: movimiento.fechaValidacionTesoreria || null,
        operacionSinFactura: movimiento.operacionSinFactura || false,
        fechaOperacionMovCaja: movimiento.fechaOperacionMovCaja ? new Date(movimiento.fechaOperacionMovCaja) : null,
        operacionMovCajaId: movimiento.operacionMovCajaId ? Number(movimiento.operacionMovCajaId) : null,
        moduloOrigenMovCajaId: movimiento.moduloOrigenMovCajaId ? Number(movimiento.moduloOrigenMovCajaId) : 1,
        urlComprobanteOperacionMovCaja: movimiento.urlComprobanteOperacionMovCaja || "",
        tipoDocumentoId: movimiento.tipoDocumentoId ? Number(movimiento.tipoDocumentoId) : null,
        numeroSerieComprobante: movimiento.numeroSerieComprobante || "",
        numeroCorrelativoComprobante: movimiento.numeroCorrelativoComprobante || "",
        productoId: movimiento.productoId ? Number(movimiento.productoId) : null,
      });
    } else {
      setValue("entregaARendirMovAlmacenId", Number(entregaARendirMovAlmacenId));
      setValue("fechaMovimiento", new Date());
      setValue("moduloOrigenMovCajaId", 1);

      if (usuario?.personalId) {
        setValue("responsableId", Number(usuario.personalId));
      }
    }
  }, [movimiento, isEditing, entregaARendirMovAlmacenId, reset, setValue, usuario]);

  // Preparar opciones para dropdowns
  const personalOptions = personal.map((p) => ({
    label: p.nombreCompleto || `${p.nombres} ${p.apellidos}`,
    value: Number(p.id),
  }));

  const centroCostoOptions = centrosCosto.map((cc) => ({
    label: `${cc.Codigo} - ${cc.Nombre}`,
    value: Number(cc.id),
  }));

  const tipoMovimientoOptions = tiposMovimiento.map((tm) => ({
    label: tm.nombre,
    value: Number(tm.id),
  }));

  const monedaOptions = (monedas || []).map((m) => ({
    label: m.simbolo,
    value: Number(m.id),
  }));

  const entidadComercialOptions = entidadesComerciales.map((e) => ({
    label: e.razonSocial,
    value: Number(e.id),
  }));

  const tipoDocumentoOptions = tiposDocumento
    .filter((td) => td.esParaCompras === true || td.esParaVentas === true)
    .map((td) => ({
      label: td.activo === false ? `${td.descripcion} (INACTIVO)` : td.descripcion,
      value: Number(td.id),
    }));

  // IDs de familias permitidas para gastos
  const familiasGastosIds = [2, 3, 4, 6, 7];

  // Filtrar productos por familias de gastos
  const productosGastos = (productos || []).filter((p) => 
    familiasGastosIds.includes(Number(p.familiaId))
  );

  const productoOptions = productosGastos.map((p) => ({
    label: `${p.codigo} - ${p.nombre}`,
    value: Number(p.id),
  }));

  // Enviar formulario
  const onSubmit = (data) => {
    // Convertir fechas a ISO
    const dataToSend = {
      ...data,
      fechaMovimiento: data.fechaMovimiento ? new Date(data.fechaMovimiento).toISOString() : null,
      fechaOperacionMovCaja: data.fechaOperacionMovCaja ? new Date(data.fechaOperacionMovCaja).toISOString() : null,
      fechaValidacionTesoreria: data.fechaValidacionTesoreria ? new Date(data.fechaValidacionTesoreria).toISOString() : null,
      // Asegurar que los IDs sean números o null
      responsableId: data.responsableId ? Number(data.responsableId) : null,
      tipoMovimientoId: data.tipoMovimientoId ? Number(data.tipoMovimientoId) : null,
      centroCostoId: data.centroCostoId ? Number(data.centroCostoId) : null,
      monedaId: data.monedaId ? Number(data.monedaId) : null,
      entidadComercialId: data.entidadComercialId ? Number(data.entidadComercialId) : null,
      tipoDocumentoId: data.tipoDocumentoId ? Number(data.tipoDocumentoId) : null,
      productoId: data.productoId ? Number(data.productoId) : null,
      operacionMovCajaId: data.operacionMovCajaId ? Number(data.operacionMovCajaId) : null,
      moduloOrigenMovCajaId: data.moduloOrigenMovCajaId ? Number(data.moduloOrigenMovCajaId) : null,
    };

    onGuardadoExitoso(dataToSend);
  };

  return (
    <div>
      <Toast ref={toast} />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card title="Datos del Movimiento" style={{ marginBottom: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
            {/* Responsable */}
            <div className="field">
              <label htmlFor="responsableId">Responsable *</label>
              <Controller
                name="responsableId"
                control={control}
                rules={{ required: "El responsable es requerido" }}
                render={({ field }) => (
                  <Dropdown
                    id="responsableId"
                    {...field}
                    options={personalOptions}
                    placeholder="Seleccione responsable"
                    filter
                    className={classNames({ "p-invalid": errors.responsableId })}
                    style={{ width: "100%" }}
                  />
                )}
              />
              {errors.responsableId && (
                <small className="p-error">{errors.responsableId.message}</small>
              )}
            </div>

            {/* Fecha Movimiento */}
            <div className="field">
              <label htmlFor="fechaMovimiento">Fecha Movimiento *</label>
              <Controller
                name="fechaMovimiento"
                control={control}
                rules={{ required: "La fecha es requerida" }}
                render={({ field }) => (
                  <Calendar
                    id="fechaMovimiento"
                    {...field}
                    dateFormat="dd/mm/yy"
                    showIcon
                    className={classNames({ "p-invalid": errors.fechaMovimiento })}
                    style={{ width: "100%" }}
                  />
                )}
              />
              {errors.fechaMovimiento && (
                <small className="p-error">{errors.fechaMovimiento.message}</small>
              )}
            </div>

            {/* Tipo Movimiento */}
            <div className="field">
              <label htmlFor="tipoMovimientoId">Tipo Movimiento *</label>
              <Controller
                name="tipoMovimientoId"
                control={control}
                rules={{ required: "El tipo de movimiento es requerido" }}
                render={({ field }) => (
                  <Dropdown
                    id="tipoMovimientoId"
                    {...field}
                    options={tipoMovimientoOptions}
                    placeholder="Seleccione tipo"
                    className={classNames({ "p-invalid": errors.tipoMovimientoId })}
                    style={{ width: "100%" }}
                  />
                )}
              />
              {errors.tipoMovimientoId && (
                <small className="p-error">{errors.tipoMovimientoId.message}</small>
              )}
            </div>

            {/* Centro de Costo */}
            <div className="field">
              <label htmlFor="centroCostoId">Centro de Costo *</label>
              <Controller
                name="centroCostoId"
                control={control}
                rules={{ required: "El centro de costo es requerido" }}
                render={({ field }) => (
                  <Dropdown
                    id="centroCostoId"
                    {...field}
                    options={centroCostoOptions}
                    placeholder="Seleccione centro"
                    filter
                    className={classNames({ "p-invalid": errors.centroCostoId })}
                    style={{ width: "100%" }}
                  />
                )}
              />
              {errors.centroCostoId && (
                <small className="p-error">{errors.centroCostoId.message}</small>
              )}
            </div>

            {/* Monto */}
            <div className="field">
              <label htmlFor="monto">Monto *</label>
              <Controller
                name="monto"
                control={control}
                rules={{ required: "El monto es requerido", min: { value: 0.01, message: "El monto debe ser mayor a 0" } }}
                render={({ field }) => (
                  <InputNumber
                    id="monto"
                    {...field}
                    mode="currency"
                    currency="PEN"
                    locale="es-PE"
                    minFractionDigits={2}
                    className={classNames({ "p-invalid": errors.monto })}
                    style={{ width: "100%" }}
                    onChange={(e) => field.onChange(e.value)}
                  />
                )}
              />
              {errors.monto && (
                <small className="p-error">{errors.monto.message}</small>
              )}
            </div>

            {/* Moneda */}
            <div className="field">
              <label htmlFor="monedaId">Moneda</label>
              <Controller
                name="monedaId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="monedaId"
                    {...field}
                    options={monedaOptions}
                    placeholder="Seleccione moneda"
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>

            {/* Producto (Gasto) */}
            <div className="field">
              <label htmlFor="productoId">Producto/Gasto</label>
              <Controller
                name="productoId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="productoId"
                    {...field}
                    options={productoOptions}
                    placeholder="Seleccione producto"
                    filter
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>

            {/* Entidad Comercial */}
            <div className="field">
              <label htmlFor="entidadComercialId">Proveedor/Cliente</label>
              <Controller
                name="entidadComercialId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="entidadComercialId"
                    {...field}
                    options={entidadComercialOptions}
                    placeholder="Seleccione entidad"
                    filter
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>

            {/* Tipo Documento */}
            <div className="field">
              <label htmlFor="tipoDocumentoId">Tipo Documento</label>
              <Controller
                name="tipoDocumentoId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="tipoDocumentoId"
                    {...field}
                    options={tipoDocumentoOptions}
                    placeholder="Seleccione tipo"
                    filter
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>

            {/* Número Serie */}
            <div className="field">
              <label htmlFor="numeroSerieComprobante">Número Serie</label>
              <Controller
                name="numeroSerieComprobante"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="numeroSerieComprobante"
                    {...field}
                    placeholder="Ej: F001"
                    style={{ width: "100%", textTransform: "uppercase" }}
                  />
                )}
              />
            </div>

            {/* Número Correlativo */}
            <div className="field">
              <label htmlFor="numeroCorrelativoComprobante">Número Correlativo</label>
              <Controller
                name="numeroCorrelativoComprobante"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="numeroCorrelativoComprobante"
                    {...field}
                    placeholder="Ej: 00001234"
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="field" style={{ marginTop: "1rem" }}>
            <label htmlFor="descripcion">Descripción</label>
            <Controller
              name="descripcion"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="descripcion"
                  {...field}
                  rows={3}
                  placeholder="Descripción del movimiento"
                  style={{ width: "100%" }}
                />
              )}
            />
          </div>
        </Card>

        {/* Botones */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
          <Button
            type="button"
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-secondary"
            onClick={onCancelar}
          />
          <Button
            type="submit"
            label={isEditing ? "Actualizar" : "Guardar"}
            icon="pi pi-check"
            className="p-button-success"
          />
        </div>
      </form>
    </div>
  );
};

export default DetMovsEntregaRendirMovAlmacenForm;
