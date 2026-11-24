// src/pages/ResumenSunat.jsx
// Consulta de resúmenes diarios de boletas (RC) y comunicaciones de baja (RA): lista, filtros y vista de detalle en
// SOLO LECTURA. No hay alta, edición ni eliminación: los resúmenes los genera el proceso de facturación electrónica y
// su estado lo actualiza la consulta del ticket en Smart PSE.
import React, { useRef, useState, useEffect, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize, formatearFecha } from "../utils/utils";
import { mensajeDeError } from "../utils/mensajeError";
import { getResumenesSunat, getResumenSunatById } from "../api/facturacionElectronica/resumenSunat";
import { getEmpresas } from "../api/empresa";
import ResumenSunatForm from "../components/resumenSunat/ResumenSunatForm";

const TIPOS = [
  { label: "Resumen diario de boletas (RC)", value: "RC" },
  { label: "Comunicación de baja (RA)", value: "RA" },
];
const ESTADOS = ["PENDIENTE", "ENVIADO", "ACEPTADO", "RECHAZADO", "ERROR"].map((e) => ({ label: e, value: e }));
const SEVERIDAD_ESTADO = { PENDIENTE: "warning", ENVIADO: "info", ACEPTADO: "success", RECHAZADO: "danger", ERROR: "danger" };

/**
 * Pantalla de consulta de Resúmenes y Bajas SUNAT (solo lectura).
 */
