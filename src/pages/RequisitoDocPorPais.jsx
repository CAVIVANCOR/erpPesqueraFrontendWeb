/**
 * Pantalla CRUD para gestión de Requisitos de Documentos por País
 * Define qué documentos son obligatorios para cada país/producto
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
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import {
  getRequisitosDocPorPais,
  eliminarRequisitoDocPorPais,
} from "../api/requisitoDocPorPais";
import { getPaises } from "../api/pais";
import { getTiposProducto } from "../api/tipoProducto";
import { getDocRequeridaVentas } from "../api/docRequeridaVentas";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { Navigate } from "react-router-dom";
import RequisitoDocPorPaisForm from "../components/requisitoDocPorPais/RequisitoDocPorPaisForm";
import { getResponsiveFontSize } from "../utils/utils";

const RequisitoDocPorPais = ({ ruta }) => {
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const [requisitos, setRequisitos] = useState([]);
  const [requisitosFiltrados, setRequisitosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [requisitoSeleccionado, setRequisitoSeleccionado] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Estados para filtros
  const [paises, setPaises] = useState([]);
  const [tiposProducto, setTiposProducto] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [filtroPais, setFiltroPais] = useState(null);
  const [filtroTipoProducto, setFiltroTipoProducto] = useState(null);
  const [filtroDocumento, setFiltroDocumento] = useState(null);
  const [filtroObligatorio, setFiltroObligatorio] = useState(null);

  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [
    requisitos,
    filtroPais,
    filtroTipoProducto,
    filtroDocumento,
    filtroObligatorio,
  ]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const [dataRequisitos, dataPaises, dataTiposProducto, dataDocumentos] =
        await Promise.all([
          getRequisitosDocPorPais(),
          getPaises(),
          getTiposProducto(),
          getDocRequeridaVentas(),
        ]);

      setRequisitos(dataRequisitos);
      setRequisitosFiltrados(dataRequisitos);
      setPaises(dataPaises);
      setTiposProducto(dataTiposProducto);
      setDocumentos(dataDocumentos);
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

  const cargarRequisitos = async () => {
    try {
      setLoading(true);
      const data = await getRequisitosDocPorPais();
      setRequisitos(data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar requisitos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...requisitos];

    if (filtroPais !== null) {
      resultado = resultado.filter(
        (r) => Number(r.paisId) === Number(filtroPais)
      );
    }

    if (filtroTipoProducto !== null) {
      resultado = resultado.filter(
        (r) => Number(r.tipoProductoId) === Number(filtroTipoProducto)
      );
    }

    if (filtroDocumento !== null) {
      resultado = resultado.filter(
        (r) => Number(r.docRequeridaVentasId) === Number(filtroDocumento)
      );
    }

    if (filtroObligatorio !== null) {
      resultado = resultado.filter(
        (r) => r.esObligatorio === filtroObligatorio
      );
    }

    setRequisitosFiltrados(resultado);
  };

  const limpiarFiltros = () => {
    setFiltroPais(null);
    setFiltroTipoProducto(null);
    setFiltroDocumento(null);
    setFiltroObligatorio(null);
  };

  const handleNuevo = () => {
    setRequisitoSeleccionado(null);
    setModoEdicion(false);
    setDialogVisible(true);
  };

  const handleEditar = (rowData) => {
    setRequisitoSeleccionado(rowData);
    setModoEdicion(true);
    setDialogVisible(true);
  };

  const handleEliminar = (rowData) => {
    confirmDialog({
      message: `¿Está seguro de eliminar este requisito?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          setLoading(true);
          await eliminarRequisitoDocPorPais(rowData.id);
          toast.current.show({
            severity: "success",
            summary: "Eliminado",
            detail: "Requisito eliminado correctamente",
            life: 3000,
          });
          cargarRequisitos();
        } catch (error) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail:
              error.response?.data?.message || "Error al eliminar requisito",
            life: 3000,
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleFormSubmit = () => {
    setDialogVisible(false);
    cargarRequisitos();
  };

  const handleFormCancel = () => {
    setDialogVisible(false);
  };

  // Templates
  const documentoTemplate = (rowData) => (
    <span style={{ fontWeight: "bold" }}>
      {rowData.docRequeridaVentas?.nombre || "-"}
    </span>
  );

  const paisTemplate = (rowData) => <span>{rowData.pais?.nombre || "-"}</span>;

  const tipoProductoTemplate = (rowData) => (
    <span>{rowData.tipoProducto?.nombre || "TODOS"}</span>
  );

  const obligatorioTemplate = (rowData) => (
    <Tag
      value={rowData.esObligatorio ? "SÍ" : "NO"}
      severity={rowData.esObligatorio ? "danger" : "secondary"}
      style={{ fontSize: "12px" }}
    />
  );

  const accionesTemplate = (rowData) => (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: "0.25rem",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-text p-button-info"
        onClick={() => handleEditar(rowData)}
        tooltip="Editar"
        tooltipOptions={{ position: "top" }}
        disabled={!permisos.puedeEditar}
      />
      {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger"
          onClick={() => handleEliminar(rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
          disabled={!permisos.puedeEliminar}
        />
      )}
    </div>
  );

  return (
    <div className="card">
      <Toast ref={toast} />
      <ConfirmDialog />

      <DataTable
        value={requisitosFiltrados}
        loading={loading}
        size="small"
        showGridlines
        stripedRows
        selectionMode="single"
        onRowClick={(e) => handleEditar(e.data)}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        paginator
        rows={10}
        rowsPerPageOptions={[10, 20, 50, 100]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} requisitos"
        header={
          <div>
            <div
              style={{
                alignItems: "end",
                justifyContent: "space-around",
                display: "flex",
                gap: 10,
                marginBottom: "1rem",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <h2>Requisitos de Documentos por País</h2>
              </div>
              <div style={{ flex: 1}}>
                <Button
                  label="Nuevo"
                  icon="pi pi-plus"
                  onClick={handleNuevo}
                  disabled={!permisos.puedeCrear}
                />
              </div>
              <div style={{ flex: 1}}>
                <Button
                  label="Limpiar"
                  icon="pi pi-filter-slash"
                  className="p-button-outlined"
                  onClick={limpiarFiltros}
                />
              </div>
            </div>

            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <Dropdown
                  value={filtroDocumento}
                  options={documentos.map((d) => ({
                    label: d.nombre,
                    value: d.id,
                  }))}
                  onChange={(e) => setFiltroDocumento(e.value)}
                  placeholder="Filtrar por Documento"
                  showClear
                  filter
                />
              </div>
              <div style={{ flex: 2 }}>
                <Dropdown
                  value={filtroPais}
                  options={paises.map((p) => ({
                    label: p.nombre,
                    value: p.id,
                  }))}
                  onChange={(e) => setFiltroPais(e.value)}
                  placeholder="Filtrar por País"
                  showClear
                  filter
                />
              </div>
              <div style={{ flex: 2 }}>
                <Dropdown
                  value={filtroTipoProducto}
                  options={tiposProducto.map((t) => ({
                    label: t.nombre,
                    value: t.id,
                  }))}
                  onChange={(e) => setFiltroTipoProducto(e.value)}
                  placeholder="Filtrar por Tipo Producto"
                  showClear
                  filter
                />
              </div>
              <div style={{ flex: 1 }}>
                <Dropdown
                  value={filtroObligatorio}
                  options={[
                    { label: "Obligatorios", value: true },
                    { label: "No Obligatorios", value: false },
                  ]}
                  onChange={(e) => setFiltroObligatorio(e.value)}
                  placeholder="Filtrar Obligatorio"
                  showClear
                />
              </div>
            </div>
          </div>
        }
        dataKey="id"
        emptyMessage="No se encontraron requisitos"
      >
        <Column field="id" header="ID" sortable style={{ minWidth: "60px" }} />
        <Column
          header="Documento"
          body={documentoTemplate}
          sortable
          field="docRequeridaVentas.nombre"
          style={{ minWidth: "250px" }}
        />
        <Column
          header="País"
          body={paisTemplate}
          sortable
          field="pais.nombre"
          style={{ minWidth: "150px" }}
        />
        <Column
          header="Tipo Producto"
          body={tipoProductoTemplate}
          sortable
          field="tipoProducto.nombre"
          style={{ minWidth: "150px" }}
        />
        <Column
          header="Obligatorio"
          body={obligatorioTemplate}
          sortable
          field="esObligatorio"
          style={{ width: "100px", textAlign: "center" }}
        />
        <Column
          field="observaciones"
          header="Observaciones"
          style={{ minWidth: "200px" }}
        />
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ width: "80px" }}
        />
      </DataTable>

      <Dialog
        visible={dialogVisible}
        style={{ width: "800px" }}
        header={
          modoEdicion
            ? "Editar Requisito de Documento"
            : "Nuevo Requisito de Documento"
        }
        modal
        maximizable
        onHide={handleFormCancel}
      >
        <RequisitoDocPorPaisForm
          requisitoInicial={requisitoSeleccionado}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          toast={toast}
          readOnly={modoEdicion && !permisos.puedeEditar}
        />
      </Dialog>
    </div>
  );
};

export default RequisitoDocPorPais;
