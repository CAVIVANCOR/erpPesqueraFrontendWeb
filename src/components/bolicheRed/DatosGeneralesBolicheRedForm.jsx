/**
 * DatosGeneralesBolicheRedForm.jsx
 *
 * Componente Card para gestionar los datos generales de un boliche red.
 * Incluye campos básicos de identificación, descripción y configuración.
 * Sigue el patrón profesional ERP Megui con React Hook Form.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useEffect, useState } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { classNames } from "primereact/utils";
import { Controller } from "react-hook-form";

export default function DatosGeneralesBolicheRedForm({
  control,
  errors,
  setValue,
  watch,
  getValues,
  activos = [],
  estadosActivo = [],
  defaultValues = {},
}) {

  return (
    <Card title="Datos Generales" className="mt-3">
      <div className="p-fluid formgrid grid">
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginBottom: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="activoId" className="font-bold">
              Activo *
            </label>
            <Controller
              name="activoId"
              control={control}
              render={({ field, fieldState }) => (
                <Dropdown
                  id="activoId"
                  {...field}
                  options={activos}
                  optionLabel="descripcion"
                  optionValue="id"
                  placeholder="Seleccione un activo"
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  style={{ fontWeight: "bold", textTransform: "uppercase" }}
                  showClear
                />
              )}
            />
            {errors.activoId && (
              <small className="p-error">{errors.activoId.message}</small>
            )}
          </div>

          <div style={{ flex: 2 }}>
            <label htmlFor="descripcion" className="font-bold">
              Descripción
            </label>
            <Controller
              name="descripcion"
              control={control}
              render={({ field, fieldState }) => (
                <InputText
                  id="descripcion"
                  {...field}
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  style={{
                    textTransform: "uppercase",
                    fontWeight: "bold",
                  }}
                  maxLength={255}
                  placeholder="Ingrese una descripción"
                />
              )}
            />
            {errors.descripcion && (
              <small className="p-error">{errors.descripcion.message}</small>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="estadoActivoId" className="font-bold">
              Estado Activo *
            </label>
            <Controller
              name="estadoActivoId"
              control={control}
              render={({ field, fieldState }) => (
                <Dropdown
                  id="estadoActivoId"
                  {...field}
                  options={estadosActivo}
                  optionLabel="descripcion"
                  optionValue="id"
                  placeholder="Seleccione un estado activo"
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  style={{ fontWeight: "bold", textTransform: "uppercase" }}
                  showClear
                />
              )}
            />
            {errors.estadoActivoId && (
              <small className="p-error">{errors.estadoActivoId.message}</small>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginBottom: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="largoContraido" className="font-bold">
              Longitud de Armado (Brazadas)
            </label>
            <Controller
              name="largoContraido"
              control={control}
              render={({ field }) => (
                <InputNumber
                  id="largoContraido"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  placeholder="Ingrese longitud BR"
                  inputStyle={{ fontWeight: "bold" }}
                  mode="decimal"
                  minFractionDigits={0}
                  maxFractionDigits={2}
                  min={0}
                />
              )}
            />
            {errors.largoContraido && (
              <small className="p-error">{errors.largoContraido.message}</small>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="largoExpandido" className="font-bold">
              Longitud de Paño (Brazadas)
            </label>
            <Controller
              name="largoExpandido"
              control={control}
              render={({ field }) => (
                <InputNumber
                  id="largoExpandido"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  placeholder="Ingrese longitud BR"
                  inputStyle={{ fontWeight: "bold" }}
                  mode="decimal"
                  minFractionDigits={0}
                  maxFractionDigits={2}
                  min={0}
                />
              )}
            />
            {errors.largoExpandido && (
              <small className="p-error">{errors.largoExpandido.message}</small>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="altoM" className="font-bold">
              Alto (Brazadas)
            </label>
            <Controller
              name="altoM"
              control={control}
              render={({ field }) => (
                <InputNumber
                  id="altoM"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  placeholder="Ingrese alto en metros"
                  inputStyle={{ fontWeight: "bold" }}
                  mode="decimal"
                  minFractionDigits={0}
                  maxFractionDigits={2}
                  min={0}
                />
              )}
            />
            {errors.altoM && (
              <small className="p-error">{errors.altoM.message}</small>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginBottom: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="nroFlotadores" className="font-bold">
              Número de Flotadores
            </label>
            <Controller
              name="nroFlotadores"
              control={control}
              render={({ field }) => (
                <InputNumber
                  id="nroFlotadores"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  placeholder="Ingrese número de flotadores"
                  inputStyle={{ fontWeight: "bold" }}
                  mode="decimal"
                  minFractionDigits={0}
                  maxFractionDigits={0}
                  min={0}
                />
              )}
            />
            {errors.nroFlotadores && (
              <small className="p-error">{errors.nroFlotadores.message}</small>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="nroPlomos" className="font-bold">
              Número de Plomos
            </label>
            <Controller
              name="nroPlomos"
              control={control}
              render={({ field }) => (
                <InputNumber
                  id="nroPlomos"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  placeholder="Ingrese número de plomos"
                  inputStyle={{ fontWeight: "bold" }}
                  mode="decimal"
                  minFractionDigits={0}
                  maxFractionDigits={0}
                  min={0}
                />
              )}
            />
            {errors.nroPlomos && (
              <small className="p-error">{errors.nroPlomos.message}</small>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div className="field-checkbox">
              <Controller
                name="cesado"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="cesado"
                    {...field}
                    checked={field.value || false}
                    onChange={(e) => field.onChange(e.checked)}
                  />
                )}
              />
              <label htmlFor="cesado" className="font-bold">
                Cesado
              </label>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginBottom: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <div className="field-checkbox">
              <Controller
                name="paraPescaConsumo"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="paraPescaConsumo"
                    {...field}
                    checked={field.value || false}
                    onChange={(e) => field.onChange(e.checked)}
                  />
                )}
              />
              <label htmlFor="paraPescaConsumo" className="font-bold">
                Para Pesca Consumo
              </label>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div className="field-checkbox">
              <Controller
                name="paraPescaIndustrial"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="paraPescaIndustrial"
                    {...field}
                    checked={field.value || false}
                    onChange={(e) => field.onChange(e.checked)}
                  />
                )}
              />
              <label htmlFor="paraPescaIndustrial" className="font-bold">
                Para Pesca Industrial
              </label>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            {/* Espacio vacío para mantener el layout */}
          </div>
        </div>
      </div>
    </Card>
  );
}
