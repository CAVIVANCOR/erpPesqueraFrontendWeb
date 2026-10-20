// src/pages/tesoreria/LetraCambioOperaciones.jsx
// Letras de cambio de compras (por pagar) y ventas (por cobrar): lista, canje de facturas, refinanciación y pagos
import React, { useEffect, useMemo, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";
import { SelectButton } from "primereact/selectbutton";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import CanjeLetrasDialog from "../../components/tesoreria/letras/CanjeLetrasDialog";
import RefinanciarLetraDialog from "../../components/tesoreria/letras/RefinanciarLetraDialog";
import LetraCambioFichaDialog from "../../components/tesoreria/letras/LetraCambioFichaDialog";
import PagoLetraCambioDialog from "../../components/movimientoCaja/LetrasCambioPagoEspecializado/PagoLetraCambioDialog";
import {
  getLetrasOperaciones,
  getLetraOperacionById,
  anularCanjeLetra,
  revertirRefinanciacionLetra,
  procesarVencimientosLetras,
} from "../../api/tesoreria/letrasOperaciones";
import { getAllEmpresas } from "../../api/empresa";
import { getMediosPago } from "../../api/medioPago";
import { getAllTipoMovEntregaRendir } from "../../api/tipoMovEntregaRendir";
import { usePermissions } from "../../hooks/usePermissions";
import { mensajeDeError } from "../../utils/mensajeError";
import { formatearNumero, getResponsiveFontSize } from "../../utils/utils";

const fecha = (f) => (f ? new Date(f).toLocaleDateString("es-PE", { timeZone: "UTC" }) : "-");
const TIPOS = [
  { label: "Todas", value: "TODAS" },
  { label: "Por pagar", value: "PAGAR" },
  { label: "Por cobrar", value: "COBRAR" },
];
const VISTA = [
  { label: "Pendientes", value: "PENDIENTES" },
  { label: "Todas", value: "TODAS" },
];

export default function LetraCambioOperaciones({ ruta }) {
  const permisos = usePermissions(ruta);
  const toast = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);

  const [tipo, setTipo] = useState("TODAS");
  const [vista, setVista] = useState("PENDIENTES");
  const [empresaId, setEmpresaId] = useState(null);
  const [estadoId, setEstadoId] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const [showCanje, setShowCanje] = useState(false);
  const [ficha, setFicha] = useState(null);
  const [letraRefinanciar, setLetraRefinanciar] = useState(null);
  const [letraPagar, setLetraPagar] = useState(null);
  const [showPagoLibre, setShowPagoLibre] = useState(false);
  const [confirmar, setConfirmar] = useState({ visible: false, accion: null, letra: null });

  const error = (resumen, err, accion) => toast.current?.show({ severity: "error", summary: resumen, detail: mensajeDeError(err, accion), life: 10000 });

  const cargar = async () => {
    setLoading(true);
    try {
      setItems(await getLetrasOperaciones());
    } catch (err) {
      error("No se pudieron cargar las letras", err, "Error al consultar las letras de cambio");
    }
    setLoading(false);
  };

  useEffect(() => {
    cargar();
    Promise.all([getAllEmpresas(), getMediosPago(), getAllTipoMovEntregaRendir()])
      .then(([e, m, t]) => {
        setEmpresas(e || []);
        setMediosPago(m || []);
        setTiposMovimiento(t || []);
      })
      .catch((err) => error("No se pudieron cargar los catálogos", err, "Error al cargar empresas, medios de pago o tipos de movimiento"));
  }, []);

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return items.filter((l) => {
      if (tipo !== "TODAS" && l.tipoLetra !== tipo) return false;
      if (vista === "PENDIENTES" && Number(l.saldoCapital) <= 0) return false;
      if (empresaId && Number(l.empresaId) !== Number(empresaId)) return false;
      if (estadoId && Number(l.estadoId) !== Number(estadoId)) return false;
      if (texto) {
        const campos = [l.numeroDocumento, l.girado?.razonSocial, l.beneficiario?.razonSocial, l.empresa?.razonSocial].join(" ").toLowerCase();
        if (!campos.includes(texto)) return false;
      }
      return true;
    });
  }, [items, tipo, vista, empresaId, estadoId, busqueda]);

  const estadosOpciones = useMemo(() => {
    const unicos = new Map(items.filter((l) => l.estado).map((l) => [Number(l.estado.id), l.estado.descripcion]));
    return [...unicos.entries()].map(([value, label]) => ({ label, value }));
  }, [items]);

  // Saldo de capital pendiente por tipo y moneda, de lo que se está viendo
  const totales = useMemo(() => {
    const mapa = new Map();
    filtradas.filter((l) => Number(l.saldoCapital) > 0).forEach((l) => {
      const clave = `${l.tipoLetra}|${l.moneda?.simbolo}`;
      mapa.set(clave, (mapa.get(clave) || 0) + Number(l.saldoCapital));
    });
    return [...mapa.entries()].map(([clave, total]) => {
      const [t, simbolo] = clave.split("|");
      return { tipo: t === "PAGAR" ? "Por pagar" : "Por cobrar", simbolo, total };
    });
  }, [filtradas]);

  const abrirFicha = async (fila) => {
    try {
      setFicha(await getLetraOperacionById(Number(fila.id)));
    } catch (err) {
      error("No se pudo cargar la letra", err, "Error al cargar la letra de cambio");
    }
  };

  const refrescarFicha = async () => {
    if (ficha) {
      try {
        setFicha(await getLetraOperacionById(Number(ficha.id)));
      } catch (_) {
        setFicha(null);
      }
    }
    await cargar();
  };

  const ejecutarConfirmada = async () => {
    const { accion, letra } = confirmar;
    setConfirmar({ visible: false, accion: null, letra: null });
    setLoading(true);
    try {
      if (accion === "anular") {
        const r = await anularCanjeLetra(letra.id);
        toast.current?.show({ severity: "success", summary: "Canje anulado", detail: `Letras anuladas: ${r.letrasAnuladas.map((l) => l.numeroDocumento).join(", ")}. Las facturas vuelven a estar pendientes.`, life: 8000 });
        setFicha(null);
      } else {
        const r = await revertirRefinanciacionLetra(letra.id);
        toast.current?.show({ severity: "success", summary: "Refinanciación revertida", detail: `Letras eliminadas: ${r.letrasEliminadas.join(", ")}. La letra ${r.letraOrigen.numeroDocumento} vuelve a tener saldo ${formatearNumero(r.letraOrigen.saldoCapital, 2)}.`, life: 8000 });
        setFicha(null);
      }
      await cargar();
    } catch (err) {
      error(accion === "anular" ? "No se pudo anular el canje" : "No se pudo revertir la refinanciación", err, "Error en la operación");
    }
    setLoading(false);
  };

  const procesarVencimientos = async () => {
    try {
      const r = await procesarVencimientosLetras();
      toast.current?.show({ severity: "info", summary: "Vencimientos procesados", detail: `Revisadas ${r.revisadas}: ${r.vencidas} pasaron a vencidas y ${r.protestadas} fueron protestadas.`, life: 6000 });
      await cargar();
    } catch (err) {
      error("No se pudo procesar los vencimientos", err, "Error al procesar vencimientos y protestos");
    }
  };

  const colorFila = (l) => (l.protestada ? { backgroundColor: "#ffebee" } : l.estado?.descripcion === "VENCIDA" ? { backgroundColor: "#fff8e1" } : undefined);

  return (
    <div className="p-fluid" style={{ margin: "1rem" }}>
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog
        visible={confirmar.visible}
        onHide={() => setConfirmar({ visible: false, accion: null, letra: null })}
        header={confirmar.accion === "anular" ? "Anular canje" : "Revertir refinanciación"}
        icon="pi pi-exclamation-triangle"
        message={
          confirmar.accion === "anular"
            ? `Se anulará el canje de la letra ${confirmar.letra?.numeroDocumento} (y las demás letras del mismo canje): se eliminan los asientos y las facturas vuelven a quedar pendientes de pago. ¿Desea continuar?`
            : `Se eliminarán las letras nacidas de la refinanciación y la letra ${confirmar.letra?.numeroDocumento} recuperará su saldo de capital. ¿Desea continuar?`
        }
        acceptLabel="Sí, continuar"
        rejectLabel="Cancelar"
        acceptClassName="p-button-danger"
        accept={ejecutarConfirmada}
        reject={() => setConfirmar({ visible: false, accion: null, letra: null })}
      />

      <CanjeLetrasDialog visible={showCanje} onHide={() => setShowCanje(false)} toast={toast} tipoLetraInicial={tipo === "COBRAR" ? "COBRAR" : "PAGAR"} onSuccess={cargar} />
      <RefinanciarLetraDialog visible={!!letraRefinanciar} letra={letraRefinanciar} onHide={() => setLetraRefinanciar(null)} toast={toast} onSuccess={refrescarFicha} />
      <PagoLetraCambioDialog
        visible={!!letraPagar || showPagoLibre}
        letraInicial={letraPagar}
        onHide={() => {
          setLetraPagar(null);
          setShowPagoLibre(false);
        }}
        toast={toast}
        mediosPago={mediosPago}
        tiposMovimiento={tiposMovimiento}
        empresas={empresas}
        onSuccess={refrescarFicha}
      />
      <LetraCambioFichaDialog
        visible={!!ficha && !letraPagar && !letraRefinanciar}
        letra={ficha}
        onHide={() => setFicha(null)}
        permisos={permisos}
        onPagar={(l) => setLetraPagar(l)}
        onRefinanciar={(l) => setLetraRefinanciar(l)}
        onAnularCanje={(l) => setConfirmar({ visible: true, accion: "anular", letra: l })}
        onRevertirRefinanciacion={(l) => setConfirmar({ visible: true, accion: "revertir", letra: l })}
      />

      <DataTable
        value={filtradas}
        loading={loading}
        paginator
        rows={20}
        rowsPerPageOptions={[20, 50, 100]}
        size="small"
        stripedRows
        showGridlines
        rowStyle={colorFila}
        emptyMessage="No hay letras de cambio con los filtros aplicados."
        style={{ fontSize: getResponsiveFontSize() }}
        header={
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
              <h2 style={{ margin: 0 }}>Letras de Cambio (compras y ventas)</h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button label="Canjear facturas" icon="pi pi-file-edit" onClick={() => (permisos.puedeCrear ? setShowCanje(true) : toast.current?.show({ severity: "warn", summary: "Acceso denegado", detail: "No tiene permisos para canjear facturas por letras.", life: 4000 }))} />
                <Button label="Pagar / cobrar letras" icon="pi pi-wallet" className="p-button-success" onClick={() => setShowPagoLibre(true)} />
                <Button label="Procesar vencimientos" icon="pi pi-clock" className="p-button-outlined" onClick={procesarVencimientos} tooltip="Marca las letras vencidas y protesta las que superaron 7 días hábiles (también corre solo cada noche)" />
                <Button icon="pi pi-refresh" className="p-button-text" onClick={cargar} tooltip="Actualizar" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <SelectButton value={tipo} options={TIPOS} onChange={(e) => e.value && setTipo(e.value)} />
              <SelectButton value={vista} options={VISTA} onChange={(e) => e.value && setVista(e.value)} />
              <Dropdown value={empresaId} options={empresas.map((e) => ({ label: e.razonSocial, value: Number(e.id) }))} onChange={(e) => setEmpresaId(e.value)} placeholder="Empresa" showClear filter style={{ minWidth: 220 }} />
              <Dropdown value={estadoId} options={estadosOpciones} onChange={(e) => setEstadoId(e.value)} placeholder="Estado" showClear style={{ minWidth: 160 }} />
              <InputText value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar letra, proveedor, cliente..." style={{ minWidth: 240 }} />
            </div>
            {totales.length > 0 && (
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8, fontWeight: "bold" }}>
                {totales.map((t) => (
                  <span key={`${t.tipo}${t.simbolo}`}>
                    Saldo {t.tipo.toLowerCase()} {t.simbolo} {formatearNumero(t.total, 2)}
                  </span>
                ))}
              </div>
            )}
          </div>
        }
      >
        <Column field="numeroDocumento" header="N° letra" sortable />
        <Column header="Tipo" body={(l) => <Tag value={l.tipoLetra === "PAGAR" ? "POR PAGAR" : "POR COBRAR"} severity={l.tipoLetra === "PAGAR" ? "warning" : "success"} />} />
        <Column header="Empresa" body={(l) => l.empresa?.razonSocial} sortable sortField="empresa.razonSocial" />
        <Column header="Proveedor / Cliente" body={(l) => (l.tipoLetra === "PAGAR" ? l.beneficiario?.razonSocial : l.girado?.razonSocial)} />
        <Column header="Emisión" body={(l) => fecha(l.fechaEmision)} sortable sortField="fechaEmision" />
        <Column header="Vencimiento" body={(l) => fecha(l.fechaVencimiento)} sortable sortField="fechaVencimiento" />
        <Column header="Monto" body={(l) => `${l.moneda?.simbolo} ${formatearNumero(l.montoOriginal, 2)}`} />
        <Column header="Saldo de capital" body={(l) => <b>{`${l.moneda?.simbolo} ${formatearNumero(l.saldoCapital, 2)}`}</b>} />
        <Column header="Estado" body={(l) => <Tag value={l.estado?.descripcion} severity={l.estado?.severityColor || "info"} />} />
        <Column header="Refinanc. de" body={(l) => l.letraRenovada?.numeroDocumento || "-"} />
        <Column
          header="Acciones"
          style={{ width: "8rem" }}
          body={(l) => (
            <div style={{ display: "flex", gap: 4 }}>
              <Button icon="pi pi-eye" className="p-button-text" tooltip="Ver ficha" onClick={() => abrirFicha(l)} />
              {Number(l.saldoCapital) > 0 && permisos.puedeEditar && (
                <Button icon="pi pi-wallet" className="p-button-text p-button-success" tooltip={l.tipoLetra === "PAGAR" ? "Pagar" : "Cobrar"} onClick={async () => setLetraPagar(await getLetraOperacionById(Number(l.id)))} />
              )}
            </div>
          )}
        />
      </DataTable>
    </div>
  );
}
