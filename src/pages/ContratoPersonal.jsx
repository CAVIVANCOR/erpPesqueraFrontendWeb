// src/pages/ContratoPersonal.jsx
// Contratos de personal (planilla o locación de servicios) con sus líneas de pago.
// Layout: patrón de LineaCredito.jsx (header con empresa y filtros, DataTable con expansión, Dialog maximizado).
import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import {
  getContratosPersonal,
  getContratoPersonalById,
  createContratoPersonal,
  updateContratoPersonal,
  deleteContratoPersonal,
} from "../api/recursosHumanos/contratoPersonal";
import ContratoPersonalForm from "../components/contratoPersonal/ContratoPersonalForm";
import EmpresaSelector from "../components/common/EmpresaSelector";
import { getPersonal } from "../api/personal";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize, formatearFecha } from "../utils/utils";
import { mensajeDeError } from "../utils/mensajeError";

const OPCIONES_TIPO = [
  { label: "Planilla", value: "false" },
  { label: "Locación de servicios", value: "true" },
];

const OPCIONES_ESTADO = [
  { label: "Activos", value: "true" },
  { label: "Inactivos", value: "false" },
];

const formatearMonto = (valor) =>
  Number(valor || 0).toLocaleString("es-PE", { style: "currency", currency: "PEN" });

