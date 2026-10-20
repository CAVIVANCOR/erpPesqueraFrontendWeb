// src/components/tesoreria/letras/RefinanciarLetraDialog.jsx
// Refinanciación de una letra con capital pendiente en N letras nuevas (suman exactamente su saldo de capital)
import React, { useEffect, useMemo, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Message } from "primereact/message";
import { refinanciarLetra } from "../../../api/tesoreria/letrasOperaciones";
import { mensajeDeError } from "../../../utils/mensajeError";
import { formatearNumero } from "../../../utils/utils";

const etiqueta = { fontWeight: "bold", display: "block", marginBottom: 5 };
const aISO = (f) => (f ? `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}` : null);
const sumarDias = (fecha, dias) => {
  const f = new Date(fecha);
  f.setDate(f.getDate() + dias);
  return f;
};
const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export default function RefinanciarLetraDialog({ visible, letra, onHide, onSuccess, toast }) {
  const saldo = Number(letra?.saldoCapital || 0);
  const simbolo = letra?.moneda?.simbolo || "";
  const [fecha, setFecha] = useState(new Date());
  const [observaciones, setObservaciones] = useState("");
  const [cantidad, setCantidad] = useState(2);
  const [diasPrimera, setDiasPrimera] = useState(30);
  const [diasEntre, setDiasEntre] = useState(30);
  const [nuevas, setNuevas] = useState([]);
  const [guardando, setGuardando] = useState(false);

  const generar = (fechaBase = fecha, n = cantidad) => {
    const cuotas = Math.max(1, Number(n) || 1);
    const base = Math.floor((saldo / cuotas) * 100) / 100;
    setNuevas(
      Array.from({ length: cuotas }, (_, i) => ({
        fechaVencimiento: sumarDias(fechaBase, Number(diasPrimera || 0) + i * Number(diasEntre || 0)),
        monto: i === cuotas - 1 ? r2(saldo - base * (cuotas - 1)) : base,
      })),
    );
  };

  useEffect(() => {
    if (!visible || !letra) return;
    const hoy = new Date();
    setFecha(hoy);
    setObservaciones("");
    setCantidad(2);
    generar(hoy, 2);
  }, [visible, letra?.id]);

  const total = useMemo(() => r2(nuevas.reduce((a, l) => a + Number(l.monto || 0), 0)), [nuevas]);
  const diferencia = r2(saldo - total);
  const cambiar = (i, cambios) => setNuevas((a) => a.map((l, k) => (k === i ? { ...l, ...cambios } : l)));

  const confirmar = async () => {
    const problema =
      nuevas.findIndex((l) => !l.fechaVencimiento) >= 0
        ? `Indique la fecha de vencimiento de la letra nueva ${nuevas.findIndex((l) => !l.fechaVencimiento) + 1}.`
        : nuevas.findIndex((l) => !(Number(l.monto) > 0)) >= 0
          ? `Indique el monto de la letra nueva ${nuevas.findIndex((l) => !(Number(l.monto) > 0)) + 1}.`
          : Math.abs(diferencia) > 0.001
            ? `Las letras nuevas suman ${formatearNumero(total, 2)} y deben sumar exactamente el saldo de capital (${formatearNumero(saldo, 2)}).`
            : null;
    if (problema) {
      toast?.current?.show({ severity: "error", summary: "Revise la refinanciación", detail: problema, life: 8000 });
      return;
    }
    setGuardando(true);
    try {
      const r = await refinanciarLetra({
        letraId: letra.id,
        fechaRefinanciacion: aISO(fecha),
        observaciones: observaciones || undefined,
        letras: nuevas.map((l) => ({ fechaVencimiento: aISO(l.fechaVencimiento), monto: Number(l.monto) })),
      });
      toast?.current?.show({
        severity: "success",
        summary: "Letra refinanciada",
        detail: `La letra ${r.letraOrigen.numeroDocumento} se refinanció en ${r.letrasNuevas.map((n) => n.numeroDocumento).join(", ")}.`,
        life: 8000,
      });
      onSuccess?.(r);
      onHide();
    } catch (err) {
      toast?.current?.show({ severity: "error", summary: "No se pudo refinanciar la letra", detail: mensajeDeError(err, "Error al refinanciar la letra"), life: 10000 });
    }
    setGuardando(false);
  };

  return (
    <Dialog
      header={`Refinanciar letra ${letra?.numeroDocumento || ""}`}
      visible={visible}
      onHide={onHide}
      style={{ width: "80vw", maxWidth: 800 }}
      modal
      footer={
        <div>
          <Button label="Cancelar" icon="pi pi-times" className="p-button-text" onClick={onHide} disabled={guardando} />
          <Button label="Refinanciar" icon="pi pi-check" onClick={confirmar} loading={guardando} />
        </div>
      }
    >
      <Message
        severity="info"
        className="mb-3"
        style={{ width: "100%", justifyContent: "flex-start" }}
        text={`Saldo de capital a refinanciar: ${simbolo} ${formatearNumero(saldo, 2)}. Las letras nuevas deben sumar exactamente ese monto. Los intereses y la mora no se capitalizan: se ingresan manualmente el día del pago de cada letra.`}
      />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end", marginBottom: 10 }}>
        <div>
          <label style={etiqueta}>Fecha de refinanciación *</label>
          <Calendar value={fecha} onChange={(e) => setFecha(e.value)} dateFormat="dd/mm/yy" showIcon />
        </div>
        <div>
          <label style={etiqueta}>N° de letras nuevas</label>
          <InputNumber value={cantidad} onValueChange={(e) => setCantidad(e.value)} min={1} max={60} showButtons style={{ width: 130 }} />
        </div>
        <div>
          <label style={etiqueta}>Días a la 1ª letra</label>
          <InputNumber value={diasPrimera} onValueChange={(e) => setDiasPrimera(e.value)} min={0} style={{ width: 130 }} />
        </div>
        <div>
          <label style={etiqueta}>Días entre letras</label>
          <InputNumber value={diasEntre} onValueChange={(e) => setDiasEntre(e.value)} min={0} style={{ width: 130 }} />
        </div>
        <Button label="Generar" icon="pi pi-calculator" className="p-button-outlined" onClick={() => generar()} />
        <Button label="Agregar letra" icon="pi pi-plus" className="p-button-text" onClick={() => setNuevas((a) => [...a, { fechaVencimiento: null, monto: null }])} />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={etiqueta}>Observaciones</label>
        <InputText value={observaciones} onChange={(e) => setObservaciones(e.target.value)} style={{ width: "100%" }} />
      </div>
      <DataTable value={nuevas} size="small" stripedRows>
        <Column header="#" body={(_, o) => o.rowIndex + 1} style={{ width: "3rem" }} />
        <Column header="Vencimiento *" body={(l, o) => <Calendar value={l.fechaVencimiento} onChange={(e) => cambiar(o.rowIndex, { fechaVencimiento: e.value })} dateFormat="dd/mm/yy" showIcon />} />
        <Column header={`Monto ${simbolo} *`} body={(l, o) => <InputNumber value={l.monto} onValueChange={(e) => cambiar(o.rowIndex, { monto: e.value })} minFractionDigits={2} maxFractionDigits={2} />} />
        <Column style={{ width: "4rem" }} body={(_, o) => <Button icon="pi pi-trash" className="p-button-text p-button-danger" disabled={nuevas.length === 1} onClick={() => setNuevas((a) => a.filter((_x, i) => i !== o.rowIndex))} />} />
      </DataTable>
      <div style={{ textAlign: "right", marginTop: 6, fontWeight: "bold", color: Math.abs(diferencia) > 0.001 ? "#c62828" : "#2e7d32" }}>
        Total letras nuevas: {simbolo} {formatearNumero(total, 2)}
        {Math.abs(diferencia) > 0.001 ? ` — diferencia con el saldo: ${formatearNumero(diferencia, 2)}` : " — cuadra con el saldo de capital"}
      </div>
    </Dialog>
  );
}
