// src/components/preFactura/DatosGeneralesTab.jsx
import React from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Badge } from "primereact/badge";
import DetallesTab from "./DetallesTab";
import { getResponsiveFontSize } from "../../utils/utils";
import EntidadComercialSelector from "../common/EntidadComercialSelector";
import CrearEntidadComercialButton from "../shared/CrearEntidadComercialButton";
import { useAuthStore } from "../../shared/stores/useAuthStore"; // ← AGREGAR ESTA LÍNEA
import IrACxCEditar from "../common/IrACxCEditar";
import SelectorDocumentoAfecto from "../common/SelectorDocumentoAfecto";
import AuditoriaDialog from "../common/AuditoriaDialog";
import CambiarTipoSerieDialog from "../common/CambiarTipoSerieDialog";
import BooleanToggleButton from "../common/BooleanToggleButton";

export default function DatosGeneralesTab({
  formData,
  onChange,
  onCargarItemsDocAfecto,
  onSerieChange,
  onCambiarTipoSerie,
  onIrAPreFacturaOrigen, // Agregar después de onSerieChange
  onIrAMovimientoAlmacen, // Agregar después de onIrAPreFacturaOrigen
  onIrACotizacionVenta, // Agregar después de onIrAMovimientoAlmacen
  onIrAContratoServicio, // Agregar después de onIrACotizacionVenta
  onClienteCreado, // ← NUEVO
  refreshClientes, // ← NUEVO
  toast, // ← NUEVO
  empresasOptions,
  tiposDocumentoOptions,
  clientesOptions,
  tiposProductoOptions,
  formasPagoOptions,
  personalOptions,
  personalVendedorOptions = [],
  seriesDocOptions,
  estadosPreFacturaOptions,
  centrosCostoOptions,
  monedasOptions,
  unidadesNegocioOptions = [],
  bancosOptions,
  incotermsOptions,
  paisesOptions,
  puertosOptions,
  tiposContenedorOptions,
  agenteAduanasOptions,
  periodosContables = [],
  motivosNCND = [],
  mediosPago = [],
  bancos = [],
  cuentasCorrientes = [],
  estadosCxC = [],
  isEdit,
  esSuperUsuario = false, // ← AGREGAR ESTA LÍNEA
  puedeEditar,
  puedeEditarDetalles,
  detallesCount = 0,
  // Props para DetallesTab
  preFacturaId,
  productos,
  empresaId,
  empresas, // ⭐ AGREGAR
  onCountChange,
  // Totales calculados
  subtotal = 0,
  totalIGV = 0,
  montoImpuestoRenta = 0,
  total = 0,
  // Impuestos
  aplicaDetraccion = false,
  montoDetraccion = 0,
  porcentajeDetraccion = 0,
  aplicaRetencion = false,
  montoRetencion = 0,
  porcentajeRetencion = 0,
  aplicaPercepcion = false,
  montoPercepcion = 0,
  porcentajePercepcion = 0,
  // Objeto moneda de la pre-factura (viene de la relación)
  monedaPreFactura = null,
  readOnly = false,
  contactosClienteOptions = [],
  direccionesClienteOptions = [],
  permisos = {}, // ⭐ NUEVO
  // ⭐ CAMPOS DE COMPROBANTE ELECTRÓNICO
  facturado,
  onFacturadoChange,
  fechaFacturacion,
  onFechaFacturacionChange,
  tipoDocumentoFinalId,
  onTipoDocumentoFinalIdChange,
  numeroDocumentoFinal,
  onNumeroDocumentoFinalChange,
  numSerieDocFinal,
  onNumSerieDocFinalChange,
  numCorreDocFinal,
  onNumCorreDocFinalChange,
}) {
  // Determinar si es exportación para mostrar campos adicionales
  const esExportacion = formData.paisDestinoId || formData.incotermId;
  const { usuario } = useAuthStore();

  // ⭐ PERMISOS ESPECIALES: Usuario con puedeAprobarDocs tiene acceso total
  const tienePermisoEspecial = permisos.puedeAprobarDocs === true;
  const estaAnulada = formData.estadoId === 47;

  // Determinar si puede editar (normal o con permiso especial)
  const puedeEditarConPermiso = tienePermisoEspecial
    ? !estaAnulada && !readOnly
    : puedeEditar && !readOnly;

  const puedeEditarDetallesConPermiso = tienePermisoEspecial
    ? !estaAnulada && !readOnly
    : puedeEditarDetalles && !readOnly;
  // Obtener la moneda seleccionada dinámicamente del estado
  const monedaSeleccionada = monedasOptions.find(
    (m) => m.value === formData.monedaId,
  );
  const simboloMoneda = monedaSeleccionada?.codigoSunat || "";
  // Detectar si es Saldo Inicial
  const tipoDocSeleccionado = tiposDocumentoOptions.find(
    (t) => Number(t.value) === Number(formData.tipoDocumentoId),
  );
  const esSaldoInicial = tipoDocSeleccionado?.label?.includes("SI-");
  // ✅ FILTRAR Y PREPARAR PERIODOS CONTABLES
  const periodosContablesFiltrados = periodosContables
    .filter((p) => {
      // Filtrar por empresa O incluir el periodo seleccionado actualmente
      const perteneceAEmpresa =
        Number(p.empresaId) === Number(formData.empresaId);
      const esPeriodoSeleccionado =
        formData.periodoContableId &&
        Number(p.id) === Number(formData.periodoContableId)
      return perteneceAEmpresa || esPeriodoSeleccionado;
    })
    .sort((a, b) => {
      // Ordenar por fecha de inicio descendente (más recientes primero)
      return new Date(b.fechaInicio) - new Date(a.fechaInicio);
    })
    .map((p) => {
      // Agregar indicador visual del estado
      let estadoLabel = "";
      const estadoId = Number(p.estadoId);

      // IDs de estados para PERIODO CONTABLE:
      // 73 = ABIERTO, 74 = CERRADO, 75 = BLOQUEADO
      if (estadoId === 73) {
        estadoLabel = "🟢 ABIERTO";
      } else if (estadoId === 74) {
        estadoLabel = "🔴 CERRADO";
      } else if (estadoId === 75) {
        estadoLabel = "🔒 BLOQUEADO";
      } else {
        // Fallback: usar descripción del estado si existe
        estadoLabel = p.estado?.descripcion || "⚪ SIN ESTADO";
      }
      return {
        label: `${p.nombrePeriodo} - ${estadoLabel}`,
        value: Number(p.id),
        estadoId: estadoId,
        disabled: estadoId !== 73 && !isEdit, // Deshabilitar si no está ABIERTO (solo en creación)
      };
    });
  return (
    <div className="fluid">
      {/* ============================================ */}
      {/* SECCIÓN 1: INFORMACIÓN DEL DOCUMENTO */}
      {/* ============================================ */}
      <Panel header="📄 Información del Documento" toggleable>
        {/* FILA 1: Código (solo lectura), Empresa, Fecha Documento, Fecha Vencimiento */}
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="empresaId"
            >
              Empresa*
            </label>
            <Dropdown
              id="empresaId"
              value={formData.empresaId}
              options={empresasOptions}
              onChange={(e) => onChange("empresaId", e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar empresa"
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
              disabled={isEdit || !puedeEditar || readOnly}
            />
          </div>
          <div style={{ flex: 0.7 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="fechaDocumento"
            >
              Fecha Documento*
            </label>
            <Calendar
              id="fechaDocumento"
              value={formData.fechaDocumento}
              onChange={(e) => onChange("fechaDocumento", e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              disabled={!puedeEditarConPermiso}
              inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 0.7 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="fechaVencimiento"
            >
              Fecha Vencimiento
            </label>
            <Calendar
              id="fechaVencimiento"
              value={formData.fechaVencimiento}
              onChange={(e) => onChange("fechaVencimiento", e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              disabled={!puedeEditarConPermiso}
              inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 0.7 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="fechaContable"
            >
              Fecha Contable*
            </label>
            <Calendar
              id="fechaContable"
              value={formData.fechaContable}
              onChange={(e) => onChange("fechaContable", e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              disabled={!puedeEditarConPermiso}
              inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="periodoContableId"
            >
              Periodo Contable
            </label>
            <Dropdown
              id="periodoContableId"
              value={
                formData.periodoContableId
                  ? Number(formData.periodoContableId)
                  : null
              }
              options={periodosContablesFiltrados || []}
              optionDisabled={(option) => option.disabled}
              onChange={(e) => onChange("periodoContableId", e.value)}
              placeholder="Seleccione periodo contable"
              showClear
              filter
              disabled={!puedeEditarConPermiso}
              style={{ fontSize: getResponsiveFontSize() }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="estadoId"
            >
              Estado*
            </label>
            <Dropdown
              id="estadoId"
              value={formData.estadoId}
              options={estadosPreFacturaOptions}
              onChange={(e) => onChange("estadoId", e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar estado"
              disabled={!puedeEditarConPermiso}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="unidadNegocioId"
            >
              Unidad de Negocio*
            </label>
            <Dropdown
              id="unidadNegocioId"
              value={
                formData.unidadNegocioId
                  ? Number(formData.unidadNegocioId)
                  : null
              }
              options={unidadesNegocioOptions}
              onChange={(e) => onChange("unidadNegocioId", e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar unidad de negocio"
              filter
              showClear
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
              disabled={!puedeEditarConPermiso}
            />
          </div>
        </div>

        {/* FILA 2: Tipo Documento, Serie, Num Serie, Num Correlativo, Número Documento */}
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginTop: "1rem",
          }}
        >
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="tipoDocumentoId"
            >
              Tipo Documento*
            </label>
            <Dropdown
              id="tipoDocumentoId"
              value={formData.tipoDocumentoId}
              options={tiposDocumentoOptions}
              onChange={(e) => onChange("tipoDocumentoId", e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar tipo"
              filter
              disabled={isEdit || !puedeEditar || readOnly}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="serieDocId"
            >
              Serie Documento*
            </label>
            <Dropdown
              id="serieDocId"
              value={formData.serieDocId}
              options={seriesDocOptions}
              onChange={(e) => onSerieChange(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar serie"
              filter
              disabled={
                isEdit ||
                !puedeEditar ||
                readOnly ||
                !formData.empresaId ||
                !formData.tipoDocumentoId
              }
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          {isEdit && (
            <div style={{ flex: 0.3, display: 'flex', alignItems: 'flex-end' }}>
              <Button
                label="Cambiar"
                icon="pi pi-refresh"
                severity="warning"
                outlined
                onClick={() => onChange('_showCambiarTipoSerieDialog', true)}
                disabled={!puedeEditarConPermiso}
                style={{ width: '100%', fontWeight: 'bold' }}
                tooltip="Cambiar Tipo de Documento y Serie"
              />
            </div>
          )}
          <div style={{ flex: 0.25 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="numSerieDoc"
            >
              Num Serie
            </label>
            <InputText
              id="numSerieDoc"
              value={formData.numSerieDoc || ""}
              disabled
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 0.5 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="numCorreDoc"
            >
              Num Correlativo
            </label>
            <InputText
              id="numCorreDoc"
              value={formData.numCorreDoc || ""}
              disabled
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 0.5 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="numeroDocumento"
            >
              Número Documento
            </label>
            <InputText
              id="numeroDocumento"
              value={formData.numeroDocumento || ""}
              disabled
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="esGerencial"
            >
              Tipo de Facturación
            </label>
            <Button
              id="esGerencial"
              label={formData.esGerencial ? "GERENCIAL" : "FISCAL"}
              icon={
                formData.esGerencial
                  ? "pi pi-times-circle"
                  : "pi pi-check-circle"
              }
              severity={formData.esGerencial ? "warning" : "success"}
              onClick={() => onChange("esGerencial", !formData.esGerencial)}
              disabled={!puedeEditar || readOnly || formData.facturado}
              style={{
                width: "100%",
                fontWeight: "bold",
                justifyContent: "center",
                color: "#000",
              }}
            />
          </div>
          <div style={{ flex: 0.5 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="nroLiquidacionFacturacion"
            >
              N° Dcmto Ref.
            </label>
            <InputText
              id="nroLiquidacionFacturacion"
              value={formData.nroLiquidacionFacturacion || ""}
              onChange={(e) =>
                onChange(
                  "nroLiquidacionFacturacion",
                  e.target.value.toUpperCase(),
                )
              }
              maxLength={40}
              disabled={!puedeEditarConPermiso}
              style={{ fontWeight: "bold" }}
            />
          </div>
          {/* BOTÓN EDITAR CxC - Aparece solo si existe CxC asociada */}

          <div style={{ flex: 0.5, display: "flex", alignItems: "flex-end" }}>
            <IrACxCEditar
              preFacturaId={formData.id}
              preFactura={formData}
              empresas={empresas || []}
              clientes={clientesOptions || []}
              monedas={monedasOptions || []}
              estados={estadosCxC || []}
              periodosContables={periodosContables || []}
              mediosPago={mediosPago || []}
              bancos={bancos || []}
              cuentasCorrientes={cuentasCorrientes || []}
              permisos={{}}
              toast={toast}
              showCxCId={true}
              estadoIdMinimo={1}
              severity="success"
              outlined={true}
              icon="pi pi-arrow-right"
              style={{ width: "100%", fontWeight: "bold" }}
            />
          </div>

          {/* PREFACTURA ORIGEN - Botón para ir al origen (para copias) */}
          {formData.preFacturaOrigenId && (
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
                htmlFor="preFacturaOrigen"
              >
                PreFactura Origen
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  id="preFacturaOrigen"
                  label={`ID: ${formData.preFacturaOrigenId}`}
                  icon="pi pi-external-link"
                  severity="info"
                  onClick={() =>
                    onIrAPreFacturaOrigen &&
                    onIrAPreFacturaOrigen(formData.preFacturaOrigenId)
                  }
                  outlined
                  style={{
                    flex: 1,
                    fontWeight: "bold",
                    textTransform: "uppercase",
                  }}
                />
                <Button
                  label="P/C"
                  severity="info"
                  disabled
                  style={{
                    width: "60px",
                    fontWeight: "bold",
                  }}
                  tooltip="Partición/Copia"
                  tooltipOptions={{ position: "top" }}
                />
              </div>
            </div>
          )}
          {/* INDICADOR P/O - Para PreFacturas originales particionadas */}
          {formData.esParticionada && !formData.preFacturaOrigenId && (
            <div style={{ flex: 1 }}>
              <Button
                label="P/O"
                severity="warning"
                disabled
                style={{
                  width: "60px",
                  fontWeight: "bold",
                }}
                tooltip="Partición/Original"
                tooltipOptions={{ position: "top" }}
              />
            </div>
          )}
        </div>
      </Panel>


      {/* ════════════════════════════════════════════════════════════ */}
      {/* PANEL: COMPROBANTE ELECTRÓNICO GENERADO */}
      {/* ════════════════════════════════════════════════════════════ */}
      <Panel
        header="📄 Comprobante Electrónico Generado"
        toggleable
        collapsed={!facturado}
        className="mt-3"
      >
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 5,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          {/* FACTURADO */}
          <div style={{ flex: 0.5 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="facturado"
            >
              Estado Facturación
            </label>
            <BooleanToggleButton
              value={facturado}
              onChange={onFacturadoChange}
              labelTrue="FACTURADO"
              labelFalse="PENDIENTE"
              severityTrue="success"
              severityFalse="warning"
              icon={facturado ? "pi-check-circle" : "pi-clock"}
              disabled={!puedeEditarConPermiso}
            />
          </div>
          <div style={{ flex: 0.75 }}>
            {/* FECHA FACTURACIÓN */}
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="fechaFacturacion"
            >
              Fecha Facturación
            </label>
            <Calendar
              id="fechaFacturacion"
              value={fechaFacturacion}
              onChange={(e) =>
                onFechaFacturacionChange && onFechaFacturacionChange(e.value)
              }
              dateFormat="dd/mm/yy"
              showIcon
              disabled={!puedeEditarConPermiso}
              showButtonBar
              inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          {/* TIPO DOCUMENTO FINAL */}
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="tipoDocumentoFinalId"
            >
              Tipo Comprobante
            </label>
            <Dropdown
              id="tipoDocumentoFinalId"
              value={tipoDocumentoFinalId}
              options={tiposDocumentoOptions}
              onChange={(e) =>
                onTipoDocumentoFinalIdChange &&
                onTipoDocumentoFinalIdChange(e.value)
              }
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccione tipo"
              filter
              disabled={!puedeEditarConPermiso}
              style={{
                width: "100%",
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            />
          </div>

          {/* SERIE DOCUMENTO FINAL */}
          <div style={{ flex: 0.5 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="numSerieDocFinal"
            >
              Serie
            </label>
            <InputText
              id="numSerieDocFinal"
              value={numSerieDocFinal || ""}
              onChange={(e) =>
                onNumSerieDocFinalChange &&
                onNumSerieDocFinalChange(e.target.value.toUpperCase())
              }
              maxLength={40}
              disabled={!puedeEditarConPermiso}
              style={{
                width: "100%",
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            />
          </div>

          {/* CORRELATIVO DOCUMENTO FINAL */}
          <div style={{ flex: 0.5 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="numCorreDocFinal"
            >
              Correlativo
            </label>
            <InputText
              id="numCorreDocFinal"
              value={numCorreDocFinal || ""}
              onChange={(e) =>
                onNumCorreDocFinalChange &&
                onNumCorreDocFinalChange(e.target.value)
              }
              maxLength={40}
              disabled={!puedeEditarConPermiso}
              style={{
                width: "100%",
                fontWeight: "bold",
              }}
            />
          </div>

          {/* NÚMERO DOCUMENTO FINAL (CONCATENADO) */}
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="numeroDocumentoFinal"
            >
              Número Completo
            </label>
            <InputText
              id="numeroDocumentoFinal"
              value={numeroDocumentoFinal || ""}
              disabled
              placeholder="F001-00000456"
              style={{
                width: "100%",
                fontWeight: "bold",
                backgroundColor: "#f0f0f0",
                textTransform: "uppercase",
              }}
              tooltip="Se genera automáticamente: Serie + Correlativo"
              tooltipOptions={{ position: "top" }}
            />
          </div>
        </div>
      </Panel>



      {/* ============================================ */}
      {/* SECCIÓN 2: DATOS NOTA DE CRÉDITO/DÉBITO (CONDICIONAL) */}
      {/* ============================================ */}
      {(Number(formData.tipoDocumentoId) === 8 || Number(formData.tipoDocumentoId) === 9) && (
        <Panel
          header="📝 Datos de Nota de Crédito/Débito"
          toggleable
          style={{ marginTop: "1rem" }}
        >
          {/* FILA 1: Selector de Documento Afectado y Motivo, Campos Manuales (para docs del 2025 o anteriores) */}
          <div
            style={{
              alignItems: "end",
              display: "flex",
              gap: 5,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label
                style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
                htmlFor="documentoAfecto"
              >
                🔍 Buscar Documento Afectado (Opcional) 💡 Use este selector para documentos del 2026 en adelante
              </label>
              <SelectorDocumentoAfecto
                value={formData.dcmtoAfectoNCNDId}
                empresaId={formData.empresaId}
                clienteId={formData.clienteId}
                fechaLimite={formData.fechaDocumento}
                onChange={(preFacturaId) => {
                  if (preFacturaId) {
                    // Cargar datos completos del documento
                    import("../../api/preFactura").then(({ getPreFacturaPorId }) => {
                      getPreFacturaPorId(preFacturaId).then((datos) => {
                        onChange("dcmtoAfectoNCNDId", preFacturaId);
                        onChange("fechaDcmtoAfectoNCND", new Date(datos.fechaFacturacion));
                        onChange("numeroDcmtoAfectoNCND", datos.numeroDocumentoFinal);
                        // Cargar items automáticamente
                        if (onCargarItemsDocAfecto && datos.detalles && datos.detalles.length > 0) {
                          onCargarItemsDocAfecto(datos.detalles);
                        }
                      });
                    });
                  } else {
                    // Limpiar campos
                    onChange("dcmtoAfectoNCNDId", null);
                    onChange("fechaDcmtoAfectoNCND", null);
                    onChange("numeroDcmtoAfectoNCND", null);
                  }
                }}
                disabled={!puedeEditarConPermiso || !formData.empresaId || !formData.clienteId}
                placeholder="Buscar en sistema..."
                toast={toast}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
                htmlFor="motivoNotaCreditoDebitoId"
              >
                Motivo NC/ND*
              </label>
              <Dropdown
                id="motivoNotaCreditoDebitoId"
                value={
                  formData.motivoNotaCreditoDebitoId
                    ? Number(formData.motivoNotaCreditoDebitoId)
                    : null
                }
                options={(() => {
                  const tipoDocId = Number(formData.tipoDocumentoId);

                  // Filtrar motivos según tipo de documento
                  return motivosNCND
                    .filter((m) => {
                      if (!m.activo) return false;
                      // Si es NC (ID=8), solo mostrar motivos NC (esNCND = false)
                      if (tipoDocId === 8) return m.esNCND === false;
                      // Si es ND (ID=9), solo mostrar motivos ND (esNCND = true)
                      if (tipoDocId === 9) return m.esNCND === true;
                      // Para otros tipos, mostrar todos
                      return true;
                    })
                    .map((m) => ({
                      label: `${m.codigoSunat} - ${m.descripcion}`,
                      value: Number(m.id),
                    }));
                })()}
                onChange={(e) => onChange("motivoNotaCreditoDebitoId", e.value)}
                placeholder="Seleccionar motivo"
                filter
                showClear
                disabled={!puedeEditarConPermiso}
                style={{ fontWeight: "bold", textTransform: "uppercase" }}
              />
            </div>
            <div style={{ flex: 0.7 }}>
              <label
                style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
                htmlFor="fechaDcmtoAfectoNCND"
              >
                Fecha Dcmto. Afectado
              </label>
              <Calendar
                id="fechaDcmtoAfectoNCND"
                value={formData.fechaDcmtoAfectoNCND}
                onChange={(e) => onChange("fechaDcmtoAfectoNCND", e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                disabled={!puedeEditarConPermiso}
                inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
                htmlFor="numeroDcmtoAfectoNCND"
              >
                N° Dcmto. Afectado
              </label>
              <InputText
                id="numeroDcmtoAfectoNCND"
                value={formData.numeroDcmtoAfectoNCND || ""}
                onChange={(e) =>
                  onChange("numeroDcmtoAfectoNCND", e.target.value.toUpperCase())
                }
                maxLength={40}
                disabled={!puedeEditarConPermiso}
                style={{ fontWeight: "bold", textTransform: "uppercase" }}
              />
            </div>
          </div>
        </Panel>
      )}

      {/* ============================================ */}
      {/* SECCIÓN 3: DATOS COMERCIALES */}
      {/* ============================================ */}
      <Panel
        header="💼 Datos Comerciales"
        toggleable
        style={{ marginTop: "1rem" }}
      >
        {/* FILA 1: Tipo Producto, Forma Pago, Banco */}
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "end",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
              flex: 2,
            }}
          >
            <div style={{ flex: 2 }}>
              <label
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
                htmlFor="clienteId"
              >
                Cliente*
              </label>
              <EntidadComercialSelector
                empresaIdPreseleccionada={formData.empresaId}
                value={formData.clienteId}
                onChange={(value) => onChange("clienteId", value)}
                disabled={!puedeEditar || readOnly || !formData.empresaId}
                required={true}
                placeholder="Seleccione un cliente"
                refreshTrigger={refreshClientes}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label style={{ opacity: 0 }}>.</label>
              <CrearEntidadComercialButton
                empresaId={formData.empresaId}
                tipoEntidad="cliente"
                onEntidadCreada={onClienteCreado}
                label="Crear Cliente"
                icon="pi pi-users"
                severity="success"
                outlined={true}
                disabled={!puedeEditar || readOnly || !formData.empresaId}
                className="w-full"
                toast={toast}
              />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="contactoClienteId"
            >
              Contacto Cliente
            </label>
            <Dropdown
              id="contactoClienteId"
              value={formData.contactoClienteId}
              options={contactosClienteOptions}
              onChange={(e) => onChange("contactoClienteId", e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar contacto"
              filter
              showClear
              disabled={!puedeEditar || readOnly || !formData.clienteId}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="dirEntregaId"
            >
              Dir. Entrega
            </label>
            <Dropdown
              id="dirEntregaId"
              value={formData.dirEntregaId}
              options={direccionesClienteOptions}
              onChange={(e) => onChange("dirEntregaId", e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar dirección"
              filter
              showClear
              disabled={!puedeEditar || readOnly || !formData.clienteId}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
        </div>

        {/* FILA 2: Centro Costo, Tipo Producto, Checkbox esGerencial */}
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginTop: "1rem",
          }}
        >
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="tipoProductoId"
            >
              Tipo Producto*
            </label>
            <Dropdown
              id="tipoProductoId"
              value={formData.tipoProductoId}
              options={tiposProductoOptions}
              onChange={(e) => onChange("tipoProductoId", e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar tipo"
              filter
              showClear
              disabled={!puedeEditarConPermiso}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="montoAdelantadoCliente"
            >
              Monto Adelantado
            </label>
            <InputNumber
              id="montoAdelantadoCliente"
              value={formData.montoAdelantadoCliente}
              onValueChange={(e) => onChange("montoAdelantadoCliente", e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
              prefix={simboloMoneda}
              disabled={!puedeEditarConPermiso}
              inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="porcentajeAdelanto"
            >
              % Adelanto
            </label>
            <InputNumber
              id="porcentajeAdelanto"
              value={formData.porcentajeAdelanto}
              onValueChange={(e) => onChange("porcentajeAdelanto", e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
              max={100}
              suffix="%"
              disabled={!puedeEditarConPermiso}
              inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          {/* MOVIMIENTO DE ALMACÉN - Botón para ir al movimiento */}
          {formData.movSalidaAlmacenId && (
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
                htmlFor="movAlmacen"
              >
                Movimiento de Almacén (Kardex)
              </label>
              <Button
                id="movAlmacen"
                label={`ID: ${formData.movSalidaAlmacenId}`}
                icon="pi pi-box"
                severity="success"
                onClick={() =>
                  onIrAMovimientoAlmacen &&
                  onIrAMovimientoAlmacen(formData.movSalidaAlmacenId)
                }
                outlined
                style={{
                  width: "100%",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
                disabled={readOnly}
              />
            </div>
          )}
          {/* COTIZACIÓN VENTA - Botón para ir a la cotización */}
          {formData.cotizacionVentaId && (
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
                htmlFor="cotizacionVenta"
              >
                Cotización de Venta
              </label>
              <Button
                id="cotizacionVenta"
                label={`ID: ${formData.cotizacionVentaId}`}
                icon="pi pi-file-edit"
                severity="warning"
                onClick={() =>
                  onIrACotizacionVenta &&
                  onIrACotizacionVenta(formData.cotizacionVentaId)
                }
                outlined
                style={{
                  width: "100%",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
                disabled={readOnly}
              />
            </div>
          )}
          {/* CONTRATO SERVICIO - Botón para ir al contrato */}
          {formData.contratoServicioId && (
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
                htmlFor="contratoServicio"
              >
                Contrato de Servicio
              </label>
              <Button
                id="contratoServicio"
                label={`ID: ${formData.contratoServicioId}`}
                icon="pi pi-file-check"
                severity="help"
                onClick={() =>
                  onIrAContratoServicio &&
                  onIrAContratoServicio(formData.contratoServicioId)
                }
                outlined
                style={{
                  width: "100%",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
                disabled={readOnly}
              />
            </div>
          )}
        </div>

        {/* FILA 2: Moneda, Tipo Cambio, % IGV, Exonerado IGV */}
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginTop: "1rem",
          }}
        >
          <div style={{ flex: 2 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="formaPagoId"
            >
              Forma Pago*
            </label>
            <Dropdown
              id="formaPagoId"
              value={formData.formaPagoId}
              options={formasPagoOptions}
              onChange={(e) => onChange("formaPagoId", e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar forma"
              filter
              showClear
              disabled={!puedeEditarConPermiso}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 0.5 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="bancoId"
            >
              Banco
            </label>
            <Dropdown
              id="bancoId"
              value={formData.bancoId}
              options={bancosOptions}
              onChange={(e) => onChange("bancoId", e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar banco"
              filter
              showClear
              disabled={!puedeEditarConPermiso}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 0.5 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="monedaId"
            >
              Moneda*
            </label>
            <Dropdown
              id="monedaId"
              value={formData.monedaId}
              options={monedasOptions}
              onChange={(e) => onChange("monedaId", e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar moneda"
              filter
              disabled={!puedeEditarConPermiso}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 0.5 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="tipoCambio"
            >
              Tipo Cambio*
            </label>
            <InputNumber
              id="tipoCambio"
              value={formData.tipoCambio}
              onValueChange={(e) => onChange("tipoCambio", e.value)}
              mode="decimal"
              minFractionDigits={4}
              maxFractionDigits={4}
              min={0}
              disabled={!puedeEditarConPermiso}
              inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 0.5 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="porcentajeIgv"
            >
              % IGV
            </label>
            <InputNumber
              id="porcentajeIgv"
              value={formData.porcentajeIgv}
              onValueChange={(e) => onChange("porcentajeIgv", e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
              max={100}
              suffix="%"
              disabled={!puedeEditar || readOnly || formData.exoneradoIgv}
              inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="exoneradoIgv"
            >
              Estado IGV
            </label>
            <Button
              id="exoneradoIgv"
              label={
                formData.exoneradoIgv ? "EXONERADO AL IGV" : "AFECTO AL IGV"
              }
              icon={
                formData.exoneradoIgv
                  ? "pi pi-times-circle"
                  : "pi pi-check-circle"
              }
              severity={formData.exoneradoIgv ? "danger" : "success"}
              onClick={() => onChange("exoneradoIgv", !formData.exoneradoIgv)}
              disabled={!puedeEditarConPermiso}
              outlined
              style={{
                width: "100%",
                fontWeight: "bold",
                justifyContent: "center",
                color: "#000",
              }}
            />
          </div>
          <div style={{ flex: 0.5 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="porcentajeImpuestoRenta"
            >
              % Imp. Renta
            </label>
            <InputNumber
              id="porcentajeImpuestoRenta"
              value={formData.porcentajeImpuestoRenta}
              onValueChange={(e) => onChange("porcentajeImpuestoRenta", e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
              max={100}
              suffix="%"
              disabled={!puedeEditar || readOnly || !formData.aplicaImpuestoRenta}
              inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="aplicaImpuestoRenta"
            >
              Estado Imp. Renta
            </label>
            <Button
              id="aplicaImpuestoRenta"
              label={
                formData.aplicaImpuestoRenta ? "APLICA IMP. RENTA" : "NO APLICA IMP. RENTA"
              }
              icon={
                formData.aplicaImpuestoRenta
                  ? "pi pi-check-circle"
                  : "pi pi-times-circle"
              }
              severity={formData.aplicaImpuestoRenta ? "warning" : "secondary"}
              onClick={() => onChange("aplicaImpuestoRenta", !formData.aplicaImpuestoRenta)}
              disabled={!puedeEditarConPermiso}
              outlined
              style={{
                width: "100%",
                fontWeight: "bold",
                justifyContent: "center",
                color: "#000",
              }}
            />
          </div>
        </div>
      </Panel>
      {/* ============================================ */}
      {/* SECCIÓN 7: DETALLES DE PRODUCTOS */}
      {/* ============================================ */}
      <Panel
        header={`📦 Detalles de Productos ${detallesCount > 0 ? `(${detallesCount})` : ""
          }`}
        toggleable
        collapsed={false}
        style={{ marginTop: "1rem" }}
      >
        <DetallesTab
          preFacturaId={preFacturaId}
          productos={productos}
          empresaId={empresaId}
          empresas={empresas}
          puedeEditar={puedeEditarDetalles}
          toast={toast}
          onCountChange={onCountChange}
          readOnly={readOnly}
          subtotal={subtotal}
          totalIGV={totalIGV}
          montoImpuestoRenta={montoImpuestoRenta}
          aplicaImpuestoRenta={formData.aplicaImpuestoRenta || false}
          total={total}
          porcentajeIGV={formData.porcentajeIgv || 0}
          monedaId={formData.monedaId}
          monedas={monedasOptions}
          pagosPreviosSI={formData.pagosPreviosSI || 0}
          tipoDocumentoId={formData.tipoDocumentoId}
          tiposDocumentoOptions={tiposDocumentoOptions}
          onChange={onChange}
          clienteId={formData.clienteId}
          fechaDocumento={formData.fechaDocumento}
          aplicaDetraccion={aplicaDetraccion}
          montoDetraccion={montoDetraccion}
          porcentajeDetraccion={porcentajeDetraccion}
          aplicaRetencion={aplicaRetencion}
          montoRetencion={montoRetencion}
          porcentajeRetencion={porcentajeRetencion}
          aplicaPercepcion={aplicaPercepcion}
          montoPercepcion={montoPercepcion}
          porcentajePercepcion={porcentajePercepcion}
        />
      </Panel>

      {/* ============================================ */}
      {/* SECCIÓN 4: RESPONSABLES */}
      {/* ============================================ */}
      <Panel
        header="👥 Responsables"
        toggleable
        collapsed
        style={{ marginTop: "1rem" }}
      >
        {/* FILA 1: Resp. Ventas, Autoriza Venta, Supervisor Campo */}
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="respVentasId"
            >
              Resp. Ventas*
            </label>
            <Dropdown
              id="respVentasId"
              value={formData.respVentasId}
              options={personalVendedorOptions}
              onChange={(e) => onChange("respVentasId", e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar vendedor"
              filter
              showClear
              disabled={!puedeEditarConPermiso}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="autorizaVentaId"
            >
              Autoriza Venta
            </label>
            <Dropdown
              id="autorizaVentaId"
              value={formData.autorizaVentaId}
              options={personalOptions}
              onChange={(e) => onChange("autorizaVentaId", e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar autorizador"
              filter
              showClear
              disabled={!puedeEditarConPermiso}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="supervisorVentaCampoId"
            >
              Supervisor Campo
            </label>
            <Dropdown
              id="supervisorVentaCampoId"
              value={formData.supervisorVentaCampoId}
              options={personalOptions}
              onChange={(e) => onChange("supervisorVentaCampoId", e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar supervisor"
              filter
              showClear
              disabled={!puedeEditarConPermiso}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
        </div>

        {/* FILA 2: Resp. Embarque, Resp. Producción, Resp. Almacén */}
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginTop: "1rem",
          }}
        >
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="respEmbarqueId"
            >
              Resp. Embarque
            </label>
            <Dropdown
              id="respEmbarqueId"
              value={formData.respEmbarqueId}
              options={personalOptions}
              onChange={(e) => onChange("respEmbarqueId", e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar responsable"
              filter
              showClear
              disabled={!puedeEditarConPermiso}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="respProduccionId"
            >
              Resp. Producción
            </label>
            <Dropdown
              id="respProduccionId"
              value={formData.respProduccionId}
              options={personalOptions}
              onChange={(e) => onChange("respProduccionId", e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar responsable"
              filter
              showClear
              disabled={!puedeEditarConPermiso}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="respAlmacenId"
            >
              Resp. Almacén
            </label>
            <Dropdown
              id="respAlmacenId"
              value={formData.respAlmacenId}
              options={personalOptions}
              onChange={(e) => onChange("respAlmacenId", e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar responsable"
              filter
              showClear
              disabled={!puedeEditarConPermiso}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
        </div>
      </Panel>

      {/* ============================================ */}
      {/* SECCIÓN 5: EXPORTACIÓN (Condicional) */}
      {/* ============================================ */}
      {esExportacion && (
        <Panel
          header="🌍 Datos de Exportación"
          toggleable
          collapsed
          style={{ marginTop: "1rem" }}
        >
          {/* FILA 1: País Destino, Incoterm, Puerto Embarque, Puerto Destino */}
          <div
            style={{
              alignItems: "end",
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
                htmlFor="paisDestinoId"
              >
                País Destino
              </label>
              <Dropdown
                id="paisDestinoId"
                value={formData.paisDestinoId}
                options={paisesOptions}
                onChange={(e) => onChange("paisDestinoId", e.value)}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar país"
                filter
                showClear
                disabled={!puedeEditarConPermiso}
                style={{ fontWeight: "bold", textTransform: "uppercase" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
                htmlFor="incotermId"
              >
                Incoterm
              </label>
              <Dropdown
                id="incotermId"
                value={formData.incotermId}
                options={incotermsOptions}
                onChange={(e) => onChange("incotermId", e.value)}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar incoterm"
                filter
                showClear
                disabled={!puedeEditarConPermiso}
                style={{ fontWeight: "bold", textTransform: "uppercase" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
                htmlFor="puertoEmbarqueId"
              >
                Puerto Embarque
              </label>
              <Dropdown
                id="puertoEmbarqueId"
                value={formData.puertoEmbarqueId}
                options={puertosOptions}
                onChange={(e) => onChange("puertoEmbarqueId", e.value)}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar puerto"
                filter
                showClear
                disabled={!puedeEditarConPermiso}
                style={{ fontWeight: "bold", textTransform: "uppercase" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
                htmlFor="puertoDestinoId"
              >
                Puerto Destino
              </label>
              <Dropdown
                id="puertoDestinoId"
                value={formData.puertoDestinoId}
                options={puertosOptions}
                onChange={(e) => onChange("puertoDestinoId", e.value)}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar puerto"
                filter
                showClear
                disabled={!puedeEditarConPermiso}
                style={{ fontWeight: "bold", textTransform: "uppercase" }}
              />
            </div>
          </div>

          {/* FILA 2: Agente Aduana, Número Buque, Número BL, Número Contenedor */}
          <div
            style={{
              alignItems: "end",
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
              marginTop: "1rem",
            }}
          >
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
                htmlFor="agenteAduanaId"
              >
                Agente Aduana
              </label>
              <Dropdown
                id="agenteAduanaId"
                value={formData.agenteAduanaId}
                options={agenteAduanasOptions}
                onChange={(e) => onChange("agenteAduanaId", e.value)}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar agente"
                filter
                showClear
                disabled={!puedeEditarConPermiso}
                style={{ fontWeight: "bold", textTransform: "uppercase" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
                htmlFor="numeroBuque"
              >
                Número Buque
              </label>
              <InputText
                id="numeroBuque"
                value={formData.numeroBuque || ""}
                onChange={(e) => onChange("numeroBuque", e.target.value)}
                disabled={!puedeEditarConPermiso}
                style={{ fontWeight: "bold", textTransform: "uppercase" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
                htmlFor="numeroBL"
              >
                Número BL
              </label>
              <InputText
                id="numeroBL"
                value={formData.numeroBL || ""}
                onChange={(e) => onChange("numeroBL", e.target.value)}
                disabled={!puedeEditarConPermiso}
                style={{ fontWeight: "bold", textTransform: "uppercase" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
                htmlFor="numContenedor"
              >
                Número Contenedor
              </label>
              <InputText
                id="numContenedor"
                value={formData.numContenedor || ""}
                onChange={(e) => onChange("numContenedor", e.target.value)}
                disabled={!puedeEditarConPermiso}
                style={{ fontWeight: "bold", textTransform: "uppercase" }}
              />
            </div>
          </div>

          {/* FILA 3: Tipo Contenedor, Factor Exportación, Factor Exportación Real */}
          <div
            style={{
              alignItems: "end",
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
              marginTop: "1rem",
            }}
          >
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
                htmlFor="tipoContenedorId"
              >
                Tipo Contenedor
              </label>
              <Dropdown
                id="tipoContenedorId"
                value={formData.tipoContenedorId}
                options={tiposContenedorOptions}
                onChange={(e) => onChange("tipoContenedorId", e.value)}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar tipo"
                filter
                showClear
                disabled={!puedeEditarConPermiso}
                style={{ fontWeight: "bold", textTransform: "uppercase" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
                htmlFor="factorExportacion"
              >
                Factor Exportación
              </label>
              <InputNumber
                id="factorExportacion"
                value={formData.factorExportacion}
                onValueChange={(e) => onChange("factorExportacion", e.value)}
                mode="decimal"
                minFractionDigits={6}
                maxFractionDigits={6}
                min={0}
                disabled={!puedeEditarConPermiso}
                inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
                htmlFor="factorExportacionReal"
              >
                Factor Exportación Real
              </label>
              <InputNumber
                id="factorExportacionReal"
                value={formData.factorExportacionReal}
                onValueChange={(e) =>
                  onChange("factorExportacionReal", e.value)
                }
                mode="decimal"
                minFractionDigits={6}
                maxFractionDigits={6}
                min={0}
                disabled={!puedeEditarConPermiso}
                inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
              />
            </div>
          </div>
        </Panel>
      )}

      {/* ============================================ */}
      {/* SECCIÓN 6: OBSERVACIONES */}
      {/* ============================================ */}
      <Panel
        header="📝 Fecha Aprobación, Motivo Rechazo y Observaciones"
        toggleable
        collapsed
        style={{ marginTop: "1rem" }}
      >
        {/* FILA 3: Estado, Fecha Aprobación (si está aprobada) */}
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginTop: "1rem",
          }}
        >
          {/* ⭐ SECCIÓN DE AUDITORÍA (solo en edición) */}
          {isEdit && (
            <div style={{ flex: 1 }}>
              <AuditoriaDialog
                data={formData}
                fieldMapping={{
                  fechaCreacion: "fechaCreacion",
                  creadoPor: "creadoPor",
                  fechaActualizacion: "fechaActualizacion",
                  actualizadoPor: "actualizadoPor",
                }}
                usuarios={personalOptions}
                esSuperUsuario={esSuperUsuario}
                onSave={(datosCorregidos) => {
                  onChange("creadoPor", datosCorregidos.creadoPor);
                  onChange("actualizadoPor", datosCorregidos.actualizadoPor);
                  onChange("fechaCreacion", datosCorregidos.fechaCreacion);
                  onChange("fechaActualizacion", datosCorregidos.fechaActualizacion);
                }}
                buttonProps={{
                  label: esSuperUsuario ? "Auditoría" : "Ver Auditoría",
                  className: "p-button-info",
                  style: { width: "100%" },
                }}
              />
            </div>
          )}
          {formData.fechaAprobacion && (
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
                htmlFor="fechaAprobacion"
              >
                Fecha Aprobación
              </label>
              <Calendar
                id="fechaAprobacion"
                value={formData.fechaAprobacion}
                dateFormat="dd/mm/yy"
                showIcon
                disabled
                inputStyle={{
                  fontWeight: "bold",
                  backgroundColor: "#f0f0f0",
                }}
              />
            </div>
          )}
          {formData.motivoRechazo && (
            <div style={{ flex: 2 }}>
              <label
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
                htmlFor="motivoRechazo"
              >
                Motivo Rechazo
              </label>
              <InputTextarea
                id="motivoRechazo"
                value={formData.motivoRechazo || ""}
                disabled
                rows={2}
                style={{
                  fontWeight: "bold",
                  backgroundColor: "#fff3cd",
                }}
              />
            </div>
          )}
        </div>
        <InputTextarea
          id="observaciones"
          value={formData.observaciones || ""}
          onChange={(e) => onChange("observaciones", e.target.value)}
          rows={4}
          disabled={!puedeEditarConPermiso}
          style={{ fontWeight: "bold" }}
          placeholder="Ingrese observaciones adicionales..."
        />
      </Panel>

      <CambiarTipoSerieDialog
        visible={formData._showCambiarTipoSerieDialog || false}
        onHide={() => onChange('_showCambiarTipoSerieDialog', false)}
        empresaId={formData.empresaId}
        tipoDocumentoActual={{
          id: formData.tipoDocumentoId,
          nombre: tiposDocumentoOptions.find(t => t.value === formData.tipoDocumentoId)?.label
        }}
        serieActual={{
          id: formData.serieDocId,
          serie: formData.numSerieDoc
        }}
        tiposDocumentoOptions={tiposDocumentoOptions}
        seriesDocOptions={seriesDocOptions}
        onConfirmar={onCambiarTipoSerie}
        moduloOrigen="PreFactura"
        toast={toast}
      />
    </div>
  );
}
