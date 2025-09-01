/**
 * DetalleCalasEspecieForm.jsx
 *
 * Componente CRUD para gestionar las especies de una cala de pesca.
 * Permite listar, crear, editar y eliminar registros de DetalleCalaEspecie.
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
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { Card } from "primereact/card";
import { getResponsiveFontSize } from "../../utils/utils";
import { getEspecies } from "../../api/especie";
import { 
  getDetalleCalaEspeciePorCala,
  crearDetalleCalaEspecie,
  actualizarDetalleCalaEspecie,
  eliminarDetalleCalaEspecie
} from "../../api/detalleCalaEspecie";
import { recalcularToneladasCala } from "../../api/recalcularToneladas";

const DetalleCalasEspecieForm = ({ calaId, faenaPescaId, temporadaId, onDataChange, onFaenasChange, loading = false }) => {
  const [especiesDetalle, setEspeciesDetalle] = useState([]);
  const [especiesDisponibles, setEspeciesDisponibles] = useState([]);
  const [detalleDialog, setDetalleDialog] = useState(false);
  const [editingDetalle, setEditingDetalle] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const toast = useRef(null);
  
  // Estados del formulario
  const [especieId, setEspecieId] = useState("");
  const [toneladas, setToneladas] = useState("");
  const [kilogramos, setKilogramos] = useState(""); // Nuevo estado para mostrar en kg
  const [porcentajeJuveniles, setPorcentajeJuveniles] = useState("");
  const [observaciones, setObservaciones] = useState("");

  useEffect(() => {
    cargarEspecies();
    if (calaId) {
      cargarEspeciesDetalle();
    }
  }, [calaId]);

  const cargarEspecies = async () => {
    try {
      const response = await getEspecies();
      setEspeciesDisponibles(response.map(e => ({ 
        label: `${e.nombre} (${e.nombreCientifico})`, 
        value: e.id 
      })));
    } catch (error) {
      console.error("Error cargando especies:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar las especies",
        life: 3000,
      });
    }
  };

  const cargarEspeciesDetalle = async () => {
    try {
      const response = await getDetalleCalaEspeciePorCala(calaId);
      setEspeciesDetalle(response);
    } catch (error) {
      console.error("Error cargando especies de la cala:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar las especies de la cala",
        life: 3000,
      });
    }
  };

  const abrirNuevoDetalle = () => {
    limpiarFormulario();
    setEditingDetalle(null);
    setDetalleDialog(true);
  };

  const editarDetalle = (detalle) => {
    setEditingDetalle(detalle);
    setEspecieId(detalle.especieId || "");
    setToneladas(detalle.toneladas || "");
    setKilogramos(detalle.toneladas * 1000 || ""); // Convertir toneladas a kilogramos
    setPorcentajeJuveniles(detalle.porcentajeJuveniles || "");
    setObservaciones(detalle.observaciones || "");
    setDetalleDialog(true);
  };

  const limpiarFormulario = () => {
    setEspecieId("");
    setToneladas("");
    setKilogramos("");
    setPorcentajeJuveniles("");
    setObservaciones("");
  };

  const guardarDetalle = async () => {
    try {
      // Validar campos requeridos
      if (!calaId) {
        toast.current?.show({
          severity: "error",
          summary: "Error de Validación",
          detail: "No se puede guardar: falta identificador de cala",
          life: 4000,
        });
        return;
      }

      if (!especieId) {
        toast.current?.show({
          severity: "error",
          summary: "Campo Requerido",
          detail: "Debe seleccionar una especie para continuar",
          life: 4000,
        });
        return;
      }

      if (!kilogramos || Number(kilogramos) <= 0) {
        toast.current?.show({
          severity: "error",
          summary: "Campo Requerido",
          detail: "Debe ingresar una cantidad válida en kilogramos (mayor a 0)",
          life: 4000,
        });
        return;
      }

      if (porcentajeJuveniles && (Number(porcentajeJuveniles) < 0 || Number(porcentajeJuveniles) > 100)) {
        toast.current?.show({
          severity: "error",
          summary: "Valor Inválido",
          detail: "El porcentaje de juveniles debe estar entre 0 y 100",
          life: 4000,
        });
        return;
      }

      // Validar duplicados solo al crear (no al editar)
      if (!editingDetalle) {
        const especieYaExiste = especiesDetalle.some(
          detalle => Number(detalle.especieId) === Number(especieId)
        );
        
        if (especieYaExiste) {
          toast.current?.show({
            severity: "warn",
            summary: "Especie Duplicada",
            detail: "Ya existe un registro para esta especie en la cala. Use 'Editar' para modificar el registro existente.",
            life: 5000,
          });
          return;
        }
      }
      const detalleData = {
        calaId: Number(calaId),
        especieId: Number(especieId),
        toneladas: kilogramos ? Number(kilogramos) / 1000 : null, // Convertir kilogramos a toneladas
        porcentajeJuveniles: porcentajeJuveniles
          ? Number(porcentajeJuveniles)
          : null,
        observaciones: observaciones || null,
      };
      if (editingDetalle) {
        // Actualizar detalle existente
        const result = await actualizarDetalleCalaEspecie(editingDetalle.id, detalleData);
      } else {
        // Crear nuevo detalle
        const result = await crearDetalleCalaEspecie(detalleData);
      }
      // RECÁLCULO AUTOMÁTICO: Siempre ejecutar después de guardar DetalleCalaEspecie
      try {
        await recalcularToneladasCala(calaId, faenaPescaId, temporadaId);        
        // Notificar al componente padre que los datos han cambiado
        if (onDataChange) {
          onDataChange();
        }
        if (onFaenasChange) {
          onFaenasChange();
        }
      } catch (error) {
        console.error('❌ Error en recálculo automático:', error);
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Los datos se guardaron pero hubo un error en el recálculo automático",
          life: 4000,
        });
      }

      toast.current?.show({
        severity: "success",
        summary: "Operación Exitosa",
        detail: editingDetalle ? "Especie actualizada correctamente" : "Especie agregada correctamente",
        life: 3000,
      });

      setDetalleDialog(false);
      cargarEspeciesDetalle();
    } catch (error) {
      // Manejo específico para diferentes tipos de errores
      if (error.response?.status === 409) {
        toast.current?.show({
          severity: "warn",
          summary: "Registro Duplicado",
          detail: "Ya existe un registro para esta especie en la cala. No se pueden tener especies duplicadas.",
          life: 5000,
        });
      } else if (error.response?.status === 400) {
        toast.current?.show({
          severity: "error",
          summary: "Datos Inválidos",
          detail: error.response?.data?.message || "Los datos ingresados no son válidos. Verifique la información.",
          life: 4000,
        });
      } else if (error.response?.status === 422) {
        toast.current?.show({
          severity: "error",
          summary: "Error de Validación",
          detail: error.response?.data?.message || "Los datos no cumplen con las reglas de validación del sistema.",
          life: 4000,
        });
      } else if (error.response?.status >= 500) {
        toast.current?.show({
          severity: "error",
          summary: "Error del Servidor",
          detail: "Error interno del servidor. Contacte al administrador del sistema.",
          life: 5000,
        });
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        toast.current?.show({
          severity: "error",
          summary: "Error de Conexión",
          detail: "No se pudo conectar con el servidor. Verifique su conexión a internet.",
          life: 5000,
        });
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error Inesperado",
          detail: error.response?.data?.message || "Ocurrió un error inesperado. Intente nuevamente.",
          life: 4000,
        });
      }
    }
  };

  const eliminarDetalle = async (detalle) => {
    try {
      await eliminarDetalleCalaEspecie(detalle.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Especie eliminada",
        life: 3000,
      });
      cargarEspeciesDetalle();
      
      // RECÁLCULO AUTOMÁTICO: Cuando se elimina DetalleCalaEspecie → recalcular en cascada desde Cala
      try {
        await recalcularToneladasCala(calaId, faenaPescaId, temporadaId);
        
        // Notificar al componente padre que los datos han cambiado
        if (onDataChange) {
          onDataChange();
        }
        if (onFaenasChange) {
          onFaenasChange();
        }
      } catch (error) {
        console.error('❌ Error en recálculo automático:', error);
      }
    } catch (error) {
      console.error("Error eliminando detalle:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar la especie",
        life: 3000,
      });
    }
  };

  const accionesTemplate = (rowData) => {
    return (
      <div>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-mr-2"
          onClick={() => editarDetalle(rowData)}
          tooltip="Editar"
          size="small"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-warning"
          onClick={() => eliminarDetalle(rowData)}
          tooltip="Eliminar"
          size="small"
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
        <div style={{ flex: 2 }}>
          <h2>Especies Capturadas</h2>
        </div>
        <div style={{ flex: 1 }}>
          <Button
            label="Agregar Especie"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={abrirNuevoDetalle}
            disabled={!calaId}
            size="small"
            type="button"
            tooltip="Agregar Especie"
            tooltipOptions={{ position: "top" }}
            raised
            outlined
            severity="success"
          />
        </div>
        <div style={{ flex: 1 }}>
          <span className="p-input-icon-left">
            <InputText
              type="search"
              onInput={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar..."
              size="small"
            />
          </span>
        </div>
      </div>
    </div>
  );

  const detalleDialogFooter = (
    <>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text"
        onClick={() => setDetalleDialog(false)}
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        className="p-button-text"
        onClick={guardarDetalle}
      />
    </>
  );

  return (
    <Card className="mt-3">
      <Toast ref={toast} />

      <DataTable
        value={especiesDetalle}
        selection={null}
        onSelectionChange={(e) => null}
        dataKey="id"
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 15]}
        className="datatable-responsive"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} especies"
        globalFilter={globalFilter}
        header={header}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        size="small"
      >
        <Column
          field="especie.nombre"
          header="Especie"
          sortable
          style={{ minWidth: "8rem" }}
          body={(rowData) => rowData.especie?.nombre || "-"}
        ></Column>
        <Column
          field="especie.nombreCientifico"
          header="Nombre Científico"
          sortable
          style={{ minWidth: "10rem" }}
          body={(rowData) => rowData.especie?.nombreCientifico || "-"}
        ></Column>
        <Column
          field="toneladas"
          header="Toneladas"
          sortable
          style={{ minWidth: "6rem" }}
          body={(rowData) =>
            rowData.toneladas ? `${rowData.toneladas} Ton` : "-"
          }
        ></Column>
        <Column
          field="porcentajeJuveniles"
          header="% Juveniles"
          sortable
          style={{ minWidth: "6rem" }}
          body={(rowData) =>
            rowData.porcentajeJuveniles
              ? `${rowData.porcentajeJuveniles}%`
              : "-"
          }
        ></Column>
        <Column
          field="observaciones"
          header="Observaciones"
          style={{ minWidth: "10rem" }}
        ></Column>
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ minWidth: "6rem" }}
        ></Column>
      </DataTable>

      <Dialog
        visible={detalleDialog}
        style={{ width: "500px" }}
        header={editingDetalle ? "Editar Especie" : "Agregar Especie"}
        modal
        className="p-fluid"
        footer={detalleDialogFooter}
        onHide={() => setDetalleDialog(false)}
      >
        <div className="grid">
          <div className="col-12">
            <label htmlFor="especieId">Especie *</label>
            <Dropdown
              id="especieId"
              value={especieId}
              options={especiesDisponibles}
              onChange={(e) => setEspecieId(e.value)}
              placeholder="Seleccione una especie"
              required
            />
          </div>
          <div className="col-12 md:col-6">
            <label htmlFor="kilogramos">Kilogramos</label>
            <InputNumber
              id="kilogramos"
              value={kilogramos}
              onValueChange={(e) => setKilogramos(e.value)}
              mode="decimal"
              minFractionDigits={0}
              maxFractionDigits={3}
              suffix=" Kg"
              min={0}
            />
          </div>
          <div className="col-12 md:col-6">
            <label htmlFor="porcentajeJuveniles">
              Porcentaje Juveniles (%)
            </label>
            <InputNumber
              id="porcentajeJuveniles"
              value={porcentajeJuveniles}
              onValueChange={(e) => setPorcentajeJuveniles(e.value)}
              mode="decimal"
              minFractionDigits={0}
              maxFractionDigits={2}
              suffix="%"
              min={0}
              max={100}
            />
          </div>
          <div className="col-12">
            <label htmlFor="observaciones">Observaciones</label>
            <InputTextarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              cols={20}
            />
          </div>
        </div>
      </Dialog>
    </Card>
  );
};

export default DetalleCalasEspecieForm;
