// src/components/contratoServicio/DatosGeneralesContratoCard.jsx
/**
 * Card de Datos Generales para Contrato de Servicio
 * Patrón profesional ERP Megui
 */

import React, { useEffect, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { InputText } from "primereact/inputtext";
import { Panel } from "primereact/panel";
import { Checkbox } from "primereact/checkbox";
import DetServicioContratoCard from "./DetServicioContratoCard";

const DatosGeneralesContratoCard = ({
  formData,
  handleChange,
  handleSerieDocChange,
  empresas = [],
  sedes = [],
  activos = [],
  almacenes = [],
  clientes = [],
  contactos = [],
  personalOptions = [],
  tiposDocumento = [],
  seriesDoc = [],
  seriesDocOptions = [],
  monedas = [],
  estadosContrato = [],
  centrosAlmacen = [],
  isEdit = false,
  // Props para DetServicioContratoCard
  detalles = [],
  setDetalles,
  productos = [],
  contratoId,
  toast,
  onCountChange,
  subtotal = 0,
  total = 0,
}) => {
  // Filtrar sedes por empresa
  const sedesFiltradas = sedes.filter(
    (s) => Number(s.empresaId) === Number(formData.empresaId)
  );

  // Filtrar activos por empresa
  const activosFiltrados = activos.filter(
    (a) => Number(a.empresaId) === Number(formData.empresaId)
  );

  // Filtrar almacenes por empresa usando CentrosAlmacen
  // NOTA: Almacen tiene centroAlmacenId, no al revés
  let almacenesFiltrados = [];
  if (formData.empresaId && centrosAlmacen.length > 0) {
    // 1. Obtener los centros de la empresa seleccionada
    const centrosEmpresa = centrosAlmacen.filter(
      (ca) => Number(ca.empresaId) === Number(formData.empresaId)
    );
    
    // 2. Obtener los IDs de los centros de la empresa
    const centrosIdsPermitidos = centrosEmpresa.map((ca) => Number(ca.id));
    
    // 3. Filtrar almacenes cuyo centroAlmacenId esté en la lista de centros permitidos
    //    Y que sean almacenes propios de sede (esAlmacenPropioSede = true)
    //    Y que tipoAlmacenamientoId sea <= 2
    almacenesFiltrados = almacenes.filter(
      (a) => centrosIdsPermitidos.includes(Number(a.centroAlmacenId)) && 
             a.esAlmacenPropioSede === true &&
             Number(a.tipoAlmacenamientoId) <= 2
    );
  }

  // Filtrar clientes por empresa y tipoEntidadId = 15 (Clientes Servicios)
  const clientesFiltrados = formData.empresaId
    ? clientes.filter(
        (c) => Number(c.empresaId) === Number(formData.empresaId) && Number(c.tipoEntidadId) === 15
      )
    : [];

  // Filtrar tipos de documento para mostrar solo ID = 20 (Contratos de Servicios)
  const tiposDocumentoFiltrados = tiposDocumento.filter(
    (td) => Number(td.id) === 20
  );

  // Filtrar contactos por cliente
  const contactosFiltrados = contactos.filter(
    (c) => Number(c.entidadComercialId) === Number(formData.clienteId)
  );

  // Limpiar campos dependientes cuando cambie la empresa (solo en modo creación)
  useEffect(() => {
    if (!isEdit && formData.empresaId) {
      // Verificar si la sede actual pertenece a la empresa seleccionada
      if (formData.sedeId && sedesFiltradas.length > 0) {
        const sedeValida = sedesFiltradas.some((s) => Number(s.id) === Number(formData.sedeId));
        if (!sedeValida) {
          handleChange("sedeId", null);
        }
      }
      
      // Verificar si el activo actual pertenece a la empresa seleccionada
      if (formData.activoId && activosFiltrados.length > 0) {
        const activoValido = activosFiltrados.some((a) => Number(a.id) === Number(formData.activoId));
        if (!activoValido) {
          handleChange("activoId", null);
        }
      }
      
      // Verificar si el almacén actual pertenece a la empresa seleccionada
      if (formData.almacenId && almacenesFiltrados.length > 0) {
        const almacenValido = almacenesFiltrados.some((a) => Number(a.id) === Number(formData.almacenId));
        if (!almacenValido) {
          handleChange("almacenId", null);
        }
      }
      
      // Verificar si el cliente actual pertenece a la empresa seleccionada
      if (formData.clienteId && clientesFiltrados.length > 0) {
        const clienteValido = clientesFiltrados.some((c) => Number(c.id) === Number(formData.clienteId));
        if (!clienteValido) {
          handleChange("clienteId", null);
          handleChange("contactoClienteId", null);
        }
      }
    }
  }, [formData.empresaId, isEdit]);

  if (empresas.length === 0) {
    return (
      <div className="card">
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
    <div className="card">
      <Panel header="Información del Contrato" toggleable>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          {/* Empresa */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Empresa <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              value={formData.empresaId}
              options={empresas.map(e => ({ ...e, id: Number(e.id) }))}
              onChange={(e) => handleChange("empresaId", e.value)}
              optionLabel="razonSocial"
              optionValue="id"
              placeholder="Seleccionar"
              filter
              showClear
              style={{ width: "100%" }}
              disabled={isEdit}
            />
          </div>

          {/* Sede */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Sede
            </label>
            <Dropdown
              value={formData.sedeId}
              options={sedesFiltradas.map(s => ({ ...s, id: Number(s.id) }))}
              onChange={(e) => handleChange("sedeId", e.value)}
              optionLabel="nombre"
              optionValue="id"
              placeholder="Seleccionar"
              filter
              showClear
              style={{ width: "100%" }}
              disabled={!formData.empresaId}
            />
          </div>

          {/* Activo */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Activo
            </label>
            <Dropdown
              value={formData.activoId}
              options={activosFiltrados.map(a => ({ ...a, id: Number(a.id) }))}
              onChange={(e) => handleChange("activoId", e.value)}
              optionLabel="nombre"
              optionValue="id"
              placeholder="Seleccionar"
              filter
              showClear
              style={{ width: "100%" }}
              disabled={!formData.empresaId}
            />
          </div>

          {/* Almacén */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Almacén
            </label>
            <Dropdown
              value={formData.almacenId}
              options={almacenesFiltrados.map(a => ({ ...a, id: Number(a.id) }))}
              onChange={(e) => handleChange("almacenId", e.value)}
              optionLabel="nombre"
              optionValue="id"
              placeholder="Seleccionar"
              filter
              showClear
              style={{ width: "100%" }}
              disabled={!formData.empresaId}
            />
          </div>

          {/* Cliente */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Cliente <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              value={formData.clienteId}
              options={clientesFiltrados.map(c => ({ ...c, id: Number(c.id) }))}
              onChange={(e) => handleChange("clienteId", e.value)}
              optionLabel="razonSocial"
              optionValue="id"
              placeholder="Seleccionar"
              filter
              showClear
              style={{ width: "100%" }}
              disabled={!formData.empresaId}
            />
          </div>

          {/* Contacto Cliente */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Contacto Cliente
            </label>
            <Dropdown
              value={formData.contactoClienteId}
              options={contactosFiltrados}
              onChange={(e) => handleChange("contactoClienteId", e.value)}
              optionLabel="nombreCompleto"
              optionValue="id"
              placeholder="Seleccionar"
              filter
              showClear
              style={{ width: "100%" }}
              disabled={!formData.clienteId}
            />
          </div>

          {/* Responsable */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Responsable <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              value={formData.responsableId ? Number(formData.responsableId) : null}
              options={personalOptions.map((p) => ({
                label: `${p.nombres} ${p.apellidos}`,
                value: Number(p.id),
              }))}
              onChange={(e) => handleChange("responsableId", e.value)}
              placeholder="Auto-asignado desde Usuario Logueado"
              filter
              showClear
              style={{ width: "100%" }}
            />
          </div>

          {/* Aprobador */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Aprobador <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              value={formData.aprobadorId ? Number(formData.aprobadorId) : null}
              options={personalOptions.map((p) => ({
                label: `${p.nombres} ${p.apellidos}`,
                value: Number(p.id),
              }))}
              onChange={(e) => handleChange("aprobadorId", e.value)}
              placeholder="Auto-asignado desde Parámetro Aprobador"
              filter
              showClear
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </Panel>

      <Panel header="Numeración del Documento" toggleable collapsed style={{ marginTop: "1rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          {/* Tipo Documento */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Tipo Documento
            </label>
            <Dropdown
              value={formData.tipoDocumentoId}
              options={tiposDocumentoFiltrados.map(t => ({
                label: t.descripcion || t.nombre,
                value: Number(t.id)
              }))}
              onChange={(e) => handleChange("tipoDocumentoId", e.value)}
              placeholder="Tipo documento"
              disabled={true}
              style={{ 
                width: "100%",
                fontWeight: "bold",
                textTransform: "uppercase"
              }}
            />
          </div>

          {/* Serie */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Serie de Dcmto <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              value={formData.serieDocId}
              options={seriesDocOptions}
              onChange={(e) => handleSerieDocChange(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar serie"
              disabled={!formData.empresaId || !!formData.serieDocId}
              style={{ width: "100%" }}
            />
          </div>

          {/* Número Completo */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Número Completo
            </label>
            <InputText
              value={formData.numeroCompleto}
              readOnly
              style={{
                width: "100%",
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            />
          </div>
        </div>
      </Panel>

      <Panel header="Fechas y Vigencia" toggleable style={{ marginTop: "1rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          {/* Fecha Celebración */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Fecha Celebración
            </label>
            <Calendar
              value={formData.fechaCelebracion}
              onChange={(e) => handleChange("fechaCelebracion", e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              style={{ width: "100%" }}
            />
          </div>

          {/* Fecha Inicio */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Fecha Inicio Contrato
            </label>
            <Calendar
              value={formData.fechaInicioContrato}
              onChange={(e) => handleChange("fechaInicioContrato", e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              style={{ width: "100%" }}
            />
          </div>

          {/* Fecha Fin */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Fecha Fin Contrato
            </label>
            <Calendar
              value={formData.fechaFinContrato}
              onChange={(e) => handleChange("fechaFinContrato", e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </Panel>

      <Panel header="Información Comercial" toggleable style={{ marginTop: "1rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          {/* Moneda */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Moneda
            </label>
            <Dropdown
              value={formData.monedaId}
              options={monedas}
              onChange={(e) => handleChange("monedaId", e.value)}
              optionLabel="simbolo"
              optionValue="id"
              placeholder="Seleccionar"
              showClear
              style={{ width: "100%" }}
            />
          </div>

          {/* Tipo Cambio */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Tipo Cambio
            </label>
            <InputNumber
              value={formData.tipoCambio}
              onValueChange={(e) => handleChange("tipoCambio", e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={4}
              style={{ width: "100%" }}
            />
          </div>

          {/* Estado */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Estado
            </label>
            <Dropdown
              value={formData.estadoContratoId ? Number(formData.estadoContratoId) : null}
              options={estadosContrato.map((e) => ({
                label: e.descripcion,
                value: Number(e.id),
              }))}
              onChange={(e) => handleChange("estadoContratoId", e.value)}
              placeholder="Seleccionar estado"
              showClear
              style={{ width: "100%" }}
            />
          </div>

        </div>
      </Panel>

      <Panel header="Configuración de Luz" toggleable collapsed style={{ marginTop: "1rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          {/* Incluye Luz */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Incluye Luz
            </label>
            <Checkbox
              checked={formData.incluyeLuz || false}
              onChange={(e) => handleChange("incluyeLuz", e.checked)}
            />
          </div>

          {/* Porcentaje Recargo Luz */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Porcentaje Recargo Luz (%)
            </label>
            <InputNumber
              value={formData.porcentajeRecargoLuz}
              onValueChange={(e) => handleChange("porcentajeRecargoLuz", e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
              max={100}
              style={{ width: "100%" }}
              disabled={!formData.incluyeLuz}
            />
          </div>

          {/* Costo por Kilovatio */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Costo por Kilovatio
            </label>
            <InputNumber
              value={formData.costoPorKilovatio}
              onValueChange={(e) => handleChange("costoPorKilovatio", e.value)}
              mode="decimal"
              minFractionDigits={4}
              maxFractionDigits={4}
              style={{ width: "100%" }}
              disabled={!formData.incluyeLuz}
            />
          </div>
        </div>
      </Panel>

      <Panel header="Contenido del Contrato" toggleable collapsed style={{ marginTop: "1rem" }}>
        <div style={{ display: "grid", gap: "1rem" }}>
          {/* Texto Esencia Contrato */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Texto Esencia del Contrato <span style={{ color: "red" }}>*</span>
            </label>
            <InputTextarea
              value={formData.textoEsenciaContrato}
              onChange={(e) => handleChange("textoEsenciaContrato", e.target.value)}
              rows={5}
              style={{
                width: "100%",
                textTransform: "uppercase",
                fontWeight: "bold",
              }}
              placeholder="Ingrese el texto esencial del contrato..."
            />
          </div>
        </div>
      </Panel>

      {/* SECCIÓN: DETALLES DE SERVICIOS */}
      {isEdit && contratoId && (
        <div style={{ marginTop: "0.5rem" }}>
          <DetServicioContratoCard
            contratoId={contratoId}
            detalles={detalles}
            setDetalles={setDetalles}
            productos={productos}
            moneda={monedas.find(m => Number(m.id) === Number(formData.monedaId))}
            toast={toast}
            isEdit={isEdit}
            onCountChange={onCountChange}
            subtotal={subtotal}
            total={total}
          />
        </div>
      )}
    </div>
  );
};

export default DatosGeneralesContratoCard;
