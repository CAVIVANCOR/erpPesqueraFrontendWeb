/**
 * DimensionesProductoForm.jsx
 *
 * Componente Card para gestionar las dimensiones físicas de un producto.
 * Incluye campos de medidas con sus respectivas unidades métricas.
 * Sigue el patrón profesional ERP Megui con React Hook Form.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useEffect } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { Controller } from "react-hook-form";

/**
 * Componente DimensionesProductoForm
 * @param {Object} props - Props del componente
 * @param {Object} props.control - Control de React Hook Form
 * @param {Object} props.errors - Errores de validación
 * @param {Array} props.unidadesMetricas - Lista de unidades métricas
 * @param {Function} props.onDimensionesChange - Callback para notificar cambios
 * @param {Object} props.unidadMetricaDefault - Unidad métrica por defecto
 * @param {Function} props.watch - Función para observar cambios en campos
 * @param {Function} props.setValue - Función para establecer valores en campos
 * @param {Array} props.tiposMaterial - Lista de tipos de material
 * @param {Array} props.colores - Lista de colores
 * @param {Array} props.marcas - Lista de marcas
 * @param {Object} props.tipoMaterialDefault - Tipo de material por defecto
 * @param {Object} props.colorDefault - Color por defecto
 * @param {Object} props.marcaDefault - Marca por defecto
 * @param {Boolean} props.modoEdicion - Indica si está en modo edición
 */
