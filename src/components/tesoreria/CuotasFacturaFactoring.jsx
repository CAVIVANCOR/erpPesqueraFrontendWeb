// src/components/tesoreria/CuotasFacturaFactoring.jsx
// Cuotas de un préstamo de factoring amarradas a su factura: una cuota por factura, con el vencimiento escrito por el usuario.
//  - VENTAS: facturas por cobrar entregadas al banco; el cliente las paga directamente al banco.
//  - COMPRAS (factoring indirecto): facturas por pagar de UN proveedor que cedió sus facturas al banco; MEGUI paga la cuota al banco.
//    La cuota es solo capital: el interés lo factura el proveedor aparte.
// El capital de cada cuota es siempre el saldo de la factura (el banco financia el 100 %).
import React, { useEffect, useMemo, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { Tag } from "primereact/tag";
import { getFacturasParaCuotas, getCronogramaPrestamo } from "../../api/tesoreria/prestamoBancarios";
import { mensajeDeError } from "../../utils/mensajeError";
import { formatearNumero } from "../../utils/utils";

const fechaCorta = (f) => (f ? new Date(f).toLocaleDateString("es-PE") : "-");
const r2 = (v) => Math.round((Number(v || 0) + Number.EPSILON) * 100) / 100;

export default function CuotasFacturaFactoring({
  tipo = "VENTAS",
  empresaId,
  monedaId,
  prestamoId = null,
  interesDescontado = false,
  montoAprobado = 0,
  onChange,
  toast,
}) {
  const esVentas = tipo === "VENTAS";
  const [facturas, setFacturas] = useState([]);
  const [filas, setFilas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [cuotasPrevias, setCuotasPrevias] = useState(null);

  // Cuotas ya guardadas del préstamo (edición antes del desembolso)
  useEffect(() => {
    if (!prestamoId) {
      setCuotasPrevias([]);
      return;
    }
    getCronogramaPrestamo(Number(prestamoId))
      .then((cuotas) => setCuotasPrevias(Array.isArray(cuotas) ? cuotas : []))
      .catch(() => setCuotasPrevias([]));
  }, [prestamoId]);

  // Facturas disponibles para la empresa y moneda del préstamo
  useEffect(() => {
    if (!empresaId || !monedaId) {
      setFacturas([]);
      return;
    }
    setCargando(true);
    getFacturasParaCuotas({ tipo, empresaId: Number(empresaId), monedaId: Number(monedaId), prestamoId })
      .then((lista) => setFacturas(Array.isArray(lista) ? lista : []))
      .catch((err) =>
        toast?.current?.show({ severity: "error", summary: "No se pudieron cargar las facturas", detail: mensajeDeError(err, "Error al consultar las facturas del factoring"), life: 8000 }),
      )
      .finally(() => setCargando(false));
  }, [tipo, empresaId, monedaId, prestamoId]);

  // Con las cuotas guardadas y las facturas cargadas se arma la selección inicial (una sola vez)
  const [inicializado, setInicializado] = useState(false);
  useEffect(() => {
    if (inicializado || cuotasPrevias === null || cargando) return;
    const previas = cuotasPrevias
      .map((c) => ({
        facturaId: String(esVentas ? c.cuentaPorCobrarId : c.cuentaPorPagarId || ""),
        fechaVencimiento: c.fechaVencimiento ? new Date(c.fechaVencimiento) : null,
        montoInteres: Number(c.montoInteres || 0),
      }))
      .filter((f) => f.facturaId && f.facturaId !== "null" && f.facturaId !== "undefined");
    setFilas(previas);
    setInicializado(true);
  }, [cuotasPrevias, cargando, inicializado, esVentas]);

  // Cambios hacia el formulario padre: vencimiento en ISO completo (medianoche local)
  useEffect(() => {
    if (!inicializado) return;
    onChange?.(
      filas.map((f) => ({
        facturaId: Number(f.facturaId),
        fechaVencimiento: f.fechaVencimiento ? f.fechaVencimiento.toISOString() : null,
        montoInteres: !esVentas || interesDescontado ? 0 : Number(f.montoInteres || 0),
      })),
    );
  }, [filas, inicializado, esVentas, interesDescontado]);

  const seleccionadas = useMemo(() => facturas.filter((f) => filas.some((x) => String(x.facturaId) === String(f.id))), [facturas, filas]);
  // En compras, con la primera factura elegida solo se ofrecen las del mismo proveedor (un contrato = un proveedor)
  const entidadFijada = !esVentas ? facturas.find((f) => filas.some((x) => String(x.facturaId) === String(f.id)))?.entidadId : null;
  const visibles = useMemo(() => {
    const t = busqueda.trim().toLowerCase();
    const delProveedor = entidadFijada ? facturas.filter((f) => String(f.entidadId) === String(entidadFijada)) : facturas;
    return t ? delProveedor.filter((f) => `${f.numeroDocumento} ${f.entidad}`.toLowerCase().includes(t)) : delProveedor;
  }, [facturas, busqueda, entidadFijada]);

  // La selección de las facturas ocultas por la búsqueda se conserva
  const cambiarSeleccion = (nuevas) => {
    const idsVisibles = new Set(visibles.map((f) => String(f.id)));
    setFilas((previas) => {
      const conservadas = previas.filter((x) => !idsVisibles.has(String(x.facturaId)) || nuevas.some((n) => String(n.id) === String(x.facturaId)));
      const nuevasFilas = nuevas
        .filter((n) => !conservadas.some((x) => String(x.facturaId) === String(n.id)))
        .map((n) => ({ facturaId: String(n.id), fechaVencimiento: n.fechaVencimiento ? new Date(n.fechaVencimiento) : null, montoInteres: 0 }));
      return [...conservadas, ...nuevasFilas];
    });
  };

  const editarFila = (facturaId, cambios) => setFilas((previas) => previas.map((x) => (String(x.facturaId) === String(facturaId) ? { ...x, ...cambios } : x)));

  const cuotasOrdenadas = useMemo(
    () =>
      filas
        .map((f) => ({ ...f, factura: facturas.find((x) => String(x.id) === String(f.facturaId)) }))
        .filter((f) => f.factura)
        .sort((a, b) => (a.fechaVencimiento || 0) - (b.fechaVencimiento || 0)),
    [filas, facturas],
  );
  const totalCapital = r2(cuotasOrdenadas.reduce((a, f) => a + Number(f.factura.saldoPendiente || 0), 0));
  const totalInteres = r2(cuotasOrdenadas.reduce((a, f) => a + (esVentas && !interesDescontado ? Number(f.montoInteres || 0) : 0), 0));
  const simbolo = facturas[0]?.simbolo || "";
  const diferencia = r2(totalCapital - Number(montoAprobado || 0));

  return (
    <div>
      <Message
        severity="info"
        className="mb-3"
        style={{ width: "100%", justifyContent: "flex-start" }}
        text={
          esVentas
            ? "Factoring de ventas: marque las facturas que entrega al banco. Cada una será una cuota con su vencimiento (editable); el cliente la paga directamente al banco."
            : "Factoring de compras: marque las facturas de proveedores que el banco paga por usted. Cada una será una cuota con su vencimiento (editable); usted paga la cuota al banco."
        }
      />

      <span className="p-input-icon-left mb-2" style={{ width: "100%", display: "block" }}>
        <i className="pi pi-search" />
        <InputText value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder={`Buscar por factura o ${esVentas ? "cliente" : "proveedor"}`} style={{ width: "100%" }} />
      </span>

      <DataTable
        value={visibles}
        selection={seleccionadas}
        onSelectionChange={(e) => cambiarSeleccion(e.value)}
        dataKey="id"
        loading={cargando}
        size="small"
        stripedRows
        scrollable
        scrollHeight="260px"
        emptyMessage={!empresaId || !monedaId ? "Seleccione la empresa y la moneda del préstamo para listar las facturas." : "No hay facturas disponibles para financiar."}
      >
        <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
        <Column field="numeroDocumento" header="Factura" />
        <Column field="entidad" header={esVentas ? "Cliente" : "Proveedor"} />
        <Column header="Emisión" body={(f) => fechaCorta(f.fechaEmision)} />
        <Column header="Vencimiento" body={(f) => fechaCorta(f.fechaVencimiento)} />
        <Column header="Saldo" body={(f) => `${f.simbolo} ${formatearNumero(f.saldoPendiente, 2)}`} style={{ textAlign: "right" }} />
      </DataTable>

      <h4 className="mt-3 mb-2">Cuotas del factoring ({cuotasOrdenadas.length})</h4>
      <DataTable value={cuotasOrdenadas} dataKey="facturaId" size="small" stripedRows showGridlines emptyMessage="Marque las facturas para generar sus cuotas.">
        <Column header="N°" body={(_, o) => o.rowIndex + 1} style={{ width: "3rem" }} />
        <Column header="Factura" body={(f) => <b>{f.factura.numeroDocumento}</b>} />
        <Column header={esVentas ? "Cliente" : "Proveedor"} body={(f) => f.factura.entidad} />
        <Column
          header="Vencimiento de la cuota *"
          body={(f) => (
            <Calendar value={f.fechaVencimiento} onChange={(e) => editarFila(f.facturaId, { fechaVencimiento: e.value })} dateFormat="dd/mm/yy" showIcon style={{ width: "100%" }} />
          )}
          style={{ minWidth: "12rem" }}
        />
        <Column header="Capital" body={(f) => `${f.factura.simbolo} ${formatearNumero(f.factura.saldoPendiente, 2)}`} style={{ textAlign: "right" }} />
        {esVentas && !interesDescontado && (
          <Column
            header="Interés de la cuota"
            body={(f) => (
              <InputNumber value={f.montoInteres} onValueChange={(e) => editarFila(f.facturaId, { montoInteres: e.value || 0 })} mode="decimal" minFractionDigits={2} maxFractionDigits={2} min={0} style={{ width: "100%" }} />
            )}
            style={{ minWidth: "10rem" }}
          />
        )}
        <Column
          header="Total"
          body={(f) => `${f.factura.simbolo} ${formatearNumero(Number(f.factura.saldoPendiente) + (esVentas && !interesDescontado ? Number(f.montoInteres || 0) : 0), 2)}`}
          style={{ textAlign: "right" }}
        />
      </DataTable>

      <div className="flex justify-content-end gap-3 mt-2 align-items-center flex-wrap">
        <b>Capital financiado: {simbolo} {formatearNumero(totalCapital, 2)}</b>
        {esVentas && !interesDescontado && <b>Intereses: {simbolo} {formatearNumero(totalInteres, 2)}</b>}
        {Number(montoAprobado) > 0 && Math.abs(diferencia) > 0.01 && (
          <Tag severity="warning" value={`Difiere del Monto Aprobado en ${simbolo} ${formatearNumero(Math.abs(diferencia), 2)} (solo aviso)`} />
        )}
      </div>
    </div>
  );
}
