// src/components/tesoreria/CuotaPrestamoForm.jsx
import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Panel } from "primereact/panel";
import { Tag } from "primereact/tag";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { getEstadosMultiFuncionPorTipoProvieneDe } from "../../api/estadoMultiFuncion";
import { getPagosCuotaPrestamo } from "../../api/tesoreria/pagoCuotaPrestamo";
import { ESTADO_CUOTA_PRESTAMO, formatearNumero, formatearFecha } from "../../utils/utils";

export default function CuotaPrestamoForm({
  isEdit = false,
  isPago = false,
  defaultValues = {},
  prestamoBancarioId,
  onSubmit,
  onCancel,
  loading,
}) {
  const [formData, setFormData] = useState({
    numeroCuota: defaultValues?.numeroCuota || 1,
    fechaVencimiento: defaultValues?.fechaVencimiento ? new Date(defaultValues.fechaVencimiento) : new Date(),
    saldoCapitalAntes: defaultValues?.saldoCapitalAntes || 0,
    montoCapital: defaultValues?.montoCapital || 0,
    montoInteres: defaultValues?.montoInteres || 0,
    montoComision: defaultValues?.montoComision || 0,
    montoSeguro: defaultValues?.montoSeguro || 0,
    montoTotal: defaultValues?.montoTotal || 0,
    saldoCapitalDespues: defaultValues?.saldoCapitalDespues || 0,
    estadoCuotaId: Number(defaultValues?.estadoCuotaId || ESTADO_CUOTA_PRESTAMO.PENDIENTE),
    fechaPago: defaultValues?.fechaPago ? new Date(defaultValues.fechaPago) : new Date(),
    montoPagado: defaultValues?.montoPagado || defaultValues?.montoTotal || 0,
  });

  const [estadosOptions, setEstadosOptions] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [loadingPagos, setLoadingPagos] = useState(false);

  // Detalle de pagos de la cuota: solo en edición de una cuota ya guardada
  useEffect(() => {
    if (!isEdit || !defaultValues?.id) return;
    setLoadingPagos(true);
    getPagosCuotaPrestamo({ cuotaPrestamoId: defaultValues.id })
      .then((data) => setPagos(data || []))
      .catch((error) => console.error("Error al cargar los pagos de la cuota:", error))
      .finally(() => setLoadingPagos(false));
  }, [isEdit, defaultValues?.id]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Calcular cuota total automáticamente (Capital + Interés + Comisión + Seguro)
      if (field === "montoCapital" || field === "montoInteres" || field === "montoComision" || field === "montoSeguro") {
        newData.montoTotal =
          Number(newData.montoCapital || 0) +
          Number(newData.montoInteres || 0) +
          Number(newData.montoComision || 0) +
          Number(newData.montoSeguro || 0);
      }

      // Los saldos se calculan automáticamente en el backend

      return newData;
    });
  };

  useEffect(() => {
    cargarEstados();
  }, []);

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      setFormData({
        numeroCuota: defaultValues?.numeroCuota || 1,
        fechaVencimiento: defaultValues?.fechaVencimiento ? new Date(defaultValues.fechaVencimiento) : new Date(),
        saldoCapitalAntes: defaultValues?.saldoCapitalAntes || 0,
        montoCapital: defaultValues?.montoCapital || 0,
        montoInteres: defaultValues?.montoInteres || 0,
        montoComision: defaultValues?.montoComision || 0,
        montoSeguro: defaultValues?.montoSeguro || 0,
        montoTotal: defaultValues?.montoTotal || 0,
        saldoCapitalDespues: defaultValues?.saldoCapitalDespues || 0,
        estadoCuotaId: Number(defaultValues?.estadoCuotaId || ESTADO_CUOTA_PRESTAMO.PENDIENTE),
        fechaPago: defaultValues?.fechaPago ? new Date(defaultValues.fechaPago) : new Date(),
        montoPagado: defaultValues?.montoPagado || defaultValues?.montoTotal || 0,
      });
    }
  }, [defaultValues]);

  const cargarEstados = async () => {
    try {
      const estados = await getEstadosMultiFuncionPorTipoProvieneDe(31);
      const options = estados.map(e => ({
        label: e.descripcion,
        value: Number(e.id),
      }));
      setEstadosOptions(options);
    } catch (error) {
      console.error("Error al cargar estados:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isPago) {
      // Solo enviar datos de pago
      const dataToSend = {
        fechaPago: formData.fechaPago,
        montoPagado: Number(formData.montoPagado),
      };
      await onSubmit(dataToSend);
    } else {
      // Enviar datos completos de cuota
      const dataToSend = {
        numeroCuota: Number(formData.numeroCuota),
        fechaVencimiento: formData.fechaVencimiento,
        montoCapital: Number(formData.montoCapital),
        montoInteres: Number(formData.montoInteres),
        montoComision: Number(formData.montoComision),
        montoSeguro: Number(formData.montoSeguro),
        montoTotal: Number(formData.montoTotal),
        estadoCuotaId: Number(formData.estadoCuotaId),
      };
      await onSubmit(dataToSend);
    }
  };

  if (isPago) {
    // Formulario simplificado para registrar pago
    return (
      <form onSubmit={handleSubmit} className="p-fluid">
        <div style={{ marginBottom: 20 }}>
          <label htmlFor="fechaPago" style={{ fontWeight: "bold" }}>
            Fecha de Pago *
          </label>
          <Calendar
            id="fechaPago"
            value={formData.fechaPago}
            onChange={(e) => handleChange("fechaPago", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            required
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label htmlFor="montoPagado" style={{ fontWeight: "bold" }}>
            Monto Pagado *
          </label>
          <InputNumber
            id="montoPagado"
            value={formData.montoPagado}
            onValueChange={(e) => handleChange("montoPagado", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            required
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <Button label="Cancelar" icon="pi pi-times" onClick={onCancel} className="p-button-text" type="button" disabled={loading} />
          <Button label="Registrar Pago" icon="pi pi-check" type="submit" disabled={loading} loading={loading} />
        </div>
      </form>
    );
  }

  // Formulario completo para crear/editar cuota
  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div style={{ display: "flex", gap: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="numeroCuota" style={{ fontWeight: "bold" }}>
            Número de Cuota *
          </label>
          <InputNumber
            id="numeroCuota"
            value={formData.numeroCuota}
            onValueChange={(e) => handleChange("numeroCuota", e.value)}
            min={1}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaVencimiento" style={{ fontWeight: "bold" }}>
            Fecha de Vencimiento *
          </label>
          <Calendar
            id="fechaVencimiento"
            value={formData.fechaVencimiento}
            onChange={(e) => handleChange("fechaVencimiento", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="estadoCuotaId" style={{ fontWeight: "bold" }}>
            Estado *
          </label>
          <Dropdown
            id="estadoCuotaId"
            value={formData.estadoCuotaId}
            options={estadosOptions}
            onChange={(e) => handleChange("estadoCuotaId", e.value)}
            required
            disabled
            tooltip="El estado se actualiza automáticamente"
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="saldoCapitalAntes" style={{ fontWeight: "bold" }}>
            Saldo Capital Antes
          </label>
          <InputNumber
            id="saldoCapitalAntes"
            value={formData.saldoCapitalAntes}
            onValueChange={(e) => handleChange("saldoCapitalAntes", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            disabled
            tooltip="Calculado automáticamente por el sistema"
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="montoCapital" style={{ fontWeight: "bold" }}>
            Monto Capital *
          </label>
          <InputNumber
            id="montoCapital"
            value={formData.montoCapital}
            onValueChange={(e) => handleChange("montoCapital", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="montoInteres" style={{ fontWeight: "bold" }}>
            Monto Interés *
          </label>
          <InputNumber
            id="montoInteres"
            value={formData.montoInteres}
            onValueChange={(e) => handleChange("montoInteres", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            required
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="montoComision" style={{ fontWeight: "bold" }}>
            Monto Comisión
          </label>
          <InputNumber
            id="montoComision"
            value={formData.montoComision}
            onValueChange={(e) => handleChange("montoComision", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="montoSeguro" style={{ fontWeight: "bold" }}>
            Monto Seguro
          </label>
          <InputNumber
            id="montoSeguro"
            value={formData.montoSeguro}
            onValueChange={(e) => handleChange("montoSeguro", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="montoTotal" style={{ fontWeight: "bold" }}>
            Monto Total *
          </label>
          <InputNumber
            id="montoTotal"
            value={formData.montoTotal}
            onValueChange={(e) => handleChange("montoTotal", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            required
            disabled
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="saldoCapitalDespues" style={{ fontWeight: "bold" }}>
            Saldo Capital Después
          </label>
          <InputNumber
            id="saldoCapitalDespues"
            value={formData.saldoCapitalDespues}
            onValueChange={(e) => handleChange("saldoCapitalDespues", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            disabled
            tooltip="Calculado automáticamente por el sistema"
          />
        </div>
      </div>

      {isEdit && defaultValues?.id && (
        <>
          {/* Estado de pago: lo calcula el sistema desde los pagos, por eso es de solo lectura */}
          <Panel header="💳 Estado de Pago de la Cuota" className="mt-3">
            <div style={{ display: "flex", gap: 10, marginBottom: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: "bold" }}>Fecha del Último Pago</label>
                <InputText value={formatearFecha(defaultValues.fechaPago, "-")} disabled />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: "bold" }}>Monto Pagado</label>
                <InputNumber
                  value={Number(defaultValues.montoPagado || 0)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled
                  tooltip="Capital + interés + seguro + comisión de los pagos. No incluye mora"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: "bold" }}>Saldo Pendiente</label>
                <InputNumber
                  value={defaultValues.saldoInicialPagada
                    ? 0
                    : Math.max(Number(defaultValues.montoTotal || 0) - Number(defaultValues.montoPagado || 0), 0)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: "bold" }}>Mora Acumulada</label>
                <InputNumber
                  value={Number(defaultValues.montoMora || 0)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: "bold" }}>Días de Mora</label>
                <InputNumber value={Number(defaultValues.diasMora || 0)} disabled />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: "bold", display: "block" }}>Histórico (Saldo Inicial)</label>
                <Tag
                  severity={defaultValues.saldoInicialPagada ? "info" : "secondary"}
                  value={defaultValues.saldoInicialPagada ? "Sí: pagada antes del 01/01/2026" : "No"}
                  style={{ marginTop: 8 }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontWeight: "bold" }}>Observaciones</label>
              <InputTextarea value={defaultValues.observaciones || ""} rows={2} disabled />
            </div>
          </Panel>

          {/* Detalle de los pagos registrados desde Caja y Bancos */}
          <Panel header={`📋 Detalle de Pagos (${pagos.length})`} className="mt-3">
            <DataTable
              value={pagos}
              dataKey="id"
              loading={loadingPagos}
              size="small"
              showGridlines
              stripedRows
              emptyMessage={
                defaultValues.saldoInicialPagada
                  ? "Cuota histórica: se pagó antes del saldo inicial y no tiene pagos registrados."
                  : "Esta cuota aún no tiene pagos registrados."
              }
              footer={pagos.length > 0 && (
                <div className="flex justify-content-end font-bold">
                  TOTAL PAGADO: {formatearNumero(pagos.reduce((suma, p) => suma + Number(p.montoTotal || 0), 0))}
                </div>
              )}
            >
              <Column field="refOperacionEspecializadaMovCaja" header="Operación" style={{ minWidth: "5rem" }} />
              <Column header="Fecha Pago" body={(p) => formatearFecha(p.fechaPago, "-")} style={{ minWidth: "6rem" }} />
              <Column header="Capital" body={(p) => formatearNumero(p.montoCapital)} style={{ textAlign: "right" }} />
              <Column header="Interés" body={(p) => formatearNumero(p.montoInteres)} style={{ textAlign: "right" }} />
              <Column header="Seguro" body={(p) => formatearNumero(p.montoSeguro)} style={{ textAlign: "right" }} />
              <Column header="Comisión" body={(p) => formatearNumero(p.montoComision)} style={{ textAlign: "right" }} />
              <Column header="Mora" body={(p) => formatearNumero(p.montoMora)} style={{ textAlign: "right" }} />
              <Column
                header="Total"
                body={(p) => <b>{formatearNumero(p.montoTotal)}</b>}
                style={{ textAlign: "right" }}
              />
              <Column field="diasMora" header="Días Mora" style={{ textAlign: "center" }} />
              <Column
                header="Origen"
                body={(p) => (
                  <Tag
                    severity={p.movimientoCajaId ? "success" : "warning"}
                    value={p.movimientoCajaId ? "Caja y Bancos" : "Sin caja"}
                  />
                )}
              />
            </DataTable>
          </Panel>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
        <Button label="Cancelar" icon="pi pi-times" onClick={onCancel} className="p-button-text" type="button" disabled={loading} />
        <Button label={isEdit ? "Actualizar" : "Guardar"} icon="pi pi-check" type="submit" disabled={loading} loading={loading} />
      </div>
    </form>
  );
}