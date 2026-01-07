// src/pages/ComprobanteElectronico.jsx
// Pantalla CRUD profesional para Comprobantes Electrónicos. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Badge } from "primereact/badge";
import { Calendar } from "primereact/calendar";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize, formatearFecha, formatearNumero } from "../utils/utils";
import {
  getComprobanteElectronico,
  enviarComprobanteASunat,
  consultarComprobanteEnSunat,
  anularComprobante,
  deleteComprobanteElectronico,
} from "../api/facturacionElectronica/comprobanteElectronico";
import { getEmpresas } from "../api/empresa";
import { getEntidadesComerciales } from "../api/entidadComercial";
import AccionesSunatComprobante from "../components/comprobanteElectronico/AccionesSunatComprobante";

/**
 * Pantalla profesional para gestión de Comprobantes Electrónicos.
 */
export default function ComprobanteElectronico({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [comprobantes, setComprobantes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [estadoSunatSeleccionado, setEstadoSunatSeleccionado] = useState(null);
  const [comprobantesFiltrados, setComprobantesFiltrados] = useState([]);
  const [clientesUnicos, setClientesUnicos] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  // Filtrar comprobantes cuando cambien los filtros
  useEffect(() => {
    let filtrados = comprobantes;

    // Filtro por empresa
    if (empresaSeleccionada) {
      filtrados = filtrados.filter(
        (item) => Number(item.empresaId) === Number(empresaSeleccionada)
      );
    }

    // Filtro por cliente
    if (clienteSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.entidadComercialId) === Number(clienteSeleccionado)
      );
    }

    // Filtro por rango de fechas
    if (fechaInicio) {
      filtrados = filtrados.filter((item) => {
        const fechaDoc = new Date(item.fechaEmision);
        const fechaIni = new Date(fechaInicio);
        fechaIni.setHours(0, 0, 0, 0);
        return fechaDoc >= fechaIni;
      });
    }

    if (fechaFin) {
      filtrados = filtrados.filter((item) => {
        const fechaDoc = new Date(item.fechaEmision);
        const fechaFinDia = new Date(fechaFin);
        fechaFinDia.setHours(23, 59, 59, 999);
        return fechaDoc <= fechaFinDia;
      });
    }

    // Filtro por estado SUNAT
    if (estadoSunatSeleccionado !== null) {
      if (estadoSunatSeleccionado === "aceptado") {
        filtrados = filtrados.filter((item) => item.nubefactAceptadoPorSunat === true);
      } else if (estadoSunatSeleccionado === "rechazado") {
        filtrados = filtrados.filter((item) => item.nubefactAceptadoPorSunat === false && item.fechaEnvioOSE);
      } else if (estadoSunatSeleccionado === "pendiente") {
        filtrados = filtrados.filter((item) => !item.fechaEnvioOSE);
      }
    }

    setComprobantesFiltrados(filtrados);
  }, [
    empresaSeleccionada,
    clienteSeleccionado,
    fechaInicio,
    fechaFin,
    estadoSunatSeleccionado,
    comprobantes,
  ]);

  // Extraer clientes únicos de los comprobantes
  useEffect(() => {
    const clientesMap = new Map();
    comprobantes.forEach((item) => {
      if (item.entidadComercialId && item.entidadComercial) {
        clientesMap.set(item.entidadComercialId, item.entidadComercial);
      }
    });
    const clientesArray = Array.from(clientesMap.values());
    setClientesUnicos(clientesArray);
  }, [comprobantes]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [comprobantesData, empresasData, clientesData] = await Promise.all([
        getComprobanteElectronico(),
        getEmpresas(),
        getEntidadesComerciales(),
      ]);

      setComprobantes(comprobantesData);
      setEmpresas(empresasData);
      setClientes(clientesData);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los datos.",
      });
    }
    setLoading(false);
  };

  const handleDelete = (rowData) => {
    // Validar permisos de eliminación
    if (!permisos.puedeEliminar) {
      toast.current.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para eliminar registros.",
        life: 3000,
      });
      return;
    }

    // Validar que no esté aceptado por SUNAT
    if (rowData.nubefactAceptadoPorSunat) {
      toast.current.show({
        severity: "warn",
        summary: "No Permitido",
        detail: "No se puede eliminar un comprobante aceptado por SUNAT.",
        life: 3000,
      });
      return;
    }

    setToDelete(rowData);
    setShowConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setShowConfirm(false);
    if (!toDelete) return;
    setLoading(true);
    try {
      await deleteComprobanteElectronico(toDelete.id);
      toast.current.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Comprobante eliminado correctamente.",
      });
      cargarDatos();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.error || "No se pudo eliminar.",
      });
    }
    setLoading(false);
    setToDelete(null);
  };

  const limpiarFiltros = () => {
    setClienteSeleccionado(null);
    setFechaInicio(null);
    setFechaFin(null);
    setEstadoSunatSeleccionado(null);
  };

  const numeroCompletoTemplate = (rowData) => {
    return (
      <div>
        <div style={{ fontWeight: "bold", color: "#1976d2" }}>
          {rowData.numeroCompleto || `ID: ${rowData.id}`}
        </div>
        <div style={{ fontSize: "0.85rem", color: "#666" }}>
          {rowData.tipoComprobante?.descripcion || "N/A"}
        </div>
      </div>
    );
  };

  const empresaTemplate = (rowData) => {
    if (!rowData.empresa) return "N/A";
    return (
      <div>
        <div style={{ fontWeight: "500", color: "#1565c0" }}>
          {rowData.empresa.razonSocial || "Sin nombre"}
        </div>
        <div style={{ fontSize: "0.85rem", color: "#666" }}>
          RUC: {rowData.empresa.ruc || "N/A"}
        </div>
      </div>
    );
  };

  const clienteTemplate = (rowData) => {
    if (!rowData.entidadComercial) return "N/A";
    return (
      <div>
        <div style={{ fontWeight: "500" }}>
          {rowData.razonSocialCliente || rowData.entidadComercial.razonSocial || "Sin nombre"}
        </div>
        <div style={{ fontSize: "0.85rem", color: "#666" }}>
          {rowData.tipoDocumentoCliente?.codigo || ""}: {rowData.numeroDocumentoCliente || "N/A"}
        </div>
      </div>
    );
  };

  const fechaTemplate = (rowData) => {
    return (
      <div>
        <div style={{ fontWeight: "500" }}>
          {formatearFecha(rowData.fechaEmision)}
        </div>
        {rowData.fechaVencimiento && (
          <div style={{ fontSize: "0.85rem", color: "#666" }}>
            Vence: {formatearFecha(rowData.fechaVencimiento)}
          </div>
        )}
      </div>
    );
  };

  const montoTemplate = (rowData) => {
    const simboloMoneda = rowData.moneda?.codigo === "USD" ? "$" : "S/";
    return (
      <div style={{ textAlign: "right" }}>
        <Tag
          value={`${simboloMoneda} ${formatearNumero(rowData.total || 0)}`}
          severity="info"
          style={{
            fontSize: "0.9rem",
            fontWeight: "bold",
            padding: "6px 10px",
          }}
        />
      </div>
    );
  };

  const estadoSunatTemplate = (rowData) => {
    if (!rowData.fechaEnvioOSE) {
      return <Badge value="PENDIENTE" severity="warning" />;
    }

    if (rowData.nubefactAceptadoPorSunat) {
      return <Badge value="ACEPTADO" severity="success" />;
    }

    return <Badge value="RECHAZADO" severity="danger" />;
  };

  const enlacesTemplate = (rowData) => {
    if (!rowData.nubefactEnlacePDF && !rowData.nubefactEnlaceXML) {
      return <span style={{ color: "#999" }}>Sin enlaces</span>;
    }

    return (
      <div style={{ display: "flex", gap: "8px" }}>
        {rowData.nubefactEnlacePDF && (
          <Button
            icon="pi pi-file-pdf"
            className="p-button-rounded p-button-danger p-button-sm"
            onClick={() => window.open(rowData.nubefactEnlacePDF, "_blank")}
            tooltip="Ver PDF"
          />
        )}
        {rowData.nubefactEnlaceXML && (
          <Button
            icon="pi pi-file"
            className="p-button-rounded p-button-info p-button-sm"
            onClick={() => window.open(rowData.nubefactEnlaceXML, "_blank")}
            tooltip="Ver XML"
          />
        )}
        {rowData.nubefactEnlaceCDR && (
          <Button
            icon="pi pi-check-circle"
            className="p-button-rounded p-button-success p-button-sm"
            onClick={() => window.open(rowData.nubefactEnlaceCDR, "_blank")}
            tooltip="Ver CDR"
          />
        )}
      </div>
    );
  };

  const actionBody = (rowData) => (
    <>
      <AccionesSunatComprobante
        comprobante={rowData}
        toast={toast}
        onAccionCompletada={cargarDatos}
        permisos={permisos}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-text p-button-danger p-button-sm"
        onClick={() => handleDelete(rowData)}
        aria-label="Eliminar"
        tooltip={
          rowData.nubefactAceptadoPorSunat
            ? "No se puede eliminar un comprobante aceptado por SUNAT"
            : "Eliminar"
        }
        disabled={!permisos.puedeEliminar || rowData.nubefactAceptadoPorSunat}
      />
    </>
  );

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={showConfirm}
        onHide={() => setShowConfirm(false)}
        message="¿Está seguro que desea eliminar este comprobante electrónico?"
        header="Confirmar eliminación"
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        accept={handleDeleteConfirm}
        reject={() => setShowConfirm(false)}
      />
      {/* ConfirmDialog global para confirmDialog() de componentes hijos */}
      <ConfirmDialog />
      <DataTable
        value={comprobantesFiltrados}
        loading={loading}
        dataKey="id"
        paginator
        size="small"
        showGridlines
        stripedRows
        rows={5}
        rowsPerPageOptions={[5, 10, 15, 20]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} comprobantes"
        sortField="id"
        sortOrder={-1}
        style={{
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
                <h2>Comprobantes Electrónicos</h2>
              </div>
              <div style={{ flex: 2 }}>
                <label htmlFor="empresaFiltro" style={{ fontWeight: "bold" }}>
                  Empresa*
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
                      detail: "Datos actualizados correctamente desde el servidor",
                      life: 3000,
                    });
                  }}
                  loading={loading}
                  tooltip="Actualizar todos los datos desde el servidor"
                  tooltipOptions={{ position: "bottom" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  label="Limpiar Filtros"
                  icon="pi pi-filter-slash"
                  className="p-button-secondary"
                  outlined
                  onClick={limpiarFiltros}
                  disabled={loading}
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
              <div style={{ flex: 2 }}>
                <label htmlFor="clienteFiltro" style={{ fontWeight: "bold" }}>
                  Cliente
                </label>
                <Dropdown
                  id="clienteFiltro"
                  value={clienteSeleccionado}
                  options={clientesUnicos.map((c) => ({
                    label: c.razonSocial,
                    value: Number(c.id),
                  }))}
                  onChange={(e) => setClienteSeleccionado(e.value)}
                  placeholder="Todos"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  filter
                  disabled={loading}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="fechaInicio" style={{ fontWeight: "bold" }}>
                  Desde
                </label>
                <Calendar
                  id="fechaInicio"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.value)}
                  placeholder="Fecha inicio"
                  dateFormat="dd/mm/yy"
                  showIcon
                  showButtonBar
                  disabled={loading}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="fechaFin" style={{ fontWeight: "bold" }}>
                  Hasta
                </label>
                <Calendar
                  id="fechaFin"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.value)}
                  placeholder="Fecha fin"
                  dateFormat="dd/mm/yy"
                  showIcon
                  showButtonBar
                  disabled={loading}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="estadoSunatFiltro" style={{ fontWeight: "bold" }}>
                  Estado SUNAT
                </label>
                <Dropdown
                  id="estadoSunatFiltro"
                  value={estadoSunatSeleccionado}
                  options={[
                    { label: "Pendiente", value: "pendiente" },
                    { label: "Aceptado", value: "aceptado" },
                    { label: "Rechazado", value: "rechazado" },
                  ]}
                  onChange={(e) => setEstadoSunatSeleccionado(e.value)}
                  placeholder="Todos"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        }
      >
        <Column
          field="numeroCompleto"
          header="Número"
          body={numeroCompletoTemplate}
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          field="empresa.razonSocial"
          header="Empresa"
          body={empresaTemplate}
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          field="razonSocialCliente"
          header="Cliente"
          body={clienteTemplate}
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          field="fechaEmision"
          header="Fecha"
          body={fechaTemplate}
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          field="total"
          header="Total"
          body={montoTemplate}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          header="Estado SUNAT"
          body={estadoSunatTemplate}
          style={{ minWidth: "120px" }}
        />
        <Column
          header="Enlaces"
          body={enlacesTemplate}
          style={{ minWidth: "150px" }}
        />
        <Column
          body={actionBody}
          header="Acciones"
          style={{ width: 200, textAlign: "center" }}
        />
      </DataTable>
    </div>
  );
}