// src/pages/MovimientoActivoFijo.jsx
import React, { useRef, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import MovimientoActivoFijoForm from "../components/movimientoActivoFijo/MovimientoActivoFijoForm";
import {
  getMovimientosActivoFijo,
  eliminarMovimientoActivoFijo,
} from "../api/movimientoActivoFijo";
import { getEmpresas } from "../api/empresa";
import { getActivos } from "../api/activo";
import { getTiposMovimientoActivoFijo } from "../api/tipoMovimientoActivoFijo";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize, formatearFecha } from "../utils/utils";
import ReportFormatSelector from "../components/reports/ReportFormatSelector";
import TemporaryPDFViewer from "../components/reports/TemporaryPDFViewer";
import TemporaryExcelViewer from "../components/reports/TemporaryExcelViewer";
import { generarMovimientosActivoFijoPDF } from "../components/movimientoActivoFijo/reports/generarMovimientosActivoFijoPDF";
import { generarMovimientosActivoFijoExcel } from "../components/movimientoActivoFijo/reports/generarMovimientosActivoFijoExcel";

export default function MovimientoActivoFijo({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [activos, setActivos] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [empresaFilter, setEmpresaFilter] = useState(null);
  const [activoFilter, setActivoFilter] = useState(null);
  const [tipoMovimientoFilter, setTipoMovimientoFilter] = useState(null);
  const [rangoFechas, setRangoFechas] = useState(null);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showFormatSelector, setShowFormatSelector] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [showExcelViewer, setShowExcelViewer] = useState(false);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    filtrarItems();
  }, [items, empresaFilter, activoFilter, tipoMovimientoFilter, rangoFechas]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [movimientosData, empresasData, activosData, tiposData] =
        await Promise.all([
          getMovimientosActivoFijo(),
          getEmpresas(),
          getActivos(),
          getTiposMovimientoActivoFijo(),
        ]);
      setItems(movimientosData);
      setEmpresas(empresasData);
      setActivos(activosData);
      setTiposMovimiento(tiposData);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const filtrarItems = () => {
    let resultado = [...items];

    if (empresaFilter) {
      resultado = resultado.filter(
        (item) => Number(item.empresaId) === Number(empresaFilter)
      );
    }

    if (activoFilter) {
      resultado = resultado.filter(
        (item) => Number(item.activoId) === Number(activoFilter)
      );
    }

    if (tipoMovimientoFilter) {
      resultado = resultado.filter(
        (item) =>
          Number(item.tipoMovimientoActivoFijoId) ===
          Number(tipoMovimientoFilter)
      );
    }

    if (rangoFechas && rangoFechas[0]) {
      const fechaInicio = new Date(rangoFechas[0]);
      fechaInicio.setHours(0, 0, 0, 0);

      if (rangoFechas[1]) {
        const fechaFin = new Date(rangoFechas[1]);
        fechaFin.setHours(23, 59, 59, 999);

        resultado = resultado.filter((item) => {
          const fechaMovimiento = new Date(item.fechaMovimiento);
          return fechaMovimiento >= fechaInicio && fechaMovimiento <= fechaFin;
        });
      } else {
        resultado = resultado.filter((item) => {
          const fechaMovimiento = new Date(item.fechaMovimiento);
          return fechaMovimiento >= fechaInicio;
        });
      }
    }

    setItemsFiltrados(resultado);
  };

  const handleNuevo = () => {
    setSelected(null);
    setIsEdit(false);
    setShowDialog(true);
  };

  const handleEditar = (rowData) => {
    setSelected(rowData);
    setIsEdit(true);
    setShowDialog(true);
  };

  const handleEliminar = (rowData) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el movimiento del activo "${rowData.activo?.nombre}"?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      accept: async () => {
        try {
          await eliminarMovimientoActivoFijo(rowData.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Movimiento eliminado correctamente",
            life: 3000,
          });
          await cargarDatos();
        } catch (error) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail:
              error.response?.data?.message ||
              "Error al eliminar el movimiento",
            life: 3000,
          });
        }
      },
    });
  };

  const onSave = async (movimiento, cerrarDialogo = true) => {
    await cargarDatos();

    if (cerrarDialogo) {
      setShowDialog(false);
      setSelected(null);
    } else {
      // Actualizar el selected con los nuevos datos
      const movimientoActualizado = items.find(
        (item) => Number(item.id) === Number(movimiento.id)
      );
      if (movimientoActualizado) {
        setSelected(movimientoActualizado);
      }
    }
  };

  const onCancel = () => {
    setShowDialog(false);
    setSelected(null);
  };

  const limpiarFiltros = () => {
    setEmpresaFilter(null);
    setActivoFilter(null);
    setTipoMovimientoFilter(null);
    setRangoFechas(null);
    setGlobalFilter("");
  };

  const handleGenerarReporte = async (formato) => {
    setShowFormatSelector(false);
    setLoading(true);

    try {
      const datosReporte = {
        movimientos: itemsFiltrados,
        empresaFilter: empresaFilter
          ? empresas.find((e) => Number(e.id) === Number(empresaFilter))
          : null,
        activoFilter: activoFilter
          ? activos.find((a) => Number(a.id) === Number(activoFilter))
          : null,
        tipoMovimientoFilter: tipoMovimientoFilter
          ? tiposMovimiento.find(
            (t) => Number(t.id) === Number(tipoMovimientoFilter)
          )
          : null,
        rangoFechas: rangoFechas,
        usuario: usuario,
      };

      if (formato === "pdf") {
        const pdfBlob = await generarMovimientosActivoFijoPDF(datosReporte);
        setReportData(pdfBlob);
        setShowPDFViewer(true);
      } else if (formato === "excel") {
        const excelBlob = await generarMovimientosActivoFijoExcel(datosReporte);
        setReportData(excelBlob);
        setShowExcelViewer(true);
      }
    } catch (error) {
      console.error("Error al generar reporte:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al generar el reporte",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Templates de columnas
  const empresaBodyTemplate = (rowData) => {
    return rowData.empresa?.razonSocial || "-";
  };

  const activoBodyTemplate = (rowData) => {
    return rowData.activo?.nombre || "-";
  };

  const tipoMovimientoBodyTemplate = (rowData) => {
    return rowData.tipoMovimiento?.nombre || "-";
  };

  const descripcionActivoBodyTemplate = (rowData) => {
    return rowData.activo?.descripcion || "-";
  };

  const fechaBodyTemplate = (rowData) => {
    return formatearFecha(rowData.fechaMovimiento);
  };

  const montoBodyTemplate = (rowData) => {
    const moneda = rowData.moneda?.codigoSunat || "PEN";
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: moneda === "USD" ? "USD" : "PEN",
    }).format(rowData.valorNeto || 0);
  };

  const periodoBodyTemplate = (rowData) => {
    return rowData.periodoContable?.nombrePeriodo || "-";
  };

  const accionesBodyTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {permisos.puedeEditar && (
          <Button
            icon="pi pi-pencil"
            className="p-button-rounded p-button-text p-button-warning"
            onClick={() => handleEditar(rowData)}
            tooltip="Editar"
          />
        )}
        {permisos.puedeEliminar && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-text p-button-danger"
            onClick={() => handleEliminar(rowData)}
            tooltip="Eliminar"
          />
        )}
      </div>
    );
  };

  const header = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem",
      }}
    >
      <h2 style={{ margin: 0, fontSize: getResponsiveFontSize() }}>
        Movimientos de Activos Fijos
      </h2>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <InputText
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar..."
          style={{ width: "200px" }}
        />
        {permisos.puedeCrear && (
          <Button
            label="Nuevo"
            icon="pi pi-plus"
            onClick={handleNuevo}
            disabled={loading}
          />
        )}
        <Button
          label="Reporte"
          icon="pi pi-file"
          className="p-button-help"
          onClick={() => setShowFormatSelector(true)}
          disabled={loading || itemsFiltrados.length === 0}
        />
      </div>
    </div>
  );

  const filtrosPanel = (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1rem",
        padding: "1rem",
        backgroundColor: "#f8f9fa",
        borderRadius: "4px",
        marginBottom: "1rem",
      }}
    >
      <div>
        <label htmlFor="empresaFilter" style={{ display: "block", marginBottom: "0.5rem" }}>
          Empresa
        </label>
        <Dropdown
          id="empresaFilter"
          value={empresaFilter}
          options={empresas.map((e) => ({
            label: e.razonSocial,
            value: Number(e.id),
          }))}
          onChange={(e) => setEmpresaFilter(e.value)}
          placeholder="Todas"
          showClear
          style={{ width: "100%" }}
        />
      </div>
      <div>
        <label htmlFor="activoFilter" style={{ display: "block", marginBottom: "0.5rem" }}>
          Activo
        </label>
        <Dropdown
          id="activoFilter"
          value={activoFilter}
          options={activos.map((a) => ({
            label: a.nombre,
            value: Number(a.id),
          }))}
          onChange={(e) => setActivoFilter(e.value)}
          placeholder="Todos"
          showClear
          filter
          style={{ width: "100%" }}
        />
      </div>
      <div>
        <label htmlFor="tipoMovimientoFilter" style={{ display: "block", marginBottom: "0.5rem" }}>
          Tipo Movimiento
        </label>
        <Dropdown
          id="tipoMovimientoFilter"
          value={tipoMovimientoFilter}
          options={tiposMovimiento.map((t) => ({
            label: t.nombre,
            value: Number(t.id),
          }))}
          onChange={(e) => setTipoMovimientoFilter(e.value)}
          placeholder="Todos"
          showClear
          style={{ width: "100%" }}
        />
      </div>
      <div>
        <label htmlFor="rangoFechas" style={{ display: "block", marginBottom: "0.5rem" }}>
          Rango de Fechas
        </label>
        <Calendar
          id="rangoFechas"
          value={rangoFechas}
          onChange={(e) => setRangoFechas(e.value)}
          selectionMode="range"
          readOnlyInput
          showIcon
          placeholder="Seleccionar rango"
          dateFormat="dd/mm/yy"
          style={{ width: "100%" }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "flex-end" }}>
        <Button
          label="Limpiar Filtros"
          icon="pi pi-filter-slash"
          className="p-button-outlined"
          onClick={limpiarFiltros}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );

  return (
    <div className="card">
      <Toast ref={toast} />
      <ConfirmDialog />

      {filtrosPanel}

      <DataTable
        value={itemsFiltrados}
        loading={loading}
        header={header}
        globalFilter={globalFilter}
        emptyMessage="No se encontraron movimientos"
        paginator
        rows={40}
        rowsPerPageOptions={[40, 80, 160, 250]}
        showGridlines
        stripedRows
        size="small"
        style={{ fontSize: getResponsiveFontSize() }}
        selectionMode="single"
        onRowClick={(e) => permisos.puedeEditar && handleEditar(e.data)}
        className="cursor-pointer"
      >
        <Column
          field="empresa.razonSocial"
          header="Empresa"
          body={empresaBodyTemplate}
          sortable
          filter
          filterPlaceholder="Buscar por empresa"
        />
        <Column
          field="activo.nombre"
          header="Activo"
          body={activoBodyTemplate}
          sortable
          filter
          filterPlaceholder="Buscar por activo"
        />
        <Column
          field="activo.descripcion"
          header="Descripción"
          body={descripcionActivoBodyTemplate}
          sortable
          filter
          filterPlaceholder="Buscar por descripción"
        />
        <Column
          field="tipoMovimiento.nombre"
          header="Tipo Movimiento"
          body={tipoMovimientoBodyTemplate}
          sortable
          filter
          filterPlaceholder="Buscar por tipo"
        />
        <Column
          field="fechaMovimiento"
          header="Fecha"
          body={fechaBodyTemplate}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          field="valorNeto"
          header="Valor Neto"
          body={montoBodyTemplate}
          sortable
          style={{ minWidth: "150px", textAlign: "right" }}
        />
        <Column
          field="periodoContable.nombrePeriodo"
          header="Período"
          body={periodoBodyTemplate}
          sortable
          filter
          filterPlaceholder="Buscar por período"
        />
        <Column
          header="Acciones"
          body={accionesBodyTemplate}
          style={{ minWidth: "120px", textAlign: "center" }}
        />
      </DataTable>

      {/* Diálogo para crear/editar */}
      <Dialog
        visible={showDialog}
        onHide={onCancel}
        header={isEdit ? "Editar Movimiento" : "Nuevo Movimiento"}
        style={{ width: "90vw", maxWidth: "1200px" }}
        maximizable
        modal
      >
        <MovimientoActivoFijoForm
          movimiento={selected}
          empresas={empresas}
          activos={activos}
          tiposMovimiento={tiposMovimiento}
          esEdicion={isEdit}
          empresaIdInicial={empresaFilter}
          activoIdInicial={activoFilter}
          onSave={onSave}
          onCancel={onCancel}
          permisos={permisos}
          readOnly={!!selected && !!selected.id && !permisos.puedeEditar}
        />
      </Dialog>

      {/* Selector de formato de reporte */}
      <ReportFormatSelector
        visible={showFormatSelector}
        onHide={() => setShowFormatSelector(false)}
        onSelectFormat={handleGenerarReporte}
        title="Generar Reporte de Movimientos de Activos Fijos"
      />

      {/* Visor de PDF */}
      <TemporaryPDFViewer
        visible={showPDFViewer}
        onHide={() => {
          setShowPDFViewer(false);
          setReportData(null);
        }}
        pdfBlob={reportData}
        fileName="movimientos_activos_fijos.pdf"
      />

      {/* Visor de Excel */}
      <TemporaryExcelViewer
        visible={showExcelViewer}
        onHide={() => {
          setShowExcelViewer(false);
          setReportData(null);
        }}
        excelBlob={reportData}
        fileName="movimientos_activos_fijos.xlsx"
      />
    </div>
  );
}