export default function DimensionesProductoForm({
  control,
  errors,
  setValue,
  watch,
  getValues,
  unidadesMetricas = [],
  tiposMaterial = [],
  colores = [],
  marcas = [],
  tipoMaterialDefault,
  colorDefault,
  marcaDefault,
  unidadMetricaDefault,
  modoEdicion,
  readOnly = false,
}) {
  // Opciones para medidas físicas específicas (solo unidades métricas)
  const unidadesMetricasOptions = unidadesMetricas.map((u) => ({
    label: `${u.nombre} (${u.simbolo})`,
    value: Number(u.id),
  }));

  // Opciones para tipos de material
  const tiposMaterialOptions = tiposMaterial.map((t) => ({
    label: t.nombre,
    value: Number(t.id),
  }));

  // Opciones para colores
  const coloresOptions = colores.map((c) => ({
    label: c.nombre,
    value: Number(c.id),
  }));

  // Opciones para marcas
  const marcasOptions = marcas.map((m) => ({
    label: m.nombre,
    value: Number(m.id),
  }));

  // Establecer valores por defecto para unidades de dimensiones cuando se carga unidadMetricaDefault
  useEffect(() => {
    if (!modoEdicion && unidadMetricaDefault?.id) {
      const defaultId = Number(unidadMetricaDefault.id);
      // Solo establecer si los campos están vacíos (null)
      if (!watch("unidadDiametroId")) setValue("unidadDiametroId", defaultId);
      if (!watch("unidadAnchoId")) setValue("unidadAnchoId", defaultId);
      if (!watch("unidadAltoId")) setValue("unidadAltoId", defaultId);
      if (!watch("unidadLargoId")) setValue("unidadLargoId", defaultId);
      if (!watch("unidadEspesorId")) setValue("unidadEspesorId", defaultId);
      if (!watch("unidadAnguloId")) setValue("unidadAnguloId", defaultId);
    }
  }, [unidadMetricaDefault, modoEdicion, setValue, watch]);

  // Establecer valor por defecto para Tipo de Material
  useEffect(() => {
    if (!modoEdicion && tipoMaterialDefault?.id) {
      const defaultId = Number(tipoMaterialDefault.id);
      if (!watch("tipoMaterialId")) {
        setValue("tipoMaterialId", defaultId);
      }
    }
  }, [tipoMaterialDefault, modoEdicion, setValue, watch]);

  // Establecer valor por defecto para Color
  useEffect(() => {
    if (!modoEdicion && colorDefault?.id) {
      const defaultId = Number(colorDefault.id);
      if (!watch("colorId")) {
        setValue("colorId", defaultId);
      }
    }
  }, [colorDefault, modoEdicion, setValue, watch]);

  // Establecer valor por defecto para Marca
  useEffect(() => {
    if (!modoEdicion && marcaDefault?.id) {
      const defaultId = Number(marcaDefault.id);
      if (!watch("marcaId")) {
        setValue("marcaId", defaultId);
      }
    }
  }, [marcaDefault, modoEdicion, setValue, watch]);

  return (
    <Card title="Dimensiones" className="mt-3">
      <div className="p-fluid formgrid grid">
        {/* Tipo Material, Color y Marca con checkboxes aplicaXXX */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="tipoMaterialId" className="font-bold">
              Tipo de Material *
            </label>
            <Controller
              name="aplicaTipoMaterial"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="aplicaTipoMaterial"
                  {...field}
                  checked={field.value}
                  disabled={readOnly}
                />
              )}
            />
            <Controller
              name="tipoMaterialId"
              control={control}
              render={({ field, fieldState }) => (
                <Dropdown
                  id="tipoMaterialId"
                  {...field}
                  options={tiposMaterialOptions}
                  placeholder="Seleccione tipo de material"
                  style={{ fontWeight: "bold" }}
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  showClear
                  filter
                  disabled={readOnly}
                />
              )}
            />
            {errors.tipoMaterialId && (
              <small className="p-error">
                {errors.tipoMaterialId.message}
              </small>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="colorId" className="font-bold">
              Color *
            </label>
            <Controller
              name="aplicaColor"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="aplicaColor"
                  {...field}
                  checked={field.value}
                  disabled={readOnly}
                />
              )}
            />
            <Controller
              name="colorId"
              control={control}
              render={({ field, fieldState }) => (
                <Dropdown
                  id="colorId"
                  {...field}
                  options={coloresOptions}
                  placeholder="Seleccione color"
                  style={{ fontWeight: "bold" }}
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  showClear
                  filter
                  disabled={readOnly}
                />
              )}
            />
            {errors.colorId && (
              <small className="p-error">{errors.colorId.message}</small>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="marcaId" className="font-bold">
              Marca *
            </label>
            <Controller
              name="aplicaMarca"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="aplicaMarca"
                  {...field}
                  checked={field.value}
                  disabled={readOnly}
                />
              )}
            />
            <Controller
              name="marcaId"
              control={control}
              render={({ field, fieldState }) => (
                <Dropdown
                  id="marcaId"
                  {...field}
                  options={marcasOptions}
                  placeholder="Seleccione marca"
                  style={{ fontWeight: "bold" }}
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  showClear
                  filter
                  disabled={readOnly}
                />
              )}
            />
            {errors.marcaId && (
              <small className="p-error">{errors.marcaId.message}</small>
            )}
          </div>
        </div>

        {/* Dimensiones físicas */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="medidaDiametro" className="font-bold">
              Diámetro
            </label>
            <Controller
              name="medidaDiametro"
              control={control}
              render={({ field, fieldState }) => (
                <InputText
                  id="medidaDiametro"
                  {...field}
                  style={{ fontWeight: "bold" }}
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  maxLength={20}
                  disabled={readOnly}
                />
              )}
            />
            {errors.medidaDiametro && (
              <small className="p-error">
                {errors.medidaDiametro.message}
              </small>
            )}
          </div>
          <div style={{ flex: 2 }}>
            <label htmlFor="unidadDiametroId" className="font-bold">
              Unidad Diámetro
            </label>
            <Controller
              name="unidadDiametroId"
              control={control}
              render={({ field, fieldState }) => (
                <Dropdown
                  id="unidadDiametroId"
                  {...field}
                  options={unidadesMetricasOptions}
                  placeholder="Unidad"
                  style={{ fontWeight: "bold" }}
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  showClear
                  filter
                  disabled={readOnly}
                />
              )}
            />
            {errors.unidadDiametroId && (
              <small className="p-error">
                {errors.unidadDiametroId.message}
              </small>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="medidaAncho" className="font-bold">
              Ancho
            </label>
            <Controller
              name="medidaAncho"
              control={control}
              render={({ field, fieldState }) => (
                <InputText
                  id="medidaAncho"
                  {...field}
                  style={{ fontWeight: "bold" }}
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  maxLength={20}
                  disabled={readOnly}
                />
              )}
            />
            {errors.medidaAncho && (
              <small className="p-error">
                {errors.medidaAncho.message}
              </small>
            )}
          </div>

          <div style={{ flex: 2 }}>
            <label htmlFor="unidadAnchoId" className="font-bold">
              Unidad Ancho
            </label>
            <Controller
              name="unidadAnchoId"
              control={control}
              render={({ field, fieldState }) => (
                <Dropdown
                  id="unidadAnchoId"
                  {...field}
                  options={unidadesMetricasOptions}
                  placeholder="Unidad"
                  style={{ fontWeight: "bold" }}
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  showClear
                  filter
                  disabled={readOnly}
                />
              )}
            />
            {errors.unidadAnchoId && (
              <small className="p-error">
                {errors.unidadAnchoId.message}
              </small>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="medidaAlto" className="font-bold">
              Alto
            </label>
            <Controller
              name="medidaAlto"
              control={control}
              render={({ field, fieldState }) => (
                <InputText
                  id="medidaAlto"
                  {...field}
                  style={{ fontWeight: "bold" }}
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  maxLength={20}
                  disabled={readOnly}
                />
              )}
            />
            {errors.medidaAlto && (
              <small className="p-error">
                {errors.medidaAlto.message}
              </small>
            )}
          </div>
          <div style={{ flex: 2 }}>
            <label htmlFor="unidadAltoId" className="font-bold">
              Unidad Alto
            </label>
            <Controller
              name="unidadAltoId"
              control={control}
              render={({ field, fieldState }) => (
                <Dropdown
                  id="unidadAltoId"
                  {...field}
                  options={unidadesMetricasOptions}
                  placeholder="Unidad"
                  style={{ fontWeight: "bold" }}
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  showClear
                  filter
                  disabled={readOnly}
                />
              )}
            />
            {errors.unidadAltoId && (
              <small className="p-error">
                {errors.unidadAltoId.message}
              </small>
            )}
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
            <label htmlFor="medidaLargo" className="font-bold">
              Largo
            </label>
            <Controller
              name="medidaLargo"
              control={control}
              render={({ field, fieldState }) => (
                <InputText
                  id="medidaLargo"
                  {...field}
                  style={{ fontWeight: "bold" }}
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  maxLength={20}
                  disabled={readOnly}
                />
              )}
            />
            {errors.medidaLargo && (
              <small className="p-error">
                {errors.medidaLargo.message}
              </small>
            )}
          </div>

          <div style={{ flex: 2 }}>
            <label htmlFor="unidadLargoId" className="font-bold">
              Unidad Largo
            </label>
            <Controller
              name="unidadLargoId"
              control={control}
              render={({ field, fieldState }) => (
                <Dropdown
                  id="unidadLargoId"
                  {...field}
                  options={unidadesMetricasOptions}
                  placeholder="Seleccione unidad"
                  style={{ fontWeight: "bold" }}
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  showClear
                  disabled={readOnly}
                />
              )}
            />
            {errors.unidadLargoId && (
              <small className="p-error">
                {errors.unidadLargoId.message}
              </small>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="medidaEspesor" className="font-bold">
              Espesor
            </label>
            <Controller
              name="medidaEspesor"
              control={control}
              render={({ field, fieldState }) => (
                <InputText
                  id="medidaEspesor"
                  {...field}
                  style={{ fontWeight: "bold" }}
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  maxLength={20}
                  disabled={readOnly}
                />
              )}
            />
            {errors.medidaEspesor && (
              <small className="p-error">
                {errors.medidaEspesor.message}
              </small>
            )}
          </div>

          <div style={{ flex: 2 }}>
            <label htmlFor="unidadEspesorId" className="font-bold">
              Unidad Espesor
            </label>
            <Controller
              name="unidadEspesorId"
              control={control}
              render={({ field, fieldState }) => (
                <Dropdown
                  id="unidadEspesorId"
                  {...field}
                  options={unidadesMetricasOptions}
                  placeholder="Seleccione unidad"
                  style={{ fontWeight: "bold" }}
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  showClear
                  disabled={readOnly}
                />
              )}
            />
            {errors.unidadEspesorId && (
              <small className="p-error">
                {errors.unidadEspesorId.message}
              </small>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="medidaAngulo" className="font-bold">
              Ángulo
            </label>
            <Controller
              name="medidaAngulo"
              control={control}
              render={({ field, fieldState }) => (
                <InputText
                  id="medidaAngulo"
                  {...field}
                  style={{ fontWeight: "bold" }}
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  maxLength={20}
                  disabled={readOnly}
                />
              )}
            />
            {errors.medidaAngulo && (
              <small className="p-error">
                {errors.medidaAngulo.message}
              </small>
            )}
          </div>

          <div style={{ flex: 2 }}>
            <label htmlFor="unidadAnguloId" className="font-bold">
              Unidad Ángulo *
            </label>
            <Controller
              name="unidadAnguloId"
              control={control}
              render={({ field, fieldState }) => (
                <Dropdown
                  id="unidadAnguloId"
                  {...field}
                  options={unidadesMetricasOptions}
                  placeholder="Seleccione unidad"
                  style={{ fontWeight: "bold" }}
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  showClear
                  disabled={readOnly}
                />
              )}
            />
            {errors.unidadAnguloId && (
              <small className="p-error">
                {errors.unidadAnguloId.message}
              </small>
            )}
          </div>
        </div>

        {/* Campo Descripción Medida Adicional */}
        <div style={{ marginTop: "20px" }}>
          <label htmlFor="descripcionMedidaAdicional" className="font-bold">
            Descripción Medida Adicional
          </label>
          <Controller
            name="descripcionMedidaAdicional"
            control={control}
            render={({ field, fieldState }) => (
              <InputTextarea
                id="descripcionMedidaAdicional"
                {...field}
                rows={2}
                className={classNames({
                  "p-invalid": fieldState.error,
                })}
                style={{
                  textTransform: "uppercase",
                  fontWeight: "bold",
                }}
                maxLength={120}
                placeholder="Descripción adicional de medidas (opcional)"
                disabled={readOnly}
              />
            )}
          />
          {errors.descripcionMedidaAdicional && (
            <small className="p-error">
              {errors.descripcionMedidaAdicional.message}
            </small>
          )}
        </div>
      </div>
    </Card>
  );
}
