import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import { Message } from "primereact/message";
import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import AsientoContableEditor from "./AsientoContableEditor";
import AsientoContableViewer from "./AsientoContableViewer";
import * as preFacturaAPI from "../../api/preFactura";
import * as ordenCompraAPI from "../../api/ordenCompra";
import * as movimientoActivoFijoAPI from "../../api/movimientoActivoFijo";
/**
 * Obtiene el token JWT desde el store de autenticación
 * @returns {Object} Headers con autorización Bearer
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Componente genérico para gestionar asientos contables
 * Soporta múltiples tipos de documentos (PreFactura, MovimientoActivoFijo, etc.)
 *
 * @param {Object} props
 * @param {string} props.documentoTipo - Tipo de documento (PreFactura, MovimientoActivoFijo, etc.)
 * @param {BigInt|number} props.documentoId - ID del documento
 * @param {BigInt|number} props.periodoContableId - ID del período contable
 * @param {boolean} props.showAsButton - Si true, muestra botón. Si false, muestra inline
 * @param {Function} props.onAsientoChange - Callback cuando cambia un asiento
 */
const AsientoContableManager = ({
  documentoTipo,
  documentoId,
  periodoContableId,
  showAsButton = false,
  onAsientoChange,
  onBeforeGenerate, // ⭐ NUEVO: Callback antes de generar asiento
}) => {
  const toast = useRef(null);

  // ========================================
  // ESTADOS
  // ========================================
  const [asientos, setAsientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showListDialog, setShowListDialog] = useState(false);
  const [showEditorDialog, setShowEditorDialog] = useState(false);
  const [showViewerDialog, setShowViewerDialog] = useState(false);
  const [borradorAsiento, setBorradorAsiento] = useState(null);
  const [selectedAsiento, setSelectedAsiento] = useState(null);
  const [expandedRows, setExpandedRows] = useState(null);
  const [periodoContable, setPeriodoContable] = useState(null);
  const [warnings, setWarnings] = useState([]); // ⭐ AGREGAR ESTA LÍNEA

  // ========================================
  // CONFIGURACIÓN POR TIPO DE DOCUMENTO
  // ========================================
  const configuraciones = {
    // Ventas
    PreFactura: {
      baseUrl: "/api/pre-facturas",
      borradorEndpoint: "borrador-asiento",
      borradorMethod: "GET",
      guardarEndpoint: "guardar-asiento",
      eliminarEndpoint: "asiento", // /asiento/:asientoId
    },

    // Activos Fijos
    MovimientoActivoFijo: {
      baseUrl: "/api/movimientos-activo-fijo",
      borradorEndpoint: "generar-borrador-asiento",
      borradorMethod: "POST",
      guardarEndpoint: "guardar-asiento",
      eliminarEndpoint: "asiento-contable", // /asiento-contable
    },

    // Flujo de Caja
    SaldoCuentaCorriente: {
      baseUrl: "/api/saldos-cuenta-corriente",
      borradorEndpoint: "borrador-asiento",
      borradorMethod: "GET",
      guardarEndpoint: "guardar-asiento",
      eliminarEndpoint: "asiento", // /asiento/:asientoId
    },

    // Compras (para futuro)
    OrdenCompra: {
      baseUrl: "/api/ordenes-compra",
      borradorEndpoint: "borrador-asiento",
      borradorMethod: "GET",
      guardarEndpoint: "guardar-asiento",
      eliminarEndpoint: "asiento", // /asiento/:asientoId
    },

    // Cuentas por Cobrar (para futuro)
    CuentaPorCobrar: {
      baseUrl: "/api/cuentas-por-cobrar",
      borradorEndpoint: "borrador-asiento",
      borradorMethod: "GET",
      guardarEndpoint: "guardar-asiento",
      eliminarEndpoint: "asiento", // /asiento/:asientoId
    },

    // Cuentas por Pagar (para futuro)
    CuentaPorPagar: {
      baseUrl: "/api/cuentas-por-pagar",
      borradorEndpoint: "borrador-asiento",
      borradorMethod: "GET",
      guardarEndpoint: "guardar-asiento",
      eliminarEndpoint: "asiento", // /asiento/:asientoId
    },


    // ⭐ NUEVO - Deudas con Personal (CTS, Gratificaciones, etc.)
    DeudaConPersonal: {
      baseUrl: "/api/deudas-personal",
      borradorEndpoint: "borrador-asiento",
      borradorMethod: "GET",
      guardarEndpoint: "guardar-asiento",
      eliminarEndpoint: "asiento", // /asiento/:asientoId
    },


  };

  const config = configuraciones[documentoTipo];
  const baseUrl = config?.baseUrl;

  // ========================================
  // VALIDACIONES
  // ========================================
  const periodoEstaCerrado = periodoContable?.estado?.descripcion !== "ABIERTO";
  const puedeGenerar = documentoId && !periodoEstaCerrado;
  const puedeEditar = !periodoEstaCerrado;
  const puedeEliminar = !periodoEstaCerrado;

  // ========================================
  // EFECTOS
  // ========================================
  useEffect(() => {
    if (periodoContableId) {
      cargarPeriodoContable();
    }
  }, [periodoContableId]);

  useEffect(() => {
    if (documentoId) {
      cargarAsientos();
    }
  }, [documentoId]);

  // ========================================
  // FUNCIONES DE CARGA
  // ========================================
  const cargarPeriodoContable = async () => {
    if (!periodoContableId) {
      return;
    }

    try {
      const url = `${import.meta.env.VITE_API_URL}/contabilidad/periodo-contable/${periodoContableId}`;
      const response = await axios.get(url, { headers: getAuthHeaders() });
      setPeriodoContable(response.data);
    } catch (error) {
      console.error("  ❌ Error al cargar período contable:", error);
      console.error("  ❌ Status:", error.response?.status);
      console.error("  ❌ Data:", error.response?.data);
      setPeriodoContable(null);
    }
  };

  const cargarAsientos = async () => {
    if (!documentoId || !baseUrl) return [];

    try {
      setLoading(true);
      const response = await axios.get(`${baseUrl}/${documentoId}`, {
        headers: getAuthHeaders(),
      });
      const asientosObtenidos = response.data.asientosContables || [];
      setAsientos(asientosObtenidos);
      return asientosObtenidos;
    } catch (error) {
      console.error("❌ Error al cargar asientos:", error);
      console.error("  Status:", error.response?.status);
      console.error("  Data:", error.response?.data);
      setAsientos([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // HANDLER DEL BOTÓN PRINCIPAL
  // ========================================
  const handleBotonPrincipal = () => {
    const tieneAprobados = asientos.some(a => Number(a.estadoId) === 75);

    if (tieneAprobados) {
      // Si hay asientos aprobados, mostrar lista
      setShowListDialog(true);
    } else {
      // Si no hay aprobados, generar nuevo asiento
      handleGenerarAsiento();
    }
  };

  // ========================================
  // FUNCIONES DE ACCIONES
  // ========================================
  const handleGenerarAsiento = async () => {
    if (!puedeGenerar) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "No se puede generar asiento. Verifique que el documento esté guardado y el período esté abierto.",
        life: 4000,
      });
      return;
    }
    setLoading(true);

    try {
      // ⭐ EJECUTAR CALLBACK ANTES DE GENERAR (si existe)
      if (onBeforeGenerate && typeof onBeforeGenerate === 'function') {
        try {
          await onBeforeGenerate();
        } catch (error) {
          // Si el callback falla, abortar generación
          setLoading(false);
          return;
        }
      }
      if (asientos.length > 0) {
        // ⭐ YA EXISTE ASIENTO - PREGUNTAR SI REGENERAR
        confirmDialog({
          message: "Ya existe un asiento contable para este documento. ¿Desea eliminarlo y generar uno nuevo?",
          header: "Regenerar Asiento Contable",
          icon: "pi pi-exclamation-triangle",
          acceptLabel: "Sí, Regenerar",
          rejectLabel: "Cancelar",
          accept: async () => {
            try {
              // Eliminar asientos existentes
              const apiModule = documentoTipo === 'PreFactura'
                ? preFacturaAPI
                : documentoTipo === 'OrdenCompra'
                  ? ordenCompraAPI
                  : movimientoActivoFijoAPI;

              for (const asiento of asientos) {
                await apiModule.eliminarAsientoContable(documentoId, asiento.id);
              }

              toast.current?.show({
                severity: "success",
                summary: "Asientos Eliminados",
                detail: "Asientos anteriores eliminados correctamente.",
                life: 2000,
              });

              // Recargar y continuar con generación
              await cargarAsientos();

              // Generar nuevo asiento
              const urlBorrador = `${baseUrl}/${documentoId}/${config.borradorEndpoint}`;
              const responseBorrador = config.borradorMethod === "POST"
                ? await axios.post(urlBorrador, {}, { headers: getAuthHeaders() })
                : await axios.get(urlBorrador, { headers: getAuthHeaders() });
              const borradorGenerado = responseBorrador.data;

              if (borradorGenerado.warnings && borradorGenerado.warnings.length > 0) {
                setWarnings(borradorGenerado.warnings);
              } else {
                setWarnings([]);
              }

              await axios.post(
                `${baseUrl}/${documentoId}/${config.guardarEndpoint}`,
                { asientoData: borradorGenerado },
                { headers: getAuthHeaders() }
              );

              await cargarAsientos();

              toast.current?.show({
                severity: "success",
                summary: "Asiento Regenerado",
                detail: "Asiento contable regenerado correctamente.",
                life: 4000,
              });

              setShowListDialog(true);

              if (onAsientoChange) {
                onAsientoChange();
              }
            } catch (error) {
              console.error("Error al regenerar asiento:", error);
              toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: error.response?.data?.message || "Error al regenerar asiento",
                life: 3000,
              });
            }
          },
          reject: () => {
            setShowListDialog(true);
          }
        });
        setLoading(false);
        return;
      }
      // ✅ SI NO EXISTE NINGÚN ASIENTO, GENERAR UNO NUEVO
      const urlBorrador = `${baseUrl}/${documentoId}/${config.borradorEndpoint}`;
      const responseBorrador = config.borradorMethod === "POST"
        ? await axios.post(urlBorrador, {}, { headers: getAuthHeaders() })
        : await axios.get(urlBorrador, { headers: getAuthHeaders() });
      const borradorGenerado = responseBorrador.data;

      // Capturar warnings si existen
      if (borradorGenerado.warnings && borradorGenerado.warnings.length > 0) {
        setWarnings(borradorGenerado.warnings);
      } else {
        setWarnings([]);
      }

      // Guardar automáticamente en BD
      await axios.post(
        `${baseUrl}/${documentoId}/${config.guardarEndpoint}`,
        { asientoData: borradorGenerado },
        { headers: getAuthHeaders() }
      );

      // Recargar lista de asientos
      await cargarAsientos();

      toast.current?.show({
        severity: "success",
        summary: "Asiento Generado",
        detail: "Asiento contable generado y guardado correctamente.",
        life: 4000,
      });

      // Mostrar lista de asientos
      setShowListDialog(true);

      // Ejecutar callback si existe
      if (onAsientoChange) {
        onAsientoChange();
      }
    } catch (error) {
      console.error("Error al generar asiento:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al generar asiento contable",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarAsiento = async (asientoData) => {
    const esEdicion = asientoData.id !== undefined && asientoData.id !== null;
    setLoading(true);
    try {
      if (esEdicion) {
        // EDITAR: Actualizar asiento existente
        await axios.put(
          `${baseUrl}/${documentoId}/${config.guardarEndpoint}`,
          { asientoData },
          { headers: getAuthHeaders() }
        );
      } else {
        // CREAR: Nuevo asiento
        await axios.post(
          `${baseUrl}/${documentoId}/${config.guardarEndpoint}`,
          { asientoData },
          { headers: getAuthHeaders() }
        );
      }
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: esEdicion ? "Asiento actualizado correctamente" : "Asiento guardado correctamente",
        life: 3000,
      });
      setShowEditorDialog(false);
      setBorradorAsiento(null);
      await cargarAsientos();

      // ⭐ NUEVO: Abrir lista de asientos después de guardar
      setShowListDialog(true);

      // Ejecutar callback si existe
      if (onAsientoChange) {
        onAsientoChange();
      }
    } catch (error) {
      console.error("❌ Error al guardar asiento:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al guardar asiento contable",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };
  const handleVerAsiento = (asiento) => {
    setSelectedAsiento(asiento);
    setShowViewerDialog(true);
  };
  const handleEditarAsiento = async (asiento) => {
    const esAprobado = Number(asiento.estadoId) === 77;

    if (esAprobado) {
      // Confirmar antes de editar APROBADO
      confirmDialog({
        message: "Está editando un asiento APROBADO. Al guardar, el estado cambiará a PENDIENTE y requerirá nueva aprobación. ¿Desea continuar?",
        header: "Editar Asiento Aprobado",
        icon: "pi pi-exclamation-triangle",
        acceptLabel: "Sí, Editar",
        rejectLabel: "Cancelar",
        accept: () => {
          setBorradorAsiento(asiento);
          setShowEditorDialog(true);
        }
      });
    } else {
      // Si no está aprobado, editar directamente
      setBorradorAsiento(asiento);
      setShowEditorDialog(true);
    }
  };

  // ========================================
  // TEMPLATES DE COLUMNAS
  // ========================================
  const fechaTemplate = (rowData) => {
    return new Date(rowData.fechaAsiento).toLocaleDateString("es-PE");
  };

  const tipoLibroTemplate = (rowData) => {
    const esFiscal = rowData.tipoLibro === "FISCAL";
    return (
      <span
        style={{
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          backgroundColor: esFiscal ? "#d4edda" : "#fff3cd",
          color: esFiscal ? "#155724" : "#856404",
          fontWeight: "bold",
          fontSize: "0.85rem",
        }}
      >
        {rowData.tipoLibro}
      </span>
    );
  };

  const estadoTemplate = (rowData) => {
    const esAprobado = Number(rowData.estadoId) === 77;
    const esPendiente = Number(rowData.estadoId) === 76;

    let texto = "GENERADO";
    let bgColor = "#fff3cd";
    let textColor = "#856404";

    if (esAprobado) {
      texto = "APROBADO";
      bgColor = "#d4edda";
      textColor = "#155724";
    } else if (esPendiente) {
      texto = "PENDIENTE";
      bgColor = "#cfe2ff";
      textColor = "#084298";
    }

    return (
      <span
        style={{
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          backgroundColor: bgColor,
          color: textColor,
          fontWeight: "bold",
          fontSize: "0.85rem",
        }}
      >
        {texto}
      </span>
    );
  };

  const montoTemplate = (rowData, field) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(rowData[field]);
  };

  const cuadradoTemplate = (rowData) => {
    const estaCuadrado = rowData.estaCuadrado;
    return estaCuadrado ? (
      <i className="pi pi-check-circle" style={{ color: "green", fontSize: "1.2rem" }} />
    ) : (
      <i className="pi pi-times-circle" style={{ color: "red", fontSize: "1.2rem" }} />
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {/* Editar (solo si período abierto) */}
        {!periodoEstaCerrado && puedeEditar && (
          <Button
            icon="pi pi-pencil"
            className="p-button-warning p-button-text"
            onClick={() => handleEditarAsiento(rowData)}
            tooltip={Number(rowData.estadoId) === 77
              ? "Editar asiento APROBADO (cambiará a PENDIENTE)"
              : "Editar asiento"}
          />
        )}

        {/* Ver */}
        <Button
          icon="pi pi-eye"
          className="p-button-info p-button-text"
          onClick={() => handleVerAsiento(rowData)}
          tooltip="Ver asiento completo"
        />
      </div>
    );
  };

  // ========================================
  // TEMPLATE DE EXPANSIÓN
  // ========================================
  const rowExpansionTemplate = (rowData) => {
    const detalles = rowData.detalles || [];

    return (
      <div style={{ padding: "1rem" }}>
        <h4>Detalles del Asiento</h4>

        <DataTable
          value={detalles}
          stripedRows
          showGridlines
          size="small"
        >
          <Column field="numeroLinea" header="Línea" style={{ width: "80px" }} />
          <Column
            field="planCuenta.codigoCuenta"
            header="Cuenta"
            body={(data) => `${data.planCuenta?.codigoCuenta || ''} - ${data.planCuenta?.nombreCuenta || ''}`}
          />
          <Column field="glosa" header="Glosa" />
          <Column
            field="debe"
            header="Debe"
            body={(data) => montoTemplate(data, "debe")}
            style={{ textAlign: "right" }}
          />
          <Column
            field="haber"
            header="Haber"
            body={(data) => montoTemplate(data, "haber")}
            style={{ textAlign: "right" }}
          />
        </DataTable>
      </div>
    );
  };

  // ========================================
  // CONTENIDO PRINCIPAL (LISTA)
  // ========================================
  const contenido = (
    <div>
      {/* Mostrar warnings si existen */}
      {warnings.length > 0 && (
        <Message
          severity="warn"
          style={{ marginBottom: "1rem", width: "100%" }}
          content={
            <div>
              <strong>⚠️ Advertencias del Asiento Contable:</strong>
              <ul style={{ marginTop: "0.5rem", marginBottom: 0, paddingLeft: "1.5rem" }}>
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
              <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
                <strong>Recomendación:</strong> Configure las cuentas contables en los productos para generar asientos más precisos.
              </div>
            </div>
          }
        />
      )}

      {/* Lista de asientos */}
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
        <Column
          field="numeroAsiento"
          header="Número Asiento"
          style={{ minWidth: "180px" }}
          sortable
        />
        <Column
          field="fechaAsiento"
          header="Fecha"
          body={fechaTemplate}
          style={{ minWidth: "120px" }}
          sortable
        />
        <Column
          field="tipoLibro"
          header="Tipo Libro"
          body={tipoLibroTemplate}
          style={{ minWidth: "130px" }}
          sortable
        />
        <Column
          header="Estado"
          body={estadoTemplate}
          style={{ minWidth: "130px" }}
        />
        <Column
          field="totalDebe"
          header="Total Debe"
          body={(rowData) => montoTemplate(rowData, "totalDebe")}
          style={{ minWidth: "150px", textAlign: "right" }}
        />
        <Column
          field="totalHaber"
          header="Total Haber"
          body={(rowData) => montoTemplate(rowData, "totalHaber")}
          style={{ minWidth: "150px", textAlign: "right" }}
        />
        <Column
          header="Cuadrado"
          body={cuadradoTemplate}
          style={{ minWidth: "100px", textAlign: "center" }}
        />
        <Column
          header="Acciones"
          body={accionesTemplate}
          style={{ minWidth: "120px" }}
        />
      </DataTable>

      {/* Diálogo para generar/editar asiento */}
      <Dialog
        visible={showEditorDialog}
        onHide={() => {
          setShowEditorDialog(false);
          setBorradorAsiento(null);
          setWarnings([]);
        }}
        header="Generar Asiento Contable"
        style={{ width: "95vw", maxWidth: "1400px" }}
        maximizable
        modal
      >
        {borradorAsiento && (
          <AsientoContableEditor
            borradorAsiento={borradorAsiento}
            onGuardar={handleGuardarAsiento}
            onCancelar={() => {
              setShowEditorDialog(false);
              setBorradorAsiento(null);
            }}
            loading={loading}
          />
        )}
      </Dialog>

      {/* Diálogo para ver asiento */}
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

  // ========================================
  // RENDERIZADO
  // ========================================

  // Si showAsButton es true, mostrar como botón
  if (showAsButton) {
    const tieneAprobados = asientos.some(a => Number(a.estadoId) === 75);
    const labelBoton = tieneAprobados ? "Mostrar Asientos" : "Generar Asiento";
    const iconoBoton = tieneAprobados ? "pi pi-eye" : "pi pi-book";
    const colorBoton = tieneAprobados ? "p-button-success" : "p-button-info";

    return (
      <>
        <Toast ref={toast} />
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button
            label={labelBoton}
            icon={iconoBoton}
            className={colorBoton}
            onClick={handleBotonPrincipal}
            disabled={!documentoId || loading}
            loading={loading}
            tooltip={
              !documentoId
                ? "Guarde el documento primero"
                : periodoEstaCerrado
                  ? "Período contable cerrado - Solo lectura"
                  : tieneAprobados
                    ? "Ver asientos contables generados"
                    : "Generar nuevo asiento contable"
            }
          />
        </div>

        <Dialog
          visible={showListDialog}
          onHide={() => {
            setShowListDialog(false);
            setWarnings([]);
          }}
          header={periodoEstaCerrado
            ? "Asientos Contables (Solo lectura - Período cerrado)"
            : "Asientos Contables"}
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

  // Si showAsButton es false, mostrar inline
  return contenido;
};

export default AsientoContableManager;