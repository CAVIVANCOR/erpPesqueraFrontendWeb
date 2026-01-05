// src/pages/tesoreria/InversionFinanciera.jsx
import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import {
  getInversionFinanciera,
  deleteInversionFinanciera,
  createInversionFinanciera,
  updateInversionFinanciera,
  getInversionFinancieraById,
} from "../../api/tesoreria/inversionFinanciera";
import { getEmpresas } from "../../api/empresa";
import { getAllBancos } from "../../api/banco";
import { getEstadosMultiFuncionPorTipoProviene } from "../../api/estadoMultiFuncion";
import InversionFinancieraForm from "../../components/tesoreria/InversionFinancieraForm";
import { usePermissions } from "../../hooks/usePermissions";
import { getResponsiveFontSize } from "../../utils/utils";

export default function InversionFinanciera({ ruta }) {
  const permisos = usePermissions(ruta);

  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);

  // Estados para el Dialog
  const [dialogVisible, setDialogVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedInversion, setSelectedInversion] = useState(null);
  const [empresaFija, setEmpresaFija] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Estados para la lista
  const [inversiones, setInversiones] = useState([]);
  const [inversionesFiltradas, setInversionesFiltradas] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [bancoSeleccionado, setBancoSeleccionado] = useState(null);
  const [tipoInversionSeleccionado, setTipoInversionSeleccionado] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  const tiposInversion = [
    { label: "Depósito a Plazo Fijo", value: "DEPOSITO_PLAZO_FIJO" },
    { label: "Cuenta de Ahorros", value: "CUENTA_AHORROS" },
    { label: "Fondo Mutuo", value: "FONDO_MUTUO" },
    { label: "Bonos", value: "BONOS" },
    { label: "Acciones", value: "ACCIONES" },
    { label: "Certificado de Depósito", value: "CERTIFICADO_DEPOSITO" }
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  // Filtrar inversiones por múltiples criterios
  useEffect(() => {
    let filtradas = [...inversiones];

    if (empresaSeleccionada) {
      filtradas = filtradas.filter(
        (inv) => Number(inv.empresaId) === Number(empresaSeleccionada)
      );
    }

    if (bancoSeleccionado) {
      filtradas = filtradas.filter(
        (inv) => Number(inv.bancoId) === Number(bancoSeleccionado)
      );
    }

    if (tipoInversionSeleccionado) {
      filtradas = filtradas.filter(
        (inv) => inv.tipoInversion === tipoInversionSeleccionado
      );
    }

    if (estadoSeleccionado) {
      filtradas = filtradas.filter(
        (inv) => Number(inv.estadoId) === Number(estadoSeleccionado)
      );
    }

    if (fechaInicio) {
      filtradas = filtradas.filter(
        (inv) => new Date(inv.fechaInicio) >= new Date(fechaInicio)
      );
    }

    if (fechaFin) {
      filtradas = filtradas.filter(
        (inv) => new Date(inv.fechaInicio) <= new Date(fechaFin)
      );
    }

    setInversionesFiltradas(filtradas);
  }, [empresaSeleccionada, bancoSeleccionado, tipoInversionSeleccionado, estadoSeleccionado, fechaInicio, fechaFin, inversiones]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [inversionesData, empresasData, bancosData, estadosData] = await Promise.all([
        getInversionFinanciera(),
        getEmpresas(),
        getAllBancos(),
        getEstadosMultiFuncionPorTipoProviene(23)
      ]);
      setInversiones(inversionesData);
      setEmpresas(empresasData);
      setBancos(bancosData);
      setEstados(estadosData);
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

  const openNew = () => {
    setSelectedInversion(null);
    setEmpresaFija(empresaSeleccionada);
    setIsEdit(false);
    setDialogVisible(true);
  };

  const openEdit = (inversion) => {
    setSelectedInversion(inversion);
    setEmpresaFija(null);
    setIsEdit(true);
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
    setSelectedInversion(null);
    setEmpresaFija(null);
    setIsEdit(false);
  };

  const handleSubmit = async (data) => {
    setFormLoading(true);
    try {
      if (isEdit) {
        await updateInversionFinanciera(selectedInversion.id, data);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Inversión financiera actualizada correctamente",
          life: 3000,
        });
      } else {
        await createInversionFinanciera(data);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: "Inversión financiera creada correctamente",
          life: 3000,
        });
      }
      
      await cargarDatos();
      hideDialog();
    } catch (error) {
      const errorMsg = error.response?.data?.mensaje || error.response?.data?.error || error.response?.data?.message || "No se pudo guardar";
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: errorMsg,
        life: 3000,
      });
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = (inversion) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la inversión ${inversion.numeroInversion}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí",
      rejectLabel: "No",
      accept: () => handleDelete(inversion.id),
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteInversionFinanciera(id);
      await cargarDatos();
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Inversión financiera eliminada correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar inversión financiera",
        life: 3000,
      });
    }
  };

  const limpiarFiltros = () => {
    setEmpresaSeleccionada(null);
    setBancoSeleccionado(null);
    setTipoInversionSeleccionado(null);
    setEstadoSeleccionado(null);
    setFechaInicio(null);
    setFechaFin(null);
    setGlobalFilter("");
  };

  const header = (
    <div>
      <div
        style={{
          alignItems: "end",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
          marginBottom: 15
        }}
      >
        <div style={{ flex: 2 }}>
          <h3 style={{ margin: 0 }}>Inversiones Financieras</h3>
          <small style={{ color: "#666", fontWeight: "normal" }}>
            Total de registros: {inversionesFiltradas.length}
          </small>
        </div>
        <div style={{ flex: 2 }}>
          <label htmlFor="empresaFiltro" style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}>
            Empresa *
          </label>
          <Dropdown
            id="empresaFiltro"
            value={empresaSeleccionada}
            options={empresas.map((e) => ({
              label: e.razonSocial,
              value: Number(e.id),
            }))}
            onChange={(e) => setEmpresaSeleccionada(e.value)}
            placeholder="Seleccionar empresa para filtrar"
            optionLabel="label"
            optionValue="value"
            showClear
            disabled={loading}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Button
            label="Nueva Inversión"
            icon="pi pi-plus"
            className="p-button-success"
            severity="success"
            raised
            onClick={openNew}
            disabled={!permisos.puedeCrear || loading || !empresaSeleccionada}
            tooltip={
              !permisos.puedeCrear
                ? "No tiene permisos para crear"
                : !empresaSeleccionada
                ? "Seleccione una empresa primero"
                : "Nueva Inversión Financiera"
            }
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Button
            icon="pi pi-refresh"
            className="p-button-outlined p-button-info"
            onClick={async () => {
              await cargarDatos();
              toast.current.show({
                severity: "success",
                summary: "Actualizado",
                detail: "Datos actualizados correctamente",
                life: 3000
              });
            }}
            loading={loading}
            tooltip="Actualizar datos"
            tooltipOptions={{ position: "top" }}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Button
            label="Limpiar"
            icon="pi pi-filter-slash"
            className="p-button-secondary"
            outlined
            onClick={limpiarFiltros}
            disabled={loading}
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
          marginBottom: 15
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="bancoFiltro" style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}>
            Banco
          </label>
          <Dropdown
            id="bancoFiltro"
            value={bancoSeleccionado}
            options={bancos.map((b) => ({
              label: b.nombre,
              value: Number(b.id),
            }))}
            onChange={(e) => setBancoSeleccionado(e.value)}
            placeholder="Todos"
            optionLabel="label"
            optionValue="value"
            showClear
            disabled={loading}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="tipoInversionFiltro" style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}>
            Tipo Inversión
          </label>
          <Dropdown
            id="tipoInversionFiltro"
            value={tipoInversionSeleccionado}
            options={tiposInversion}
            onChange={(e) => setTipoInversionSeleccionado(e.value)}
            placeholder="Todos"
            optionLabel="label"
            optionValue="value"
            showClear
            disabled={loading}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="estadoFiltro" style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}>
            Estado
          </label>
          <Dropdown
            id="estadoFiltro"
            value={estadoSeleccionado}
            options={estados.map((e) => ({
              label: e.descripcion || e.estado,
              value: Number(e.id),
            }))}
            onChange={(e) => setEstadoSeleccionado(e.value)}
            placeholder="Todos"
            optionLabel="label"
            optionValue="value"
            showClear
            disabled={loading}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaInicioFiltro" style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}>
            Fecha Inicio Desde
          </label>
          <Calendar
            id="fechaInicioFiltro"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.value)}
            placeholder="Desde"
            showIcon
            dateFormat="dd/mm/yy"
            disabled={loading}
            showButtonBar
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaFinFiltro" style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}>
            Fecha Inicio Hasta
          </label>
          <Calendar
            id="fechaFinFiltro"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.value)}
            placeholder="Hasta"
            showIcon
            dateFormat="dd/mm/yy"
            disabled={loading}
            showButtonBar
            style={{ width: "100%" }}
          />
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <span className="p-input-icon-left" style={{ width: "100%" }}>
          <i className="pi pi-search" />
          <input
            type="search"
            className="p-inputtext p-component"
            placeholder="Buscar..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            style={{ width: "100%" }}
          />
        </span>
      </div>
    </div>
  );

  const empresaBodyTemplate = (rowData) => {
    return rowData.empresa?.razonSocial || "N/A";
  };

  const bancoBodyTemplate = (rowData) => {
    return rowData.banco?.nombreBanco || "N/A";
  };

  const tipoInversionBodyTemplate = (rowData) => {
    const tipos = {
      DEPOSITO_PLAZO_FIJO: "DEPÓSITO A PLAZO FIJO",
      CUENTA_AHORROS: "CUENTA DE AHORROS",
      FONDO_MUTUO: "FONDO MUTUO",
      BONOS: "BONOS",
      ACCIONES: "ACCIONES",
      CERTIFICADO_DEPOSITO: "CERTIFICADO DE DEPÓSITO",
    };
    return tipos[rowData.tipoInversion] || rowData.tipoInversion;
  };

  const fechaBodyTemplate = (rowData, field) => {
    const fecha = rowData[field];
    if (!fecha) return "N/A";
    return new Date(fecha).toLocaleDateString("es-PE");
  };

  const montoBodyTemplate = (rowData, field) => {
    const monto = rowData[field];
    if (!monto && monto !== 0) return "N/A";
    const moneda = rowData.moneda?.codigoSunat || "PEN";
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: moneda,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(monto);
  };

  const tasaBodyTemplate = (rowData) => {
    const tasa = Number(rowData.tasaRendimiento);
    return `${isNaN(tasa) ? 0 : tasa.toFixed(2)}%`;
  };

  const periodicidadBodyTemplate = (rowData) => {
    const periodicidades = {
      VENCIMIENTO: "AL VENCIMIENTO",
      MENSUAL: "MENSUAL",
      TRIMESTRAL: "TRIMESTRAL",
      SEMESTRAL: "SEMESTRAL",
      ANUAL: "ANUAL",
    };
    return periodicidades[rowData.periodicidadPago] || rowData.periodicidadPago;
  };

  const renovacionBodyTemplate = (rowData) => {
    return rowData.renovacionAutomatica ? (
      <Tag value="SÍ" severity="success" />
    ) : (
      <Tag value="NO" severity="danger" />
    );
  };

  const estadoBodyTemplate = (rowData) => {
    const estado = rowData.estado;
    if (!estado) return "N/A";

    const severityMap = {
      SUCCESS: "success",
      DANGER: "danger",
      WARNING: "warning",
      INFO: "info",
      SECONDARY: "secondary",
      CONTRAST: "contrast",
    };

    return (
      <Tag
        value={estado.estado}
        severity={severityMap[estado.color] || "info"}
      />
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <>
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-sm"
          onClick={(e) => {
            e.stopPropagation();
            openEdit(rowData);
          }}
          disabled={!permisos.puedeVer && !permisos.puedeEditar}
          tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
          aria-label={permisos.puedeEditar ? "Editar" : "Ver"}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger p-button-sm"
          onClick={(e) => {
            e.stopPropagation();
            confirmDelete(rowData);
          }}
          aria-label="Eliminar"
          tooltip="Eliminar"
          disabled={!permisos.puedeEliminar}
        />
      </>
    );
  };

  return (
    <div className="card">
      <Toast ref={toast} />
      <ConfirmDialog />

      <DataTable
        value={inversionesFiltradas}
        loading={loading}
        header={header}
        globalFilter={globalFilter}
        emptyMessage="No se encontraron inversiones financieras"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        className="datatable-responsive"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} inversiones"
        sortField="numeroInversion"
        sortOrder={-1}
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar
            ? (e) => openEdit(e.data)
            : undefined
        }
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
      >
        <Column
          field="numeroInversion"
          header="Número Inversión"
          sortable
        />
        <Column
          header="Empresa"
          body={empresaBodyTemplate}
          sortable
          sortField="empresa.razonSocial"
          filter
          filterField="empresa.razonSocial"
          filterPlaceholder="Buscar por empresa"
          style={{ minWidth: "200px" }}
        />
        <Column
          header="Banco"
          body={bancoBodyTemplate}
          sortable
          sortField="banco.nombreBanco"
          filter
          filterField="banco.nombreBanco"
          filterPlaceholder="Buscar por banco"
          style={{ minWidth: "180px" }}
        />
        <Column
          header="Tipo Inversión"
          body={tipoInversionBodyTemplate}
          sortable
          sortField="tipoInversion"
          filter
          filterField="tipoInversion"
          filterPlaceholder="Buscar por tipo"
          style={{ minWidth: "180px" }}
        />
        <Column
          header="Fecha Inicio"
          body={(rowData) => fechaBodyTemplate(rowData, "fechaInicio")}
          sortable
          sortField="fechaInicio"
          style={{ minWidth: "120px" }}
        />
        <Column
          header="Fecha Vencimiento"
          body={(rowData) => fechaBodyTemplate(rowData, "fechaVencimiento")}
          sortable
          sortField="fechaVencimiento"
          style={{ minWidth: "150px" }}
        />
        <Column
          header="Monto Inicial"
          body={(rowData) => montoBodyTemplate(rowData, "montoInicial")}
          sortable
          sortField="montoInicial"
          style={{ minWidth: "140px", textAlign: "right" }}
        />
        <Column
          header="Monto Actual"
          body={(rowData) => montoBodyTemplate(rowData, "montoActual")}
          sortable
          sortField="montoActual"
          style={{ minWidth: "140px", textAlign: "right" }}
        />
        <Column
          header="Tasa %"
          body={tasaBodyTemplate}
          sortable
          sortField="tasaRendimiento"
          style={{ minWidth: "100px", textAlign: "right" }}
        />
        <Column
          header="Periodicidad"
          body={periodicidadBodyTemplate}
          sortable
          sortField="periodicidadPago"
          style={{ minWidth: "140px" }}
        />
        <Column
          header="Renovación Auto"
          body={renovacionBodyTemplate}
          sortable
          sortField="renovacionAutomatica"
          style={{ minWidth: "140px", textAlign: "center" }}
        />
        <Column
          header="Estado"
          body={estadoBodyTemplate}
          sortable
          sortField="estado.estado"
          filter
          filterField="estado.estado"
          filterPlaceholder="Buscar por estado"
          style={{ minWidth: "140px" }}
        />
        <Column
          body={actionBodyTemplate}
          header="Acciones"
          style={{ width: 130, textAlign: "center" }}
        />
      </DataTable>

      <Dialog
        visible={dialogVisible}
        style={{ width: "90vw", maxWidth: "1200px" }}
        header={isEdit ? "Editar Inversión Financiera" : "Nueva Inversión Financiera"}
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <InversionFinancieraForm
          isEdit={isEdit}
          defaultValues={selectedInversion}
          empresaFija={empresaFija}
          onSubmit={handleSubmit}
          onCancel={hideDialog}
          loading={formLoading}
        />
      </Dialog>
    </div>
  );
}