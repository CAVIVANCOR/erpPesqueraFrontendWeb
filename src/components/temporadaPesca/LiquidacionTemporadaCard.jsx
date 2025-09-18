/**
 * LiquidacionTemporadaCard.jsx
 *
 * Componente para mostrar y gestionar la liquidación de una temporada de pesca.
 * Permite crear y editar registros de LiquidacionTemporadaPesca y su detalle MovLiquidacionTemporadaPesca.
 * Solo permite una liquidación por temporada siguiendo las reglas de negocio.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { getResponsiveFontSize } from "../../utils/utils";
import LiquidacionTemporadaForm from "./LiquidacionTemporadaForm";
import MovLiquidacionTemporadaForm from "./MovLiquidacionTemporadaForm";
import {
  getAllLiquidacionTemporadaPesca,
  crearLiquidacionTemporadaPesca,
  actualizarLiquidacionTemporadaPesca,
  eliminarLiquidacionTemporadaPesca,
} from "../../api/liquidacionTemporadaPesca";
import {
  actualizarEntregaARendir,
  getAllEntregaARendir,
} from "../../api/entregaARendir";
import { Message } from "primereact/message";

const LiquidacionTemporadaCard = ({
  temporadaPescaId,
  temporadaPescaIniciada = false,
  personal = [],
  centrosCosto = [],
  empresasList = [],
  onDataChange,
}) => {
  // Estados principales
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [liquidacionDialog, setLiquidacionDialog] = useState(false);
  const [movimientoDialog, setMovimientoDialog] = useState(false);
  const [editingLiquidacion, setEditingLiquidacion] = useState(null);
  const [editingMovimiento, setEditingMovimiento] = useState(null);
  const [selectedLiquidacion, setSelectedLiquidacion] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const toast = useRef(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    if (temporadaPescaId) {
      cargarLiquidaciones();
    }
  }, [temporadaPescaId]);

  // Cargar movimientos cuando se selecciona una liquidación
  useEffect(() => {
    if (selectedLiquidacion?.id) {
      cargarMovimientos(selectedLiquidacion.id);
    } else {
      setMovimientos([]);
    }
  }, [selectedLiquidacion]);

  const cargarLiquidaciones = async () => {
    try {
      setLoadingData(true);
      const data = await getAllLiquidacionTemporadaPesca();
      const liquidacionesFiltradas = data.filter(
        (liq) => Number(liq.temporadaPescaId) === Number(temporadaPescaId)
      );
      setLiquidaciones(liquidacionesFiltradas);
      
      // Si solo hay una liquidación, seleccionarla automáticamente
      if (liquidacionesFiltradas.length === 1) {
        setSelectedLiquidacion(liquidacionesFiltradas[0]);
      }
    } catch (error) {
      console.error("Error al cargar liquidaciones:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar las liquidaciones",
        life: 3000,
      });
    } finally {
      setLoadingData(false);
    }
  };

  const cargarMovimientos = async (liquidacionId) => {
    try {
      const data = await getMovLiquidacionTemporadaPesca();
      const movimientosFiltrados = data.filter(
        (mov) => Number(mov.liquidacionTemporadaId) === Number(liquidacionId)
      );
      setMovimientos(movimientosFiltrados);
    } catch (error) {
      console.error("Error al cargar movimientos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los movimientos de liquidación",
        life: 3000,
      });
    }
  };

  const openNewLiquidacion = () => {
    // Solo permitir una liquidación por temporada
    if (liquidaciones.length > 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Solo se permite una liquidación por temporada",
        life: 3000,
      });
      return;
    }
    setEditingLiquidacion(null);
    setLiquidacionDialog(true);
  };

  const openNewMovimiento = () => {
    if (!selectedLiquidacion) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar una liquidación primero",
        life: 3000,
      });
      return;
    }
    setEditingMovimiento(null);
    setMovimientoDialog(true);
  };

  const editLiquidacion = (liquidacion) => {
    setEditingLiquidacion(liquidacion);
    setLiquidacionDialog(true);
  };

  const editMovimiento = (movimiento) => {
    setEditingMovimiento(movimiento);
    setMovimientoDialog(true);
  };

  const hideDialog = () => {
    setLiquidacionDialog(false);
    setMovimientoDialog(false);
  };

  const confirmDeleteLiquidacion = (liquidacion) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la liquidación de temporada?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      accept: () => deleteLiquidacion(liquidacion.id),
    });
  };

  const confirmDeleteMovimiento = (movimiento) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el movimiento de liquidación?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      accept: () => deleteMovimiento(movimiento.id),
    });
  };

  const deleteLiquidacion = async (id) => {
    try {
      await eliminarLiquidacionTemporadaPesca(id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Liquidación eliminada correctamente",
        life: 3000,
      });
      cargarLiquidaciones();
      if (selectedLiquidacion?.id === id) {
        setSelectedLiquidacion(null);
      }
      onDataChange?.();
    } catch (error) {
      console.error("Error al eliminar liquidación:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar la liquidación",
        life: 3000,
      });
    }
  };

  const deleteMovimiento = async (id) => {
    try {
      await eliminarMovLiquidacionTemporadaPesca(id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Movimiento eliminado correctamente",
        life: 3000,
      });
      cargarMovimientos(selectedLiquidacion.id);
      onDataChange?.();
    } catch (error) {
      console.error("Error al eliminar movimiento:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar el movimiento",
        life: 3000,
      });
    }
  };

  const completarLiquidacion = async (liquidacionId) => {
    try {
      // Primero actualizar la liquidación con fecha de verificación
      const liquidacionActual = liquidaciones.find(liq => Number(liq.id) === Number(liquidacionId));
      if (!liquidacionActual) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se encontró la liquidación",
          life: 3000,
        });
        return;
      }

      // Actualizar la liquidación con fecha de verificación
      const liquidacionActualizada = {
        ...liquidacionActual,
        fechaVerificacion: new Date(),
        fechaActualizacion: new Date(),
      };

      await actualizarLiquidacionTemporadaPesca(liquidacionId, liquidacionActualizada);

      // Actualizar la EntregaARendir correspondiente
      const entregasData = await getAllEntregaARendir();
      const entregaTemporada = entregasData.find(
        (entrega) => Number(entrega.temporadaPescaId) === Number(temporadaPescaId)
      );

      if (entregaTemporada) {
        const entregaActualizada = {
          ...entregaTemporada,
          entregaLiquidada: true,
          fechaLiquidacion: new Date(),
          fechaActualizacion: new Date(),
        };

        await actualizarEntregaARendir(entregaTemporada.id, entregaActualizada);

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Liquidación completada y entrega actualizada correctamente",
          life: 3000,
        });
      } else {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Liquidación completada pero no se encontró entrega asociada",
          life: 3000,
        });
      }

      cargarLiquidaciones();
      onDataChange?.();
    } catch (error) {
      console.error("Error al completar liquidación:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al completar la liquidación",
        life: 3000,
      });
    }
  };

  // Templates para las columnas
  const fechaTemplate = (rowData, field) => {
    const fecha = rowData[field.field];
    return fecha ? new Date(fecha).toLocaleDateString("es-PE") : "";
  };

  const fechaHoraTemplate = (rowData, field) => {
    const fecha = rowData[field.field];
    return fecha ? new Date(fecha).toLocaleString("es-PE") : "";
  };

  const montoTemplate = (rowData) => {
    return `S/ ${Number(rowData.monto || rowData.saldoFinal || 0).toFixed(2)}`;
  };

  const responsableTemplate = (rowData) => {
    const responsable = personal.find(p => Number(p.id) === Number(rowData.responsableId));
    return responsable ? responsable.nombreCompleto : "";
  };

  const verificadorTemplate = (rowData) => {
    if (!rowData.verificadorId) return "";
    const verificador = personal.find(p => Number(p.id) === Number(rowData.verificadorId));
    return verificador ? verificador.nombreCompleto : "";
  };

  const empresaTemplate = (rowData) => {
    const empresa = empresasList.find(e => Number(e.id) === Number(rowData.empresaId));
    return empresa ? empresa.razonSocial : "";
  };

  const estadoLiquidacionTemplate = (rowData) => {
    const verificada = rowData.fechaVerificacion ? true : false;
    return (
      <Tag
        value={verificada ? "Verificada" : "Pendiente"}
        severity={verificada ? "success" : "warning"}
      />
    );
  };

  const actionBodyTemplate = (rowData, isMovimiento = false) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-button-text"
          onClick={() => isMovimiento ? editMovimiento(rowData) : editLiquidacion(rowData)}
          tooltip="Editar"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-warning p-button-text"
          onClick={() => isMovimiento ? confirmDeleteMovimiento(rowData) : confirmDeleteLiquidacion(rowData)}
          tooltip="Eliminar"
        />
        {!isMovimiento && !rowData.fechaVerificacion && (
          <Button
            icon="pi pi-check"
            className="p-button-rounded p-button-info p-button-text"
            onClick={() => completarLiquidacion(rowData.id)}
            tooltip="Completar Liquidación"
          />
        )}
      </div>
    );
  };

  const header = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
      <h5 className="m-0">Liquidación de Temporada</h5>
      <div className="flex gap-2">
        <Button
          label="Nueva Liquidación"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={openNewLiquidacion}
          disabled={liquidaciones.length > 0}
        />
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            onInput={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar..."
          />
        </span>
      </div>
    </div>
  );

  const headerMovimientos = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
      <h6 className="m-0">
        Movimientos de Liquidación {selectedLiquidacion ? `- ID ${selectedLiquidacion.id}` : ""}
      </h6>
      <Button
        label="Nuevo Movimiento"
        icon="pi pi-plus"
        className="p-button-success"
        onClick={openNewMovimiento}
        disabled={!selectedLiquidacion}
      />
    </div>
  );

  // Renderizado condicional si la temporada no está iniciada
  if (!temporadaPescaIniciada) {
    return (
      <Card title="Liquidación de Temporada" className="mb-4">
        <Message 
          severity="info" 
          text="La temporada de pesca debe estar iniciada para gestionar liquidaciones" 
        />
      </Card>
    );
  }

  return (
    <Card
      title="Liquidación de Temporada"
      style={{
        fontSize: getResponsiveFontSize(),
        height: "70vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Tabla de Liquidaciones */}
        <div style={{ flex: "0 0 40%" }}>
          <DataTable
            value={liquidaciones}
            paginator
            rows={5}
            dataKey="id"
            loading={loadingData}
            globalFilter={globalFilter}
            header={header}
            emptyMessage="No se encontraron liquidaciones."
            selection={selectedLiquidacion}
            onSelectionChange={(e) => setSelectedLiquidacion(e.value)}
            selectionMode="single"
            className="datatable-responsive"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} liquidaciones"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            rowsPerPageOptions={[5, 10, 25]}
          >
            <Column selectionMode="single" headerStyle={{ width: "3rem" }}></Column>
            <Column field="id" header="ID" sortable style={{ minWidth: "6rem" }} />
            <Column 
              field="fechaLiquidacion" 
              header="Fecha Liquidación" 
              body={fechaTemplate} 
              sortable 
              style={{ minWidth: "12rem" }} 
            />
            <Column 
              field="empresaId" 
              header="Empresa" 
              body={empresaTemplate} 
              sortable 
              style={{ minWidth: "15rem" }} 
            />
            <Column 
              field="responsableId" 
              header="Responsable" 
              body={responsableTemplate} 
              sortable 
              style={{ minWidth: "12rem" }} 
            />
            <Column 
              field="saldoFinal" 
              header="Saldo Final" 
              body={montoTemplate} 
              sortable 
              style={{ minWidth: "10rem" }} 
            />
            <Column 
              field="fechaVerificacion" 
              header="Estado" 
              body={estadoLiquidacionTemplate} 
              sortable 
              style={{ minWidth: "10rem" }} 
            />
            <Column 
              body={actionBodyTemplate} 
              exportable={false} 
              style={{ minWidth: "12rem" }} 
            />
          </DataTable>
        </div>

        {/* Tabla de Movimientos */}
        <div style={{ flex: "1" }}>
          <DataTable
            value={movimientos}
            paginator
            rows={10}
            dataKey="id"
            loading={loadingData}
            header={headerMovimientos}
            emptyMessage="No se encontraron movimientos de liquidación."
            className="datatable-responsive"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} movimientos"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            rowsPerPageOptions={[10, 25, 50]}
          >
            <Column field="id" header="ID" sortable style={{ minWidth: "6rem" }} />
            <Column 
              field="fechaMovimiento" 
              header="Fecha Movimiento" 
              body={fechaTemplate} 
              sortable 
              style={{ minWidth: "12rem" }} 
            />
            <Column 
              field="tipoMovimientoId" 
              header="Tipo" 
              sortable 
              style={{ minWidth: "10rem" }} 
            />
            <Column 
              field="monto" 
              header="Monto" 
              body={montoTemplate} 
              sortable 
              style={{ minWidth: "10rem" }} 
            />
            <Column 
              field="fechaRegistro" 
              header="Fecha Registro" 
              body={fechaHoraTemplate} 
              sortable 
              style={{ minWidth: "12rem" }} 
            />
            <Column 
              body={(rowData) => actionBodyTemplate(rowData, true)} 
              exportable={false} 
              style={{ minWidth: "8rem" }} 
            />
          </DataTable>
        </div>
      </div>

      {/* Dialog para Liquidación */}
      <Dialog
        visible={liquidacionDialog}
        style={{ width: "600px" }}
        header={editingLiquidacion ? "Editar Liquidación de Temporada" : "Nueva Liquidación de Temporada"}
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        {liquidacionDialog && (
          <LiquidacionTemporadaForm
            liquidacion={editingLiquidacion}
            temporadaPescaId={temporadaPescaId}
            personal={personal}
            empresasList={empresasList}
            onGuardadoExitoso={() => {
              cargarLiquidaciones();
              hideDialog();
              onDataChange?.();
            }}
            onCancelar={hideDialog}
          />
        )}
      </Dialog>

      {/* Dialog para Movimiento */}
      <Dialog
        visible={movimientoDialog}
        style={{ width: "450px" }}
        header={editingMovimiento ? "Editar Movimiento de Liquidación" : "Nuevo Movimiento de Liquidación"}
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        {movimientoDialog && (
          <MovLiquidacionTemporadaForm
            movimiento={editingMovimiento}
            liquidacionTemporadaId={selectedLiquidacion?.id}
            centrosCosto={centrosCosto}
            onGuardadoExitoso={() => {
              cargarMovimientos(selectedLiquidacion.id);
              hideDialog();
              onDataChange?.();
            }}
            onCancelar={hideDialog}
          />
        )}
      </Dialog>

      <Toast ref={toast} />
    </Card>
  );
};

export default LiquidacionTemporadaCard;
