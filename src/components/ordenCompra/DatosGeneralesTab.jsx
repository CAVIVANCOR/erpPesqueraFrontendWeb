// src/components/ordenCompra/DatosGeneralesTab.jsx
import React from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";

export default function DatosGeneralesTab({
  formData,
  onChange,
  empresas,
  proveedores,
  formasPago,
  personalOptions,
  requerimientos,
  isEdit,
  puedeEditar,
  onGenerarDesdeRequerimiento,
}) {
  return (
    <div className="grid">
      {/* GENERAR DESDE REQUERIMIENTO */}
      {!isEdit && (
        <div className="col-12">
          <div className="p-3 bg-blue-50 border-round">
            <div className="flex align-items-center gap-3">
              <i className="pi pi-info-circle text-blue-500 text-2xl"></i>
              <div className="flex-1">
                <p className="m-0 font-bold">¿Generar desde Requerimiento?</p>
                <p className="m-0 text-sm">
                  Puedes crear esta orden automáticamente desde un requerimiento aprobado
                </p>
              </div>
              <Dropdown
                value={null}
                options={requerimientos.map((r) => ({
                  label: `${r.numeroDocumento} - ${r.proveedor?.razonSocial || "Sin proveedor"}`,
                  value: Number(r.id),
                }))}
                onChange={(e) => onGenerarDesdeRequerimiento(e.value)}
                placeholder="Seleccionar requerimiento"
                filter
                style={{ minWidth: "300px" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* EMPRESA */}
      <div className="col-12 md:col-4">
        <label htmlFor="empresaId">Empresa*</label>
        <Dropdown
          id="empresaId"
          value={formData.empresaId}
          options={empresas.map((e) => ({
            label: e.razonSocial,
            value: Number(e.id),
          }))}
          onChange={(e) => onChange("empresaId", e.value)}
          placeholder="Seleccionar empresa"
          disabled={isEdit || !puedeEditar}
        />
      </div>

      {/* PROVEEDOR */}
      <div className="col-12 md:col-4">
        <label htmlFor="proveedorId">Proveedor*</label>
        <Dropdown
          id="proveedorId"
          value={formData.proveedorId}
          options={proveedores.map((p) => ({
            label: p.razonSocial,
            value: Number(p.id),
          }))}
          onChange={(e) => onChange("proveedorId", e.value)}
          placeholder="Seleccionar proveedor"
          filter
          disabled={!puedeEditar}
        />
      </div>

      {/* FORMA DE PAGO */}
      <div className="col-12 md:col-4">
        <label htmlFor="formaPagoId">Forma de Pago</label>
        <Dropdown
          id="formaPagoId"
          value={formData.formaPagoId}
          options={formasPago.map((f) => ({
            label: f.nombre,
            value: Number(f.id),
          }))}
          onChange={(e) => onChange("formaPagoId", e.value)}
          placeholder="Seleccionar forma de pago"
          disabled={!puedeEditar}
          showClear
        />
      </div>

      {/* NÚMERO DOCUMENTO */}
      <div className="col-12 md:col-4">
        <label htmlFor="numeroDocumento">Número de Documento</label>
        <InputText
          id="numeroDocumento"
          value={formData.numeroDocumento || ""}
          disabled
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            backgroundColor: "#f0f0f0",
          }}
        />
      </div>

      {/* NÚMERO SERIE DOC */}
      {isEdit && formData.numSerieDoc && (
        <div className="col-12 md:col-4">
          <label htmlFor="numSerieDoc">Número Serie</label>
          <InputText
            id="numSerieDoc"
            value={formData.numSerieDoc}
            disabled
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              backgroundColor: "#f0f0f0",
            }}
          />
        </div>
      )}

      {/* NÚMERO CORRELATIVO */}
      {isEdit && formData.numCorreDoc && (
        <div className="col-12 md:col-4">
          <label htmlFor="numCorreDoc">Número Correlativo</label>
          <InputText
            id="numCorreDoc"
            value={formData.numCorreDoc}
            disabled
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              backgroundColor: "#f0f0f0",
            }}
          />
        </div>
      )}

      {/* FECHA DOCUMENTO */}
      <div className="col-12 md:col-4">
        <label htmlFor="fechaDocumento">Fecha Documento*</label>
        <Calendar
          id="fechaDocumento"
          value={formData.fechaDocumento}
          onChange={(e) => onChange("fechaDocumento", e.value)}
          dateFormat="dd/mm/yy"
          showIcon
          disabled={!puedeEditar}
        />
      </div>

      {/* FECHA ENTREGA */}
      <div className="col-12 md:col-4">
        <label htmlFor="fechaEntrega">Fecha Entrega</label>
        <Calendar
          id="fechaEntrega"
          value={formData.fechaEntrega}
          onChange={(e) => onChange("fechaEntrega", e.value)}
          dateFormat="dd/mm/yy"
          showIcon
          disabled={!puedeEditar}
        />
      </div>

      {/* SOLICITANTE */}
      <div className="col-12 md:col-4">
        <label htmlFor="solicitanteId">Solicitante</label>
        <Dropdown
          id="solicitanteId"
          value={formData.solicitanteId}
          options={personalOptions.map((p) => ({
            label: p.nombreCompleto,
            value: Number(p.id),
          }))}
          onChange={(e) => onChange("solicitanteId", e.value)}
          placeholder="Seleccionar solicitante"
          filter
          disabled={!puedeEditar}
          showClear
        />
      </div>

      {/* REQUERIMIENTO ASOCIADO (Solo lectura si existe) */}
      {formData.requerimientoCompraId && (
        <div className="col-12">
          <div className="p-3 bg-green-50 border-round">
            <div className="flex align-items-center gap-2">
              <i className="pi pi-link text-green-600"></i>
              <span className="font-bold">
                Generada desde Requerimiento ID: {formData.requerimientoCompraId}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* OBSERVACIONES */}
      <div className="col-12">
        <label htmlFor="observaciones">Observaciones</label>
        <InputTextarea
          id="observaciones"
          value={formData.observaciones}
          onChange={(e) => onChange("observaciones", e.target.value)}
          rows={3}
          disabled={!puedeEditar}
        />
      </div>
    </div>
  );
}