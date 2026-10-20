// src/components/tesoreria/letras/CanjeLetrasDialog.jsx
// Canje de facturas de un proveedor (compras = PAGAR) o cliente (ventas = COBRAR) por una o varias letras de cambio
import React, { useEffect, useMemo, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Message } from "primereact/message";
import EntidadComercialSelector from "../../common/EntidadComercialSelector";
import { getAllEmpresas } from "../../../api/empresa";
import { getDocumentosCanjeables, canjearFacturas } from "../../../api/tesoreria/letrasOperaciones";
import { mensajeDeError } from "../../../utils/mensajeError";
import { formatearNumero } from "../../../utils/utils";

const etiqueta = { fontWeight: "bold", display: "block", marginBottom: 5 };
const aISO = (fecha) =>
  fecha ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}` : null;
const sumarDias = (fecha, dias) => {
  const f = new Date(fecha);
  f.setDate(f.getDate() + dias);
  return f;
};
const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const TIPOS = [
  { label: "Letras por pagar (compras)", value: "PAGAR" },
  { label: "Letras por cobrar (ventas)", value: "COBRAR" },
];

export default function CanjeLetrasDialog({ visible, onHide, onSuccess, toast, tipoLetraInicial = "PAGAR" }) {
  const [empresas, setEmpresas] = useState([]);
  const [tipoLetra, setTipoLetra] = useState(tipoLetraInicial);
  const [empresaId, setEmpresaId] = useState(null);
  const [entidadId, setEntidadId] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [seleccion, setSeleccion] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [fechaEmision, setFechaEmision] = useState(new Date());
  const [tipoCambio, setTipoCambio] = useState(null);
  const [observaciones, setObservaciones] = useState("");
  const [letras, setLetras] = useState([{ fechaVencimiento: null, monto: null }]);
  const [cantidadLetras, setCantidadLetras] = useState(1);
  const [diasPrimera, setDiasPrimera] = useState(30);
  const [diasEntre, setDiasEntre] = useState(30);

  useEffect(() => {
    if (!visible) return;
    getAllEmpresas().then((lista) => setEmpresas(lista || [])).catch(() => setEmpresas([]));
    setTipoLetra(tipoLetraInicial);
    setEmpresaId(null);
    setEntidadId(null);
    setDocumentos([]);
    setSeleccion([]);
    setFechaEmision(new Date());
    setTipoCambio(null);
    setObservaciones("");
    setLetras([{ fechaVencimiento: null, monto: null }]);
    setCantidadLetras(1);
  }, [visible, tipoLetraInicial]);

  // Facturas canjeables al elegir empresa y proveedor / cliente
  useEffect(() => {
    setDocumentos([]);
    setSeleccion([]);
    if (!visible || !empresaId || !entidadId) return;
    setCargando(true);
    getDocumentosCanjeables({ tipoLetra, empresaId, entidadId })
      .then(setDocumentos)
      .catch((err) =>
        toast?.current?.show({ severity: "error", summary: "No se pudieron cargar las facturas", detail: mensajeDeError(err, "Error al consultar las facturas canjeables"), life: 8000 }),
      )
      .finally(() => setCargando(false));
  }, [visible, tipoLetra, empresaId, entidadId]);

  const totalFacturas = useMemo(() => r2(seleccion.reduce((a, d) => a + Number(d.saldoPendiente), 0)), [seleccion]);
  const totalLetras = useMemo(() => r2(letras.reduce((a, l) => a + Number(l.monto || 0), 0)), [letras]);
  const simbolo = seleccion[0]?.simbolo || "";
  const monedasMezcladas = new Set(seleccion.map((d) => d.monedaId)).size > 1;
  const esExtranjera = seleccion.length > 0 && Number(seleccion[0].monedaId) !== 1;
  const diferencia = r2(totalFacturas - totalLetras);

  // Genera N letras iguales con vencimientos escalonados (el último ajusta el centavo)
  const generarLetras = () => {
    if (totalFacturas <= 0) {
      toast?.current?.show({ severity: "warn", summary: "Seleccione facturas", detail: "Seleccione primero las facturas que va a canjear.", life: 5000 });
      return;
    }
    const n = Math.max(1, Number(cantidadLetras) || 1);
    const base = Math.floor((totalFacturas / n) * 100) / 100;
    const nuevas = Array.from({ length: n }, (_, i) => ({
      fechaVencimiento: sumarDias(fechaEmision, Number(diasPrimera || 0) + i * Number(diasEntre || 0)),
      monto: i === n - 1 ? r2(totalFacturas - base * (n - 1)) : base,
    }));
    setLetras(nuevas);
  };

  const cambiarLetra = (indice, cambios) => setLetras((actuales) => actuales.map((l, i) => (i === indice ? { ...l, ...cambios } : l)));

  const validar = () => {
    if (!empresaId) return "Seleccione la empresa.";
    if (!entidadId) return `Seleccione el ${tipoLetra === "PAGAR" ? "proveedor" : "cliente"}.`;
    if (seleccion.length === 0) return "Seleccione al menos una factura para canjear.";
    if (monedasMezcladas) return "Las facturas seleccionadas deben estar todas en la misma moneda.";
    if (esExtranjera && !(Number(tipoCambio) > 0)) return "Ingrese el tipo de cambio de la fecha de emisión (las facturas están en moneda extranjera).";
    if (!fechaEmision) return "Indique la fecha de emisión de las letras.";
    const sinFecha = letras.findIndex((l) => !l.fechaVencimiento);
    if (sinFecha >= 0) return `Indique la fecha de vencimiento de la letra ${sinFecha + 1}.`;
    const sinMonto = letras.findIndex((l) => !(Number(l.monto) > 0));
    if (sinMonto >= 0) return `Indique el monto de la letra ${sinMonto + 1}.`;
    if (Math.abs(diferencia) > 0.001) return `Las letras suman ${formatearNumero(totalLetras, 2)} y las facturas ${formatearNumero(totalFacturas, 2)}: deben ser iguales (diferencia ${formatearNumero(diferencia, 2)}).`;
    return null;
  };

  const confirmar = async () => {
    const error = validar();
    if (error) {
      toast?.current?.show({ severity: "error", summary: "Revise los datos del canje", detail: error, life: 8000 });
      return;
    }
    setGuardando(true);
    try {
      const resultado = await canjearFacturas({
        tipoLetra,
        empresaId,
        entidadId,
        documentoIds: seleccion.map((d) => d.id),
        fechaEmision: aISO(fechaEmision),
        tipoCambio: esExtranjera ? Number(tipoCambio) : undefined,
        observaciones: observaciones || undefined,
        letras: letras.map((l) => ({ fechaVencimiento: aISO(l.fechaVencimiento), monto: Number(l.monto) })),
      });
      toast?.current?.show({
        severity: "success",
        summary: "Canje registrado",
        detail: `Letras generadas: ${resultado.letras.map((l) => l.numeroDocumento).join(", ")}. Asientos: ${resultado.asientos.map((a) => a.numeroAsiento).join(", ")}.`,
        life: 8000,
      });
      onSuccess?.(resultado);
      onHide();
    } catch (err) {
      toast?.current?.show({ severity: "error", summary: "No se pudo registrar el canje", detail: mensajeDeError(err, "Error al canjear las facturas por letras"), life: 10000 });
    }
    setGuardando(false);
  };

  return (
    <Dialog
      header="Canje de facturas por letras de cambio"
      visible={visible}
      onHide={onHide}
      style={{ width: "90vw", maxWidth: 1100 }}
      modal
      footer={
        <div>
          <Button label="Cancelar" icon="pi pi-times" className="p-button-text" onClick={onHide} disabled={guardando} />
          <Button label="Registrar canje" icon="pi pi-check" onClick={confirmar} loading={guardando} />
        </div>
      }
    >
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end", marginBottom: 12 }}>
        <div style={{ flex: 1.2 }}>
          <label style={etiqueta}>Tipo de letra *</label>
          <Dropdown value={tipoLetra} options={TIPOS} onChange={(e) => { setTipoLetra(e.value); setEntidadId(null); }} style={{ width: "100%" }} />
        </div>
        <div style={{ flex: 1.5 }}>
          <label style={etiqueta}>Empresa *</label>
          <Dropdown
            value={empresaId}
            options={empresas.map((e) => ({ label: e.razonSocial, value: Number(e.id) }))}
            onChange={(e) => setEmpresaId(e.value)}
            placeholder="Seleccione la empresa"
            filter
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 2 }}>
          <EntidadComercialSelector
            value={entidadId}
            onChange={setEntidadId}
            label={tipoLetra === "PAGAR" ? "Proveedor *" : "Cliente *"}
            tipoEntidadFiltro={tipoLetra === "PAGAR" ? "PROVEEDOR" : "CLIENTE"}
            placeholder={tipoLetra === "PAGAR" ? "Seleccione el proveedor" : "Seleccione el cliente"}
          />
        </div>
      </div>

      <Message
        severity="info"
        className="mb-2"
        style={{ width: "100%", justifyContent: "flex-start" }}
        text="Solo se canjean facturas fiscales sin pagos. La letra se emite por el monto de la factura; la detracción, retención y percepción siguen pendientes hasta que se cancelen todas las letras del documento. Los intereses y la mora se ingresan manualmente el día del pago."
      />

      <DataTable
        value={documentos}
        selection={seleccion}
        onSelectionChange={(e) => setSeleccion(e.value)}
        dataKey="id"
        loading={cargando}
        size="small"
        stripedRows
        emptyMessage={empresaId && entidadId ? "No hay facturas canjeables para este proveedor/cliente (deben ser fiscales, con saldo y sin pagos)." : "Seleccione la empresa y el proveedor/cliente."}
        scrollable
        scrollHeight="220px"
      >
        <Column selectionMode="multiple" style={{ width: "3rem" }} />
        <Column field="numeroDocumento" header="Factura" />
        <Column header="Emisión" body={(d) => new Date(d.fechaEmision).toLocaleDateString("es-PE", { timeZone: "UTC" })} />
        <Column header="Vencimiento" body={(d) => new Date(d.fechaVencimiento).toLocaleDateString("es-PE", { timeZone: "UTC" })} />
        <Column header="Total" body={(d) => `${d.simbolo} ${formatearNumero(d.montoTotal, 2)}`} />
        <Column header="Saldo a canjear" body={(d) => `${d.simbolo} ${formatearNumero(d.saldoPendiente, 2)}`} />
        <Column header="Impuestos" body={(d) => [d.tieneDetraccion && "Detracción", d.tieneRetencion && "Retención", d.tienePercepcion && "Percepción"].filter(Boolean).join(", ") || "-"} />
      </DataTable>
      <div style={{ textAlign: "right", margin: "6px 0 12px", fontWeight: "bold" }}>
        Total facturas seleccionadas: {simbolo} {formatearNumero(totalFacturas, 2)}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={etiqueta}>Fecha de emisión *</label>
          <Calendar value={fechaEmision} onChange={(e) => setFechaEmision(e.value)} dateFormat="dd/mm/yy" showIcon style={{ width: "100%" }} />
        </div>
        {esExtranjera && (
          <div style={{ flex: 1 }}>
            <label style={etiqueta}>Tipo de cambio *</label>
            <InputNumber value={tipoCambio} onValueChange={(e) => setTipoCambio(e.value)} minFractionDigits={3} maxFractionDigits={4} style={{ width: "100%" }} />
          </div>
        )}
        <div style={{ flex: 3 }}>
          <label style={etiqueta}>Observaciones</label>
          <InputText value={observaciones} onChange={(e) => setObservaciones(e.target.value)} style={{ width: "100%" }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "end", marginBottom: 8, flexWrap: "wrap" }}>
        <div>
          <label style={etiqueta}>N° de letras</label>
          <InputNumber value={cantidadLetras} onValueChange={(e) => setCantidadLetras(e.value)} min={1} max={60} showButtons style={{ width: 130 }} />
        </div>
        <div>
          <label style={etiqueta}>Días a la 1ª letra</label>
          <InputNumber value={diasPrimera} onValueChange={(e) => setDiasPrimera(e.value)} min={0} style={{ width: 130 }} />
        </div>
        <div>
          <label style={etiqueta}>Días entre letras</label>
          <InputNumber value={diasEntre} onValueChange={(e) => setDiasEntre(e.value)} min={0} style={{ width: 130 }} />
        </div>
        <Button label="Generar letras" icon="pi pi-calculator" className="p-button-outlined" onClick={generarLetras} />
        <Button label="Agregar letra" icon="pi pi-plus" className="p-button-text" onClick={() => setLetras((a) => [...a, { fechaVencimiento: null, monto: null }])} />
      </div>

      <DataTable value={letras} size="small" stripedRows>
        <Column header="#" body={(_, o) => o.rowIndex + 1} style={{ width: "3rem" }} />
        <Column
          header="Vencimiento *"
          body={(l, o) => <Calendar value={l.fechaVencimiento} onChange={(e) => cambiarLetra(o.rowIndex, { fechaVencimiento: e.value })} dateFormat="dd/mm/yy" showIcon />}
        />
        <Column
          header={`Monto ${simbolo} *`}
          body={(l, o) => <InputNumber value={l.monto} onValueChange={(e) => cambiarLetra(o.rowIndex, { monto: e.value })} minFractionDigits={2} maxFractionDigits={2} />}
        />
        <Column
          style={{ width: "4rem" }}
          body={(_, o) => (
            <Button icon="pi pi-trash" className="p-button-text p-button-danger" disabled={letras.length === 1} onClick={() => setLetras((a) => a.filter((_x, i) => i !== o.rowIndex))} />
          )}
        />
      </DataTable>
      <div style={{ textAlign: "right", marginTop: 6, fontWeight: "bold", color: Math.abs(diferencia) > 0.001 ? "#c62828" : "#2e7d32" }}>
        Total letras: {simbolo} {formatearNumero(totalLetras, 2)}
        {Math.abs(diferencia) > 0.001 ? ` — diferencia con las facturas: ${formatearNumero(diferencia, 2)}` : " — cuadra con las facturas"}
      </div>
    </Dialog>
  );
}
