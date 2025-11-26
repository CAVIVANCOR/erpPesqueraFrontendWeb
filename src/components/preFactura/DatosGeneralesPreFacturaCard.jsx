// src/components/preFactura/DatosGeneralesPreFacturaCard.jsx
/**
 * Card de Datos Generales para Pre-Factura
 *
 * @author ERP Megui
 * @version 2.0.0 - Refactorización profesional
 */

import React, { useEffect, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import { getClientesPorEmpresa, getEntidadesComerciales } from "../../api/entidadComercial";
import { getSeriesDoc } from "../../api/preFactura";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import DetallePreFacturaCard from "./DetallePreFacturaCard";
import { Panel } from "primereact/panel";

const DatosGeneralesPreFacturaCard = ({
  formData,
  handleChange,
  handleSerieDocChange,
  empresaFija,
  disabled = false,
  permisos = {},
  empresas = [],
  clientes = [],
  tiposDocumento = [],
  seriesDoc = [],
  seriesDocOptions = [],
  tiposEstadoProductoOptions = [],
  destinosProductoOptions = [],
  tiposProducto = [],
  formasPago = [],
  monedas = [],
  centrosCosto = [],
  responsablesVentas = [],
  responsablesAutorizaVenta = [],
  responsablesSupervisorCampo = [],
  incoterms = [],
  paises = [],
  puertos = [],
  tiposContenedor = [],
  responsablesEmbarque = [],
  responsablesProduccion = [],
  responsablesAlmacen = [],
  agenteAduanas = [],
  operadoresLogisticos = [],
  navieras = [],
  bancos = [],
  setClientes,
  setSeriesDoc,
  estadosPreFacturasOptions = [],
  detalles = [],
  setDetalles,
  productos = [],
  isEdit = false,
  preFacturaId,
  toast,
  onCountChange,
  subtotal = 0,
  totalIGV = 0,
  total = 0,
  monedasOptions = [],
}) => {
  useEffect(() => {
    const cargarEntidadesComerciales = async () => {
      if (formData.empresaId) {
        try {
          const todasEntidades = await getEntidadesComerciales();
          const entidadesFiltradas = todasEntidades
            .filter((e) => Number(e.empresaId) === Number(formData.empresaId))
            .map((e) => ({
              ...e,
              label: e.razonSocial || e.nombreComercial,
              value: Number(e.id)
            }));
          setClientes(entidadesFiltradas);
        } catch (error) {
          console.error("Error al cargar entidades comerciales:", error);
          setClientes([]);
        }
      } else {
        setClientes([]);
      }
    };
    cargarEntidadesComerciales();
  }, [formData.empresaId, setClientes]);

  useEffect(() => {
    if (formData.fechaZarpeEstimada && formData.fechaArriboEstimada) {
      const zarpe = new Date(formData.fechaZarpeEstimada);
      const arribo = new Date(formData.fechaArriboEstimada);
      const diferenciaMilisegundos = arribo - zarpe;
      const diferenciaDias = Math.round(diferenciaMilisegundos / (1000 * 60 * 60 * 24));
      if (diferenciaDias >= 0 && diferenciaDias !== formData.diasTransito) {
        handleChange("diasTransito", diferenciaDias);
      }
    }
  }, [formData.fechaZarpeEstimada, formData.fechaArriboEstimada]);

  const obtenerPorcentajeIgvEmpresa = () => {
    if (!formData.empresaId) return 18;
    const empresaSeleccionada = empresas.find((e) => Number(e.id) === Number(formData.empresaId));
    return empresaSeleccionada?.porcentajeIgv || 18;
  };

  if (empresas.length === 0) {
    return (
      <div className="card">
        <h3>Datos Generales de la Pre-Factura</h3>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <i className="pi pi-spin pi-spinner" style={{ fontSize: "2rem", color: "#007ad9" }}></i>
          <p style={{ marginTop: "1rem", color: "#666" }}>Cargando catálogos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-fluid">
      <div style={{ alignItems: "end", display: "flex", gap: 3, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="empresaId">Empresa *</label>
          <Dropdown
            id="empresaId"
            value={formData.empresaId}
            options={empresas.map((e) => ({ label: e.razonSocial, value: Number(e.id) }))}
            onChange={(e) => handleChange("empresaId", e.value)}
            placeholder="Seleccionar empresa"
            filter
            showClear
            disabled={disabled || empresaFija !== null}
            style={{ fontWeight: "bold", textTransform: "uppercase", width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaDocumento">Fecha Dcmto *</label>
          <Calendar
            id="fechaDocumento"
            value={formData.fechaDocumento}
            onChange={(e) => handleChange("fechaDocumento", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
            disabled={disabled}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaVencimiento">Fecha Vence *</label>
          <Calendar
            id="fechaVencimiento"
            value={formData.fechaVencimiento}
            onChange={(e) => handleChange("fechaVencimiento", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
            disabled={disabled}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="tipoDocumentoId">Tipo Dcmto *</label>
          <Dropdown
            id="tipoDocumentoId"
            value={formData.tipoDocumentoId}
            options={tiposDocumento.map((t) => ({ label: t.descripcion, value: Number(t.id) }))}
            onChange={(e) => handleChange("tipoDocumentoId", e.value)}
            placeholder="Seleccionar tipo"
            filter
            showClear
            disabled={disabled}
            style={{ fontWeight: "bold", textTransform: "uppercase", width: "100%" }}
          />
        </div>
      </div>

      <div style={{ alignItems: "end", display: "flex", gap: 3, flexDirection: window.innerWidth < 768 ? "column" : "row", marginTop: "1rem" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="serieDocId">Serie Dcmto *</label>
          <Dropdown
            id="serieDocId"
            value={formData.serieDocId}
            options={seriesDocOptions}
            onChange={(e) => handleSerieDocChange(e.value)}
            placeholder="Seleccionar serie"
            filter
            showClear
            disabled={disabled || !formData.empresaId || !formData.tipoDocumentoId}
            style={{ fontWeight: "bold", textTransform: "uppercase", width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="numSerieDoc">Num Serie</label>
          <InputText
            id="numSerieDoc"
            value={formData.numSerieDoc || ""}
            disabled
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="numCorreDoc">Num Correlativo</label>
          <InputText
            id="numCorreDoc"
            value={formData.numCorreDoc || ""}
            disabled
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="numeroDocumento">Número Documento</label>
          <InputText
            id="numeroDocumento"
            value={formData.numeroDocumento || ""}
            disabled
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>
      </div>

      <div style={{ alignItems: "end", display: "flex", gap: 3, flexDirection: window.innerWidth < 768 ? "column" : "row", marginTop: "1rem" }}>
        <div style={{ flex: 2 }}>
          <label htmlFor="clienteId">Cliente *</label>
          <Dropdown
            id="clienteId"
            value={formData.clienteId}
            options={clientes.map((c) => ({ label: `${c.ruc || c.dni || ""} - ${c.razonSocial || c.nombreComercial}`, value: Number(c.id) }))}
            onChange={(e) => handleChange("clienteId", e.value)}
            placeholder="Seleccionar cliente"
            filter
            showClear
            disabled={disabled || !formData.empresaId}
            style={{ fontWeight: "bold", textTransform: "uppercase", width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="estadoId">Estado *</label>
          <Dropdown
            id="estadoId"
            value={formData.estadoId}
            options={estadosPreFacturasOptions}
            onChange={(e) => handleChange("estadoId", e.value)}
            placeholder="Seleccionar estado"
            filter
            showClear
            disabled={disabled}
            style={{ fontWeight: "bold", textTransform: "uppercase", width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="centroCostoId">Centro Costo</label>
          <Dropdown
            id="centroCostoId"
            value={formData.centroCostoId}
            options={centrosCosto.map((cc) => ({ label: cc.descripcion, value: Number(cc.id) }))}
            onChange={(e) => handleChange("centroCostoId", e.value)}
            placeholder="Seleccionar centro"
            filter
            showClear
            disabled={disabled}
            style={{ fontWeight: "bold", textTransform: "uppercase", width: "100%" }}
          />
        </div>
      </div>
            <div style={{ alignItems: "end", display: "flex", gap: 3, flexDirection: window.innerWidth < 768 ? "column" : "row", marginTop: "1rem" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="monedaId">Moneda *</label>
          <Dropdown
            id="monedaId"
            value={formData.monedaId}
            options={monedas.map((m) => ({ label: `${m.simbolo} - ${m.nombre}`, value: Number(m.id) }))}
            onChange={(e) => handleChange("monedaId", e.value)}
            placeholder="Seleccionar moneda"
            filter
            showClear
            disabled={disabled}
            style={{ fontWeight: "bold", textTransform: "uppercase", width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="tipoCambio">Tipo Cambio *</label>
          <InputNumber
            id="tipoCambio"
            value={formData.tipoCambio}
            onValueChange={(e) => handleChange("tipoCambio", e.value)}
            mode="decimal"
            minFractionDigits={4}
            maxFractionDigits={4}
            min={0}
            disabled={disabled}
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="formaPagoId">Forma Pago</label>
          <Dropdown
            id="formaPagoId"
            value={formData.formaPagoId}
            options={formasPago.map((fp) => ({ label: fp.descripcion, value: Number(fp.id) }))}
            onChange={(e) => handleChange("formaPagoId", e.value)}
            placeholder="Seleccionar forma"
            filter
            showClear
            disabled={disabled}
            style={{ fontWeight: "bold", textTransform: "uppercase", width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="tipoProductoId">Tipo Producto</label>
          <Dropdown
            id="tipoProductoId"
            value={formData.tipoProductoId}
            options={tiposProducto.map((tp) => ({ label: tp.descripcion, value: Number(tp.id) }))}
            onChange={(e) => handleChange("tipoProductoId", e.value)}
            placeholder="Seleccionar tipo"
            filter
            showClear
            disabled={disabled}
            style={{ fontWeight: "bold", textTransform: "uppercase", width: "100%" }}
          />
        </div>
      </div>

      <div style={{ alignItems: "end", display: "flex", gap: 3, flexDirection: window.innerWidth < 768 ? "column" : "row", marginTop: "1rem" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="porcentajeIGV">% IGV</label>
          <InputNumber
            id="porcentajeIGV"
            value={formData.porcentajeIGV}
            onValueChange={(e) => handleChange("porcentajeIGV", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            min={0}
            max={100}
            suffix="%"
            disabled={disabled || formData.esExoneradoAlIGV}
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", marginTop: "1.5rem" }}>
          <Checkbox
            inputId="esExoneradoAlIGV"
            checked={formData.esExoneradoAlIGV}
            onChange={(e) => handleChange("esExoneradoAlIGV", e.checked)}
            disabled={disabled}
          />
          <label htmlFor="esExoneradoAlIGV" style={{ marginLeft: "0.5rem" }}>Exonerado IGV</label>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", marginTop: "1.5rem" }}>
          <Checkbox
            inputId="esExportacion"
            checked={formData.esExportacion}
            onChange={(e) => handleChange("esExportacion", e.checked)}
            disabled={disabled}
          />
          <label htmlFor="esExportacion" style={{ marginLeft: "0.5rem" }}>Es Exportación</label>
        </div>
      </div>

      <div style={{ alignItems: "end", display: "flex", gap: 3, flexDirection: window.innerWidth < 768 ? "column" : "row", marginTop: "1rem" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="respVentasId">Resp. Ventas</label>
          <Dropdown
            id="respVentasId"
            value={formData.respVentasId}
            options={responsablesVentas.map((r) => ({ label: `${r.nombres} ${r.apellidos}`, value: Number(r.id) }))}
            onChange={(e) => handleChange("respVentasId", e.value)}
            placeholder="Seleccionar responsable"
            filter
            showClear
            disabled={disabled}
            style={{ fontWeight: "bold", textTransform: "uppercase", width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="autorizaVentaId">Autoriza Venta</label>
          <Dropdown
            id="autorizaVentaId"
            value={formData.autorizaVentaId}
            options={responsablesAutorizaVenta.map((r) => ({ label: `${r.nombres} ${r.apellidos}`, value: Number(r.id) }))}
            onChange={(e) => handleChange("autorizaVentaId", e.value)}
            placeholder="Seleccionar autorizador"
            filter
            showClear
            disabled={disabled}
            style={{ fontWeight: "bold", textTransform: "uppercase", width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="supervisorVentaCampoId">Supervisor Campo</label>
          <Dropdown
            id="supervisorVentaCampoId"
            value={formData.supervisorVentaCampoId}
            options={responsablesSupervisorCampo.map((r) => ({ label: `${r.nombres} ${r.apellidos}`, value: Number(r.id) }))}
            onChange={(e) => handleChange("supervisorVentaCampoId", e.value)}
            placeholder="Seleccionar supervisor"
            filter
            showClear
            disabled={disabled}
            style={{ fontWeight: "bold", textTransform: "uppercase", width: "100%" }}
          />
        </div>
      </div>

      {formData.esExportacion && (
        <>
          <div style={{ alignItems: "end", display: "flex", gap: 3, flexDirection: window.innerWidth < 768 ? "column" : "row", marginTop: "1rem" }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="paisDestinoId">País Destino</label>
              <Dropdown
                id="paisDestinoId"
                value={formData.paisDestinoId}
                options={paises.map((p) => ({ label: p.nombre, value: Number(p.id) }))}
                onChange={(e) => handleChange("paisDestinoId", e.value)}
                placeholder="Seleccionar país"
                filter
                showClear
                disabled={disabled}
                style={{ fontWeight: "bold", textTransform: "uppercase", width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="incotermsId">Incoterm</label>
              <Dropdown
                id="incotermsId"
                value={formData.incotermsId}
                options={incoterms.map((i) => ({ label: `${i.codigo} - ${i.descripcion}`, value: Number(i.id) }))}
                onChange={(e) => handleChange("incotermsId", e.value)}
                placeholder="Seleccionar incoterm"
                filter
                showClear
                disabled={disabled}
                style={{ fontWeight: "bold", textTransform: "uppercase", width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="puertoCargaId">Puerto Carga</label>
              <Dropdown
                id="puertoCargaId"
                value={formData.puertoCargaId}
                options={puertos.map((p) => ({ label: p.nombre, value: Number(p.id) }))}
                onChange={(e) => handleChange("puertoCargaId", e.value)}
                placeholder="Seleccionar puerto"
                filter
                showClear
                disabled={disabled}
                style={{ fontWeight: "bold", textTransform: "uppercase", width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="puertoDescargaId">Puerto Descarga</label>
              <Dropdown
                id="puertoDescargaId"
                value={formData.puertoDescargaId}
                options={puertos.map((p) => ({ label: p.nombre, value: Number(p.id) }))}
                onChange={(e) => handleChange("puertoDescargaId", e.value)}
                placeholder="Seleccionar puerto"
                filter
                showClear
                disabled={disabled}
                style={{ fontWeight: "bold", textTransform: "uppercase", width: "100%" }}
              />
            </div>
          </div>

          <div style={{ alignItems: "end", display: "flex", gap: 3, flexDirection: window.innerWidth < 768 ? "column" : "row", marginTop: "1rem" }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="agenteAduanasId">Agente Aduanas</label>
              <Dropdown
                id="agenteAduanasId"
                value={formData.agenteAduanasId}
                options={agenteAduanas.map((a) => ({ label: a.razonSocial, value: Number(a.id) }))}
                onChange={(e) => handleChange("agenteAduanasId", e.value)}
                placeholder="Seleccionar agente"
                filter
                showClear
                disabled={disabled}
                style={{ fontWeight: "bold", textTransform: "uppercase", width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="operadorLogisticoId">Operador Logístico</label>
              <Dropdown
                id="operadorLogisticoId"
                value={formData.operadorLogisticoId}
                options={operadoresLogisticos.map((o) => ({ label: o.razonSocial, value: Number(o.id) }))}
                onChange={(e) => handleChange("operadorLogisticoId", e.value)}
                placeholder="Seleccionar operador"
                filter
                showClear
                disabled={disabled}
                style={{ fontWeight: "bold", textTransform: "uppercase", width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="navieraId">Naviera</label>
              <Dropdown
                id="navieraId"
                value={formData.navieraId}
                options={navieras.map((n) => ({ label: n.razonSocial, value: Number(n.id) }))}
                onChange={(e) => handleChange("navieraId", e.value)}
                placeholder="Seleccionar naviera"
                filter
                showClear
                disabled={disabled}
                style={{ fontWeight: "bold", textTransform: "uppercase", width: "100%" }}
              />
            </div>
          </div>
        </>
      )}

      <div style={{ marginTop: "1rem" }}>
        <label htmlFor="observaciones">Observaciones</label>
        <InputTextarea
          id="observaciones"
          value={formData.observaciones}
          onChange={(e) => handleChange("observaciones", e.target.value)}
          rows={3}
          disabled={disabled}
        />
      </div>

      <div style={{ marginTop: "1rem" }}>
        <label htmlFor="observacionesInternas">Observaciones Internas</label>
        <InputTextarea
          id="observacionesInternas"
          value={formData.observacionesInternas}
          onChange={(e) => handleChange("observacionesInternas", e.target.value)}
          rows={2}
          disabled={disabled}
        />
      </div>

      <Panel header="Resumen de Montos" toggleable collapsed={false} style={{ marginTop: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "1rem", fontSize: "1.1rem" }}>
          <div><strong>Subtotal:</strong></div>
          <div>{new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(subtotal)}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "1rem", fontSize: "1.1rem" }}>
          <div><strong>IGV ({formData.porcentajeIGV || 0}%):</strong></div>
          <div>{new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(totalIGV)}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "1rem", fontSize: "1.3rem", fontWeight: "bold", borderTop: "2px solid #dee2e6" }}>
          <div>TOTAL:</div>
          <div style={{ color: "#2196F3" }}>{new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(total)}</div>
        </div>
      </Panel>

      <Panel header="Detalles de Productos" toggleable collapsed={false} style={{ marginTop: "1rem" }}>
        <DetallePreFacturaCard
          preFacturaId={preFacturaId}
          detalles={detalles}
          setDetalles={setDetalles}
          productos={productos}
          disabled={disabled || !isEdit}
          toast={toast}
          onCountChange={onCountChange}
          monedasOptions={monedasOptions}
        />
      </Panel>
    </div>
  );
};

export default DatosGeneralesPreFacturaCard;