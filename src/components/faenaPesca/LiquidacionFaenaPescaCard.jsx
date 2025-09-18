/**
 * LiquidacionFaenaPescaCard.jsx
 *
 * Componente para mostrar y gestionar la liquidación de una faena de pesca.
 * Permite listar, crear y editar registros de LiquidacionFaenaPesca.
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
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { getResponsiveFontSize } from "../../utils/utils";
import LiquidacionFaenaPescaForm from "../liquidacionFaenaPesca/LiquidacionFaenaPescaForm";
import {
  getAllLiquidacionesFaenaPesca,
  crearLiquidacionFaenaPesca,
  actualizarLiquidacionFaenaPesca,
  eliminarLiquidacionFaenaPesca,
} from "../../api/liquidacionFaenaPesca";

const LiquidacionFaenaPescaCard = ({
  faenaPescaId,
  temporadaData,
  faenaData,
  faenaDescripcion,
  personal: personalProps = [],
  loading = false,
  onDataChange,
  onLiquidacionChange, // Callback para notificar cambios
  onFaenasChange, // Callback para notificar cambios en faenas
}) => {
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [selectedLiquidacion, setSelectedLiquidacion] = useState(null);
  const [liquidacionDialog, setLiquidacionDialog] = useState(false);
  const [editingLiquidacion, setEditingLiquidacion] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const toast = useRef(null);

  // Estados para props normalizadas
  const [personal, setPersonal] = useState(personalProps);

  useEffect(() => {
    if (faenaPescaId) {
      cargarLiquidaciones();
    }
  }, [faenaPescaId]);

  useEffect(() => {
    if (personalProps?.length > 0) {
      const personalNormalizado = personalProps.map((item) => ({
        value: Number(item.value),
        label: item.label,
      }));
      setPersonal(personalNormalizado);
    }
  }, [personalProps]);

  const cargarLiquidaciones = async () => {
    try {
      setLoadingData(true);
      const response = await getAllLiquidacionesFaenaPesca({ faenaPescaId });
      setLiquidaciones(response || []);
    } catch (error) {
      console.error("Error al cargar liquidaciones:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las liquidaciones",
        life: 3000,
      });
    } finally {
      setLoadingData(false);
    }
  };

  const openNew = () => {
    setEditingLiquidacion(null);
    setLiquidacionDialog(true);
  };

  const editLiquidacion = (liquidacion) => {
    setEditingLiquidacion(liquidacion);
    setLiquidacionDialog(true);
  };

  const hideDialog = () => {
    setLiquidacionDialog(false);
    setEditingLiquidacion(null);
  };

  const saveLiquidacion = async (liquidacionData) => {
    try {
      setLoadingData(true);

      const dataToSend = {
        ...liquidacionData,
        faena_pesca_id: Number(faenaPescaId),
        responsable_id: liquidacionData.responsable_id
          ? Number(liquidacionData.responsable_id)
          : null,
        verificadorId: liquidacionData.verificadorId
          ? Number(liquidacionData.verificadorId)
          : null,
        temporada_pesca_id: temporadaData?.id ? Number(temporadaData.id) : null,
      };

      if (editingLiquidacion) {
        await actualizarLiquidacionFaenaPesca(
          editingLiquidacion.id,
          dataToSend
        );
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Liquidación actualizada correctamente",
          life: 3000,
        });
      } else {
        await crearLiquidacionFaenaPesca(dataToSend);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Liquidación creada correctamente",
          life: 3000,
        });
      }

      await cargarLiquidaciones();
      hideDialog();

      // Notificar cambios al componente padre
      if (onLiquidacionChange) {
        onLiquidacionChange();
      }
    } catch (error) {
      console.error("Error al guardar liquidación:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar la liquidación",
        life: 3000,
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Templates para las columnas
  const responsableTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold" }}>
        {rowData.responsable?.nombre || "N/A"}
      </span>
    );
  };

  const verificadorTemplate = (rowData) => {
    return (
      <span style={{ fontStyle: "italic" }}>
        {rowData.verificador?.nombre || "N/A"}
      </span>
    );
  };

  const fechaTemplate = (field) => (rowData) => {
    return rowData[field]
      ? new Date(rowData[field]).toLocaleDateString("es-ES")
      : "-";
  };

  const fechaHoraTemplate = (field) => (rowData) => {
    return rowData[field]
      ? new Date(rowData[field]).toLocaleString("es-ES")
      : "-";
  };

  const montoTemplate = (field) => (rowData) => {
    return rowData[field] ? `S/. ${Number(rowData[field]).toFixed(2)}` : "-";
  };

  const verificadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.fechaVerificacion ? "VERIFICADO" : "PENDIENTE"}
        severity={rowData.fechaVerificacion ? "success" : "warning"}
        style={{
          fontSize: getResponsiveFontSize(),
          fontWeight: "bold",
        }}
      />
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-button-sm"
          onClick={() => editLiquidacion(rowData)}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  const header = (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        gap: 10,
        flexDirection: window.innerWidth < 768 ? "column" : "row",
      }}
    >
      <div style={{ flex: 2, display: "flex", flexDirection: "column" }}>
        <h2>LIQUIDACIÓN DE FAENA</h2>
      </div>
      <div style={{ flex: 2, display: "flex", flexDirection: "column" }}>
        <Button
          label="Nuevo"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={openNew}
          size="small"
          disabled={!faenaPescaId}
        />
      </div>
      <div style={{ flex: 2, display: "flex", flexDirection: "column" }}>
        <InputText
          type="search"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar..."
          size="small"
        />
      </div>
    </div>
  );

  return (
    <Card>
      <Toast ref={toast} />
      <DataTable
        value={liquidaciones}
        selection={selectedLiquidacion}
        onSelectionChange={(e) => setSelectedLiquidacion(e.value)}
        dataKey="id"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25]}
        className="datatable-responsive"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} liquidaciones"
        globalFilter={globalFilter}
        emptyMessage="No se encontraron liquidaciones."
        header={header}
        loading={loadingData}
        size="small"
        stripedRows
        showGridlines
        style={{ fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" sortable style={{ minWidth: "80px" }} />
        <Column
          field="fecha_liquidacion"
          header="Fecha Liquidación"
          body={fechaTemplate("fecha_liquidacion")}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          field="responsable"
          header="Responsable"
          body={responsableTemplate}
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          field="verificador"
          header="Verificador"
          body={verificadorTemplate}
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          field="fechaVerificacion"
          header="F. Verificación"
          body={fechaHoraTemplate("fechaVerificacion")}
          sortable
          style={{ minWidth: "140px" }}
        />
        <Column
          field="saldo_inicial"
          header="Saldo Inicial"
          body={montoTemplate("saldo_inicial")}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          field="saldo_final"
          header="Saldo Final"
          body={montoTemplate("saldo_final")}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          field="fechaVerificacion"
          header="Estado"
          body={verificadoTemplate}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          body={actionBodyTemplate}
          header="Acciones"
          style={{ minWidth: "100px" }}
        />
      </DataTable>

      <Dialog
        visible={liquidacionDialog}
        style={{ width: "1000px" }}
        header={
          editingLiquidacion
            ? "Editar Liquidación de Faena"
            : "Nueva Liquidación de Faena"
        }
        modal
        className="p-fluid"
        onHide={hideDialog}
        breakpoints={{ "960px": "85vw", "641px": "95vw" }}
      >
        {liquidacionDialog && (
          <LiquidacionFaenaPescaForm
            isEdit={!!editingLiquidacion}
            defaultValues={
              editingLiquidacion || { faena_pesca_id: Number(faenaPescaId) }
            }
            personal={personal}
            temporadaData={temporadaData}
            onSubmit={saveLiquidacion}
            onCancel={hideDialog}
            loading={loadingData}
            toast={toast}
          />
        )}
      </Dialog>
    </Card>
  );
};

export default LiquidacionFaenaPescaCard;
