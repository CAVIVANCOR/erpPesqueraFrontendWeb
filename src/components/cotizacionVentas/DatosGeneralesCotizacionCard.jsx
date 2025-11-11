// src/components/cotizacionVentas/DatosGeneralesCotizacionCard.jsx
/**
 * Card de Datos Generales para Cotización de Ventas
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
import { getClientesPorEmpresa } from "../../api/entidadComercial";
import { getSeriesDoc } from "../../api/cotizacionVentas";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import DetCotizacionVentasCard from "./DetCotizacionVentasCard";

const DatosGeneralesCotizacionCard = ({
  // Props profesionales (patrón ERP Megui)
  formData,
  handleChange,
  handleSerieDocChange,
  empresaFija,
  disabled = false,
  permisos = {},
  // Catálogos
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
  formasTransaccion = [],
  modosDespacho = [],
  // Estados para catálogos dinámicos
  setClientes,
  setSeriesDoc,
  estadosCotizacionesOptions = [],
  // Props para DetCotizacionVentasCard
  detalles = [],
  setDetalles,
  productos = [],
  isEdit = false,
  cotizacionId,
  toast,
  onCountChange,
  subtotal = 0,
  totalIGV = 0,
  total = 0,
  monedasOptions = [],
}) => {
  // Cargar clientes cuando cambia la empresa
  useEffect(() => {
    const cargarClientes = async () => {
      if (formData.empresaId) {
        try {
          const clientesData = await getClientesPorEmpresa(formData.empresaId);
          console.log("cargarClientes", clientesData);
          setClientes(clientesData);
        } catch (error) {
          console.error("Error al cargar clientes:", error);
          setClientes([]);
        }
      } else {
        setClientes([]);
      }
    };
    cargarClientes();
  }, [formData.empresaId, setClientes]);

  // Calcular días de tránsito automáticamente
  useEffect(() => {
    if (formData.fechaZarpeEstimada && formData.fechaArriboEstimada) {
      const zarpe = new Date(formData.fechaZarpeEstimada);
      const arribo = new Date(formData.fechaArriboEstimada);
      
      // Calcular diferencia en milisegundos y convertir a días
      const diferenciaMilisegundos = arribo - zarpe;
      const diferenciaDias = Math.round(diferenciaMilisegundos / (1000 * 60 * 60 * 24));
      
      // Solo actualizar si el valor calculado es diferente y es positivo
      if (diferenciaDias >= 0 && diferenciaDias !== formData.diasTransito) {
        handleChange("diasTransito", diferenciaDias);
      }
    }
  }, [formData.fechaZarpeEstimada, formData.fechaArriboEstimada]);

  // Debug: verificar países
  console.log("Paises recibidos:", paises);

  // Si no hay datos básicos, mostrar mensaje de carga
  if (empresas.length === 0) {
    return (
      <div className="card">
        <h3>Datos Generales de la Cotización</h3>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <i
            className="pi pi-spin pi-spinner"
            style={{ fontSize: "2rem", color: "#007ad9" }}
          ></i>
          <p style={{ marginTop: "1rem", color: "#666" }}>
            Cargando catálogos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-fluid">
      <div
        style={{
          alignItems: "end",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="empresaId" style={{ fontWeight: "bold" }}>
            Empresa *
          </label>
          <Dropdown
            id="empresaId"
            value={formData.empresaId}
            options={empresas.map((e) => ({
              label: e.razonSocial,
              value: Number(e.id),
            }))}
            onChange={(e) => handleChange("empresaId", e.value)}
            placeholder="Seleccionar empresa"
            filter
            showClear
            disabled={disabled || empresaFija !== null}
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              width: "100%",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaDocumento" style={{ fontWeight: "bold" }}>
            Fecha Dcmto *
          </label>
          <Calendar
            id="fechaDocumento"
            value={formData.fechaDocumento}
            onChange={(e) => handleChange("fechaDocumento", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            inputStyle={{
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
            disabled={disabled}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaVencimiento" style={{ fontWeight: "bold" }}>
            Fecha Vence *
          </label>
          <Calendar
            id="fechaVencimiento"
            value={formData.fechaVencimiento}
            onChange={(e) => handleChange("fechaVencimiento", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            inputStyle={{
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
            disabled={disabled}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="tipoDocumentoId" style={{ fontWeight: "bold" }}>
            Tipo Dcmto *
          </label>
          <Dropdown
            id="tipoDocumentoId"
            value={
              formData.tipoDocumentoId ? Number(formData.tipoDocumentoId) : null
            }
            options={tiposDocumento.map((t) => ({
              label: t.descripcion || t.nombre,
              value: Number(t.id),
            }))}
            onChange={(e) => handleChange("tipoDocumentoId", e.value)}
            placeholder="Tipo documento"
            disabled={true}
            style={{
              backgroundColor: "#f0f0f0",
              fontWeight: "bold",
              width: "100%",
            }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="numeroDocumento" style={{ fontWeight: "bold" }}>
            N° Dcmto
          </label>
          <InputText
            id="numeroDocumento"
            value={formData.numeroDocumento || ""}
            disabled
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              width: "100%",
            }}
          />
        </div>

        <div style={{ flex: 0.5 }}>
          {/* ESTADO */}
          <label htmlFor="estadoId" style={{ fontWeight: "bold" }}>
            Estado*
          </label>
          <Dropdown
            id="estadoId"
            value={formData.estadoId ? Number(formData.estadoId) : null}
            options={estadosCotizacionesOptions}
            onChange={(e) => handleChange("estadoId", e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar estado"
            disabled={true}
            style={{
              fontWeight: "bold",
              backgroundColor: "#f0f0f0",
              width: "100%",
            }}
          />
        </div>
      </div>

      {/* Segunda fila: Serie de Documento */}
      <div
        style={{
          marginTop: "1rem",
          alignItems: "end",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="serieDocId" style={{ fontWeight: "bold" }}>
            Serie de Dcmto*
          </label>
          <Dropdown
            id="serieDocId"
            value={formData.serieDocId ? Number(formData.serieDocId) : null}
            options={seriesDocOptions}
            onChange={(e) => handleSerieDocChange(e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar serie"
            disabled={
              disabled || !formData.tipoDocumentoId || !!formData.serieDocId
            }
            required
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              width: "100%",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          {/* NÚMERO SERIE DOC */}
          <label htmlFor="numSerieDoc" style={{ fontWeight: "bold" }}>
            N° Serie Dcmto
          </label>
          <InputText
            id="numSerieDoc"
            value={formData.numSerieDoc || ""}
            disabled
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              backgroundColor: "#f0f0f0",
              width: "100%",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          {/* NÚMERO CORRELATIVO */}
          <label htmlFor="numCorreDoc" style={{ fontWeight: "bold" }}>
            N° Correlativo
          </label>
          <InputText
            id="numCorreDoc"
            value={formData.numCorreDoc || ""}
            disabled
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              backgroundColor: "#f0f0f0",
              width: "100%",
            }}
          />
        </div>
        <div style={{ flex: 2 }}>
          <label htmlFor="respVentasId" style={{ fontWeight: "bold" }}>
            Responsable Ventas *
          </label>
          <Dropdown
            id="respVentasId"
            value={formData.respVentasId ? Number(formData.respVentasId) : null}
            options={responsablesVentas.map((r) => ({
              label: `${r.nombres} ${r.apellidos}`,
              value: Number(r.id),
            }))}
            onChange={(e) => handleChange("respVentasId", e.value)}
            placeholder="Seleccionar responsable"
            filter
            showClear
            style={{ width: "100%" }}
            disabled={disabled}
          />
        </div>
      </div>

      <div
        style={{
          marginTop: "1rem",
          alignItems: "end",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 3 }}>
          <label htmlFor="clienteId" style={{ fontWeight: "bold" }}>
            Cliente *
          </label>
          <Dropdown
            id="clienteId"
            value={formData.clienteId ? Number(formData.clienteId) : null}
            options={clientes.map((c) => ({
              label: c.razonSocial,
              value: Number(c.id),
            }))}
            onChange={(e) => handleChange("clienteId", e.value)}
            placeholder="Seleccionar cliente"
            style={{ width: "100%", fontWeight: "bold" }}
            filter
            showClear
            disabled={disabled || !formData.empresaId}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaEntregaEstimada" style={{ fontWeight: "bold" }}>
            Fecha Entrega Estimada *
          </label>
          <Calendar
            id="fechaEntregaEstimada"
            value={formData.fechaEntregaEstimada}
            onChange={(e) => handleChange("fechaEntregaEstimada", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            disabled={disabled}
            inputStyle={{
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          />
        </div>
      </div>

      <div
        style={{
          marginTop: "1rem",
          alignItems: "end",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="tipoProductoId" style={{ fontWeight: "bold" }}>
            Tipo de Producto *
          </label>
          <Dropdown
            id="tipoProductoId"
            value={
              formData.tipoProductoId ? Number(formData.tipoProductoId) : null
            }
            options={tiposProducto.map((t) => ({
              label: t.descripcion,
              value: Number(t.id),
            }))}
            onChange={(e) => handleChange("tipoProductoId", e.value)}
            placeholder="Seleccionar tipo de producto"
            filter
            showClear
            disabled={disabled}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          {/* ESTADO PRODUCTO */}
          <label htmlFor="tipoEstadoProductoId" style={{ fontWeight: "bold" }}>
            Estado Producto
          </label>
          <Dropdown
            id="tipoEstadoProductoId"
            value={formData.tipoEstadoProductoId}
            options={tiposEstadoProductoOptions}
            onChange={(e) => handleChange("tipoEstadoProductoId", e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar estado"
            disabled={disabled}
            showClear
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              width: "100%",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          {/* DESTINO PRODUCTO */}
          <label htmlFor="destinoProductoId" style={{ fontWeight: "bold" }}>
            Destino Producto
          </label>
          <Dropdown
            id="destinoProductoId"
            value={formData.destinoProductoId}
            options={destinosProductoOptions}
            onChange={(e) => handleChange("destinoProductoId", e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar destino"
            disabled={disabled}
            showClear
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              width: "100%",
            }}
          />
        </div>
      </div>

      <div
        style={{
          marginTop: "1rem",
          alignItems: "end",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 2 }}>
          <label htmlFor="formaPagoId" style={{ fontWeight: "bold" }}>
            Forma de Pago *
          </label>
          <Dropdown
            id="formaPagoId"
            value={formData.formaPagoId ? Number(formData.formaPagoId) : null}
            options={formasPago.map((f) => ({
              label: f.descripcion,
              value: Number(f.id),
            }))}
            onChange={(e) => handleChange("formaPagoId", e.value)}
            placeholder="Seleccionar forma de pago"
            filter
            showClear
            disabled={disabled}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 0.5 }}>
          <label htmlFor="monedaId" style={{ fontWeight: "bold" }}>
            Moneda *
          </label>
          <Dropdown
            id="monedaId"
            value={formData.monedaId ? Number(formData.monedaId) : null}
            options={monedas.map((m) => ({
              label: m.codigoSunat,
              value: Number(m.id),
            }))}
            onChange={(e) => handleChange("monedaId", e.value)}
            placeholder="Seleccionar moneda"
            filter
            showClear
            disabled={disabled}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ flex: 0.3 }}>
          <label htmlFor="tipoCambio" style={{ fontWeight: "bold" }}>
            T/C *
          </label>
          <InputNumber
            id="tipoCambio"
            value={formData.tipoCambio}
            onValueChange={(e) => handleChange("tipoCambio", e.value)}
            mode="decimal"
            minFractionDigits={3}
            maxFractionDigits={3}
            disabled={disabled}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="paisDestinoId" style={{ fontWeight: "bold" }}>
            País Destino *
          </label>
          <Dropdown
            id="paisDestinoId"
            value={
              formData.paisDestinoId ? Number(formData.paisDestinoId) : null
            }
            options={paises.map((p) => ({
              label: p.nombre,
              value: Number(p.id),
            }))}
            onChange={(e) => {
              handleChange("paisDestinoId", e.value);
              // Actualizar esExportacion según el país seleccionado
              if (e.value) {
                const esExportacion = Number(e.value) !== 1;
                handleChange("esExportacion", esExportacion);
              }
            }}
            placeholder="Seleccionar país de destino"
            filter
            showClear
            style={{ width: "100%" }}
            disabled={disabled}
          />
        </div>
        <div style={{ flex: 0.5 }}>
          <label style={{ fontWeight: "bold" }}>Tipo Venta</label>
          <Button
            label={formData.esExportacion ? "EXPORTACIÓN" : "LOCAL"}
            severity={formData.esExportacion ? "success" : "info"}
            disabled
            style={{
              width: "100%",
              fontWeight: "bold",
              cursor: "default",
            }}
          />
        </div>
      </div>

      {/* SECCIÓN: DETALLES */}
      {isEdit && (
        <div style={{ marginTop: 20 }}>
          <DetCotizacionVentasCard
            cotizacionId={formData.id}
            productos={productos}
            empresaId={formData.empresaId}
            empresasOptions={empresas}
            puedeEditar={permisos.puedeEditar || true}
            puedeVerDetalles={true}
            puedeEditarDetalles={permisos.puedeEditar || true}
            datosGenerales={formData}
            toast={null}
            onCountChange={() => {}}
            subtotal={0}
            totalIGV={0}
            total={0}
            monedasOptions={monedas.map(m => ({ value: m.id, codigoSunat: m.codigoSunat }))}
            monedaId={formData.monedaId}
            porcentajeIGV={formData.porcentajeIGV || 18}
            centrosCosto={centrosCosto}
          />
        </div>
      )}

      {/* FILA: Puertos (solo para exportación) */}
      {formData.esExportacion && (
        <>
          <div
            style={{
              marginTop: "1rem",
              alignItems: "end",
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 0.5 }}>
              <label htmlFor="incotermsId" style={{ fontWeight: "bold" }}>
                Incoterms *
              </label>
              <Dropdown
                id="incotermsId"
                value={
                  formData.incotermsId ? Number(formData.incotermsId) : null
                }
                options={incoterms.map((i) => ({
                  label: i.codigo,
                  value: Number(i.id),
                }))}
                onChange={(e) => handleChange("incotermsId", e.value)}
                placeholder="Seleccionar incoterms"
                filter
                showClear
                disabled={disabled}
                style={{ width: "100%", fontWeight: "bold" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="tipoContenedorId" style={{ fontWeight: "bold" }}>
                Tipo Contenedor
              </label>
              <Dropdown
                id="tipoContenedorId"
                value={
                  formData.tipoContenedorId
                    ? Number(formData.tipoContenedorId)
                    : null
                }
                options={tiposContenedor.map((t) => ({
                  label: t.nombre,
                  value: Number(t.id),
                }))}
                onChange={(e) => handleChange("tipoContenedorId", e.value)}
                placeholder="Seleccionar tipo de contenedor"
                filter
                showClear
                disabled={disabled}
                style={{ width: "100%", fontWeight: "bold" }}
              />
            </div>

            <div style={{ flex: 0.5 }}>
              <label
                htmlFor="cantidadContenedores"
                style={{ fontWeight: "bold" }}
              >
                N° Contenedores
              </label>
              <InputNumber
                id="cantidadContenedores"
                value={formData.cantidadContenedores}
                onValueChange={(e) =>
                  handleChange("cantidadContenedores", e.value)
                }
                min={1}
                disabled={disabled}
                style={{ width: "100%"}}
                inputStyle={{fontWeight: "bold"}}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label
                htmlFor="pesoMaximoContenedor"
                style={{ fontWeight: "bold" }}
              >
                Peso Máximo
              </label>
              <InputNumber
                id="pesoMaximoContenedor"
                value={formData.pesoMaximoContenedor}
                onValueChange={(e) =>
                  handleChange("pesoMaximoContenedor", e.value)
                }
                min={0}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                disabled={disabled}
                style={{ width: "100%" }}
                inputStyle={{fontWeight: "bold"}}
              />
            </div>
            <div style={{ flex: 2 }}>
              <label htmlFor="respEmbarqueId" style={{ fontWeight: "bold" }}>
                Responsable de Embarque
              </label>
              <Dropdown
                id="respEmbarqueId"
                value={
                  formData.respEmbarqueId
                    ? Number(formData.respEmbarqueId)
                    : null
                }
                options={responsablesEmbarque.map((r) => ({
                  label: `${r.nombres} ${r.apellidos}`,
                  value: Number(r.id),
                }))}
                onChange={(e) => handleChange("respEmbarqueId", e.value)}
                placeholder="Seleccionar responsable"
                filter
                showClear
                disabled={disabled}
                style={{ width: "100%" }}
              />
            </div>
          </div>
          <div
            style={{
              marginTop: "1rem",
              alignItems: "end",
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="puertoCargaId" style={{ fontWeight: "bold" }}>
                Puerto Origen
              </label>
              <Dropdown
                id="puertoCargaId"
                value={
                  formData.puertoCargaId ? Number(formData.puertoCargaId) : null
                }
                options={puertos.map((p) => ({
                  label: p.nombre,
                  value: Number(p.id),
                }))}
                onChange={(e) => handleChange("puertoCargaId", e.value)}
                placeholder="Seleccionar puerto de carga"
                filter
                showClear
                disabled={disabled}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="fechaZarpeEstimada"
                style={{ fontWeight: "bold" }}
              >
                Fecha Zarpe Estimada
              </label>
              <Calendar
                id="fechaZarpeEstimada"
                value={formData.fechaZarpeEstimada}
                onChange={(e) => handleChange("fechaZarpeEstimada", e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                disabled={disabled}
                inputStyle={{
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="puertoDescargaId" style={{ fontWeight: "bold" }}>
                Puerto Destino
              </label>
              <Dropdown
                id="puertoDescargaId"
                value={
                  formData.puertoDescargaId
                    ? Number(formData.puertoDescargaId)
                    : null
                }
                options={puertos.map((p) => ({
                  label: p.nombre,
                  value: Number(p.id),
                }))}
                onChange={(e) => handleChange("puertoDescargaId", e.value)}
                placeholder="Seleccionar puerto de descarga"
                filter
                showClear
                disabled={disabled}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="fechaArriboEstimada"
                style={{ fontWeight: "bold" }}
              >
                Fecha Arribo Estimada
              </label>
              <Calendar
                id="fechaArriboEstimada"
                value={formData.fechaArriboEstimada}
                onChange={(e) => handleChange("fechaArriboEstimada", e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                disabled={disabled}
                inputStyle={{
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label htmlFor="diasTransito" style={{ fontWeight: "bold" }}>
                N° Días Tránsito (Calculado)
              </label>
              <InputNumber
                id="diasTransito"
                value={formData.diasTransito}
                onValueChange={(e) => handleChange("diasTransito", e.value)}
                min={0}
                disabled={true}
                style={{ width: "100%" }}
                inputStyle={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}
              />
            </div>
          </div>
          {/* SECCIÓN: LOGÍSTICA */}
          <div
            style={{
              alignItems: "end",
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
              marginTop: "2rem",
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="agenteAduanasId" style={{ fontWeight: "bold" }}>
                Agente de Aduanas
              </label>
              <Dropdown
                id="agenteAduanasId"
                value={
                  formData.agenteAduanasId
                    ? Number(formData.agenteAduanasId)
                    : null
                }
                options={agenteAduanas.map((a) => ({
                  label: a.razonSocial,
                  value: Number(a.id),
                }))}
                onChange={(e) => handleChange("agenteAduanasId", e.value)}
                placeholder="Seleccionar agente de aduanas"
                filter
                showClear
                disabled={disabled}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="operadorLogisticoId"
                style={{ fontWeight: "bold" }}
              >
                Operador Logístico
              </label>
              <Dropdown
                id="operadorLogisticoId"
                value={
                  formData.operadorLogisticoId
                    ? Number(formData.operadorLogisticoId)
                    : null
                }
                options={operadoresLogisticos.map((o) => ({
                  label: o.razonSocial,
                  value: Number(o.id),
                }))}
                onChange={(e) => handleChange("operadorLogisticoId", e.value)}
                placeholder="Seleccionar operador logístico"
                filter
                showClear
                disabled={disabled}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="navieraId" style={{ fontWeight: "bold" }}>
                Naviera
              </label>
              <Dropdown
                id="navieraId"
                value={formData.navieraId ? Number(formData.navieraId) : null}
                options={navieras.map((n) => ({
                  label: n.razonSocial,
                  value: Number(n.id),
                }))}
                onChange={(e) => handleChange("navieraId", e.value)}
                placeholder="Seleccionar naviera"
                filter
                showClear
                disabled={disabled}
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </>
      )}
      <div
        style={{
          marginTop: "1rem",
          alignItems: "end",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="respProduccionId" style={{ fontWeight: "bold" }}>
            Responsable de Producción
          </label>
          <Dropdown
            id="respProduccionId"
            value={
              formData.respProduccionId
                ? Number(formData.respProduccionId)
                : null
            }
            options={responsablesProduccion.map((r) => ({
              label: `${r.nombres} ${r.apellidos}`,
              value: Number(r.id),
            }))}
            onChange={(e) => handleChange("respProduccionId", e.value)}
            placeholder="Seleccionar responsable"
            filter
            showClear
            disabled={disabled}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="respAlmacenId" style={{ fontWeight: "bold" }}>
            Responsable de Almacén
          </label>
          <Dropdown
            id="respAlmacenId"
            value={
              formData.respAlmacenId ? Number(formData.respAlmacenId) : null
            }
            options={responsablesAlmacen.map((r) => ({
              label: `${r.nombres} ${r.apellidos}`,
              value: Number(r.id),
            }))}
            onChange={(e) => handleChange("respAlmacenId", e.value)}
            placeholder="Seleccionar responsable"
            filter
            showClear
            disabled={disabled}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="autorizaVentaId" style={{ fontWeight: "bold" }}>
            Autoriza Venta *
          </label>
          <Dropdown
            id="autorizaVentaId"
            value={
              formData.autorizaVentaId ? Number(formData.autorizaVentaId) : null
            }
            options={responsablesAutorizaVenta.map((r) => ({
              label: `${r.nombres} ${r.apellidos}`,
              value: Number(r.id),
            }))}
            onChange={(e) => handleChange("autorizaVentaId", e.value)}
            placeholder="Auto-asignado desde Parámetro Aprobador"
            filter
            showClear
            disabled={disabled}
            style={{
              fontWeight: "bold",
              width: "100%",
            }}
          />
        </div>
        {/* Botón Aprobar Cotización */}
        {formData.estadoId !== 42 && permisos.puedeAprobarDocs && (
          <div style={{ flex: 0.5, display: "flex", alignItems: "flex-end" }}>
            <Button
              label="Aprobar Cotización"
              icon="pi pi-check"
              severity="success"
              onClick={handleAprobarCotizacion}
              loading={loadingAprobar}
              disabled={disabled || loadingAprobar}
              style={{ width: "100%" }}
            />
          </div>
        )}
        {/* Indicador de estado aprobado */}
        {formData.estadoId === 42 && (
          <div style={{ flex: 0.5, display: "flex", alignItems: "flex-end" }}>
            <Button
              label="APROBADO"
              icon="pi pi-check-circle"
              severity="success"
              disabled
              style={{ width: "100%", fontWeight: "bold" }}
            />
          </div>
        )}
      </div>

      {/* SECCIÓN: OBSERVACIONES */}
      <div
        style={{
          alignItems: "end",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
          marginTop: "2rem",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="observaciones" style={{ fontWeight: "bold" }}>
            Observaciones
          </label>
          <InputTextarea
            id="observaciones"
            value={formData.observaciones || ""}
            onChange={(e) => handleChange("observaciones", e.target.value)}
            rows={2}
            disabled={disabled}
          />
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="observacionesInternas" style={{ fontWeight: "bold" }}>
            Observaciones Internas
          </label>
          <InputTextarea
            id="observacionesInternas"
            value={formData.observacionesInternas || ""}
            onChange={(e) =>
              handleChange("observacionesInternas", e.target.value)
            }
            rows={2}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};

export default DatosGeneralesCotizacionCard;
