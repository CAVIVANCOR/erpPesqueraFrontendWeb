import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { listarOperaciones } from "../../../api/tesoreria/operaciones";
import { formatearNumero } from "../../../utils/utils";
import RevertirOperacionDialog from "./RevertirOperacionDialog";

const hace30Dias = () => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - 30);
  return fecha;
};

/**
 * Lista de operaciones realizadas (agrupadas por número de operación) para revertirlas.
 * La empresa del filtro solo filtra la lista: la reversión actúa sobre toda la operación.
 */
const ListaOperacionesDialog = ({ visible, onHide, empresas = [], empresaIdInicial = null }) => {
  const toast = useRef(null);
  const [empresaId, setEmpresaId] = useState(empresaIdInicial);
  const [rango, setRango] = useState([hace30Dias(), new Date()]);
  const [busqueda, setBusqueda] = useState("");
  const [operaciones, setOperaciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [seleccion, setSeleccion] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const datos = await listarOperaciones({
        empresaId: empresaId || undefined,
        desde: rango?.[0] ? rango[0].toISOString() : undefined,
        hasta: rango?.[1] ? rango[1].toISOString() : undefined,
        busqueda: busqueda || undefined,
      });
      setOperaciones(datos || []);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error?.response?.data?.error || error?.message || "No se pudieron cargar las operaciones",
        life: 6000,
      });
    } finally {
      setCargando(false);
    }
  }, [empresaId, rango, busqueda]);

  useEffect(() => {
    if (visible) {
      setEmpresaId(empresaIdInicial);
    }
  }, [visible, empresaIdInicial]);

  useEffect(() => {
    if (visible) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, empresaId]);

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={visible}
        onHide={onHide}
        header="Revertir operación"
        style={{ width: "92vw", maxWidth: "1200px" }}
        modal
        maximizable
      >
        <div className="flex flex-wrap align-items-end gap-3 mb-3">
          <div className="flex flex-column gap-1" style={{ minWidth: "16rem" }}>
            <label className="font-bold">Empresa</label>
            <Dropdown
              value={empresaId}
              options={empresas}
              optionLabel="razonSocial"
              optionValue="id"
              onChange={(e) => setEmpresaId(e.value)}
              placeholder="Todas"
              showClear
              filter
            />
          </div>
          <div className="flex flex-column gap-1">
            <label className="font-bold">Fechas</label>
            <Calendar value={rango} onChange={(e) => setRango(e.value)} selectionMode="range" dateFormat="dd/mm/yy" showIcon readOnlyInput />
          </div>
          <div className="flex flex-column gap-1">
            <label className="font-bold">Buscar (# operación o texto)</label>
            <InputText value={busqueda} onChange={(e) => setBusqueda(e.target.value)} onKeyDown={(e) => e.key === "Enter" && cargar()} />
          </div>
          <Button label="Buscar" icon="pi pi-search" onClick={cargar} loading={cargando} />
        </div>

        <DataTable
          value={operaciones}
          loading={cargando}
          size="small"
          stripedRows
          paginator
          rows={10}
          emptyMessage="No hay operaciones en el rango indicado"
        >
          <Column field="correlativo" header="#" body={(o) => `#${o.correlativo}`} style={{ width: "5rem" }} />
          <Column header="Fecha" body={(o) => new Date(o.fecha).toLocaleDateString("es-PE")} style={{ width: "7rem" }} />
          <Column field="empresa" header="Empresa" />
          <Column field="tipo" header="Operación" />
          <Column field="detalle" header="Detalle" />
          <Column header="Monto" body={(o) => `${o.simbolo} ${formatearNumero(o.monto, 2)}`} style={{ textAlign: "right" }} />
          <Column field="movimientos" header="Mov." style={{ width: "4rem", textAlign: "center" }} />
          <Column
            header="Acciones"
            style={{ width: "9rem" }}
            body={(o) => (
              <Button label="Revertir" icon="pi pi-undo" size="small" severity="danger" outlined onClick={() => setSeleccion(o)} />
            )}
          />
        </DataTable>
      </Dialog>

      <RevertirOperacionDialog
        visible={!!seleccion}
        onHide={() => setSeleccion(null)}
        empresaId={seleccion?.empresaId}
        correlativo={seleccion?.correlativo}
        onRevertida={() => {
          setSeleccion(null);
          cargar();
        }}
      />
    </>
  );
};

export default ListaOperacionesDialog;
