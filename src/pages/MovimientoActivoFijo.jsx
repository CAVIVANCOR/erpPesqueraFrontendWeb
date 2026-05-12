// src/pages/MovimientoActivoFijo.jsx
import React, { useRef, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import MovimientoActivoFijoForm from "../components/movimientoActivoFijo/MovimientoActivoFijoForm";
import {
  getMovimientosActivoFijo,
  eliminarMovimientoActivoFijo,
} from "../api/movimientoActivoFijo";
import { getEmpresas } from "../api/empresa";
import { getActivos } from "../api/activo";
import { getTiposMovimientoActivoFijo } from "../api/tipoMovimientoActivoFijo";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize, formatearFecha } from "../utils/utils";

export default function MovimientoActivoFijo({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [activos, setActivos] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [empresaFilter, setEmpresaFilter] = useState(null);
  const [activoFilter, setActivoFilter] = useState(null);
  const [tipoMovimientoFilter, setTipoMovimientoFilter] = useState(null);
  const [rangoFechas, setRangoFechas] = useState(null);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    filtrarItems();
  }, [items, empresaFilter, activoFilter, tipoMovimientoFilter, rangoFechas]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [movimientosData, empresasData, activosData, tiposData] =
        await Promise.all([
          getMovimientosActivoFijo(),
          getEmpresas(),
          getActivos(),
          getTiposMovimientoActivoFijo(),
        ]);
      setItems(movimientosData);
      setEmpresas(empresasData);
      setActivos(activosData);
      setTiposMovimiento(tiposData);
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
        (item) => Number(item.empresaId) === Number(empresaFilter),
      );
    }

    if (activoFilter) {
      filtrados = filtrados.filter(
        (item) => Number(item.activoId) === Number(activoFilter),
      );
    }

    if (tipoMovimientoFilter) {
      filtrados = filtrados.filter(
        (item) => Number(item.tipoMovimientoId) === Number(tipoMovimientoFilter),
      );
    }

    if (rangoFechas && rangoFechas[0]) {
      filtrados = filtrados.filter((item) => {
        const fechaMovimiento = new Date(item.fechaMovimiento);
        const fechaIni = new Date(rangoFechas[0]);
        fechaIni.setHours(0, 0, 0, 0);

        if (rangoFechas[1]) {
          const fechaFinDia = new Date(rangoFechas[1]);
          fechaFinDia.setHours(23, 59, 59, 999);
          return fechaMovimiento >= fechaIni && fechaMovimiento <= fechaFinDia;
        }

        return fechaMovimiento >= fechaIni;
      });
    }
    setItemsFiltrados(filtrados);
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

  const onEdit = (rowData) => {
    if (!permisos.puedeVer && !permisos.puedeEditar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para ver o editar registros.",
        life: 3000,
      });
      return;
    }
    setSelected(rowData);
    setIsEdit(true);
    setShowDialog(true);
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

    confirmDialog({
      message: `¿Está seguro de eliminar el movimiento del ${formatearFecha(rowData.fechaMovimiento)}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Sí, Eliminar",
      rejectLabel: "Cancelar",
      accept: () => confirmarEliminacion(rowData.id),
    });
  };

  const confirmarEliminacion = async (id) => {
    try {
      await eliminarMovimientoActivoFijo(id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Movimiento eliminado correctamente",
        life: 3000,
      });
      await cargarDatos();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message || "Error al eliminar el movimiento",
        life: 3000,
      });
    }
  };

  const onSave = async () => {
    setShowDialog(false);
    await cargarDatos();
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: isEdit
        ? "Movimiento actualizado correctamente"
        : "Movimiento creado correctamente",
      life: 3000,
    });
  };

  const onCancel = () => {
    setShowDialog(false);
    setSelected(null);
  };

  const limpiarFiltros = () => {
    setEmpresaFilter(null);
    setActivoFilter(null);
    setTipoMovimientoFilter(null);
    setRangoFechas(null);
    setGlobalFilter("");
  };

  const fechaBodyTemplate = (rowData) => {
    return formatearFecha(rowData.fechaMovimiento);
  };

  const montoBodyTemplate = (rowData) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: rowData.moneda?.codigo || "PEN",
      minimumFractionDigits: 2,
    }).format(rowData.monto || 0);
  };

  const depreciacionBodyTemplate = (rowData) => {
    if (!rowData.depreciacionAcumulada) return "-";
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: rowData.moneda?.codigo || "PEN",
      minimumFractionDigits: 2,
    }).format(rowData.depreciacionAcumulada);
  };

  const valorNetoBodyTemplate = (rowData) => {
    if (!rowData.valorNeto) return "-";
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: rowData.moneda?.codigo || "PEN",
      minimumFractionDigits: 2,
    }).format(rowData.valorNeto);
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-sm"
          onClick={() => onEdit(rowData)}
          disabled={!permisos.puedeVer && !permisos.puedeEditar}
          tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger p-button-sm"
          onClick={() => onDelete(rowData)}
          disabled={!permisos.puedeEliminar}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  const header = (
    <div className="flex flex-column gap-3">
      <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
        <h4 className="m-0">Movimientos de Activo Fijo</h4>
        <div className="flex gap-2">
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText
              type="search"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar..."
              className="w-full"
            />
          </span>
          <Button
            label="Nuevo"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={onNew}
            disabled={!permisos.puedeCrear}
            tooltip={
              !permisos.puedeCrear
                ? "No tiene permisos para crear"
                : "Nuevo Movimiento"
            }
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Dropdown
          value={empresaFilter}
          options={empresas.map((e) => ({
            label: e.razonSocial,
            value: Number(e.id),
          }))}
          onChange={(e) => setEmpresaFilter(e.value)}
          placeholder="Filtrar por Empresa"
          showClear
          className="w-full md:w-14rem"
        />
        <Dropdown
          value={activoFilter}
          options={activos.map((a) => ({
            label: a.nombre,
            value: Number(a.id),
          }))}
          onChange={(e) => setActivoFilter(e.value)}
          placeholder="Filtrar por Activo"
          showClear
          filter
          className="w-full md:w-14rem"
        />
        <Dropdown
          value={tipoMovimientoFilter}
          options={tiposMovimiento
            .filter((t) => t.activo)
            .map((t) => ({
              label: t.nombre,
              value: Number(t.id),
            }))}
          onChange={(e) => setTipoMovimientoFilter(e.value)}
          placeholder="Filtrar por Tipo"
          showClear
          className="w-full md:w-14rem"
        />
        <Calendar
          value={rangoFechas}
          onChange={(e) => setRangoFechas(e.value)}
          selectionMode="range"
          readOnlyInput
          placeholder="Rango de Fechas"
          dateFormat="dd/mm/yy"
          showIcon
          className="w-full md:w-14rem"
        />
        <Button
          label="Limpiar Filtros"
          icon="pi pi-filter-slash"
          className="p-button-outlined"
          onClick={limpiarFiltros}
        />
      </div>
    </div>
  );

  return (
    <div className="p-m-4">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <DataTable
          value={itemsFiltrados}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} movimientos"
          globalFilter={globalFilter}
          emptyMessage="No se encontraron movimientos"
          header={header}
          onRowClick={
            permisos.puedeVer || permisos.puedeEditar
              ? (e) => onEdit(e.data)
              : undefined
          }
          scrollable
          scrollHeight="600px"
          style={{
            cursor:
              permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
            fontSize: getResponsiveFontSize(),
          }}
        >
          <Column
            field="id"
            header="ID"
            sortable
            style={{ minWidth: "80px" }}
          />
          <Column
            field="empresa.razonSocial"
            header="Empresa"
            sortable
            style={{ minWidth: "180px" }}
          />
          <Column
            field="activo.nombre"
            header="Activo"
            sortable
            style={{ minWidth: "200px" }}
          />
          <Column
            field="tipoMovimiento.nombre"
            header="Tipo Movimiento"
            sortable
            style={{ minWidth: "180px" }}
          />
          <Column
            field="fechaMovimiento"
            header="Fecha"
            body={fechaBodyTemplate}
            sortable
            style={{ minWidth: "120px" }}
          />
          <Column
            field="monto"
            header="Monto"
            body={montoBodyTemplate}
            sortable
            style={{ minWidth: "130px" }}
          />
          <Column
            field="depreciacionAcumulada"
            header="Dep. Acumulada"
            body={depreciacionBodyTemplate}
            sortable
            style={{ minWidth: "150px" }}
          />
          <Column
            field="valorNeto"
            header="Valor Neto"
            body={valorNetoBodyTemplate}
            sortable
            style={{ minWidth: "130px" }}
          />
          <Column
            body={actionBodyTemplate}
            header="Acciones"
            frozen
            alignFrozen="right"
            style={{ minWidth: "120px" }}
          />
        </DataTable>
      </div>

      <Dialog
        visible={showDialog}
        style={{ width: "90vw", maxWidth: "900px" }}
        header={
          isEdit
            ? "Editar Movimiento de Activo Fijo"
            : "Nuevo Movimiento de Activo Fijo"
        }
        modal
        className="p-fluid"
        onHide={onCancel}
        maximizable
      >
        <MovimientoActivoFijoForm
          movimiento={selected}
          empresaIdInicial={empresaFilter}
          activoIdInicial={activoFilter}
          onSave={onSave}
          onCancel={onCancel}
          permisos={permisos}
          readOnly={!!selected && !!selected.id && !permisos.puedeEditar}
        />
      </Dialog>
    </div>
  );
}