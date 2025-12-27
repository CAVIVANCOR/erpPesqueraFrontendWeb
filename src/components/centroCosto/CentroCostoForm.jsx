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

export default function CentroCostoForm({
  isEdit = false,
  defaultValues = {},
  categorias = [],
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
    });
  }, [defaultValues]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.CategoriaID) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar una categoría",
        life: 3000,
      });
      return;
    }

    if (!formData.Codigo) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe ingresar un código",
        life: 3000,
      });
      return;
    }

    if (!formData.Nombre) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe ingresar un nombre",
        life: 3000,
      });
      return;
    }

    const dataToSend = {
      Codigo: formData.Codigo.toUpperCase(),
      Nombre: formData.Nombre.toUpperCase(),
      Descripcion: formData.Descripcion.toUpperCase(),
      CategoriaID: Number(formData.CategoriaID),
      ParentCentroID: formData.ParentCentroID
        ? formData.ParentCentroID.toUpperCase()
        : null,
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
              disabled={readOnly || loading || guardando}
              required
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="ParentCentroID">Centro Padre</label>
            <InputText
              id="ParentCentroID"
              value={formData.ParentCentroID}
              onChange={(e) =>
                handleChange("ParentCentroID", e.target.value.toUpperCase())
              }
              disabled={readOnly || loading || guardando}
              maxLength={20}
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
              maxLength={20}
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

        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-secondary"
            severity="secondary"
            size="small"
            raised
            outlined
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
            className="p-button-success"
            severity="success"
            raised
            size="small"
            outlined
          />
        </div>
      </form>
    </>
  );
}