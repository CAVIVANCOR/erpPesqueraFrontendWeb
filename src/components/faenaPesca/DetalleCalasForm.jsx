/**
 * DetalleCalasForm.jsx
 *
 * Componente para mostrar y gestionar las calas de una faena de pesca.
 * Permite listar, crear y editar registros de Cala.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { Card } from "primereact/card";
import { getResponsiveFontSize } from "../../utils/utils";
import DetalleCalasEspecieForm from "./DetalleCalasEspecieForm";
import {
  getCalasPorFaena,
  crearCala,
  actualizarCala,
  eliminarCala,
} from "../../api/cala";

const DetalleCalasForm = ({
  faenaPescaId,
  temporadaData,
  faenaData,
  faenaDescripcion,
  bahias: bahiasProps = [],
  motoristas: motoristasProps = [],
  patrones: patronesProps = [],
  puertos: puertosProps = [],
  embarcaciones: embarcacionesProps = [],
  loading = false,
  onDataChange,
  onCalasChange, // Callback para notificar cambios en calas
  onFaenasChange, // Callback para notificar cambios en faenas
}) => {
  const [calas, setCalas] = useState([]);
  const [selectedCala, setSelectedCala] = useState(null);
  const [calaDialog, setCalaDialog] = useState(false);
  const [editingCala, setEditingCala] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const toast = useRef(null);

  // Estados del formulario de cala
  const [fechaHoraInicio, setFechaHoraInicio] = useState(null);
  const [fechaHoraFin, setFechaHoraFin] = useState(null);
  const [latitud, setLatitud] = useState("");
  const [longitud, setLongitud] = useState("");
  const [profundidadM, setProfundidadM] = useState("");
  const [toneladasCapturadas, setToneladasCapturadas] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [calaSeleccionadaId, setCalaSeleccionadaId] = useState(null);

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

  // Estados para campos de fecha
  const [createdAt, setCreatedAt] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    if (faenaPescaId) {
      cargarCalas();
    }
  }, [faenaPescaId]);

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
    if (!faenaPescaId) {
      setCalas([]);
      return;
    }
    
    try {
      const response = await getCalasPorFaena(faenaPescaId);
      setCalas(response);
      onCalasChange(response); // Notificar cambios en calas
    } catch (error) {
      console.error("Error cargando calas:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar las calas",
        life: 3000,
      });
    }
  };

  const abrirNuevaCala = () => {
    limpiarFormulario();
    setEditingCala(null);
    setFechaHoraInicio(new Date());
    setCreatedAt(new Date());
    setUpdatedAt(new Date());

    // Asignar valores directamente desde faenaData
    if (faenaData) {
      // Convertir a números para asegurar compatibilidad
      const bahiaIdNum = Number(faenaData.bahiaId);
      const motoristaIdNum = Number(faenaData.motoristaId);
      const patronIdNum = Number(faenaData.patronId);
      const embarcacionIdNum = Number(faenaData.embarcacionId);

      setSelectedBahiaId(bahiaIdNum);
      setSelectedMotoristaId(motoristaIdNum);
      setSelectedPatronId(patronIdNum);
      setSelectedEmbarcacionId(embarcacionIdNum);
    }

    setCalaDialog(true);
  };

  const editarCala = (cala) => {
    setEditingCala(cala);
    setFechaHoraInicio(
      cala.fechaHoraInicio ? new Date(cala.fechaHoraInicio) : null
    );
    setFechaHoraFin(cala.fechaHoraFin ? new Date(cala.fechaHoraFin) : null);
    setLatitud(cala.latitud || "");
    setLongitud(cala.longitud || "");
    setProfundidadM(cala.profundidadM || "");
    setToneladasCapturadas(cala.toneladasCapturadas || "");
    setObservaciones(cala.observaciones || "");
    setCreatedAt(cala.createdAt ? new Date(cala.createdAt) : null);
    setUpdatedAt(cala.updatedAt ? new Date(cala.updatedAt) : null);

    // Usar valores de la cala o faenaData y convertir a números
    const bahiaValue = Number(cala.bahiaId || faenaData?.bahiaId);
    const motoristaValue = Number(cala.motoristaId || faenaData?.motoristaId);
    const patronValue = Number(cala.patronId || faenaData?.patronId);
    const embarcacionValue = Number(
      cala.embarcacionId || faenaData?.embarcacionId
    );

    setSelectedBahiaId(bahiaValue);
    setSelectedMotoristaId(motoristaValue);
    setSelectedPatronId(patronValue);
    setSelectedEmbarcacionId(embarcacionValue);
    setCalaDialog(true);
  };

  const finalizarCala = async (cala) => {
    try {
      const calaData = {
        ...cala,
        fechaHoraFin: new Date(),
      };

      await actualizarCala(cala.id, calaData);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Cala finalizada",
        life: 3000,
      });

      cargarCalas();
      onCalasChange(); // Notificar cambios en calas
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

  const eliminarCalaRecord = async (cala) => {
    try {
      await eliminarCala(cala.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Cala eliminada",
        life: 3000,
      });
      
      cargarCalas();
      onCalasChange(); // Notificar cambios en calas
    } catch (error) {
      console.error("Error eliminando cala:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar la cala",
        life: 3000,
      });
    }
  };

  const limpiarFormulario = () => {
    setFechaHoraInicio(null);
    setFechaHoraFin(null);
    setLatitud("");
    setLongitud("");
    setProfundidadM("");
    setToneladasCapturadas("");
    setObservaciones("");

    // Limpiar valores de dropdowns
    setSelectedBahiaId(null);
    setSelectedMotoristaId(null);
    setSelectedPatronId(null);
    setSelectedEmbarcacionId(null);

    // Limpiar fechas del sistema
    setCreatedAt(null);
    setUpdatedAt(null);
  };

  const guardarCala = async () => {
    try {
      const calaData = {
        bahiaId: Number(selectedBahiaId || faenaData?.bahiaId),
        motoristaId: Number(selectedMotoristaId || faenaData?.motoristaId),
        patronId: Number(selectedPatronId || faenaData?.patronId),
        embarcacionId: Number(
          selectedEmbarcacionId || faenaData?.embarcacionId
        ),
        faenaPescaId: Number(faenaPescaId),
        temporadaPescaId: Number(temporadaData?.id),
        fechaHoraInicio,
        fechaHoraFin,
        latitud: latitud ? Number(latitud) : null,
        longitud: longitud ? Number(longitud) : null,
        profundidadM: profundidadM ? Number(profundidadM) : null,
        toneladasCapturadas: toneladasCapturadas
          ? Number(toneladasCapturadas)
          : null,
        observaciones: observaciones || null,
        updatedAt: new Date(), // Campo requerido por Prisma
      };

      let nuevaCalaCreada = null;

      if (editingCala) {
        // Actualizar cala existente
        await actualizarCala(editingCala.id, calaData);
        toast.current?.show({
          severity: "success",
          summary: "Cala Actualizada",
          detail: "Cala actualizada correctamente",
          life: 3000,
        });
        setCalaDialog(false);
      } else {
        // Crear nueva cala
        nuevaCalaCreada = await crearCala(calaData);
        
        // Actualizar el estado editingCala con la nueva cala creada
        setEditingCala(nuevaCalaCreada);
        
        toast.current?.show({
          severity: "success",
          summary: "Cala Creada",
          detail: "Cala creada correctamente. Ahora puede agregar especies.",
          life: 4000,
        });
        
        // NO cerrar el dialog para permitir agregar especies
        // setCalaDialog(false); // Comentado para mantener abierto
      }

      cargarCalas();
      onCalasChange(); // Notificar cambios en calas
    } catch (error) {
      console.error("Error guardando cala:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Error al guardar la cala",
        life: 3000,
      });
    }
  };

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

  const iniciarCala = async (cala) => {
    if (!cala || fechaHoraInicio) {
      // No hacer nada si ya tiene fecha de inicio
      return;
    }

    try {
      const ahora = new Date();
      setFechaHoraInicio(ahora);
      
      // Actualizar en la base de datos
      const calaActualizada = {
        ...cala,
        fechaHoraInicio: ahora.toISOString(),
      };
      
      await actualizarCala(cala.id, calaActualizada);
      
      toast.current?.show({
        severity: "success",
        summary: "Cala Iniciada",
        detail: `Cala iniciada a las ${ahora.toLocaleTimeString()}`,
        life: 3000,
      });
      
      // Recargar la lista de calas
      cargarCalas();
      onCalasChange(); // Notificar cambios en calas
      
    } catch (error) {
      console.error("Error iniciando cala:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al iniciar la cala",
        life: 3000,
      });
    }
  };

  const finalizarCalaAction = async (cala) => {
    if (!cala || !fechaHoraInicio || fechaHoraFin) {
      // No hacer nada si no está iniciada o ya está finalizada
      return;
    }

    try {
      const ahora = new Date();
      setFechaHoraFin(ahora);
      
      // Actualizar en la base de datos
      const calaActualizada = {
        ...cala,
        fechaHoraFin: ahora.toISOString(),
      };
      
      await actualizarCala(cala.id, calaActualizada);
      
      toast.current?.show({
        severity: "success",
        summary: "Cala Finalizada",
        detail: `Cala finalizada a las ${ahora.toLocaleTimeString()}`,
        life: 3000,
      });
      
      // Recargar la lista de calas
      cargarCalas();
      onCalasChange(); // Notificar cambios en calas
      
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

  // Estados para determinar si los botones están habilitados
  const puedeIniciarCala = !fechaHoraInicio;
  const puedeFinalizarCala = fechaHoraInicio && !fechaHoraFin;
  const calaFinalizada = fechaHoraInicio && fechaHoraFin;

  const accionesTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success"
          onClick={() => editarCala(rowData)}
          tooltip="Editar"
          size="small"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger"
          onClick={() => eliminarCalaRecord(rowData)}
          tooltip="Eliminar"
          size="small"
        />
      </div>
    );
  };

  const calaDialogFooter = (
    <>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text"
        onClick={() => setCalaDialog(false)}
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        className="p-button-text"
        onClick={guardarCala}
      />
    </>
  );

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
          <h2>Gestión de Calas</h2>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Button
            label="Nueva Cala"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={abrirNuevaCala}
            disabled={
              !faenaPescaId ||
              !faenaData?.fechaSalida ||
              !faenaData?.puertoSalidaId
            }
            type="button"
            tooltip={
              !faenaData?.fechaSalida || !faenaData?.puertoSalidaId
                ? "Debe ingresar fecha de salida y puerto de salida antes de crear calas"
                : "Agregar nueva cala"
            }
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

  const handleDataChange = async () => {    
    // Recargar las calas para obtener los datos actualizados
    await cargarCalas();
    
    // Si hay una cala siendo editada, actualizar sus datos con los valores recalculados
    if (editingCala?.id) {
      try {
        const calasActualizadas = await getCalasPorFaena(faenaPescaId);
        const calaActualizada = calasActualizadas.find(c => c.id === editingCala.id);
        
        if (calaActualizada) {
          // Actualizar el estado del formulario con los nuevos valores
          setToneladasCapturadas(calaActualizada.toneladasCapturadas || "");
        }
      } catch (error) {
        console.error("Error actualizando datos de cala:", error);
      }
    }
    
    // Notificar al componente padre que debe recargar los datos
    if (onDataChange && typeof onDataChange === 'function') {
      await onDataChange();
    }
    if (onFaenasChange && typeof onFaenasChange === 'function') {
      await onFaenasChange();
    }
  };

  return (
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
        selection={selectedCala}
        onSelectionChange={(e) => setSelectedCala(e.value)}
        dataKey="id"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25]}
        className="datatable-responsive"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} calas"
        globalFilter={globalFilter}
        header={header}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column
          field="id"
          header="ID"
          sortable
          style={{ minWidth: "4rem" }}
        ></Column>
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
        ></Column>
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
        ></Column>
        <Column
          field="fechaHoraInicio"
          header="Fecha Inicio"
          body={(rowData) => formatearFecha(rowData.fechaHoraInicio)}
          sortable
          style={{ minWidth: "10rem" }}
        ></Column>
        <Column
          field="fechaHoraFin"
          header="Fecha Fin"
          body={(rowData) => formatearFecha(rowData.fechaHoraFin)}
          sortable
          style={{ minWidth: "10rem" }}
        ></Column>
        <Column
          field="toneladasCapturadas"
          header="Toneladas"
          sortable
          body={(rowData) => {
            const tonsC = rowData.toneladasCapturadas
              ? parseFloat(rowData.toneladasCapturadas).toFixed(3)
              : "0.000";
            return `${tonsC} t`;
          }}
          style={{ minWidth: "8rem" }}
        ></Column>
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ minWidth: "8rem" }}
        ></Column>
      </DataTable>

      <Dialog
        visible={calaDialog}
        style={{ width: "1300px" }}
        header={calaDialogHeader}
        modal
        className="p-fluid"
        footer={calaDialogFooter}
        onHide={() => setCalaDialog(false)}
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
              <Calendar
                id="fechaHoraInicio"
                value={fechaHoraInicio}
                onChange={(e) => setFechaHoraInicio(e.value)}
                inputStyle={{ fontWeight: "bold" }}
                showTime
                dateFormat="dd/mm/yy"
                showIcon
                disabled
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
                  if (!navigator.geolocation) {
                    toast.current?.show({
                      severity: "error",
                      summary: "Error",
                      detail: "GPS no disponible en este dispositivo",
                      life: 3000,
                    });
                    return;
                  }

                  const options = {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0,
                  };

                  navigator.geolocation.getCurrentPosition(
                    async (position) => {
                      const { latitude, longitude, accuracy } = position.coords;
                      setLatitud(latitude);
                      setLongitud(longitude);
                      toast.current?.show({
                        severity: "success",
                        summary: "GPS capturado",
                        detail: `GPS capturado con precisión de ${accuracy.toFixed(
                          1
                        )}m. Guardando cala...`,
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
                    (error) => {
                      let message = "Error desconocido";
                      switch (error.code) {
                        case error.PERMISSION_DENIED:
                          message =
                            "Permiso GPS denegado. Active la ubicación.";
                          break;
                        case error.POSITION_UNAVAILABLE:
                          message = "Señal GPS no disponible.";
                          break;
                        case error.TIMEOUT:
                          message = "Timeout GPS. Intente nuevamente.";
                          break;
                      }
                      toast.current?.show({
                        severity: "error",
                        summary: "Error",
                        detail: message,
                        life: 3000,
                      });
                    },
                    options
                  );
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
                onChange={(e) => setLatitud(parseFloat(e.target.value) || 0)}
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
                onChange={(e) => setLongitud(parseFloat(e.target.value) || 0)}
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
              {/* Conversión a formato DMS para referencia */}
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
                      <strong>Lat:</strong>{" "}
                      {(() => {
                        const abs = Math.abs(latitud);
                        const deg = Math.floor(abs);
                        const minFloat = (abs - deg) * 60;
                        const min = Math.floor(minFloat);
                        const sec = (minFloat - min) * 60;
                        const dir = latitud >= 0 ? "N" : "S";
                        return `${deg}° ${min}' ${sec.toFixed(2)}" ${dir}`;
                      })()}
                    </div>
                    <div>
                      <strong>Lon:</strong>{" "}
                      {(() => {
                        const abs = Math.abs(longitud);
                        const deg = Math.floor(abs);
                        const minFloat = (abs - deg) * 60;
                        const min = Math.floor(minFloat);
                        const sec = (minFloat - min) * 60;
                        const dir = longitud >= 0 ? "E" : "W";
                        return `${deg}° ${min}' ${sec.toFixed(2)}" ${dir}`;
                      })()}
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
              <Calendar
                id="fechaHoraFin"
                value={fechaHoraFin}
                onChange={(e) => setFechaHoraFin(e.value)}
                inputStyle={{ fontWeight: "bold" }}
                showTime
                dateFormat="dd/mm/yy"
                showIcon
                disabled={loading || calaFinalizada}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="toneladasCapturadas">Toneladas Capturadas</label>
              <InputNumber
                id="toneladasCapturadas"
                value={toneladasCapturadas}
                onValueChange={(e) => setToneladasCapturadas(e.value)}
                mode="decimal"
                minFractionDigits={0}
                maxFractionDigits={3}
                suffix=" Ton"
                inputStyle={{ fontWeight: "bold" }}
                style={{ backgroundColor: "#f7ee88" }}
                disabled
              />
            </div>

            <div style={{ flex: 2 }}>
              <label htmlFor="observaciones">Observaciones</label>
              <InputTextarea
                id="observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                style={{ fontWeight: "bold", fontStyle: "italic" }}
                placeholder="Observaciones"
                rows={1}
                cols={20}
              />
            </div>
          </div>
          <div className="col-12">
            <DetalleCalasEspecieForm 
              calaId={editingCala?.id} 
              faenaPescaId={faenaPescaId}
              temporadaId={temporadaData?.id}
              onDataChange={handleDataChange}
              onFaenasChange={onFaenasChange}
            />
          </div>
        </div>
      </Dialog>
    </Card>
  );
};

export default DetalleCalasForm;
