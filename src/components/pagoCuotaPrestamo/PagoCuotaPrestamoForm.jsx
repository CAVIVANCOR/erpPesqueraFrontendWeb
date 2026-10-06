// src/components/pagoCuotaPrestamo/PagoCuotaPrestamoForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Tag } from "primereact/tag";
import { formatearNumero, formatearFecha } from "../../utils/utils";
import { sincronizarAdjuntosPagoCuotaPrestamo } from "../../api/tesoreria/operacionPrestamo";
import PdfVoucherConsolidadoPagoCuotaPrestamoCard from "./PdfVoucherConsolidadoPagoCuotaPrestamoCard";
import PdfComprobanteEntidadFinancieraCard from "../movimientoCaja/PrestamosPagoEspecializado/PdfComprobanteEntidadFinancieraCard";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * FORMULARIO DE CONSULTA Y EDICIÓN DE UN PAGO DE CUOTA DE PRÉSTAMO
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Los pagos NO se crean aquí: se registran únicamente desde Caja y Bancos (pago especializado),
 * que genera movimientos de caja, saldos y asientos. Por eso:
 *   - Pago generado desde Caja: solo se edita la observación y el comprobante del banco; importes
 *     y fecha son de solo lectura porque ya tienen movimientos y asientos asociados.
 *   - Pago sin movimiento de Caja: también se pueden corregir los importes y la fecha.
 *   - El voucher consolidado se muestra pero no se modifica (se genera automáticamente).
 *
 * Una operación puede tener varios pagos (uno por cuota). Al subir o quitar el comprobante se
 * copia a los demás pagos de la misma operación (sincronizarAdjuntosPagoCuotaPrestamo).
 *
 * Props (mismo contrato que PagoDeudaPersonalForm):
 * - isEdit: habilita la Auditoría
 * - defaultValues: registro de PagoCuotaPrestamo (con cuotaPrestamo.prestamo y movimientoCaja)
 * - onSubmit(dataPago): guarda los cambios
 * - onAdjuntosCambiados(): se llama tras sincronizar adjuntos, para que el padre recargue
 */
