/**
 * DatosOperativosEntidad.jsx
 *
 * Componente Card para gestionar los datos operativos de una entidad comercial.
 * Incluye configuración de vendedores, agencias, controles de stock y fechas.
 * Sigue el patrón profesional ERP Megui con React Hook Form.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import { Controller } from "react-hook-form";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Card } from "primereact/card";
import { classNames } from "primereact/utils";
import { ButtonGroup } from "primereact/buttongroup";
import { ToggleButton } from "primereact/togglebutton";
import { Button } from "primereact/button";

/**
 * Componente DatosOperativosEntidad
 * @param {Object} props - Props del componente
 * @param {Object} props.control - Control de React Hook Form
 * @param {Object} props.errors - Errores de validación
 * @param {Array} props.vendedores - Lista de vendedores
 * @param {Array} props.agenciasEnvio - Lista de agencias de envío
 */
const DatosOperativosEntidad = ({
  control,
  errors,
  vendedores = [],
  agenciasEnvio = [],
  readOnly = false,
  loading = false,
}) => {
  /**
   * Obtiene la clase CSS para campos con errores
   * @param {string} fieldName - Nombre del campo
   * @returns {string} Clase CSS
   */
  const getFieldClass = (fieldName) => {
    return classNames({
      "p-invalid": errors[fieldName],
    });
  };

  /**
   * Obtiene mensaje de error de validación
   * @param {string} name - Nombre del campo
   * @returns {JSX.Element|null} Elemento de error o null
   */
  const getFormErrorMessage = (name) => {
    return errors[name] ? (
      <small className="p-error p-d-block">{errors[name].message}</small>
    ) : null;
  };

  // Preparar opciones para dropdowns
  const vendedoresOptions = vendedores.map((vendedor) => ({
    label:
      vendedor.nombreCompleto ||
      `${vendedor.nombres || ""} ${vendedor.apellidos || ""}`.trim() ||
      "Sin nombre",
    value: Number(vendedor.id),
  }));

  const agenciasEnvioOptions = agenciasEnvio.map((agencia) => ({
    label: agencia.razonSocial || agencia.nombreComercial || "Sin nombre",
    value: Number(agencia.id),
  }));

  return (
    <Card title="Datos Operativos y Configuración" className="mb-4">
      <div className="p-fluid formgrid grid">
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="vendedorId">Vendedor</label>
            <div
              style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}
            >
              <Controller
                name="vendedorId"
                control={control}
                render={({ field }) => (
                  <Button
                    type="button"
                    icon="pi pi-times"
                    className="p-button-outlined p-button-secondary"
                    tooltip="Quitar vendedor"
                    tooltipOptions={{ position: "top" }}
                    onClick={() => field.onChange(null)}
                    disabled={readOnly || loading}
                  />
                )}
              />
              <Controller
                name="vendedorId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="vendedorId"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={vendedoresOptions}
                    placeholder="Seleccione un vendedor"
                    className={getFieldClass("vendedorId")}
                    style={{ fontWeight: "bold", flex: 1 }}
                    showClear
                    disabled={readOnly || loading}
                  />
                )}
              />
            </div>
            {getFormErrorMessage("vendedorId")}
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="agenciaEnvioId">Agencia de Envío</label>
            <Controller
              name="agenciaEnvioId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="agenciaEnvioId"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={agenciasEnvioOptions}
                  placeholder="Seleccione agencia de envío"
                  className={getFieldClass("agenciaEnvioId")}
                  style={{ fontWeight: "bold" }}
                  showClear
                  disabled={readOnly || loading}
                />
              )}
            />
            {getFormErrorMessage("agenciaEnvioId")}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="observaciones">Observaciones</label>
            <Controller
              name="observaciones"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="observaciones"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder="Ingrese observaciones adicionales"
                  rows={3}
                  className={getFieldClass("observaciones")}
                  style={{ fontWeight: "bold" }}
                  maxLength={500}
                  disabled={readOnly || loading}
                />
              )}
            />
            {getFormErrorMessage("observaciones")}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 10,
            gap: 5,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <ButtonGroup>
            <Controller
              name="custodiaStock"
              control={control}
              render={({ field }) => (
                <ToggleButton
                  id="custodiaStock"
                  onLabel="CUSTODIA"
                  offLabel="CUSTODIA"
                  onIcon="pi pi-check"
                  offIcon="pi pi-times"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  className={`text-sm ${getFieldClass("custodiaStock")}`}
                  disabled={readOnly || loading}
                />
              )}
            />
            <Controller
              name="controlLote"
              control={control}
              render={({ field }) => (
                <ToggleButton
                  id="controlLote"
                  onLabel="LOTE"
                  offLabel="LOTE"
                  onIcon="pi pi-check"
                  offIcon="pi pi-times"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  className={`text-sm ${getFieldClass("controlLote")}`}
                  disabled={readOnly || loading}
                />
              )}
            />
            <Controller
              name="controlFechaVenc"
              control={control}
              render={({ field }) => (
                <ToggleButton
                  id="controlFechaVenc"
                  onLabel="VENCIMIENTO"
                  offLabel="VENCIMIENTO"
                  onIcon="pi pi-check"
                  offIcon="pi pi-times"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  className={`text-sm ${getFieldClass("controlFechaVenc")}`}
                  disabled={readOnly || loading}
                />
              )}
            />
            <Controller
              name="controlFechaProd"
              control={control}
              render={({ field }) => (
                <ToggleButton
                  id="controlFechaProd"
                  onLabel="PRODUCCION"
                  offLabel="PRODUCCION"
                  onIcon="pi pi-check"
                  offIcon="pi pi-times"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  className={`text-sm ${getFieldClass("controlFechaProd")}`}
                  disabled={readOnly || loading}
                />
              )}
            />
            <Controller
              name="controlFechaIngreso"
              control={control}
              render={({ field }) => (
                <ToggleButton
                  id="controlFechaIngreso"
                  onLabel="INGRESO"
                  offLabel="INGRESO"
                  onIcon="pi pi-check"
                  offIcon="pi pi-times"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  className={`text-sm ${getFieldClass("controlFechaIngreso")}`}
                  disabled={readOnly || loading}
                />
              )}
            />
            <Controller
              name="controlSerie"
              control={control}
              render={({ field }) => (
                <ToggleButton
                  id="controlSerie"
                  onLabel="SERIE"
                  offLabel="SERIE"
                  onIcon="pi pi-check"
                  offIcon="pi pi-times"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  className={`text-sm ${getFieldClass("controlSerie")}`}
                  disabled={readOnly || loading}
                />
              )}
            />
            <Controller
              name="controlEnvase"
              control={control}
              render={({ field }) => (
                <ToggleButton
                  id="controlEnvase"
                  onLabel="ENVASE"
                  offLabel="ENVASE"
                  onIcon="pi pi-check"
                  offIcon="pi pi-times"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  className={`text-sm ${getFieldClass("controlEnvase")}`}
                  disabled={readOnly || loading}
                />
              )}
            />
          </ButtonGroup>
          {/* Mostrar errores de validación */}
          <div className="flex flex-wrap gap-2 mt-2">
            {getFormErrorMessage("vendedorId")}
            {getFormErrorMessage("agenciaEnvioId")}
            {getFormErrorMessage("observaciones")}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DatosOperativosEntidad;
