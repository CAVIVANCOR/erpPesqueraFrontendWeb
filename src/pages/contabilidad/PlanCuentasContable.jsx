// src/pages/contabilidad/PlanCuentasContable.jsx
import React, { useRef, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { TreeTable } from "primereact/treetable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import PlanCuentasContableForm from "../../components/contabilidad/PlanCuentasContableForm";
import {
  getPlanCuentasContable,
  deletePlanCuentasContable,
  getPlanCuentasContableById,
} from "../../api/contabilidad/planCuentasContable";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { usePermissions } from "../../hooks/usePermissions";
import { getResponsiveFontSize } from "../../utils/utils";

export default function PlanCuentasContable({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [nivelEnumFilter, setNivelEnumFilter] = useState(null);
  const [naturalezaFilter, setNaturalezaFilter] = useState(null);
  const [tipoCuentaFilter, setTipoCuentaFilter] = useState(null);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [treeNodes, setTreeNodes] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState({});

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    filtrarItems();
  }, [items, nivelEnumFilter, naturalezaFilter, tipoCuentaFilter, globalFilter]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const cuentasData = await getPlanCuentasContable();
      setItems(cuentasData);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los datos.",
        life: 3000,
      });
    }
    setLoading(false);
  };


  const construirArbolJerarquico = (cuentas) => {
    const cuentasMap = new Map();
    const raices = [];

    cuentas.forEach(cuenta => {
      cuentasMap.set(cuenta.id, {
        key: cuenta.id.toString(),
        data: cuenta,
        children: []
      });
    });

    cuentas.forEach(cuenta => {
      const nodo = cuentasMap.get(cuenta.id);
      if (cuenta.cuentaPadreId) {
        const padre = cuentasMap.get(cuenta.cuentaPadreId);
        if (padre) {
          padre.children.push(nodo);
        } else {
          raices.push(nodo);
        }
      } else {
        raices.push(nodo);
      }
    });

    raices.sort((a, b) => {
      const codigoA = a.data.codigoCuenta || '';
      const codigoB = b.data.codigoCuenta || '';
      return codigoA.localeCompare(codigoB, undefined, { numeric: true });
    });

    const ordenarHijos = (nodo) => {
      if (nodo.children && nodo.children.length > 0) {
        nodo.children.sort((a, b) => {
          const codigoA = a.data.codigoCuenta || '';
          const codigoB = b.data.codigoCuenta || '';
          return codigoA.localeCompare(codigoB, undefined, { numeric: true });
        });
        nodo.children.forEach(ordenarHijos);
      }
    };

    raices.forEach(ordenarHijos);
    return raices;
  };

  const filtrarItems = () => {
    let filtrados = [...items];

    if (nivelEnumFilter) {
      filtrados = filtrados.filter((item) => item.nivel === nivelEnumFilter);
    }

    if (naturalezaFilter) {
      filtrados = filtrados.filter((item) => item.naturaleza === naturalezaFilter);
    }

    if (tipoCuentaFilter) {
      filtrados = filtrados.filter((item) => item.tipoCuenta === tipoCuentaFilter);
    }

    if (globalFilter && globalFilter.trim() !== "") {
      const busqueda = globalFilter.trim().toLowerCase();
      const idsCoincidentes = new Set();

      filtrados.forEach((item) => {
        const codigo = item.codigoCuenta ? item.codigoCuenta.toLowerCase() : "";
        const nombre = item.nombreCuenta ? item.nombreCuenta.toLowerCase() : "";
        const descripcion = item.descripcion ? item.descripcion.toLowerCase() : "";

        const coincide = codigo.startsWith(busqueda) ||
          nombre.includes(busqueda) ||
          descripcion.includes(busqueda);

        if (coincide) {
          idsCoincidentes.add(item.id);
          let padreId = item.cuentaPadreId;
          while (padreId) {
            idsCoincidentes.add(padreId);
            const padre = items.find(c => c.id === padreId);
            padreId = padre?.cuentaPadreId;
          }
        }
      });

      filtrados = items.filter(item => idsCoincidentes.has(item.id));
    }

    setItemsFiltrados(filtrados);
    const arbol = construirArbolJerarquico(filtrados);
    setTreeNodes(arbol);

    if (globalFilter && globalFilter.trim() !== "") {
      const keys = {};
      const expandirTodo = (nodos) => {
        nodos.forEach(nodo => {
          keys[nodo.key] = true;
          if (nodo.children) expandirTodo(nodo.children);
        });
      };
      expandirTodo(arbol);
      setExpandedKeys(keys);
    } else if (!nivelEnumFilter) {
      setExpandedKeys({});
    }
  };
  const onNew = () => {
    if (!permisos.puedeCrear) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para crear registros.",
        life: 3000,
      });
      return;
    }
    setSelected(null);
    setIsEdit(false);
    setShowDialog(true);
  };

  const onEdit = async (rowData) => {
    if (!permisos.puedeVer && !permisos.puedeEditar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para ver o editar registros.",
        life: 3000,
      });
      return;
    }

    try {
      const cuentaCompleta = await getPlanCuentasContableById(rowData.id);
      setSelected(cuentaCompleta);
      setIsEdit(true);
      setShowDialog(true);
    } catch (error) {
      console.error("Error al cargar cuenta:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar la cuenta contable",
        life: 3000,
      });
    }
  };

  const onDelete = (rowData) => {
    if (!permisos.puedeEliminar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para eliminar registros.",
        life: 3000,
      });
      return;
    }
    setConfirmState({ visible: true, row: rowData });
  };

  const handleConfirmDelete = async () => {
    const row = confirmState.row;
    if (!row) return;
    setConfirmState({ visible: false, row: null });
    setLoading(true);
    try {
      await deletePlanCuentasContable(row.id);
      toast.current?.show({
        severity: "success",
        summary: "Cuenta eliminada",
        detail: `La cuenta ${row.codigoCuenta} - ${row.nombreCuenta} fue eliminada correctamente.`,
        life: 3000,
      });
      await cargarDatos();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.message || "No se pudo eliminar la cuenta contable.",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const expandirTodo = () => {
    const keys = {};
    const expandir = (nodos) => {
      nodos.forEach(nodo => {
        keys[nodo.key] = true;
        if (nodo.children) expandir(nodo.children);
      });
    };
    expandir(treeNodes);
    setExpandedKeys(keys);
  };

  const colapsarTodo = () => {
    setExpandedKeys({});
  };
  const onCancel = () => {
    setShowDialog(false);
    setSelected(null);
    setIsEdit(false);
  };

  const onSubmit = async (data) => {
    // Validar permisos antes de guardar
    if (isEdit && !permisos.puedeEditar) {
      return;
    }
    if (!isEdit && !permisos.puedeCrear) {
      return;
    }

    setLoading(true);
    try {
      await data; // El formulario ya maneja la llamada a la API
      toast.current?.show({
        severity: "success",
        summary: isEdit ? "Cuenta actualizada" : "Cuenta creada",
        detail: isEdit
          ? "La cuenta contable fue actualizada correctamente."
          : "La cuenta contable fue creada correctamente.",
        life: 3000,
      });
      setShowDialog(false);
      setSelected(null);
      setIsEdit(false);
      cargarDatos();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar la cuenta contable.",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setGlobalFilter("");
    setNivelEnumFilter(null);
    setNaturalezaFilter(null);
    setTipoCuentaFilter(null);
  };

  const cuentaPadreNombre = (rowData) => {
    return rowData.cuentaPadre
      ? `${rowData.cuentaPadre.codigoCuenta} - ${rowData.cuentaPadre.nombreCuenta}`
      : "RAÍZ";
  };

  const nivelTemplate = (rowData) => {
    const iconos = {
      CLASE: "pi-folder",
      CUENTA: "pi-folder-open",
      SUBCUENTA: "pi-file",
      DIVISIONARIA: "pi-file-o",
      SUBDIVISIONARIA: "pi-file-edit",
    };
    const colores = {
      CLASE: "info",
      CUENTA: "success",
      SUBCUENTA: "warning",
      DIVISIONARIA: "help",
      SUBDIVISIONARIA: "danger",
    };
    return (
      <Tag
        value={rowData.nivel}
        severity={colores[rowData.nivel] || "info"}
        icon={`pi ${iconos[rowData.nivel] || 'pi-file'}`}
      />
    );
  };

  const naturalezaTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.naturaleza}
        severity={rowData.naturaleza === "DEUDORA" ? "info" : "success"}
        icon={rowData.naturaleza === "DEUDORA" ? "pi pi-arrow-up" : "pi pi-arrow-down"}
      />
    );
  };

  const codigoCuentaTemplate = (node) => {
    const coloresFondo = {
      CLASE: "#e3f2fd",
      CUENTA: "#e8f5e9",
      SUBCUENTA: "#fff3e0",
      DIVISIONARIA: "#f3e5f5",
      SUBDIVISIONARIA: "#fce4ec",
    };
    return (
      <span style={{
        fontWeight: node.data.nivel === 'CLASE' ? 'bold' : 'normal',
        fontSize: node.data.nivel === 'CLASE' ? '1.1em' : '1em',
        backgroundColor: coloresFondo[node.data.nivel] || 'transparent',
        padding: '4px 8px',
        borderRadius: '4px',
        display: 'inline-block'
      }}>
        {node.data.codigoCuenta}
      </span>
    );
  };

  const nombreCuentaTemplate = (node) => {
    return (
      <span style={{
        fontWeight: node.data.nivel === 'CLASE' ? 'bold' : 'normal',
        fontSize: node.data.nivel === 'CLASE' ? '1.05em' : '1em',
      }}>
        {node.data.nombreCuenta}
      </span>
    );
  };
  const activoTemplate = (rowData) => {
    return rowData.activo ? (
      <Tag value="SÍ" severity="success" icon="pi pi-check" />
    ) : (
      <Tag value="NO" severity="danger" icon="pi pi-times" />
    );
  };

  const actionBodyTemplate = (rowData) => (
    <div onClick={(e) => e.stopPropagation()}>
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-mr-2"
        disabled={!permisos.puedeVer && !permisos.puedeEditar}
        onClick={() => {
          if (permisos.puedeVer || permisos.puedeEditar) {
            onEdit(rowData);
          }
        }}
        tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-text p-button-danger"
        disabled={!permisos.puedeEliminar}
        onClick={() => {
          if (permisos.puedeEliminar) {
            onDelete(rowData);
          }
        }}
        tooltip="Eliminar"
      />
    </div>
  );

  return (
    <div className="p-m-4">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span style={{ color: "#b71c1c", fontWeight: 600 }}>
            ¿Está seguro que desea{" "}
            <span style={{ color: "#b71c1c" }}>eliminar</span> la cuenta{" "}
            <b>
              {confirmState.row
                ? `${confirmState.row.codigoCuenta} - ${confirmState.row.nombreCuenta}`
                : ""}
            </b>
            ?<br />
            <span style={{ fontWeight: 400, color: "#b71c1c" }}>
              Esta acción no se puede deshacer.
            </span>
          </span>
        }
        header={
          <span style={{ color: "#b71c1c" }}>Confirmar eliminación</span>
        }
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        acceptLabel="Eliminar"
        rejectLabel="Cancelar"
        accept={handleConfirmDelete}
        reject={() => setConfirmState({ visible: false, row: null })}
        style={{ minWidth: 400 }}
      />
      <TreeTable
        value={treeNodes}
        loading={loading}
        expandedKeys={expandedKeys}
        onToggle={(e) => setExpandedKeys(e.value)}
        size="small"
        stripedRows
        showGridlines
        paginator
        rows={40}
        rowsPerPageOptions={[40, 80, 160, 320]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} cuentas"
        selectionMode="single"
        selectionKeys={selected ? { [selected.id]: true } : {}}
        onSelectionChange={(e) => {
          const selectedNode = Object.keys(e.value)[0];
          if (selectedNode) {
            const findNode = (nodes) => {
              for (const node of nodes) {
                if (node.key === selectedNode) return node.data;
                if (node.children) {
                  const found = findNode(node.children);
                  if (found) return found;
                }
              }
              return null;
            };
            const data = findNode(treeNodes);
            if (data) onEdit(data);
          }
        }}
        emptyMessage="No se encontraron registros que coincidan con la búsqueda."
        style={{
          cursor: permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
        header={
          <div>
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <h2>Plan de Cuentas Contable</h2>
                <small style={{ color: "#666", fontWeight: "normal" }}>
                  Total de registros: {itemsFiltrados.length}
                </small>
              </div>
              <div style={{ flex: 0.5 }}>
                <Button
                  label="Nuevo"
                  icon="pi pi-plus"
                  className="p-button-success"
                  size="small"
                  raised
                  disabled={!permisos.puedeCrear}
                  tooltip="Nueva Cuenta Contable"
                  outlined
                  onClick={onNew}
                />
              </div>
              <div style={{ flex: 0.25 }}>
                <Button
                  icon="pi pi-refresh"
                  className="p-button-outlined p-button-info"
                  size="small"
                  onClick={async () => {
                    await cargarDatos();
                    toast.current?.show({
                      severity: "success",
                      summary: "Actualizado",
                      detail: "Datos actualizados correctamente desde el servidor",
                      life: 3000,
                    });
                  }}
                  loading={loading}
                  tooltip="Actualizar todos los datos desde el servidor"
                />
              </div>
              <div style={{ flex: 0.25 }}>
                <Button
                  icon="pi pi-filter-slash"
                  className="p-button-secondary"
                  size="small"
                  outlined
                  onClick={limpiarFiltros}
                  disabled={loading}
                  tooltip="Limpiar filtros"
                />
              </div>
              <div style={{ flex: 0.25 }}>
                <Button
                  icon="pi pi-angle-double-down"
                  className="p-button-outlined p-button-secondary"
                  size="small"
                  onClick={expandirTodo}
                  disabled={loading}
                  tooltip="Expandir todo"
                />
              </div>
              <div style={{ flex: 0.25 }}>
                <Button
                  icon="pi pi-angle-double-up"
                  className="p-button-outlined p-button-secondary"
                  size="small"
                  onClick={colapsarTodo}
                  disabled={loading}
                  tooltip="Colapsar todo"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="nivelEnumFilter">Filtrar por Nivel</label>
                <Dropdown
                  id="nivelEnumFilter"
                  value={nivelEnumFilter}
                  options={[
                    { label: "CLASE", value: "CLASE" },
                    { label: "CUENTA", value: "CUENTA" },
                    { label: "SUBCUENTA", value: "SUBCUENTA" },
                    { label: "DIVISIONARIA", value: "DIVISIONARIA" },
                    { label: "SUBDIVISIONARIA", value: "SUBDIVISIONARIA" },
                  ]}
                  onChange={(e) => setNivelEnumFilter(e.value)}
                  placeholder="Seleccionar nivel"
                  showClear
                  style={{ width: "100%" }}
                  onClear={() => setNivelEnumFilter(null)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="naturalezaFilter">Filtrar por Naturaleza</label>
                <Dropdown
                  id="naturalezaFilter"
                  value={naturalezaFilter}
                  options={[
                    { label: "Todas", value: null },
                    { label: "DEUDORA", value: "DEUDORA" },
                    { label: "ACREEDORA", value: "ACREEDORA" },
                  ]}
                  onChange={(e) => setNaturalezaFilter(e.value)}
                  placeholder="Seleccionar naturaleza"
                  showClear
                  style={{ width: "100%" }}
                  onClear={() => setNaturalezaFilter(null)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="tipoCuentaFilter">Filtrar por Tipo de Cuenta</label>
                <Dropdown
                  id="tipoCuentaFilter"
                  value={tipoCuentaFilter}
                  options={[
                    { label: "Todos", value: null },
                    { label: "ACTIVO", value: "ACTIVO" },
                    { label: "PASIVO", value: "PASIVO" },
                    { label: "PATRIMONIO", value: "PATRIMONIO" },
                    { label: "INGRESO", value: "INGRESO" },
                    { label: "GASTO", value: "GASTO" },
                  ]}
                  onChange={(e) => setTipoCuentaFilter(e.value)}
                  placeholder="Seleccionar tipo"
                  showClear
                  style={{ width: "100%" }}
                  onClear={() => setTipoCuentaFilter(null)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="globalFilter">Buscar</label>
                <span className="p-input-icon-left">
                  <InputText
                    id="globalFilter"
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Buscar por código o nombre..."
                    style={{ width: "100%" }}
                  />
                </span>
              </div>
            </div>
          </div>
        }
      >
        <Column field="codigoCuenta" header="Código" body={codigoCuentaTemplate} expander style={{ width: '200px' }} />
        <Column field="nombreCuenta" header="Nombre" body={nombreCuentaTemplate} />
        <Column field="nivel" header="Nivel" body={nivelTemplate} style={{ width: '90px' }} />
        <Column field="naturaleza" header="Naturaleza" body={naturalezaTemplate} style={{ width: '90px' }} />
        <Column
          field="esImputable"
          header="Imputable"
          body={(node) =>
            node.data.esImputable ? (
              <Tag value="SÍ" severity="success" icon="pi pi-check" />
            ) : (
              <Tag value="NO" severity="secondary" />
            )
          }
          style={{ width: '120px' }}
        />
        <Column field="activo" header="Activo" body={(node) => activoTemplate(node.data)} style={{ width: '100px' }} />
        <Column body={(node) => actionBodyTemplate(node.data)} header="Acciones" style={{ width: '150px' }} />
      </TreeTable>
      <Dialog
        header={
          isEdit
            ? permisos.puedeEditar
              ? "Editar Cuenta Contable"
              : "Ver Cuenta Contable"
            : "Nueva Cuenta Contable"
        }
        visible={showDialog}
        style={{ width: "1300px" }}
        modal
        className="p-fluid"
        onHide={onCancel}
        closeOnEscape
        dismissableMask
      >
        <PlanCuentasContableForm
          isEdit={isEdit}
          defaultValues={selected || {}}
          cuentas={items}
          onSubmit={onSubmit}
          onCancel={onCancel}
          loading={loading}
          readOnly={isEdit && !permisos.puedeEditar}
        />
      </Dialog>
    </div>
  );
}