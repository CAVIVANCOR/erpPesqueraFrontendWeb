import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import AvatarGroupSelector from "./AvatarGroupSelector";
import "./ParticipanteSelectorDialog.css";
import { getResponsiveFontSize } from "../../utils/utils";

export default function ParticipanteSelectorDialog({
  visible,
  onHide,
  personalOptions,
  participantesActuales,
  onGuardar,
  loading,
}) {
  const [busqueda, setBusqueda] = useState("");
  const [empresaFiltro, setEmpresaFiltro] = useState(null);
  const [cargoFiltro, setCargoFiltro] = useState(null);
  const [seleccionados, setSeleccionados] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);

  const empresasOptions = [
    { label: "Todas las empresas", value: null },
    ...Array.from(
      new Set(
        personalOptions
          .filter((p) => p.empresa?.razonSocial)
          .map((p) => p.empresa.razonSocial)
      )
    ).map((razon) => ({ label: razon, value: razon })),
  ];

  const cargosOptions = React.useMemo(() => {
    const cargos = personalOptions
      .filter((p) => p.cargo?.descripcion)
      .map((p) => p.cargo.descripcion);

    const cargosUnicos = Array.from(new Set(cargos)).sort();

    return [
      { label: "Todos los cargos", value: null },
      ...cargosUnicos.map((descripcion) => ({ label: descripcion, value: descripcion })),
    ];
  }, [personalOptions]);

  const personalDisponible = personalOptions.filter((p) => {
    const yaEsParticipante = participantesActuales.some(
      (part) => Number(part.personalId) === Number(p.id)
    );
    if (yaEsParticipante) return false;

    const yaSeleccionado = seleccionados.some(
      (sel) => Number(sel.id) === Number(p.id)
    );
    if (yaSeleccionado) return false;

    if (busqueda) {
      const searchLower = busqueda.toLowerCase();
      const nombreCompleto = `${p.nombres} ${p.apellidos}`.toLowerCase();
      if (!nombreCompleto.includes(searchLower)) return false;
    }

    if (empresaFiltro && p.empresa?.razonSocial !== empresaFiltro) {
      return false;
    }

    if (cargoFiltro && p.cargo?.descripcion !== cargoFiltro) {
      return false;
    }

    return true;
  });

  const handleAgregarPersonal = (personal) => {
    setSeleccionados([...seleccionados, personal]);
  };

  const handleRemoverSeleccionado = (personalId) => {
    setSeleccionados(seleccionados.filter((p) => p.id !== personalId));
  };

  const handleDragStart = (e, personal) => {
    setDraggedItem(personal);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleGuardar = () => {
    onGuardar(seleccionados);
    setSeleccionados([]);
    setBusqueda("");
    setEmpresaFiltro(null);
    setCargoFiltro(null);
  };

  const handleCancelar = () => {
    setSeleccionados([]);
    setBusqueda("");
    setEmpresaFiltro(null);
    setCargoFiltro(null);
    onHide();
  };

  return (
    <Dialog
      visible={visible}
      onHide={handleCancelar}
      header="Seleccionar Participantes"
      className="participante-selector-dialog"
      style={{ width: "90vw", maxWidth: "1200px" }}
      maximizable
    >
      {/* FILTROS */}
      <div className="filtros-section">
        <div className="p-fluid">
          <div
            style={{
              display: "flex",
              gap: 2,
              alignItems: "end",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label
                htmlFor="busqueda"
                style={{
                  display: "block", fontSize: getResponsiveFontSize()
                }}
              >
                Buscar
              </label>
              <span className="p-input-icon-left" style={{ width: "100%" }}>
                <InputText
                  id="busqueda"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Por Nombres..."
                  style={{ width: "100%", fontWeight: "bold" }}
                />
              </span>
            </div>
            <div style={{ flex: 1.5 }}>
              <label
                htmlFor="empresa"
                style={{
                  display: "block", fontSize: getResponsiveFontSize()
                }}
              >
                Empresa
              </label>
              <Dropdown
                id="empresa"
                value={empresaFiltro}
                options={empresasOptions}
                onChange={(e) => setEmpresaFiltro(e.value)}
                placeholder="Todas"
                filter
                style={{ width: "100%", fontWeight: "bold" }}
              />
            </div>
            <div style={{ flex: 1.5 }}>
              <label
                htmlFor="cargo"
                style={{
                  display: "block", fontSize: getResponsiveFontSize()
                }}
              >
                Cargo
              </label>
              <Dropdown
                id="cargo"
                value={cargoFiltro}
                options={cargosOptions}
                onChange={(e) => setCargoFiltro(e.value)}
                placeholder="Todos"
                filter
                style={{ width: "100%", fontWeight: "bold" }}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <Button
                label="Limpiar"
                icon="pi pi-filter-slash"
                className="p-button-outlined p-button-secondary"
                onClick={() => {
                  setBusqueda("");
                  setEmpresaFiltro(null);
                  setCargoFiltro(null);
                }}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <Button
                label="Cancelar"
                icon="pi pi-times"
                className="p-button-secondary"
                onClick={handleCancelar}
                disabled={loading}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div style={{ flex: 1.8 }}>
              <Button
                label={
                  loading
                    ? "Procesando..."
                    : `Agregar ${seleccionados.length} Participante${
                        seleccionados.length !== 1 ? "s" : ""
                      }`
                }
                icon={loading ? "pi pi-spin pi-spinner" : "pi pi-check"}
                onClick={handleGuardar}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
                disabled={loading || seleccionados.length === 0}
                loading={loading}
              />
            </div>
          </div>
        </div>
      </div>
      {/* AVATAR GROUP SELECTOR */}
      <AvatarGroupSelector
        personalDisponible={personalDisponible}
        seleccionados={seleccionados}
        onAgregarPersonal={handleAgregarPersonal}
        onRemoverSeleccionado={handleRemoverSeleccionado}
        onDragStart={handleDragStart}
      />
    </Dialog>
  );
}