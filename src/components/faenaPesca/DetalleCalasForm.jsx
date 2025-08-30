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
  getCalas,
  crearCala,
  actualizarCala,
  eliminarCala,
} from "../../api/cala";

const DetalleCalasForm = ({
  faenaPescaId,
  temporadaData,
  faenaData,
  bahias: bahiasProps = [],
  motoristas: motoristasProps = [],
  patrones: patronesProps = [],
  puertos: puertosProps = [],
  embarcaciones: embarcacionesProps = [],
  loading = false,
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
    
    if (bahiasProps?.length > 0 && motoristasProps?.length > 0 && patronesProps?.length > 0 && embarcacionesProps?.length > 0) {
      // Normalizar los arrays para convertir values a Number
      const bahiasNormalizadas = bahiasProps.map(item => ({
        ...item,
        value: Number(item.value)
      }));
      const motoristasNormalizados = motoristasProps.map(item => ({
        ...item,
        value: Number(item.value)
      }));
      const patronesNormalizados = patronesProps.map(item => ({
        ...item,
        value: Number(item.value)
      }));
      const embarcacionesNormalizadas = embarcacionesProps.map(item => ({
        ...item,
        value: Number(item.value)
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
  }, [bahiasProps, motoristasProps, patronesProps, embarcacionesProps, faenaData]);

  const cargarCalas = async () => {
    try {
      const response = await getCalas(faenaPescaId);
      setCalas(response);
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
      setSelectedBahiaId(faenaData.bahiaId);
      setSelectedMotoristaId(faenaData.motoristaId);
      setSelectedPatronId(faenaData.patronId);
      setSelectedEmbarcacionId(faenaData.embarcacionId);

      // Crear opciones simples para mostrar
      setBahias([{ label: bahias[0].label, value: Number(bahias[0].value) }]);
      setMotoristas([{ label: motoristas[0].label, value: Number(motoristas[0].value) }]);
      setPatrones([{ label: patrones[0].label, value: Number(patrones[0].value) }]);
      setEmbarcaciones([{ label: embarcaciones[0].label, value: Number(embarcaciones[0].value) }]);
    }

    setCalaDialog(true);
  };

  const editarCala = (cala) => {
    setEditingCala(cala);
    setFechaHoraInicio(cala.fechaHoraInicio ? new Date(cala.fechaHoraInicio) : null);
    setFechaHoraFin(cala.fechaHoraFin ? new Date(cala.fechaHoraFin) : null);
    setLatitud(cala.latitud || "");
    setLongitud(cala.longitud || "");
    setProfundidadM(cala.profundidadM || "");
    setToneladasCapturadas(cala.toneladasCapturadas || "");
    setObservaciones(cala.observaciones || "");
    setCreatedAt(cala.createdAt ? new Date(cala.createdAt) : null);
    setUpdatedAt(cala.updatedAt ? new Date(cala.updatedAt) : null);

    // Usar valores de la cala o faenaData
    const bahiaValue = cala.bahiaId || faenaData?.bahiaId;
    const motoristaValue = cala.motoristaId || faenaData?.motoristaId;
    const patronValue = cala.patronId || faenaData?.patronId;
    const embarcacionValue = cala.embarcacionId || faenaData?.embarcacionId;

    setSelectedBahiaId(bahiaValue);
    setSelectedMotoristaId(motoristaValue);
    setSelectedPatronId(patronValue);
    setSelectedEmbarcacionId(embarcacionValue);

    setBahias([{ label: `Bahía ${bahiaValue}`, value: bahiaValue }]);
    setMotoristas([{ label: `Motorista ${motoristaValue}`, value: motoristaValue }]);
    setPatrones([{ label: `Patrón ${patronValue}`, value: patronValue }]);
    setEmbarcaciones([{ label: `Embarcación ${embarcacionValue}`, value: embarcacionValue }]);

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
        embarcacionId: Number(selectedEmbarcacionId || faenaData?.embarcacionId),
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
      };

      if (editingCala) {
        // Actualizar cala existente
        await actualizarCala(editingCala.id, calaData);
      } else {
        // Crear nueva cala
        await crearCala(calaData);
      }

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: editingCala ? "Cala actualizada" : "Cala creada",
        life: 3000,
      });

      setCalaDialog(false);
      cargarCalas();
    } catch (error) {
      console.error("Error guardando cala:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar la cala",
        life: 3000,
      });
    }
  };

  const eliminarCala = async (cala) => {
    try {
      await eliminarCala(cala.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Cala eliminada",
        life: 3000,
      });
      cargarCalas();
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

  const accionesTemplate = (rowData) => {
    return (
      <div>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-mr-2"
          onClick={() => editarCala(rowData)}
          tooltip="Editar"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-warning"
          onClick={() => eliminarCala(rowData)}
          tooltip="Eliminar"
        />
        <Button
          icon="pi pi-stop"
          className="p-button-rounded p-button-danger"
          onClick={() => finalizarCala(rowData)}
          tooltip="Finalizar Cala"
        />
      </div>
    );
  };

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
            disabled={!faenaPescaId}
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

  return (
    <Card title="Detalle de Calas" className="mt-4">
      <Toast ref={toast} />
      <Toolbar className="mb-4"></Toolbar>
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
          field="temporadaNombre"
          header="Temporada"
          sortable
          style={{ minWidth: "12rem" }}
        ></Column>
        <Column
          field="faenaDescripcion"
          header="Faena"
          sortable
          style={{ minWidth: "12rem" }}
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
        header={editingCala ? "Editar Cala" : "Nueva Cala"}
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
              marginTop: 10,
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
              <label htmlFor="fechaHoraInicio">Fecha y Hora Inicio</label>
              <Calendar
                id="fechaHoraInicio"
                value={fechaHoraInicio}
                onChange={(e) => setFechaHoraInicio(e.value)}
                inputStyle={{ fontWeight: "bold" }}
                showTime
                dateFormat="dd/mm/yy"
                showIcon
                disabled={loading}
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
                disabled={loading}
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
              <label htmlFor="latitud">Latitud</label>
              <InputNumber
                id="latitud"
                value={latitud}
                onValueChange={(e) => setLatitud(e.value)}
                mode="decimal"
                minFractionDigits={0}
                maxFractionDigits={6}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="longitud">Longitud</label>
              <InputNumber
                id="longitud"
                value={longitud}
                onValueChange={(e) => setLongitud(e.value)}
                mode="decimal"
                minFractionDigits={0}
                maxFractionDigits={6}
              />
            </div>
            <div style={{ flex: 4 }}>
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

          <div
            style={{
              display: "flex",
              gap: 10,
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
          </div>

          <div className="col-12">
            <DetalleCalasEspecieForm calaId={editingCala?.id} />
          </div>
        </div>
      </Dialog>
    </Card>
  );
};

export default DetalleCalasForm;
