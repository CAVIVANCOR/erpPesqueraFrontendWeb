import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { getTiposAfectacionIGV } from "../../api/facturacionElectronica/tipoAfectacionIGV";

export default function AsignarTipoAfectacionIGVDialog({
  visible,
  onHide,
  selectedIds = [],
  onAplicar,
  toast,
  entidadNombre = "registros",
}) {
  const [tiposAfectacion, setTiposAfectacion] = useState([]);
  const [selectedTipo, setSelectedTipo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      cargarTiposAfectacion();
      setSelectedTipo(null);
    }
  }, [visible]);

  const cargarTiposAfectacion = async () => {
    try {
      const data = await getTiposAfectacionIGV();
      setTiposAfectacion(data || []);
    } catch (error) {
      console.error("Error cargando tipos de afectación IGV:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar tipos de afectación IGV",
        life: 3000,
      });
    }
  };

  const handleAplicar = async () => {
    if (!selectedTipo) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar un tipo de afectación IGV",
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
      await onAplicar(selectedIds, selectedTipo);
      setSelectedTipo(null);
      onHide();
    } catch (error) {
      console.error("Error en handleAplicar:", error);
    } finally {
      setLoading(false);
    }
  };

  const tiposOptions = tiposAfectacion.map((t) => ({
    label: `${t.codigo} - ${t.nombre}`,
    value: Number(t.id),
  }));

  return (
    <Dialog
      visible={visible}
      style={{ width: "500px" }}
      header="Asignar Tipo Afectación IGV"
      modal
      onHide={() => {
        setSelectedTipo(null);
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
          <label htmlFor="tipoAfectacion" style={{ fontWeight: "bold" }}>
            Tipo de Afectación IGV <span style={{ color: "red" }}>*</span>
          </label>
          <Dropdown
            id="tipoAfectacion"
            value={selectedTipo}
            options={tiposOptions}
            onChange={(e) => setSelectedTipo(e.value)}
            placeholder="Seleccione tipo de afectación"
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
              setSelectedTipo(null);
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