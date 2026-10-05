// src/components/deudaConPersonal/PagoDeudaPersonalForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Tag } from "primereact/tag";
import { formatearNumero } from "../../utils/utils";
import { sincronizarAdjuntosPagoDeudaPersonal } from "../../api/tesoreria/pagoDeudaPersonal";
import PdfVoucherConsolidadoPagoDeudaPersonalCard from "./PdfVoucherConsolidadoPagoDeudaPersonalCard";
import PdfComprobanteEntidadRecaudadoraCard from "../movimientoCaja/DeudasPersonalPagoEspecializado/PdfComprobanteEntidadRecaudadoraCard";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * FORMULARIO DE CONSULTA Y EDICIÓN DE UN PAGO DE DEUDA CON PERSONAL
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Los pagos NO se crean aquí: se registran únicamente desde Caja y Bancos (pago especializado),
 * que genera movimientos de caja, saldos y asientos. Por eso este formulario es solo de
 * consulta y edición acotada:
 *   - Solo lectura: deuda, fecha, monto, medio de pago, nº de operación bancaria y datos contables.
 *   - Editable: observaciones y el comprobante de la entidad recaudadora.
 *   - El voucher consolidado se muestra pero no se modifica (se genera automáticamente).
 *
 * Una operación puede tener varios pagos (uno por deuda). Al subir o quitar el comprobante se
 * copia a los demás pagos de la misma operación (sincronizarAdjuntosPagoDeudaPersonal).
 *
 * Se invoca desde DeudaConPersonalForm (pestaña Pagos) y desde la pantalla pages/PagoDeudaPersonal.
 *
 * Props (mismo contrato que PagoCuentaPorPagarForm):
 * - isEdit: siempre true en la práctica (los pagos no se crean aquí); habilita la Auditoría
 * - defaultValues: registro de PagoDeudaPersonal a mostrar/editar
 * - deuda: datos de la deuda (opcional; si no viene se usa defaultValues.deudaConPersonal)
 *          { personalNombre, tipoDeudaNombre, numeroDocumento, saldoPendiente, moneda }
 * - mediosPago, periodosContables: catálogos para mostrar nombres
 * - onSubmit(dataPago): guarda los cambios (observaciones)
 * - onAdjuntosCambiados(): se llama tras sincronizar adjuntos, para que el padre recargue
 */
const PagoDeudaPersonalForm = ({
  isEdit = true,
  defaultValues,
  deuda = null,
  mediosPago = [],
  periodosContables = [],
  onSubmit,
  onCancel,
  onAdjuntosCambiados,
  loading = false,
  readOnly = false,
  toast,
}) => {
  // Mismo contrato que PagoCuentaPorPagarForm (isEdit + defaultValues); aquí defaultValues
  // es el registro de PagoDeudaPersonal
  const pago = defaultValues;
  const [observaciones, setObservaciones] = useState(pago?.observaciones || "");

  // Datos de la deuda: los entrega el padre o vienen anidados en el pago (listado)
  const deudaPago = pago?.deudaConPersonal;
  const personalNombre =
    deuda?.personalNombre ||
    (deudaPago?.personal
      ? `${deudaPago.personal.nombres || ""} ${deudaPago.personal.apellidos || ""}`.trim()
      : "-");
  const tipoDeudaNombre = deuda?.tipoDeudaNombre || deudaPago?.tipoDeuda?.nombre || "-";
  const numeroDocumento = deuda?.numeroDocumento ?? deudaPago?.numeroDocumento;
  const saldoPendiente = deuda?.saldoPendiente ?? deudaPago?.saldoPendiente;
  const moneda = deuda?.moneda || deudaPago?.moneda;
  const simbolo = moneda?.simbolo || "";

  // Mismo armado de opciones que PagoCuentaPorPagarForm: el ID del catálogo puede llegar como
  // texto (BigInt serializado) y el Dropdown compara con igualdad estricta, por eso se normaliza
  const mediosPagoOptions =
    mediosPago?.map((m) => ({
      label: m.nombre,
      value: Number(m.id),
    })) || [];

  const periodoContable =
    pago?.periodoContable ||
    periodosContables.find((p) => Number(p.id) === Number(pago?.periodoContableId));

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
    sincronizarAdjuntosPagoDeudaPersonal(pago.id)
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
    onSubmit({ observaciones });
  };

  const estiloSoloLectura = { fontWeight: "bold", backgroundColor: "#f8f9fa" };
  const filaStyle = {
    alignItems: "end",
    display: "flex",
    gap: 10,
    marginBottom: 10,
    flexDirection: window.innerWidth < 768 ? "column" : "row",
  };

  return (
    <div className="p-fluid">
      {/* SECCIÓN 1: Datos del pago */}
      <Panel header="💳 Datos del Pago" className="mb-3">
        <div style={filaStyle}>
          <div style={{ flex: 2 }}>
            <label className="font-bold">Personal</label>
            <InputText value={personalNombre} disabled style={estiloSoloLectura} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="font-bold">Tipo de Deuda</label>
            <InputText value={tipoDeudaNombre} disabled style={estiloSoloLectura} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="font-bold">Documento</label>
            <InputText value={numeroDocumento || "S/N"} disabled style={estiloSoloLectura} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="font-bold">Saldo Pendiente de la Deuda</label>
            <InputText
              value={`${simbolo} ${formatearNumero(saldoPendiente || 0)}`}
              disabled
              style={estiloSoloLectura}
            />
          </div>
        </div>

        <div style={filaStyle}>
          <div style={{ flex: 1 }}>
            <label className="font-bold">Fecha de Pago</label>
            <Calendar
              value={pago?.fechaPago ? new Date(pago.fechaPago) : null}
              dateFormat="dd/mm/yy"
              showIcon
              disabled
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="font-bold">Monto Pagado ({simbolo})</label>
            <InputNumber
              value={Number(pago?.montoPago || 0)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              disabled
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="font-bold">Medio de Pago</label>
            <Dropdown
              value={pago?.medioPagoId ? Number(pago.medioPagoId) : null}
              options={mediosPagoOptions}
              placeholder="-"
              disabled
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="font-bold">Nº Operación Bancaria</label>
            <InputText value={pago?.numeroOperacion || ""} disabled style={estiloSoloLectura} />
          </div>
        </div>

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

      {/* SECCIÓN 2: Integración contable (solo lectura) */}
      <Panel header="🧾 Integración Contable" className="mb-3" toggleable>
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
            <label className="font-bold">Fecha Contable</label>
            <Calendar
              value={pago?.fechaContable ? new Date(pago.fechaContable) : null}
              dateFormat="dd/mm/yy"
              showIcon
              disabled
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="font-bold">Período Contable</label>
            <InputText
              value={periodoContable?.nombrePeriodo || "-"}
              disabled
              style={estiloSoloLectura}
            />
          </div>
        </div>
        {!pago?.movimientoCajaId && (
          <Tag severity="warning" value="Pago sin movimiento de caja asociado" />
        )}
      </Panel>

      {/* SECCIÓN 3: Adjuntos */}
      {pago?.id && (
        <Panel header="📎 Adjuntos de la Operación" className="mb-3">
          <PdfVoucherConsolidadoPagoDeudaPersonalCard
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
            <PdfComprobanteEntidadRecaudadoraCard
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

      {/* PANEL: Auditoría (solo visible en edición) - mismo diseño que PagoCuentaPorPagarForm */}
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

      {/* BOTONES - mismo diseño que PagoCuentaPorPagarForm */}
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

export default PagoDeudaPersonalForm;
