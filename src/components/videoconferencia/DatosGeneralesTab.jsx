// src/components/videoconferencia/DatosGeneralesTab.jsx
import React, { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { confirmDialog } from "primereact/confirmdialog";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import ParticipanteSelectorDialog from "./ParticipanteSelectorDialog";
import {
  getParticipantesPorVideoconferencia,
  crearParticipanteReunion,
  actualizarParticipanteReunion,
  eliminarParticipanteReunion,
  confirmarParticipanteReunion,
  registrarIngresoParticipante,
  registrarSalidaParticipante,
} from "../../api/participanteReunion";

export default function DatosGeneralesTab({
  formData,
  onChange,
  personalOptions,
  isEdit,
  puedeEditar,
  videoconferenciaId,
  toast,
}) {
  const { usuario } = useAuthStore();

  // Estados para Participantes
  const [participantes, setParticipantes] = useState([]);
  const [loadingParticipantes, setLoadingParticipantes] = useState(false);
  const [showDialogParticipante, setShowDialogParticipante] = useState(false);
  const [editingParticipante, setEditingParticipante] = useState(null);
  const [formDataParticipante, setFormDataParticipante] = useState({
    personalId: null,
    rol: "PARTICIPANTE",
  });

  const rolesOptions = [
    { label: "MODERADOR", value: "MODERADOR" },
    { label: "PARTICIPANTE", value: "PARTICIPANTE" },
    { label: "INVITADO", value: "INVITADO" },
  ];

  // Auto-seleccionar organizador desde usuario logueado (solo al crear)
  useEffect(() => {
    if (!isEdit && usuario?.personalId && !formData.organizadorId) {
      onChange("organizadorId", Number(usuario.personalId));

      // Mostrar toast informativo
      if (toast?.current) {
        setTimeout(() => {
          toast.current.show({
            severity: "info",
            summary: "Organizador Asignado",
            detail: "Se ha asignado automáticamente como organizador de la videoconferencia",
            life: 3000,
          });
        }, 500);
      }
    }
  }, [isEdit, usuario, formData.organizadorId, onChange, toast]);

  // Cargar participantes cuando haya videoconferenciaId
  useEffect(() => {
    if (videoconferenciaId) {
      cargarParticipantes();
    }
  }, [videoconferenciaId]);

  // ============ FUNCIONES PARTICIPANTES ============
  const cargarParticipantes = async () => {
    if (!videoconferenciaId) return;
    setLoadingParticipantes(true);
    try {
      const data = await getParticipantesPorVideoconferencia(videoconferenciaId);
      setParticipantes(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los participantes.",
      });
    }
    setLoadingParticipantes(false);
  };

  const handleAddParticipante = () => {
    setEditingParticipante(null);
    setFormDataParticipante({
      personalId: null,
      rol: "PARTICIPANTE",
    });
    setShowDialogParticipante(true);
  };

  const handleEditParticipante = (rowData) => {
    setEditingParticipante(rowData);
    setFormDataParticipante({
      personalId: Number(rowData.personalId),
      rol: rowData.rol,
    });
    setShowDialogParticipante(true);
  };

  const handleDeleteParticipante = (rowData) => {
    confirmDialog({
      message: `¿Está seguro de eliminar al participante "${rowData.personal?.nombres}"?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      accept: async () => {
        setLoadingParticipantes(true);
        try {
          await eliminarParticipanteReunion(rowData.id);
          toast.current.show({
            severity: "success",
            summary: "Eliminado",
            detail: "Participante eliminado correctamente.",
          });
          cargarParticipantes();
        } catch (err) {
          const errorMsg =
            err.response?.data?.mensaje ||
            err.response?.data?.error ||
            "No se pudo eliminar.";
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: errorMsg,
          });
        }
        setLoadingParticipantes(false);
      },
    });
  };

  const handleGuardarParticipantes = async (participantesSeleccionados) => {
    if (participantesSeleccionados.length === 0) {
      toast.current.show({
        severity: "warn",
        summary: "Sin Selección",
        detail: "Debe seleccionar al menos un participante.",
      });
      return;
    }

    setLoadingParticipantes(true);
    
    // Mostrar mensaje de progreso
    toast.current.show({
      severity: "info",
      summary: "Procesando...",
      detail: `Agregando ${participantesSeleccionados.length} participante(s) y enviando notificaciones. Por favor espere...`,
      life: 8000,
      sticky: false,
    });

    try {
      const promesas = participantesSeleccionados.map((personal) =>
        crearParticipanteReunion({
          videoconferenciaId,
          personalId: Number(personal.id),
          rol: "PARTICIPANTE",
        })
      );

      await Promise.all(promesas);

      toast.current.show({
        severity: "success",
        summary: "¡Completado!",
        detail: `Se agregaron ${participantesSeleccionados.length} participante(s) correctamente. Se enviaron las notificaciones y correos electrónicos.`,
        life: 6000,
      });

      cargarParticipantes();
      setShowDialogParticipante(false);
    } catch (err) {
      const errorMsg =
        err.response?.data?.mensaje ||
        err.response?.data?.error ||
        "No se pudo guardar algunos participantes.";
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: errorMsg,
        life: 5000,
      });
    }
    setLoadingParticipantes(false);
  };

  const handleSubmitParticipante = async () => {
    if (!formDataParticipante.personalId) {
      toast.current.show({
        severity: "warn",
        summary: "Campo Obligatorio",
        detail: "Debe seleccionar un participante.",
      });
      return;
    }

    setLoadingParticipantes(true);
    try {
      const dataToSubmit = {
        videoconferenciaId,
        personalId: formDataParticipante.personalId,
        rol: formDataParticipante.rol,
      };

      await actualizarParticipanteReunion(editingParticipante.id, dataToSubmit);
      toast.current.show({
        severity: "success",
        summary: "Actualizado",
        detail: "Participante actualizado correctamente.",
      });

      cargarParticipantes();
      setShowDialogParticipante(false);
    } catch (err) {
      const errorMsg =
        err.response?.data?.mensaje ||
        err.response?.data?.error ||
        "No se pudo guardar.";
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: errorMsg,
      });
    }
    setLoadingParticipantes(false);
  };

  const handleConfirmarParticipante = async (rowData) => {
    setLoadingParticipantes(true);
    try {
      await confirmarParticipanteReunion(rowData.id);
      toast.current.show({
        severity: "success",
        summary: "Confirmado",
        detail: "Asistencia confirmada.",
      });
      cargarParticipantes();
    } catch (err) {
      const errorMsg =
        err.response?.data?.mensaje ||
        err.response?.data?.error ||
        "No se pudo confirmar.";
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: errorMsg,
      });
    }
    setLoadingParticipantes(false);
  };

  const handleRegistrarIngreso = async (rowData) => {
    setLoadingParticipantes(true);
    try {
      await registrarIngresoParticipante(rowData.id);
      toast.current.show({
        severity: "success",
        summary: "Ingreso Registrado",
        detail: "Ingreso del participante registrado.",
      });
      cargarParticipantes();
    } catch (err) {
      const errorMsg =
        err.response?.data?.mensaje ||
        err.response?.data?.error ||
        "No se pudo registrar.";
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: errorMsg,
      });
    }
    setLoadingParticipantes(false);
  };

  const handleRegistrarSalida = async (rowData) => {
    setLoadingParticipantes(true);
    try {
      await registrarSalidaParticipante(rowData.id);
      toast.current.show({
        severity: "success",
        summary: "Salida Registrada",
        detail: "Salida del participante registrada.",
      });
      cargarParticipantes();
    } catch (err) {
      const errorMsg =
        err.response?.data?.mensaje ||
        err.response?.data?.error ||
        "No se pudo registrar.";
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: errorMsg,
      });
    }
    setLoadingParticipantes(false);
  };


  // ============ TEMPLATES PARTICIPANTES ============
  const nombreBodyTemplate = (rowData) => {
    if (!rowData.personal) return "";
    return `${rowData.personal.nombres} ${rowData.personal.apellidos || ""}`.trim();
  };

  const rolBodyTemplate = (rowData) => {
    const severityMap = {
      MODERADOR: "danger",
      PARTICIPANTE: "info",
      INVITADO: "warning",
    };
    return <Tag value={rowData.rol} severity={severityMap[rowData.rol]} />;
  };

  const confirmadoBodyTemplate = (rowData) => {
    return rowData.confirmado ? (
      <Tag value="SÍ" severity="success" />
    ) : (
      <Tag value="NO" severity="warning" />
    );
  };

  const asistioBodyTemplate = (rowData) => {
    return rowData.asistio ? (
      <Tag value="SÍ" severity="success" />
    ) : (
      <Tag value="NO" severity="secondary" />
    );
  };

  const accionesParticipanteBodyTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {!rowData.confirmado && (
          <Button
            icon="pi pi-check"
            className="p-button-rounded p-button-success p-button-sm"
            tooltip="Confirmar"
            tooltipOptions={{ position: "top" }}
            onClick={() => handleConfirmarParticipante(rowData)}
          />
        )}
        {!rowData.horaIngreso && (
          <Button
            icon="pi pi-sign-in"
            className="p-button-rounded p-button-info p-button-sm"
            tooltip="Registrar Ingreso"
            tooltipOptions={{ position: "top" }}
            onClick={() => handleRegistrarIngreso(rowData)}
          />
        )}
        {rowData.horaIngreso && !rowData.horaSalida && (
          <Button
            icon="pi pi-sign-out"
            className="p-button-rounded p-button-warning p-button-sm"
            tooltip="Registrar Salida"
            tooltipOptions={{ position: "top" }}
            onClick={() => handleRegistrarSalida(rowData)}
          />
        )}
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-info p-button-sm"
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
          onClick={() => handleEditParticipante(rowData)}
          disabled={!puedeEditar}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
          onClick={() => handleDeleteParticipante(rowData)}
          disabled={!puedeEditar}
        />
      </div>
    );
  };

  return (
    <div className="grid">
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="titulo" className="block mb-2 font-bold">
            TÍTULO DE LA REUNION<span style={{ color: "red" }}>*</span>
          </label>
          <InputText
            id="titulo"
            value={formData.titulo}
            onChange={(e) => onChange("titulo", e.target.value)}
            placeholder="INGRESE EL TÍTULO DE LA VIDEOCONFERENCIA"
            style={{ textTransform: "uppercase", fontWeight: "bold" }}
            disabled={!puedeEditar}
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
          <label htmlFor="descripcion" className="block mb-2 font-bold">
            DESCRIPCIÓN
          </label>
          <InputTextarea
            id="descripcion"
            value={formData.descripcion}
            onChange={(e) => onChange("descripcion", e.target.value)}
            rows={3}
            placeholder="INGRESE UNA DESCRIPCIÓN OPCIONAL"
            style={{ fontStyle:"italic" }}
            disabled={!puedeEditar}
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
          <label htmlFor="organizadorId" className="block mb-2 font-bold">
            ORGANIZADOR <span style={{ color: "red" }}>*</span>
          </label>
          <Dropdown
            id="organizadorId"
            value={formData.organizadorId}
            options={personalOptions}
            onChange={(e) => onChange("organizadorId", e.value)}
            placeholder="Seleccione organizador"
            filter
            showClear
            style={{ fontWeight: "bold" }}
            disabled={!puedeEditar}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaInicio" className="block mb-2 font-bold">
            FECHA Y HORA DE INICIO <span style={{ color: "red" }}>*</span>
          </label>
          <Calendar
            id="fechaInicio"
            value={formData.fechaInicio}
            onChange={(e) => onChange("fechaInicio", e.value)}
            showTime
            hourFormat="24"
            dateFormat="dd/mm/yy"
            showIcon
            placeholder="Seleccione fecha y hora"
            style={{ width: "100%" }}
            disabled={!puedeEditar}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="duracionMinutos" className="block mb-2 font-bold">
            DURACIÓN (MINUTOS) <span style={{ color: "red" }}>*</span>
          </label>
          <InputNumber
            id="duracionMinutos"
            value={formData.duracionMinutos}
            onValueChange={(e) => onChange("duracionMinutos", e.value)}
            min={15}
            max={480}
            placeholder="60"
            style={{ fontWeight: "bold" }}
            disabled={!puedeEditar}
          />
        </div>
      </div>

      {isEdit && formData.salaId && (
        <div className="col-12">
          <label htmlFor="salaId" className="block mb-2 font-bold">
            ID DE SALA JITSI
          </label>
          <div className="p-inputgroup">
            <InputText
              id="salaId"
              value={formData.salaId}
              disabled
              style={{ backgroundColor: "#f0f0f0", fontFamily: "monospace" }}
            />
            <Button
              icon="pi pi-copy"
              label="Copiar al Portapapeles"
              className="p-button-info"
              tooltip="Copiar link de invitación"
              tooltipOptions={{ position: "top" }}
              onClick={() => {
                const jitsiUrl = import.meta.env.VITE_JITSI_URL || 'https://meet.megui.com.pe';
                const urlReunion = `${jitsiUrl}/${formData.salaId}`;
                navigator.clipboard.writeText(urlReunion).then(() => {
                  toast.current.show({
                    severity: "success",
                    summary: "Link Copiado",
                    detail: "El link de la reunión ha sido copiado al portapapeles. Puedes compartirlo con personas externas.",
                    life: 4000,
                  });
                }).catch(() => {
                  toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: "No se pudo copiar el link al portapapeles.",
                    life: 3000,
                  });
                });
              }}
            />
          </div>
          <small className="block mt-2" style={{ color: "#6b7280" }}>
            <i className="pi pi-info-circle mr-1"></i>
            Usa el botón de copiar para compartir el link con personas que no tienen usuario en el ERP
          </small>
        </div>
      )}

      {/* SECCIÓN PARTICIPANTES */}
      <div className="col-12 mt-4">
        <div className="flex justify-content-between align-items-center mb-3">
          <h4 style={{ margin: 0 }}>
            <i className="pi pi-users mr-2"></i>
            PARTICIPANTES DE LA VIDEOCONFERENCIA ({participantes.length})
          </h4>
          {puedeEditar && (
            <Button
              label="Agregar Participante"
              icon="pi pi-plus"
              onClick={handleAddParticipante}
              className="p-button-success"
              size="small"
              disabled={!videoconferenciaId}
              tooltip={!videoconferenciaId ? "Guarde la videoconferencia primero para agregar participantes" : ""}
              tooltipOptions={{ position: "top" }}
            />
          )}
        </div>

        {!videoconferenciaId && (
          <div className="text-center p-4" style={{ backgroundColor: "#f8f9fa", borderRadius: "8px", color: "#6c757d" }}>
            <i className="pi pi-info-circle" style={{ fontSize: "2rem" }}></i>
            <p className="mt-2 mb-0">
              <strong>Guarde la videoconferencia primero</strong> para poder agregar participantes.
            </p>
          </div>
        )}

        {videoconferenciaId && (
          <DataTable
            value={participantes}
            loading={loadingParticipantes}
            emptyMessage="No hay participantes agregados."
            responsiveLayout="scroll"
            stripedRows
            size="small"
          >
            <Column
              field="personal"
              header="NOMBRE"
              body={nombreBodyTemplate}
              style={{ minWidth: "200px" }}
            />
            <Column
              field="rol"
              header="ROL"
              body={rolBodyTemplate}
              style={{ minWidth: "120px" }}
            />
            <Column
              field="confirmado"
              header="CONFIRMADO"
              body={confirmadoBodyTemplate}
              style={{ minWidth: "100px" }}
            />
            <Column
              field="asistio"
              header="ASISTIÓ"
              body={asistioBodyTemplate}
              style={{ minWidth: "100px" }}
            />
            <Column
              header="ACCIONES"
              body={accionesParticipanteBodyTemplate}
              style={{ minWidth: "250px" }}
            />
          </DataTable>
        )}

        {/* Selector Avanzado de Participantes */}
        {!editingParticipante && (
          <ParticipanteSelectorDialog
            visible={showDialogParticipante}
            onHide={() => setShowDialogParticipante(false)}
            personalOptions={personalOptions}
            participantesActuales={participantes}
            onGuardar={handleGuardarParticipantes}
            loading={loadingParticipantes}
          />
        )}

        {/* Dialog para Editar Participante */}
        {editingParticipante && (
          <Dialog
            visible={showDialogParticipante}
            onHide={() => setShowDialogParticipante(false)}
            header="EDITAR PARTICIPANTE"
            modal
            style={{ width: "500px" }}
          >
            <div className="p-fluid">
              <div className="field">
                <label htmlFor="personalId" className="block mb-2 font-bold">
                  PARTICIPANTE <span style={{ color: "red" }}>*</span>
                </label>
                <Dropdown
                  id="personalId"
                  value={formDataParticipante.personalId}
                  options={personalOptions}
                  onChange={(e) =>
                    setFormDataParticipante({ ...formDataParticipante, personalId: e.value })
                  }
                  placeholder="Seleccione participante"
                  filter
                  showClear
                  style={{ fontWeight: "bold" }}
                  disabled
                />
              </div>

              <div className="field">
                <label htmlFor="rol" className="block mb-2 font-bold">
                  ROL <span style={{ color: "red" }}>*</span>
                </label>
                <Dropdown
                  id="rol"
                  value={formDataParticipante.rol}
                  options={rolesOptions}
                  onChange={(e) =>
                    setFormDataParticipante({ ...formDataParticipante, rol: e.value })
                  }
                  placeholder="Seleccione rol"
                  style={{ fontWeight: "bold" }}
                />
              </div>

              <div className="flex justify-content-end gap-2 mt-3">
                <Button
                  label="Cancelar"
                  icon="pi pi-times"
                  className="p-button-secondary"
                  onClick={() => setShowDialogParticipante(false)}
                />
                <Button
                  label="Guardar"
                  icon="pi pi-save"
                  onClick={handleSubmitParticipante}
                  disabled={loadingParticipantes}
                />
              </div>
            </div>
          </Dialog>
        )}
      </div>

    </div>
  );
}
