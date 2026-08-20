// src/pages/contabilidad/PlanCuentasContable.jsx
import React, { useRef, useState, useEffect, useMemo } from "react";
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
import CentroCostoFilterSelector from "../../components/common/CentroCostoFilterSelector";

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
  const [centroCostoFilter, setCentroCostoFilter] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    filtrarItems();
  }, [items, nivelEnumFilter, naturalezaFilter, tipoCuentaFilter, centroCostoFilter, globalFilter]);

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

    if (centroCostoFilter) {
      filtrados = filtrados.filter((item) => Number(item.centroCostoId) === Number(centroCostoFilter));
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


  // Calcular centros de costo disponibles dinámicamente
  const centrosDisponibles = useMemo(() => {
    const centrosUnicos = new Set();
    itemsFiltrados.forEach(item => {
      if (item.centroCostoId) {
        centrosUnicos.add(Number(item.centroCostoId));
      }
    });
    return Array.from(centrosUnicos);
  }, [itemsFiltrados]);

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
    setCentroCostoFilter(null);
  };

  const cuentaPadreNombre = (rowData) => {
    return rowData.cuentaPadre
      ? `${rowData.cuentaPadre.codigoCuenta} - ${rowData.cuentaPadre.nombreCuenta}`
      : "RAÍZ";
  };

  const nivelTemplate = (node) => {
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
        value={node.data.nivel}
        severity={colores[node.data.nivel] || "info"}
        icon={`pi ${iconos[node.data.nivel] || 'pi-file'}`}
      />
    );
  };

  const naturalezaTemplate = (node) => {
    return (
      <Tag
        value={node.data.naturaleza}
        severity={node.data.naturaleza === "DEUDORA" ? "info" : "success"}
        icon={node.data.naturaleza === "DEUDORA" ? "pi pi-arrow-up" : "pi pi-arrow-down"}
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

  const tipoCuentaTemplate = (node) => {
    if (!node.data.tipoCuenta) return <Tag value="-" severity="secondary" />;
    const colores = {
      ACTIVO: "success",
      PASIVO: "danger",
      PATRIMONIO: "info",
      INGRESO: "warning",
      GASTO: "help"
    };
    const iconos = {
      ACTIVO: "pi-arrow-up",
      PASIVO: "pi-arrow-down",
      PATRIMONIO: "pi-wallet",
      INGRESO: "pi-plus-circle",
      GASTO: "pi-minus-circle"
    };
    return (
      <Tag
        value={node.data.tipoCuenta}
        severity={colores[node.data.tipoCuenta]}
        icon={`pi ${iconos[node.data.tipoCuenta]}`}
      />
    );
  };

  const clasificacionTemplate = (node) => {
    const tags = [];
    if (node.data.esActivoCorriente) tags.push(<Tag key="ac" value="ActivoCorriente" severity="success" style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem' }} />);
    if (node.data.esActivoNoCorriente) tags.push(<Tag key="anc" value="ActivoNOCorriente" severity="info" style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem' }} />);
    if (node.data.esPasivoCorriente) tags.push(<Tag key="pc" value="PasivoCorriente" severity="warning" style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem' }} />);
    if (node.data.esPasivoNoCorriente) tags.push(<Tag key="pnc" value="PasivoNOCorriente" severity="danger" style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem' }} />);
    return tags.length > 0 ? (
      <div style={{
        display: 'flex',
        gap: '0.25rem',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {tags}
      </div>
    ) : (
      <Tag value="-" severity="secondary" style={{ fontSize: '0.65rem' }} />
    );
  };

  const cuentaPadreTemplate = (node) => {
    return node.data.cuentaPadre ? (
      <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{node.data.cuentaPadre.codigoCuenta}</span>
    ) : (
      <Tag value="RAÍZ" severity="secondary" icon="pi pi-home" style={{ fontSize: '0.7rem' }} />
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
                <h3>Plan de Cuentas</h3>
                <small style={{ color: "#666", fontWeight: "normal" }}>
                  Total de registros: {itemsFiltrados.length}
                </small>
              </div>
              <div style={{ flex: 0.5 }}>
                <Button
                  label="Nuevo"
                  icon="pi pi-plus"
                  severity="primary"
                  raised
                  disabled={!permisos.puedeCrear}
                  tooltip="Nueva Cuenta Contable"
                  onClick={onNew}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 0.25 }}>
                <Button
                  icon="pi pi-refresh"
                  severity="info"
                  onClick={async () => {
                    await cargarDatos();
                    toast.current?.show({
                      severity: "success",
                      summary: "Actualizado",
                      detail: "Datos actualizados correctamente desde el servidor",
                      life: 3000,
                    });
                  }}
                  style={{ width: "100%" }}
                  loading={loading}
                  tooltip="Actualizar todos los datos desde el servidor"
                />
              </div>
              <div style={{ flex: 0.25 }}>
                <Button
                  icon="pi pi-filter-slash"
                  severity="secondary"
                  onClick={limpiarFiltros}
                  disabled={loading}
                  style={{ width: "100%" }}
                  tooltip="Limpiar filtros"
                />
              </div>

              <div style={{ flex: 1 }}>
                <label htmlFor="nivelEnumFilter">Por Nivel</label>
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
                  showClear
                  style={{ width: "100%" }}
                  onClear={() => setNivelEnumFilter(null)}
                  placeholder="Seleccionar Nivel"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="naturalezaFilter">Por Naturaleza</label>
                <Dropdown
                  id="naturalezaFilter"
                  value={naturalezaFilter}
                  options={[
                    { label: "Todas", value: null },
                    { label: "DEUDORA", value: "DEUDORA" },
                    { label: "ACREEDORA", value: "ACREEDORA" },
                  ]}
                  onChange={(e) => setNaturalezaFilter(e.value)}
                  showClear
                  style={{ width: "100%" }}
                  onClear={() => setNaturalezaFilter(null)}
                  placeholder="Seleccionar Naturaleza"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="tipoCuentaFilter">Tipo de Cuenta</label>
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
                  showClear
                  style={{ width: "100%" }}
                  onClear={() => setTipoCuentaFilter(null)}
                  placeholder="Seleccionar Tipo de Cuenta"
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
              <div style={{ flex: 0.5 }}>
                <Button
                  label="Expandir Todo"
                  icon="pi pi-angle-double-down"
                  severity="success"
                  onClick={expandirTodo}
                  disabled={loading}
                  tooltip="Expandir todo"
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <Button
                  label="Contraer Todo"
                  icon="pi pi-angle-double-up"
                  severity="warning"
                  onClick={colapsarTodo}
                  disabled={loading}
                  tooltip="Colapsar todo"
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <CentroCostoFilterSelector
                  value={centroCostoFilter}
                  onChange={(id) => setCentroCostoFilter(id)}
                  label="Centro de Costo"
                  availableCentros={centrosDisponibles}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="globalFilter">Buscar</label>
                <InputText
                  id="globalFilter"
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Buscar x Código, Nombre..."
                  style={{ width: "100%" }}
                />
              </div>
            </div>

          </div>
        }
      >
        <Column field="codigoCuenta" header="Código" body={codigoCuentaTemplate} expander style={{ width: '200px' }} />
        <Column field="nombreCuenta" header="Nombre" body={nombreCuentaTemplate} />
        <Column field="nivel" header="Nivel" body={nivelTemplate} style={{ width: '150px' }} />
        <Column field="naturaleza" header="Naturaleza" body={naturalezaTemplate} style={{ width: '120px' }} />
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
        <Column field="tipoCuenta" header="Tipo" body={tipoCuentaTemplate} style={{ width: '130px' }} />
        <Column field="cuentaPadre.codigoCuenta" header="Padre" body={cuentaPadreTemplate} style={{ width: '90px' }} />
        <Column header="Clasificación" body={clasificacionTemplate} style={{ minWidth: '150px', maxWidth: '250px' }} />
        <Column
          field="centroCosto.Nombre"
          header="Centro Costo"
          body={(node) => {
            if (!node.data.centroCosto) {
              return <Tag value="-" severity="secondary" />;
            }
            const centro = node.data.centroCosto;
            return (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                {centro.categoria && (
                  <Tag
                    value={centro.categoria.nombre}
                    severity="info"
                    style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem' }}
                  />
                )}
                {centro.ParentCentroID && (
                  <Tag
                    value={centro.ParentCentroID}
                    severity="warning"
                    style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem' }}
                  />
                )}
                <Tag
                  value={centro.Descripcion || centro.Nombre}
                  severity="success"
                  style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem' }}
                />
              </span>
            );
          }}
          style={{ width: '250px' }}
        />
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