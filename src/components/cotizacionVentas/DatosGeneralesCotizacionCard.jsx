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
import { getClientesPorEmpresa, getEntidadesComerciales } from "../../api/entidadComercial";
import { getSeriesDoc } from "../../api/cotizacionVentas";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import DetCotizacionVentasCard from "./DetCotizacionVentasCard";
import { Panel } from "primereact/panel";

const DatosGeneralesCotizacionCard = ({
  // Props profesionales (patrón ERP Megui)
  formData,
  handleChange,
  handleSerieDocChange,
  empresaFija,
  disabled = false,
  permisos = {},
  readOnly = false,
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
  // Cargar todas las entidades comerciales (clientes Y proveedores) cuando cambie la empresa
  useEffect(() => {
    const cargarEntidadesComerciales = async () => {
      if (formData.empresaId) {
        try {
          // Obtener todas las entidades comerciales
          const todasEntidades = await getEntidadesComerciales();
          // Filtrar por empresaId para obtener clientes Y proveedores de esta empresa
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

  // Calcular días de tránsito automáticamente
  useEffect(() => {
    if (formData.fechaZarpeEstimada && formData.fechaArriboEstimada) {
      const zarpe = new Date(formData.fechaZarpeEstimada);
      const arribo = new Date(formData.fechaArriboEstimada);

      // Calcular diferencia en milisegundos y convertir a días
      const diferenciaMilisegundos = arribo - zarpe;
      const diferenciaDias = Math.round(
        diferenciaMilisegundos / (1000 * 60 * 60 * 24)
      );

      // Solo actualizar si el valor calculado es diferente y es positivo
      if (diferenciaDias >= 0 && diferenciaDias !== formData.diasTransito) {
        handleChange("diasTransito", diferenciaDias);
      }
    }
  }, [formData.fechaZarpeEstimada, formData.fechaArriboEstimada]);

  // Función helper para obtener porcentajeIgv de la empresa seleccionada
  const obtenerPorcentajeIgvEmpresa = () => {
    if (!formData.empresaId) return 18; // Valor por defecto
    const empresaSeleccionada = empresas.find(
      (e) => Number(e.id) === Number(formData.empresaId)
    );
    return empresaSeleccionada?.porcentajeIgv || 18;
  };

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
          gap: 3,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="empresaId">Empresa *</label>
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
            disabled={disabled || readOnly || empresaFija !== null}
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              width: "100%",
            }}
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
            inputStyle={{
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
            disabled={disabled || readOnly}
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
            inputStyle={{
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
            disabled={disabled || readOnly}
          />
        </div>
        <div style={{ flex: 0.5 }}>
          <label htmlFor="tipoDocumentoId">Tipo Dcmto *</label>
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
              fontWeight: "bold",
              width: "100%",
            }}
          />
        </div>

        <div style={{ flex: 1.1 }}>
          <label htmlFor="numeroDocumento">N° Dcmto</label>
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
          <label htmlFor="estadoId">Estado*</label>
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
              width: "100%",
            }}
          />
        </div>
      </div>

      {/* Segunda fila: Serie de Documento */}
      <div
        style={{
          marginTop: "0.5rem",
          alignItems: "end",
          display: "flex",
          gap: 3,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="serieDocId">Serie de Dcmto*</label>
          <Dropdown
            id="serieDocId"
            value={formData.serieDocId ? Number(formData.serieDocId) : null}
            options={seriesDocOptions}
            onChange={(e) => handleSerieDocChange(e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar serie"
            disabled={
              disabled || readOnly || !formData.tipoDocumentoId || !!formData.serieDocId
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
          <label htmlFor="numSerieDoc">N° Serie Dcmto</label>
          <InputText
            id="numSerieDoc"
            value={formData.numSerieDoc || ""}
            disabled
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              width: "100%",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          {/* NÚMERO CORRELATIVO */}
          <label htmlFor="numCorreDoc">N° Correlativo</label>
          <InputText
            id="numCorreDoc"
            value={formData.numCorreDoc || ""}
            disabled
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              width: "100%",
            }}
          />
        </div>
        <div style={{ flex: 2 }}>
          <label htmlFor="respVentasId">Responsable Ventas *</label>
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
            style={{ width: "100%", fontWeight: "bold" }}
            disabled={disabled || readOnly}
          />
        </div>
      </div>

      <div
        style={{
          marginTop: "0.5rem",
          alignItems: "end",
          display: "flex",
          gap:3,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 3 }}>
          <label htmlFor="clienteId">Cliente *</label>
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
            disabled={disabled || readOnly || !formData.empresaId}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaEntregaEstimada">Fecha Entrega Estimada *</label>
          <Calendar
            id="fechaEntregaEstimada"
            value={formData.fechaEntregaEstimada}
            onChange={(e) => handleChange("fechaEntregaEstimada", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            disabled={disabled || readOnly}
            inputStyle={{
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          />
        </div>
      </div>

      <div
        style={{
          marginTop: "0.5rem",
          alignItems: "end",
          display: "flex",
          gap: 3,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="tipoProductoId">Tipo de Producto *</label>
          <Dropdown
            id="tipoProductoId"
            value={
              formData.tipoProductoId ? Number(formData.tipoProductoId) : null
            }
            options={tiposProducto.map((t) => ({
              label: t.nombre,
              value: Number(t.id),
            }))}
            onChange={(e) => handleChange("tipoProductoId", e.value)}
            placeholder="Seleccionar tipo de producto"
            filter
            showClear
            disabled={disabled || readOnly}
            style={{ width: "100%", fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          {/* ESTADO PRODUCTO */}
          <label htmlFor="tipoEstadoProductoId">Estado Producto</label>
          <Dropdown
            id="tipoEstadoProductoId"
            value={formData.tipoEstadoProductoId}
            options={tiposEstadoProductoOptions}
            onChange={(e) => handleChange("tipoEstadoProductoId", e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar estado"
            disabled={disabled || readOnly}
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
          <label htmlFor="destinoProductoId">Destino Producto</label>
          <Dropdown
            id="destinoProductoId"
            value={formData.destinoProductoId}
            options={destinosProductoOptions}
            onChange={(e) => {
              const destinoId = e.value;
              handleChange("destinoProductoId", destinoId);

              // Sincronizar esExoneradoAlIGV y porcentajeIGV según destino
              if (destinoId === 2) {
                // MERCADO EXTERIOR: Exonerado
                handleChange("esExoneradoAlIGV", true);
                handleChange("porcentajeIGV", 0);
              } else if (destinoId === 1) {
                // MERCADO LOCAL: Afecto
                handleChange("esExoneradoAlIGV", false);
                handleChange("porcentajeIGV", obtenerPorcentajeIgvEmpresa());
              }
            }}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar destino"
            disabled={disabled || readOnly}
            showClear
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              width: "100%",
            }}
          />
        </div>
        <div style={{ flex: 0.5 }}>
          <label htmlFor="porcentajeIGV">% IGV *</label>
          <InputNumber
            id="porcentajeIGV"
            value={formData.porcentajeIGV}
            onValueChange={(e) => handleChange("porcentajeIGV", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            min={0}
            max={100}
            suffix=" %"
            disabled={disabled || readOnly}
            style={{ width: "100%" }}
            inputStyle={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 0.5 }}>
          <label>Estado IGV</label>
          <Button
            label={formData.esExoneradoAlIGV ? "EXONERADO" : "AFECTO"}
            severity={formData.esExoneradoAlIGV ? "danger" : "warning"}
            onClick={() => {
              const nuevoEstado = !formData.esExoneradoAlIGV;
              handleChange("esExoneradoAlIGV", nuevoEstado);

              // Sincronizar porcentajeIGV
              if (nuevoEstado) {
                // Cambio a EXONERADO: porcentaje = 0
                handleChange("porcentajeIGV", 0);
              } else {
                // Cambio a AFECTO: porcentaje = empresa.porcentajeIgv
                handleChange("porcentajeIGV", obtenerPorcentajeIgvEmpresa());
              }
            }}
            disabled={disabled || readOnly}
            style={{
              width: "100%",
              fontWeight: "bold",
              marginTop: "0.25rem",
            }}
          />
        </div>
      </div>

      <div
        style={{
          marginTop: "0.5rem",
          alignItems: "end",
          display: "flex",
          gap: 3,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 2 }}>
          <label htmlFor="formaPagoId">Forma de Pago *</label>
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
            disabled={disabled || readOnly}
            style={{ width: "100%", fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 0.5 }}>
          <label htmlFor="monedaId">Moneda *</label>
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
            disabled={disabled || readOnly}
            style={{ width: "100%", fontWeight: "bold" }}
          />
        </div>

        <div style={{ flex: 0.3 }}>
          <label htmlFor="tipoCambio">T/C *</label>
          <InputNumber
            id="tipoCambio"
            value={formData.tipoCambio}
            onValueChange={(e) => handleChange("tipoCambio", e.value)}
            mode="decimal"
            minFractionDigits={3}
            maxFractionDigits={3}
            disabled={disabled || readOnly}
            inputStyle={{ width: "100%", fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="paisDestinoId">País Destino *</label>
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
            style={{ width: "100%", fontWeight: "bold" }}
            disabled={disabled || readOnly}
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

      {/* FILA: Impuestos */}
      <div
        style={{
          marginTop: "1rem",
          alignItems: "end",
          display: "flex",
          gap: 3,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      ></div>

      {/* SECCIÓN: DETALLES */}
      {isEdit && cotizacionId && (
        <div style={{ marginTop: "0.5rem" }}>
          <DetCotizacionVentasCard
            cotizacionId={cotizacionId}
            productos={productos}
            empresaId={formData.empresaId}
            empresasOptions={empresas}
            puedeEditar={permisos.puedeEditar || true}
            puedeVerDetalles={true}
            puedeEditarDetalles={permisos.puedeEditar || true}
            datosGenerales={formData}
            toast={toast}
            onCountChange={onCountChange}
            subtotal={subtotal}
            totalIGV={totalIGV}
            total={total}
            readOnly={readOnly}
            monedasOptions={monedas.map((m) => ({
              value: m.id,
              codigoSunat: m.codigoSunat,
            }))}
            monedaId={formData.monedaId}
            porcentajeIGV={formData.porcentajeIGV || 18}
            centrosCosto={centrosCosto}
          />
        </div>
      )}

      {/* FILA: Puertos (solo para exportación) */}
      {formData.esExportacion && (
        <>
          {/* Sección de Información Exportaciones */}
          <Panel
            header="Información Exportaciones"
            toggleable
            collapsed
            className="p-mt-3"
          >
            <div
              style={{
                marginTop: "1rem",
                alignItems: "end",
                display: "flex",
                gap: 3,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 0.5 }}>
                <label htmlFor="incotermsId">Incoterms *</label>
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
                  disabled={disabled || readOnly}
                  style={{ width: "100%", fontWeight: "bold" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="tipoContenedorId">Tipo Contenedor</label>
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
                  disabled={disabled || readOnly}
                  style={{ width: "100%", fontWeight: "bold" }}
                />
              </div>

              <div style={{ flex: 0.5 }}>
                <label htmlFor="cantidadContenedores">N° Contenedores</label>
                <InputNumber
                  id="cantidadContenedores"
                  value={formData.cantidadContenedores}
                  onValueChange={(e) =>
                    handleChange("cantidadContenedores", e.value)
                  }
                  min={1}
                  disabled={disabled || readOnly}
                  style={{ width: "100%" }}
                  inputStyle={{ fontWeight: "bold" }}
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <label htmlFor="pesoMaximoContenedor">Peso Máximo</label>
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
                  disabled={disabled || readOnly}
                  style={{ width: "100%" }}
                  inputStyle={{ fontWeight: "bold" }}
                />
              </div>
              <div style={{ flex: 2 }}>
                <label htmlFor="respEmbarqueId">Responsable de Embarque</label>
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
                  disabled={disabled || readOnly}
                  style={{ width: "100%", fontWeight: "bold" }}
                />
              </div>
            </div>
            <div
              style={{
                marginTop: "1rem",
                alignItems: "end",
                display: "flex",
                gap: 3,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="puertoCargaId">Puerto Origen</label>
                <Dropdown
                  id="puertoCargaId"
                  value={
                    formData.puertoCargaId
                      ? Number(formData.puertoCargaId)
                      : null
                  }
                  options={puertos.map((p) => ({
                    label: p.nombre,
                    value: Number(p.id),
                  }))}
                  onChange={(e) => handleChange("puertoCargaId", e.value)}
                  placeholder="Seleccionar puerto de carga"
                  filter
                  showClear
                  disabled={disabled || readOnly}
                  style={{ width: "100%", fontWeight: "bold" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="fechaZarpeEstimada">Fecha Zarpe Estimada</label>
                <Calendar
                  id="fechaZarpeEstimada"
                  value={formData.fechaZarpeEstimada}
                  onChange={(e) => handleChange("fechaZarpeEstimada", e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled={disabled || readOnly}
                  inputStyle={{
                    fontWeight: "bold",
                    textTransform: "uppercase",
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="puertoDescargaId">Puerto Destino</label>
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
                  disabled={disabled || readOnly}
                  style={{ width: "100%", fontWeight: "bold" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="fechaArriboEstimada">
                  Fecha Arribo Estimada
                </label>
                <Calendar
                  id="fechaArriboEstimada"
                  value={formData.fechaArriboEstimada}
                  onChange={(e) => handleChange("fechaArriboEstimada", e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled={disabled || readOnly}
                  inputStyle={{
                    fontWeight: "bold",
                    textTransform: "uppercase",
                  }}
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <label htmlFor="diasTransito">
                  N° Días Tránsito (Calculado)
                </label>
                <InputNumber
                  id="diasTransito"
                  value={formData.diasTransito}
                  onValueChange={(e) => handleChange("diasTransito", e.value)}
                  min={0}
                  disabled={true}
                  style={{ width: "100%" }}
                  inputStyle={{
                    fontWeight: "bold",
                    backgroundColor: "#f0f0f0",
                  }}
                />
              </div>
            </div>
            {/* SECCIÓN: LOGÍSTICA */}
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 3,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
                marginTop: "2rem",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="agenteAduanasId">Agente de Aduanas</label>
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
                  disabled={disabled || readOnly}
                  style={{ width: "100%", fontWeight: "bold" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="operadorLogisticoId">Operador Logístico</label>
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
                  disabled={disabled || readOnly}
                  style={{ width: "100%", fontWeight: "bold" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="navieraId">Naviera</label>
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
                  disabled={disabled || readOnly}
                  style={{ width: "100%", fontWeight: "bold" }}
                />
              </div>
            </div>
          </Panel>
        </>
      )}

      {/* Sección de Información Adicional */}
      <Panel
        header="Información Adicional"
        toggleable
        collapsed
        className="p-mt-3"
      >
        <div
          style={{
            marginTop: "1rem",
            alignItems: "end",
            display: "flex",
            gap: 3,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="respProduccionId">Responsable de Producción</label>
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
              disabled={disabled || readOnly}
              style={{ width: "100%", fontWeight: "bold" }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="respAlmacenId">Responsable de Almacén</label>
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
              disabled={disabled || readOnly}
              style={{ width: "100%", fontWeight: "bold" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="autorizaVentaId">Autoriza Venta *</label>
            <Dropdown
              id="autorizaVentaId"
              value={
                formData.autorizaVentaId
                  ? Number(formData.autorizaVentaId)
                  : null
              }
              options={responsablesAutorizaVenta.map((r) => ({
                label: `${r.nombres} ${r.apellidos}`,
                value: Number(r.id),
              }))}
              onChange={(e) => handleChange("autorizaVentaId", e.value)}
              placeholder="Auto-asignado desde Parámetro Aprobador"
              filter
              showClear
              disabled={disabled || readOnly}
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
                style={{ width: "100%", fontWeight: "bold" }}
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
            gap: 3,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginTop: "2rem",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="observaciones">Observaciones</label>
            <InputTextarea
              id="observaciones"
              value={formData.observaciones || ""}
              onChange={(e) => handleChange("observaciones", e.target.value)}
              rows={2}
              disabled={disabled || readOnly}
              style={{ fontWeight: "bold" }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="observacionesInternas">
              Observaciones Internas
            </label>
            <InputTextarea
              id="observacionesInternas"
              value={formData.observacionesInternas || ""}
              onChange={(e) =>
                handleChange("observacionesInternas", e.target.value)
              }
              rows={2}
              disabled={disabled || readOnly}
              style={{ fontWeight: "bold" }}
            />
          </div>
        </div>
      </Panel>
    </div>
  );
};

export default DatosGeneralesCotizacionCard;