const PagoCuotaPrestamoForm = ({
  isEdit = true,
  defaultValues,
  onSubmit,
  onCancel,
  onAdjuntosCambiados,
  loading = false,
  readOnly = false,
  toast,
}) => {
  const pago = defaultValues;
  const cuota = pago?.cuotaPrestamo;
  const prestamo = cuota?.prestamo;
  const simbolo = prestamo?.moneda?.simbolo || "";

  // Pago generado desde Caja: importes y fecha bloqueados
  const importesEditables = !pago?.movimientoCajaId && !readOnly;

  const [observaciones, setObservaciones] = useState(pago?.observaciones || "");
  const [fechaPago, setFechaPago] = useState(pago?.fechaPago ? new Date(pago.fechaPago) : null);
  const [importes, setImportes] = useState({
    montoCapital: Number(pago?.montoCapital || 0),
    montoInteres: Number(pago?.montoInteres || 0),
    montoSeguro: Number(pago?.montoSeguro || 0),
    montoComision: Number(pago?.montoComision || 0),
    montoMora: Number(pago?.montoMora || 0),
  });
  const totalPago = Object.values(importes).reduce((suma, valor) => suma + Number(valor || 0), 0);

  // Adjuntos: el sistema PDF actualiza la BD directamente; el formulario solo refleja las URLs
  const {
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      urlVoucherOperacionConsolidado: pago?.urlVoucherOperacionConsolidado || null,
      urlComprobanteOperacion: pago?.urlComprobanteOperacion || null,
    },
  });

  // Al subir o eliminar el comprobante se copia a los demás pagos de la operación.
  // El primer render se omite: aún no hay cambio del usuario.
  const urlComprobante = watch("urlComprobanteOperacion");
  const omitirPrimerRender = useRef(true);
  useEffect(() => {
    if (omitirPrimerRender.current) {
      omitirPrimerRender.current = false;
      return;
    }
    if (!pago?.id) return;
    sincronizarAdjuntosPagoCuotaPrestamo(pago.id)
      .then(() => onAdjuntosCambiados?.())
      .catch((error) => {
        console.error("Error al sincronizar el comprobante con los pagos de la operación:", error);
        toast?.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "El comprobante se guardó, pero no se pudo copiar a los demás pagos de la operación",
          life: 5000,
        });
      });
  }, [urlComprobante]);

  const handleSubmit = () => {
    if (!importesEditables) {
      onSubmit({ observaciones });
      return;
    }
    onSubmit({ observaciones, fechaPago: fechaPago?.toISOString(), ...importes });
  };

  const estiloSoloLectura = { fontWeight: "bold", backgroundColor: "#f8f9fa" };
  const filaStyle = {
    alignItems: "end",
    display: "flex",
    gap: 10,
    marginBottom: 10,
    flexDirection: window.innerWidth < 768 ? "column" : "row",
  };

  const campoImporte = (clave, etiqueta) => (
    <div style={{ flex: 1 }}>
      <label className="font-bold">
        {etiqueta} ({simbolo})
      </label>
      <InputNumber
        value={importes[clave]}
        onValueChange={(e) => setImportes((prev) => ({ ...prev, [clave]: e.value ?? 0 }))}
        mode="decimal"
        minFractionDigits={2}
        maxFractionDigits={2}
        min={0}
        disabled={!importesEditables || loading}
      />
    </div>
  );

  return (
    <div className="p-fluid">
      {/* SECCIÓN 1: Préstamo y cuota */}
      <Panel header="🏦 Préstamo y Cuota" className="mb-3">
        <div style={filaStyle}>
          <div style={{ flex: 2 }}>
            <label className="font-bold">Empresa</label>
            <InputText value={prestamo?.empresa?.razonSocial || "-"} disabled style={estiloSoloLectura} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="font-bold">Préstamo</label>
            <InputText value={prestamo?.numeroPrestamo || "-"} disabled style={estiloSoloLectura} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="font-bold">Banco</label>
            <InputText value={prestamo?.banco?.nombre || "-"} disabled style={estiloSoloLectura} />
          </div>
        </div>
        <div style={filaStyle}>
          <div style={{ flex: 1 }}>
            <label className="font-bold">Cuota</label>
            <InputText
              value={cuota ? `${cuota.numeroCuota} / ${prestamo?.numeroCuotas ?? "-"}` : "-"}
              disabled
              style={estiloSoloLectura}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="font-bold">Vencimiento de la Cuota</label>
            <InputText
              value={formatearFecha(cuota?.fechaVencimiento, "-")}
              disabled
              style={estiloSoloLectura}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="font-bold">Total de la Cuota</label>
            <InputText
              value={`${simbolo} ${formatearNumero(cuota?.montoTotal || 0)}`}
              disabled
              style={estiloSoloLectura}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="font-bold">Pagado a la Fecha</label>
            <InputText
              value={`${simbolo} ${formatearNumero(cuota?.montoPagado || 0)}`}
              disabled
              style={estiloSoloLectura}
            />
          </div>
        </div>
      </Panel>

      {/* SECCIÓN 2: Datos del pago */}
      <Panel header="💳 Datos del Pago" className="mb-3">
        <div style={filaStyle}>
          <div style={{ flex: 1 }}>
            <label className="font-bold">Fecha de Pago</label>
            <Calendar
              value={fechaPago}
              onChange={(e) => setFechaPago(e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              disabled={!importesEditables || loading}
            />
          </div>
          {campoImporte("montoCapital", "Capital")}
          {campoImporte("montoInteres", "Interés")}
          {campoImporte("montoSeguro", "Seguro")}
          {campoImporte("montoComision", "Comisión")}
          {campoImporte("montoMora", "Mora")}
          <div style={{ flex: 1 }}>
            <label className="font-bold">Total del Pago ({simbolo})</label>
            <InputNumber
              value={totalPago}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              disabled
            />
          </div>
        </div>

        {!importesEditables && !readOnly && (
          <small className="block mb-2 text-600">
            Este pago se generó desde Caja y Bancos: el importe y la fecha no se pueden modificar
            porque ya tienen movimientos de caja y asientos asociados.
          </small>
        )}

        <div style={filaStyle}>
          <div style={{ flex: 1 }}>
            <label htmlFor="observaciones" className="font-bold">Observaciones</label>
            <InputTextarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              disabled={readOnly || loading}
            />
          </div>
        </div>
      </Panel>

      {/* SECCIÓN 3: Integración con Caja (solo lectura) */}
      <Panel header="🧾 Integración con Caja y Bancos" className="mb-3" toggleable>
        <div style={filaStyle}>
          <div style={{ flex: 1 }}>
            <label className="font-bold">Nº Operación (Correlativo)</label>
            <InputText
              value={pago?.refOperacionEspecializadaMovCaja ?? "-"}
              disabled
              style={estiloSoloLectura}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="font-bold">Movimiento de Caja</label>
            <InputText value={pago?.movimientoCajaId ?? "-"} disabled style={estiloSoloLectura} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="font-bold">Medio de Pago</label>
            <InputText
              value={pago?.movimientoCaja?.medioPago?.nombre || "-"}
              disabled
              style={estiloSoloLectura}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="font-bold">Nº Operación Bancaria</label>
            <InputText
              value={pago?.movimientoCaja?.numeroOperacionPagoBanco || "-"}
              disabled
              style={estiloSoloLectura}
            />
          </div>
        </div>
        {!pago?.movimientoCajaId && (
          <Tag severity="warning" value="Pago sin movimiento de caja asociado" />
        )}
      </Panel>

      {/* SECCIÓN 4: Adjuntos */}
      {pago?.id && (
        <Panel header="📎 Adjuntos de la Operación" className="mb-3">
          <PdfVoucherConsolidadoPagoCuotaPrestamoCard
            pagoId={pago.id}
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={{
              urlVoucherOperacionConsolidado: pago.urlVoucherOperacionConsolidado,
            }}
          />
          <div className="mt-3">
            <PdfComprobanteEntidadFinancieraCard
              pagoId={pago.id}
              control={control}
              errors={errors}
              setValue={setValue}
              watch={watch}
              getValues={getValues}
              defaultValues={{ urlComprobanteOperacion: pago.urlComprobanteOperacion }}
              readOnly={readOnly}
            />
          </div>
        </Panel>
      )}

      {/* PANEL: Auditoría (solo visible en edición) */}
      {isEdit && (
        <Panel header="Auditoría">
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label>Creado Por</label>
              <InputText
                value={pago?.creadoPor ? `Usuario ID: ${pago.creadoPor}` : "N/A"}
                disabled
                style={{ width: "100%", backgroundColor: "#f0f0f0" }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label>Fecha Creación</label>
              <Calendar
                value={pago?.creadoEn ? new Date(pago.creadoEn) : null}
                disabled
                dateFormat="dd/mm/yy"
                showTime
                style={{ width: "100%", backgroundColor: "#f0f0f0" }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label>Actualizado Por</label>
              <InputText
                value={pago?.actualizadoPor ? `Usuario ID: ${pago.actualizadoPor}` : "N/A"}
                disabled
                style={{ width: "100%", backgroundColor: "#f0f0f0" }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label>Fecha Actualización</label>
              <Calendar
                value={pago?.actualizadoEn ? new Date(pago.actualizadoEn) : null}
                disabled
                dateFormat="dd/mm/yy"
                showTime
                style={{ width: "100%", backgroundColor: "#f0f0f0" }}
              />
            </div>
          </div>
        </Panel>
      )}

      {/* BOTONES */}
      {!readOnly && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 18,
          }}
        >
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-secondary mr-2"
            onClick={onCancel}
            disabled={loading}
          />
          <Button
            label="Actualizar"
            icon="pi pi-check"
            className="p-button-success"
            onClick={handleSubmit}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
};

export default PagoCuotaPrestamoForm;
