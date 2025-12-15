// src/components/ordenCompra/DatosGeneralesTab.jsx
import React from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import DetallesTab from "./DetallesTab";

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
}) {
  // Helper para obtener código de moneda (ISO)
  const getCodigoMoneda = () => {
    // Prioridad 1: Usar la relación directa de la orden (más eficiente)
    if (monedaOrden?.codigoSunat) {
      return monedaOrden.codigoSunat;
    }
    // Prioridad 2: Buscar en el array de opciones (fallback)
    const moneda = monedas.find((m) => Number(m.id) === Number(formData.monedaId));
    return moneda?.codigoSunat || "PEN";
  };
  return (
    <div className="fluid">
      <div
        style={{
          alignItems: "end",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1.5 }}>
          {/* EMPRESA */}
          <label htmlFor="empresaId">Empresa*</label>
          <Dropdown
            id="empresaId"
            value={formData.empresaId}
            style={{fontWeight:"bold", textTransform:"uppercase"}}
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
          <label htmlFor="fechaDocumento">Fecha Documento*</label>
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
        <div style={{ flex: 1 }}>
          {/* TIPO DOCUMENTO - Siempre ID 17: ORDEN DE COMPRA */}
          <label htmlFor="tipoDocumentoId">Tipo Documento*</label>
          <Dropdown
            id="tipoDocumentoId"
            value={formData.tipoDocumentoId ? Number(formData.tipoDocumentoId) : null}
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
        <div style={{ flex: 1 }}>
          {/* NÚMERO DOCUMENTO */}
          <label htmlFor="numeroDocumento">Número de Documento</label>
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
          {/* ESTADO */}
          <label htmlFor="estadoId">Estado*</label>
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
          <label htmlFor="serieDocId">Serie de Documento*</label>
          <Dropdown
            id="serieDocId"
            value={formData.serieDocId ? Number(formData.serieDocId) : null}
            options={seriesDocOptions || []}
            onChange={(e) => onSerieChange(e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar serie"
            disabled={!puedeEditar || readOnly || !formData.tipoDocumentoId || !!formData.serieDocId}
            required
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          {/* NÚMERO SERIE DOC */}
          <label htmlFor="numSerieDoc">Número Serie Doc.</label>
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
        <div style={{ flex: 1 }}>
          {/* NÚMERO CORRELATIVO */}
          <label htmlFor="numCorreDoc">Número Correlativo</label>
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
          <label htmlFor="solicitanteId">Solicitante</label>
          <Dropdown
            id="solicitanteId"
            value={formData.solicitanteId ? Number(formData.solicitanteId) : null}
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
            style={{fontWeight:"bold", textTransform:"uppercase"}}
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
        <div style={{ flex: 1.5 }}>
          {/* PROVEEDOR */}
          <label htmlFor="proveedorId">Proveedor*</label>
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
            style={{fontWeight:"bold", textTransform:"uppercase"}}
          />
        </div>

        <div style={{ flex: 1.5 }}>
          {/* FORMA DE PAGO */}
          <label htmlFor="formaPagoId">Forma de Pago</label>
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
            style={{fontWeight:"bold", textTransform:"uppercase"}}
          />
        </div>

        <div style={{ flex: 1 }}>
          {/* FECHA ENTREGA */}
          <label htmlFor="fechaEntrega">Fecha Entrega</label>
          <Calendar
            id="fechaEntrega"
            value={formData.fechaEntrega}
            onChange={(e) => onChange("fechaEntrega", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            disabled={!puedeEditar || readOnly}
            inputStyle={{fontWeight:"bold", textTransform:"uppercase"}}
          />
        </div>

        <div style={{ flex: 1 }}>
          {/* FECHA RECEPCIÓN */}
          <label htmlFor="fechaRecepcion">Fecha Recepción</label>
          <Calendar
            id="fechaRecepcion"
            value={formData.fechaRecepcion}
            onChange={(e) => onChange("fechaRecepcion", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            disabled={!puedeEditar || readOnly}
            inputStyle={{fontWeight:"bold", textTransform:"uppercase"}}
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
          {/* APROBADO POR */}
          <label htmlFor="aprobadoPorId">Aprobado Por</label>
          <Dropdown
            id="aprobadoPorId"
            value={formData.aprobadoPorId ? Number(formData.aprobadoPorId) : null}
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
            style={{fontWeight:"bold", textTransform:"uppercase"}}
          />
        </div>

        <div style={{ flex: 1 }}>
          {/* MONEDA */}
          <label htmlFor="monedaId">Moneda</label>
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
            style={{fontWeight:"bold", textTransform:"uppercase"}}
          />
        </div>

        <div style={{ flex: 1 }}>
          {/* TIPO CAMBIO */}
          <label htmlFor="tipoCambio">Tipo de Cambio</label>
          <InputNumber
            id="tipoCambio"
            value={formData.tipoCambio}
            onValueChange={(e) => onChange("tipoCambio", e.value)}
            minFractionDigits={2}
            maxFractionDigits={4}
            disabled={!puedeEditar || readOnly}
            inputStyle={{fontWeight:"bold", textTransform:"uppercase"}}
          />
        </div>

        <div style={{ flex: 1 }}>
          {/* CENTRO DE COSTO */}
          <label htmlFor="centroCostoId">Centro de Costo</label>
          <Dropdown
            id="centroCostoId"
            value={formData.centroCostoId ? Number(formData.centroCostoId) : null}
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
            style={{fontWeight:"bold", textTransform:"uppercase"}}
          />
        </div>

        <div style={{ flex: 1 }}>
          {/* PORCENTAJE IGV */}
          <label htmlFor="porcentajeIGV">% IGV</label>
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
            inputStyle={{fontWeight:"bold", textTransform:"uppercase"}}
          />
        </div>

        <div style={{ flex: 1 }}>
          {/* EXONERADO AL IGV */}
          <label htmlFor="esExoneradoAlIGV">Exonerado IGV</label>
          <div className="flex align-items-center" style={{ height: "43px" }}>
            <Checkbox
              inputId="esExoneradoAlIGV"
              checked={formData.esExoneradoAlIGV || false}
              onChange={(e) => onChange("esExoneradoAlIGV", e.checked)}
              disabled={!puedeEditar || readOnly}
            />
          </div>
        </div>
        {/* REQUERIMIENTO ASOCIADO (Solo lectura si existe) */}
        {formData.requerimientoCompraId && (
          <div className="col-12">
            <div className="p-3 bg-green-50 border-round">
              <div className="flex align-items-center gap-2">
                <i className="pi pi-link text-green-600"></i>
                <span className="font-bold">
                  Generada desde Requerimiento ID:{" "}
                  {formData.requerimientoCompraId}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div
        style={{
          alignItems: "end",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 4 }}>
          {/* OBSERVACIONES */}
          <label htmlFor="observaciones">Observaciones</label>
          <InputTextarea
            id="observaciones"
            value={formData.observaciones}
            onChange={(e) => onChange("observaciones", e.target.value)}
            rows={3}
            disabled={!puedeEditar || readOnly}
          />
        </div>
      </div>

      {/* SECCIÓN: DETALLES */}
      {isEdit && (
        <div style={{ marginTop: 20 }}>
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
          />
        </div>
      )}
    </div>
  );
}
