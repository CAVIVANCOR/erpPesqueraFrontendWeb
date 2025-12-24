import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import { Card } from "primereact/card";
import { Badge } from "primereact/badge";
import { ScrollPanel } from "primereact/scrollpanel";
import "./ParticipanteSelectorDialog.css";

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
      .filter((p) => p.cargo?.nombre)
      .map((p) => p.cargo.nombre);

    const cargosUnicos = Array.from(new Set(cargos)).sort();

    return [
      { label: "Todos los cargos", value: null },
      ...cargosUnicos.map((nombre) => ({ label: nombre, value: nombre })),
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

    if (cargoFiltro && p.cargo?.nombre !== cargoFiltro) {
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

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (draggedItem) {
      handleAgregarPersonal(draggedItem);
      setDraggedItem(null);
    }
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

  const getInitials = (nombres, apellidos) => {
    const n = nombres?.charAt(0) || "";
    const a = apellidos?.charAt(0) || "";
    return (n + a).toUpperCase();
  };

  const getAvatarColor = (id) => {
    const colors = [
      "#3B82F6",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#EC4899",
      "#14B8A6",
      "#F97316",
    ];
    return colors[Number(id) % colors.length];
  };

  const getAvatarUrl = (urlFotoPersona) => {
    if (!urlFotoPersona) return null;
    return `${import.meta.env.VITE_UPLOADS_URL}/personal/${urlFotoPersona}`;
  };

  const dialogFooter = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-secondary"
        onClick={handleCancelar}
        disabled={loading}
      />
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
        disabled={loading || seleccionados.length === 0}
        loading={loading}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={handleCancelar}
      header="Seleccionar Participantes"
      footer={dialogFooter}
      className="participante-selector-dialog"
      style={{ width: "90vw", maxWidth: "1400px" }}
      modal
    >
      <div className="participante-selector-container">
        <div className="participante-selector-left">
          <div className="filtros-section">
            <div className="p-fluid">
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "end",
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                }}
              >
                <div style={{ flex: 2 }}>
                  <label htmlFor="busqueda">Buscar por nombre</label>
                  <span className="p-input-icon-left">
                    <InputText
                      id="busqueda"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar personal..."
                    />
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <Button
                    label="Limpiar Filtros"
                    icon="pi pi-filter-slash"
                    className="p-button-outlined p-button-secondary"
                    onClick={() => {
                      setBusqueda("");
                      setEmpresaFiltro(null);
                      setCargoFiltro(null);
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "end",
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                }}
              >
                <div style={{ flex: 1 }}>
                  <label htmlFor="empresa">Empresa</label>
                  <Dropdown
                    id="empresa"
                    value={empresaFiltro}
                    options={empresasOptions}
                    onChange={(e) => setEmpresaFiltro(e.value)}
                    placeholder="Seleccione empresa"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="cargo">Cargo</label>
                  <Dropdown
                    id="cargo"
                    value={cargoFiltro}
                    options={cargosOptions}
                    onChange={(e) => setCargoFiltro(e.value)}
                    placeholder="Seleccione cargo"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="personal-list-section">
            <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="pi pi-users"></i>
              Personal Disponible
              <Badge value={personalDisponible.length} severity="success" />
            </h4>
            <ScrollPanel style={{ width: "100%", height: "550px" }}>
              <div className="personal-grid">
                {personalDisponible.map((personal) => (
                  <Card
                    key={personal.id}
                    className="personal-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, personal)}
                    onDoubleClick={() => handleAgregarPersonal(personal)}
                  >
                    <div className="personal-card-content">
                      <Avatar
                        image={getAvatarUrl(personal.urlFotoPersona)}
                        label={
                          !personal.urlFotoPersona
                            ? getInitials(personal.nombres, personal.apellidos)
                            : undefined
                        }
                        size="large"
                        shape="circle"
                        style={{
                          backgroundColor: !personal.urlFotoPersona
                            ? getAvatarColor(personal.id)
                            : undefined,
                          color: "#fff",
                        }}
                      />
                      <div className="personal-info">
                        <div className="personal-nombre">
                          {personal.nombres} {personal.apellidos}
                        </div>
                        <div className="personal-empresa">
                          <i className="pi pi-building mr-1"></i>
                          {personal.empresa?.razonSocial || "Sin empresa"}
                        </div>
                        {personal.cargo && (
                          <div className="personal-cargo">
                            <i className="pi pi-briefcase mr-1"></i>
                            {personal.cargo.descripcion}
                          </div>
                        )}
                      </div>
                      <Button
                        icon="pi pi-plus"
                        className="p-button-rounded p-button-success p-button-sm"
                        onClick={() => handleAgregarPersonal(personal)}
                      />
                    </div>
                  </Card>
                ))}
                {personalDisponible.length === 0 && (
                  <div className="empty-state">
                    <i className="pi pi-users" style={{ fontSize: "3rem" }}></i>
                    <p>No hay personal disponible con los filtros aplicados</p>
                  </div>
                )}
              </div>
            </ScrollPanel>
          </div>
        </div>

        <div
          className="participante-selector-right"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="seleccionados-header">
            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="pi pi-check-circle"></i>
              Participantes Seleccionados
              <Badge value={seleccionados.length} severity="secondary" />
            </h4>
          </div>

          {seleccionados.length === 0 ? (
            <div className="drop-zone-empty">
              <i className="pi pi-users" style={{ fontSize: "4rem" }}></i>
              <p>Arrastra o haz doble clic en el personal para agregarlo</p>
              <p className="hint">
                <i className="pi pi-info-circle mr-1"></i>
                Puedes seleccionar múltiples participantes
              </p>
            </div>
          ) : (
            <ScrollPanel style={{ width: "100%", height: "550px" }}>
              <div className="seleccionados-grid">
                {seleccionados.map((personal) => (
                  <Card key={personal.id} className="seleccionado-card">
                    <div className="seleccionado-card-content">
                      <Button
                        icon="pi pi-times"
                        className="p-button-rounded p-button-danger p-button-sm remove-btn"
                        onClick={() => handleRemoverSeleccionado(personal.id)}
                      />
                      <Avatar
                        image={getAvatarUrl(personal.urlFotoPersona)}
                        label={
                          !personal.urlFotoPersona
                            ? getInitials(personal.nombres, personal.apellidos)
                            : undefined
                        }
                        size="xlarge"
                        shape="circle"
                        style={{
                          backgroundColor: !personal.urlFotoPersona
                            ? getAvatarColor(personal.id)
                            : undefined,
                          color: "#fff",
                        }}
                      />
                      <div className="seleccionado-info">
                        <div className="seleccionado-nombre">
                          {personal.nombres} {personal.apellidos}
                        </div>
                        <div className="seleccionado-empresa">
                          {personal.empresa?.razonSocial || "Sin empresa"}
                        </div>
                        {personal.cargo && (
                          <div className="seleccionado-cargo">
                            {personal.cargo.nombre}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollPanel>
          )}
        </div>
      </div>
    </Dialog>
  );
}
