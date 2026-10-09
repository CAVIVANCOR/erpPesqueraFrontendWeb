/**
 * DetRepuestosContratistaOTForm.jsx
 *
 * Formulario puro de un ítem del presupuesto de contratista.
 * No maneja estado global ni llamadas a API; solo recibe los datos y
 * notifica los cambios.
 *
 * Props:
 *  formData  {Object}
 *  onChange  {function(field, value)}
 *  empresaId {number|string}
 *  monedas   {Array}
 */

import React from "react";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import ProductoSelector from "../common/ProductoSelector";

export default function DetRepuestosContratistaOTForm({
  formData,
  onChange,
  empresaId,
  monedas = [],
}) {
  const total =
    Number(formData.cantidad || 0) * Number(formData.precioUnitario || 0);

  return (
    <div className="grid">
      <div className="col-12 md:col-5">
        <label className="block font-medium mb-2">Producto/Servicio *</label>
        <ProductoSelector
          empresaIdPreseleccionada={empresaId}
          value={formData.productoId}
          onChange={(productoId) => onChange("productoId", productoId)}
          placeholder="Seleccione un producto o servicio"
          required={true}
        />
      </div>
      <div className="col-12 md:col-4">
        <label className="block font-medium mb-2">Descripción *</label>
        <InputText
          value={formData.descripcion || ""}
          onChange={(e) => onChange("descripcion", e.target.value)}
          placeholder="Descripción del ítem"
        />
      </div>
      <div className="col-6 md:col-1">
        <label className="block font-medium mb-2">Cantidad *</label>
        <InputNumber
          value={formData.cantidad}
          onValueChange={(e) => onChange("cantidad", e.value)}
          mode="decimal"
          minFractionDigits={2}
          maxFractionDigits={4}
        />
      </div>
      <div className="col-6 md:col-2">
        <label className="block font-medium mb-2">P. Unitario *</label>
        <InputNumber
          value={formData.precioUnitario}
          onValueChange={(e) => onChange("precioUnitario", e.value)}
          mode="decimal"
          minFractionDigits={2}
          maxFractionDigits={6}
        />
      </div>
      <div className="col-12 md:col-3">
        <label className="block font-medium mb-2">Moneda *</label>
        <Dropdown
          value={formData.monedaId}
          options={monedas}
          optionLabel="codigoSunat"
          optionValue="id"
          onChange={(e) => onChange("monedaId", e.value)}
          placeholder="Moneda"
        />
      </div>
      <div className="col-12 md:col-2">
        <label className="block font-medium mb-2">Total (calculado)</label>
        <InputNumber
          value={total}
          mode="decimal"
          minFractionDigits={2}
          maxFractionDigits={2}
          disabled
        />
      </div>
    </div>
  );
}
