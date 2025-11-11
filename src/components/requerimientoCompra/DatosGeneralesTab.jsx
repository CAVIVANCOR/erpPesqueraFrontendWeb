// src/components/requerimientoCompra/DatosGeneralesTab.jsx
import React from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import DetallesTab from "./DetallesTab";

export default function DatosGeneralesTab({
  formData,
  onChange,
  onSerieChange,
  empresasOptions,
  tiposDocumentoOptions,
  proveedoresOptions,
  tiposProductoOptions,
  tiposEstadoProductoOptions,
  destinosProductoOptions,
  formasPagoOptions,
  personalOptions,
  seriesDocOptions,
  estadosRequerimientoOptions,
  responsablesComprasOptions,
  responsablesProduccionOptions,
  responsablesAlmacenOptions,
  centrosCostoOptions,
  monedasOptions,
  isEdit,
  puedeEditar,
  puedeVerDetalles,
  puedeEditarDetalles,
  detallesCount = 0,
  // Props para DetallesTab
  requerimientoId,
  productos,
  empresaId,
  toast,
  onCountChange,
  // Totales calculados
  subtotal = null,
  totalIGV = null,
  total = null,
  // Objeto moneda del requerimiento (viene de la relación)
  monedaRequerimiento = null,
}) {
  // Helper para obtener nombre completo del personal por ID
  const getNombrePersonal = (personalId) => {
    if (!personalId) return "";
    const personal = personalOptions.find(
      (p) => Number(p.value) === Number(personalId)
    );
    return personal ? personal.label : `ID: ${personalId}`;
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
            options={empresasOptions}
            onChange={(e) => onChange("empresaId", e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar empresa"
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
            disabled={isEdit || !puedeEditar}
          />
        </div>
        <div style={{ flex: 0.7 }}>
          <label htmlFor="fechaDocumento">Fecha Documento*</label>
          <Calendar
            id="fechaDocumento"
            value={formData.fechaDocumento}
            onChange={(e) => onChange("fechaDocumento", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            disabled={!puedeEditar}
            inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          {/* TIPO DOCUMENTO - Siempre ID 16: REQUERIMIENTO DE COMPRA */}
          <label htmlFor="tipoDocumentoId">Tipo Documento*</label>
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
            value={formData.estadoId}
            options={estadosRequerimientoOptions}
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
            options={seriesDocOptions}
            onChange={(e) => onSerieChange(e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar serie"
            disabled={
              !puedeEditar || !formData.tipoDocumentoId || !!formData.serieDocId
            }
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
            value={formData.solicitanteId}
            options={personalOptions}
            onChange={(e) => onChange("solicitanteId", e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar solicitante"
            filter
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
            disabled={!puedeEditar}
            showClear
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
          {/* ES CON COTIZACIÓN */}
          <label htmlFor="esConCotizacion">Tipo de Compra</label>
          <Button
            label={
              formData.esConCotizacion ? "C/COTIZACIONES" : "COMPRA DIRECTA"
            }
            icon={
              formData.esConCotizacion
                ? "pi pi-file-edit"
                : "pi pi-shopping-cart"
            }
            severity={formData.esConCotizacion ? "warning" : "info"}
            onClick={() =>
              onChange("esConCotizacion", !formData.esConCotizacion)
            }
            disabled={!puedeEditar}
            outlined
            style={{
              width: "100%",
              fontWeight: "bold",
              justifyContent: "center",
            }}
          />
        </div>

        {/* PROVEEDOR (Solo si NO es con cotización) */}
        {!formData.esConCotizacion && (
          <div style={{ flex: 3 }}>
            <label htmlFor="proveedorId">Proveedor*</label>
            <Dropdown
              id="proveedorId"
              value={formData.proveedorId}
              options={proveedoresOptions}
              onChange={(e) => onChange("proveedorId", e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar proveedor"
              filter
              style={{
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
              disabled={!puedeEditar}
            />
          </div>
        )}

        <div style={{ flex: 1 }}>
          {/* FECHA REQUERIDA */}
          <label htmlFor="fechaRequerida">Fecha Requerida</label>
          <Calendar
            id="fechaRequerida"
            value={formData.fechaRequerida}
            onChange={(e) => onChange("fechaRequerida", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            disabled={!puedeEditar}
            inputStyle={{
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
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          {/* TIPO PRODUCTO */}
          <label htmlFor="tipoProductoId">Tipo Producto</label>
          <Dropdown
            id="tipoProductoId"
            value={formData.tipoProductoId}
            options={tiposProductoOptions}
            onChange={(e) => onChange("tipoProductoId", e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar tipo"
            disabled={!puedeEditar}
            showClear
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          />
        </div>

        <div style={{ flex: 1 }}>
          {/* DESTINO PRODUCTO */}
          <label htmlFor="destinoProductoId">Destino Producto</label>
          <Dropdown
            id="destinoProductoId"
            value={formData.destinoProductoId}
            options={destinosProductoOptions}
            onChange={(e) => onChange("destinoProductoId", e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar destino"
            disabled={!puedeEditar}
            showClear
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          {/* ESTADO PRODUCTO */}
          <label htmlFor="tipoEstadoProductoId">Estado Producto</label>
          <Dropdown
            id="tipoEstadoProductoId"
            value={formData.tipoEstadoProductoId}
            options={tiposEstadoProductoOptions}
            onChange={(e) => onChange("tipoEstadoProductoId", e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar estado"
            disabled={!puedeEditar}
            showClear
            style={{
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
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          {/* FORMA DE PAGO */}
          <label htmlFor="formaPagoId">Forma de Pago</label>
          <Dropdown
            id="formaPagoId"
            value={formData.formaPagoId}
            options={formasPagoOptions}
            onChange={(e) => onChange("formaPagoId", e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar forma de pago"
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
            disabled={!puedeEditar}
            showClear
          />
        </div>
        <div style={{ flex: 0.5 }}>
          {/* PORCENTAJE IGV */}
          <label htmlFor="porcentajeIGV">IGV (%)</label>
          <InputNumber
            id="porcentajeIGV"
            value={formData.porcentajeIGV}
            onValueChange={(e) => onChange("porcentajeIGV", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            min={0}
            max={100}
            placeholder="18.00"
            disabled
            inputStyle={{
              fontWeight: "bold",
              textTransform: "uppercase",
              backgroundColor: "#f0f0f0",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          {/* ES EXONERADO AL IGV */}
          <label htmlFor="esExoneradoAlIGV">Estado IGV</label>
          <Button
            id="esExoneradoAlIGV"
            label={
              formData.esExoneradoAlIGV ? "EXONERADO AL IGV" : "AFECTO AL IGV"
            }
            icon={
              formData.esExoneradoAlIGV
                ? "pi pi-times-circle"
                : "pi pi-check-circle"
            }
            severity={formData.esExoneradoAlIGV ? "danger" : "success"}
            onClick={() =>
              onChange("esExoneradoAlIGV", !formData.esExoneradoAlIGV)
            }
            disabled={!puedeEditar}
            outlined
            style={{
              width: "100%",
              fontWeight: "bold",
              justifyContent: "center",
              color: "#000",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          {/* MONEDA */}
          <label htmlFor="monedaId">Moneda</label>
          <Dropdown
            id="monedaId"
            value={formData.monedaId}
            options={monedasOptions}
            onChange={(e) => onChange("monedaId", e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar moneda"
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
            disabled={!puedeEditar}
            showClear
          />
        </div>
        <div style={{ flex: 0.5 }}>
          {/* TIPO DE CAMBIO */}
          <label htmlFor="tipoCambio">T/C</label>
          <InputNumber
            id="tipoCambio"
            value={formData.tipoCambio}
            onValueChange={(e) => onChange("tipoCambio", e.value)}
            mode="decimal"
            minFractionDigits={3}
            maxFractionDigits={3}
            min={0}
            placeholder="0.000"
            disabled={!puedeEditar}
            inputStyle={{
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          />
        </div>
      </div>

      {/* SECCIÓN: DETALLES */}
      {isEdit && (
        <div style={{ marginTop: 20 }}>
          <DetallesTab
            requerimientoId={requerimientoId}
            productos={productos}
            empresaId={empresaId}
            empresasOptions={empresasOptions}
            puedeEditar={puedeEditar}
            puedeVerDetalles={puedeVerDetalles}
            puedeEditarDetalles={puedeEditarDetalles}
            datosGenerales={formData}
            toast={toast}
            onCountChange={onCountChange}
            subtotal={subtotal}
            totalIGV={totalIGV}
            total={total}
            monedasOptions={monedasOptions}
            monedaId={formData.monedaId}
            porcentajeIGV={formData.porcentajeIGV}
          />
        </div>
      )}

      {/* Sección de Información Adicional */}
      <Panel
        header="Información Adicional"
        toggleable
        collapsed
        className="p-mt-3"
      >
        {/* SECCIÓN: RESPONSABLES Y APROBACIONES */}
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginTop: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            {/* RESPONSABLE COMPRAS */}
            <label htmlFor="respComprasId">Resp. Compras</label>
            <Dropdown
              id="respComprasId"
              value={formData.respComprasId}
              options={responsablesComprasOptions}
              onChange={(e) => onChange("respComprasId", e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar responsable"
              disabled={!puedeEditar}
              showClear
              style={{
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            {/* RESPONSABLE PRODUCCIÓN */}
            <label htmlFor="respProduccionId">Resp. Producción</label>
            <Dropdown
              id="respProduccionId"
              value={formData.respProduccionId}
              options={responsablesProduccionOptions}
              onChange={(e) => onChange("respProduccionId", e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar responsable"
              disabled={!puedeEditar}
              showClear
              style={{
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            {/* RESPONSABLE ALMACÉN */}
            <label htmlFor="respAlmacenId">Resp. Almacén</label>
            <Dropdown
              id="respAlmacenId"
              value={formData.respAlmacenId}
              options={responsablesAlmacenOptions}
              onChange={(e) => onChange("respAlmacenId", e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar responsable"
              disabled={!puedeEditar}
              showClear
              style={{
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
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            {/* CENTRO DE COSTO */}
            <label htmlFor="centroCostoId">Centro de Costo*</label>
            <Dropdown
              id="centroCostoId"
              value={formData.centroCostoId}
              options={centrosCostoOptions}
              onChange={(e) => onChange("centroCostoId", e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar centro de costo"
              disabled={!puedeEditar}
              style={{
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            {/* SUPERVISOR CAMPO */}
            <label htmlFor="supervisorCampoId">Supervisor Campo</label>
            <Dropdown
              id="supervisorCampoId"
              value={formData.supervisorCampoId}
              options={personalOptions}
              onChange={(e) => onChange("supervisorCampoId", e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar supervisor"
              filter
              disabled={!puedeEditar}
              showClear
              style={{
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
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            {/* APROBADO POR */}
            <label htmlFor="aprobadoPorId">Aprobado Por</label>
            <InputText
              id="aprobadoPorId"
              value={getNombrePersonal(formData.aprobadoPorId)}
              disabled
              style={{
                fontWeight: "bold",
                textTransform: "uppercase",
                backgroundColor: "#f0f0f0",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            {/* FECHA APROBACIÓN */}
            <label htmlFor="fechaAprobacion">Fecha Aprobación</label>
            <Calendar
              id="fechaAprobacion"
              value={formData.fechaAprobacion}
              dateFormat="dd/mm/yy"
              showIcon
              disabled
              inputStyle={{
                fontWeight: "bold",
                textTransform: "uppercase",
                backgroundColor: "#f0f0f0",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            {/* AUTORIZA COMPRA */}
            <label htmlFor="autorizaCompraId">Autoriza Compra</label>
            <InputText
              id="autorizaCompraId"
              value={getNombrePersonal(formData.autorizaCompraId)}
              disabled
              style={{
                fontWeight: "bold",
                textTransform: "uppercase",
                backgroundColor: "#f0f0f0",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            {/* ORDEN TRABAJO ID */}
            <label htmlFor="ordenTrabajoId">Orden Trabajo ID</label>
            <InputText
              id="ordenTrabajoId"
              value={formData.ordenTrabajoId || ""}
              disabled
              style={{
                fontWeight: "bold",
                textTransform: "uppercase",
                backgroundColor: "#f0f0f0",
              }}
            />
          </div>
        </div>

        {/* SECCIÓN: AUDITORÍA */}
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid #e0e0e0",
          }}
        >
          <div style={{ flex: 2 }}>
            {/* CREADO POR */}
            <label htmlFor="creadoPor">Creado Por</label>
            <InputText
              id="creadoPor"
              value={getNombrePersonal(formData.creadoPor)}
              disabled
              style={{
                fontWeight: "bold",
                textTransform: "uppercase",
                backgroundColor: "#f0f0f0",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            {/* CREADO EN */}
            <label htmlFor="creadoEn">Creado En</label>
            <InputText
              id="creadoEn"
              value={
                formData.creadoEn
                  ? new Date(formData.creadoEn).toLocaleString("es-PE")
                  : ""
              }
              disabled
              style={{
                backgroundColor: "#f0f0f0",
                fontWeight: "bold",
              }}
            />
          </div>
          <div style={{ flex: 2 }}>
            {/* ACTUALIZADO POR */}
            <label htmlFor="actualizadoPor">Actualizado Por</label>
            <InputText
              id="actualizadoPor"
              value={getNombrePersonal(formData.actualizadoPor)}
              disabled
              style={{
                backgroundColor: "#f0f0f0",
                fontWeight: "bold",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            {/* ACTUALIZADO EN */}
            <label htmlFor="actualizadoEn">Actualizado En</label>
            <InputText
              id="actualizadoEn"
              value={
                formData.actualizadoEn
                  ? new Date(formData.actualizadoEn).toLocaleString("es-PE")
                  : ""
              }
              disabled
              style={{
                backgroundColor: "#f0f0f0",
                fontWeight: "bold",
              }}
            />
          </div>
        </div>
      </Panel>
    </div>
  );
}
