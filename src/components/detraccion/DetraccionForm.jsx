// src/components/detraccion/DetraccionForm.jsx
import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { formatearNumero } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import BooleanToggleButton from "../common/BooleanToggleButton";
import {
  getDetraccionById,
} from "../../api/tesoreria/detraccion";

// ════════════════════════════════════════════════════════════
// CONSTANTES DE CONFIGURACIÓN - DETRACCIONES
// ════════════════════════════════════════════════════════════

/**
 * ID del tipo "DETRACCION" en la tabla TipoProvieneDe
 * Este valor se utiliza para filtrar los estados específicos de detracciones
 * en la tabla EstadoMultiFuncion mediante el campo tipoProvieneDeId
 * 
 * Referencia: TipoProvieneDe.id = 28 → "DETRACCION"
 * 
 * Estados disponibles para detracciones (tipoProvieneDeId = 28):
 * - 126: PENDIENTE (secondary) - Detracción registrada, pendiente de validación
 * - 127: VALIDADO (success) - Detracción validada y confirmada
 * - 128: ASIENTO GENERADO (contrast) - Asiento contable generado automáticamente
 */
const TIPO_PROVIENE_DE_DETRACCION = 28;

/**
 * Estado por defecto para nuevas detracciones
 * IMPORTANTE: Este ID corresponde al estado "PENDIENTE" en EstadoMultiFuncion
 * donde tipoProvieneDeId = 28 (DETRACCION)
 */
const ESTADO_DEFAULT_PENDIENTE = 126;

/**
 * IDs de estados específicos para detracciones
 */
const ESTADOS_DETRACCION = {
  PENDIENTE: 126,           // Detracción pendiente
  VALIDADO: 127,            // Detracción validada
  ASIENTO_GENERADO: 128,    // Asiento contable generado
};

/**
 * Valores por defecto para montos
 */
const MONTO_DEFAULT = 0;

