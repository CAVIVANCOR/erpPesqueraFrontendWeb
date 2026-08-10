// src/components/contabilidad/asientoContable/AsientoCabecera.jsx
// src/components/contabilidad/asientoContable/AsientoCabecera.jsx
import React, { useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import BooleanToggleButton from "../../common/BooleanToggleButton";
import AuditoriaDialog from "../../common/AuditoriaDialog";
import { useAuthStore } from "../../../shared/stores/useAuthStore";
import OrigenAsientoViewer from "../../common/origenAsiento/OrigenAsientoViewer";

export default function AsientoCabecera({
  formData,
  handleChange,
  empresas,
  periodos,
  estados,
  monedas,
  tiposLibroSunat,
  empresaFija,
  periodoFijo,
  isReadOnly,
  onSubmit,
  onCancel,
  loading,
  guardando,
  asientoId,
  onAprobar,
  onAnular,
  onRecargar,
  personal,
  isEdit,
}) {
  const [showOrigenViewer, setShowOrigenViewer] = useState(false);

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
          <label htmlFor="tipoLibroId">Libro SUNAT</label>
          <Dropdown
            id="tipoLibroId"
            value={formData.tipoLibroId}
            options={tiposLibroSunat?.map((t) => ({
              label: `${t.codigoSunat} - ${t.descripcion}`,
              value: Number(t.id),
            })) || []}
            onChange={(e) => handleChange("tipoLibroId", e.value)}
            placeholder="Seleccione libro SUNAT"
            disabled={isReadOnly}
            filter
            showClear
          />
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="esGerencial">Tipo</label>
          <BooleanToggleButton
            labelTrue="GERENCIAL"
            labelFalse="FISCAL"
            value={formData.esGerencial || false}
            onChange={(value) => handleChange("esGerencial", value)}
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
        <div style={{ flex: 1 }}>
          <label htmlFor="esSaldoInicial">¿Es Saldo Inicial?</label>
          <BooleanToggleButton
            labelTrue="Saldo Inicial"
            labelFalse="Asiento Normal"
            value={formData.esSaldoInicial || false}
            onChange={(value) => handleChange("esSaldoInicial", value)}
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
          alignItems: "end",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        {/* ⭐ SECCIÓN DE AUDITORÍA (solo en edición) */}
        {isEdit && asientoId && (
          <div style={{ marginTop: "1rem" }}>
            <AuditoriaDialog
              data={formData}
              fieldMapping={{
                fechaCreacion: "creadoEn",
                creadoPor: "creadoPor",
                fechaActualizacion: "actualizadoEn",
                actualizadoPor: "actualizadoPor",
              }}
              usuarios={personal?.map((p) => ({
                label: `${p.nombres || ""} ${p.apellidos || ""}`.trim(),
                value: Number(p.id),
                urlFotoPersona: p.urlFotoPersona,
              })) || []}
              esSuperUsuario={useAuthStore.getState().usuario?.rol === "SUPERUSUARIO"}
              onSave={(datosCorregidos) => {
                handleChange("creadoPor", datosCorregidos.creadoPor);
                handleChange("actualizadoPor", datosCorregidos.actualizadoPor);
                handleChange("creadoEn", datosCorregidos.fechaCreacion);
                handleChange("actualizadoEn", datosCorregidos.fechaActualizacion);
              }}
              buttonProps={{
                label: useAuthStore.getState().usuario?.rol === "SUPERUSUARIO" ? "Auditoría" : "Ver Auditoría",
                className: "p-button-info",
                icon: "pi pi-history",
                size: "small",
              }}
            />
          </div>
        )}

        {/* Botón Ver Origen: Solo si tiene submoduloOrigen y procesoOrigenId */}
        {isEdit && formData.submoduloOrigen?.nombreModeloOrigen && formData.procesoOrigenId && (
          <div style={{ flex: 1 }}>
            <Button
              label="Ver Origen"
              icon="pi pi-eye"
              severity="info"
              size="small"
              raised
              type="button"
              onClick={() => setShowOrigenViewer(true)}
              tooltip={`Ver ${formData.submoduloOrigen?.nombreModeloOrigen}`}
              tooltipOptions={{ position: 'top' }}
            />
          </div>
        )}

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
        {/* Botón Aprobar: Solo si es PENDIENTE, está cuadrado y hay función */}
        {onAprobar && asientoId && formData.estadoId === 76 && formData.estaCuadrado && !isReadOnly && (
          <div style={{ flex: 1 }}>
            <Button
              label="Aprobar Asiento"
              icon="pi pi-check-circle"
              severity="success"
              size="small"
              raised
              type="button"
              disabled={loading || guardando}
              loading={loading || guardando}
              onClick={() => {
                onAprobar({ id: asientoId, ...formData });
              }}
            />
          </div>
        )}
        {/* Botón Anular: Solo si es APROBADO y hay función */}
        {onAnular && asientoId && formData.estadoId === 77 && !isReadOnly && (
          <div style={{ flex: 1 }}>
            <Button
              label="Anular Asiento"
              icon="pi pi-ban"
              severity="danger"
              size="small"
              raised
              type="button"
              disabled={loading || guardando}
              loading={loading || guardando}
              onClick={() => {
                onAnular({ id: asientoId, ...formData });
              }}
            />
          </div>
        )}
      </div>

      {/* Viewer de Origen del Asiento */}
      <OrigenAsientoViewer
        nombreModeloOrigen={formData.submoduloOrigen?.nombreModeloOrigen}
        procesoOrigenId={formData.procesoOrigenId}
        visible={showOrigenViewer}
        onHide={() => setShowOrigenViewer(false)}
      />
    </form>
  );
}