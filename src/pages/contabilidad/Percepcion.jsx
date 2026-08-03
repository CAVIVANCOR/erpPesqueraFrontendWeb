// src/pages/contabilidad/Percepcion.jsx
import React, { useRef, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import PercepcionForm from "../../components/contabilidad/percepcion/PercepcionForm";
import {
  getPercepciones,
  getPercepcionById,
  deletePercepcion,
} from "../../api/contabilidad/percepcion";
import { getEstadosMultiFuncionPorTipoProviene } from "../../api/estadoMultiFuncion";
import { getMonedas } from "../../api/moneda";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { usePermissions } from "../../hooks/usePermissions";
import { getResponsiveFontSize } from "../../utils/utils";
import EmpresaSelector from "../../components/common/EmpresaSelector";
import { getEmpresas } from "../../api/empresa";
import { getEntidadesComerciales } from "../../api/entidadComercial";

export default function Percepcion({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [estados, setEstados] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [empresaFilter, setEmpresaFilter] = useState(usuario?.empresaId || null);
  const [estadoFilter, setEstadoFilter] = useState(null);
  const [proveedorFilter, setProveedorFilter] = useState(null);
  const [rangoFechas, setRangoFechas] = useState(null);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    filtrarItems();
  }, [items, empresaFilter, estadoFilter, proveedorFilter, rangoFechas]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [percepcionesData, empresasData, estadosData, monedasData, proveedoresData] =
        await Promise.all([
          getPercepciones(),
          getEmpresas(),
          getEstadosMultiFuncionPorTipoProviene("PERCEPCION"),
          getMonedas(),
          getEntidadesComerciales(),
        ]);
      setItems(percepcionesData);
      setEmpresas(empresasData);
      setEstados(estadosData);
      setMonedas(monedasData);
      setProveedores(proveedoresData.filter((e) => e.esProveedor));
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
    let filtrados = [...items];

    if (empresaFilter) {
      filtrados = filtrados.filter(
        (item) => Number(item.empresaId) === Number(empresaFilter)
      );
    }

    if (estadoFilter) {
      filtrados = filtrados.filter(
        (item) => Number(item.estadoId) === Number(estadoFilter)
      );
    }

    if (proveedorFilter) {
      filtrados = filtrados.filter(
        (item) => Number(item.proveedorId) === Number(proveedorFilter)
      );
    }

    if (rangoFechas && rangoFechas[0]) {
      filtrados = filtrados.filter((item) => {
        const fecha = new Date(item.fechaEmision);
        const inicio = rangoFechas[0];
        const fin = rangoFechas[1] || rangoFechas[0];
        return fecha >= inicio && fecha <= fin;
      });
    }

    setItemsFiltrados(filtrados);
  };

  const handleNuevo = () => {
    setSelected(null);
    setIsEdit(false);
    setShowDialog(true);
  };

  const handleEditar = async (row) => {
    try {
      const data = await getPercepcionById(row.id);
      setSelected(data);
      setIsEdit(true);
      setShowDialog(true);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar percepción",
        life: 3000,
      });
    }
  };

  const handleEliminar = (row) => {
    setConfirmState({ visible: true, row });
  };

  const confirmarEliminar = async () => {
    try {
      await deletePercepcion(confirmState.row.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Percepción eliminada correctamente",
        life: 3000,
      });
      cargarDatos();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Error al eliminar percepción",
        life: 3000,
      });
    } finally {
      setConfirmState({ visible: false, row: null });
    }
  };

  const handleGuardar = () => {
    setShowDialog(false);
    cargarDatos();
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: `Percepción ${isEdit ? "actualizada" : "creada"} correctamente`,
      life: 3000,
    });
  };

  const estadoBodyTemplate = (rowData) => {
    const severityMap = {
      PENDIENTE: "secondary",
      VALIDADO: "success",
      "ASIENTO GENERADO": "contrast",
    };
    return (
      <Tag
        value={rowData.estado?.descripcion}
        severity={severityMap[rowData.estado?.descripcion] || "info"}
      />
    );
  };

  const fechaBodyTemplate = (rowData) => {
    return new Date(rowData.fechaEmision).toLocaleDateString("es-PE");
  };

  const montoBodyTemplate = (rowData) => {
    return `${rowData.moneda?.simbolo || ""} ${Number(rowData.importePercibido || 0).toFixed(2)}`;
  };

  const accionesBodyTemplate = (rowData) => {
    const estadoId = Number(rowData.estadoId);
    const esPendiente = estadoId === 132;

    return (
      <div className="flex gap-2">
        {permisos.puedeEditar && esPendiente && (
          <Button
            icon="pi pi-pencil"
            className="p-button-rounded p-button-text p-button-sm"
            onClick={() => handleEditar(rowData)}
            tooltip="Editar"
          />
        )}
        {permisos.puedeEliminar && esPendiente && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-text p-button-danger p-button-sm"
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
        alignItems: "end",
        display: "flex",
        gap: 10,
        marginBottom: 15,
        flexDirection: window.innerWidth < 768 ? "column" : "row",
      }}
    >
      <div style={{ flex: 1 }}>
        <h4>Percepciones</h4>
      </div>
      <div style={{ flex: 1 }}>
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar..."
            style={{ fontSize: getResponsiveFontSize(), width: "100%" }}
          />
        </span>
      </div>
      <div style={{ flex: 1 }}>
        {permisos.puedeCrear && (
          <Button
            label="Nuevo"
            icon="pi pi-plus"
            onClick={handleNuevo}
            style={{ fontSize: getResponsiveFontSize(), width: "100%" }}
          />
        )}
      </div>
      <div style={{ flex: 1 }}>
        <label>Empresa</label>
        <EmpresaSelector
          value={empresaFilter}
          onChange={(e) => setEmpresaFilter(e.value)}
          empresas={empresas}
        />
      </div>
      <div style={{ flex: 1 }}>
        <label>Proveedor</label>
        <Dropdown
          value={proveedorFilter}
          options={proveedores}
          onChange={(e) => setProveedorFilter(e.value)}
          optionLabel="razonSocial"
          optionValue="id"
          placeholder="Todos"
          filter
          showClear
          style={{ fontSize: getResponsiveFontSize(), width: "100%" }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <label>Estado</label>
        <Dropdown
          value={estadoFilter}
          options={estados}
          onChange={(e) => setEstadoFilter(e.value)}
          optionLabel="descripcion"
          optionValue="id"
          placeholder="Todos"
          showClear
          style={{ fontSize: getResponsiveFontSize(), width: "100%" }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <label>Rango de Fechas</label>
        <Calendar
          value={rangoFechas}
          onChange={(e) => setRangoFechas(e.value)}
          selectionMode="range"
          readOnlyInput
          showIcon
          placeholder="Seleccionar rango"
          dateFormat="dd/mm/yy"
          style={{ fontSize: getResponsiveFontSize(), width: "100%" }}
        />
      </div>
    </div>
  );

  return (
    <div className="card">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message="¿Está seguro de eliminar esta percepción?"
        header="Confirmar"
        icon="pi pi-exclamation-triangle"
        accept={confirmarEliminar}
        reject={() => setConfirmState({ visible: false, row: null })}
        acceptLabel="Sí"
        rejectLabel="No"
      />
      <DataTable
        value={itemsFiltrados}
        loading={loading}
        header={header}
        globalFilter={globalFilter}
        emptyMessage="No se encontraron percepciones"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        style={{ fontSize: getResponsiveFontSize() }}
      >
        <Column field="numeroDocumento" header="N° Documento" sortable />
        <Column
          field="fechaEmision"
          header="Fecha Emisión"
          body={fechaBodyTemplate}
          sortable
        />
        <Column field="proveedor.razonSocial" header="Proveedor" sortable />
        <Column field="tipoPercepcion.nombre" header="Tipo" sortable />
        <Column
          field="importePercibido"
          header="Importe"
          body={montoBodyTemplate}
          sortable
        />
        <Column field="estado.descripcion" header="Estado" body={estadoBodyTemplate} sortable />
        <Column body={accionesBodyTemplate} header="Acciones" />
      </DataTable>

      <Dialog
        visible={showDialog}
        style={{ width: "90vw" }}
        header={isEdit ? "Editar Percepción" : "Nueva Percepción"}
        modal
        onHide={() => setShowDialog(false)}
      >
        <PercepcionForm
          percepcion={selected}
          onGuardar={handleGuardar}
          onCancelar={() => setShowDialog(false)}
          toast={toast}
          empresas={empresas}
          monedas={monedas}
        />
      </Dialog>
    </div>
  );
}