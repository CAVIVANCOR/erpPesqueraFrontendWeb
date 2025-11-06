/**
 * Pantalla CRUD para gestión de Documentos Requeridos de Ventas
 *
 * Características implementadas:
 * - Edición profesional por clic en fila (abre modal de edición)
 * - Botón eliminar visible solo para superusuario/admin
 * - Confirmación de borrado con ConfirmDialog visual rojo
 * - Feedback visual con Toast para éxito/error
 * - Filtros profesionales por País, Tipo de Producto y Estado
 * - Validación de permisos con usePermissions
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
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import {
  getDocRequeridaVentas,
  eliminarDocRequeridaVentas,
} from "../api/docRequeridaVentas";
import { getPaises } from "../api/pais";
import { getTiposProducto } from "../api/tipoProducto";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { Navigate } from "react-router-dom";
import DocRequeridaVentasForm from "../components/docRequeridaVentas/DocRequeridaVentasForm";
import { getResponsiveFontSize } from "../utils/utils";

const DocRequeridaVentas = ({ ruta }) => {
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const [documentos, setDocumentos] = useState([]);
  const [documentosFiltrados, setDocumentosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Estados para filtros
  const [paises, setPaises] = useState([]);
  const [tiposProducto, setTiposProducto] = useState([]);
  const [filtroPais, setFiltroPais] = useState(null);
  const [filtroTipoProducto, setFiltroTipoProducto] = useState(null);
  const [filtroActivo, setFiltroActivo] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");

  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [documentos, filtroPais, filtroTipoProducto, filtroActivo]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const [dataDocumentos, dataPaises, dataTiposProducto] = await Promise.all([
        getDocRequeridaVentas(),
        getPaises(),
        getTiposProducto(),
      ]);

      setDocumentos(dataDocumentos);
      setDocumentosFiltrados(dataDocumentos);
      setPaises(dataPaises);
      setTiposProducto(dataTiposProducto);
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

  const cargarDocumentos = async () => {
    try {
      setLoading(true);
      const data = await getDocRequeridaVentas();
      setDocumentos(data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar documentos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...documentos];

    if (filtroPais !== null) {
      resultado = resultado.filter((d) =>
        d.requisitosPorPais?.some((r) => Number(r.paisId) === Number(filtroPais))
      );
    }

    if (filtroTipoProducto !== null) {
      resultado = resultado.filter((d) =>
        d.requisitosPorPais?.some(
          (r) => Number(r.tipoProductoId) === Number(filtroTipoProducto)
        )
      );
    }

    if (filtroActivo !== null) {
      resultado = resultado.filter((d) => d.activo === filtroActivo);
    }

    setDocumentosFiltrados(resultado);
  };

  const limpiarFiltros = () => {
    setFiltroPais(null);
    setFiltroTipoProducto(null);
    setFiltroActivo(null);
    setGlobalFilter("");
  };

  const handleNuevo = () => {
    setDocumentoSeleccionado(null);
    setModoEdicion(false);
    setDialogVisible(true);
  };

  const handleEditar = (rowData) => {
    setDocumentoSeleccionado(rowData);
    setModoEdicion(true);
    setDialogVisible(true);
  };

  const handleEliminar = (rowData) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el documento "${rowData.nombre}"?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          setLoading(true);
          await eliminarDocRequeridaVentas(rowData.id);
          toast.current.show({
            severity: "success",
            summary: "Eliminado",
            detail: "Documento eliminado correctamente",
            life: 3000,
          });
          cargarDocumentos();
        } catch (error) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: error.response?.data?.message || "Error al eliminar documento",
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
    cargarDocumentos();
  };

  const handleFormCancel = () => {
    setDialogVisible(false);
  };

  // Templates
  const activoTemplate = (rowData) => (
    <Tag
      value={rowData.activo ? "ACTIVO" : "INACTIVO"}
      severity={rowData.activo ? "success" : "danger"}
      style={{ fontSize: getResponsiveFontSize() }}
    />
  );

  const accionesTemplate = (rowData) => (
    <div style={{ display: "flex", gap: "0.5rem" }}>
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

  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
      <h3 style={{ margin: 0 }}>Documentos Requeridos de Ventas</h3>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <Dropdown
          value={filtroPais}
          options={paises.map((p) => ({ label: p.nombre, value: p.id }))}
          onChange={(e) => setFiltroPais(e.value)}
          placeholder="Filtrar por País"
          showClear
          style={{ width: "200px" }}
        />
        <Dropdown
          value={filtroTipoProducto}
          options={tiposProducto.map((t) => ({ label: t.nombre, value: t.id }))}
          onChange={(e) => setFiltroTipoProducto(e.value)}
          placeholder="Filtrar por Tipo Producto"
          showClear
          style={{ width: "200px" }}
        />
        <Dropdown
          value={filtroActivo}
          options={[
            { label: "Activos", value: true },
            { label: "Inactivos", value: false },
          ]}
          onChange={(e) => setFiltroActivo(e.value)}
          placeholder="Filtrar por Estado"
          showClear
          style={{ width: "150px" }}
        />
        {(filtroPais || filtroTipoProducto || filtroActivo !== null) && (
          <Button
            label="Limpiar"
            icon="pi pi-filter-slash"
            className="p-button-outlined"
            onClick={limpiarFiltros}
          />
        )}
        <Button
          label="Nuevo"
          icon="pi pi-plus"
          onClick={handleNuevo}
          disabled={!permisos.puedeCrear}
        />
      </div>
    </div>
  );

  return (
    <div className="card">
      <Toast ref={toast} />
      <ConfirmDialog />

      <DataTable
        value={documentosFiltrados}
        loading={loading}
        header={header}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        dataKey="id"
        filterDisplay="row"
        globalFilter={globalFilter}
        emptyMessage="No se encontraron documentos"
        onRowClick={(e) => handleEditar(e.data)}
        rowHover
        style={{ cursor: "pointer" }}
        responsiveLayout="scroll"
      >
        <Column field="nombre" header="Nombre" sortable filter filterPlaceholder="Buscar por nombre" />
        <Column field="descripcion" header="Descripción" sortable />
        <Column field="esObligatorio" header="Obligatorio" body={(row) => row.esObligatorio ? "Sí" : "No"} sortable />
        <Column header="Estado" body={activoTemplate} sortable />
        <Column body={accionesTemplate} header="Acciones" style={{ width: "120px" }} />
      </DataTable>

      <Dialog
        visible={dialogVisible}
        style={{ width: "90vw", maxWidth: "800px" }}
        header={modoEdicion ? "Editar Documento Requerido" : "Nuevo Documento Requerido"}
        modal
        onHide={handleFormCancel}
      >
        <DocRequeridaVentasForm
          documentoInicial={documentoSeleccionado}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          toast={toast}
        />
      </Dialog>
    </div>
  );
};

export default DocRequeridaVentas;