const ContratoPersonal = ({ ruta }) => {
  const permisos = usePermissions(ruta);
  const usuario = useAuthStore((state) => state.usuario);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [visible, setVisible] = useState(false);
  const [contratoSeleccionado, setContratoSeleccionado] = useState(null);
  const [empresaId, setEmpresaId] = useState(null);
  const [tipoFiltro, setTipoFiltro] = useState(null);
  const [estadoFiltro, setEstadoFiltro] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  // Personal para mostrar quién creó o modificó cada registro (AuditoriaDialog)
  const [personalAuditoria, setPersonalAuditoria] = useState([]);

  const personalId = usuario?.personalId ? Number(usuario.personalId) : null;

  useEffect(() => {
    getPersonal()
      .then((data) => setPersonalAuditoria(data || []))
      .catch((error) => mostrarError(error, "No se pudo cargar el personal para la auditoría"));
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [empresaId, tipoFiltro, estadoFiltro]);

  const mostrarError = (error, accionFallida) => {
    toast.current?.show({ severity: "error", summary: "Error", detail: mensajeDeError(error, accionFallida), life: 5000 });
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const filtros = {};
      if (empresaId) filtros.empresaId = empresaId;
      if (tipoFiltro) filtros.esLocacionServicios = tipoFiltro;
      if (estadoFiltro) filtros.activo = estadoFiltro;
      setContratos((await getContratosPersonal(filtros)) || []);
    } catch (error) {
      mostrarError(error, "No se pudieron cargar los contratos de personal");
    } finally {
      setLoading(false);
    }
  };

  const contratosFiltrados = contratos.filter((contrato) => {
    const texto = globalFilter.trim().toLowerCase();
    if (!texto) return true;
    return [contrato.personal?.apellidos, contrato.personal?.nombres, contrato.personal?.numeroDocumento, contrato.empresa?.razonSocial]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(texto);
  });

  const handleNew = () => {
    setContratoSeleccionado(null);
    setVisible(true);
  };

  const handleEdit = async (contrato) => {
    try {
      setLoading(true);
      setContratoSeleccionado(await getContratoPersonalById(contrato.id));
      setVisible(true);
    } catch (error) {
      mostrarError(error, "No se pudo cargar el contrato de personal");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setVisible(false);
    setContratoSeleccionado(null);
  };

  const handleSave = async (data) => {
    const esEdicion = Boolean(contratoSeleccionado);
    if (esEdicion && !permisos.puedeEditar) {
      toast.current?.show({ severity: "warn", summary: "Acceso Denegado", detail: "No tiene permisos para editar", life: 3000 });
      return;
    }
    if (!esEdicion && !permisos.puedeCrear) {
      toast.current?.show({ severity: "warn", summary: "Acceso Denegado", detail: "No tiene permisos para crear", life: 3000 });
      return;
    }
    try {
      setGuardando(true);
      if (esEdicion) {
        await updateContratoPersonal(contratoSeleccionado.id, { ...data, actualizadoPor: personalId });
      } else {
        await createContratoPersonal({ ...data, creadoPor: personalId });
      }
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: esEdicion ? "Contrato actualizado correctamente" : "Contrato registrado correctamente",
        life: 3000,
      });
      handleCancel();
      cargarDatos();
    } catch (error) {
      mostrarError(error, "No se pudo guardar el contrato de personal");
    } finally {
      setGuardando(false);
    }
  };

  const handleDelete = (contrato) => {
    if (!permisos.puedeEliminar) {
      toast.current?.show({ severity: "warn", summary: "Acceso Denegado", detail: "No tiene permisos para eliminar", life: 3000 });
      return;
    }
    confirmDialog({
      message: `¿Está seguro de eliminar el contrato de ${contrato.personal?.apellidos} ${contrato.personal?.nombres}?`,
      header: "Confirmar eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "No",
      accept: async () => {
        try {
          setLoading(true);
          await deleteContratoPersonal(contrato.id);
          toast.current?.show({ severity: "success", summary: "Éxito", detail: "Contrato eliminado correctamente", life: 3000 });
          cargarDatos();
        } catch (error) {
          mostrarError(error, "No se pudo eliminar el contrato de personal");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // ── Plantillas de celdas ───────────────────────────────────

  const personalBodyTemplate = (contrato) => (
    <div>
      <strong>
        {contrato.personal?.apellidos} {contrato.personal?.nombres}
      </strong>
      <br />
      <small style={{ color: "#666" }}>{contrato.personal?.numeroDocumento}</small>
    </div>
  );

  const tipoBodyTemplate = (contrato) => (
    <Tag
      value={contrato.esLocacionServicios ? "LOCACIÓN" : "PLANILLA"}
      severity={contrato.esLocacionServicios ? "warning" : "info"}
    />
  );

  const remuneracionBodyTemplate = (contrato) => (
    <span>
      {formatearMonto(contrato.remuneracionBasica)}
      <small style={{ color: "#666" }}> {contrato.esJornal ? "/ día" : "/ mes"}</small>
    </span>
  );

  const periodicidadBodyTemplate = (contrato) =>
    contrato.pagaPorTemporada ? "Por temporada" : `Cada ${contrato.periodicidadDias} días`;

  const vigenciaBodyTemplate = (contrato) =>
    contrato.fechaFin ? formatearFecha(contrato.fechaFin) : <Tag value="VIGENTE" severity="success" />;

  const beneficiosBodyTemplate = (contrato) => (
    <Tag
      value={contrato.liquidaBeneficiosEnBoleta ? "EN BOLETA" : "PROVISIÓN"}
      severity={contrato.liquidaBeneficiosEnBoleta ? "help" : "secondary"}
    />
  );

  const estadoBodyTemplate = (contrato) => (
    <Tag value={contrato.activo ? "ACTIVO" : "INACTIVO"} severity={contrato.activo ? "success" : "danger"} />
  );

  const accionesBodyTemplate = (contrato) => (
    <div className="flex gap-2">
      <Button
        icon={permisos.puedeEditar ? "pi pi-pencil" : "pi pi-eye"}
        rounded
        outlined
        className="p-button-warning"
        onClick={() => handleEdit(contrato)}
        tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
        tooltipOptions={{ position: "top" }}
      />
      <Button
        icon="pi pi-trash"
        rounded
        outlined
        severity="danger"
        onClick={() => handleDelete(contrato)}
        disabled={!permisos.puedeEliminar}
        tooltip="Eliminar"
        tooltipOptions={{ position: "top" }}
      />
    </div>
  );

  const descripcionLinea = (linea) => {
    if (linea.esSaldo) return "Saldo (lo que queda)";
    if (linea.esCalculada) return "Calculada por la planilla";
    if (linea.porcentaje !== null && linea.porcentaje !== undefined) return `${Number(linea.porcentaje).toFixed(2)} %`;
    return formatearMonto(linea.monto);
  };

  const rowExpansionTemplate = (contrato) => (
    <div style={{ padding: "0.5rem 1rem" }}>
      <h5 style={{ marginTop: 0 }}>Líneas de pago</h5>
      <DataTable value={contrato.lineasPago || []} size="small" showGridlines emptyMessage="Este contrato no tiene líneas de pago">
        <Column field="orden" header="#" style={{ width: 60 }} />
        <Column
          header="Destino"
          body={(linea) => <Tag value={linea.esPlanilla ? "PLANILLA" : "HONORARIOS"} severity={linea.esPlanilla ? "info" : "warning"} />}
        />
        <Column header="Importe" body={descripcionLinea} />
      </DataTable>
    </div>
  );

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
          <h3 style={{ margin: 0 }}>Contratos de Personal</h3>
          <small style={{ color: "#666", fontWeight: "normal" }}>Total de registros: {contratosFiltrados.length}</small>
        </div>
        <div style={{ flex: 2 }}>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}>Empresa</label>
          <EmpresaSelector permitirLimpiar onEmpresaChange={(id) => setEmpresaId(id)} />
        </div>
        <div style={{ flex: 1.5 }}>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}>Tipo</label>
          <Dropdown
            value={tipoFiltro}
            options={OPCIONES_TIPO}
            onChange={(e) => setTipoFiltro(e.value)}
            placeholder="Todos"
            showClear
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1.2 }}>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}>Estado</label>
          <Dropdown
            value={estadoFiltro}
            options={OPCIONES_ESTADO}
            onChange={(e) => setEstadoFiltro(e.value)}
            placeholder="Todos"
            showClear
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 2 }}>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}>Buscar</label>
          <span className="p-input-icon-left" style={{ width: "100%" }}>
            <i className="pi pi-search" />
            <InputText
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Trabajador, documento o empresa"
              style={{ width: "100%" }}
            />
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <Button
            label="Nuevo"
            icon="pi pi-plus"
            className="p-button-success"
            severity="success"
            raised
            onClick={handleNew}
            disabled={!permisos.puedeCrear || loading}
            tooltip={!permisos.puedeCrear ? "No tiene permisos para crear" : "Nuevo contrato"}
            style={{ width: "100%" }}
            size="small"
          />
        </div>
        <div style={{ flex: 0.6 }}>
          <Button
            icon="pi pi-refresh"
            className="p-button-outlined p-button-info"
            onClick={cargarDatos}
            loading={loading}
            tooltip="Actualizar"
            tooltipOptions={{ position: "top" }}
            style={{ width: "100%" }}
            size="small"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="card">
      <Toast ref={toast} />
      <ConfirmDialog />

      <DataTable
        value={contratosFiltrados}
        loading={loading}
        header={header}
        emptyMessage="No se encontraron contratos de personal"
        className="datatable-responsive"
        showGridlines
        stripedRows
        paginator
        rows={15}
        rowsPerPageOptions={[10, 15, 25, 50]}
        dataKey="id"
        expandedRows={expandedRows}
        onRowToggle={(e) => setExpandedRows(e.data)}
        rowExpansionTemplate={rowExpansionTemplate}
        style={{ fontSize: getResponsiveFontSize() }}
      >
        <Column expander style={{ width: "3rem" }} />
        <Column header="Trabajador" body={personalBodyTemplate} />
        <Column header="Empresa" body={(contrato) => contrato.empresa?.razonSocial} />
        <Column header="Tipo" body={tipoBodyTemplate} style={{ width: 120 }} />
        <Column header="Remuneración" body={remuneracionBodyTemplate} style={{ width: 160 }} />
        <Column header="Pago" body={periodicidadBodyTemplate} style={{ width: 130 }} />
        <Column field="fechaInicio" header="Desde" body={(contrato) => formatearFecha(contrato.fechaInicio)} sortable style={{ width: 110 }} />
        <Column header="Hasta" body={vigenciaBodyTemplate} style={{ width: 110 }} />
        <Column header="Beneficios" body={beneficiosBodyTemplate} style={{ width: 120 }} />
        <Column header="Estado" body={estadoBodyTemplate} style={{ width: 110 }} />
        <Column header="Acciones" body={accionesBodyTemplate} exportable={false} style={{ width: 120 }} />
      </DataTable>

      {/* Dialog con Formulario */}
      <Dialog
        header={
          contratoSeleccionado
            ? permisos.puedeEditar
              ? "Editar Contrato de Personal"
              : "Ver Contrato de Personal"
            : "Nuevo Contrato de Personal"
        }
        visible={visible}
        style={{ width: "1300px" }}
        maximizable
        maximized={true}
        onHide={handleCancel}
        modal
        key={`contrato-${contratoSeleccionado?.id || "nuevo"}-${empresaId || "sin-empresa"}`}
      >
        <ContratoPersonalForm
          contrato={contratoSeleccionado}
          empresaFija={empresaId}
          personalAuditoria={personalAuditoria}
          onSave={handleSave}
          onCancel={handleCancel}
          readOnly={Boolean(contratoSeleccionado) && !permisos.puedeEditar}
          loading={guardando}
        />
      </Dialog>
    </div>
  );
};

export default ContratoPersonal;
