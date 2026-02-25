import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { ProgressBar } from "primereact/progressbar";
import {
  getAllLineaCredito,
  getLineaCreditoById, // ✅ Agregar este import
  deleteLineaCredito,
} from "../../api/tesoreria/lineaCredito";
import { getEmpresas } from "../../api/empresa";
import { getAllBancos } from "../../api/banco";
import { getAllMonedas } from "../../api/moneda";
import { getEstadosMultiFuncionPorTipoProviene } from "../../api/estadoMultiFuncion";
import LineaCreditoForm from "../../components/tesoreria/LineaCreditoForm";
import ReporteLineasDisponibles from "../../components/tesoreria/ReporteLineasDisponibles";
import { getResponsiveFontSize } from "../../utils/utils";
import { usePermissions } from "../../hooks/usePermissions";

const LineaCredito = ({ ruta }) => {
  const permisos = usePermissions(ruta);

  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const formRef = useRef(null);

  // Estados para el Dialog
  const [visible, setVisible] = useState(false);
  const [lineaSeleccionada, setLineaSeleccionada] = useState(null);
  const [empresaFija, setEmpresaFija] = useState(null);

  // Estados para la lista
  const [lineas, setLineas] = useState([]);
  const [lineasFiltradas, setLineasFiltradas] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [estados, setEstados] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [bancoSeleccionado, setBancoSeleccionado] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [monedaSeleccionada, setMonedaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [mostrarReporte, setMostrarReporte] = useState(false);
  // Estados para catálogos filtrados dinámicamente
  const [bancosFiltrados, setBancosFiltrados] = useState([]);
  const [estadosFiltrados, setEstadosFiltrados] = useState([]);
  const [monedasFiltradas, setMonedasFiltradas] = useState([]);

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  // Filtrar líneas por múltiples criterios
  useEffect(() => {
    let filtradas = [...lineas];

    if (empresaSeleccionada) {
      filtradas = filtradas.filter(
        (linea) => Number(linea.empresaId) === Number(empresaSeleccionada),
      );
    }

    if (bancoSeleccionado) {
      filtradas = filtradas.filter(
        (linea) => Number(linea.bancoId) === Number(bancoSeleccionado),
      );
    }

    if (estadoSeleccionado) {
      filtradas = filtradas.filter(
        (linea) => Number(linea.estadoId) === Number(estadoSeleccionado),
      );
    }

    if (monedaSeleccionada) {
      filtradas = filtradas.filter(
        (linea) => Number(linea.monedaId) === Number(monedaSeleccionada),
      );
    }

    setLineasFiltradas(filtradas);
  }, [
    empresaSeleccionada,
    bancoSeleccionado,
    estadoSeleccionado,
    monedaSeleccionada,
    lineas,
  ]);

  // ⭐ FILTRADO DINÁMICO EN CASCADA - Actualizar opciones de dropdowns
  useEffect(() => {
    // Obtener líneas que cumplen con TODOS los filtros activos
    let lineasFiltradas = lineas;

    if (empresaSeleccionada) {
      lineasFiltradas = lineasFiltradas.filter(
        (linea) => Number(linea.empresaId) === Number(empresaSeleccionada),
      );
    }

    if (bancoSeleccionado) {
      lineasFiltradas = lineasFiltradas.filter(
        (linea) => Number(linea.bancoId) === Number(bancoSeleccionado),
      );
    }

    if (estadoSeleccionado) {
      lineasFiltradas = lineasFiltradas.filter(
        (linea) => Number(linea.estadoId) === Number(estadoSeleccionado),
      );
    }

    if (monedaSeleccionada) {
      lineasFiltradas = lineasFiltradas.filter(
        (linea) => Number(linea.monedaId) === Number(monedaSeleccionada),
      );
    }

    // Extraer IDs únicos de las líneas filtradas
    const bancosIds = [
      ...new Set(lineasFiltradas.map((l) => Number(l.bancoId))),
    ];
    const estadosIds = [
      ...new Set(lineasFiltradas.map((l) => Number(l.estadoId))),
    ];
    const monedasIds = [
      ...new Set(lineasFiltradas.map((l) => Number(l.monedaId))),
    ];

    // Filtrar catálogos completos para mostrar solo opciones disponibles
    setBancosFiltrados(bancos.filter((b) => bancosIds.includes(Number(b.id))));
    setEstadosFiltrados(
      estados.filter((e) => estadosIds.includes(Number(e.id))),
    );
    setMonedasFiltradas(
      monedas.filter((m) => monedasIds.includes(Number(m.id))),
    );
  }, [
    empresaSeleccionada,
    bancoSeleccionado,
    estadoSeleccionado,
    monedaSeleccionada,
    lineas,
    bancos,
    estados,
    monedas,
  ]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [lineasData, empresasData, bancosData, monedasData, estadosData] =
        await Promise.all([
          getAllLineaCredito(),
          getEmpresas(),
          getAllBancos(),
          getAllMonedas(),
          getEstadosMultiFuncionPorTipoProviene(22),
        ]);
      setLineas(lineasData);
      setEmpresas(empresasData);
      setBancos(bancosData);
      setMonedas(monedasData);
      setEstados(estadosData);
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

  const handleNew = () => {
    setLineaSeleccionada(null);
    setEmpresaFija(empresaSeleccionada);
    setVisible(true);
  };

  const handleEdit = (linea) => {
    setLineaSeleccionada(linea);
    setEmpresaFija(null);
    setVisible(true);
  };

  const handleSave = async (lineaId) => {
    // Recargar solo la línea editada para mantener el formulario abierto con datos actualizados
    if (lineaId) {
      try {
        const lineaActualizada = await getLineaCreditoById(lineaId);
        setLineaSeleccionada(lineaActualizada);
        // Recargar también la lista en segundo plano
        cargarDatos();
      } catch (error) {
        console.error("Error al recargar línea:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al recargar datos de la línea",
          life: 3000,
        });
      }
    } else {
      // Si es nueva línea, cerrar el dialog y recargar lista
      setVisible(false);
      setLineaSeleccionada(null);
      setEmpresaFija(null);
      cargarDatos();
    }
  };

  const handleCancel = () => {
    setVisible(false);
    setLineaSeleccionada(null);
    setEmpresaFija(null);
  };

  const confirmarEliminar = (linea) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la línea ${linea.numeroLinea}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí",
      rejectLabel: "No",
      accept: () => eliminarLinea(linea.id),
    });
  };

  const eliminarLinea = async (id) => {
    try {
      await deleteLineaCredito(id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Línea de crédito eliminada",
        life: 3000,
      });
      cargarDatos();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message || "Error al eliminar línea de crédito",
        life: 3000,
      });
    }
  };

  const limpiarFiltros = () => {
    setEmpresaSeleccionada(null);
    setBancoSeleccionado(null);
    setEstadoSeleccionado(null);
    setMonedaSeleccionada(null);
    setGlobalFilter("");

    // Resetear catálogos filtrados a sus valores completos
    setBancosFiltrados(bancos);
    setEstadosFiltrados(estados);
    setMonedasFiltradas(monedas);
  };

  // Funciones de formato
  const formatCurrency = (value, moneda = "USD") => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: moneda,
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString("es-PE");
  };

  // Templates para las columnas
  const empresaBodyTemplate = (rowData) => {
    return rowData.empresa?.razonSocial || "";
  };

  const bancoBodyTemplate = (rowData) => {
    return rowData.banco?.nombre || "";
  };

  const montoBodyTemplate = (rowData) => {
    const moneda = rowData.moneda?.codigo || "USD";
    return formatCurrency(rowData.montoAprobado, moneda);
  };

  const utilizadoBodyTemplate = (rowData) => {
    const moneda = rowData.moneda?.codigo || "USD";
    return formatCurrency(rowData.montoUtilizado || 0, moneda);
  };

  const disponibleBodyTemplate = (rowData) => {
    const moneda = rowData.moneda?.codigo || "USD";
    return formatCurrency(rowData.montoDisponible || 0, moneda);
  };

  const sobregirosBodyTemplate = (rowData) => {
    const totalSobregiros = parseFloat(rowData.totalSobregiros || 0);
    const moneda = rowData.moneda?.codigo || "USD";

    if (totalSobregiros === 0) {
      return <span style={{ color: "#6c757d" }}>-</span>;
    }

    return (
      <span style={{ color: "#dc3545", fontWeight: "bold" }}>
        {formatCurrency(totalSobregiros, moneda)}
      </span>
    );
  };

  const porcentajeBodyTemplate = (rowData) => {
    const porcentaje =
      rowData.montoAprobado > 0
        ? (
            ((rowData.montoUtilizado || 0) / rowData.montoAprobado) *
            100
          ).toFixed(2)
        : 0;

    let severity = "success";
    if (porcentaje > 80) severity = "danger";
    else if (porcentaje > 60) severity = "warning";

    return (
      <div>
        <ProgressBar
          value={porcentaje}
          showValue={false}
          style={{ height: "6px" }}
          color={severity}
        />
        <span className="text-sm">{porcentaje}%</span>
      </div>
    );
  };

  const estadoBodyTemplate = (rowData) => {
    const getSeverity = (estado) => {
      switch (estado?.nombre) {
        case "APROBADA":
          return "info";
        case "VIGENTE":
          return "success";
        case "VENCIDA":
          return "danger";
        case "CANCELADA":
          return "warning";
        case "SUSPENDIDA":
          return "danger";
        default:
          return "secondary";
      }
    };

    return (
      <Tag
        value={rowData.estado?.nombre || ""}
        severity={getSeverity(rowData.estado)}
      />
    );
  };

  const fechaVencimientoBodyTemplate = (rowData) => {
    return formatDate(rowData.fechaVencimiento);
  };

  const accionesBodyTemplate = (rowData) => {
    return (
      <>
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-sm"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(rowData);
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
            confirmarEliminar(rowData);
          }}
          aria-label="Eliminar"
          tooltip="Eliminar"
          disabled={!permisos.puedeEliminar}
        />
      </>
    );
  };

  // Header del DataTable con filtros
  const header = (
    <div>
      <div
        style={{
          alignItems: "end",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
          marginBottom: 15,
        }}
      >
        <div style={{ flex: 2 }}>
          <h3 style={{ margin: 0 }}>Líneas de Crédito</h3>
          <small style={{ color: "#666", fontWeight: "normal" }}>
            Total de registros: {lineasFiltradas.length}
          </small>
        </div>
        <div style={{ flex: 2 }}>
          <label
            htmlFor="empresaFiltro"
            style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}
          >
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
            label="Nueva Línea"
            icon="pi pi-plus"
            className="p-button-success"
            severity="success"
            raised
            onClick={handleNew}
            disabled={!permisos.puedeCrear || loading || !empresaSeleccionada}
            tooltip={
              !permisos.puedeCrear
                ? "No tiene permisos para crear"
                : !empresaSeleccionada
                  ? "Seleccione una empresa primero"
                  : "Nueva Línea de Crédito"
            }
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Button
            label="Reporte"
            icon="pi pi-chart-bar"
            className="p-button-info"
            onClick={() => setMostrarReporte(true)}
            tooltip="Ver reporte de líneas disponibles"
            tooltipOptions={{ position: "top" }}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Button
            icon="pi pi-refresh"
            className="p-button-outlined p-button-info"
            onClick={async () => {
              await cargarDatos();
              toast.current?.show({
                severity: "success",
                summary: "Actualizado",
                detail: "Datos actualizados correctamente",
                life: 3000,
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
          marginBottom: 15,
        }}
      >
        <div style={{ flex: 1 }}>
          <label
            htmlFor="bancoFiltro"
            style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}
          >
            Banco
          </label>
          <Dropdown
            id="bancoFiltro"
            value={bancoSeleccionado}
            options={bancosFiltrados.map((b) => ({
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
          <label
            htmlFor="estadoFiltro"
            style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}
          >
            Estado
          </label>
          <Dropdown
            id="estadoFiltro"
            value={estadoSeleccionado}
            options={estadosFiltrados.map((e) => ({
              label: e.descripcion || e.nombre,
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
          <label
            htmlFor="monedaFiltro"
            style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}
          >
            Moneda
          </label>
          <Dropdown
            id="monedaFiltro"
            value={monedaSeleccionada}
            options={monedasFiltradas.map((m) => ({
              label: m.codigoSunat,
              value: Number(m.id),
            }))}
            onChange={(e) => setMonedaSeleccionada(e.value)}
            placeholder="Todas"
            optionLabel="label"
            optionValue="value"
            showClear
            disabled={loading}
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

  return (
    <div className="card">
      <Toast ref={toast} />
      <ConfirmDialog />

      <DataTable
        value={lineasFiltradas}
        loading={loading}
        header={header}
        globalFilter={globalFilter}
        emptyMessage="No se encontraron líneas de crédito"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        className="datatable-responsive"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} líneas"
        sortField="numeroLinea"
        sortOrder={-1}
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar
            ? (e) => handleEdit(e.data)
            : undefined
        }
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
      >
        <Column field="numeroLinea" header="Número" sortable />
        <Column body={empresaBodyTemplate} header="Empresa" sortable />
        <Column body={bancoBodyTemplate} header="Banco" sortable />
        <Column body={montoBodyTemplate} header="Límite" sortable />
        <Column body={utilizadoBodyTemplate} header="Utilizado" sortable />
        <Column body={sobregirosBodyTemplate} header="Sobregiro" sortable />
        <Column body={disponibleBodyTemplate} header="Disponible" sortable />
        <Column body={porcentajeBodyTemplate} header="% Utilizado" />
        <Column
          body={fechaVencimientoBodyTemplate}
          header="Vencimiento"
          sortable
        />
        <Column body={estadoBodyTemplate} header="Estado" sortable />
        <Column
          body={accionesBodyTemplate}
          header="Acciones"
          style={{ width: 130, textAlign: "center" }}
        />
      </DataTable>

      {/* Dialog con Formulario */}
      <Dialog
        header={
          lineaSeleccionada
            ? permisos.puedeEditar
              ? "Editar Línea de Crédito"
              : "Ver Línea de Crédito"
            : "Nueva Línea de Crédito"
        }
        visible={visible}
        style={{ width: "1300px" }}
        maximizable
        maximized={true}
        onHide={handleCancel}
        modal
      >
        <LineaCreditoForm
          ref={formRef}
          lineaCredito={lineaSeleccionada}
          empresaFija={empresaFija}
          onSave={handleSave}
          onCancel={handleCancel}
          readOnly={lineaSeleccionada && !permisos.puedeEditar}
        />
      </Dialog>

      {/* Dialog con Reporte Líneas Disponibles */}
      <Dialog
        header="Reporte de Líneas Disponibles"
        visible={mostrarReporte}
        style={{ width: "1300px" }}
        onHide={() => setMostrarReporte(false)}
        maximizable
        maximized={true}
        modal
      >
        <ReporteLineasDisponibles />
      </Dialog>
    </div>
  );
};

export default LineaCredito;