const DetraccionForm = forwardRef((props, ref) => {
  const {
    isEdit,
    defaultValues,
    empresas,
    tiposDetraccion,
    monedas,
    estados,
    periodosContables,
    entidadesComerciales,
    empresaFija,
    onSubmit,
    onCancel,
    loading,
    readOnly,
    permisos,
    toast,
  } = props;

  const { usuario } = useAuthStore();
  
  // Estado único para todos los campos del formulario
  const [formData, setFormData] = useState({
    empresaId: defaultValues?.empresaId
      ? Number(defaultValues.empresaId)
      : empresaFija
        ? Number(empresaFija)
        : null,
    preFacturaId: defaultValues?.preFacturaId ? Number(defaultValues.preFacturaId) : null,
    ordenCompraId: defaultValues?.ordenCompraId ? Number(defaultValues.ordenCompraId) : null,
    origenOperacionComprasVentas: defaultValues?.origenOperacionComprasVentas || false,
    entidadComercialId: defaultValues?.entidadComercialId ? Number(defaultValues.entidadComercialId) : null,
    tipoDetraccionId: defaultValues?.tipoDetraccionId ? Number(defaultValues.tipoDetraccionId) : null,
    tasaDetraccion: defaultValues?.tasaDetraccion || 0,
    tipoDocumentoId: defaultValues?.tipoDocumentoId ? Number(defaultValues.tipoDocumentoId) : null,
    numeroDocumento: defaultValues?.numeroDocumento || "",
    fechaEmision: defaultValues?.fechaEmision ? new Date(defaultValues.fechaEmision) : new Date(),
    monedaId: defaultValues?.monedaId ? Number(defaultValues.monedaId) : null,
    importeTotal: defaultValues?.importeTotal || MONTO_DEFAULT,
    importeRequerido: defaultValues?.importeRequerido || MONTO_DEFAULT,
    importePagado: defaultValues?.importePagado || MONTO_DEFAULT,
    saldoPendiente: defaultValues?.saldoPendiente || MONTO_DEFAULT,
    estadoPagoId: defaultValues?.estadoPagoId ? Number(defaultValues.estadoPagoId) : ESTADO_DEFAULT_PENDIENTE,
    cuentaBNSunatPropiaId: defaultValues?.cuentaBNSunatPropiaId ? Number(defaultValues.cuentaBNSunatPropiaId) : null,
    cuentaBNSunatProveedorId: defaultValues?.cuentaBNSunatProveedorId ? Number(defaultValues.cuentaBNSunatProveedorId) : null,
    aplicado: defaultValues?.aplicado || false,
    fechaAplicacion: defaultValues?.fechaAplicacion ? new Date(defaultValues.fechaAplicacion) : null,
    observaciones: defaultValues?.observaciones || "",
    fechaContable: defaultValues?.fechaContable ? new Date(defaultValues.fechaContable) : new Date(),
    periodoContableId: defaultValues?.periodoContableId ? Number(defaultValues.periodoContableId) : null,
    creadoPor: defaultValues?.creadoPor || null,
    actualizadoPor: defaultValues?.actualizadoPor || null,
  });

  // Función para actualizar campos individuales
  const onChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Filtrar períodos contables por empresa seleccionada
  const periodosContablesFiltrados = React.useMemo(() => {
    if (!periodosContables) return [];

    return periodosContables
      .filter((p) => {
        const perteneceAEmpresa =
          Number(p.empresaId) === Number(formData.empresaId);
        const esPeriodoSeleccionado =
          formData.periodoContableId &&
          Number(p.id) === Number(formData.periodoContableId);

        return perteneceAEmpresa || esPeriodoSeleccionado;
      })
      .sort((a, b) => {
        return new Date(b.fechaInicio) - new Date(a.fechaInicio);
      })
      .map((p) => {
        let estadoLabel = "";
        const estadoId = Number(p.estadoId);

        if (estadoId === 73) {
          estadoLabel = "🟢 ABIERTO";
        } else if (estadoId === 74) {
          estadoLabel = "🔴 CERRADO";
        } else if (estadoId === 75) {
          estadoLabel = "🔒 BLOQUEADO";
        } else {
          estadoLabel = "⚪ SIN ESTADO";
        }

        return {
          label: `${p.nombrePeriodo} - ${estadoLabel}`,
          value: Number(p.id),
          estadoId: estadoId,
          disabled: estadoId !== 73 && !isEdit,
        };
      });
  }, [formData.empresaId, formData.periodoContableId, periodosContables, isEdit]);

  // Obtener color de moneda
  const getColorPorMoneda = () => {
    if (!formData.monedaId) return "#ffffff";
    const moneda = monedas?.find((m) => Number(m.id) === Number(formData.monedaId));
    return moneda?.colorFondo || "#ffffff";
  };

  // Calcular saldoPendiente cuando cambie importeRequerido o importePagado
  useEffect(() => {
    const nuevoSaldo = Number(formData.importeRequerido) - Number(formData.importePagado || 0);
    if (nuevoSaldo !== formData.saldoPendiente) {
      onChange("saldoPendiente", nuevoSaldo);
    }
  }, [formData.importeRequerido, formData.importePagado]);

  // Calcular estado automáticamente según pagos
  useEffect(() => {
    // Por ahora, el estado se maneja manualmente
    // No hay cálculo automático de estados para detracciones
  }, [
    formData.importeRequerido,
    formData.importePagado,
    formData.saldoPendiente,
    isEdit,
  ]);

  const recargarDetraccionDesdeBackend = async () => {
    if (!isEdit || !defaultValues?.id) return;

    try {
      const detraccionActualizada = await getDetraccionById(defaultValues.id);
      onChange("importeRequerido", detraccionActualizada.importeRequerido || 0);
      onChange("importePagado", detraccionActualizada.importePagado || 0);
      onChange("saldoPendiente", detraccionActualizada.saldoPendiente || 0);
      onChange("estadoPagoId", detraccionActualizada.estadoPagoId || ESTADO_DEFAULT_PENDIENTE);
    } catch (error) {
      console.error("Error al recargar detracción desde backend:", error);
    }
  };

  useImperativeHandle(ref, () => ({
    recargarDetraccionDesdeBackend,
  }));

  const handleSubmit = () => {
    if (loading) return;

    const data = {
      empresaId: Number(formData.empresaId),
      preFacturaId: formData.preFacturaId ? Number(formData.preFacturaId) : null,
      ordenCompraId: formData.ordenCompraId ? Number(formData.ordenCompraId) : null,
      origenOperacionComprasVentas: formData.origenOperacionComprasVentas || false,
      entidadComercialId: Number(formData.entidadComercialId),
      tipoDetraccionId: formData.tipoDetraccionId ? Number(formData.tipoDetraccionId) : null,
      tasaDetraccion: Number(formData.tasaDetraccion) || 0,
      tipoDocumentoId: formData.tipoDocumentoId ? Number(formData.tipoDocumentoId) : null,
      numeroDocumento: formData.numeroDocumento || null,
      fechaEmision: formData.fechaEmision || null,
      monedaId: Number(formData.monedaId),
      importeTotal: Number(formData.importeTotal) || MONTO_DEFAULT,
      importeRequerido: Number(formData.importeRequerido),
      importePagado: Number(formData.importePagado) || MONTO_DEFAULT,
      saldoPendiente: Number(formData.saldoPendiente),
      estadoPagoId: Number(formData.estadoPagoId),
      cuentaBNSunatPropiaId: formData.cuentaBNSunatPropiaId ? Number(formData.cuentaBNSunatPropiaId) : null,
      cuentaBNSunatProveedorId: formData.cuentaBNSunatProveedorId ? Number(formData.cuentaBNSunatProveedorId) : null,
      aplicado: formData.aplicado || false,
      fechaAplicacion: formData.fechaAplicacion || null,
      observaciones: formData.observaciones || null,
      fechaContable: formData.fechaContable || null,
      periodoContableId: formData.periodoContableId ? Number(formData.periodoContableId) : null,
      creadoPor: isEdit ? formData.creadoPor : usuario?.personalId ? Number(usuario.personalId) : null,
      actualizadoPor: isEdit && usuario?.personalId ? Number(usuario.personalId) : null,
    };
    onSubmit(data);
  };

  return (
    <>
      <TabView>
        {/* TAB 1: DATOS GENERALES */}
        <TabPanel header="Datos Generales" leftIcon="pi pi-file">
          <div className="p-fluid">

            <div
              style={{
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              {/* Empresa */}
              <div style={{ flex: 1 }}>
                <label htmlFor="empresaId">
                  Empresa <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  id="empresaId"
                  value={formData.empresaId}
                  options={empresas?.map((e) => ({
                    label: e.razonSocial,
                    value: Number(e.id),
                  })) || []}
                  onChange={(e) => onChange("empresaId", e.value)}
                  placeholder="Seleccione empresa"
                  filter
                  disabled={true}
                />
              </div>

              {/* Entidad Comercial */}
              <div style={{ flex: 1 }}>
                <label htmlFor="entidadComercialId">
                  Entidad Comercial <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  id="entidadComercialId"
                  value={formData.entidadComercialId}
                  options={entidadesComerciales?.map((e) => ({
                    label: e.razonSocial,
                    value: Number(e.id),
                  })) || []}
                  onChange={(e) => onChange("entidadComercialId", e.value)}
                  placeholder="Seleccione entidad"
                  filter
                  disabled={readOnly || loading}
                />
              </div>

              {/* Origen Operación */}
              <div style={{ flex: 1 }}>
                <label htmlFor="origenOperacionComprasVentas">
                  Origen Operación
                </label>
                <BooleanToggleButton
                  value={formData.origenOperacionComprasVentas}
                  onChange={(value) => onChange("origenOperacionComprasVentas", value)}
                  labelTrue="COMPRA"
                  labelFalse="VENTA"
                  severityTrue="warning"
                  severityFalse="success"
                  disabled={readOnly || loading}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              {/* Tipo Detracción */}
              <div style={{ flex: 1 }}>
                <label htmlFor="tipoDetraccionId">
                  Tipo de Detracción
                </label>
                <Dropdown
                  id="tipoDetraccionId"
                  value={formData.tipoDetraccionId}
                  options={tiposDetraccion?.map((t) => ({
                    label: `${t.codigo} - ${t.nombre}`,
                    value: Number(t.id),
                  })) || []}
                  onChange={(e) => onChange("tipoDetraccionId", e.value)}
                  placeholder="Seleccione tipo"
                  filter
                  showClear
                  disabled={readOnly || loading}
                />
              </div>

              {/* Tasa Detracción */}
              <div style={{ flex: 1 }}>
                <label htmlFor="tasaDetraccion">
                  Tasa Detracción (%)
                </label>
                <InputNumber
                  id="tasaDetraccion"
                  value={formData.tasaDetraccion}
                  onValueChange={(e) => onChange("tasaDetraccion", e.value || 0)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled={readOnly || loading}
                />
              </div>

              {/* Número Documento */}
              <div style={{ flex: 1 }}>
                <label htmlFor="numeroDocumento">Número Documento</label>
                <InputText
                  id="numeroDocumento"
                  value={formData.numeroDocumento}
                  onChange={(e) => onChange("numeroDocumento", e.target.value)}
                  placeholder="Número constancia"
                  disabled={readOnly || loading}
                />
              </div>

              {/* Fecha Emisión */}
              <div style={{ flex: 1 }}>
                <label htmlFor="fechaEmision">
                  Fecha Emisión
                </label>
                <Calendar
                  id="fechaEmision"
                  value={formData.fechaEmision}
                  onChange={(e) => onChange("fechaEmision", e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled={readOnly || loading}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              {/* Moneda */}
              <div style={{ flex: 1 }}>
                <label htmlFor="monedaId">
                  Moneda <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  id="monedaId"
                  value={formData.monedaId}
                  options={monedas?.map((m) => ({
                    label: m.codigoSunat,
                    value: Number(m.id),
                  })) || []}
                  onChange={(e) => onChange("monedaId", e.value)}
                  placeholder="Seleccione moneda"
                  disabled={readOnly || loading}
                />
              </div>

              {/* Importe Total */}
              <div style={{ flex: 1 }}>
                <label htmlFor="importeTotal">
                  Importe Total
                </label>
                <InputNumber
                  id="importeTotal"
                  value={formData.importeTotal}
                  onValueChange={(e) => onChange("importeTotal", e.value || 0)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled={readOnly || loading}
                  style={{ backgroundColor: getColorPorMoneda() }}
                />
              </div>

              {/* Importe Requerido */}
              <div style={{ flex: 1 }}>
                <label htmlFor="importeRequerido">
                  Importe Requerido <span className="text-red-500">*</span>
                </label>
                <InputNumber
                  id="importeRequerido"
                  value={formData.importeRequerido}
                  onValueChange={(e) => onChange("importeRequerido", e.value || 0)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled={readOnly || loading}
                  style={{ backgroundColor: getColorPorMoneda() }}
                />
              </div>

              {/* Importe Pagado */}
              <div style={{ flex: 1 }}>
                <label htmlFor="importePagado">Importe Pagado</label>
                <InputNumber
                  id="importePagado"
                  value={formData.importePagado}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled
                  style={{ backgroundColor: getColorPorMoneda() }}
                />
              </div>

              {/* Saldo Pendiente */}
              <div style={{ flex: 1 }}>
                <label htmlFor="saldoPendiente">Saldo Pendiente</label>
                <InputNumber
                  id="saldoPendiente"
                  value={formData.saldoPendiente}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled
                  style={{ backgroundColor: getColorPorMoneda() }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "end",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              {/* Estado */}
              <div style={{ flex: 1 }}>
                <label htmlFor="estadoPagoId">
                  Estado <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  id="estadoPagoId"
                  value={formData.estadoPagoId}
                  options={estados
                    ?.filter((e) => Number(e.tipoProvieneDeId) === TIPO_PROVIENE_DE_DETRACCION)
                    ?.map((e) => ({
                      label: e.descripcion,
                      value: Number(e.id),
                    })) || []}
                  onChange={(e) => onChange("estadoPagoId", e.value)}
                  placeholder="Seleccione estado"
                  disabled={readOnly || loading}
                  showClear
                />
              </div>

              {/* Período Contable */}
              <div style={{ flex: 1 }}>
                <label htmlFor="periodoContableId">Período Contable</label>
                <Dropdown
                  id="periodoContableId"
                  value={formData.periodoContableId}
                  options={periodosContablesFiltrados}
                  onChange={(e) => onChange("periodoContableId", e.value)}
                  placeholder="Seleccione período"
                  filter
                  showClear
                  disabled={readOnly || loading}
                />
              </div>

              {/* Fecha Contable */}
              <div style={{ flex: 1 }}>
                <label htmlFor="fechaContable">
                  Fecha Contable
                </label>
                <Calendar
                  id="fechaContable"
                  value={formData.fechaContable}
                  onChange={(e) => onChange("fechaContable", e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled={readOnly || loading}
                />
              </div>

              {/* Aplicado */}
              <div style={{ flex: 1 }}>
                <label>Aplicado</label>
                <div style={{ marginTop: "0.5rem" }}>
                  <BooleanToggleButton
                    value={formData.aplicado}
                    onChange={(value) => onChange("aplicado", value)}
                    labelTrue="SÍ"
                    labelFalse="NO"
                    severityTrue="success"
                    severityFalse="secondary"
                    disabled={readOnly || loading}
                  />
                </div>
              </div>

              {/* Fecha Aplicación */}
              {formData.aplicado && (
                <div style={{ flex: 1 }}>
                  <label htmlFor="fechaAplicacion">
                    Fecha Aplicación
                  </label>
                  <Calendar
                    id="fechaAplicacion"
                    value={formData.fechaAplicacion}
                    onChange={(e) => onChange("fechaAplicacion", e.value)}
                    dateFormat="dd/mm/yy"
                    showIcon
                    disabled={readOnly || loading}
                  />
                </div>
              )}
            </div>

            {/* Observaciones */}
            <div style={{ marginTop: "1rem" }}>
              <label htmlFor="observaciones">Observaciones</label>
              <InputTextarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => onChange("observaciones", e.target.value)}
                rows={3}
                disabled={readOnly || loading}
              />
            </div>

            {/* Botones */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.5rem",
                marginTop: "1rem",
              }}
            >
              <Button
                label="Cancelar"
                icon="pi pi-times"
                className="p-button-secondary"
                onClick={onCancel}
                disabled={loading}
              />
              {!readOnly && (
                <Button
                  label={isEdit ? "Actualizar" : "Guardar"}
                  icon="pi pi-check"
                  className="p-button-primary"
                  onClick={handleSubmit}
                  loading={loading}
                />
              )}
            </div>
          </div>
        </TabPanel>

        {/* TAB 2: PAGOS - Solo visible en edición */}
        {isEdit && (
          <TabPanel header="Pagos" leftIcon="pi pi-money-bill">
            <div className="p-fluid">
              <p style={{ marginBottom: "1rem", color: "#666" }}>
                Los pagos de detracción se registran en el módulo de Movimientos de Caja
              </p>
              
              {/* Aquí irían los pagos vinculados desde MovimientoCaja */}
              <DataTable
                value={[]}
                emptyMessage="No hay pagos registrados"
              >
                <Column field="fechaPago" header="Fecha" />
                <Column field="monto" header="Monto" />
                <Column field="medioPago" header="Medio de Pago" />
              </DataTable>
            </div>
          </TabPanel>
        )}
      </TabView>
    </>
  );
});

export default DetraccionForm;