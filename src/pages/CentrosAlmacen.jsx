import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";
import CentrosAlmacenForm from "../components/centrosAlmacen/CentrosAlmacenForm";
import {
  getCentrosAlmacen,
  crearCentroAlmacen,
  actualizarCentroAlmacen,
  eliminarCentroAlmacen,
} from "../api/centrosAlmacen";
import { getEntidadesComerciales } from "../api/entidadComercial";
import { getEmpresas } from "../api/empresa";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Página CRUD para CentrosAlmacen
 * Cumple la regla transversal ERP Megui.
 * Documentado en español.
 */
export default function CentrosAlmacen() {
  const { user } = useAuthStore();
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [filtroExterno, setFiltroExterno] = useState('todos'); // 'todos', 'si', 'no'
  const [filtroPropio, setFiltroPropio] = useState('todos'); // 'todos', 'si', 'no'
  const [filtroProduccion, setFiltroProduccion] = useState('todos'); // 'todos', 'si', 'no'
  const [filtroActivo, setFiltroActivo] = useState('todos'); // 'todos', 'si', 'no'

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [centrosData, proveedoresData, empresasData] = await Promise.all([
        getCentrosAlmacen(),
        getEntidadesComerciales(),
        getEmpresas(),
      ]);
      setItems(centrosData);
      setProveedores(proveedoresData);
      setEmpresas(empresasData);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los datos.",
      });
    }
    setLoading(false);
  };

  const handleNew = () => {
    if (!empresaSeleccionada) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar una empresa primero.",
      });
      return;
    }
    setEditing(null);
    setShowDialog(true);
  };

  // Filtrar centros de almacén por todos los criterios
  const centrosFiltrados = React.useMemo(() => {
    let filtrados = items;
    
    // Filtrar por empresa
    if (empresaSeleccionada) {
      filtrados = filtrados.filter(centro => {
        return Number(centro.empresaId) === Number(empresaSeleccionada);
      });
    }
    
    // Filtrar por proveedor (entidad comercial)
    if (proveedorSeleccionado) {
      filtrados = filtrados.filter(centro => {
        return Number(centro.entidadComercialId) === Number(proveedorSeleccionado);
      });
    }
    
    // Filtrar por centro externo
    if (filtroExterno !== 'todos') {
      filtrados = filtrados.filter(centro => {
        return filtroExterno === 'si' ? centro.esCentroExterno === true : centro.esCentroExterno === false;
      });
    }
    
    // Filtrar por centro propio sede
    if (filtroPropio !== 'todos') {
      filtrados = filtrados.filter(centro => {
        return filtroPropio === 'si' ? centro.esCentroPropioSede === true : centro.esCentroPropioSede === false;
      });
    }
    
    // Filtrar por centro producción
    if (filtroProduccion !== 'todos') {
      filtrados = filtrados.filter(centro => {
        return filtroProduccion === 'si' ? centro.esCentroProduccion === true : centro.esCentroProduccion === false;
      });
    }
    
    // Filtrar por activo
    if (filtroActivo !== 'todos') {
      filtrados = filtrados.filter(centro => {
        return filtroActivo === 'si' ? centro.activo === true : centro.activo === false;
      });
    }
    
    return filtrados;
  }, [items, empresaSeleccionada, proveedorSeleccionado, filtroExterno, filtroPropio, filtroProduccion, filtroActivo]);

  const limpiarFiltros = () => {
    setEmpresaSeleccionada(null);
    setProveedorSeleccionado(null);
    setFiltroExterno('todos');
    setFiltroPropio('todos');
    setFiltroProduccion('todos');
    setFiltroActivo('todos');
  };

  const handleEdit = (rowData) => {
    // Establecer automáticamente la empresa del centro
    if (rowData.empresaId) {
      setEmpresaSeleccionada(rowData.empresaId);
    }
    setEditing(rowData);
    setShowDialog(true);
  };

  const handleFormSubmit = async (data) => {
    setLoading(true);
    try {
      if (editing) {
        await actualizarCentroAlmacen(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Centro de Almacén actualizado correctamente.",
        });
      } else {
        await crearCentroAlmacen(data);
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Centro de Almacén creado correctamente.",
        });
      }
      setShowDialog(false);
      cargarDatos();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.mensaje ||
          err.response?.data?.message ||
          "Error al guardar.",
      });
    }
    setLoading(false);
  };

  const handleDelete = (rowData) => {
    // Validar permisos
    const canDelete = user?.rol === "superusuario" || user?.rol === "admin";

    if (!canDelete) {
      toast.current.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail:
          "No tiene permisos para eliminar registros. Solo superusuarios y administradores pueden realizar esta acción.",
      });
      return;
    }

    confirmDialog({
      message: `¿Está seguro de eliminar el centro "${rowData.nombre}"?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí",
      rejectLabel: "No",
      accept: async () => {
        try {
          await eliminarCentroAlmacen(rowData.id);
          toast.current.show({
            severity: "success",
            summary: "Éxito",
            detail: "Centro de Almacén eliminado correctamente.",
          });
          cargarDatos();
        } catch (err) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail:
              err.response?.data?.mensaje ||
              err.response?.data?.message ||
              "Error al eliminar.",
          });
        }
      },
    });
  };

  const booleanTemplate = (rowData, field) => {
    return rowData[field] ? (
      <i className="pi pi-check" style={{ color: "green" }} />
    ) : (
      <i className="pi pi-times" style={{ color: "red" }} />
    );
  };

  const proveedorTemplate = (rowData) => {
    if (!rowData.proveedorId) return "-";
    const proveedor = proveedores.find(
      (p) => Number(p.id) === Number(rowData.proveedorId)
    );
    return proveedor ? proveedor.razonSocial : "-";
  };

  const actionBody = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(rowData);
          }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-text"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(rowData);
          }}
        />
      </div>
    );
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <ConfirmDialog />
      <DataTable
        value={centrosFiltrados}
        loading={loading}
        dataKey="id"
        paginator
        rows={10}
        onRowClick={(e) => handleEdit(e.data)}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
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
                <h1>Centros de Almacén</h1>
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
              <div style={{ flex: 1 }}>
                <Button
                  label="Nuevo"
                  icon="pi pi-plus"
                  onClick={handleNew}
                  disabled={!empresaSeleccionada}
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
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="proveedorFilter"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Proveedor:
                </label>
                <Dropdown
                  id="proveedorFilter"
                  value={proveedorSeleccionado}
                  options={proveedores}
                  onChange={(e) => setProveedorSeleccionado(e.value)}
                  optionLabel="razonSocial"
                  optionValue="id"
                  placeholder="Todos"
                  filter
                  showClear
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Centro Externo:
                </label>
                <Button
                  label={
                    filtroExterno === 'todos' ? 'Todos' :
                    filtroExterno === 'si' ? 'Sí' :
                    'No'
                  }
                  icon={
                    filtroExterno === 'todos' ? 'pi pi-list' :
                    filtroExterno === 'si' ? 'pi pi-check' :
                    'pi pi-times'
                  }
                  className={
                    filtroExterno === 'todos' ? 'p-button-secondary' :
                    filtroExterno === 'si' ? 'p-button-success' :
                    'p-button-danger'
                  }
                  onClick={() => {
                    if (filtroExterno === 'todos') setFiltroExterno('si');
                    else if (filtroExterno === 'si') setFiltroExterno('no');
                    else setFiltroExterno('todos');
                  }}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Centro Propio Sede:
                </label>
                <Button
                  label={
                    filtroPropio === 'todos' ? 'Todos' :
                    filtroPropio === 'si' ? 'Sí' :
                    'No'
                  }
                  icon={
                    filtroPropio === 'todos' ? 'pi pi-list' :
                    filtroPropio === 'si' ? 'pi pi-check' :
                    'pi pi-times'
                  }
                  className={
                    filtroPropio === 'todos' ? 'p-button-secondary' :
                    filtroPropio === 'si' ? 'p-button-success' :
                    'p-button-danger'
                  }
                  onClick={() => {
                    if (filtroPropio === 'todos') setFiltroPropio('si');
                    else if (filtroPropio === 'si') setFiltroPropio('no');
                    else setFiltroPropio('todos');
                  }}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Centro Producción:
                </label>
                <Button
                  label={
                    filtroProduccion === 'todos' ? 'Todos' :
                    filtroProduccion === 'si' ? 'Sí' :
                    'No'
                  }
                  icon={
                    filtroProduccion === 'todos' ? 'pi pi-list' :
                    filtroProduccion === 'si' ? 'pi pi-check' :
                    'pi pi-times'
                  }
                  className={
                    filtroProduccion === 'todos' ? 'p-button-secondary' :
                    filtroProduccion === 'si' ? 'p-button-success' :
                    'p-button-danger'
                  }
                  onClick={() => {
                    if (filtroProduccion === 'todos') setFiltroProduccion('si');
                    else if (filtroProduccion === 'si') setFiltroProduccion('no');
                    else setFiltroProduccion('todos');
                  }}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Activo:
                </label>
                <Button
                  label={
                    filtroActivo === 'todos' ? 'Todos' :
                    filtroActivo === 'si' ? 'Activos' :
                    'Inactivos'
                  }
                  icon={
                    filtroActivo === 'todos' ? 'pi pi-list' :
                    filtroActivo === 'si' ? 'pi pi-check' :
                    'pi pi-times'
                  }
                  className={
                    filtroActivo === 'todos' ? 'p-button-secondary' :
                    filtroActivo === 'si' ? 'p-button-success' :
                    'p-button-danger'
                  }
                  onClick={() => {
                    if (filtroActivo === 'todos') setFiltroActivo('si');
                    else if (filtroActivo === 'si') setFiltroActivo('no');
                    else setFiltroActivo('todos');
                  }}
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="nombre" header="Nombre" />
        <Column field="descripcion" header="Descripción" />
        <Column body={proveedorTemplate} header="Proveedor" />
        <Column
          field="esCentroExterno"
          header="Centro Externo"
          body={(rowData) => booleanTemplate(rowData, "esCentroExterno")}
        />
        <Column
          field="esCentroPropioSede"
          header="Centro Propio Sede"
          body={(rowData) => booleanTemplate(rowData, "esCentroPropioSede")}
        />
        <Column
          field="esCentroProduccion"
          header="Centro Producción"
          body={(rowData) => booleanTemplate(rowData, "esCentroProduccion")}
        />
        <Column
          field="activo"
          header="Activo"
          body={(rowData) => booleanTemplate(rowData, "activo")}
        />
        <Column
          body={actionBody}
          header="Acciones"
          style={{ width: 130, textAlign: "center" }}
        />
      </DataTable>
      <Dialog
        header={
          editing ? "Editar Centro de Almacén" : "Nuevo Centro de Almacén"
        }
        visible={showDialog}
        style={{ width: 700 }}
        onHide={() => setShowDialog(false)}
        modal
      >
        <CentrosAlmacenForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          proveedores={proveedores}
          empresas={empresas}
          empresaId={empresaSeleccionada}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
