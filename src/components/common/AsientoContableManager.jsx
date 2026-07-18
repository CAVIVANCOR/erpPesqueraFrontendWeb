import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import { Message } from "primereact/message";
import { Tag } from "primereact/tag";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { formatearFecha, formatearNumero } from "../../utils/utils";
import { ESTADO_ASIENTO_CONTABLE, ESTADO_PERIODO_CONTABLE, ESTADO_SEVERITY } from "../../utils/estados.constants";
import AsientoContableViewer from "./AsientoContableViewer";
import * as preFacturaAPI from "../../api/preFactura";
import * as ordenCompraAPI from "../../api/ordenCompra";
import * as movimientoActivoFijoAPI from "../../api/movimientoActivoFijo";
import * as saldoCuentaCorrienteAPI from "../../api/saldoCuentaCorriente";

/**
 * Componente genérico para gestionar asientos contables
 * Soporta múltiples tipos de documentos (PreFactura, SaldoCuentaCorriente, etc.)
 */
const AsientoContableManager = ({
  documentoTipo,
  documentoId,
  empresaId,
  periodoContableId,
  showAsButton = false,
  onAsientoChange,
  onBeforeGenerate,
}) => {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.user);

  // Estados
  const [asientos, setAsientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showListDialog, setShowListDialog] = useState(false);
  const [showEditorDialog, setShowEditorDialog] = useState(false);
  const [showViewerDialog, setShowViewerDialog] = useState(false);
  const [borradorAsiento, setBorradorAsiento] = useState(null);
  const [selectedAsiento, setSelectedAsiento] = useState(null);
  const [expandedRows, setExpandedRows] = useState(null);
  const [periodoContable, setPeriodoContable] = useState(null);
  const [warnings, setWarnings] = useState([]);

  // Mapeo de APIs por tipo de documento
  const API_MODULES = {
    PreFactura: preFacturaAPI,
    SaldoCuentaCorriente: saldoCuentaCorrienteAPI,
    MovimientoActivoFijo: movimientoActivoFijoAPI,
    OrdenCompra: ordenCompraAPI,
  };

  const api = API_MODULES[documentoTipo];

  // Validaciones
  const periodoEstaCerrado = Number(periodoContable?.estadoId) !== ESTADO_PERIODO_CONTABLE.ABIERTO;
  const puedeGenerar = documentoId && !periodoEstaCerrado;

  // Efectos
  useEffect(() => {
    if (periodoContableId) {
      cargarPeriodoContable();
    } else if (documentoId && empresaId) {
      cargarPeriodoPorDocumento();
    }
  }, [periodoContableId, documentoId, empresaId]);

  useEffect(() => {
    if (documentoId) {
      cargarAsientos();
    }
  }, [documentoId]);

  // Funciones de carga
  const cargarPeriodoContable = async () => {
    if (!periodoContableId) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/contabilidad/periodo-contable/${periodoContableId}`,
        { headers: { Authorization: `Bearer ${useAuthStore.getState().token}` } }
      );
      const data = await response.json();
      setPeriodoContable(data);
    } catch (error) {
      console.error("Error al cargar período contable:", error);
      setPeriodoContable(null);
    }
  };

  const cargarPeriodoPorDocumento = async () => {
    if (!documentoId || !empresaId || !api) return;

    try {
      let documento;

      if (documentoTipo === 'PreFactura') {
        documento = await api.getPreFacturaPorId(documentoId);
      } else if (documentoTipo === 'SaldoCuentaCorriente') {
        documento = await api.getSaldoCuentaCorrienteById(documentoId);
      } else if (documentoTipo === 'MovimientoActivoFijo') {
        documento = await api.getMovimientoActivoFijoPorId(documentoId);
      } else if (documentoTipo === 'OrdenCompra') {
        documento = await api.getOrdenCompraPorId(documentoId);
      } else {
        throw new Error(`Tipo de documento no soportado: ${documentoTipo}`);
      }

      const fecha = new Date(documento.fecha || documento.fechaDocumento || documento.fechaContable);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/contabilidad/periodo-contable/por-fecha?empresaId=${empresaId}&anio=${fecha.getFullYear()}&mes=${fecha.getMonth() + 1}`,
        { headers: { Authorization: `Bearer ${useAuthStore.getState().token}` } }
      );
      const data = await response.json();
      setPeriodoContable(data);
    } catch (error) {
      console.error("Error al cargar período por documento:", error);
      setPeriodoContable(null);
    }
  };

  const cargarAsientos = async () => {
    if (!documentoId || !api) return [];

    try {
      setLoading(true);
      let documento;

      // Usar método específico según tipo de documento
      if (documentoTipo === 'PreFactura') {
        documento = await api.getPreFacturaPorId(documentoId);
      } else if (documentoTipo === 'SaldoCuentaCorriente') {
        documento = await api.getSaldoCuentaCorrienteById(documentoId);
      } else if (documentoTipo === 'MovimientoActivoFijo') {
        documento = await api.getMovimientoActivoFijoPorId(documentoId);
      } else if (documentoTipo === 'OrdenCompra') {
        documento = await api.getOrdenCompraPorId(documentoId);
      } else {
        throw new Error(`Tipo de documento no soportado: ${documentoTipo}`);
      }

      const asientosObtenidos = documento.asientosContables || [];
      setAsientos(asientosObtenidos);
      return asientosObtenidos;
    } catch (error) {
      console.error("Error al cargar asientos:", error);
      setAsientos([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Función principal de generación/regeneración
  const handleGenerarAsiento = async () => {
    if (!puedeGenerar) {
      toast.current?.show({
        severity: "warn",
        summary: "No se puede generar asiento",
        detail: periodoEstaCerrado
          ? "El período contable está cerrado"
          : "Debe guardar el documento primero",
        life: 4000,
      });
      return;
    }

    if (onBeforeGenerate) {
      const continuar = await onBeforeGenerate();
      if (continuar === false) return; // Solo detener si es explícitamente false
    }

    setLoading(true);

    try {
      const asientosActuales = await cargarAsientos();
      if (asientosActuales.length > 0) {
        // Verificar estados
        const tieneAprobados = asientosActuales.some(a => Number(a.estadoId) === ESTADO_ASIENTO_CONTABLE.APROBADO);
        if (tieneAprobados) {
          const pendientes = asientosActuales.filter(a => Number(a.estadoId) === ESTADO_ASIENTO_CONTABLE.PENDIENTE).length;
          const anulados = asientosActuales.filter(a => Number(a.estadoId) === ESTADO_ASIENTO_CONTABLE.ANULADO).length;
          const aprobados = asientosActuales.filter(a => Number(a.estadoId) === ESTADO_ASIENTO_CONTABLE.APROBADO).length;
          toast.current?.show({
            severity: "warn",
            summary: "No se puede regenerar",
            detail: `Este documento tiene ${aprobados} asiento(s) APROBADO(s) que no pueden modificarse. Pendientes: ${pendientes}, Anulados: ${anulados}`,
            life: 6000,
          });
          setShowListDialog(true);
          setLoading(false);
          return;
        }

        // Solo pendientes/anulados - preguntar
        const pendientes = asientosActuales.filter(a => Number(a.estadoId) === ESTADO_ASIENTO_CONTABLE.PENDIENTE);
        const anulados = asientosActuales.filter(a => Number(a.estadoId) === ESTADO_ASIENTO_CONTABLE.ANULADO);
        const totalEliminar = pendientes.length + anulados.length;
        confirmDialog({
          message: `Se eliminarán ${totalEliminar} asiento(s): ${pendientes.length} PENDIENTE(S) y ${anulados.length} ANULADO(S). ¿Desea continuar?`,
          header: "Regenerar Asiento Contable",
          icon: "pi pi-exclamation-triangle",
          acceptLabel: "Sí, Regenerar",
          rejectLabel: "No, Solo Mostrar",
          accept: async () => {
            await regenerarAsientos([...pendientes, ...anulados]);
          },
          reject: () => {
            setShowListDialog(true);
            setLoading(false);
          }
        });
        return;
      }

      // No hay asientos - generar nuevo
      await generarNuevoAsiento();
    } catch (error) {
      console.error("Error:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || error.message || "Error al procesar asiento",
        life: 5000,
      });
      setLoading(false);
    }
  };

  const regenerarAsientos = async (asientosAEliminar) => {
    try {
      // Eliminar asientos según tipo de documento
      for (const asiento of asientosAEliminar) {
        if (documentoTipo === 'PreFactura') {
          await api.eliminarAsientoContable(documentoId, asiento.id);
        } else if (documentoTipo === 'SaldoCuentaCorriente') {
          await api.eliminarAsientoContable(documentoId, asiento.id);
        } else if (documentoTipo === 'MovimientoActivoFijo') {
          await api.eliminarAsientoContable(documentoId, asiento.id);
        } else if (documentoTipo === 'OrdenCompra') {
          await api.eliminarAsientoContable(documentoId, asiento.id);
        }
      }

      toast.current?.show({
        severity: "success",
        summary: "Asientos eliminados",
        detail: `${asientosAEliminar.length} asiento(s) eliminado(s)`,
        life: 3000,
      });

      await cargarAsientos();
      await generarNuevoAsiento();
    } catch (error) {
      console.error("Error al regenerar:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error al regenerar",
        detail: error.response?.data?.message || error.message,
        life: 5000,
      });
      setLoading(false);
    }
  };

  const generarNuevoAsiento = async () => {
    try {
      let borrador;

      // Generar borrador según tipo de documento
      if (documentoTipo === 'PreFactura') {
        borrador = await api.obtenerBorradorAsiento(documentoId);
      } else if (documentoTipo === 'SaldoCuentaCorriente') {
        borrador = await api.generarBorradorAsiento(documentoId);
      } else if (documentoTipo === 'MovimientoActivoFijo') {
        borrador = await api.generarBorradorAsiento(documentoId);
      } else if (documentoTipo === 'OrdenCompra') {
        borrador = await api.generarBorradorAsiento(documentoId);
      } else {
        throw new Error(`Tipo de documento no soportado: ${documentoTipo}`);
      }

      if (borrador.warnings?.length > 0) {
        setWarnings(borrador.warnings);
      } else {
        setWarnings([]);
      }

      // Guardar asiento según tipo de documento
      let asientoGuardado;
      if (documentoTipo === 'PreFactura') {
        asientoGuardado = await api.guardarAsientoContable(documentoId, borrador);
      } else if (documentoTipo === 'SaldoCuentaCorriente') {
        asientoGuardado = await api.guardarAsientoContable(documentoId, borrador, usuario?.id || 1);
      } else if (documentoTipo === 'MovimientoActivoFijo') {
        asientoGuardado = await api.guardarAsientoContable(documentoId, borrador, usuario?.id || 1);
      } else if (documentoTipo === 'OrdenCompra') {
        asientoGuardado = await api.guardarAsientoContable(documentoId, borrador, usuario?.id || 1);
      }
      await cargarAsientos();

      toast.current?.show({
        severity: "success",
        summary: "Asiento generado",
        detail: "Asiento contable generado correctamente",
        life: 4000,
      });

      setShowListDialog(true);

      if (onAsientoChange) {
        onAsientoChange();
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleBotonPrincipal = () => {
    handleGenerarAsiento();
  };

  const handleVerAsiento = (asiento) => {
    setSelectedAsiento(asiento);
    setShowViewerDialog(true);
  };

  const handleEliminarAsiento = async (asiento) => {
    if (Number(asiento.estadoId) === ESTADO_ASIENTO_CONTABLE.APROBADO) {
      toast.current?.show({
        severity: "warn",
        summary: "No se puede eliminar",
        detail: "No se puede eliminar un asiento APROBADO",
        life: 4000,
      });
      return;
    }

    confirmDialog({
      message: `¿Está seguro de eliminar el asiento ${asiento.numeroAsiento}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, Eliminar",
      rejectLabel: "Cancelar",
      accept: async () => {
        try {
          // Eliminar según tipo de documento
          if (documentoTipo === 'PreFactura') {
            await api.eliminarAsientoContable(documentoId, asiento.id);
          } else if (documentoTipo === 'SaldoCuentaCorriente') {
            await api.eliminarAsientoContable(documentoId, asiento.id);
          } else if (documentoTipo === 'MovimientoActivoFijo') {
            await api.eliminarAsientoContable(documentoId, asiento.id);
          } else if (documentoTipo === 'OrdenCompra') {
            await api.eliminarAsientoContable(documentoId, asiento.id);
          }

          toast.current?.show({
            severity: "success",
            summary: "Asiento eliminado",
            detail: "Asiento contable eliminado correctamente",
            life: 3000,
          });
          await cargarAsientos();
          if (onAsientoChange) onAsientoChange();
        } catch (error) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: error.response?.data?.message || "Error al eliminar asiento",
            life: 5000,
          });
        }
      }
    });
  };
  // Templates
  const fechaTemplate = (rowData) => formatearFecha(new Date(rowData.fechaAsiento));

  const estadoTemplate = (rowData) => {
    const severity = ESTADO_SEVERITY[rowData.estadoId] || 'info';
    return <Tag value={rowData.estado?.descripcion} severity={severity} />;
  };

   const montoTemplate = (rowData, field) => {
    const monto = Number(rowData[field]);
    const moneda = rowData.moneda;
    return (
      <Tag
        value={`${moneda?.simbolo || ''} ${formatearNumero(monto, 2)}`}
        style={{ backgroundColor: moneda?.colorFondo || '#6c757d', color: '#000' }}
      />
    );
  };

  const tipoLibroTemplate = (rowData) => (
    <Tag value={rowData.tipoLibro} severity={rowData.tipoLibro === 'FISCAL' ? 'info' : 'secondary'} />
  );

  const cuadradoTemplate = (rowData) => (
    <Tag
      icon={rowData.estaCuadrado ? "pi pi-check" : "pi pi-times"}
      severity={rowData.estaCuadrado ? "success" : "danger"}
      value={rowData.estaCuadrado ? "Sí" : "No"}
    />
  );

  const accionesTemplate = (rowData) => (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <Button
        icon="pi pi-eye"
        className="p-button-info p-button-sm"
        onClick={() => handleVerAsiento(rowData)}
        tooltip="Ver asiento"
      />
      {Number(rowData.estadoId) !== ESTADO_ASIENTO_CONTABLE.APROBADO && !periodoEstaCerrado && (
        <Button
          icon="pi pi-trash"
          className="p-button-danger p-button-sm"
          onClick={() => handleEliminarAsiento(rowData)}
          tooltip="Eliminar asiento"
        />
      )}
    </div>
  );

  const rowExpansionTemplate = (data) => (
    <div className="p-3">
      <h5>Detalles del Asiento</h5>
      <DataTable value={data.detalles} size="small">
        <Column field="numeroLinea" header="#" style={{ width: "50px" }} />
        <Column field="planCuenta.codigoCuenta" header="Cuenta" />
        <Column field="planCuenta.nombreCuenta" header="Descripción" />
        <Column field="glosa" header="Glosa" />
        <Column
          field="debe"
          header="Debe"
          body={(row) => formatearNumero(Number(row.debe), 2)}
          style={{ textAlign: "right" }}
        />
        <Column
          field="haber"
          header="Haber"
          body={(row) => formatearNumero(Number(row.haber), 2)}
          style={{ textAlign: "right" }}
        />
      </DataTable>
    </div>
  );

  // Renderizado del contenido
  const contenido = (
    <div>
      <Toast ref={toast} />
      {warnings.length > 0 && (
        <Message
          severity="warn"
          text={`Advertencias: ${warnings.join(", ")}`}
          style={{ marginBottom: "1rem", width: "100%" }}
        />
      )}
      <DataTable
        value={asientos}
        loading={loading}
        emptyMessage="No hay asientos contables generados"
        expandedRows={expandedRows}
        onRowToggle={(e) => setExpandedRows(e.data)}
        rowExpansionTemplate={rowExpansionTemplate}
        dataKey="id"
        stripedRows
        showGridlines
        size="small"
      >
        <Column expander style={{ width: "3em" }} />
        <Column field="numeroAsiento" header="Número Asiento" sortable />
        <Column field="fechaAsiento" header="Fecha" body={fechaTemplate} sortable />
        <Column field="tipoLibro" header="Tipo Libro" body={tipoLibroTemplate} sortable />
        <Column header="Estado" body={estadoTemplate} />
        <Column field="totalDebe" header="Total Debe" body={(row) => montoTemplate(row, "totalDebe")} style={{ textAlign: "right" }} />
        <Column field="totalHaber" header="Total Haber" body={(row) => montoTemplate(row, "totalHaber")} style={{ textAlign: "right" }} />
        <Column header="Cuadrado" body={cuadradoTemplate} style={{ textAlign: "center" }} />
        <Column header="Acciones" body={accionesTemplate} />
      </DataTable>

      <Dialog
        visible={showViewerDialog}
        onHide={() => {
          setShowViewerDialog(false);
          setSelectedAsiento(null);
        }}
        header="Ver Asiento Contable"
        style={{ width: "95vw", maxWidth: "1400px" }}
        maximizable
        modal
      >
        {selectedAsiento && (
          <AsientoContableViewer
            asientoContableId={selectedAsiento.id}
            onClose={() => {
              setShowViewerDialog(false);
              setSelectedAsiento(null);
            }}
          />
        )}
      </Dialog>
    </div>
  );

  // Renderizado como botón
  if (showAsButton) {
    const pendientes = asientos.filter(a => Number(a.estadoId) === ESTADO_ASIENTO_CONTABLE.PENDIENTE).length;
    const aprobados = asientos.filter(a => Number(a.estadoId) === ESTADO_ASIENTO_CONTABLE.APROBADO).length;
    const anulados = asientos.filter(a => Number(a.estadoId) === ESTADO_ASIENTO_CONTABLE.ANULADO).length;
    const total = asientos.length;

    const tieneAsientos = total > 0;
    const tieneAprobados = aprobados > 0;
    const labelBoton = tieneAsientos ? "Regenerar Asientos" : "Generar Asientos";
    const iconoBoton = tieneAsientos ? "pi pi-refresh" : "pi pi-book";
    const colorBoton = tieneAprobados ? "p-button-success" : tieneAsientos ? "p-button-warning" : "p-button-info";

    return (
      <>
        <Toast ref={toast} />
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Button
            label={labelBoton}
            icon={iconoBoton}
            className={colorBoton}
            onClick={handleBotonPrincipal}
            disabled={!documentoId || loading}
            loading={loading}
          />
          {tieneAsientos && (
            <div style={{ display: "flex", gap: "0.25rem" }}>
              {pendientes > 0 && <Tag value={`${pendientes} P`} severity="warning" />}
              {aprobados > 0 && <Tag value={`${aprobados} A`} severity="success" />}
              {anulados > 0 && <Tag value={`${anulados} X`} severity="danger" />}
            </div>
          )}
        </div>

        <Dialog
          visible={showListDialog}
          onHide={() => {
            setShowListDialog(false);
            setWarnings([]);
          }}
          header={periodoEstaCerrado ? "Asientos Contables (Solo lectura - Período cerrado)" : "Asientos Contables"}
          style={{ width: "95vw" }}
          maximizable
          modal
        >
          {periodoEstaCerrado && (
            <Message
              severity="warn"
              text="El período contable está CERRADO. No se permiten modificaciones."
              style={{ marginBottom: "1rem" }}
            />
          )}
          {contenido}
        </Dialog>
      </>
    );
  }

  return contenido;
};

export default AsientoContableManager;