// src/components/centroCosto/CentroCostoForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import {
  crearCentroCosto,
  actualizarCentroCosto,
} from "../../api/centroCosto";
import PlanCuentaContableSelector from "../common/PlanCuentaContableSelector";  // ⭐ NUEVO

export default function CentroCostoForm({
  isEdit = false,
  defaultValues = {},
  categorias = [],
  // cuentasContables = [],  // ⭐ ELIMINADO - Ya no se necesita
  onSubmit,
  onCancel,
  loading = false,
  readOnly = false,
}) {
  const toast = useRef(null);
  const [guardando, setGuardando] = useState(false);

  const [formData, setFormData] = useState({
    Codigo: defaultValues?.Codigo || "",
    Nombre: defaultValues?.Nombre || "",
    Descripcion: defaultValues?.Descripcion || "",
    CategoriaID: defaultValues?.CategoriaID
      ? Number(defaultValues.CategoriaID)
      : null,
    ParentCentroID: defaultValues?.ParentCentroID || "",
    cuentaContableId: defaultValues?.cuentaContableId
      ? Number(defaultValues.cuentaContableId)
      : null,  // ⭐ NUEVO
  });

  useEffect(() => {
    setFormData({
      Codigo: (defaultValues?.Codigo || "").toUpperCase(),
      Nombre: (defaultValues?.Nombre || "").toUpperCase(),
      Descripcion: (defaultValues?.Descripcion || "").toUpperCase(),
      CategoriaID: defaultValues?.CategoriaID
        ? Number(defaultValues.CategoriaID)
        : null,
      ParentCentroID: (defaultValues?.ParentCentroID || "").toUpperCase(),
      cuentaContableId: defaultValues?.cuentaContableId
        ? Number(defaultValues.cuentaContableId)
        : null,  // ⭐ NUEVO
    });
  }, [defaultValues]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.Codigo.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "El código es obligatorio",
        life: 3000,
      });
      return;
    }

    if (!formData.Nombre.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "El nombre es obligatorio",
        life: 3000,
      });
      return;
    }

    if (!formData.CategoriaID) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "La categoría es obligatoria",
        life: 3000,
      });
      return;
    }

    const dataToSend = {
      Codigo: formData.Codigo.toUpperCase(),
      Nombre: formData.Nombre.toUpperCase(),
      Descripcion: formData.Descripcion
        ? formData.Descripcion.toUpperCase()
        : null,
      CategoriaID: Number(formData.CategoriaID),
      ParentCentroID: formData.ParentCentroID
        ? formData.ParentCentroID.toUpperCase()
        : null,
      cuentaContableId: formData.cuentaContableId
        ? Number(formData.cuentaContableId)
        : null,  // ⭐ NUEVO
    };

    setGuardando(true);
    try {
      if (isEdit) {
        await actualizarCentroCosto(defaultValues.id, dataToSend);
      } else {
        await crearCentroCosto(dataToSend);
      }
      onSubmit(dataToSend);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error al Guardar",
        detail:
          error.response?.data?.message ||
          "Error al guardar centro de costo",
        life: 5000,
      });
    } finally {
      setGuardando(false);
    }
  };

  const categoriasOptions = categorias.map((c) => ({
    label: c.nombre,
    value: Number(c.id),
  }));

  // ⭐ ELIMINADO - Ya no se necesita cuentasContablesOptions
  // const cuentasContablesOptions = cuentasContables
  //   .filter((c) => c.codigo?.startsWith("94"))
  //   .map((c) => ({
  //     label: `${c.codigo} - ${c.descripcion}`,
  //     value: Number(c.id),
  //   }));

  return (
    <>
      <Toast ref={toast} />
      <form onSubmit={handleSubmit} className="p-fluid">
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="CategoriaID" style={{ fontWeight: "bold" }}>
              Categoría <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              id="CategoriaID"
              value={formData.CategoriaID}
              options={categoriasOptions}
              onChange={(e) => handleChange("CategoriaID", e.value)}
              placeholder="Seleccionar categoría"
              required
              disabled={readOnly || loading || guardando}
              filter
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="ParentCentroID" style={{ fontWeight: "bold" }}>
              SubCategoría
            </label>
            <InputText
              id="ParentCentroID"
              value={formData.ParentCentroID}
              onChange={(e) =>
                handleChange("ParentCentroID", e.target.value.toUpperCase())
              }
              disabled={readOnly || loading || guardando}
              maxLength={80}
            />
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
            <label htmlFor="Codigo" style={{ fontWeight: "bold" }}>
              Código <span style={{ color: "red" }}>*</span>
            </label>
            <InputText
              id="Codigo"
              value={formData.Codigo}
              onChange={(e) =>
                handleChange("Codigo", e.target.value.toUpperCase())
              }
              required
              disabled={readOnly || loading || guardando}
              maxLength={50}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="Nombre" style={{ fontWeight: "bold" }}>
              Nombre <span style={{ color: "red" }}>*</span>
            </label>
            <InputText
              id="Nombre"
              value={formData.Nombre}
              onChange={(e) =>
                handleChange("Nombre", e.target.value.toUpperCase())
              }
              required
              disabled={readOnly || loading || guardando}
              maxLength={255}
            />
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
            <label htmlFor="Descripcion">Descripción</label>
            <InputTextarea
              id="Descripcion"
              value={formData.Descripcion}
              onChange={(e) =>
                handleChange("Descripcion", e.target.value.toUpperCase())
              }
              rows={3}
              disabled={readOnly || loading || guardando}
            />
          </div>
        </div>

        {/* ⭐ REEMPLAZADO: Dropdown por PlanCuentaContableSelector */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <PlanCuentaContableSelector
              value={formData.cuentaContableId}
              onChange={(id) => handleChange("cuentaContableId", id)}
              label="Cuenta Contable (Clase 94 - Centros de Costo)"
              placeholder="Elegir Cuenta Contable Clase 94"
              disabled={readOnly || loading || guardando}
              required={false}
              showClearButton={true}
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 18,
          }}
        >
          <Button
            label="Cancelar"
            icon="pi pi-times"
            severity="secondary"
            raised
            onClick={onCancel}
            type="button"
            disabled={loading || guardando}
          />
          <Button
            label={isEdit ? "Actualizar" : "Guardar"}
            icon="pi pi-check"
            type="submit"
            loading={loading || guardando}
            disabled={readOnly || loading || guardando}
            severity="success"
            raised
          />
        </div>
      </form>
    </>
  );
}