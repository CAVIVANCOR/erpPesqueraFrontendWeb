import React, { useState, useEffect, useMemo } from "react";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Divider } from "primereact/divider";
import { Dialog } from "primereact/dialog";
import { formatearNumero } from "../../../utils/utils";
import { getGastosPlanificados } from "../../../api/detGastosPlanificados";
import CuentaCorrienteSelector from "../../common/CuentaCorrienteSelector";
import ModuloDocumentoSelector from "../../common/ModuloDocumentoSelector";
import TipoMovimientoSelector from "../../common/TipoMovimientoSelector";
import ActivoSelector from "../../common/ActivoSelector";

const EntregarFondosForm = ({
  asignacion,
  cuentasCorrientes = [],
  mediosPago = [],
  tiposMovimiento = [],
  onSubmit,
  onCancel,
  loading = false,
  toast,
}) => {
  const [formData, setFormData] = useState({
    detMovsEntregaRendirId: null,
    moduloOrigenId: null,
    documentoOrigenId: null,
    cuentaCorrienteOrigenId: null,
    medioPagoId: null,
    monto: 0,
    numeroOperacion: "",
    fechaEntrega: new Date(),
    observaciones: "",
  });

  const [errors, setErrors] = useState({});
  const [gastosPlanificados, setGastosPlanificados] = useState([]);
  const [loadingGastos, setLoadingGastos] = useState(false);
  const [showResumenDialog, setShowResumenDialog] = useState(false);
  const [resumenOperacion, setResumenOperacion] = useState(null);

  // Inicializar datos de la asignación y cargar gastos planificados
  useEffect(() => {
    if (asignacion) {
      console.log("[EntregarFondosForm] asignacion recibida:", asignacion);

      const montoInicial = Number(asignacion.montoTotal || asignacion.monto || 0);
      const moduloOrigenId = asignacion.moduloOrigen?.id
        ? Number(asignacion.moduloOrigen.id)
        : asignacion.moduloOrigenId
          ? Number(asignacion.moduloOrigenId)
          : null;

      const documentoOrigenId = asignacion.documentoOrigenId
        ? Number(asignacion.documentoOrigenId)
        : null;

      console.log("[EntregarFondosForm] IDs normalizados:", {
        moduloOrigenId,
        documentoOrigenId,
      });

      setFormData((prev) => ({
        ...prev,
        detMovsEntregaRendirId: Number(asignacion.origenId),
        moduloOrigenId,
        documentoOrigenId,
        monto: montoInicial,
      }));

      cargarGastosPlanificados(asignacion.origenId);
    }
  }, [asignacion]);

  // Cargar gastos planificados
  const cargarGastosPlanificados = async (detMovsEntregaRendirId) => {
    if (detMovsEntregaRendirId && detMovsEntregaRendirId > 0) {
      try {
        setLoadingGastos(true);
        const gastos = await getGastosPlanificados({
          detMovEntregaRendirTemporadaPescaId: detMovsEntregaRendirId,
        });
        setGastosPlanificados(gastos);
      } catch (error) {
        console.error("Error al cargar gastos planificados:", error);
        setGastosPlanificados([]);
      } finally {
        setLoadingGastos(false);
      }
    } else {
      setGastosPlanificados([]);
    }
  };

  // Validar formulario
  const validarFormulario = () => {
    const newErrors = {};
    if (!formData.moduloOrigenId) {
      newErrors.moduloOrigenId = "Debe seleccionar un módulo de origen";
    }

    if (!formData.documentoOrigenId) {
      newErrors.documentoOrigenId = "Debe seleccionar un documento de origen";
    }
    if (!formData.cuentaCorrienteOrigenId) {
      newErrors.cuentaCorrienteOrigenId = "Debe seleccionar una cuenta";
    }

    if (!formData.medioPagoId) {
      newErrors.medioPagoId = "Debe seleccionar un medio de pago";
    }

    // Validar monto
    if (!formData.monto || Number(formData.monto) <= 0) {
      newErrors.monto = "El monto debe ser mayor a cero";
    }

    const montoSolicitado = Number(asignacion?.montoTotal || asignacion?.monto || 0);
    if (Number(formData.monto) > montoSolicitado) {
      newErrors.monto = `El monto no puede ser mayor al monto solicitado (${asignacion?.moneda?.simbolo} ${formatearNumero(montoSolicitado)})`;
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

    if (!formData.fechaEntrega) {
      newErrors.fechaEntrega = "Debe seleccionar una fecha";
    }

    // Validar saldo de cuenta
    const cuentaSeleccionada = cuentasCorrientes.find(
      (c) => c.id === formData.cuentaCorrienteOrigenId
    );
    if (cuentaSeleccionada && asignacion) {
      const saldoCuenta = Number(cuentaSeleccionada.saldoActual || 0);
      const montoAsignacion = Number(formData.monto || 0);

      if (saldoCuenta < montoAsignacion) {
        newErrors.cuentaCorrienteOrigenId = `Saldo insuficiente. Disponible: ${asignacion.moneda?.simbolo} ${formatearNumero(saldoCuenta)}`;
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
      detail: "Procesando entrega de fondos...",
      life: 2000,
    });

    try {
      // Llamar al onSubmit que ejecuta el servicio
      const resultado = await onSubmit(formData);

      // Si el resultado contiene datos, mostrar resumen
      if (resultado?.data) {
        const cuentaSeleccionada = cuentasCorrientes.find(
          (c) => c.id === formData.cuentaCorrienteOrigenId
        );

        setResumenOperacion({
          responsable: asignacion?.entidadComercial?.razonSocial || "N/A",
          montoEntregado: formData.monto,
          moneda: asignacion?.moneda,
          movimientoCajaId: resultado.data.id,
          asignacionId: asignacion?.origenId,
          saldoAnterior: Number(cuentaSeleccionada?.saldoActual || 0),
          saldoNuevo: Number(cuentaSeleccionada?.saldoActual || 0) - Number(formData.monto),
          fecha: new Date(),
        });

        setShowResumenDialog(true);
      }
    } catch (error) {
      // El error ya se maneja en el hook useEntregarFondos
      console.error("Error en handleSubmit:", error);
    }
  };

  // Preparar opciones de medios de pago
  const mediosPagoOptions = mediosPago.map((m) => ({
    label: m.nombre,
    value: m.id,
  }));

  // Construir nombre completo del responsable
  const nombreResponsable =
    asignacion?.entidadComercial?.razonSocial || "N/A";

  // Template para monto en tabla de gastos
  const montoTemplate = (rowData) => {
    return (
      <div className="text-right">
        {rowData.moneda?.simbolo} {formatearNumero(rowData.montoPlanificado)}
      </div>
    );
  };

  // Calcular total de gastos planificados
  const totalGastosPlanificados = gastosPlanificados.reduce(
    (sum, gasto) => sum + Number(gasto.montoPlanificado || 0),
    0
  );

  // Obtener monto solicitado
  const montoSolicitado = Number(asignacion?.montoTotal || asignacion?.monto || 0);

  return (
    <>
      <form onSubmit={handleSubmit} className="p-fluid">
        {/* SECCIÓN 1: Información de la Asignación */}
        <Panel header="📋 Información de la Asignación" className="mb-3">
          <div
            style={{
              alignItems: "end",
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label className="block mb-2 font-bold">Empresa</label>
              <InputText
                value={asignacion?.empresa?.razonSocial || "N/A"}
                disabled
                style={{
                  fontWeight: "bold",
                  backgroundColor: "#f8f9fa",
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label className="block mb-2 font-bold">N° Asignación</label>
              <InputText
                value={`ER-${asignacion?.origenId || "N/A"}`}
                disabled
                style={{
                  fontWeight: "bold",
                  backgroundColor: "#f8f9fa",
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label className="block mb-2 font-bold">Fecha Asignación</label>
              <InputText
                value={
                  asignacion?.fechaEmision
                    ? new Date(asignacion.fechaEmision).toLocaleDateString("es-PE")
                    : "N/A"
                }
                disabled
                style={{
                  fontWeight: "bold",
                  backgroundColor: "#f8f9fa",
                }}
              />
            </div>
          </div>

          <div
            style={{
              alignItems: "end",
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 3 }}>
              <ModuloDocumentoSelector
                key={`md-${Number(formData.moduloOrigenId || 0)}-${Number(formData.documentoOrigenId || 0)}`}
                value={useMemo(
                  () => ({
                    moduloOrigenId: Number(formData.moduloOrigenId || 0),
                    documentoOrigenId: Number(formData.documentoOrigenId || 0),
                  }),
                  [formData.moduloOrigenId, formData.documentoOrigenId],
                )}
                onChange={() => {}}
                disabled={loading}
                soloLectura={true}
                moduloLabel="Módulo Origen"
                documentoLabel="Documento Origen"
                allowSinModulo={false}
              />
              {(errors.moduloOrigenId || errors.documentoOrigenId) && (
                <small className="p-error">
                  {errors.moduloOrigenId || errors.documentoOrigenId}
                </small>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label className="block mb-2 font-bold">Responsable</label>
              <InputText
                value={nombreResponsable}
                disabled
                style={{
                  fontWeight: "bold",
                  backgroundColor: "#f8f9fa",
                }}
              />
            </div>
          </div>
          <div
            style={{
              alignItems: "end",
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <TipoMovimientoSelector
                value={Number(asignacion?.tipoMovimiento?.id || 0)}
                tiposMovimiento={tiposMovimiento}
                onChange={() => {}}
                disabled={loading}
                soloLectura={true}
              />
            </div>
          </div>
          <div
            style={{
              alignItems: "start",
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            {/* Descripción */}
            <div style={{ flex: 3 }}>
              <label className="block mb-2 font-bold">Descripción</label>
              <InputTextarea
                value={asignacion?.descripcion || "N/A"}
                disabled
                rows={1}
                style={{
                  fontWeight: "bold",
                  backgroundColor: "#f8f9fa",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="block mb-2 font-bold">Monto Asignado</label>
              <InputText
                value={`${asignacion?.moneda?.simbolo || ""} ${formatearNumero(montoSolicitado)}`}
                disabled
                style={{
                  fontWeight: "bold",
                  backgroundColor: "#f8f9fa",
                  fontSize: "1.1rem",
                  color: "#2196F3",
                }}
              />
            </div>
          </div>
          {asignacion?.embarcacion && (
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div className="col-12" style={{ flex: 1 }}>
                <ActivoSelector
                  value={Number(asignacion.embarcacion.activo?.id || asignacion.embarcacion.id || 0)}
                  onChange={() => {}}
                  disabled={loading}
                  soloLectura={true}
                />
              </div>
            </div>
          )}
        </Panel>

        {/* SECCIÓN 2: Detalle de Gastos Planificados */}
        {gastosPlanificados.length > 0 && (
          <Panel header="📊 Gastos Planificados" className="mb-3">
            <DataTable
              value={gastosPlanificados}
              loading={loadingGastos}
              emptyMessage="No hay gastos planificados registrados"
              size="small"
              stripedRows
              showGridlines
            >
              <Column
                header="#"
                body={(data, options) => options.rowIndex + 1}
                style={{ width: "50px", textAlign: "center" }}
              />
              <Column
                field="producto.descripcionBase"
                header="Concepto (Producto)"
                style={{ minWidth: "250px" }}
              />
              <Column
                field="moneda.codigoSunat"
                header="Moneda"
                style={{ width: "100px", textAlign: "center" }}
              />
              <Column
                header="Monto Planificado"
                body={montoTemplate}
                style={{ width: "150px" }}
              />
              <Column
                field="descripcion"
                header="Descripción"
                style={{ minWidth: "200px" }}
              />
            </DataTable>

            {/* Total */}
            <div className="flex justify-content-end mt-3">
              <div
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e3f2fd",
                  borderRadius: "5px",
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                }}
              >
                TOTAL: {asignacion?.moneda?.simbolo}{" "}
                {formatearNumero(totalGastosPlanificados)}
              </div>
            </div>
          </Panel>
        )}

        <Divider />

        {/* SECCIÓN 3: Datos de la Entrega */}
        <Panel header="💳 Datos de la Entrega">
          <div className="p-fluid">
            {/* Cuenta Corriente Origen */}
            <div className="mb-3">
              <CuentaCorrienteSelector
                empresaIdPreseleccionada={asignacion?.empresa?.id}
                value={formData.cuentaCorrienteOrigenId}
                onChange={({ cuentaCorrienteId }) => {
                  handleChange("cuentaCorrienteOrigenId", cuentaCorrienteId);
                }}
                label="* Cuenta Bancaria Origen"
                disabled={loading}
                placeholder="Seleccione cuenta corriente de origen"
              />
              {errors.cuentaCorrienteOrigenId && (
                <small className="p-error">{errors.cuentaCorrienteOrigenId}</small>
              )}
            </div>

            {/* Fila: Fecha, Moneda, Monto Solicitado, Monto a Entregar */}
            <div className="grid">
              <div className="col-12 md:col-3">
                <label htmlFor="fechaEntrega">* Fecha de Entrega</label>
                <Calendar
                  id="fechaEntrega"
                  value={formData.fechaEntrega}
                  onChange={(e) => handleChange("fechaEntrega", e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled={loading}
                />
                {errors.fechaEntrega && (
                  <small className="p-error">{errors.fechaEntrega}</small>
                )}
              </div>

              <div className="col-12 md:col-2">
                <label htmlFor="moneda">Moneda</label>
                <InputText
                  id="moneda"
                  value={asignacion?.moneda?.codigoSunat || ""}
                  disabled
                  style={{ backgroundColor: "#f0f0f0" }}
                />
              </div>

              <div className="col-12 md:col-2">
                <label htmlFor="montoSolicitado">Monto Solicitado</label>
                <InputNumber
                  id="montoSolicitado"
                  value={montoSolicitado}
                  disabled
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  style={{
                    backgroundColor: "#fff3cd",
                    fontWeight: "bold",
                  }}
                />
              </div>

              <div className="col-12 md:col-2">
                <label htmlFor="monto">* Monto a Entregar</label>
                <InputNumber
                  id="monto"
                  value={formData.monto}
                  onValueChange={(e) => handleChange("monto", e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled={loading}
                  min={0}
                  max={montoSolicitado}
                  className={errors.monto ? "p-invalid" : ""}
                />
                {errors.monto && (
                  <small className="p-error">{errors.monto}</small>
                )}
              </div>

              <div className="col-12 md:col-3">
                <label htmlFor="medioPagoId">* Medio de Pago</label>
                <Dropdown
                  id="medioPagoId"
                  value={formData.medioPagoId}
                  options={mediosPagoOptions}
                  onChange={(e) => handleChange("medioPagoId", e.value)}
                  placeholder="Seleccione medio de pago"
                  disabled={loading}
                />
                {errors.medioPagoId && (
                  <small className="p-error">{errors.medioPagoId}</small>
                )}
              </div>
            </div>

            {/* Número de Operación */}
            <div className="mt-3">
              <label htmlFor="numeroOperacion">Número de Operación</label>
              <InputText
                id="numeroOperacion"
                value={formData.numeroOperacion}
                onChange={(e) => handleChange("numeroOperacion", e.target.value)}
                placeholder="Opcional (requerido si es transferencia)"
                disabled={loading}
              />
              {errors.numeroOperacion && (
                <small className="p-error">{errors.numeroOperacion}</small>
              )}
            </div>

            {/* Observaciones */}
            <div className="mt-3">
              <label htmlFor="observaciones">Observaciones</label>
              <InputTextarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => handleChange("observaciones", e.target.value)}
                rows={3}
                placeholder="Observaciones adicionales (opcional)"
                disabled={loading}
              />
            </div>
          </div>
        </Panel>

        {/* Botones */}
        <div className="flex justify-content-end gap-2 mt-3">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            severity="secondary"
            outlined
            onClick={onCancel}
            type="button"
            disabled={loading}
          />
          <Button
            label="Entregar Fondos"
            icon="pi pi-check"
            severity="success"
            type="submit"
            loading={loading}
          />
        </div>
      </form>

      {/* Dialog de Resumen de Operación */}
      <Dialog
        header="✅ Entrega de Fondos Exitosa"
        visible={showResumenDialog}
        style={{ width: "1000px" }}
        onHide={() => {
          setShowResumenDialog(false);
          onCancel(); // Cerrar el formulario principal
        }}
        modal
      >
        {resumenOperacion && (
          <div className="p-3">
            <div className="mb-3">
              <strong>Responsable:</strong> {resumenOperacion.responsable}
            </div>
            <div className="mb-3">
              <strong>Monto Entregado:</strong>{" "}
              <span style={{ fontSize: "1.2rem", color: "#4CAF50", fontWeight: "bold" }}>
                {resumenOperacion.moneda?.simbolo} {formatearNumero(resumenOperacion.montoEntregado)}
              </span>
            </div>

            <Divider />

            <h4>📋 Operaciones Realizadas:</h4>
            <ul style={{ listStyle: "none", padding: 0 }}>
              <li className="mb-2">
                ✅ <strong>Movimiento de Caja:</strong> MC-{resumenOperacion.movimientoCajaId}
              </li>
              <li className="mb-2">
                ✅ <strong>Asignación Actualizada:</strong> ER-{resumenOperacion.asignacionId}
              </li>
              <li className="mb-2">
                ✅ <strong>Saldo de Cuenta:</strong>{" "}
                {resumenOperacion.moneda?.simbolo} {formatearNumero(resumenOperacion.saldoAnterior)} →{" "}
                {resumenOperacion.moneda?.simbolo} {formatearNumero(resumenOperacion.saldoNuevo)}
              </li>
            </ul>

            <Divider />

            <div className="text-center" style={{ color: "#666", fontSize: "0.9rem" }}>
              Fecha: {resumenOperacion.fecha.toLocaleString("es-PE")}
            </div>

            <div className="flex justify-content-center mt-4">
              <Button
                label="Aceptar"
                icon="pi pi-check"
                onClick={() => {
                  setShowResumenDialog(false);
                  onCancel(); // Cerrar el formulario principal
                }}
                autoFocus
              />
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
};

export default EntregarFondosForm;