// src/pages/contabilidad/Detraccion.jsx
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
import DetraccionForm from "../../components/contabilidad/detraccion/DetraccionForm";
import {
  getDetracciones,
  getDetraccionById,
  deleteDetraccion,
} from "../../api/contabilidad/detraccion";
import { getEstadosMultiFuncionPorTipoProviene } from "../../api/estadoMultiFuncion";
import { getMonedas } from "../../api/moneda";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { usePermissions } from "../../hooks/usePermissions";
import { getResponsiveFontSize } from "../../utils/utils";
import EmpresaSelector from "../../components/common/EmpresaSelector";
import { getEmpresas } from "../../api/empresa";
import { getEntidadesComerciales } from "../../api/entidadComercial";

export default function Detraccion({ ruta }) {
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
  const [clientes, setClientes] = useState([]);
  const [empresaFilter, setEmpresaFilter] = useState(usuario?.empresaId || null);
  const [estadoFilter, setEstadoFilter] = useState(null);
  const [clienteFilter, setClienteFilter] = useState(null);
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
  }, [items, empresaFilter, estadoFilter, clienteFilter, rangoFechas]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [detraccionesData, empresasData, estadosData, monedasData, clientesData] =
        await Promise.all([
          getDetracciones(),
          getEmpresas(),
          getEstadosMultiFuncionPorTipoProviene("DETRACCION"),
          getMonedas(),
          getEntidadesComerciales(),
        ]);
      setItems(detraccionesData);
      setEmpresas(empresasData);
      setEstados(estadosData);
      setMonedas(monedasData);
      setClientes(clientesData.filter((e) => e.esCliente));
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

  const handleEmpresaChange = (value) => {
    setEmpresaFilter(value);
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

    if (clienteFilter) {
      filtrados = filtrados.filter(
        (item) => Number(item.clienteId) === Number(clienteFilter)
      );
    }

    if (rangoFechas && rangoFechas[0]) {
      filtrados = filtrados.filter((item) => {
        const fecha = new Date(item.fechaDeposito);
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
      const data = await getDetraccionById(row.id);
      setSelected(data);
      setIsEdit(true);
      setShowDialog(true);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar detracción",
        life: 3000,
      });
    }
  };

  const handleEliminar = (row) => {
    setConfirmState({ visible: true, row });
  };

  const confirmarEliminar = async () => {
    try {
      await deleteDetraccion(confirmState.row.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Detracción eliminada correctamente",
        life: 3000,
      });
      cargarDatos();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Error al eliminar detracción",
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
      detail: `Detracción ${isEdit ? "actualizada" : "creada"} correctamente`,
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
    return new Date(rowData.fechaDeposito).toLocaleDateString("es-PE");
  };

  const montoBodyTemplate = (rowData) => {
    return `${rowData.moneda?.simbolo || ""} ${Number(rowData.importeDetraido || 0).toFixed(2)}`;
  };

  const accionesBodyTemplate = (rowData) => {
    const estadoId = Number(rowData.estadoId);
    const esPendiente = estadoId === 126;

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
        <h4>Detracciones</h4>
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
          empresaId={empresaFilter}
          onEmpresaChange={handleEmpresaChange}
        />
      </div>
      <div style={{ flex: 1 }}>
        <label>Cliente</label>
        <Dropdown
          value={clienteFilter}
          options={clientes}
          onChange={(e) => setClienteFilter(e.value)}
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
        message="¿Está seguro de eliminar esta detracción?"
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
        emptyMessage="No se encontraron detracciones"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        style={{ fontSize: getResponsiveFontSize() }}
      >
        <Column field="numeroConstancia" header="N° Constancia" sortable />
        <Column
          field="fechaDeposito"
          header="Fecha Depósito"
          body={fechaBodyTemplate}
          sortable
        />
        <Column field="cliente.razonSocial" header="Cliente" sortable />
        <Column field="tipoDetraccion.nombre" header="Tipo" sortable />
        <Column
          field="importeDetraido"
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
        header={isEdit ? "Editar Detracción" : "Nueva Detracción"}
        modal
        onHide={() => setShowDialog(false)}
      >
        <DetraccionForm
          detraccion={selected}
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