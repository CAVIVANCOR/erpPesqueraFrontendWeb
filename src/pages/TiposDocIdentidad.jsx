/**
 * Pantalla CRUD profesional para TiposDocIdentidad
 * Implementa el patrón estándar ERP Megui con DataTable, modal, confirmación y feedback.
 * Incluye edición por clic en fila y eliminación con control de roles.
 * Modelo Prisma: id, codigo, codSunat, nombre, cesado, createdAt, updatedAt
 * Patrón aplicado: Botón eliminar visible solo para superusuario/admin, confirmación visual profesional, búsqueda global por cualquier campo.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import {
  getTiposDocIdentidad,
  eliminarTipoDocIdentidad,
} from "../api/tiposDocIdentidad";
import { useAuthStore } from "../shared/stores/useAuthStore";
import TiposDocIdentidadForm from "../components/tiposDocIdentidad/TiposDocIdentidadForm";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Componente TiposDocIdentidad
 * Pantalla principal para gestión de tipos de documentos de identidad
 * Patrón aplicado: Edición por clic en fila, eliminación profesional con confirmación, búsqueda global.
 */
const TiposDocIdentidad = () => {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);

  // Estados del componente
  const [tiposDoc, setTiposDoc] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [tipoDocSeleccionado, setTipoDocSeleccionado] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });

  /**
   * Carga los tipos de documentos desde la API
   */
  const cargarTiposDoc = async () => {
    try {
      setLoading(true);
      const data = await getTiposDocIdentidad();

      // Normalizar IDs según regla ERP Megui
      const tiposNormalizados = data.map((tipo) => ({
        ...tipo,
        id: Number(tipo.id),
      }));

      setTiposDoc(tiposNormalizados);
    } catch (error) {
      console.error("Error al cargar tipos de documentos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los tipos de documentos de identidad",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Efecto para cargar datos al montar el componente
   */
  useEffect(() => {
    cargarTiposDoc();
  }, []);

  /**
   * Abre el diálogo para crear nuevo tipo de documento
   */
  const abrirDialogoNuevo = () => {
    setTipoDocSeleccionado(null);
    setDialogoVisible(true);
  };

  /**
   * Abre el diálogo para editar tipo de documento (clic en fila)
   */
  const editarTipoDoc = (tipoDoc) => {
    setTipoDocSeleccionado(tipoDoc);
    setDialogoVisible(true);
  };

  /**
   * Cierra el diálogo
   */
  const cerrarDialogo = () => {
    setDialogoVisible(false);
    setTipoDocSeleccionado(null);
  };

  /**
   * Maneja el guardado exitoso
   */
  const onGuardar = async () => {
    cerrarDialogo();
    await cargarTiposDoc();
  };

  /**
   * Confirma la eliminación de un tipo de documento
   * Solo visible para superusuario o admin (regla transversal ERP Megui)
   */
  const confirmarEliminacion = (tipoDoc) => {
    setConfirmState({ visible: true, row: tipoDoc });
  };

  /**
   * Maneja la confirmación de eliminación
   */
  const handleConfirmDelete = async () => {
    if (!confirmState.row) return;

    try {
      setLoading(true);
      await eliminarTipoDocumento(confirmState.row.id);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Tipo de documento "${confirmState.row.nombre}" eliminado correctamente`,
      });

      await cargarTiposDoc();
    } catch (error) {
      console.error("Error al eliminar tipo de documento:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar el tipo de documento",
      });
    } finally {
      setLoading(false);
      setConfirmState({ visible: false, row: null });
    }
  };

  /**
   * Elimina un tipo de documento
   */
  const eliminarTipoDocumento = async (id) => {
    try {
      await eliminarTipoDocIdentidad(id);
    } catch (error) {
      console.error("Error al eliminar tipo de documento:", error);
    }
  };

  /**
   * Maneja el filtro global - búsqueda por cualquier campo
   */
  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    setGlobalFilter(value);
  };

  /**
   * Template para el código del tipo de documento
   */
  const codigoTemplate = (rowData) => {
    return (
      <div className="flex align-items-center">
        <span className="font-bold">{rowData.codigo}</span>
      </div>
    );
  };

  /**
   * Template para el código SUNAT
   */
  const codSunatTemplate = (rowData) => {
    return (
      <div className="flex align-items-center">
        <span className="font-medium">{rowData.codSunat}</span>
      </div>
    );
  };

  /**
   * Template para el estado cesado
   */
  const estadoTemplate = (rowData) => {
    return rowData.cesado ? (
      <Tag value="CESADO" severity="danger" />
    ) : (
      <Tag value="ACTIVO" severity="success" />
    );
  };

  /**
   * Template para fechas
   */
  const fechaTemplate = (rowData, field) => {
    const fecha = rowData[field];
    return fecha ? new Date(fecha).toLocaleDateString("es-PE") : "-";
  };

  /**
   * Template para acciones
   * Incluye botón de editar y eliminar (eliminar solo para superusuario/admin)
   * Estilo idéntico a Personal.jsx: p-button-text, iconos pequeños
   */
  const accionesTemplate = (rowData) => {
    return (
      <>
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-mr-2"
          onClick={(e) => {
            e.stopPropagation();
            editarTipoDoc(rowData);
          }}
          tooltip="Editar"
        />
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-text p-button-danger"
            onClick={(e) => {
              e.stopPropagation();
              confirmarEliminacion(rowData);
            }}
            tooltip="Eliminar"
          />
        )}
      </>
    );
  };

  return (
    <div className="crud-demo">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span>
            ¿Está seguro que desea{" "}
            <span style={{ color: "#b71c1c" }}>eliminar</span> el tipo de
            documento{" "}
            <b>{confirmState.row ? `"${confirmState.row.nombre}"` : ""}</b>?
            <br />
            <span style={{ fontWeight: 400, color: "#b71c1c" }}>
              Esta acción no se puede deshacer.
            </span>
          </span>
        }
        header={<span style={{ color: "#b71c1c" }}>Confirmar eliminación</span>}
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        acceptLabel="Eliminar"
        rejectLabel="Cancelar"
        accept={handleConfirmDelete}
        reject={() => setConfirmState({ visible: false, row: null })}
        style={{ minWidth: 400 }}
      />

      <DataTable
        value={tiposDoc}
        loading={loading}
        dataKey="id"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} tipos de documentos"
        globalFilter={globalFilter}
        globalFilterFields={["codigo", "codSunat", "nombre"]}
        emptyMessage="No se encontraron tipos de documentos"
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Tipos de Documentos de Identidad</h2>
            <Button
              type="button"
              label="Nuevo"
              icon="pi pi-plus"
              className="p-button-success"
              size="small"
              outlined
              raised
              onClick={abrirDialogoNuevo}
            />
            <InputText
              type="search"
              onInput={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar tipos de documentos..."
              style={{ width: 240 }}
            />
          </div>
        }
        onRowClick={(e) => editarTipoDoc(e.data)}
        className="datatable-responsive"
        scrollable
        scrollHeight="600px"
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" sortable style={{ minWidth: "60px" }} />
        <Column
          field="codigo"
          header="Código"
          body={codigoTemplate}
          sortable
          style={{ minWidth: "120px" }}
        />

        <Column
          field="codSunat"
          header="Código SUNAT"
          body={codSunatTemplate}
          sortable
          style={{ minWidth: "140px" }}
        />

        <Column
          field="nombre"
          header="Nombre"
          sortable
          style={{ minWidth: "200px" }}
        />

        <Column
          field="cesado"
          header="Estado"
          body={estadoTemplate}
          sortable
          style={{ minWidth: "100px" }}
        />

        <Column
          field="createdAt"
          header="Creación"
          body={(rowData) => fechaTemplate(rowData, "createdAt")}
          sortable
          style={{ minWidth: "130px" }}
        />

        <Column
          field="updatedAt"
          header="Actualización"
          body={(rowData) => fechaTemplate(rowData, "updatedAt")}
          sortable
          style={{ minWidth: "150px" }}
        />

        <Column
          body={accionesTemplate}
          header="Acciones"
          frozen
          alignFrozen="right"
          style={{ minWidth: "100px" }}
        />
      </DataTable>

      <Dialog
        visible={dialogoVisible}
        style={{ width: "600px" }}
        header={
          tipoDocSeleccionado?.id
            ? "Editar Tipo de Documento"
            : "Nuevo Tipo de Documento"
        }
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
      >
        <TiposDocIdentidadForm
          tipoDoc={tipoDocSeleccionado}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
          toast={toast}
        />
      </Dialog>
    </div>
  );
};

export default TiposDocIdentidad;
