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
  puertos: puertosProps = [],
  patrones: patronesProps = [],
  motoristas: motoristasProps = [],
  bahias: bahiasProps = [],
  clientes: clientesProps = [],
  especies: especiesProps = [],
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

  // Estados para props normalizadas
  const [puertos, setPuertos] = useState(puertosProps);
  const [patrones, setPatrones] = useState(patronesProps);
  const [motoristas, setMotoristas] = useState(motoristasProps);
  const [bahias, setBahias] = useState(bahiasProps);
  const [clientes, setClientes] = useState(clientesProps);
  const [especies, setEspecies] = useState(especiesProps);

  useEffect(() => {
    if (faenaPescaId) {
      cargarDescargas();
    }
  }, [faenaPescaId]);

  useEffect(() => {
    if (puertosProps?.length > 0) {
      const puertosNormalizados = puertosProps.map((item) => ({
        value: Number(item.value),
        label: item.label,
      }));
      setPuertos(puertosNormalizados);
    }
  }, [puertosProps]);

  useEffect(() => {
    if (patronesProps?.length > 0) {
      const patronesNormalizados = patronesProps.map((item) => ({
        value: Number(item.value),
        label: item.label,
      }));
      setPatrones(patronesNormalizados);
    }
  }, [patronesProps]);

  useEffect(() => {
    if (motoristasProps?.length > 0) {
      const motoristasNormalizados = motoristasProps.map((item) => ({
        value: Number(item.value),
        label: item.label,
      }));
      setMotoristas(motoristasNormalizados);
    }
  }, [motoristasProps]);

  useEffect(() => {
    if (bahiasProps?.length > 0) {
      const bahiasNormalizadas = bahiasProps.map((item) => ({
        value: Number(item.value),
        label: item.label,
      }));
      setBahias(bahiasNormalizadas);
    }
  }, [bahiasProps]);

  useEffect(() => {
    if (clientesProps?.length > 0) {
      const clientesNormalizados = clientesProps.map((item) => ({
        value: Number(item.value),
        label: item.label,
      }));
      setClientes(clientesNormalizados);
    }
  }, [clientesProps]);

  useEffect(() => {
    if (especiesProps?.length > 0) {
      const especiesNormalizadas = especiesProps.map((item) => ({
        value: Number(item.value),
        label: item.label,
      }));
      setEspecies(especiesNormalizadas);
    }
  }, [especiesProps]);

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
    return (
      <span style={{ fontWeight: "bold" }}>
        {rowData.puertoDescarga?.nombre || "N/A"}
      </span>
    );
  };

  const patronTemplate = (rowData) => {
    return (
      <span style={{ fontStyle: "italic" }}>
        {rowData.patro?.nombre || "N/A"}
      </span>
    );
  };

  const motoristaTemplate = (rowData) => {
    return (
      <span style={{ fontStyle: "italic" }}>
        {rowData.motorista?.nombre || "N/A"}
      </span>
    );
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
          field="patro"
          header="Patrón"
          body={patronTemplate}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          field="motorista"
          header="Motorista"
          body={motoristaTemplate}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          field="combustibleAbastecidoGalones"
          header="Combustible"
          body={combustibleTemplate}
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
