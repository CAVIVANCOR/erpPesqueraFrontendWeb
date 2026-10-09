/**
 * DetContratistasOTCard.jsx
 *
 * Card para gestionar los contratistas asociados a una Orden de Trabajo de Mantenimiento.
 * Incluye funcionalidad CRUD completa con DataTable, validaciones y gestión de repuestos.
 *
 * CORRECCIÓN v1.2.0: ProductoSelector y ActivoSelector ahora cargan datos internamente
 * - Se eliminó la carga de productos y activos en este componente
 * - Se usa empresaIdPreseleccionada para filtrar por empresa de la OT
 *
 * @author ERP Megui
 * @version 1.2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Panel } from "primereact/panel";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import ActivoSelector from "../common/ActivoSelector";
import EntidadComercialSelector from "../common/EntidadComercialSelector";
import { Toast } from "primereact/toast";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Toolbar } from "primereact/toolbar";
import { Message } from "primereact/message";
import { formatearNumero } from "../../utils/utils";
import {
  getDetallesContratistas,
  getDetallesPorOrdenTrabajo,
  getDetalleContratistaPorId,
  createDetContratistaOT,
  updateDetContratistaOT,
  eliminarDetalleContratista,
  getDocumentosCompraPorPresupuesto,
} from "../../api/detContratistasOT";
import GenerarDocumentoCompraDialog from "./GenerarDocumentoCompraDialog";
import DetRepuestosContratistaOTTab from "./DetRepuestosContratistaOTTab";
import PdfPresupuestoContratistaCard from "./PdfPresupuestoContratistaCard";
import { getContratistas } from "../../api/contratista";
import { consultarTipoCambioSunat } from "../../api/consultaExterna";
import { useAuthStore } from "../../shared/stores/useAuthStore";

export default function DetContratistasOTCard({
  otMantenimientoId,
  empresaId,
  monedaIdOT,
  monedas = [],
  estadosContratista = [],
  puedeEditar = true,
  onCountChange,
  readOnly = false,
  permisos = {},
}) {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);

  // Estados principales
  const [contratistas, setContratistas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingContratista, setEditingContratista] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Estados para combos
  const [contratistasOptions, setContratistasOptions] = useState([]);

  // Documento de compra generado desde un presupuesto
  const [dialogDocVisible, setDialogDocVisible] = useState(false);
  const [presupuestoDoc, setPresupuestoDoc] = useState(null);
  const [documentosGenerados, setDocumentosGenerados] = useState([]);
  const fechaInicialRef = useRef(null);

  // Estados del formulario
  const [formData, setFormData] = useState({
    id: null,
    otMantenimientoId: null,
    numeroLinea: 1,
    contratistaId: null,
    fechaPresupuesto: new Date(),
    tipoCambio: null,
    activoId: null,
    servicioDescripcion: "",
    montoPactado: 0,
    montoPagado: 0,
    saldo: 0,
    monedaId: null,
    estadoId: null,
    urlDocumentoContratista: "",
    urlFotosProductos: "",
    urlFotosAntes: "",
    urlFotosDespues: "",
  });

  // Cargar contratistas cuando cambie la OT
  useEffect(() => {
    if (otMantenimientoId) {
      cargarContratistas();
    } else {
      setContratistas([]);
    }
  }, [otMantenimientoId]);

  // Notificar cambios en el contador
  useEffect(() => {
    if (onCountChange) {
      onCountChange(contratistas.length);
    }
  }, [contratistas, onCountChange]);

  // Cargar tipo de cambio SUNAT cuando cambia la fecha del presupuesto
  useEffect(() => {
    const cargarTipoCambio = async () => {
      if (!formData.fechaPresupuesto) return;

      const fechaISO =
        formData.fechaPresupuesto instanceof Date
          ? formData.fechaPresupuesto.toISOString().split("T")[0]
          : String(formData.fechaPresupuesto).split("T")[0];

      // Si es la fecha original y ya hay TC cargado, no consultar
      if (
        fechaInicialRef.current === fechaISO &&
        formData.tipoCambio
      ) {
        return;
      }

      try {
        const data = await consultarTipoCambioSunat({
          date: fechaISO,
        });
        const tc = data?.sell_price ? parseFloat(data.sell_price) : null;
        if (tc) {
          setFormData((prev) => ({
            ...prev,
            tipoCambio: Number(tc.toFixed(3)),
          }));
        }
      } catch (error) {
        console.error("Error al obtener tipo de cambio SUNAT:", error);
      }
    };
    cargarTipoCambio();
  }, [formData.fechaPresupuesto]);

  // Cargar opciones de combos cuando cambie la empresa
  useEffect(() => {
    if (empresaId) {
      cargarOpcionesCombos();
    }
  }, [empresaId]);

  /**
   * Cargar contratistas de la OT
   */
  const cargarContratistas = async () => {
    if (!otMantenimientoId) return;

    try {
      setLoading(true);
      const data = await getDetallesPorOrdenTrabajo(otMantenimientoId);
      setContratistas(data);
    } catch (error) {
      console.error("Error al cargar contratistas:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los contratistas",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cargar opciones para los combos
   * NOTA: ProductoSelector y ActivoSelector ahora cargan sus propios datos internamente
   */
  const cargarOpcionesCombos = async () => {
    try {
      const contratistasData = await getContratistas(empresaId);

      // Filtrar contratistas por empresa
      const contratistasFiltrados = contratistasData.filter(
        (c) => Number(c.empresaId) === Number(empresaId),
      );
      setContratistasOptions(contratistasFiltrados);
    } catch (error) {
      console.error("Error al cargar opciones:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las opciones",
        life: 3000,
      });
    }
  };

  /**
   * Abrir diálogo para nuevo contratista
   */
  const handleNuevoContratista = () => {
    if (!otMantenimientoId) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la OT primero",
        life: 3000,
      });
      return;
    }

    const nuevoNumeroLinea =
      contratistas.length > 0
        ? Math.max(...contratistas.map((c) => c.numeroLinea)) + 1
        : 1;

    setDocumentosGenerados([]);
    setFormData({
      id: null,
      otMantenimientoId: otMantenimientoId,
      numeroLinea: nuevoNumeroLinea,
      contratistaId: null,
      fechaPresupuesto: new Date(),
      tipoCambio: null,
      activoId: null,
      servicioDescripcion: "",
      montoPactado: 0,
      montoPagado: 0,
      saldo: 0,
      monedaId: monedas[0]?.id || null,
      estadoId: estadosContratista[0]?.id || null,
      urlDocumentoContratista: "",
      urlFotosProductos: "",
      urlFotosAntes: "",
      urlFotosDespues: "",
    });
    setEditingContratista(null);
    setDialogVisible(true);
  };

  /**
   * Abrir diálogo para editar contratista
   */
  const handleEditarContratista = (contratista) => {
    setDocumentosGenerados([]);
    setFormData({
      id: contratista.id,
      otMantenimientoId: contratista.otMantenimientoId,
      numeroLinea: contratista.numeroLinea,
      contratistaId: Number(contratista.contratistaId),
      fechaPresupuesto: contratista.fechaPresupuesto
        ? new Date(contratista.fechaPresupuesto)
        : new Date(),
      tipoCambio: contratista.tipoCambio
        ? Number(contratista.tipoCambio)
        : null,
      activoId: contratista.activoId ? Number(contratista.activoId) : null,
      servicioDescripcion: contratista.servicioDescripcion || "",
      montoPactado: Number(contratista.montoPactado) || 0,
      montoPagado: Number(contratista.montoPagado) || 0,
      saldo: Number(contratista.saldo) || 0,
      monedaId: Number(contratista.monedaId),
      estadoId: Number(contratista.estadoId),
      urlDocumentoContratista: contratista.urlDocumentoContratista || "",
      urlFotosProductos: contratista.urlFotosProductos || "",
      urlFotosAntes: contratista.urlFotosAntes || "",
      urlFotosDespues: contratista.urlFotosDespues || "",
    });
    setEditingContratista(contratista);
    setDialogVisible(true);
  };

  /**
   * Guardar contratista (crear o actualizar)
   */
  const handleGuardarContratista = async () => {
    try {
      // Validaciones
      if (!formData.contratistaId) {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Debe seleccionar un contratista",
          life: 3000,
        });
        return;
      }

      if (!formData.servicioDescripcion.trim()) {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Debe ingresar una descripción del servicio",
          life: 3000,
        });
        return;
      }

      const payload = {
        ...formData,
        creadoPor: usuario?.id,
        actualizadoPor: usuario?.id,
      };

      setLoading(true);

      if (editingContratista) {
        await updateDetContratistaOT(formData.id, payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Contratista actualizado correctamente",
          life: 3000,
        });
      } else {
        await createDetContratistaOT(payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Contratista creado correctamente",
          life: 3000,
        });
      }

      setDialogVisible(false);
      await cargarContratistas();
    } catch (error) {
      console.error("Error al guardar contratista:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error?.response?.data?.mensaje || "Error al guardar el contratista",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Eliminar contratista
   */
  const handleEliminarContratista = (contratista) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el contratista ${contratista.contratista?.razonSocial}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, Eliminar",
      rejectLabel: "Cancelar",
      accept: async () => {
        try {
          setLoading(true);
          await eliminarDetalleContratista(contratista.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Contratista eliminado correctamente",
            life: 3000,
          });
          await cargarContratistas();
        } catch (error) {
          console.error("Error al eliminar contratista:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail:
              error?.response?.data?.mensaje ||
              "Error al eliminar el contratista",
            life: 3000,
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const cargarDocumentosGenerados = async (presupuestoId) => {
    if (!presupuestoId) return;
    try {
      const docs = await getDocumentosCompraPorPresupuesto(presupuestoId);
      const docsNormalizados = docs.map((d) => ({
        ...d,
        monedaId: Number(d.moneda?.id),
        colorFondo: d.moneda?.colorFondo,
        nombreLargo: d.moneda?.nombreLargo,
        simboloDoc: d.moneda?.simbolo,
      }));
      setDocumentosGenerados(docsNormalizados);
    } catch (error) {
      console.error("Error al cargar documentos del presupuesto:", error);
    }
  };

  useEffect(() => {
    if (dialogVisible && editingContratista && formData.id) {
      const fechaISO =
        formData.fechaPresupuesto instanceof Date
          ? formData.fechaPresupuesto.toISOString().split("T")[0]
          : String(formData.fechaPresupuesto).split("T")[0];
      const hoy = new Date().toISOString().split("T")[0];
      if (fechaISO > hoy) return;
      fechaInicialRef.current = fechaISO;
      cargarDocumentosGenerados(formData.id);
    }
  }, [dialogVisible, editingContratista, formData.id]);

  // Templates para columnas
  const contratistaTemplate = (rowData) => {
    return rowData.contratista?.razonSocial || "N/A";
  };

  const activoTemplate = (rowData) => {
    return rowData.activo?.nombre || "N/A";
  };

  const montoTemplate = (rowData, field) => {
    const moneda = monedas.find(
      (m) => Number(m.id) === Number(rowData.monedaId),
    );
    const simbolo = moneda?.simbolo || "";
    const bg = moneda?.colorFondo;
    return (
      <span
        style={{
          display: "inline-block",
          width: "100%",
          textAlign: "right",
          backgroundColor: bg || "transparent",
          padding: "0.25rem 0.5rem",
        }}
      >
        {simbolo} {formatearNumero(rowData[field])}
      </span>
    );
  };

  const MONEDA_LOCAL_CODIGO = "PEN";

  const convertirAMonedaOT = (monto, monedaPresupuestoId, tipoCambio) => {
    const montoNum = Number(monto || 0);
    if (!monedaIdOT || Number(monedaPresupuestoId) === Number(monedaIdOT)) {
      return montoNum;
    }
    const presupuestoMoneda = monedas.find(
      (m) => Number(m.id) === Number(monedaPresupuestoId),
    );
    const otMoneda = monedas.find((m) => Number(m.id) === Number(monedaIdOT));
    const tc = Number(tipoCambio || 0);
    if (!tc) return null;

    const esLocalOT = otMoneda?.codigoSunat === MONEDA_LOCAL_CODIGO;
    const esLocalPres = presupuestoMoneda?.codigoSunat === MONEDA_LOCAL_CODIGO;

    if (esLocalOT && !esLocalPres) return montoNum * tc;
    if (!esLocalOT && esLocalPres) return montoNum / tc;
    return null;
  };

  const totalEnMonedaOT = (campo) =>
    contratistas.reduce((suma, c) => {
      const convertido = convertirAMonedaOT(c[campo], c.monedaId, c.tipoCambio);
      return convertido !== null ? suma + convertido : suma;
    }, 0);

  const otMoneda = monedas.find((m) => Number(m.id) === Number(monedaIdOT));
  const simboloOT = otMoneda?.simbolo || "";

  const monedaTemplate = (rowData) => {
    const moneda = monedas.find((m) => Number(m.id) === Number(rowData.monedaId));
    const label = moneda?.simbolo || moneda?.codigoSunat || rowData.monedaId || "-";
    const bg = moneda?.colorFondo;
    if (!bg) return label;
    return (
      <span
        style={{
          backgroundColor: bg,
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          fontWeight: "bold",
        }}
      >
        {label}
      </span>
    );
  };

  const subtotalPorMoneda = (monedaId, campo) =>
    contratistas
      .filter((c) => Number(c.monedaId) === Number(monedaId))
      .reduce((suma, c) => suma + Number(c[campo] || 0), 0);

  const rowGroupHeaderTemplate = (data) => {
    const monedaId = data.monedaId ?? data;
    const moneda = monedas.find((m) => Number(m.id) === Number(monedaId));
    const bg = moneda?.colorFondo || "#e9ecef";
    return (
      <span
        style={{
          display: "inline-block",
          width: "100%",
          backgroundColor: bg,
          padding: "0.5rem",
          fontWeight: "bold",
        }}
      >
        {moneda?.nombreLargo || moneda?.descripcion || moneda?.simbolo || monedaId}
      </span>
    );
  };

  const rowGroupFooterTemplate = (data) => {
    const monedaId = data.monedaId ?? data;
    const moneda = monedas.find((m) => Number(m.id) === Number(monedaId));
    const simbolo = moneda?.simbolo || "";
    const bg = moneda?.colorFondo || "#e9ecef";
    const labelStyle = {
      backgroundColor: bg,
      fontWeight: "bold",
      textAlign: "left",
    };
    const numberStyle = {
      backgroundColor: bg,
      fontWeight: "bold",
      textAlign: "right",
    };
    const emptyStyle = { backgroundColor: bg };
    return (
      <>
        <td style={emptyStyle}></td>
        <td style={emptyStyle}></td>
        <td style={labelStyle}>Subtotal {simbolo}</td>
        <td style={emptyStyle}></td>
        <td style={emptyStyle}></td>
        <td style={numberStyle}>
          {formatearNumero(subtotalPorMoneda(monedaId, "montoPactado"))}
        </td>
        <td style={numberStyle}>
          {formatearNumero(subtotalPorMoneda(monedaId, "montoFacturado"))}
        </td>
        <td style={numberStyle}>
          {formatearNumero(subtotalPorMoneda(monedaId, "montoPagado"))}
        </td>
        <td style={numberStyle}>
          {formatearNumero(subtotalPorMoneda(monedaId, "saldo"))}
        </td>
        <td style={emptyStyle}></td>
        <td style={emptyStyle}></td>
      </>
    );
  };

  // ── Templates para documentos de compra generados ──
  const docMonedaTemplate = (rowData) => {
    const bg = rowData.colorFondo;
    const label = rowData.simboloDoc || rowData.moneda?.simbolo || "-";
    if (!bg) return label;
    return (
      <span
        style={{
          display: "inline-block",
          width: "100%",
          textAlign: "center",
          backgroundColor: bg,
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          fontWeight: "bold",
        }}
      >
        {label}
      </span>
    );
  };

  const docMontoTemplate = (rowData, campo) => {
    const bg = rowData.colorFondo;
    const simbolo = rowData.simboloDoc || rowData.moneda?.simbolo || "";
    const valor = getValorDoc(rowData, campo);
    return (
      <span
        style={{
          display: "inline-block",
          width: "100%",
          textAlign: "right",
          backgroundColor: bg || "transparent",
          padding: "0.25rem 0.5rem",
        }}
      >
        {simbolo} {formatearNumero(valor)}
      </span>
    );
  };

  const getValorDoc = (d, campo) => {
    if (campo.includes(".")) {
      return campo.split(".").reduce((obj, key) => obj?.[key], d) ?? 0;
    }
    return d[campo] ?? 0;
  };

  const subtotalDocsPorMoneda = (monedaId, campo) =>
    documentosGenerados
      .filter((d) => Number(d.monedaId) === Number(monedaId))
      .reduce((suma, d) => suma + Number(getValorDoc(d, campo) || 0), 0);

  const totalDocsEnMonedaOT = (campo) =>
    documentosGenerados.reduce((suma, d) => {
      const convertido = convertirAMonedaOT(getValorDoc(d, campo), d.monedaId, d.tipoCambio);
      return convertido !== null ? suma + convertido : suma;
    }, 0);

  const docRowGroupHeaderTemplate = (data) => {
    const monedaId = data.monedaId ?? data;
    const doc = documentosGenerados.find((d) => Number(d.monedaId) === Number(monedaId));
    const bg = doc?.colorFondo || "#e9ecef";
    return (
      <span
        style={{
          display: "inline-block",
          width: "100%",
          backgroundColor: bg,
          padding: "0.5rem",
          fontWeight: "bold",
        }}
      >
        {doc?.nombreLargo || doc?.moneda?.nombreLargo || doc?.simboloDoc || monedaId}
      </span>
    );
  };

  const docRowGroupFooterTemplate = (data) => {
    const monedaId = data.monedaId ?? data;
    const doc = documentosGenerados.find((d) => Number(d.monedaId) === Number(monedaId));
    const bg = doc?.colorFondo || "#e9ecef";
    const simbolo = doc?.simboloDoc || "";
    const numberStyle = {
      backgroundColor: bg,
      fontWeight: "bold",
      textAlign: "right",
    };
    const labelStyle = {
      backgroundColor: bg,
      fontWeight: "bold",
      textAlign: "left",
    };
    const emptyStyle = { backgroundColor: bg };
    return (
      <>
        <td style={emptyStyle}></td>
        <td style={emptyStyle}></td>
        <td style={emptyStyle}></td>
        <td style={emptyStyle}></td>
        <td style={labelStyle}>Subtotal {simbolo}</td>
        <td style={emptyStyle}></td>
        <td style={numberStyle}>
          {formatearNumero(subtotalDocsPorMoneda(monedaId, "total"))}
        </td>
        <td style={numberStyle}>
          {formatearNumero(subtotalDocsPorMoneda(monedaId, "cuentaPorPagar.montoPagado"))}
        </td>
        <td style={emptyStyle}></td>
      </>
    );
  };

  const estadoTemplate = (rowData) => {
    const estado = estadosContratista.find(
      (e) => Number(e.id) === Number(rowData.estadoId),
    );
    return (
      <Tag
        value={estado?.descripcion || "N/A"}
        severity={estado?.severityColor || "info"}
      />
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2" style={{ justifyContent: "center" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-warning"
          onClick={(e) => {
            e.stopPropagation();
            handleEditarContratista(rowData);
          }}
          disabled={readOnly || !puedeEditar}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger"
          onClick={(e) => {
            e.stopPropagation();
            handleEliminarContratista(rowData);
          }}
          disabled={readOnly || !puedeEditar}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  // Toolbar
  const toolbarLeft = (
    <div className="flex align-items-center gap-2">
      <i className="pi pi-users" style={{ fontSize: "1.5rem" }}></i>
      <span className="text-xl font-bold">Contratistas</span>
      <Tag value={contratistas.length} severity="info" />
    </div>
  );

  const toolbarRight = (
    <Button
      label="Nuevo Contratista"
      icon="pi pi-plus"
      className="p-button-success"
      onClick={handleNuevoContratista}
      disabled={!otMantenimientoId || readOnly || !puedeEditar}
    />
  );

  // Footer del diálogo
  const dialogFooter = (
    <div>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text"
        onClick={() => setDialogVisible(false)}
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        className="p-button-primary"
        onClick={handleGuardarContratista}
        loading={loading}
      />
    </div>
  );

  const handleAbrirGenerarDocumento = async () => {
    try {
      const presupuesto = await getDetalleContratistaPorId(formData.id);
      setPresupuestoDoc(presupuesto);
      setDialogDocVisible(true);
    } catch (error) {
      console.error("Error al cargar presupuesto para generar documento:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo preparar la generación del documento",
        life: 3000,
      });
    }
  };

  const renderFormularioGeneral = () => (
    <div className="p-fluid">
      <div
        style={{
          display: "flex",
          alignItems: "end",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 0.25 }}>
          <label
            htmlFor="numeroLinea"
            className="block text-900 font-medium mb-2"
          >
            N° *
          </label>
          <InputNumber
            id="numeroLinea"
            value={formData.numeroLinea}
            onValueChange={(e) =>
              setFormData({ ...formData, numeroLinea: e.value })
            }
            disabled
          />
        </div>
        <div style={{ flex: 2.75 }}>
          <EntidadComercialSelector
            entidades={contratistasOptions}
            value={formData.contratistaId}
            onChange={(contratistaId) =>
              setFormData({ ...formData, contratistaId })
            }
            empresaIdPreseleccionada={empresaId}
            tipoEntidadFiltro="PROVEEDOR"
            label="Contratista"
            placeholder="Seleccione un contratista"
            required={true}
          />
        </div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <ActivoSelector
          empresaIdPreseleccionada={empresaId}
          value={formData.activoId}
          onChange={(activoId) =>
            setFormData({ ...formData, activoId: activoId })
          }
          placeholder="Seleccione un activo (opcional)"
          required={false}
        />
      </div>

      <div style={{ marginTop: "1rem" }}>
        <label
          htmlFor="servicioDescripcion"
          className="block text-900 font-medium mb-2"
        >
          Descripción del Servicio *
        </label>
        <InputTextarea
          id="servicioDescripcion"
          value={formData.servicioDescripcion}
          onChange={(e) =>
            setFormData({
              ...formData,
              servicioDescripcion: e.target.value,
            })
          }
          rows={3}
          placeholder="Ingrese la descripción del servicio"
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: "1rem",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label
            htmlFor="fechaPresupuesto"
            className="block text-900 font-medium mb-2"
          >
            Fecha del Presupuesto *
          </label>
          <Calendar
            id="fechaPresupuesto"
            value={formData.fechaPresupuesto}
            onChange={(e) =>
              setFormData({ ...formData, fechaPresupuesto: e.value })
            }
            dateFormat="dd/mm/yy"
            showIcon
          />
        </div>
        <div style={{ flex: 1 }}>
          <label
            htmlFor="tipoCambio"
            className="block text-900 font-medium mb-2"
          >
            Tipo de Cambio (SUNAT)
          </label>
          <InputNumber
            id="tipoCambio"
            value={formData.tipoCambio}
            onValueChange={(e) =>
              setFormData({ ...formData, tipoCambio: e.value })
            }
            mode="decimal"
            minFractionDigits={3}
            maxFractionDigits={3}
            placeholder="Se obtiene de SUNAT si está vacío"
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: "1rem",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label
            htmlFor="monedaId"
            className="block text-900 font-medium mb-2"
          >
            Moneda *
          </label>
          <Dropdown
            id="monedaId"
            value={formData.monedaId}
            options={monedas}
            onChange={(e) =>
              setFormData({ ...formData, monedaId: e.value })
            }
            optionLabel="codigoSunat"
            optionValue="id"
            placeholder="Seleccione moneda"
          />
        </div>
        <div style={{ flex: 1 }}>
          <label
            htmlFor="montoPactado"
            className="block text-900 font-medium mb-2"
          >
            Monto Pactado (calculado)
          </label>
          <InputNumber
            id="montoPactado"
            value={formData.montoPactado}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            disabled
          />
        </div>
        <div style={{ flex: 1 }}>
          <label
            htmlFor="montoPagado"
            className="block text-900 font-medium mb-2"
          >
            Monto Pagado (calculado)
          </label>
          <InputNumber
            id="montoPagado"
            value={formData.montoPagado}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            disabled
          />
        </div>
        <div style={{ flex: 1 }}>
          <label
            htmlFor="saldo"
            className="block text-900 font-medium mb-2"
          >
            Saldo
          </label>
          <InputNumber
            id="saldo"
            value={formData.saldo}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            disabled
          />
        </div>
        <div style={{ flex: 1 }}>
          <label
            htmlFor="estadoId"
            className="block text-900 font-medium mb-2"
          >
            Estado *
          </label>
          <Dropdown
            id="estadoId"
            value={formData.estadoId}
            options={estadosContratista}
            onChange={(e) =>
              setFormData({ ...formData, estadoId: e.value })
            }
            optionLabel="descripcion"
            optionValue="id"
            placeholder="Seleccione estado"
          />
        </div>
      </div>
    </div>
  );

  const renderDetalleYDocumentos = () => (
    <div className="p-fluid">
      <DetRepuestosContratistaOTTab
        presupuestoId={formData.id}
        monedaId={formData.monedaId}
        empresaId={empresaId}
        monedas={monedas}
        onChange={async () => {
          await cargarContratistas();
          cargarDocumentosGenerados(formData.id);
        }}
        readOnly={readOnly}
        puedeEditar={puedeEditar}
      />

      <hr />

      <div className="flex justify-content-between align-items-center mb-2">
        <h6 className="m-0">Documentos de compra generados</h6>
        <Button
          label="Generar Documento de Compra"
          icon="pi pi-shopping-cart"
          className="p-button-success"
          onClick={handleAbrirGenerarDocumento}
          disabled={readOnly || !puedeEditar}
        />
      </div>
      <DataTable
        value={documentosGenerados}
        size="small"
        showGridlines
        stripedRows
        emptyMessage="No hay documentos generados para este presupuesto"
        rowGroupMode="subheader"
        groupRowsBy="monedaId"
        sortField="monedaId"
        sortOrder={1}
        rowGroupHeaderTemplate={docRowGroupHeaderTemplate}
        rowGroupFooterTemplate={docRowGroupFooterTemplate}
      >
        <Column field="numeroDocumento" header="N° OC" style={{ width: "140px" }} />
        <Column
          header="Tipo"
          body={(r) => (r.esGerencial ? "Gerencial" : r.tipoDocumentoFinal?.descripcion || "Fiscal")}
          style={{ width: "130px" }}
        />
        <Column field="numeroDocumentoFinal" header="Comprobante" style={{ width: "140px" }} />
        <Column
          header="Fecha"
          body={(r) =>
            r.fechaDocumento
              ? new Date(r.fechaDocumento).toLocaleDateString("es-PE")
              : ""
          }
          style={{ width: "110px" }}
        />
        <Column
          header="Empresa"
          footer="TOTAL OC"
          body={(r) => r.empresa?.razonSocial || ""}
        />
        <Column
          header="Moneda"
          body={docMonedaTemplate}
          style={{ width: "80px", textAlign: "center" }}
        />
        <Column
          header="Total"
          body={(r) => docMontoTemplate(r, "total")}
          footer={`${simboloOT} ${formatearNumero(totalDocsEnMonedaOT("total"))}`}
          style={{ width: "130px", textAlign: "right" }}
        />
        <Column
          header="Pagado"
          body={(r) => docMontoTemplate(r, "cuentaPorPagar.montoPagado")}
          footer={`${simboloOT} ${formatearNumero(totalDocsEnMonedaOT("cuentaPorPagar.montoPagado"))}`}
          style={{ width: "130px", textAlign: "right" }}
        />
        <Column
          header="Estado"
          body={(r) => <Tag value={r.estado?.descripcion || ""} severity="info" />}
          style={{ width: "120px" }}
        />
      </DataTable>
    </div>
  );

  return (
    <>
   
      <Toast ref={toast} />
      <ConfirmDialog />

      {!otMantenimientoId && (
        <Message
          severity="info"
          text="Debe guardar la OT primero para agregar contratistas"
          className="mb-3"
        />
      )}

      <Toolbar left={toolbarLeft} right={toolbarRight} className="mb-3" />

      <DataTable
        value={contratistas}
        loading={loading}
        emptyMessage="No hay contratistas registrados"
        showGridlines
        stripedRows
        size="small"
        rowGroupMode="subheader"
        groupRowsBy="monedaId"
        sortField="monedaId"
        sortOrder={1}
        rowGroupHeaderTemplate={rowGroupHeaderTemplate}
        rowGroupFooterTemplate={rowGroupFooterTemplate}
      >
        <Column
          field="numeroLinea"
          header="Línea"
          style={{ width: "80px" }}
        />
        <Column header="Contratista" body={contratistaTemplate} />
        <Column
          field="servicioDescripcion"
          header="Descripción"
          footer="TOTAL OT"
          body={(rowData) => rowData.servicioDescripcion || "N/A"}
        />
        <Column header="Activo" body={activoTemplate} />
        <Column
          header="Moneda"
          body={monedaTemplate}
          style={{ width: "80px" }}
        />
        <Column
          header="Pactado"
          body={(rowData) => montoTemplate(rowData, "montoPactado")}
          footer={`${simboloOT} ${formatearNumero(totalEnMonedaOT("montoPactado"))}`}
          style={{ width: "140px", textAlign: "right" }}
        />
        <Column
          header="Facturado"
          body={(rowData) => montoTemplate(rowData, "montoFacturado")}
          footer={`${simboloOT} ${formatearNumero(totalEnMonedaOT("montoFacturado"))}`}
          style={{ width: "140px", textAlign: "right" }}
        />
        <Column
          header="Pagado"
          body={(rowData) => montoTemplate(rowData, "montoPagado")}
          footer={`${simboloOT} ${formatearNumero(totalEnMonedaOT("montoPagado"))}`}
          style={{ width: "140px", textAlign: "right" }}
        />
        <Column
          header="Saldo"
          body={(rowData) => montoTemplate(rowData, "saldo")}
          footer={`${simboloOT} ${formatearNumero(totalEnMonedaOT("saldo"))}`}
          style={{ width: "150px", textAlign: "right" }}
        />
        <Column
          header="Estado"
          body={estadoTemplate}
          style={{ width: "120px" }}
        />
        <Column
          header="Acciones"
          body={accionesTemplate}
          style={{ width: "120px" }}
        />
      </DataTable>

      {/* Diálogo de formulario */}
      <Dialog
        visible={dialogVisible}
        style={{ width: "1300px" }}
        header={editingContratista ? "Editar Contratista" : "Nuevo Contratista"}
        modal
        className="p-fluid"
        footer={dialogFooter}
        onHide={() => setDialogVisible(false)}
      >
        <TabView
          activeIndex={activeTab}
          onTabChange={(e) => setActiveTab(e.index)}
        >
          <TabPanel header="Datos Generales">
            {renderFormularioGeneral()}
            {editingContratista && (
              <div style={{ marginTop: "1.5rem" }}>
                {renderDetalleYDocumentos()}
              </div>
            )}
          </TabPanel>

          <TabPanel header="Presupuesto PDF">
            <PdfPresupuestoContratistaCard
              presupuestoId={formData.id}
              urlDocumentoContratista={formData.urlDocumentoContratista || ""}
              onChange={(url) =>
                setFormData((prev) => ({ ...prev, urlDocumentoContratista: url }))
              }
              readOnly={readOnly || !puedeEditar}
            />
          </TabPanel>
        </TabView>
      </Dialog>

      {/* Diálogo: generar documento de compra del presupuesto */}
      <GenerarDocumentoCompraDialog
        visible={dialogDocVisible}
        onHide={() => setDialogDocVisible(false)}
        presupuesto={presupuestoDoc}
        empresaIdOt={empresaId}
        monedas={monedas}
        onGenerated={async () => {
          if (presupuestoDoc?.id) {
            cargarDocumentosGenerados(presupuestoDoc.id);
          }
          await cargarContratistas();
        }}
      />

    </>
  );
}
