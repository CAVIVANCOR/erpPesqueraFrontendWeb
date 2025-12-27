import React from "react";
import { Avatar } from "primereact/avatar";
import { Tooltip } from "primereact/tooltip";
import { ScrollPanel } from "primereact/scrollpanel";
import { Badge } from "primereact/badge";
import "./AvatarGroupSelector.css";

export default function AvatarGroupSelector({
  personalDisponible,
  seleccionados,
  onAgregarPersonal,
  onRemoverSeleccionado,
  onDragStart,
}) {
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

  const TooltipContent = ({ personal }) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontWeight: 600, marginBottom: '4px' }}>
        {personal.nombres} {personal.apellidos}
      </div>
      <div style={{ fontSize: '0.85rem', color: '#d1d5db' }}>
        {personal.empresa?.razonSocial || "Sin empresa"}
      </div>
      {personal.cargo && (
        <div style={{ fontSize: '0.85rem', color: '#d1d5db' }}>
          {personal.cargo.descripcion}
        </div>
      )}
    </div>
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  return (
    <div className="avatar-group-selector-container">
      {/* SECCIÓN: PERSONAL DISPONIBLE */}
      <div className="avatar-group-section">
        <h4 className="avatar-group-title">
          <i className="pi pi-users"></i>
          Personal Disponible
          <Badge value={personalDisponible.length} severity="success" />
        </h4>

        {personalDisponible.length === 0 ? (
          <div className="avatar-group-empty">
            <i className="pi pi-users" style={{ fontSize: "1rem", color: "#94a3b8" }}></i>
            <p>No hay personal disponible</p>
          </div>
        ) : (
          <ScrollPanel style={{ width: "100%", height: "100%" }}>
            <div className="avatar-group">
              {personalDisponible.map((personal, index) => (
                <div
                  key={personal.id}
                  className={`avatar-group-item avatar-disponible-${personal.id}`}
                  draggable
                  onDragStart={(e) => {
                    onDragStart(e, personal);
                    e.dataTransfer.setData('personal', JSON.stringify(personal));
                  }}
                  onDoubleClick={() => onAgregarPersonal(personal)}
                  style={{
                    zIndex: personalDisponible.length - index,
                  }}
                >
                  <Tooltip
                    target={`.avatar-disponible-${personal.id} .avatar-group-avatar`}
                    position="bottom"
                    mouseTrack
                    mouseTrackTop={15}
                    pt={{
                      text: {
                        style: {
                          backgroundColor: "#1a1a1a",
                          color: "#ffffff",
                          fontSize: "0.75rem",
                          padding: "8px 14px",
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                        }
                      },
                      arrow: {
                        style: {
                          borderBottomColor: "#1a1a1a"
                        }
                      }
                    }}
                  >
                    <TooltipContent personal={personal} />
                  </Tooltip>
                  <Avatar
                    image={getAvatarUrl(personal.urlFotoPersona)}
                    label={
                      !personal.urlFotoPersona
                        ? getInitials(personal.nombres, personal.apellidos)
                        : undefined
                    }
                    size="large"
                    shape="circle"
                    className="avatar-group-avatar"
                    style={{
                      backgroundColor: !personal.urlFotoPersona
                        ? getAvatarColor(personal.id)
                        : undefined,
                      color: "#fff",
                      border: "3px solid #fff",
                      cursor: "grab",
                    }}
                  />
                </div>
              ))}
            </div>
          </ScrollPanel>
        )}
        <div className="avatar-group-hint">
          <i className="pi pi-info-circle"></i>
          Arrastra o haz doble clic para agregar
        </div>
      </div>

      {/* SECCIÓN: PARTICIPANTES SELECCIONADOS */}
      <div 
        className="avatar-group-section"
        onDragOver={handleDragOver}
        onDrop={(e) => {
          e.preventDefault();
          const personalData = e.dataTransfer.getData('personal');
          if (personalData) {
            const personal = JSON.parse(personalData);
            onAgregarPersonal(personal);
          }
        }}
      >
        <h4 className="avatar-group-title">
          <i className="pi pi-check-circle"></i>
          Participantes Seleccionados
          <Badge value={seleccionados.length} severity="info" />
        </h4>

        {seleccionados.length === 0 ? (
          <div className="avatar-group-empty">
            <i className="pi pi-users" style={{ fontSize: "1rem", color: "#94a3b8" }}></i>
            <p>Arrastra participantes aquí</p>
          </div>
        ) : (
          <ScrollPanel style={{ width: "100%", height: "100%" }}>
            <div className="avatar-group">
              {seleccionados.map((personal, index) => (
                <div
                  key={personal.id}
                  className={`avatar-group-item avatar-seleccionado-${personal.id}`}
                  style={{
                    zIndex: seleccionados.length - index,
                  }}
                >
                  <Tooltip
                    target={`.avatar-seleccionado-${personal.id} .avatar-group-avatar`}
                    position="bottom"
                    mouseTrack
                    mouseTrackTop={15}
                    pt={{
                      text: {
                        style: {
                          backgroundColor: "#1a1a1a",
                          color: "#ffffff",
                          fontSize: "0.75rem",
                          padding: "8px 14px",
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                        }
                      },
                      arrow: {
                        style: {
                          borderBottomColor: "#1a1a1a"
                        }
                      }
                    }}
                  >
                    <TooltipContent personal={personal} />
                  </Tooltip>
                  <div className="avatar-wrapper-with-remove">
                    <Avatar
                      image={getAvatarUrl(personal.urlFotoPersona)}
                      label={
                        !personal.urlFotoPersona
                          ? getInitials(personal.nombres, personal.apellidos)
                          : undefined
                      }
                      size="large"
                      shape="circle"
                      className="avatar-group-avatar"
                      style={{
                        backgroundColor: !personal.urlFotoPersona
                          ? getAvatarColor(personal.id)
                          : undefined,
                        color: "#fff",
                        border: "3px solid #fff",
                      }}
                    />
                    <button
                      className="avatar-remove-btn"
                      onClick={() => onRemoverSeleccionado(personal.id)}
                      title="Remover"
                    >
                      <i className="pi pi-times"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollPanel>
        )}
        <div className="avatar-group-hint">
          <i className="pi pi-info-circle"></i>
          Haz clic en la X para remover
        </div>
      </div>
    </div>
  );
}