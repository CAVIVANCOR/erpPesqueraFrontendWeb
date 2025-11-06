/**
 * Pantalla CRUD para gestión de Costos de Exportación por Incoterm
 *
 * Características implementadas:
 * - Edición profesional por clic en fila (abre modal de edición)
 * - Botón eliminar visible solo para superusuario/admin
 * - Confirmación de borrado con ConfirmDialog visual rojo
 * - Feedback visual con Toast para éxito/error
 * - Filtros profesionales por Incoterm y Responsable
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
import {
  getCostosExportacionPorIncoterm,
  eliminarCostoExportacionPorIncoterm,
} from "../api/costoExportacionPorIncoterm";
import { getIncoterms } from "../api/incoterm";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { Navigate } from "react-router-dom";
import CostoExportacionPorIncotermForm from "../components/costoExportacionPorIncoterm/CostoExportacionPorIncotermForm";
import { getResponsiveFontSize } from "../utils/utils";

const CostoExportacionPorIncoterm = ({ ruta }) => {
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const [costos, setCostos] = useState([]);
  const [costosFiltrados, setCostosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [costoSeleccionado, setCostoSeleccionado] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Estados para filtros
  const [incoterms, setIncoterms] = useState([]);
  const [filtroIncoterm, setFiltroIncoterm] = useState(null);
  const [filtroResponsable, setFiltroResponsable] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");

  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [costos, filtroIncoterm, filtroResponsable]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const [dataCostos, dataIncoterms] = await Promise.all([
        getCostosExportacionPorIncoterm(),
        getIncoterms(),
      ]);

      setCostos(dataCostos);
      setCostosFiltrados(dataCostos);
      setIncoterms(dataIncoterms);
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

  const cargarCostos = async () => {
    try {
      setLoading(true);
      const data = await getCostosExportacionPorIncoterm();
      setCostos(data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar costos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...costos];

    if (filtroIncoterm !== null) {
      resultado = resultado.filter(
        (c) => Number(c.incotermId) === Number(filtroIncoterm)
      );
    }

    if (filtroResponsable !== null) {
      resultado = resultado.filter(
        (c) => c.esCargoVendedor === filtroResponsable
      );
    }

    setCostosFiltrados(resultado);
  };

  const limpiarFiltros = () => {
    setFiltroIncoterm(null);
    setFiltroResponsable(null);
    setGlobalFilter("");
  };

  const handleNuevo = () => {
    setCostoSeleccionado(null);
    setModoEdicion(false);
    setDialogVisible(true);
  };

  const handleEditar = (rowData) => {
    setCostoSeleccionado(rowData);
    setModoEdicion(true);
    setDialogVisible(true);
  };

  const handleEliminar = (rowData) => {
    const incotermNombre = rowData.incoterm?.codigo || "N/A";
    const productoNombre = rowData.producto?.nombre || "N/A";

    confirmDialog({
      message: `¿Está seguro de eliminar el costo "${productoNombre}" para ${incotermNombre}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          setLoading(true);
          await eliminarCostoExportacionPorIncoterm(rowData.id);
          toast.current.show({
            severity: "success",
            summary: "Eliminado",
            detail: "Costo eliminado correctamente",
            life: 3000,
          });
          cargarCostos();
        } catch (error) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail:
              error.response?.data?.message || "Error al eliminar costo",
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
    cargarCostos();
  };

  const handleFormCancel = () => {
    setDialogVisible(false);
  };

  // Templates
  const responsableTemplate = (rowData) => (
    <Tag
      value={rowData.esCargoVendedor ? "VENDEDOR" : "COMPRADOR"}
      severity={rowData.esCargoVendedor ? "warning" : "success"}
      style={{ fontSize: getResponsiveFontSize() }}
    />
  );

  const aplicaTemplate = (rowData) => (
    <Tag
      value={rowData.aplicaSiempre ? "SIEMPRE" : "CONDICIONAL"}
      severity={rowData.aplicaSiempre ? "info" : "secondary"}
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
      <h3 style={{ margin: 0 }}>Costos de Exportación por Incoterm</h3>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <Dropdown
          value={filtroIncoterm}
          options={incoterms.map((i) => ({ label: `${i.codigo} - ${i.nombre}`, value: i.id }))}
          onChange={(e) => setFiltroIncoterm(e.value)}
          placeholder="Filtrar por Incoterm"
          showClear
          style={{ width: "250px" }}
        />
        <Dropdown
          value={filtroResponsable}
          options={[
            { label: "Vendedor", value: true },
            { label: "Comprador", value: false },
          ]}
          onChange={(e) => setFiltroResponsable(e.value)}
          placeholder="Filtrar por Responsable"
          showClear
          style={{ width: "200px" }}
        />
        {(filtroIncoterm || filtroResponsable !== null) && (
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
        value={costosFiltrados}
        loading={loading}
        header={header}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        dataKey="id"
        filterDisplay="row"
        globalFilter={globalFilter}
        emptyMessage="No se encontraron costos"
        onRowClick={(e) => handleEditar(e.data)}
        rowHover
        style={{ cursor: "pointer" }}
        responsiveLayout="scroll"
      >
        <Column 
          field="incoterm.codigo" 
          header="Incoterm" 
          sortable 
          filter 
          filterPlaceholder="Buscar por incoterm" 
        />
        <Column 
          field="producto.nombre" 
          header="Costo (Producto)" 
          sortable 
          filter 
          filterPlaceholder="Buscar por producto" 
        />
        <Column header="Responsable" body={responsableTemplate} sortable />
        <Column header="Aplicación" body={aplicaTemplate} sortable />
        <Column field="observaciones" header="Observaciones" />
        <Column body={accionesTemplate} header="Acciones" style={{ width: "120px" }} />
      </DataTable>

      <Dialog
        visible={dialogVisible}
        style={{ width: "90vw", maxWidth: "700px" }}
        header={modoEdicion ? "Editar Costo de Exportación" : "Nuevo Costo de Exportación"}
        modal
        onHide={handleFormCancel}
      >
        <CostoExportacionPorIncotermForm
          costoInicial={costoSeleccionado}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          toast={toast}
        />
      </Dialog>
    </div>
  );
};

export default CostoExportacionPorIncoterm;