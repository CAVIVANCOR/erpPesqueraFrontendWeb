// src/components/contabilidad/asientoContable/AsientoCabecera.jsx
import React from "react";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";

export default function AsientoCabecera({
  formData,
  handleChange,
  empresas,
  periodos,
  estados,
  monedas,
  empresaFija,
  periodoFijo,
  isReadOnly,
  onSubmit,
  onCancel,
  loading,
  guardando,
  asientoId,
}) {
  return (
    <form onSubmit={onSubmit} className="p-fluid">
      {/* PRIMERA FILA: Empresa, Período, Fecha, Número, Tipo Libro, Moneda, TC */}
      <div
        style={{
          display: "flex",
          gap: 5,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="empresaId" style={{ fontWeight: "bold" }}>
            Empresa <span style={{ color: "red" }}>*</span>
          </label>
          <Dropdown
            id="empresaId"
            value={formData.empresaId}
            options={empresas.map((e) => ({
              label: e.razonSocial,
              value: Number(e.id),
            }))}
            onChange={(e) => handleChange("empresaId", e.value)}
            placeholder="Seleccione empresa"
            disabled={!!empresaFija || isReadOnly}
            filter
            required
          />
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="periodoContableId" style={{ fontWeight: "bold" }}>
            Período Contable <span style={{ color: "red" }}>*</span>
          </label>
          <Dropdown
            id="periodoContableId"
            value={formData.periodoContableId}
            options={periodos.map((p) => ({
              label: p.nombrePeriodo,
              value: Number(p.id),
            }))}
            onChange={(e) => handleChange("periodoContableId", e.value)}
            placeholder="Seleccione período"
            disabled={!!periodoFijo || isReadOnly}
            filter
            required
          />
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="fechaAsiento" style={{ fontWeight: "bold" }}>
            Fecha Asiento <span style={{ color: "red" }}>*</span>
          </label>
          <Calendar
            id="fechaAsiento"
            value={formData.fechaAsiento}
            onChange={(e) => handleChange("fechaAsiento", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            disabled={isReadOnly}
            required
          />
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="numeroAsiento">Número Asiento</label>
          <InputText
            id="numeroAsiento"
            value={formData.numeroAsiento}
            disabled
          />
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="tipoLibro">Tipo Libro</label>
          <Dropdown
            id="tipoLibro"
            value={formData.tipoLibro}
            options={[
              { label: "FISCAL", value: "FISCAL" },
              { label: "GERENCIAL", value: "GERENCIAL" },
            ]}
            onChange={(e) => handleChange("tipoLibro", e.value)}
            disabled={isReadOnly}
          />
        </div>

        <div style={{ flex: 0.5 }}>
          <label htmlFor="monedaId">Moneda</label>
          <Dropdown
            id="monedaId"
            value={formData.monedaId}
            onChange={(e) => handleChange("monedaId", e.value)}
            options={monedas.map((m) => ({
              label: m.descripcion || m.codigoSunat,
              value: Number(m.id),
            }))}
            disabled={isReadOnly}
          />
        </div>

        <div style={{ flex: 0.5 }}>
          <label htmlFor="tipoCambio">Tipo Cambio</label>
          <InputNumber
            id="tipoCambio"
            value={formData.tipoCambio}
            onValueChange={(e) => handleChange("tipoCambio", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={4}
            disabled={isReadOnly}
          />
        </div>
      </div>

      {/* SEGUNDA FILA: Glosa */}
      <div
        style={{
          display: "flex",
          gap: 5,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="glosa" style={{ fontWeight: "bold" }}>
            Glosa <span style={{ color: "red" }}>*</span>
          </label>
          <InputTextarea
            id="glosa"
            value={formData.glosa}
            onChange={(e) => handleChange("glosa", e.target.value)}
            rows={2}
            disabled={isReadOnly}
            required
          />
        </div>
      </div>

      {/* TERCERA FILA: Totales y Estado */}
      <div
        style={{
          display: "flex",
          gap: 5,
          marginBottom: "1rem",
          alignItems: "end",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="estadoId">Estado</label>
          <Dropdown
            id="estadoId"
            value={formData.estadoId}
            options={estados.map((e) => ({
              label: e.descripcion,
              value: Number(e.id),
            }))}
            disabled
          />
        </div>

        <div style={{ flex: 1 }}>
          <Button
            label={formData.estaCuadrado ? "CUADRADO" : "DESCUADRADO"}
            icon={
              formData.estaCuadrado
                ? "pi pi-check-circle"
                : "pi pi-times-circle"
            }
            className={
              formData.estaCuadrado ? "p-button-success" : "p-button-danger"
            }
            severity={formData.estaCuadrado ? "success" : "danger"}
            style={{
              width: "100%",
              marginTop: "1.5rem",
              fontWeight: "bold",
            }}
            disabled
            type="button"
          />
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: "bold" }}>Total Debe</label>
          <InputNumber
            value={formData.totalDebe}
            mode="decimal"
            minFractionDigits={2}
            disabled
            inputStyle={{ fontWeight: "bold" }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: "bold" }}>Total Haber</label>
          <InputNumber
            value={formData.totalHaber}
            mode="decimal"
            minFractionDigits={2}
            disabled
            inputStyle={{ fontWeight: "bold" }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: "bold" }}>Diferencia</label>
          <InputNumber
            value={formData.diferencia}
            mode="decimal"
            minFractionDigits={2}
            disabled
            inputStyle={{
              fontWeight: "bold",
              color: formData.estaCuadrado ? "#22c55e" : "#ef4444",
              backgroundColor: formData.estaCuadrado ? "#f0fdf4" : "#fef2f2",
            }}
          />
        </div>
      </div>

      {/* CUARTA FILA: Botones */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <Button
            label="Cancelar"
            icon="pi pi-times"
            severity="warning"
            size="small"
            raised
            onClick={onCancel}
            type="button"
            disabled={loading || guardando}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Button
            label={asientoId ? "Actualizar" : "Guardar"}
            icon="pi pi-check"
            type="submit"
            loading={loading || guardando}
            disabled={isReadOnly || loading || guardando}
            className="p-button-success"
            severity="success"
            raised
            size="small"
          />
        </div>
      </div>
    </form>
  );
}