// src/pages/ConceptoMovAlmacen.jsx
// Pantalla CRUD profesional para ConceptoMovAlmacen. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import ConceptoMovAlmacenForm from "../components/conceptoMovAlmacen/ConceptoMovAlmacenForm";
import {
  getConceptosMovAlmacen,
  crearConceptoMovAlmacen,
  actualizarConceptoMovAlmacen,
  eliminarConceptoMovAlmacen,
} from "../api/conceptoMovAlmacen";
import { getTiposConcepto } from "../api/tipoConcepto";
import { getTiposMovimientoAlmacen } from "../api/tipoMovimientoAlmacen";
import { getTiposAlmacen } from "../api/tipoAlmacen";
import { getAlmacenes } from "../api/almacen";
import { getEmpresas } from "../api/empresa";
import { getEntidadesComerciales } from "../api/entidadComercial";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Pantalla profesional para gestión de Conceptos de Movimiento de Almacén.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function ConceptoMovAlmacen() {
  const { user } = useAuthStore();
  const permisos = usePermissions("ConceptoMovAlmacen");
  const toast = useRef(null);
  const readOnly = !permisos.puedeEditar && !permisos.puedeCrear;
  const [items, setItems] = useState([]);
  const [tiposConcepto, setTiposConcepto] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [tiposAlmacen, setTiposAlmacen] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [tipoConceptoSeleccionado, setTipoConceptoSeleccionado] = useState(null);
  const [tipoMovimientoSeleccionado, setTipoMovimientoSeleccionado] = useState(null);
  const [tipoAlmacenSeleccionado, setTipoAlmacenSeleccionado] = useState(null);
  const [almacenOrigenSeleccionado, setAlmacenOrigenSeleccionado] = useState(null);
  const [almacenDestinoSeleccionado, setAlmacenDestinoSeleccionado] = useState(null);
  const [filtroCustodia, setFiltroCustodia] = useState('todos'); // 'todos', 'si', 'no'
  const [filtroActivo, setFiltroActivo] = useState('todos'); // 'todos', 'si', 'no'

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [
        conceptosData,
        tiposConceptoData,
        tiposMovimientoData,
        tiposAlmacenData,
        almacenesData,
        empresasData,
        entidadesData,
      ] = await Promise.all([
        getConceptosMovAlmacen(),
        getTiposConcepto(),
        getTiposMovimientoAlmacen(),
        getTiposAlmacen(),
        getAlmacenes(),
        getEmpresas(),
        getEntidadesComerciales(),
      ]);
      setItems(conceptosData);
      setTiposConcepto(tiposConceptoData);
      setTiposMovimiento(tiposMovimientoData);
      setTiposAlmacen(tiposAlmacenData);
      setAlmacenes(almacenesData);
      setEmpresas(empresasData);
      setEntidadesComerciales(entidadesData);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los datos.",
      });
    }
    setLoading(false);
  };

  // Filtrar almacenes por empresa seleccionada
  const almacenesFiltrados = React.useMemo(() => {
    if (!empresaSeleccionada) return almacenes;
    return almacenes.filter(almacen => {
      return almacen.centroAlmacen && Number(almacen.centroAlmacen.empresaId) === Number(empresaSeleccionada);
    });
  }, [almacenes, empresaSeleccionada]);

  // Filtrar conceptos por todos los criterios
  const conceptosFiltrados = React.useMemo(() => {
    let filtrados = items;
    
    // Filtrar por empresa
    if (empresaSeleccionada) {
      filtrados = filtrados.filter(concepto => {
        // Verificar si el almacén origen pertenece a la empresa
        if (concepto.almacenOrigenId) {
          const almacen = almacenes.find(a => Number(a.id) === Number(concepto.almacenOrigenId));
          if (almacen && almacen.centroAlmacen && Number(almacen.centroAlmacen.empresaId) === Number(empresaSeleccionada)) {
            return true;
          }
        }
        
        // Verificar si el almacén destino pertenece a la empresa
        if (concepto.almacenDestinoId) {
          const almacen = almacenes.find(a => Number(a.id) === Number(concepto.almacenDestinoId));
          if (almacen && almacen.centroAlmacen && Number(almacen.centroAlmacen.empresaId) === Number(empresaSeleccionada)) {
            return true;
          }
        }
        
        return false;
      });
    }
    
    // Filtrar por tipo de concepto
    if (tipoConceptoSeleccionado) {
      filtrados = filtrados.filter(concepto => {
        return Number(concepto.tipoConceptoId) === Number(tipoConceptoSeleccionado);
      });
    }
    
    // Filtrar por tipo de movimiento
    if (tipoMovimientoSeleccionado) {
      filtrados = filtrados.filter(concepto => {
        return Number(concepto.tipoMovimientoId) === Number(tipoMovimientoSeleccionado);
      });
    }
    
    // Filtrar por tipo de almacén
    if (tipoAlmacenSeleccionado) {
      filtrados = filtrados.filter(concepto => {
        return Number(concepto.tipoAlmacenId) === Number(tipoAlmacenSeleccionado);
      });
    }
    
    // Filtrar por almacén origen
    if (almacenOrigenSeleccionado) {
      filtrados = filtrados.filter(concepto => {
        return Number(concepto.almacenOrigenId) === Number(almacenOrigenSeleccionado);
      });
    }
    
    // Filtrar por almacén destino
    if (almacenDestinoSeleccionado) {
      filtrados = filtrados.filter(concepto => {
        return Number(concepto.almacenDestinoId) === Number(almacenDestinoSeleccionado);
      });
    }
    
    // Filtrar por custodia
    if (filtroCustodia !== 'todos') {
      filtrados = filtrados.filter(concepto => {
        return filtroCustodia === 'si' ? concepto.esCustodia === true : concepto.esCustodia === false;
      });
    }
    
    // Filtrar por activo
    if (filtroActivo !== 'todos') {
      filtrados = filtrados.filter(concepto => {
        return filtroActivo === 'si' ? concepto.activo === true : concepto.activo === false;
      });
    }
    
    return filtrados;
  }, [items, almacenes, empresaSeleccionada, tipoConceptoSeleccionado, tipoMovimientoSeleccionado, tipoAlmacenSeleccionado, almacenOrigenSeleccionado, almacenDestinoSeleccionado, filtroCustodia, filtroActivo]);

  const limpiarFiltros = () => {
    setEmpresaSeleccionada(null);
    setTipoConceptoSeleccionado(null);
    setTipoMovimientoSeleccionado(null);
    setTipoAlmacenSeleccionado(null);
    setAlmacenOrigenSeleccionado(null);
    setAlmacenDestinoSeleccionado(null);
    setFiltroCustodia('todos');
    setFiltroActivo('todos');
  };

  const handleEdit = (rowData) => {
    // Detectar automáticamente la empresa del almacén origen o destino
    let empresaId = null;
    if (rowData.almacenOrigenId) {
      const almacen = almacenes.find(a => Number(a.id) === Number(rowData.almacenOrigenId));
      if (almacen && almacen.centroAlmacen) {
        empresaId = almacen.centroAlmacen.empresaId;
      }
    }
    if (!empresaId && rowData.almacenDestinoId) {
      const almacen = almacenes.find(a => Number(a.id) === Number(rowData.almacenDestinoId));
      if (almacen && almacen.centroAlmacen) {
        empresaId = almacen.centroAlmacen.empresaId;
      }
    }
    if (empresaId) {
      setEmpresaSeleccionada(empresaId);
    }
    setEditing(rowData);
    setShowDialog(true);
  };

  const handleDelete = async (rowData) => {
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

    // Usar confirmDialog de PrimeReact
    const { confirmDialog } = await import("primereact/confirmdialog");
    confirmDialog({
      message: `¿Está seguro de eliminar el concepto "${rowData.descripcion}"?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí",
      rejectLabel: "No",
      accept: async () => {
        setLoading(true);
        try {
          await eliminarConceptoMovAlmacen(rowData.id);
          toast.current.show({
            severity: "success",
            summary: "Éxito",
            detail: "Concepto de movimiento eliminado correctamente.",
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
        setLoading(false);
      },
    });
  };

  const handleFormSubmit = async (data) => {
    setLoading(true);
    try {
      if (editing && editing.id) {
        await actualizarConceptoMovAlmacen(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Concepto de movimiento actualizado.",
        });
      } else {
        await crearConceptoMovAlmacen(data);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: "Concepto de movimiento creado.",
        });
      }
      setShowDialog(false);
      setEditing(null);
      cargarDatos();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.mensaje ||
          err.response?.data?.message ||
          "No se pudo guardar.",
      });
    }
    setLoading(false);
  };

  const handleAdd = () => {
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

  const tipoConceptoNombre = (rowData) => {
    const tipo = tiposConcepto.find(
      (t) => Number(t.id) === Number(rowData.tipoConceptoId)
    );
    return tipo ? tipo.nombre : "-";
  };

  const tipoMovimientoNombre = (rowData) => {
    const tipo = tiposMovimiento.find(
      (t) => Number(t.id) === Number(rowData.tipoMovimientoId)
    );
    return tipo ? tipo.nombre : "-";
  };

  const tipoAlmacenNombre = (rowData) => {
    const tipo = tiposAlmacen.find(
      (t) => Number(t.id) === Number(rowData.tipoAlmacenId)
    );
    return tipo ? tipo.nombre : "-";
  };

  const almacenOrigenNombre = (rowData) => {
    if (!rowData.almacenOrigenId) return "-";
    const almacen = almacenes.find(
      (a) => Number(a.id) === Number(rowData.almacenOrigenId)
    );
    return almacen ? almacen.nombre : "-";
  };

  const almacenDestinoNombre = (rowData) => {
    if (!rowData.almacenDestinoId) return "-";
    const almacen = almacenes.find(
      (a) => Number(a.id) === Number(rowData.almacenDestinoId)
    );
    return almacen ? almacen.nombre : "-";
  };

  const booleanTemplate = (rowData, field) => {
    return rowData[field] ? (
      <i className="pi pi-check" style={{ color: "green" }} />
    ) : (
      <i className="pi pi-times" style={{ color: "red" }} />
    );
  };

  const actionBody = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.1rem", justifyContent: "center" }}>
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
        value={conceptosFiltrados}
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
                alignItems: "center",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <h1>Conceptos de Movimiento de Almacén</h1>
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
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <Button
                  label="Nuevo"
                  icon="pi pi-plus"
                  onClick={handleAdd}
                  disabled={!empresaSeleccionada || !permisos.puedeCrear}
                  style={{ marginTop: "1.8rem" }}
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
                  htmlFor="tipoConceptoFilter"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Tipo Concepto:
                </label>
                <Dropdown
                  id="tipoConceptoFilter"
                  value={tipoConceptoSeleccionado}
                  options={tiposConcepto}
                  onChange={(e) => setTipoConceptoSeleccionado(e.value)}
                  optionLabel="nombre"
                  optionValue="id"
                  placeholder="Todos"
                  filter
                  showClear
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="tipoMovimientoFilter"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Tipo Movimiento:
                </label>
                <Dropdown
                  id="tipoMovimientoFilter"
                  value={tipoMovimientoSeleccionado}
                  options={tiposMovimiento}
                  onChange={(e) => setTipoMovimientoSeleccionado(e.value)}
                  optionLabel="nombre"
                  optionValue="id"
                  placeholder="Todos"
                  filter
                  showClear
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="tipoAlmacenFilter"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Tipo Almacén:
                </label>
                <Dropdown
                  id="tipoAlmacenFilter"
                  value={tipoAlmacenSeleccionado}
                  options={tiposAlmacen}
                  onChange={(e) => setTipoAlmacenSeleccionado(e.value)}
                  optionLabel="nombre"
                  optionValue="id"
                  placeholder="Todos"
                  filter
                  showClear
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="almacenOrigenFilter"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Almacén Origen:
                </label>
                <Dropdown
                  id="almacenOrigenFilter"
                  value={almacenOrigenSeleccionado}
                  options={almacenesFiltrados}
                  onChange={(e) => setAlmacenOrigenSeleccionado(e.value)}
                  optionLabel="nombre"
                  optionValue="id"
                  placeholder="Todos"
                  filter
                  showClear
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="almacenDestinoFilter"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Almacén Destino:
                </label>
                <Dropdown
                  id="almacenDestinoFilter"
                  value={almacenDestinoSeleccionado}
                  options={almacenesFiltrados}
                  onChange={(e) => setAlmacenDestinoSeleccionado(e.value)}
                  optionLabel="nombre"
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
                  Custodia:
                </label>
                <Button
                  label={
                    filtroCustodia === 'todos' ? 'Todos' :
                    filtroCustodia === 'si' ? 'Sí' :
                    'No'
                  }
                  icon={
                    filtroCustodia === 'todos' ? 'pi pi-list' :
                    filtroCustodia === 'si' ? 'pi pi-check' :
                    'pi pi-times'
                  }
                  className={
                    filtroCustodia === 'todos' ? 'p-button-secondary' :
                    filtroCustodia === 'si' ? 'p-button-success' :
                    'p-button-danger'
                  }
                  onClick={() => {
                    if (filtroCustodia === 'todos') setFiltroCustodia('si');
                    else if (filtroCustodia === 'si') setFiltroCustodia('no');
                    else setFiltroCustodia('todos');
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
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
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
      >
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column
          field="descripcionArmada"
          header="Descripción Armada"
          style={{ minWidth: "200px" }}
        />
        <Column
          field="tipoConceptoId"
          header="Tipo Concepto"
          body={tipoConceptoNombre}
        />
        <Column
          field="tipoMovimientoId"
          header="Tipo Movimiento"
          body={tipoMovimientoNombre}
        />
        <Column
          field="tipoAlmacenId"
          header="Tipo Almacén"
          body={tipoAlmacenNombre}
        />
        <Column
          field="almacenOrigenId"
          header="Almacén Origen"
          body={almacenOrigenNombre}
        />
        <Column
          field="llevaKardexOrigen"
          header="Kardex Origen"
          body={(rowData) => booleanTemplate(rowData, "llevaKardexOrigen")}
          style={{ width: 80, textAlign: "center" }}
        />
        <Column
          field="almacenDestinoId"
          header="Almacén Destino"
          body={almacenDestinoNombre}
        />
        <Column
          field="llevaKardexDestino"
          header="Kardex Destino"
          body={(rowData) => booleanTemplate(rowData, "llevaKardexDestino")}
          style={{ width: 80, textAlign: "center" }}
        />
        <Column
          field="esCustodia"
          header="Custodia"
          body={(rowData) => booleanTemplate(rowData, "esCustodia")}
          style={{ width: 80, textAlign: "center" }}
        />
        <Column
          body={actionBody}
          header="Acciones"
          style={{ width: 100, textAlign: "center" }}
        />
      </DataTable>
      <Dialog
        header={
          editing
            ? "Editar Concepto de Movimiento"
            : "Nuevo Concepto de Movimiento"
        }
        visible={showDialog}
        style={{ width: 700 }}
        onHide={() => setShowDialog(false)}
        modal
      >
        <ConceptoMovAlmacenForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          tiposConcepto={tiposConcepto}
          tiposMovimiento={tiposMovimiento}
          tiposAlmacen={tiposAlmacen}
          almacenes={almacenes}
          empresaId={empresaSeleccionada}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
          readOnly={readOnly}
        />
      </Dialog>
    </div>
  );
}
