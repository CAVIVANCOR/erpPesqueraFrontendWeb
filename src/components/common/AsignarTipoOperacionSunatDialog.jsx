import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { getTiposOperacionSunat } from "../../api/facturacionElectronica/tipoOperacionSunat";

/**
 * Componente genérico para asignar Tipo de Operación SUNAT a múltiples registros
 * Totalmente independiente - puede usarse en PreFactura, OrdenCompra, etc.
 * 
 * @param {boolean} visible - Controla visibilidad del diálogo
 * @param {Function} onHide - Callback al cerrar el diálogo
 * @param {Array<number>} selectedIds - Array de IDs seleccionados
 * @param {Function} onAplicar - Callback que recibe (ids, tipoOperacionSunatId) y ejecuta la actualización
 * @param {Object} toast - Referencia al componente Toast (opcional)
 * @param {string} entidadNombre - Nombre de la entidad para mensajes (ej: "PreFacturas", "Órdenes de Compra")
 */
export default function AsignarTipoOperacionSunatDialog({
  visible,
  onHide,
  selectedIds = [],
  onAplicar,
  toast,
  entidadNombre = "registros",
}) {
  const [tiposOperacion, setTiposOperacion] = useState([]);
  const [selectedTipo, setSelectedTipo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      cargarTiposOperacion();
      setSelectedTipo(null);
    }
  }, [visible]);

  const cargarTiposOperacion = async () => {
    try {
      const data = await getTiposOperacionSunat();
      setTiposOperacion(data || []);
    } catch (error) {
      console.error("Error cargando tipos de operación:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar tipos de operación SUNAT",
        life: 3000,
      });
    }
  };

  const handleAplicar = async () => {
    if (!selectedTipo) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar un tipo de operación SUNAT",
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

  const tiposOptions = tiposOperacion.map((t) => ({
    label: `${t.codigo} - ${t.descripcion}`,
    value: Number(t.id),
  }));

  return (
    <Dialog
      visible={visible}
      style={{ width: "500px" }}
      header="Asignar Tipo Operación SUNAT"
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
          <label htmlFor="tipoOperacion" style={{ fontWeight: "bold" }}>
            Tipo de Operación SUNAT <span style={{ color: "red" }}>*</span>
          </label>
          <Dropdown
            id="tipoOperacion"
            value={selectedTipo}
            options={tiposOptions}
            onChange={(e) => setSelectedTipo(e.value)}
            placeholder="Seleccione tipo de operación"
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