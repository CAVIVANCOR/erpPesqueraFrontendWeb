// src/components/oTMantenimiento/DetInsumosOTForm.jsx
// Formulario modular para crear/editar insumos de tareas OT
import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Message } from "primereact/message";
import { obtenerStockProducto } from "../../api/otMantenimientoAlmacen";

const DetInsumosOTForm = ({
  insumo = null,
  estadosInsumo = [],
  productos = [],
  empresaId = null,
  almacenId = null,
  onSubmit,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [stockDisponible, setStockDisponible] = useState(null);
  const [validandoStock, setValidandoStock] = useState(false);
  const toast = useRef(null);

  const [formData, setFormData] = useState({
    productoId: insumo?.productoId ? Number(insumo.productoId) : null,
    cantidad: insumo?.cantidad || 1,
    estadoInsumoId: insumo?.estadoInsumoId ? Number(insumo.estadoInsumoId) : 61, // PENDIENTE por defecto
    observaciones: insumo?.observaciones || "",
  });

  // Validar stock cuando cambia el producto
  useEffect(() => {
    if (formData.productoId && empresaId && almacenId) {
      validarStock();
    } else {
      setStockDisponible(null);
    }
  }, [formData.productoId, empresaId, almacenId]);

  const validarStock = async () => {
    setValidandoStock(true);
    try {
      const result = await obtenerStockProducto(
        formData.productoId,
        empresaId,
        almacenId
      );
      setStockDisponible(result.stockDisponible);
    } catch (error) {
      console.error("Error al validar stock:", error);
      setStockDisponible(null);
    } finally {
      setValidandoStock(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validarFormulario = () => {
    const camposFaltantes = [];

    if (!formData.productoId) camposFaltantes.push("Producto");
    if (!formData.cantidad || formData.cantidad <= 0)
      camposFaltantes.push("Cantidad válida");
    if (!formData.estadoInsumoId) camposFaltantes.push("Estado");

    if (camposFaltantes.length > 0) {
      toast?.current?.show({
        severity: "warn",
        summary: "Campos Obligatorios Faltantes",
        detail: (
          <div>
            <p style={{ marginBottom: "8px", fontWeight: "bold" }}>
              Los siguientes campos son obligatorios:
            </p>
            <ul style={{ margin: 0, paddingLeft: "20px" }}>
              {camposFaltantes.map((campo, index) => (
                <li key={index}>{campo}</li>
              ))}
            </ul>
          </div>
        ),
        life: 6000,
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error al guardar insumo:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="det-insumos-ot-form p-fluid">
      <Toast ref={toast} />

      {/* FILA: Producto */}
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="productoId" style={{ fontWeight: "bold" }}>
          Producto *
        </label>
        <Dropdown
          id="productoId"
          value={formData.productoId}
          options={productos.map((p) => ({
            label: `${p.codigo} - ${p.descripcion}`,
            value: Number(p.id),
          }))}
          onChange={(e) => handleChange("productoId", e.value)}
          placeholder="Seleccionar producto"
          filter
          disabled={loading}
          style={{ width: "100%" }}
        />
        
        {/* INDICADOR DE STOCK */}
        {validandoStock && (
          <Message
            severity="info"
            text="Consultando stock disponible..."
            style={{ marginTop: "0.5rem", width: "100%" }}
          />
        )}
        {!validandoStock && stockDisponible !== null && formData.productoId && (
          <Message
            severity={
              stockDisponible >= formData.cantidad
                ? "success"
                : stockDisponible > 0
                ? "warn"
                : "error"
            }
            text={
              stockDisponible >= formData.cantidad
                ? `Stock disponible: ${stockDisponible.toFixed(2)} unidades ✓`
                : stockDisponible > 0
                ? `Stock disponible: ${stockDisponible.toFixed(2)} unidades (Insuficiente)`
                : `Sin stock disponible`
            }
            style={{ marginTop: "0.5rem", width: "100%" }}
          />
        )}
      </div>

      {/* FILA: Cantidad, Estado */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1rem",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="cantidad" style={{ fontWeight: "bold" }}>
            Cantidad *
          </label>
          <InputNumber
            id="cantidad"
            value={formData.cantidad}
            onValueChange={(e) => handleChange("cantidad", e.value)}
            min={0.01}
            minFractionDigits={2}
            maxFractionDigits={2}
            disabled={loading}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 2 }}>
          <label htmlFor="estadoInsumoId" style={{ fontWeight: "bold" }}>
            Estado *
          </label>
          <Dropdown
            id="estadoInsumoId"
            value={formData.estadoInsumoId}
            options={estadosInsumo.map((e) => ({
              label: e.descripcion,
              value: Number(e.id),
            }))}
            onChange={(e) => handleChange("estadoInsumoId", e.value)}
            placeholder="Seleccionar estado"
            disabled={loading}
            style={{ width: "100%" }}
          />
        </div>
      </div>

      {/* FILA: Observaciones */}
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="observaciones" style={{ fontWeight: "bold" }}>
          Observaciones
        </label>
        <InputTextarea
          id="observaciones"
          value={formData.observaciones}
          onChange={(e) => handleChange("observaciones", e.target.value)}
          rows={3}
          placeholder="Observaciones adicionales"
          disabled={loading}
          style={{ width: "100%" }}
        />
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div
        style={{
          marginTop: "1.5rem",
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.5rem",
        }}
      >
        <Button
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-secondary"
          onClick={onCancel}
          disabled={loading}
        />
        <Button
          label={insumo ? "Actualizar" : "Guardar"}
          icon="pi pi-check"
          className="p-button-primary"
          onClick={handleSubmit}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default DetInsumosOTForm;
