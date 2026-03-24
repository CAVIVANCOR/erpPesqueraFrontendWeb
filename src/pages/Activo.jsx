/**
 * Pantalla CRUD para gestión de Activos
 *
 * Características implementadas:
 * - Edición profesional por clic en fila (abre modal de edición)
 * - Botón eliminar visible solo para superusuario/admin (usuario?.esSuperUsuario || usuario?.esAdmin)
 * - Confirmación de borrado con ConfirmDialog visual rojo y mensajes claros
 * - Feedback visual con Toast para éxito/error
 * - Búsqueda global por nombre, descripción
 * - Filtros por Empresa y Tipo de Activo
 * - Cumple regla transversal ERP Megui completa
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import ReportFormatSelector from "../components/reports/ReportFormatSelector";
import TemporaryPDFViewer from "../components/reports/TemporaryPDFViewer";
import TemporaryExcelViewer from "../components/reports/TemporaryExcelViewer";
import { generarActivosPDF } from "../components/activo/reports/generarActivosPDF";
import { generarActivosExcel } from "../components/activo/reports/generarActivosExcel";

import { getActivos, eliminarActivo } from "../api/activo";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import ActivoForm from "../components/activo/ActivoForm";
import { getResponsiveFontSize } from "../utils/utils";
import { getEmpresas } from "../api/empresa";
import { getTiposActivo } from "../api/tipoActivo";

const Activo = ({ ruta }) => {
  const [activos, setActivos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [tiposActivo, setTiposActivo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [activoSeleccionado, setActivoSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [activoAEliminar, setActivoAEliminar] = useState(null);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [tipoActivoSeleccionado, setTipoActivoSeleccionado] = useState(null);
  const [showFormatSelector, setShowFormatSelector] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [showExcelViewer, setShowExcelViewer] = useState(false);
  const [reportData, setReportData] = useState(null);
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return (
      <div className="p-4">
        <h2>Sin Acceso</h2>
        <p>No tiene permisos para acceder a este módulo.</p>
      </div>
    );
  }

  // Determinar si es modo solo lectura
  const readOnly = !permisos.puedeEditar && !permisos.puedeCrear;

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [activosData, empresasData, tiposActivoData] = await Promise.all([
        getActivos(),
        getEmpresas(),
        getTiposActivo(),
      ]);
      setActivos(activosData);
      setEmpresas(empresasData);
      setTiposActivo(tiposActivoData);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar activos por empresa y tipo
  const activosFiltrados = React.useMemo(() => {
    let filtrados = activos;

    // Filtrar por empresa
    if (empresaSeleccionada) {
      filtrados = filtrados.filter(
        (activo) => Number(activo.empresaId) === Number(empresaSeleccionada),
      );
    }

    // Filtrar por tipo de activo
    if (tipoActivoSeleccionado) {
      filtrados = filtrados.filter(
        (activo) => Number(activo.tipoId) === Number(tipoActivoSeleccionado),
      );
    }

    return filtrados;
  }, [activos, empresaSeleccionada, tipoActivoSeleccionado]);

  const limpiarFiltros = () => {
    setEmpresaSeleccionada(null);
    setTipoActivoSeleccionado(null);
  };

  // ⭐ AGREGAR ESTA FUNCIÓN
  const handleGenerarReporte = () => {
    const data = {
      activos: activosFiltrados,
      empresas: empresas,
      tiposActivo: tiposActivo,
      fechaGeneracion: new Date(),
      titulo: "Listado de Activos",
    };
    setReportData(data);
    setShowFormatSelector(true);
  };

  const abrirDialogoNuevo = () => {
    if (!empresaSeleccionada) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar una empresa primero.",
      });
      return;
    }
    setActivoSeleccionado(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (activo) => {
    setActivoSeleccionado(activo);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setActivoSeleccionado(null);
  };

  const onGuardarExitoso = () => {
    cargarDatos();
    cerrarDialogo();
    toast.current.show({
      severity: "success",
      summary: "Éxito",
      detail: activoSeleccionado
        ? "Activo actualizado correctamente"
        : "Activo creado correctamente",
      life: 3000,
    });
  };

  const confirmarEliminacion = (activo) => {
    setActivoAEliminar(activo);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      await eliminarActivo(activoAEliminar.id);
      setActivos(
        activos.filter((a) => Number(a.id) !== Number(activoAEliminar.id)),
      );
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Activo eliminado correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar activo",
        life: 3000,
      });
    } finally {
      setConfirmVisible(false);
      setActivoAEliminar(null);
    }
  };

  const nombreTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", color: "#2563eb" }}>
        {rowData.nombre}
      </span>
    );
  };

  const tipoActivoTemplate = (rowData) => {
    return rowData.tipo?.nombre || "N/A";
  };

  const empresaTemplate = (rowData) => {
    const empresaRazonSocial = empresas.find(
      (e) => Number(e.id) === Number(rowData.empresaId),
    )?.razonSocial;
    return empresaRazonSocial || "N/A";
  };

  const cesadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.cesado ? "CESADO" : "ACTIVO"}
        severity={rowData.cesado ? "danger" : "success"}
        style={{ fontSize: "10px", padding: "2px 8px" }}
      />
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-mr-2"
          onClick={(ev) => {
            ev.stopPropagation();
            abrirDialogoEdicion(rowData);
          }}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-text p-button-danger"
            onClick={() => confirmarEliminacion(rowData)}
            tooltip="Eliminar"
          />
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <DataTable
        value={activosFiltrados}
        loading={loading}
        paginator
        rows={40}
        stripedRows
        showGridlines
        rowsPerPageOptions={[40, 80, 160, 200]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} activos"
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron activos"
        sortField="id"
        sortOrder={-1}
        size="small"
        header={
          <div>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "end",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <h1>Activos</h1>
              </div>
              <div style={{ flex: 3 }}>
                <label
                  htmlFor="empresaFilter"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Empresa:
                </label>
                <Dropdown
                  id="empresaFilter"
                  value={empresaSeleccionada}
                  options={empresas}
                  onChange={(e) => setEmpresaSeleccionada(e.value)}
                  optionLabel="razonSocial"
                  optionValue="id"
                  placeholder="Todas"
                  filter
                  showClear
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 2 }}>
                <label
                  htmlFor="tipoActivoFilter"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Tipo de Activo:
                </label>
                <Dropdown
                  id="tipoActivoFilter"
                  value={tipoActivoSeleccionado}
                  options={tiposActivo}
                  onChange={(e) => setTipoActivoSeleccionado(e.value)}
                  optionLabel="nombre"
                  optionValue="id"
                  placeholder="Todos"
                  filter
                  showClear
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  label="Nuevo"
                  icon="pi pi-plus"
                  onClick={abrirDialogoNuevo}
                  disabled={!empresaSeleccionada || !permisos.puedeCrear}
                  style={{ marginTop: "1.8rem" }}
                />
              </div>
              {/* ⭐ AGREGAR ESTE BOTÓN */}
              <div style={{ flex: 1 }}>
                <Button
                  label="Reporte"
                  icon="pi pi-file-pdf"
                  severity="info"
                  onClick={handleGenerarReporte}
                  disabled={activosFiltrados.length === 0}
                  style={{ marginTop: "1.8rem" }}
                />
              </div>
              <div style={{ flex: 2 }}>
                <Button
                  label="Limpiar Filtros"
                  icon="pi pi-filter-slash"
                  className="p-button-outlined p-button-secondary"
                  onClick={limpiarFiltros}
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>
        }
        scrollable
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" sortable style={{ width: 80 }} />
        <Column header="Empresa" body={empresaTemplate} sortable />
        <Column header="Tipo" body={tipoActivoTemplate} sortable />
        <Column field="nombre" header="Nombre" body={nombreTemplate} sortable />
        <Column field="descripcion" header="Descripción" sortable />
        <Column header="Estado" body={cesadoTemplate} sortable />
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ width: 130, textAlign: "center" }}
        />
      </DataTable>

      <Dialog
        header={activoSeleccionado ? "Editar Activo" : "Nuevo Activo"}
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "600px" }}
        modal
      >
        <ActivoForm
          activo={activoSeleccionado}
          empresaIdInicial={empresaSeleccionada}
          tipoIdInicial={tipoActivoSeleccionado}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
          readOnly={readOnly}
        />
      </Dialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar el activo "${activoAEliminar?.nombre}"?`}
        header="Confirmar Eliminación"
        icon="pi pi-exclamation-triangle"
        accept={eliminar}
        reject={() => setConfirmVisible(false)}
        acceptLabel="Sí, Eliminar"
        rejectLabel="Cancelar"
        acceptClassName="p-button-danger"
      />


         {/* ⭐ AGREGAR ESTOS COMPONENTES */}
      <ReportFormatSelector
        visible={showFormatSelector}
        onHide={() => setShowFormatSelector(false)}
        onSelectPDF={() => {
          setShowFormatSelector(false);
          setShowPDFViewer(true);
        }}
        onSelectExcel={() => {
          setShowFormatSelector(false);
          setShowExcelViewer(true);
        }}
        title="Listado de Activos"
      />
      <TemporaryPDFViewer
        visible={showPDFViewer}
        onHide={() => {
          setShowPDFViewer(false);
          setShowFormatSelector(false);
        }}
        data={reportData}
        generatePDF={generarActivosPDF}
        fileName={`activos-${new Date().toISOString().split('T')[0]}.pdf`}
        title="Listado de Activos"
      />
      <TemporaryExcelViewer
        visible={showExcelViewer}
        onHide={() => {
          setShowExcelViewer(false);
          setShowFormatSelector(false);
        }}
        data={reportData}
        generateExcel={generarActivosExcel}
        fileName={`activos-${new Date().toISOString().split('T')[0]}.xlsx`}
        title="Listado de Activos"
      />


    </div>
  );
};

export default Activo;
