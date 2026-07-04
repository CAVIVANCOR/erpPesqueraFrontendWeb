// src/components/ordenCompra/DatosGeneralesTab.jsx
import React from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import DetallesTab from "./DetallesTab";
import { getResponsiveFontSize } from "../../utils/utils";
import CrearEntidadComercialButton from "../shared/CrearEntidadComercialButton";
import IrACxPEditar from "../common/IrACxPEditar";
import BooleanToggleButton from "../common/BooleanToggleButton";
import CambiarTipoSerieDialog from "../common/CambiarTipoSerieDialog"; // ✅ AGREGAR

export default function DatosGeneralesTab({
  formData,
  onChange,
  onSerieChange,
  onCambiarTipoSerie, // ✅ AGREGAR
  showCambiarTipoSerieDialog, // ✅ AGREGAR
  empresas,
  proveedores,
  formasPago,
  personalOptions,
  monedas,
  centrosCosto,
  unidadesNegocioOptions,
  tiposDocumentoOptions,
  proveedoresOptions,
  monedasOptions,
  seriesDocOptions,
  estadosOrdenOptions,
  periodosContables = [],
  motivosNCND = [],
  motivoNotaCreditoDebitoId,
  onMotivoNotaCreditoDebitoIdChange,
  fechaDcmtoAfectoNCND,
  onFechaDcmtoAfectoNCNDChange,
  dcmtoAfectoNCNDId,
  onDcmtoAfectoNCNDIdChange,
  numeroDcmtoAfectoNCND,
  onNumeroDcmtoAfectoNCNDChange,
  isEdit,
  puedeEditar,
  detallesCount = 0,
  // Props para DetallesTab
  ordenCompraId,
  productos,
  toast,
  onCountChange,
  onDetallesChange, // ⭐ NUEVO: Callback cuando cambian los detalles
  // Totales calculados
  subtotal = null,
  totalIGV = null,
  montoImpuestoRenta = null,
  pagosPreviosSI = null,
  tipoDocumentoId = null,
  total = null,
  // Objeto moneda de la orden (viene de la relación)
  monedaOrden = null,
  readOnly = false,
  permisos = {},
  onIrAlOrigen,
  onIrAMovimientoAlmacen,
  // ⭐ NUEVOS CAMPOS
  direccionRecepcionAlmacenId,
  onDireccionRecepcionChange,
  direccionesEmpresa = [],
  contactoProveedorId,
  onContactoProveedorChange,
  contactosProveedor = [],
  // ⭐ CAMPOS DE FACTURACIÓN
  facturado,
  onFacturadoChange,
  fechaFacturacion,
  onFechaFacturacionChange,
  esGerencial,
  onEsGerencialChange,
  ordenCompraOrigenId,
  onOrdenCompraOrigenIdChange,
  esParticionada,
  onEsParticionadaChange,
  onProveedorCreado, // ✅ NUEVO: callback para recargar proveedores
  cuentasCorrientes = [],
  estadosCxP = [],
  mediosPago = [],
  bancos = [],
  // ⭐ CAMPOS DE COMPROBANTE DEL PROVEEDOR
  tipoDocumentoFinalId,
  onTipoDocumentoFinalIdChange,
  numeroDocumentoFinal,
  onNumeroDocumentoFinalChange,
  numSerieDocFinal,
  onNumSerieDocFinalChange,
  numCorreDocFinal,
  onNumCorreDocFinalChange,
  comprobanteRecibido,
  onComprobanteRecibidoChange,
  fechaRecepcionComprobante,
  onFechaRecepcionComprobanteChange,
  aplicaImpuestoRenta,
  onAplicaImpuestoRentaChange,
  porcentajeImpuestoRenta,
  onPorcentajeImpuestoRentaChange,
}) {
  // Helper para obtener código de moneda (ISO)
  const getCodigoMoneda = () => {
    // Prioridad 1: Usar la relación directa de la orden (más eficiente)
    if (monedaOrden?.codigoSunat) {
      return monedaOrden.codigoSunat;
    }
    // Prioridad 2: Buscar en el array de opciones (fallback)
    const moneda = monedas.find(
      (m) => Number(m.id) === Number(formData.monedaId),
    );
    return moneda?.codigoSunat || "PEN";
  };

  // ✅ FILTRAR Y PREPARAR PERIODOS CONTABLES
  const periodosContablesFiltrados = periodosContables
    .filter((p) => {
      // Solo filtrar por empresa
      return Number(p.empresaId) === Number(formData.empresaId);
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
  // ✅ Callback cuando se crea un proveedor
  const handleEntidadCreada = async (entidad) => {
    // ✅ PRIMERO: Recargar proveedores (esperar a que termine)
    if (onProveedorCreado && typeof onProveedorCreado === "function") {
      await onProveedorCreado(entidad);
    }

    // ✅ SEGUNDO: Auto-seleccionar el nuevo proveedor DESPUÉS de recargar
    if (entidad && entidad.id) {
      // Usar setTimeout para asegurar que el dropdown se haya actualizado
      setTimeout(() => {
        const proveedorIdNumber = Number(entidad.id);
        onChange("proveedorId", proveedorIdNumber);

        // ✅ TERCERO: Auto-copiar la forma de pago del proveedor a la Orden
        if (entidad.formaPagoId) {
          const formaPagoIdNumber = Number(entidad.formaPagoId);
          onChange("formaPagoId", formaPagoIdNumber);
        }
      }, 100);
    }
    // Mostrar mensaje de éxito
    if (toast && toast.current) {
      toast.current.show({
        severity: "success",
        summary: "Proveedor Creado",
        detail: `Proveedor "${entidad.razonSocial || entidad.nombre}" creado y seleccionado exitosamente.`,
        life: 4000,
      });
    }
  };
  return (
    <div className="fluid">
      <div
        style={{
          alignItems: "end",
          display: "flex",
          gap: 5,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          {/* EMPRESA */}
          <label
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
            htmlFor="empresaId"
          >
            Empresa*
          </label>
          <Dropdown
            id="empresaId"
            value={formData.empresaId ? Number(formData.empresaId) : null}
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
            options={empresas.map((e) => ({
              label: e.razonSocial,
              value: Number(e.id),
            }))}
            onChange={(e) => onChange("empresaId", e.value)}
            placeholder="Seleccionar empresa"
            disabled={isEdit || !puedeEditar || readOnly}
          />
        </div>
        <div style={{ flex: 0.7 }}>
          {/* FECHA DOCUMENTO */}
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
            disabled={!puedeEditar || readOnly}
            inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>

        <div style={{ flex: 0.7 }}>
          {/* FECHA VENCIMIENTO */}
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
            disabled={!puedeEditar || readOnly}
            inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          {/* UNIDAD DE NEGOCIO */}
          <label
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
            htmlFor="unidadNegocioId"
          >
            Unidad de Negocio*
          </label>
          <Dropdown
            id="unidadNegocioId"
            value={
              formData.unidadNegocioId ? Number(formData.unidadNegocioId) : null
            }
            options={unidadesNegocioOptions}
            onChange={(e) => onChange("unidadNegocioId", e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar unidad de negocio"
            filter
            showClear
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
            disabled={!puedeEditar || readOnly}
          />
        </div>
      </div>


      <Panel
        header="Tipo Documento Correlativos y Fechas de Entrega y Recepcion"
        toggleable
        collapsed={false}
        className="mb-3"
      >
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 5,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 0.8 }}>
            {/* TIPO DOCUMENTO - Siempre ID 17: ORDEN DE COMPRA */}
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="tipoDocumentoId"
            >
              Tipo Documento*
            </label>
            <Dropdown
              id="tipoDocumentoId"
              value={
                formData.tipoDocumentoId ? Number(formData.tipoDocumentoId) : null
              }
              options={tiposDocumentoOptions}
              onChange={(e) => onChange("tipoDocumentoId", e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar tipo"
              disabled={isEdit || !puedeEditar || readOnly}
              style={{
                fontWeight: "bold",
                textTransform: "uppercase",
                backgroundColor: "#f0f0f0",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            {/* SERIE DOCUMENTO */}
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="serieDocId"
            >
              Serie de Documento*
            </label>
            <Dropdown
              id="serieDocId"
              value={formData.serieDocId ? Number(formData.serieDocId) : null}
              options={seriesDocOptions || []}
              onChange={(e) => onSerieChange(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar serie"
              disabled={
                !puedeEditar ||
                readOnly ||
                !formData.tipoDocumentoId ||
                !!formData.serieDocId
              }
              required
              style={{
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            />
          </div>
          <div style={{ flex: 0.25 }}>
            {/* NÚMERO SERIE DOC */}
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="numSerieDoc"
            >
              Serie Doc.
            </label>
            <InputText
              id="numSerieDoc"
              value={formData.numSerieDoc || ""}
              disabled
              style={{
                fontWeight: "bold",
                textTransform: "uppercase",
                backgroundColor: "#f0f0f0",
              }}
            />
          </div>
          <div style={{ flex: 0.5 }}>
            {/* NÚMERO CORRELATIVO */}
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="numCorreDoc"
            >
              Número Correlativo
            </label>
            <InputText
              id="numCorreDoc"
              value={formData.numCorreDoc || ""}
              disabled
              style={{
                fontWeight: "bold",
                textTransform: "uppercase",
                backgroundColor: "#f0f0f0",
              }}
            />
          </div>
          {/* ✅ BOTÓN CAMBIAR TIPO/SERIE */}
          {isEdit && (
            <div style={{ flex: 0.5, display: 'flex', alignItems: 'flex-end' }}>
              <Button
                label="Cambiar"
                icon="pi pi-refresh"
                severity="warning"
                outlined
                onClick={() => onChange('_showCambiarTipoSerieDialog', true)}
                disabled={!puedeEditar || readOnly || !formData.serieDocId}
                style={{ width: '100%', fontWeight: 'bold' }}
                tooltip="Cambiar Tipo de Documento y Serie"
                tooltipOptions={{ position: 'top' }}
              />
            </div>
          )}
          <div style={{ flex: 0.8 }}>
            {/* NÚMERO DOCUMENTO */}
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="numeroDocumento"
            >
              Número de Documento
            </label>
            <InputText
              id="numeroDocumento"
              value={formData.numeroDocumento || ""}
              disabled
              style={{
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            />
          </div>
          <div style={{ flex: 0.7 }}>
            {/* FECHA ENTREGA */}
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="fechaEntrega"
            >
              Fecha Entrega
            </label>
            <Calendar
              id="fechaEntrega"
              value={formData.fechaEntrega}
              onChange={(e) => onChange("fechaEntrega", e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              disabled={!puedeEditar || readOnly}
              inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 0.6 }}>
            {/* FECHA RECEPCIÓN */}
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="fechaRecepcion"
            >
              Fecha Recepción
            </label>
            <Calendar
              id="fechaRecepcion"
              value={formData.fechaRecepcion}
              onChange={(e) => onChange("fechaRecepcion", e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              disabled={!puedeEditar || readOnly}
              inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
        </div>
      </Panel>


      <div
        style={{
          alignItems: "end",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >

        <div style={{ flex: 2 }}>
          {/* SOLICITANTE */}
          <label
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
            htmlFor="solicitanteId"
          >
            Solicitante
          </label>
          <Dropdown
            id="solicitanteId"
            value={
              formData.solicitanteId ? Number(formData.solicitanteId) : null
            }
            options={personalOptions.map((p) => ({
              label: p.nombreCompleto,
              value: Number(p.id),
            }))}
            onChange={(e) => onChange("solicitanteId", e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar solicitante"
            filter
            disabled={!puedeEditar || readOnly}
            showClear
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>
        <div style={{ flex: 1.5 }}>
          {/* APROBADO POR */}
          <label
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
            htmlFor="aprobadoPorId"
          >
            Aprobado Por
          </label>
          <Dropdown
            id="aprobadoPorId"
            value={
              formData.aprobadoPorId ? Number(formData.aprobadoPorId) : null
            }
            options={personalOptions.map((p) => ({
              label: p.nombreCompleto,
              value: Number(p.id),
            }))}
            onChange={(e) => onChange("aprobadoPorId", e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar aprobador"
            filter
            disabled
            showClear
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>
        <div style={{ flex: 2 }}>
          {/* CENTRO DE COSTO */}
          <label
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
            htmlFor="centroCostoId"
          >
            Centro de Costo
          </label>
          <Dropdown
            id="centroCostoId"
            value={
              formData.centroCostoId ? Number(formData.centroCostoId) : null
            }
            options={
              centrosCosto?.map((c) => ({
                label: `${c.Codigo} - (${c.Nombre})`,
                value: Number(c.id),
              })) || []
            }
            onChange={(e) => onChange("centroCostoId", e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar centro costo"
            filter
            disabled={!puedeEditar || readOnly}
            showClear
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>
      </div>
      {/* ============================================ */}
      {/* SECCIÓN: DATOS NOTA DE CRÉDITO/DÉBITO (CONDICIONAL) */}
      {/* ============================================ */}
      {motivoNotaCreditoDebitoId && (
        <Panel
          header="📝 Datos de Nota de Crédito/Débito"
          toggleable
          style={{ marginTop: "1rem" }}
        >
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
                htmlFor="motivoNotaCreditoDebitoId"
              >
                Motivo NC/ND*
              </label>
              <Dropdown
                id="motivoNotaCreditoDebitoId"
                value={
                  motivoNotaCreditoDebitoId
                    ? Number(motivoNotaCreditoDebitoId)
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
                onChange={(e) => onMotivoNotaCreditoDebitoIdChange(e.value)}
                placeholder="Seleccionar motivo"
                filter
                showClear
                disabled={!puedeEditar || readOnly}
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
                value={fechaDcmtoAfectoNCND}
                onChange={(e) => onFechaDcmtoAfectoNCNDChange(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                disabled={!puedeEditar || readOnly}
                inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
                htmlFor="numeroDcmtoAfectoNCND"
              >
                Número Dcmto. Afectado
              </label>
              <InputText
                id="numeroDcmtoAfectoNCND"
                value={numeroDcmtoAfectoNCND || ""}
                onChange={(e) =>
                  onNumeroDcmtoAfectoNCNDChange(e.target.value.toUpperCase())
                }
                maxLength={40}
                disabled={!puedeEditar || readOnly}
                style={{ fontWeight: "bold", textTransform: "uppercase" }}
                placeholder="Ej: F001-00000123"
              />
            </div>
          </div>
        </Panel>
      )}
      <div
        style={{
          alignItems: "end",
          display: "flex",
          gap: 5,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1.5 }}>
          {/* PROVEEDOR */}
          <label
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
            htmlFor="proveedorId"
          >
            Proveedor*
          </label>
          <Dropdown
            id="proveedorId"
            value={formData.proveedorId ? Number(formData.proveedorId) : null}
            options={proveedores.map((p) => ({
              label: p.razonSocial,
              value: Number(p.id),
            }))}
            onChange={(e) => onChange("proveedorId", e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar proveedor"
            filter
            disabled={!puedeEditar || readOnly}
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>
        <div style={{ flex: 0.5 }}>
          {/* ✅ COMPONENTE GENÉRICO REUTILIZABLE */}
          <CrearEntidadComercialButton
            empresaId={formData.empresaId}
            tipoEntidad="proveedor"
            onEntidadCreada={handleEntidadCreada}
            label="Crear Proveedor"
            icon="pi pi-building"
            severity="info"
            outlined={true}
            disabled={readOnly || !puedeEditar}
            className="w-full mt-2"
            toast={toast}
          />
        </div>

        {/* ⭐ NUEVO: DIRECCIÓN DE RECEPCIÓN EN ALMACÉN */}
        <div style={{ flex: 2 }}>
          <label
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
            htmlFor="direccionRecepcionAlmacenId"
          >
            Dirección de Recepción en Almacén
          </label>
          <Dropdown
            id="direccionRecepcionAlmacenId"
            value={
              direccionRecepcionAlmacenId
                ? Number(direccionRecepcionAlmacenId)
                : null
            }
            options={direccionesEmpresa.map((d) => ({
              label: d.direccionArmada || d.direccion,
              value: Number(d.id),
            }))}
            onChange={(e) => onDireccionRecepcionChange(e.value)}
            placeholder="Seleccionar dirección"
            disabled={!puedeEditar || readOnly}
            showClear
            filter
            filterBy="label"
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>
        {/* ⭐ NUEVO: CONTACTO DEL PROVEEDOR */}
        <div style={{ flex: 1.5 }}>
          <label
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
            htmlFor="contactoProveedorId"
          >
            Contacto del Proveedor
          </label>
          <Dropdown
            id="contactoProveedorId"
            value={contactoProveedorId ? Number(contactoProveedorId) : null}
            options={contactosProveedor.map((c) => ({
              label: c.nombres,
              value: Number(c.id),
            }))}
            onChange={(e) => onContactoProveedorChange(e.value)}
            placeholder="Seleccionar contacto"
            disabled={!puedeEditar || readOnly}
            showClear
            filter
            filterBy="label"
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>

      </div>
      {/* ⭐ SECCIÓN: CAMPOS DE FACTURACIÓN */}
      <div
        style={{
          alignItems: "end",
          display: "flex",
          gap: 5,
          marginTop: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 2 }}>
          {/* FORMA DE PAGO */}
          <label
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
            htmlFor="formaPagoId"
          >
            Forma de Pago
          </label>
          <Dropdown
            id="formaPagoId"
            value={formData.formaPagoId ? Number(formData.formaPagoId) : null}
            options={formasPago.map((f) => ({
              label: f.nombre,
              value: Number(f.id),
            }))}
            onChange={(e) => onChange("formaPagoId", e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar forma de pago"
            disabled={!puedeEditar || readOnly}
            showClear
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>
        <div style={{ flex: 0.5 }}>
          {/* FACTURADO */}
          <label
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
            htmlFor="facturado"
          >
            Facturado
          </label>
          <Button
            id="facturado"
            label={facturado ? "FACTURADO" : "FACTURADO"}
            icon={facturado ? "pi pi-check-circle" : "pi pi-times-circle"}
            severity={facturado ? "success" : "secondary"}
            onClick={() => onFacturadoChange && onFacturadoChange(!facturado)}
            disabled={!puedeEditar || readOnly}
            style={{ width: "100%" }}
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
            disabled={!puedeEditar || readOnly}
            showButtonBar
            inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>

        <div style={{ flex: 0.25 }}>
          {/* ES GERENCIAL */}
          <label
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
            htmlFor="esGerencial"
          >
            Es Gerencial
          </label>
          <Button
            id="esGerencial"
            label={esGerencial ? "GERENCIAL" : "FISCAL"}
            icon={esGerencial ? "pi pi-check-circle" : "pi pi-times-circle"}
            severity={esGerencial ? "success" : "secondary"}
            onClick={() =>
              onEsGerencialChange && onEsGerencialChange(!esGerencial)
            }
            disabled={!puedeEditar || readOnly}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 0.25 }}>
          {/* ES PARTICIONADA */}
          <label
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
            htmlFor="esParticionada"
          >
            Es Particionada
          </label>
          <Button
            id="esParticionada"
            label={esParticionada ? "PARTICIONADA" : "PARTICIONADA"}
            icon={esParticionada ? "pi pi-check-circle" : "pi pi-times-circle"}
            severity={esParticionada ? "info" : "secondary"}
            onClick={() =>
              onEsParticionadaChange && onEsParticionadaChange(!esParticionada)
            }
            disabled={!puedeEditar || readOnly}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 0.5 }}>
          {/* ESTADO */}
          <label
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
            htmlFor="estadoId"
          >
            Estado*
          </label>
          <Dropdown
            id="estadoId"
            value={formData.estadoId ? Number(formData.estadoId) : null}
            options={estadosOrdenOptions || []}
            onChange={(e) => onChange("estadoId", e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar estado"
            disabled={true}
            style={{
              fontWeight: "bold",
              backgroundColor: "#f0f0f0",
            }}
          />
        </div>
        {/* BOTÓN EDITAR CxP - Aparece solo si existe CxP asociada */}
        {isEdit && formData.id && (
          <div style={{ flex: 0.5, display: "flex", alignItems: "flex-end", marginTop: "1rem" }}>
            <IrACxPEditar
              ordenCompraId={formData.id}
              ordenCompra={formData}
              empresas={empresas || []}
              proveedores={proveedores || []}
              monedas={monedas || []}
              estados={estadosCxP || []}
              periodosContables={periodosContables || []}
              mediosPago={mediosPago || []}
              bancos={bancos || []}
              cuentasCorrientes={cuentasCorrientes || []}
              permisos={{}}
              toast={toast}
              showCxPId={true}
              estadoIdMinimo={113}
              severity="warning"
              outlined={true}
              icon="pi pi-arrow-right"
              style={{ width: "100%", fontWeight: "bold" }}
            />
          </div>
        )}
      </div>
      {/* ════════════════════════════════════════════════════════════ */}
      {/* PANEL: COMPROBANTE DEL PROVEEDOR */}
      {/* ════════════════════════════════════════════════════════════ */}
      <Panel
        header="📄 Comprobante del Proveedor"
        toggleable
        collapsed={!comprobanteRecibido}
        className="mb-3"
      >
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 5,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          {/* COMPROBANTE RECIBIDO */}
          <div style={{ flex: 0.5 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="comprobanteRecibido"
            >
              Comprobante Recibido
            </label>
            <BooleanToggleButton
              value={comprobanteRecibido}
              onChange={onComprobanteRecibidoChange}
              labelTrue="RECIBIDO"
              labelFalse="PENDIENTE"
              severityTrue="success"
              severityFalse="warning"
              icon={comprobanteRecibido ? "pi-check-circle" : "pi-clock"}
            //**disabled={!puedeEditar || readOnly}
            />
          </div>

          {/* FECHA RECEPCIÓN COMPROBANTE */}
          <div style={{ flex: 0.5 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="fechaRecepcionComprobante"
            >
              Fecha Recepción
            </label>
            <Calendar
              id="fechaRecepcionComprobante"
              value={fechaRecepcionComprobante}
              onChange={(e) =>
                onFechaRecepcionComprobanteChange &&
                onFechaRecepcionComprobanteChange(e.value)
              }
              dateFormat="dd/mm/yy"
              showIcon
              //**disabled={!puedeEditar || readOnly }
              style={{
                width: "100%",
                fontWeight: "bold",
              }}
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
              //**disabled={!puedeEditar || readOnly }
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
              //**disabled={!puedeEditar || readOnly}
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
              //**disabled={!puedeEditar || readOnly }
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

      <div
        style={{
          alignItems: "end",
          display: "flex",
          gap: 5,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 0.7 }}>
          {/* FECHA CONTABLE */}
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
            disabled={!puedeEditar || readOnly}
            inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          {/* PERIODO CONTABLE */}
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
            disabled={!puedeEditar || readOnly}
            style={{ fontSize: getResponsiveFontSize() }}
          />
        </div>
        <div style={{ flex: 1 }}>
          {/* OBSERVACIONES */}
          <label
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
            htmlFor="observaciones"
          >
            Observaciones
          </label>
          <InputText
            id="observaciones"
            value={formData.observaciones}
            onChange={(e) => onChange("observaciones", e.target.value)}
            disabled={!puedeEditar || readOnly}
            style={{
              color: "red",
              fontStyle: "italic",
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          />
        </div>
        <div style={{ flex: 0.5 }}>
          {/* MONEDA */}
          <label
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
            htmlFor="monedaId"
          >
            Moneda
          </label>
          <Dropdown
            id="monedaId"
            value={formData.monedaId ? Number(formData.monedaId) : null}
            options={
              monedas?.map((m) => ({
                label: m.codigoSunat,
                value: Number(m.id),
              })) || []
            }
            onChange={(e) => onChange("monedaId", e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar moneda"
            disabled={!puedeEditar || readOnly}
            showClear
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>

        <div style={{ flex: 0.5 }}>
          {/* TIPO CAMBIO */}
          <label
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
            htmlFor="tipoCambio"
          >
            T/C
          </label>
          <InputNumber
            id="tipoCambio"
            value={formData.tipoCambio}
            onValueChange={(e) => onChange("tipoCambio", e.value)}
            minFractionDigits={2}
            maxFractionDigits={4}
            disabled={!puedeEditar || readOnly}
            inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>

        <div style={{ flex: 0.5 }}>
          {/* PORCENTAJE IGV */}
          <label
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
            htmlFor="porcentajeIGV"
          >
            % IGV
          </label>
          <InputNumber
            id="porcentajeIGV"
            value={formData.porcentajeIGV}
            onValueChange={(e) => onChange("porcentajeIGV", e.value)}
            suffix="%"
            min={0}
            max={100}
            minFractionDigits={2}
            maxFractionDigits={2}
            disabled={!puedeEditar || readOnly}
            inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>

        <div style={{ flex: 0.5 }}>
          {/* ES EXONERADO AL IGV */}
          <label
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
            htmlFor="esExoneradoAlIGV"
          >
            Estado IGV
          </label>
          <Button
            id="esExoneradoAlIGV"
            label={formData.esExoneradoAlIGV ? "EXONERADO" : "AFECTO"}
            icon={
              formData.esExoneradoAlIGV
                ? "pi pi-times-circle"
                : "pi pi-check-circle"
            }
            severity={formData.esExoneradoAlIGV ? "danger" : "success"}
            onClick={() =>
              onChange("esExoneradoAlIGV", !formData.esExoneradoAlIGV)
            }
            disabled={!puedeEditar || readOnly}
            outlined
            style={{
              width: "100%",
              fontWeight: "bold",
              justifyContent: "center",
              color: "#000",
            }}
          />
        </div>



        {/* IMPUESTO A LA RENTA */}
        <div style={{ flex: 1 }}>
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
            suffix="%"
            min={0}
            max={100}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            disabled={!puedeEditar || readOnly || !aplicaImpuestoRenta}
            inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
            htmlFor="aplicaImpuestoRenta"
          >
            Afecto Imp. Renta
          </label>
          <Button
            id="aplicaImpuestoRenta"
            label={aplicaImpuestoRenta ? "SI" : "NO"}
            icon={
              aplicaImpuestoRenta
                ? "pi pi-check-circle"
                : "pi pi-times-circle"
            }
            severity={aplicaImpuestoRenta ? "warning" : "secondary"}
            onClick={() =>
              onAplicaImpuestoRentaChange(!aplicaImpuestoRenta)
            }
            disabled={!puedeEditar || readOnly || Number(tipoDocumentoFinalId) === 3}
            outlined
            style={{
              width: "100%",
              fontWeight: "bold",
              justifyContent: "center",
              color: "#000",
            }}
          />
        </div>
        {/* REQUERIMIENTO ASOCIADO - Botón para ir al origen */}
        {formData.requerimientoCompraId && (
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="irAlOrigen"
            >
              Origen (Requerimiento Compra)
            </label>
            <Button
              id="irAlOrigen"
              label={`ID: ${formData.requerimientoCompraId}`}
              icon="pi pi-external-link"
              severity="info"
              onClick={() =>
                onIrAlOrigen && onIrAlOrigen(formData.requerimientoCompraId)
              }
              outlined
              style={{
                width: "100%",
                fontWeight: "bold",
                justifyContent: "center",
              }}
            />
          </div>
        )}
        {/* MOVIMIENTO DE ALMACÉN GENERADO */}
        {formData.movIngresoAlmacenId && (
          <div style={{ flex: 0.75 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="movAlmacen"
            >
              Movimiento de Almacén (Kardex)
            </label>
            <Button
              id="movAlmacen"
              label={`ID: ${formData.movIngresoAlmacenId}`}
              icon="pi pi-box"
              severity="success"
              onClick={() =>
                onIrAMovimientoAlmacen &&
                onIrAMovimientoAlmacen(formData.movIngresoAlmacenId)
              }
              outlined
              style={{
                width: "100%",
                fontWeight: "bold",
                justifyContent: "center",
              }}
            />
          </div>
        )}
      </div>

      {/* SECCIÓN: DETALLES */}
      {isEdit && (
        <div>
          <DetallesTab
            ordenCompraId={ordenCompraId}
            productos={productos}
            puedeEditar={puedeEditar}
            toast={toast}
            onCountChange={onCountChange}
            onChange={onChange} // ⭐ Callback para actualizar formData
            subtotal={subtotal}
            totalIGV={totalIGV}
            montoImpuestoRenta={montoImpuestoRenta}
            aplicaImpuestoRenta={aplicaImpuestoRenta}
            pagosPreviosSI={pagosPreviosSI}
            tipoDocumentoId={tipoDocumentoId}
            tiposDocumentoOptions={tiposDocumentoOptions}
            total={total}
            monedas={monedas}
            monedaId={formData.monedaId}
            porcentajeIGV={formData.porcentajeIGV}
            readOnly={readOnly}
            permisos={permisos}
            empresaId={formData.empresaId}
            empresas={empresas}
          />
        </div>
      )}


      {/* ✅ DIALOG CAMBIAR TIPO/SERIE */}
      <CambiarTipoSerieDialog
        visible={showCambiarTipoSerieDialog || false} // ✅ CAMBIAR
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
        moduloOrigen="OrdenCompra"
        toast={toast}
      />


    </div>
  );
}
