// src/components/tesoreria/PrestamoEntidadForm.jsx
// Préstamo con accionista o tercero: registro de saldo inicial (préstamos anteriores al sistema) y
// edición de datos básicos. Los préstamos nuevos nacen en Tesorería (Operaciones > Préstamos Accionistas / Terceros).
import React, { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { SelectButton } from "primereact/selectbutton";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import EntidadComercialSelector from "../common/EntidadComercialSelector";
import { getEmpresas } from "../../api/empresa";
import { getMonedas } from "../../api/moneda";
import {
  createPrestamoEntidad,
  updatePrestamoEntidad,
  getAsientosAperturaPrestamoEntidad,
  generarAsientoAperturaPrestamoEntidad,
  eliminarAsientosAperturaPrestamoEntidad,
} from "../../api/tesoreria/prestamosEntidad";
import { mensajeDeError } from "../../utils/mensajeError";
import { formatearNumero, getResponsiveFontSize } from "../../utils/utils";

const etiqueta = { fontWeight: "bold", display: "block", marginBottom: 5 };
const aFecha = (f) => (f ? new Date(f) : null);
const aISO = (f) => (f ? `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}` : null);
const SENTIDOS = [
  { label: "Recibido (la empresa es la deudora)", value: "RECIBIDO" },
  { label: "Otorgado (la empresa es la acreedora)", value: "OTORGADO" },
];
const CONTRAPARTES = [
  { label: "Accionista", value: true },
  { label: "Tercero", value: false },
];

export default function PrestamoEntidadForm({ prestamo, isEdit, onSave, onCancel, readOnly = false, puedeCrear = false, puedeEliminar = false }) {
  const toast = useRef(null);
  const [empresas, setEmpresas] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [asientos, setAsientos] = useState([]);
  const [procesandoAsiento, setProcesandoAsiento] = useState(false);
  const [filasExpandidas, setFilasExpandidas] = useState(null);

  const [empresaId, setEmpresaId] = useState(prestamo ? Number(prestamo.empresaId) : null);
  const [entidadId, setEntidadId] = useState(prestamo ? Number(prestamo.entidadComercialId) : null);
  const [sentido, setSentido] = useState(prestamo?.sentido || "RECIBIDO");
  const [esAccionista, setEsAccionista] = useState(prestamo ? Boolean(prestamo.esAccionista) : true);
  const [monedaId, setMonedaId] = useState(prestamo ? Number(prestamo.monedaId) : null);
  const [fechaDesembolso, setFechaDesembolso] = useState(aFecha(prestamo?.fechaDesembolso) || new Date());
  const [fechaVencimiento, setFechaVencimiento] = useState(aFecha(prestamo?.fechaVencimiento));
  const [montoDesembolsado, setMontoDesembolsado] = useState(prestamo ? Number(prestamo.montoDesembolsado) : 0);
  const [montoPagadoAnterior, setMontoPagadoAnterior] = useState(prestamo ? Number(prestamo.montoPagadoAnterior || 0) : 0);
  const [tipoCambio, setTipoCambio] = useState(prestamo?.tipoCambioAplicado ? Number(prestamo.tipoCambioAplicado) : null);
  const [observaciones, setObservaciones] = useState(prestamo?.observaciones || "");

  // Con respaldo en caja o con pagos solo se editan vencimiento y observaciones
  const esSaldoInicialSinCaja = isEdit && Boolean(prestamo?.esSaldoInicial) && !prestamo?.movimientoCajaDesembolsoId;
  const soloBasicos =
    isEdit && (!prestamo?.esSaldoInicial || Boolean(prestamo?.movimientoCajaDesembolsoId) || (prestamo?.pagos?.length || 0) > 0 || asientos.length > 0);
  const bloqueado = readOnly || soloBasicos;

  useEffect(() => {
    Promise.all([getEmpresas(), getMonedas()])
      .then(([e, m]) => {
        setEmpresas(e);
        setMonedas(m);
      })
      .catch((err) => toast.current?.show({ severity: "error", summary: "No se pudieron cargar los datos", detail: mensajeDeError(err, "Error al cargar empresas y monedas"), life: 8000 }));
  }, []);

  const cargarAsientos = async () => {
    if (!esSaldoInicialSinCaja || !prestamo?.id) return;
    try {
      setAsientos(await getAsientosAperturaPrestamoEntidad(Number(prestamo.id)));
    } catch (err) {
      toast.current?.show({ severity: "error", summary: "No se pudo cargar el asiento de apertura", detail: mensajeDeError(err, "Error al consultar el asiento de apertura"), life: 8000 });
    }
  };

  useEffect(() => {
    cargarAsientos();
  }, [prestamo?.id]);

  const generarAsiento = async () => {
    setProcesandoAsiento(true);
    try {
      await generarAsientoAperturaPrestamoEntidad(Number(prestamo.id));
      toast.current?.show({ severity: "success", summary: "Asiento de apertura generado", detail: "El asiento del saldo inicial fue generado correctamente.", life: 4000 });
      await cargarAsientos();
    } catch (err) {
      toast.current?.show({ severity: "error", summary: "No se pudo generar el asiento de apertura", detail: mensajeDeError(err, "Error al generar el asiento de apertura"), life: 12000 });
    }
    setProcesandoAsiento(false);
  };

  const confirmarEliminarAsientos = () =>
    confirmDialog({
      message: "Se eliminará el asiento de apertura pendiente del préstamo. ¿Desea continuar?",
      header: "Eliminar asiento de apertura",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      accept: async () => {
        setProcesandoAsiento(true);
        try {
          await eliminarAsientosAperturaPrestamoEntidad(Number(prestamo.id));
          toast.current?.show({ severity: "success", summary: "Asiento eliminado", detail: "El asiento de apertura fue eliminado.", life: 3000 });
          await cargarAsientos();
        } catch (err) {
          toast.current?.show({ severity: "error", summary: "No se pudo eliminar el asiento", detail: mensajeDeError(err, "Error al eliminar el asiento de apertura"), life: 12000 });
        }
        setProcesandoAsiento(false);
      },
    });

  const lineasAsiento = (asiento) => (
    <DataTable value={asiento.detalles || []} size="small" showGridlines>
      <Column field="numeroLinea" header="#" style={{ width: 50 }} />
      <Column header="Cuenta" body={(d) => `${d.planCuenta?.codigoCuenta} - ${d.planCuenta?.nombreCuenta}`} />
      <Column header="Debe" body={(d) => formatearNumero(Number(d.debe), 2)} style={{ textAlign: "right", width: 120 }} />
      <Column header="Haber" body={(d) => formatearNumero(Number(d.haber), 2)} style={{ textAlign: "right", width: 120 }} />
    </DataTable>
  );

  const validar = () => {
    if (!empresaId) return "Seleccione la empresa.";
    if (!entidadId) return `Seleccione el ${esAccionista ? "accionista" : "tercero"}.`;
    if (!monedaId) return "Seleccione la moneda.";
    if (!fechaDesembolso) return "Indique la fecha de desembolso.";
    if (!(Number(montoDesembolsado) > 0)) return "El monto desembolsado debe ser mayor a cero.";
    if (Number(montoPagadoAnterior) < 0 || Number(montoPagadoAnterior) > Number(montoDesembolsado)) return "Lo pagado antes del sistema debe estar entre cero y el monto desembolsado.";
    if (fechaVencimiento && fechaVencimiento < fechaDesembolso) return "La fecha de vencimiento no puede ser anterior a la fecha de desembolso.";
    return null;
  };

  const guardar = async () => {
    const error = soloBasicos ? null : validar();
    if (error) {
      toast.current?.show({ severity: "error", summary: "Revise los datos del préstamo", detail: error, life: 8000 });
      return;
    }
    setGuardando(true);
    try {
      const data = {
        empresaId,
        entidadComercialId: entidadId,
        sentido,
        esAccionista,
        monedaId,
        fechaDesembolso: aISO(fechaDesembolso),
        fechaVencimiento: aISO(fechaVencimiento),
        montoDesembolsado: Number(montoDesembolsado),
        montoPagadoAnterior: Number(montoPagadoAnterior || 0),
        tipoCambioAplicado: Number(tipoCambio) > 0 ? Number(tipoCambio) : null,
        observaciones: observaciones || null,
      };
      if (isEdit) await updatePrestamoEntidad(prestamo.id, data);
      else await createPrestamoEntidad(data);
      onSave?.();
    } catch (err) {
      toast.current?.show({ severity: "error", summary: "No se pudo guardar el préstamo", detail: mensajeDeError(err, "Error al guardar el préstamo con accionista o tercero"), life: 10000 });
    }
    setGuardando(false);
  };

  const simbolo = monedas.find((m) => Number(m.id) === Number(monedaId))?.simbolo || "";
  return (
    <div>
      <Toast ref={toast} />
      {isEdit && (
        <Message
          severity={soloBasicos ? "info" : "warn"}
          className="mb-3"
          style={{ width: "100%", justifyContent: "flex-start" }}
          text={
            soloBasicos
              ? `Préstamo ${prestamo.numeroPrestamo}: ${prestamo.movimientoCajaDesembolsoId ? "generado desde Tesorería" : "con pagos registrados"}; solo se pueden editar el vencimiento y las observaciones.`
              : `Préstamo ${prestamo.numeroPrestamo} (saldo inicial, sin movimientos de caja).`
          }
        />
      )}
      {!isEdit && <Message severity="info" className="mb-3" style={{ width: "100%", justifyContent: "flex-start" }} text="Registre aquí solo préstamos anteriores al sistema. Los préstamos nuevos se registran en Tesorería Pendientes > Operaciones > Préstamos Accionistas / Terceros." />}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <div style={{ flex: 2 }}>
          <label style={etiqueta}>Empresa *</label>
          <Dropdown value={empresaId} options={empresas.map((e) => ({ label: e.razonSocial, value: Number(e.id) }))} onChange={(e) => setEmpresaId(e.value)} filter disabled={bloqueado} style={{ width: "100%" }} />
        </div>
        <div style={{ flex: 2 }}>
          <label style={etiqueta}>Sentido *</label>
          <Dropdown value={sentido} options={SENTIDOS} onChange={(e) => setSentido(e.value)} disabled={bloqueado} style={{ width: "100%" }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={etiqueta}>La contraparte es *</label>
          <SelectButton value={esAccionista} options={CONTRAPARTES} onChange={(e) => e.value !== null && setEsAccionista(e.value)} disabled={bloqueado} />
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <EntidadComercialSelector value={entidadId} onChange={setEntidadId} label={esAccionista ? "Accionista *" : "Tercero *"} disabled={bloqueado} />
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={etiqueta}>Moneda *</label>
          <Dropdown value={monedaId} options={monedas.map((m) => ({ label: m.codigoSunat, value: Number(m.id) }))} onChange={(e) => setMonedaId(e.value)} disabled={bloqueado} style={{ width: "100%" }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={etiqueta}>Fecha de desembolso *</label>
          <Calendar value={fechaDesembolso} onChange={(e) => setFechaDesembolso(e.value)} dateFormat="dd/mm/yy" showIcon disabled={bloqueado} style={{ width: "100%" }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={etiqueta}>Fecha de vencimiento</label>
          <Calendar value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.value)} dateFormat="dd/mm/yy" showIcon disabled={readOnly} style={{ width: "100%" }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={etiqueta}>Monto desembolsado ({simbolo}) *</label>
          <InputNumber value={montoDesembolsado} onValueChange={(e) => setMontoDesembolsado(e.value)} min={0} minFractionDigits={2} maxFractionDigits={2} disabled={bloqueado} style={{ width: "100%" }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={etiqueta}>Pagado / cobrado antes del sistema ({simbolo})</label>
          <InputNumber value={montoPagadoAnterior} onValueChange={(e) => setMontoPagadoAnterior(e.value)} min={0} minFractionDigits={2} maxFractionDigits={2} disabled={bloqueado} style={{ width: "100%" }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={etiqueta}>Saldo pendiente ({simbolo})</label>
          <InputText value={formatearNumero(Math.max(0, Number(montoDesembolsado || 0) - Number(montoPagadoAnterior || 0)), 2)} disabled style={{ width: "100%" }} />
        </div>
        {monedaId > 1 && (
          <div style={{ flex: 1 }}>
            <label style={etiqueta}>Tipo de cambio</label>
            <InputNumber value={tipoCambio} onValueChange={(e) => setTipoCambio(e.value)} minFractionDigits={3} maxFractionDigits={4} disabled={bloqueado} style={{ width: "100%" }} />
          </div>
        )}
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={etiqueta}>Observaciones</label>
        <InputText value={observaciones} onChange={(e) => setObservaciones(e.target.value)} disabled={readOnly} style={{ width: "100%" }} />
      </div>
      {esSaldoInicialSinCaja && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5, flexWrap: "wrap" }}>
            <label style={{ ...etiqueta, flex: 1, marginBottom: 0 }}>Asiento contable de apertura ({asientos.length})</label>
            <Button
              type="button"
              label="Generar Asiento de Apertura"
              icon="pi pi-book"
              severity="success"
              onClick={generarAsiento}
              loading={procesandoAsiento}
              disabled={asientos.length > 0 || !puedeCrear || procesandoAsiento || Number(prestamo?.estadoId) === 85}
              tooltip={asientos.length > 0 ? "El préstamo ya tiene asiento de apertura" : "Genera el asiento del saldo pendiente contra 591101 (utilidades acumuladas)"}
            />
            <Button type="button" label="Eliminar Asiento" icon="pi pi-trash" severity="danger" outlined onClick={confirmarEliminarAsientos} disabled={asientos.length === 0 || !puedeEliminar || procesandoAsiento} />
          </div>
          <DataTable
            value={asientos}
            size="small"
            stripedRows
            showGridlines
            dataKey="id"
            expandedRows={filasExpandidas}
            onRowToggle={(e) => setFilasExpandidas(e.data)}
            rowExpansionTemplate={lineasAsiento}
            emptyMessage="Aún no se generó el asiento de apertura de este saldo inicial."
            style={{ fontSize: getResponsiveFontSize() }}
          >
            <Column expander style={{ width: 40 }} />
            <Column field="numeroAsiento" header="N° Asiento" style={{ width: 150 }} />
            <Column header="Fecha" body={(a) => new Date(a.fechaAsiento).toLocaleDateString("es-PE")} style={{ width: 110 }} />
            <Column field="glosa" header="Glosa" />
            <Column header="Total (S/)" body={(a) => formatearNumero((a.detalles || []).reduce((s, d) => s + Number(d.debe), 0), 2)} style={{ textAlign: "right", width: 120 }} />
            <Column header="Estado" body={(a) => <Tag value={a.estado?.descripcion || "N/A"} severity={a.estado?.severityColor} />} style={{ width: 110 }} />
          </DataTable>
        </div>
      )}
      <ConfirmDialog />
      <div style={{ textAlign: "right" }}>
        <Button label="Cerrar" icon="pi pi-times" className="p-button-text" onClick={onCancel} disabled={guardando} />
        {!readOnly && <Button label="Guardar" icon="pi pi-check" onClick={guardar} loading={guardando} />}
      </div>
    </div>
  );
}
