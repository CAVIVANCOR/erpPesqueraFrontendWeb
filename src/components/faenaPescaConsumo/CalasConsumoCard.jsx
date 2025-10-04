// src/components/faenaPescaConsumo/CalasConsumoCard.jsx
// Card para gestionar calas de FaenaPescaConsumo con sus especies pescadas
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { confirmDialog } from "primereact/confirmdialog";
import { Controller, useForm } from "react-hook-form";
import { getResponsiveFontSize } from "../../utils/utils";
import { 
  capturarGPS, 
  formatearCoordenadas, 
} from "../../utils/gpsUtils";
import {
  getCalasFaenaConsumoPorFaena,
  crearCalaFaenaConsumo,
  actualizarCalaFaenaConsumo,
  eliminarCalaFaenaConsumo,
} from "../../api/calaFaenaConsumo";
import DetalleCalasConsumoEspecieForm from "./DetalleCalasConsumoEspecieForm";

export default function CalasConsumoCard({
  faenaPescaConsumoId,
  novedadPescaConsumoId,
  faenaData,
  bahias: bahiasProps = [],
  motoristas: motoristasProps = [],
  patrones: patronesProps = [],
  embarcaciones: embarcacionesProps = [],
  especies = [],
  onDataChange,
}) {
  const [calas, setCalas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogCalaVisible, setDialogCalaVisible] = useState(false);
  const [editingCala, setEditingCala] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  
  // Estados para GPS (string vacío como en DetalleCalasForm)
  const [latitud, setLatitud] = useState("");
  const [longitud, setLongitud] = useState("");
  
  // Estados para campos de fecha
  const [createdAt, setCreatedAt] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  
  // Estados para dropdowns deshabilitados
  const [bahias, setBahias] = useState(bahiasProps);
  const [motoristas, setMotoristas] = useState(motoristasProps);
  const [patrones, setPatrones] = useState(patronesProps);
  const [embarcaciones, setEmbarcaciones] = useState(embarcacionesProps);
  
  // Estados para valores seleccionados en dropdowns
  const [selectedBahiaId, setSelectedBahiaId] = useState(null);
  const [selectedMotoristaId, setSelectedMotoristaId] = useState(null);
  const [selectedPatronId, setSelectedPatronId] = useState(null);
  const [selectedEmbarcacionId, setSelectedEmbarcacionId] = useState(null);
  
  const toast = useRef(null);

  const {
    control: controlCala,
    handleSubmit: handleSubmitCala,
    reset: resetCala,
    setValue: setValueCala,
    formState: { errors: errorsCala },
  } = useForm();

  useEffect(() => {
    if (faenaPescaConsumoId) {
      cargarCalas();
    }
  }, [faenaPescaConsumoId]);

  useEffect(() => {
    if (
      bahiasProps?.length > 0 &&
      motoristasProps?.length > 0 &&
      patronesProps?.length > 0 &&
      embarcacionesProps?.length > 0
    ) {
      // Normalizar los arrays para convertir values a Number y asegurar labels correctos
      const bahiasNormalizadas = bahiasProps.map((item) => ({
        value: Number(item.value),
        label: item.label,
      }));
      const motoristasNormalizados = motoristasProps.map((item) => ({
        value: Number(item.value),
        label: item.label,
      }));
      const patronesNormalizados = patronesProps.map((item) => ({
        value: Number(item.value),
        label: item.label,
      }));
      const embarcacionesNormalizadas = embarcacionesProps.map((item) => ({
        value: Number(item.value),
        label: item.label,
      }));
      setBahias(bahiasNormalizadas);
      setMotoristas(motoristasNormalizados);
      setPatrones(patronesNormalizados);
      setEmbarcaciones(embarcacionesNormalizadas);

      // Asignar valores seleccionados desde faenaData si están disponibles
      if (faenaData) {
        setSelectedBahiaId(Number(faenaData.bahiaId));
        setSelectedMotoristaId(Number(faenaData.motoristaId));
        setSelectedPatronId(Number(faenaData.patronId));
        setSelectedEmbarcacionId(Number(faenaData.embarcacionId));
      }
    }
  }, [
    bahiasProps,
    motoristasProps,
    patronesProps,
    embarcacionesProps,
    faenaData,
  ]);

  const cargarCalas = async () => {
    try {
      setLoading(true);
      const data = await getCalasFaenaConsumoPorFaena(faenaPescaConsumoId);
      setCalas(data);
    } catch (error) {
      console.error("Error al cargar calas:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar calas",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // ===== GESTIÓN DE CALAS =====
  const handleNuevaCala = () => {
    setEditingCala(null);
    setLatitud("");
    setLongitud("");
    setCreatedAt(new Date());
    setUpdatedAt(new Date());
    
    // Asignar valores directamente desde faenaData
    if (faenaData) {
      const bahiaIdNum = Number(faenaData.bahiaId);
      const motoristaIdNum = Number(faenaData.motoristaId);
      const patronIdNum = Number(faenaData.patronId);
      const embarcacionIdNum = Number(faenaData.embarcacionId);

      setSelectedBahiaId(bahiaIdNum);
      setSelectedMotoristaId(motoristaIdNum);
      setSelectedPatronId(patronIdNum);
      setSelectedEmbarcacionId(embarcacionIdNum);
    }
    
    resetCala({
      bahiaId: null,
      motoristaId: null,
      patronId: null,
      embarcacionId: null,
      fechaHoraInicio: new Date(),
      fechaHoraFin: null,
      latitud: null,
      longitud: null,
      profundidadM: null,
      toneladasCapturadas: null,
      observaciones: "",
    });
    setDialogCalaVisible(true);
  };

  const handleEditarCala = (cala) => {
    setEditingCala(cala);
    setLatitud(cala.latitud || "");
    setLongitud(cala.longitud || "");
    setCreatedAt(cala.createdAt ? new Date(cala.createdAt) : null);
    setUpdatedAt(cala.updatedAt ? new Date(cala.updatedAt) : null);
    
    // Cargar valores de dropdowns
    setSelectedBahiaId(cala.bahiaId ? Number(cala.bahiaId) : null);
    setSelectedMotoristaId(cala.motoristaId ? Number(cala.motoristaId) : null);
    setSelectedPatronId(cala.patronId ? Number(cala.patronId) : null);
    setSelectedEmbarcacionId(cala.embarcacionId ? Number(cala.embarcacionId) : null);
    
    resetCala({
      bahiaId: cala.bahiaId ? Number(cala.bahiaId) : null,
      motoristaId: cala.motoristaId ? Number(cala.motoristaId) : null,
      patronId: cala.patronId ? Number(cala.patronId) : null,
      embarcacionId: cala.embarcacionId ? Number(cala.embarcacionId) : null,
      fechaHoraInicio: cala.fechaHoraInicio
        ? new Date(cala.fechaHoraInicio)
        : null,
      fechaHoraFin: cala.fechaHoraFin ? new Date(cala.fechaHoraFin) : null,
      latitud: cala.latitud || null,
      longitud: cala.longitud || null,
      profundidadM: cala.profundidadM || null,
      toneladasCapturadas: cala.toneladasCapturadas || null,
      observaciones: cala.observaciones || "",
    });
    setDialogCalaVisible(true);
  };

  const handleEliminarCala = (cala) => {
    confirmDialog({
      message: "¿Está seguro de eliminar esta cala?",
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await eliminarCalaFaenaConsumo(cala.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Cala eliminada correctamente",
            life: 3000,
          });
          cargarCalas();
          onDataChange?.();
        } catch (error) {
          console.error("Error al eliminar cala:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Error al eliminar la cala",
            life: 3000,
          });
        }
      },
    });
  };

  const guardarCala = async () => {
    // Obtener valores directamente desde faenaData para evitar problemas de asincronía
    const bahiaIdNum = faenaData?.bahiaId ? Number(faenaData.bahiaId) : null;
    const motoristaIdNum = faenaData?.motoristaId ? Number(faenaData.motoristaId) : null;
    const patronIdNum = faenaData?.patronId ? Number(faenaData.patronId) : null;
    const embarcacionIdNum = faenaData?.embarcacionId ? Number(faenaData.embarcacionId) : null;

    const data = {
      bahiaId: bahiaIdNum,
      motoristaId: motoristaIdNum,
      patronId: patronIdNum,
      embarcacionId: embarcacionIdNum,
      fechaHoraInicio: controlCala._formValues.fechaHoraInicio,
      fechaHoraFin: controlCala._formValues.fechaHoraFin,
      latitud: latitud,
      longitud: longitud,
      profundidadM: controlCala._formValues.profundidadM,
      toneladasCapturadas: controlCala._formValues.toneladasCapturadas,
      observaciones: controlCala._formValues.observaciones,
    };

    console.log("📤 Datos a enviar:", data); // Para debug
    await onSubmitCala(data);
  };

  const finalizarCalaAction = async (cala) => {
    if (!cala || !cala.fechaHoraInicio || cala.fechaHoraFin) {
      return;
    }

    try {
      const ahora = new Date();
      setValueCala("fechaHoraFin", ahora);
      
      const calaActualizada = {
        ...cala,
        fechaHoraFin: ahora.toISOString(),
      };
      
      await actualizarCalaFaenaConsumo(cala.id, calaActualizada);
      
      toast.current?.show({
        severity: "success",
        summary: "Cala Finalizada",
        detail: `Cala finalizada a las ${ahora.toLocaleTimeString()}`,
        life: 3000,
      });
      
      cargarCalas();
      onDataChange?.();
      
    } catch (error) {
      console.error("Error finalizando cala:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al finalizar la cala",
        life: 3000,
      });
    }
  };

  const onSubmitCala = async (data) => {
    try {
      const payload = {
        faenaPescaConsumoId: Number(faenaPescaConsumoId),
        novedadPescaConsumoId: Number(novedadPescaConsumoId),
        bahiaId: data.bahiaId ? Number(data.bahiaId) : null,
        motoristaId: data.motoristaId ? Number(data.motoristaId) : null,
        patronId: data.patronId ? Number(data.patronId) : null,
        embarcacionId: data.embarcacionId ? Number(data.embarcacionId) : null,
        fechaHoraInicio: data.fechaHoraInicio
          ? new Date(data.fechaHoraInicio).toISOString()
          : null,
        fechaHoraFin: data.fechaHoraFin
          ? new Date(data.fechaHoraFin).toISOString()
          : null,
        latitud: latitud || null,
        longitud: longitud || null,
        profundidadM: data.profundidadM || null,
        toneladasCapturadas: data.toneladasCapturadas || null,
        observaciones: data.observaciones?.trim() || null,
      };

      if (editingCala) {
        await actualizarCalaFaenaConsumo(editingCala.id, payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cala actualizada correctamente",
          life: 3000,
        });
      } else {
        await crearCalaFaenaConsumo(payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cala creada correctamente",
          life: 3000,
        });
      }

      setDialogCalaVisible(false);
      cargarCalas();
      onDataChange?.();
    } catch (error) {
      console.error("Error al guardar cala:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar la cala",
        life: 3000,
      });
    }
  };

  // Templates para Calas
  const formatearFecha = (fecha) => {
    if (!fecha) return "";
    return new Date(fecha).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fechaHoraTemplate = (rowData, field) => {
    return rowData[field.field]
      ? formatearFecha(rowData[field.field])
      : "-";
  };

  const toneladasTemplate = (rowData) => {
    return rowData.toneladasCapturadas
      ? `${Number(rowData.toneladasCapturadas).toFixed(2)} TM`
      : "-";
  };

  const accionesCalaTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success"
          onClick={() => handleEditarCala(rowData)}
          tooltip="Editar"
          size="small"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger"
          onClick={() => handleEliminarCala(rowData)}
          tooltip="Eliminar"
          size="small"
        />
      </div>
    );
  };

  // Estados para determinar si los botones están habilitados
  const puedeFinalizarCala = editingCala?.fechaHoraInicio && !editingCala?.fechaHoraFin;
  const calaFinalizada = editingCala?.fechaHoraInicio && editingCala?.fechaHoraFin;

  // Header del DataTable
  const header = (
    <div className="flex align-items-center gap-2">
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 2, display: "flex", flexDirection: "column" }}>
          <h2>DETALLE DE CALAS</h2>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Button
            label="Nueva Cala"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={handleNuevaCala}
            disabled={!faenaPescaConsumoId}
            type="button"
            tooltip="Agregar nueva cala"
            tooltipOptions={{ position: "top" }}
            raised
            outlined
            severity="success"
            size="small"
          />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <span className="p-input-icon-left">
            <InputText
              type="search"
              onInput={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar..."
            />
          </span>
        </div>
      </div>
    </div>
  );

  // Dialog Headers y Footers
  const calaDialogHeader = (
    <div className="flex justify-content-center mb-4">
      <Tag
        value={"Cala"}
        severity="info"
        style={{
          fontSize: "1.1rem",
          padding: "0.75rem 1.25rem",
          textTransform: "uppercase",
          fontWeight: "bold",
          textAlign: "center",
          width: "100%",
        }}
      />
    </div>
  );

  const calaDialogFooter = (
    <>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text"
        onClick={() => setDialogCalaVisible(false)}
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        className="p-button-text"
        onClick={handleSubmitCala(onSubmitCala)}
      />
    </>
  );

  if (!faenaPescaConsumoId) {
    return (
      <Card title="Calas">
        <p className="text-center text-500">
          Debe crear la faena primero para gestionar calas
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card
        className="mt-4"
        pt={{
          header: { style: { display: "none" } },
          body: { style: { paddingTop: "0" } },
        }}
      >
        <Toast ref={toast} style={{ zIndex: 9999 }} baseZIndex={9999} />
        <DataTable
          value={calas}
          loading={loading}
          emptyMessage="No hay calas registradas"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          className="datatable-responsive"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} calas"
          globalFilter={globalFilter}
          header={header}
          style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
          onRowClick={(e) => handleEditarCala(e.data)}
        >
          <Column
            field="id"
            header="ID"
            sortable
            style={{ minWidth: "4rem" }}
          />
          <Column
            field="latitud"
            header="Latitud"
            sortable
            body={(rowData) => {
              const latitudNormalizada = rowData.latitud
                ? parseFloat(rowData.latitud).toFixed(8)
                : "0.00000000";
              return latitudNormalizada;
            }}
            style={{ minWidth: "8rem" }}
          />
          <Column
            field="longitud"
            header="Longitud"
            sortable
            body={(rowData) => {
              const longitudNormalizada = rowData.longitud
                ? parseFloat(rowData.longitud).toFixed(8)
                : "0.00000000";
              return longitudNormalizada;
            }}
            style={{ minWidth: "8rem" }}
          />
          <Column
            field="fechaHoraInicio"
            header="Fecha Inicio"
            body={(rowData) => fechaHoraTemplate(rowData, { field: "fechaHoraInicio" })}
            sortable
            style={{ minWidth: "10rem" }}
          />
          <Column
            field="fechaHoraFin"
            header="Fecha Fin"
            body={(rowData) => fechaHoraTemplate(rowData, { field: "fechaHoraFin" })}
            sortable
            style={{ minWidth: "10rem" }}
          />
          <Column
            field="toneladasCapturadas"
            header="Toneladas"
            body={toneladasTemplate}
            sortable
            style={{ minWidth: "8rem" }}
          />
          <Column
            header="Acciones"
            body={accionesCalaTemplate}
            style={{ minWidth: "10rem" }}
          />
        </DataTable>
      </Card>

      {/* Dialog para Cala */}
      <Dialog
        visible={dialogCalaVisible}
        onHide={() => setDialogCalaVisible(false)}
        header={calaDialogHeader}
        footer={calaDialogFooter}
        style={{ width: "1200px" }}
        breakpoints={{ "960px": "85vw", "641px": "95vw" }}
        modal
        className="p-fluid"
      >
        <div className="grid">
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="bahiaId">Bahía</label>
              <Dropdown
                id="bahiaId"
                value={selectedBahiaId}
                options={bahias}
                placeholder="Bahía (automático)"
                disabled
                style={{ fontWeight: "bold" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="motoristaId">Motorista</label>
              <Dropdown
                id="motoristaId"
                value={selectedMotoristaId}
                options={motoristas}
                placeholder="Motorista (automático)"
                disabled
                style={{ fontWeight: "bold" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="patronId">Patrón</label>
              <Dropdown
                id="patronId"
                value={selectedPatronId}
                options={patrones}
                placeholder="Patrón (automático)"
                disabled
                style={{ fontWeight: "bold" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="embarcacionId">Embarcación</label>
              <Dropdown
                id="embarcacionId"
                value={selectedEmbarcacionId}
                options={embarcaciones}
                placeholder="Embarcación (automático)"
                disabled
                style={{ fontWeight: "bold" }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "end",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
              marginTop: 10,
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="createdAt">Fecha Creación</label>
              <Calendar
                id="createdAt"
                value={createdAt}
                showTime
                dateFormat="dd/mm/yy"
                showIcon
                disabled
                placeholder="Se asigna automáticamente"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="updatedAt">Fecha Actualización</label>
              <Calendar
                id="updatedAt"
                value={updatedAt}
                showTime
                dateFormat="dd/mm/yy"
                showIcon
                disabled
                placeholder="Se actualiza automáticamente"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="fechaHoraInicio">Fecha y Hora Inicio</label>
              <Controller
                name="fechaHoraInicio"
                control={controlCala}
                render={({ field }) => (
                  <Calendar
                    id="fechaHoraInicio"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    inputStyle={{ fontWeight: "bold" }}
                    showTime
                    dateFormat="dd/mm/yy"
                    showIcon
                    disabled
                  />
                )}
              />
            </div>
          </div>

          {/* Componente de coordenadas GPS completo */}
          <div
            style={{
              border: "6px solid #1fad2f",
              backgroundColor: "#edf9f2",
              padding: "0.5rem",
              borderRadius: "8px",
              marginTop: "1rem",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <Button
                onClick={async () => {
                  try {
                    await capturarGPS(
                      async (latitude, longitude, accuracy) => {
                        // Callback de éxito usando funciones genéricas
                        setLatitud(latitude);
                        setLongitud(longitude);
                        setValueCala("latitud", latitude);
                        setValueCala("longitud", longitude);
                        
                        toast.current?.show({
                          severity: "success",
                          summary: "GPS capturado",
                          detail: `GPS capturado con precisión de ${accuracy.toFixed(1)}m. Guardando cala...`,
                          life: 3000,
                        });

                        // Guardar automáticamente la cala después de capturar GPS
                        try {
                          await guardarCala();
                        } catch (error) {
                          console.error("Error al guardar cala automáticamente:", error);
                          toast.current?.show({
                            severity: "error",
                            summary: "Error",
                            detail: "GPS capturado pero error al guardar la cala",
                            life: 4000,
                          });
                        }
                      },
                      (errorMessage) => {
                        // Callback de error usando funciones genéricas
                        toast.current?.show({
                          severity: "error",
                          summary: "Error",
                          detail: errorMessage,
                          life: 3000,
                        });
                      }
                    );
                  } catch (error) {
                    console.error("Error capturando GPS:", error);
                  }
                }}
                disabled={loading}
                label="Capturar GPS"
                icon="pi pi-map-marker"
                className="p-button-success"
                raised
                severity="success"
                size="large"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Latitud
              </label>
              <input
                type="number"
                value={latitud || ""}
                onChange={(e) => setLatitud(parseFloat(e.target.value) || "")}
                disabled
                step="0.000001"
                placeholder="Ej: -12.345678"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
              <small style={{ color: "#666" }}>
                Formato decimal (+ Norte, - Sur)
              </small>
            </div>

            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Longitud
              </label>
              <input
                type="number"
                value={longitud || ""}
                onChange={(e) => setLongitud(parseFloat(e.target.value) || "")}
                disabled
                step="0.000001"
                placeholder="Ej: -77.123456"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
              <small style={{ color: "#666" }}>
                Formato decimal (+ Este, - Oeste)
              </small>
            </div>

            <div style={{ flex: 1 }}>
              {/* Conversión a formato DMS para referencia usando funciones genéricas */}
              {(latitud !== 0 || longitud !== 0) && (
                <div
                  style={{
                    marginTop: "15px",
                    padding: "10px",
                    backgroundColor: "#f3fce8",
                    borderRadius: "4px",
                  }}
                >
                  <strong>📐 Formato DMS (Marítimo):</strong>
                  <div style={{ marginTop: "5px", fontSize: "14px" }}>
                    <div>
                      <strong>Lat:</strong> {formatearCoordenadas(latitud, longitud).latitudDMS}
                    </div>
                    <div>
                      <strong>Lon:</strong> {formatearCoordenadas(latitud, longitud).longitudDMS}
                    </div>
                  </div>
                </div>
              )}
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
              <Button
                label="Finalizar Cala"
                icon="pi pi-stop"
                className="p-button-warning"
                onClick={() => finalizarCalaAction(editingCala)}
                size="large"
                disabled={!puedeFinalizarCala || loading}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="fechaHoraFin">Fecha y Hora Fin</label>
              <Controller
                name="fechaHoraFin"
                control={controlCala}
                render={({ field }) => (
                  <Calendar
                    id="fechaHoraFin"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    inputStyle={{ fontWeight: "bold" }}
                    showTime
                    dateFormat="dd/mm/yy"
                    showIcon
                    disabled={loading || calaFinalizada}
                  />
                )}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="toneladasCapturadas">Toneladas Capturadas</label>
              <Controller
                name="toneladasCapturadas"
                control={controlCala}
                render={({ field }) => (
                  <InputNumber
                    id="toneladasCapturadas"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={0}
                    maxFractionDigits={3}
                    suffix=" Ton"
                    inputStyle={{ fontWeight: "bold" }}
                    style={{ backgroundColor: "#f7ee88" }}
                    disabled
                  />
                )}
              />
            </div>
            <div style={{ flex: 2 }}>
              <label htmlFor="observaciones">Observaciones</label>
              <Controller
                name="observaciones"
                control={controlCala}
                render={({ field }) => (
                  <InputTextarea
                    id="observaciones"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    style={{ fontWeight: "bold", fontStyle: "italic" }}
                    placeholder="Observaciones"
                    rows={1}
                    cols={20}
                  />
                )}
              />
            </div>
          </div>
          <div className="col-12">
            <DetalleCalasConsumoEspecieForm 
              calaId={editingCala?.id} 
              faenaPescaConsumoId={faenaPescaConsumoId}
              calaFinalizada={calaFinalizada}
              onDataChange={onDataChange}
            />
          </div>
        </div>
      </Dialog>
    </>
  );
}