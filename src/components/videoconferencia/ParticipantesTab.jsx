// src/components/videoconferencia/ParticipantesTab.jsx
import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import {
  getParticipantesPorVideoconferencia,
  crearParticipanteReunion,
  actualizarParticipanteReunion,
  eliminarParticipanteReunion,
  confirmarParticipanteReunion,
  registrarIngresoParticipante,
  registrarSalidaParticipante,
} from "../../api/participanteReunion";

export default function ParticipantesTab({
  videoconferenciaId,
  personalOptions,
  puedeEditar,
  toast,
  onCountChange,
}) {
  const [participantes, setParticipantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    personalId: null,
    rol: "PARTICIPANTE",
  });

  const rolesOptions = [
    { label: "MODERADOR", value: "MODERADOR" },
    { label: "PARTICIPANTE", value: "PARTICIPANTE" },
    { label: "INVITADO", value: "INVITADO" },
  ];

  useEffect(() => {
    if (videoconferenciaId) {
      cargarParticipantes();
    }
  }, [videoconferenciaId]);

  const cargarParticipantes = async () => {
    if (!videoconferenciaId) return;
    setLoading(true);
    try {
      const data = await getParticipantesPorVideoconferencia(videoconferenciaId);
      setParticipantes(data);
      if (onCountChange) onCountChange(data.length);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los participantes.",
      });
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditing(null);
    setFormData({
      personalId: null,
      rol: "PARTICIPANTE",
    });
    setShowDialog(true);
  };

  const handleEdit = (rowData) => {
    setEditing(rowData);
    setFormData({
      personalId: Number(rowData.personalId),
      rol: rowData.rol,
    });
    setShowDialog(true);
  };

  const handleDelete = (rowData) => {
    confirmDialog({
      message: `¿Está seguro de eliminar al participante "${rowData.personal?.nombres}"?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      accept: async () => {
        setLoading(true);
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
        setLoading(false);
      },
    });
  };

  const handleSubmit = async () => {
    if (!formData.personalId) {
      toast.current.show({
        severity: "warn",
        summary: "Campo Obligatorio",
        detail: "Debe seleccionar un participante.",
      });
      return;
    }

    setLoading(true);
    try {
      const dataToSubmit = {
        videoconferenciaId,
        personalId: formData.personalId,
        rol: formData.rol,
      };

      if (editing) {
        await actualizarParticipanteReunion(editing.id, dataToSubmit);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Participante actualizado correctamente.",
        });
      } else {
        await crearParticipanteReunion(dataToSubmit);
        toast.current.show({
          severity: "success",
          summary: "Agregado",
          detail: "Participante agregado correctamente.",
        });
      }

      cargarParticipantes();
      setShowDialog(false);
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
    setLoading(false);
  };

  const handleConfirmar = async (rowData) => {
    setLoading(true);
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
    setLoading(false);
  };

  const handleRegistrarIngreso = async (rowData) => {
    setLoading(true);
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
    setLoading(false);
  };

  const handleRegistrarSalida = async (rowData) => {
    setLoading(true);
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
    setLoading(false);
  };

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

  const accionesBodyTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {!rowData.confirmado && (
          <Button
            icon="pi pi-check"
            className="p-button-rounded p-button-success p-button-sm"
            tooltip="Confirmar"
            tooltipOptions={{ position: "top" }}
            onClick={() => handleConfirmar(rowData)}
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
          onClick={() => handleEdit(rowData)}
          disabled={!puedeEditar}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
          onClick={() => handleDelete(rowData)}
          disabled={!puedeEditar}
        />
      </div>
    );
  };

  return (
    <div>
      <ConfirmDialog />
      <div className="flex justify-content-between align-items-center mb-3">
        <h4>PARTICIPANTES DE LA VIDEOCONFERENCIA</h4>
        {puedeEditar && (
          <Button
            label="Agregar Participante"
            icon="pi pi-plus"
            onClick={handleAdd}
            className="p-button-success"
          />
        )}
      </div>

      <DataTable
        value={participantes}
        loading={loading}
        emptyMessage="No hay participantes agregados."
        responsiveLayout="scroll"
        stripedRows
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
          body={accionesBodyTemplate}
          style={{ minWidth: "250px" }}
        />
      </DataTable>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editing ? "EDITAR PARTICIPANTE" : "AGREGAR PARTICIPANTE"}
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
              value={formData.personalId}
              options={personalOptions}
              onChange={(e) => setFormData({ ...formData, personalId: e.value })}
              placeholder="Seleccione participante"
              filter
              showClear
              style={{ fontWeight: "bold" }}
            />
          </div>

          <div className="field">
            <label htmlFor="rol" className="block mb-2 font-bold">
              ROL <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              id="rol"
              value={formData.rol}
              options={rolesOptions}
              onChange={(e) => setFormData({ ...formData, rol: e.value })}
              placeholder="Seleccione rol"
              style={{ fontWeight: "bold" }}
            />
          </div>

          <div className="flex justify-content-end gap-2 mt-3">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-secondary"
              onClick={() => setShowDialog(false)}
            />
            <Button
              label="Guardar"
              icon="pi pi-save"
              onClick={handleSubmit}
              disabled={loading}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
