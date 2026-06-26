// src/components/tesoreria/PagarDeudaPersonalDialog.jsx
import React, { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { formatearNumero } from "../../utils/utils";
import CuentaCorrienteSelector from "../common/CuentaCorrienteSelector";

const PagarDeudaPersonalDialog = ({
  deuda,
  cuentasCorrientes = [],
  mediosPago = [],
  onSubmit,
  onCancel,
  loading = false,
  toast,
}) => {
  const [formData, setFormData] = useState({
    cuentaCorrienteOrigenId: null,
    medioPagoId: null,
    montoPago: 0,
    numeroOperacion: "",
    fechaPago: new Date(),
    observaciones: "",
  });

  const [errors, setErrors] = useState({});

  // Inicializar datos de la deuda
  useEffect(() => {
    if (deuda) {
      const montoInicial = Number(deuda.saldoPendiente || 0);
      
      setFormData((prev) => ({
        ...prev,
        montoPago: montoInicial,
      }));
    }
  }, [deuda]);

  // Validar formulario
  const validarFormulario = () => {
    const newErrors = {};

    if (!formData.cuentaCorrienteOrigenId) {
      newErrors.cuentaCorrienteOrigenId = "Debe seleccionar una cuenta";
    }

    if (!formData.medioPagoId) {
      newErrors.medioPagoId = "Debe seleccionar un medio de pago";
    }

    // Validar monto
    if (!formData.montoPago || Number(formData.montoPago) <= 0) {
      newErrors.montoPago = "El monto debe ser mayor a cero";
    }

    const saldoPendiente = Number(deuda?.saldoPendiente || 0);
    if (Number(formData.montoPago) > saldoPendiente) {
      newErrors.montoPago = `El monto no puede ser mayor al saldo pendiente (${deuda?.moneda?.simbolo} ${formatearNumero(saldoPendiente)})`;
    }

    // Validar número de operación si es transferencia
    const medioPagoSeleccionado = mediosPago.find(
      (m) => m.id === formData.medioPagoId
    );
    if (
      medioPagoSeleccionado?.nombre?.toLowerCase().includes("transferencia") &&
      !formData.numeroOperacion?.trim()
    ) {
      newErrors.numeroOperacion =
        "Número de operación requerido para transferencias";
    }

    if (!formData.fechaPago) {
      newErrors.fechaPago = "Debe seleccionar una fecha";
    }

    // Validar saldo de cuenta
    const cuentaSeleccionada = cuentasCorrientes.find(
      (c) => c.id === formData.cuentaCorrienteOrigenId
    );
    if (cuentaSeleccionada && deuda) {
      const saldoCuenta = Number(cuentaSeleccionada.saldoActual || 0);
      const montoPago = Number(formData.montoPago || 0);

      if (saldoCuenta < montoPago) {
        newErrors.cuentaCorrienteOrigenId = `Saldo insuficiente. Disponible: ${deuda.moneda?.simbolo} ${formatearNumero(saldoCuenta)}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en el formulario
  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Limpiar error del campo
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Por favor complete todos los campos requeridos",
        life: 3000,
      });
      return;
    }

    // Toast inicial
    toast?.current?.show({
      severity: "info",
      summary: "Procesando",
      detail: "Procesando pago de deuda personal...",
      life: 2000,
    });

    try {
      // Llamar al onSubmit que ejecuta el servicio
      await onSubmit(formData);
    } catch (error) {
      console.error("Error en handleSubmit:", error);
    }
  };

  // Preparar opciones de medios de pago
  const mediosPagoOptions = mediosPago.map((m) => ({
    label: m.nombre,
    value: m.id,
  }));

  // Construir nombre completo del personal
  const nombrePersonal = deuda?.personal
    ? `${deuda.personal.nombres || ""} ${deuda.personal.apellidoPaterno || ""} ${deuda.personal.apellidoMaterno || ""}`.trim()
    : "N/A";

  // Obtener saldo pendiente
  const saldoPendiente = Number(deuda?.saldoPendiente || 0);

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      {/* SECCIÓN 1: Información de la Deuda */}
      <Panel header="📋 Información de la Deuda" className="mb-3">
        <div className="grid">
          {/* Fila 1 */}
          <div className="col-12 md:col-4">
            <label className="block mb-2 font-bold">Empresa</label>
            <InputText
              value={deuda?.empresa?.razonSocial || "N/A"}
              disabled
              style={{
                fontWeight: "bold",
                backgroundColor: "#f8f9fa",
              }}
            />
          </div>

          <div className="col-12 md:col-4">
            <label className="block mb-2 font-bold">Personal</label>
            <InputText
              value={nombrePersonal}
              disabled
              style={{
                fontWeight: "bold",
                backgroundColor: "#f8f9fa",
              }}
            />
          </div>

          <div className="col-12 md:col-4">
            <label className="block mb-2 font-bold">Tipo de Deuda</label>
            <InputText
              value={deuda?.tipoDeuda?.nombre || "N/A"}
              disabled
              style={{
                fontWeight: "bold",
                backgroundColor: "#f8f9fa",
              }}
            />
          </div>

          {/* Fila 2 */}
          <div className="col-12 md:col-3">
            <label className="block mb-2 font-bold">Monto Original</label>
            <InputText
              value={`${deuda?.moneda?.simbolo || ""} ${formatearNumero(deuda?.montoOriginal || 0)}`}
              disabled
              style={{
                textAlign: "right",
                fontWeight: "bold",
                backgroundColor: "#f8f9fa",
              }}
            />
          </div>

          <div className="col-12 md:col-3">
            <label className="block mb-2 font-bold">Monto Pagado</label>
            <InputText
              value={`${deuda?.moneda?.simbolo || ""} ${formatearNumero(deuda?.montoPagado || 0)}`}
              disabled
              style={{
                textAlign: "right",
                fontWeight: "bold",
                backgroundColor: "#e8f5e9",
              }}
            />
          </div>

          <div className="col-12 md:col-3">
            <label className="block mb-2 font-bold">Saldo Pendiente</label>
            <InputText
              value={`${deuda?.moneda?.simbolo || ""} ${formatearNumero(saldoPendiente)}`}
              disabled
              style={{
                textAlign: "right",
                fontWeight: "bold",
                backgroundColor: "#ffebee",
                color: "#c62828",
              }}
            />
          </div>

          <div className="col-12 md:col-3">
            <label className="block mb-2 font-bold">Estado</label>
            <InputText
              value={deuda?.estado?.nombre || "N/A"}
              disabled
              style={{
                fontWeight: "bold",
                backgroundColor: "#f8f9fa",
              }}
            />
          </div>
        </div>
      </Panel>

      {/* SECCIÓN 2: Datos del Pago */}
      <Panel header="💰 Datos del Pago" className="mb-3">
        <div className="grid">
          {/* Fila 1 */}
          <div className="col-12 md:col-6">
            <label htmlFor="fechaPago" className="block mb-2 font-bold">
              Fecha de Pago <span className="text-red-500">*</span>
            </label>
            <Calendar
              id="fechaPago"
              value={formData.fechaPago}
              onChange={(e) => handleChange("fechaPago", e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              className={errors.fechaPago ? "p-invalid" : ""}
            />
            {errors.fechaPago && (
              <small className="p-error">{errors.fechaPago}</small>
            )}
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="montoPago" className="block mb-2 font-bold">
              Monto a Pagar <span className="text-red-500">*</span>
            </label>
            <InputNumber
              id="montoPago"
              value={formData.montoPago}
              onValueChange={(e) => handleChange("montoPago", e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              prefix={`${deuda?.moneda?.simbolo || ""} `}
              className={errors.montoPago ? "p-invalid" : ""}
            />
            {errors.montoPago && (
              <small className="p-error">{errors.montoPago}</small>
            )}
          </div>

          {/* Fila 2 */}
          <div className="col-12 md:col-6">
            <label htmlFor="cuentaCorrienteOrigenId" className="block mb-2 font-bold">
              Cuenta Origen <span className="text-red-500">*</span>
            </label>
            <CuentaCorrienteSelector
              value={formData.cuentaCorrienteOrigenId}
              onChange={(e) => handleChange("cuentaCorrienteOrigenId", e.value)}
              cuentasCorrientes={cuentasCorrientes}
              empresaId={deuda?.empresaId}
              className={errors.cuentaCorrienteOrigenId ? "p-invalid" : ""}
            />
            {errors.cuentaCorrienteOrigenId && (
              <small className="p-error">{errors.cuentaCorrienteOrigenId}</small>
            )}
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="medioPagoId" className="block mb-2 font-bold">
              Medio de Pago <span className="text-red-500">*</span>
            </label>
            <Dropdown
              id="medioPagoId"
              value={formData.medioPagoId}
              options={mediosPagoOptions}
              onChange={(e) => handleChange("medioPagoId", e.value)}
              placeholder="Seleccione medio de pago"
              filter
              className={errors.medioPagoId ? "p-invalid" : ""}
            />
            {errors.medioPagoId && (
              <small className="p-error">{errors.medioPagoId}</small>
            )}
          </div>

          {/* Fila 3 */}
          <div className="col-12">
            <label htmlFor="numeroOperacion" className="block mb-2 font-bold">
              Número de Operación
            </label>
            <InputText
              id="numeroOperacion"
              value={formData.numeroOperacion}
              onChange={(e) => handleChange("numeroOperacion", e.target.value)}
              placeholder="Ej: OP-2024-001, Transferencia 12345"
              className={errors.numeroOperacion ? "p-invalid" : ""}
            />
            {errors.numeroOperacion && (
              <small className="p-error">{errors.numeroOperacion}</small>
            )}
          </div>

          {/* Fila 4 */}
          <div className="col-12">
            <label htmlFor="observaciones" className="block mb-2 font-bold">
              Observaciones
            </label>
            <InputTextarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => handleChange("observaciones", e.target.value)}
              rows={3}
              placeholder="Observaciones adicionales del pago..."
            />
          </div>
        </div>
      </Panel>

      {/* BOTONES */}
      <div className="flex justify-content-end gap-2 mt-3">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-secondary"
          onClick={onCancel}
          type="button"
          disabled={loading}
        />
        <Button
          label="Procesar Pago"
          icon="pi pi-check"
          className="p-button-success"
          type="submit"
          loading={loading}
        />
      </div>
    </form>
  );
};

export default PagarDeudaPersonalDialog;