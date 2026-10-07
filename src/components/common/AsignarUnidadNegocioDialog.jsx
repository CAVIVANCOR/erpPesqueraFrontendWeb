import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { getUnidadesNegocio } from "../../api/unidadNegocio";

/**
 * Diálogo genérico para asignar una unidad de negocio a los registros seleccionados.
 * La persistencia la define quien lo usa mediante onAplicar(ids, unidadNegocioId).
 */
export default function AsignarUnidadNegocioDialog({
  visible,
  onHide,
  selectedIds = [],
  onAplicar,
  toast,
  entidadNombre = "registros",
}) {
  const [unidadesNegocio, setUnidadesNegocio] = useState([]);
  const [selectedUnidad, setSelectedUnidad] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      cargarUnidadesNegocio();
      setSelectedUnidad(null);
    }
  }, [visible]);

  const cargarUnidadesNegocio = async () => {
    try {
      const data = await getUnidadesNegocio({ activo: true });
      setUnidadesNegocio(data || []);
    } catch (error) {
      console.error("Error cargando unidades de negocio:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar unidades de negocio",
        life: 3000,
      });
    }
  };

  const handleAplicar = async () => {
    if (!selectedUnidad) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar una unidad de negocio",
        life: 3000,
      });
      return;
    }

    if (!onAplicar) {
      console.error("No se proporcionó la función onAplicar");
      return;
    }

    try {
      setLoading(true);
      await onAplicar(selectedIds, selectedUnidad);
      setSelectedUnidad(null);
      onHide();
    } catch (error) {
      console.error("Error en handleAplicar:", error);
    } finally {
      setLoading(false);
    }
  };

  const unidadesOptions = unidadesNegocio.map((u) => ({
    label: u.nombre,
    value: Number(u.id),
  }));

  return (
    <Dialog
      visible={visible}
      style={{ width: "500px" }}
      header="Asignar Unidad de Negocio"
      modal
      onHide={() => {
        setSelectedUnidad(null);
        onHide();
      }}
    >
      <div className="p-fluid">
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem",
            backgroundColor: "#E3F2FD",
            borderRadius: "4px",
          }}
        >
          <i
            className="pi pi-info-circle"
            style={{ marginRight: "0.5rem", color: "#1976D2" }}
          ></i>
          <strong>
            {entidadNombre}: {selectedIds.length} seleccionado(s)
          </strong>
        </div>

        <div className="field">
          <label htmlFor="unidadNegocio" style={{ fontWeight: "bold" }}>
            Unidad de Negocio <span style={{ color: "red" }}>*</span>
          </label>
          <Dropdown
            id="unidadNegocio"
            value={selectedUnidad}
            options={unidadesOptions}
            onChange={(e) => setSelectedUnidad(e.value)}
            placeholder="Seleccione unidad de negocio"
            filter
            filterBy="label"
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
            marginTop: "1.5rem",
          }}
        >
          <Button
            label="Cancelar"
            icon="pi pi-times"
            onClick={() => {
              setSelectedUnidad(null);
              onHide();
            }}
            className="p-button-secondary"
            disabled={loading}
          />
          <Button
            label="Aplicar a Selección"
            icon="pi pi-check"
            onClick={handleAplicar}
            className="p-button-success"
            loading={loading}
          />
        </div>
      </div>
    </Dialog>
  );
}