export default function ResumenSunat({ ruta }) {
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [resumenes, setResumenes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);

  useEffect(() => {
    getEmpresas()
      .then(setEmpresas)
      .catch((err) =>
        toast.current?.show({ severity: "error", summary: "Error", detail: mensajeDeError(err, "No se pudieron cargar las empresas"), life: 6000 }),
      );
  }, []);

  // Empresa y tipo se filtran en el servidor; estado, fechas y búsqueda sobre lo ya cargado
  useEffect(() => {
    cargarResumenes();
  }, [empresaSeleccionada, tipoSeleccionado]);

  const cargarResumenes = async () => {
    setLoading(true);
    try {
      setResumenes(
        (
          await getResumenesSunat({
            ...(empresaSeleccionada ? { empresaId: empresaSeleccionada } : {}),
            ...(tipoSeleccionado ? { tipo: tipoSeleccionado } : {}),
          })
        ).map((r) => ({ ...r, empresaNombre: r.empresa?.razonSocial || "" })),
      );
    } catch (err) {
      toast.current?.show({ severity: "error", summary: "Error", detail: mensajeDeError(err, "No se pudieron cargar los resúmenes"), life: 8000 });
    }
    setLoading(false);
  };

  const resumenesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return resumenes.filter((r) => {
      const fecha = new Date(r.fechaReferencia);
      if (estadoSeleccionado && r.estado !== estadoSeleccionado) return false;
      if (fechaInicio && fecha < new Date(new Date(fechaInicio).setHours(0, 0, 0, 0))) return false;
      if (fechaFin && fecha > new Date(new Date(fechaFin).setHours(23, 59, 59, 999))) return false;
      if (texto && ![r.nombreArchivo, r.ticket, r.empresaNombre, r.mensajeRespuesta].some((v) => String(v || "").toLowerCase().includes(texto))) return false;
      return true;
    });
  }, [resumenes, estadoSeleccionado, fechaInicio, fechaFin, busqueda]);

  const limpiarFiltros = () => {
    setEmpresaSeleccionada(null);
    setTipoSeleccionado(null);
    setEstadoSeleccionado(null);
    setFechaInicio(null);
    setFechaFin(null);
    setBusqueda("");
  };

  // El detalle (con los comprobantes que informa) se pide al abrir el registro
  const abrirDetalle = async (rowData) => {
    try {
      setSeleccionado(await getResumenSunatById(rowData.id));
    } catch (err) {
      toast.current?.show({ severity: "error", summary: "Error", detail: mensajeDeError(err, "No se pudo cargar el detalle del resumen"), life: 8000 });
    }
  };

  const estadoTemplate = (rowData) => <Tag value={rowData.estado} severity={SEVERIDAD_ESTADO[rowData.estado] || "secondary"} />;

  return (
    <div className="p-fluid" style={{ margin: "2rem" }}>
      <Toast ref={toast} />
      <DataTable
        value={resumenesFiltrados}
        loading={loading}
        paginator
        rows={20}
        rowsPerPageOptions={[20, 50, 100]}
        emptyMessage="No hay resúmenes ni bajas registrados."
        stripedRows
        showGridlines
        size="small"
        style={{ fontSize: getResponsiveFontSize() }}
        onRowClick={(e) => abrirDetalle(e.data)}
        selectionMode="single"
        header={
          <div>
            <div style={{ display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, flex: 1 }}>Resúmenes y Bajas SUNAT</h2>
              <span className="p-input-icon-left" style={{ minWidth: 260 }}>
                <i className="pi pi-search" />
                <InputText value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar archivo, ticket o empresa" />
              </span>
              <Button icon="pi pi-refresh" label="Actualizar" onClick={cargarResumenes} style={{ width: "auto" }} />
              <Button icon="pi pi-filter-slash" label="Limpiar" className="p-button-secondary" onClick={limpiarFiltros} style={{ width: "auto" }} />
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap", marginTop: 10 }}>
              <div style={{ minWidth: 260, flex: 1 }}>
                <label htmlFor="filtroEmpresa">Empresa</label>
                <Dropdown
                  id="filtroEmpresa"
                  value={empresaSeleccionada}
                  options={empresas.map((e) => ({ label: e.razonSocial, value: Number(e.id) }))}
                  onChange={(e) => setEmpresaSeleccionada(e.value)}
                  placeholder="Todas"
                  showClear
                />
              </div>
              <div style={{ minWidth: 240, flex: 1 }}>
                <label htmlFor="filtroTipo">Tipo</label>
                <Dropdown id="filtroTipo" value={tipoSeleccionado} options={TIPOS} onChange={(e) => setTipoSeleccionado(e.value)} placeholder="Todos" showClear />
              </div>
              <div style={{ minWidth: 160 }}>
                <label htmlFor="filtroEstado">Estado</label>
                <Dropdown id="filtroEstado" value={estadoSeleccionado} options={ESTADOS} onChange={(e) => setEstadoSeleccionado(e.value)} placeholder="Todos" showClear />
              </div>
              <div style={{ minWidth: 160 }}>
                <label htmlFor="filtroDesde">Referencia desde</label>
                <Calendar id="filtroDesde" value={fechaInicio} onChange={(e) => setFechaInicio(e.value)} dateFormat="dd/mm/yy" showIcon showButtonBar />
              </div>
              <div style={{ minWidth: 160 }}>
                <label htmlFor="filtroHasta">Referencia hasta</label>
                <Calendar id="filtroHasta" value={fechaFin} onChange={(e) => setFechaFin(e.value)} dateFormat="dd/mm/yy" showIcon showButtonBar />
              </div>
            </div>
            <small style={{ display: "block", marginTop: 6, color: "#6c757d" }}>
              Mostrando {resumenesFiltrados.length} de {resumenes.length}. Pulse una fila para ver el detalle (solo lectura).
            </small>
          </div>
        }
      >
        <Column field="id" header="ID" style={{ width: 70 }} sortable />
        <Column field="empresaNombre" header="Empresa" sortable />
        <Column field="tipo" header="Tipo" style={{ width: 70 }} sortable />
        <Column field="fechaReferencia" header="Fecha de referencia" body={(r) => formatearFecha(r.fechaReferencia)} sortable />
        <Column field="nombreArchivo" header="Archivo" sortable />
        <Column field="ticket" header="Ticket" />
        <Column field="estado" header="Estado" body={estadoTemplate} sortable />
        <Column header="Comprobantes" body={(r) => r._count?.detalles ?? 0} style={{ width: 110, textAlign: "right" }} />
        <Column field="mensajeRespuesta" header="Respuesta SUNAT" />
        <Column
          header="Ver"
          style={{ width: 70, textAlign: "center" }}
          body={(r) => (
            <Button
              icon="pi pi-eye"
              className="p-button-text"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                abrirDetalle(r);
              }}
              tooltip="Ver detalle (solo lectura)"
            />
          )}
        />
      </DataTable>

      <Dialog
        header={seleccionado ? `${seleccionado.tipo === "RC" ? "Resumen diario" : "Comunicación de baja"} ${seleccionado.nombreArchivo}` : ""}
        visible={!!seleccionado}
        style={{ width: "950px", maxWidth: "98vw" }}
        onHide={() => setSeleccionado(null)}
        modal
      >
        <ResumenSunatForm resumen={seleccionado} onCerrar={() => setSeleccionado(null)} />
      </Dialog>
    </div>
  );
}
