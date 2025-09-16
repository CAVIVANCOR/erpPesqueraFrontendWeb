/**
 * DescargaFaenaPescaCard.jsx
 *
 * Componente para mostrar y gestionar la descarga de una faena de pesca.
 * Permite listar, crear y editar registros de DescargaFaenaPesca.
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
import DescargaFaenaPescaForm from "../descargaFaenaPesca/DescargaFaenaPescaForm";
import {
  getAllDescargaFaenaPesca,
  crearDescargaFaenaPesca,
  actualizarDescargaFaenaPesca,
  eliminarDescargaFaenaPesca,
} from "../../api/descargaFaenaPesca";

const DescargaFaenaPescaCard = ({
  faenaPescaId,
  temporadaData,
  faenaData,
  faenaDescripcion,
  puertos = [],
  patrones = [],
  motoristas = [],
  bahias = [],
  clientes = [],
  especies = [],
  loading = false,
  onDataChange,
  onDescargaChange, // Callback para notificar cambios
  onFaenasChange, // Callback para notificar cambios en faenas
}) => {
  const [descargas, setDescargas] = useState([]);
  const [selectedDescarga, setSelectedDescarga] = useState(null);
  const [descargaDialog, setDescargaDialog] = useState(false);
  const [editingDescarga, setEditingDescarga] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const toast = useRef(null);

  useEffect(() => {
    if (faenaPescaId) {
      cargarDescargas();
    }
  }, [faenaPescaId]);

  const cargarDescargas = async () => {
    try {
      setLoadingData(true);
      const response = await getAllDescargaFaenaPesca({ faenaPescaId });
      setDescargas(response || []);
    } catch (error) {
      console.error("Error al cargar descargas:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las descargas",
        life: 3000,
      });
    } finally {
      setLoadingData(false);
    }
  };

  const openNew = () => {
    setEditingDescarga(null);
    setDescargaDialog(true);
  };

  const editDescarga = (descarga) => {
    setEditingDescarga(descarga);
    setDescargaDialog(true);
  };

  const hideDialog = () => {
    setDescargaDialog(false);
    setEditingDescarga(null);
  };

  const saveDescarga = async (descargaData) => {
    try {
      setLoadingData(true);

      const dataToSend = {
        ...descargaData,
        faenaPescaId: Number(faenaPescaId),
        puertoDescargaId: descargaData.puertoDescargaId
          ? Number(descargaData.puertoDescargaId)
          : null,
        patronId: descargaData.patronId ? Number(descargaData.patronId) : null,
        motoristaId: descargaData.motoristaId
          ? Number(descargaData.motoristaId)
          : null,
        bahiaId: descargaData.bahiaId ? Number(descargaData.bahiaId) : null,
        clienteId: descargaData.clienteId
          ? Number(descargaData.clienteId)
          : null,
        temporadaPescaId: temporadaData?.id ? Number(temporadaData.id) : null,
      };

      if (editingDescarga) {
        await actualizarDescargaFaenaPesca(editingDescarga.id, dataToSend);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Descarga actualizada correctamente",
          life: 3000,
        });
      } else {
        await crearDescargaFaenaPesca(dataToSend);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Descarga creada correctamente",
          life: 3000,
        });
      }

      await cargarDescargas();
      hideDialog();

      // Notificar cambios al componente padre
      if (onDescargaChange) {
        onDescargaChange();
      }
    } catch (error) {
      console.error("Error al guardar descarga:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar la descarga",
        life: 3000,
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Templates para las columnas
  const puertoTemplate = (rowData) => {
    const puerto = puertos.find(p => Number(p.id) === Number(rowData.puertoDescargaId));
    return (
      <span style={{ fontWeight: "bold" }}>
        {puerto?.nombre || "N/A"}
      </span>
    );
  };

  const clienteTemplate = (rowData) => {
    const cliente = clientes.find(c => Number(c.id) === Number(rowData.clienteId));
    return (
      <span style={{ fontWeight: "bold" }}>
        {cliente?.razonSocial || "N/A"}
      </span>
    );
  };

  const especieTemplate = (rowData) => {
    const especie = especies.find(e => Number(e.id) === Number(rowData.especieId));
    return (
      <span style={{ fontWeight: "bold" }}>
        {especie?.nombre || "N/A"}
      </span>
    );
  };

  const toneladasTemplate = (rowData) => {
    return rowData.toneladas
      ? `${rowData.toneladas} Ton`
      : "-";
  };

  const porcentajeJuvenilesTemplate = (rowData) => {
    return rowData.porcentajeJuveniles
      ? `${rowData.porcentajeJuveniles}%`
      : "-";
  };


  const fechaHoraTemplate = (field) => (rowData) => {
    return rowData[field]
      ? new Date(rowData[field]).toLocaleString("es-ES")
      : "-";
  };

  const fechaTemplate = (field) => (rowData) => {
    return rowData[field]
      ? new Date(rowData[field]).toLocaleDateString("es-ES")
      : "-";
  };

  const combustibleTemplate = (rowData) => {
    return rowData.combustibleAbastecidoGalones
      ? `${rowData.combustibleAbastecidoGalones} gal.`
      : "-";
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-button-sm"
          onClick={() => editDescarga(rowData)}
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
        <h2>DESCARGA DE FAENA</h2>
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
          placeholder="Buscar descargas..."
        />{" "}
      </div>
    </div>
  );

  return (
    <Card>
      <Toast ref={toast} />
      <DataTable
        value={descargas}
        selection={selectedDescarga}
        onSelectionChange={(e) => setSelectedDescarga(e.value)}
        dataKey="id"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25]}
        className="datatable-responsive"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} descargas"
        globalFilter={globalFilter}
        emptyMessage="No se encontraron descargas."
        header={header}
        loading={loadingData}
        size="small"
        stripedRows
        showGridlines
        style={{ fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" sortable style={{ minWidth: "80px" }} />
        <Column
          field="puertoDescarga"
          header="Puerto"
          body={puertoTemplate}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          field="fechaHoraArriboPuerto"
          header="Arribo"
          body={fechaHoraTemplate("fechaHoraArriboPuerto")}
          sortable
          style={{ minWidth: "140px" }}
        />
        <Column
          field="fechaHoraInicioDescarga"
          header="Inicio Descarga"
          body={fechaHoraTemplate("fechaHoraInicioDescarga")}
          sortable
          style={{ minWidth: "140px" }}
        />
        <Column
          field="fechaHoraFinDescarga"
          header="Fin Descarga"
          body={fechaHoraTemplate("fechaHoraFinDescarga")}
          sortable
          style={{ minWidth: "140px" }}
        />
        <Column
          field="cliente"
          header="Cliente"
          body={clienteTemplate}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          field="especie"
          header="Especie"
          body={especieTemplate}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          field="toneladas"
          header="Toneladas"
          body={toneladasTemplate}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          field="porcentajeJuveniles"
          header="Porcentaje Juveniles"
          body={porcentajeJuvenilesTemplate}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          field="combustibleAbastecidoGalones"
          header="Combustible"
          body={combustibleTemplate}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          field="numReporteRecepcion"
          header="Reporte Recepción"
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          body={actionBodyTemplate}
          header="Acciones"
          style={{ minWidth: "100px" }}
        />
      </DataTable>

      <Dialog
        visible={descargaDialog}
        style={{ width: "1300px" }}
        header={
          editingDescarga
            ? "Editar Descarga de Faena"
            : "Nueva Descarga de Faena"
        }
        modal
        className="p-fluid"
        onHide={hideDialog}
        breakpoints={{ "960px": "90vw", "641px": "95vw" }}
      >
        {descargaDialog && (
          <DescargaFaenaPescaForm
            detalle={editingDescarga}
            puertos={puertos}
            clientes={clientes}
            bahiaId={faenaData?.bahiaId ? Number(faenaData.bahiaId) : null}
            motoristaId={faenaData?.motoristaId ? Number(faenaData.motoristaId) : null}
            patronId={faenaData?.patronId ? Number(faenaData.patronId) : null}
            faenaPescaId={faenaPescaId ? Number(faenaPescaId) : null}
            temporadaPescaId={temporadaData?.id ? Number(temporadaData.id) : null}
            especies={especies}
            onGuardadoExitoso={() => {
              cargarDescargas();
              hideDialog();
              if (onDescargaChange) {
                onDescargaChange();
              }
            }}
            onCancelar={hideDialog}
          />
        )}
      </Dialog>
    </Card>
  );
};

export default DescargaFaenaPescaCard;
