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

export default function DatosGeneralesTab({
  formData,
  onChange,
  onSerieChange,
  empresas,
  proveedores,
  formasPago,
  personalOptions,
  monedas,
  centrosCosto,
  tiposDocumentoOptions,
  seriesDocOptions,
  estadosOrdenOptions,
  isEdit,
  puedeEditar,
  detallesCount = 0,
  // Props para DetallesTab
  ordenCompraId,
  productos,
  toast,
  onCountChange,
  // Totales calculados
  subtotal = null,
  totalIGV = null,
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
}) {
  // Helper para obtener código de moneda (ISO)
  const getCodigoMoneda = () => {
    // Prioridad 1: Usar la relación directa de la orden (más eficiente)
    if (monedaOrden?.codigoSunat) {
      return monedaOrden.codigoSunat;
    }
    // Prioridad 2: Buscar en el array de opciones (fallback)
    const moneda = monedas.find(
      (m) => Number(m.id) === Number(formData.monedaId)
    );
    return moneda?.codigoSunat || "PEN";
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
        <div style={{ flex: 1.5 }}>
          {/* EMPRESA */}
          <label
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
            htmlFor="empresaId"
          >
            Empresa*
          </label>
          <Dropdown
            id="empresaId"
            value={formData.empresaId}
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
        <div style={{ flex: 0.5 }}>
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
        <div style={{ flex: 0.75 }}>
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
            disabled={true}
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              backgroundColor: "#f0f0f0",
            }}
          />
        </div>
        <div style={{ flex: 0.75 }}>
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
        <div style={{ flex: 0.5 }}>
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

        <div style={{ flex: 0.5 }}>
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
      </div>

      <div
        style={{
          alignItems: "end",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
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

        <div style={{ flex: 1.5 }}>
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
      </div>

      <div
        style={{
          alignItems: "end",
          display: "flex",
          gap: 5,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
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

        <div style={{ flex: 0.25 }}>
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

        <div style={{ flex: 0.25 }}>
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

        <div style={{ flex: 0.30 }}>
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

        <div style={{ flex: 0.3 }}>
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
        {/* REQUERIMIENTO ASOCIADO - Botón para ir al origen */}
        {formData.requerimientoCompraId && (
          <div style={{ flex: 0.75 }}>
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
                onIrAMovimientoAlmacen && onIrAMovimientoAlmacen(formData.movIngresoAlmacenId)
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
            subtotal={subtotal}
            totalIGV={totalIGV}
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
    </div>
  );
}
