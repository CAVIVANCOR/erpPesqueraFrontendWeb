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
import { getResponsiveFontSize, createPorcentajeTemplate } from "../../utils/utils";
import DescargaFaenaPescaForm from "../descargaFaenaPesca/DescargaFaenaPescaForm";
import {
  getAllDescargaFaenaPesca,
  getDescargasPorFaena,
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
    if (!faenaPescaId) {
      return;
    }

    try {
      setLoadingData(true);
      const response = await getDescargasPorFaena(faenaPescaId);
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

  const eliminarDescarga = async (rowData) => {
    try {
      const confirmado = window.confirm(
        "¿Está seguro de eliminar esta descarga? Esta acción no se puede deshacer."
      );
      if (!confirmado) return;

      setLoadingData(true);
      await eliminarDescargaFaenaPesca(rowData.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Descarga eliminada correctamente",
        life: 3000,
      });
      await cargarDescargas();

      if (onDescargaChange) {
        onDescargaChange();
      }
    } catch (error) {
      console.error("Error al eliminar descarga:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar la descarga",
        life: 4000,
      });
    } finally {
      setLoadingData(false);
    }
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
    return (
      <span style={{ fontWeight: "bold" }}>
        {rowData.puertoDescarga?.nombre || "N/A"}
      </span>
    );
  };

  const clienteTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold" }}>
        {rowData.cliente?.razonSocial || "N/A"}
      </span>
    );
  };

  const especieTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold" }}>
        {rowData.especie?.nombre || "N/A"}
      </span>
    );
  };

  const toneladasTemplate = (rowData) => {
    return rowData.toneladas
      ? `${Number(rowData.toneladas).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "-";
  };

  const porcentajeJuvenilesTemplate = (rowData) => {
    const templateData = createPorcentajeTemplate(rowData.porcentajeJuveniles);
    
    if (!templateData) return "-";
    
    return (
      <span style={templateData.estilos}>
        {templateData.valor}{templateData.sufijo}
      </span>
    );
  };

  const fechaHoraTemplate = (field) => (rowData) => {
    if (!rowData[field]) return "-";
    
    const fecha = new Date(rowData[field]);
    const fechaStr = fecha.toLocaleDateString("es-ES");
    const horaStr = fecha.toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' });
    const fontSize = getResponsiveFontSize();
    
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: "bold", fontSize: fontSize }}>{fechaStr}</div>
        <div style={{ fontWeight: "bold", fontSize: `calc(${fontSize} * 0.9)`, color: "#666" }}>{horaStr}</div>
      </div>
    );
  };

  const fechaHoraFondeoTemplate = (rowData) => {
    return rowData.fechaHoraFondeo 
      ? new Date(rowData.fechaHoraFondeo).toLocaleString("es-PE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";
  };

  const puertoFondeoTemplate = (rowData) => {
    return rowData.puertoFondeo?.nombre || "-";
  };

  const combustibleTemplate = (rowData) => {
    return rowData.combustibleAbastecidoGalones
      ? `${rowData.combustibleAbastecidoGalones} gal.`
      : "-";
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "5px", flexWrap: "nowrap" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-button-text"
          onClick={() => editDescarga(rowData)}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-text"
          onClick={() => eliminarDescarga(rowData)}
          tooltip="Eliminar"
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
      <div style={{ flex: 0.5, display: "flex", flexDirection: "column" }}>
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
        style={{ fontSize: getResponsiveFontSize(), cursor: "pointer" }}
        onRowClick={(e) => editDescarga(e.data)}
        rowClassName={() => "align-top"}
      >
        <Column field="id" header="ID" sortable style={{ minWidth: "80px", verticalAlign: "top" }} />
        <Column
          field="puertoDescarga"
          header="Puerto"
          body={puertoTemplate}
          sortable
          style={{ minWidth: "120px", verticalAlign: "top" }}
        />
        <Column
          field="fechaHoraInicioDescarga"
          header="Inicio Descarga"
          body={fechaHoraTemplate("fechaHoraInicioDescarga")}
          sortable
          style={{ minWidth: "60px", textAlign: "center", verticalAlign: "top" }}
        />
        <Column
          field="fechaHoraFinDescarga"
          header="Fin Descarga"
          body={fechaHoraTemplate("fechaHoraFinDescarga")}
          sortable
          style={{ minWidth: "60px", textAlign: "center", verticalAlign: "top" }}
        />
        <Column
          field="puertoFondeo"
          header="Puerto Fondeo"
          body={puertoFondeoTemplate}
          sortable
          style={{ minWidth: "120px", verticalAlign: "top" }}
        />
        <Column
          field="cliente"
          header="Cliente"
          body={clienteTemplate}
          sortable
          style={{ minWidth: "120px", verticalAlign: "top" }}
        />
        <Column
          field="especie"
          header="Especie"
          body={especieTemplate}
          sortable
          style={{ minWidth: "120px", verticalAlign: "top" }}
        />
        <Column
          field="toneladas"
          header="Toneladas"
          body={toneladasTemplate}
          sortable
          style={{ minWidth: "80px", verticalAlign: "top", fontWeight: "bold" }}
        />
        <Column
          field="combustibleAbastecidoGalones"
          header="Combustible"
          body={combustibleTemplate}
          sortable
          style={{ minWidth: "80px", verticalAlign: "top" }}
        />
        <Column
          field="numReporteRecepcion"
          header="Reporte Recepción"
          sortable
          style={{ minWidth: "100px", verticalAlign: "top", fontWeight: "bold" }}
        />
        <Column
          body={actionBodyTemplate}
          header="Acciones"
          style={{ minWidth: "100px", verticalAlign: "top" }}
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
