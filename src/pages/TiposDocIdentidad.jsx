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
  crearTipoDocIdentidad,
  actualizarTipoDocIdentidad,
} from "../api/tiposDocIdentidad";
import { useAuthStore } from "../shared/stores/useAuthStore";
import TiposDocIdentidadForm from "../components/tiposDocIdentidad/TiposDocIdentidadForm";
import { getResponsiveFontSize } from "../utils/utils";
import { Navigate } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";
/**
 * Componente TiposDocIdentidad
 * Pantalla principal para gestión de tipos de documentos de identidad
 * Patrón aplicado: Edición por clic en fila, eliminación profesional con confirmación, búsqueda global.
 */
const TiposDocIdentidad = ({ ruta }) => {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions(ruta);
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

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
  const [formLoading, setFormLoading] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);

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
    setModoEdicion(false);
    setDialogoVisible(true);
  };

  /**
   * Abre el diálogo para editar tipo de documento (clic en fila)
   */
  const editarTipoDoc = (tipoDoc) => {
    setTipoDocSeleccionado(tipoDoc);
    setModoEdicion(true);
    setDialogoVisible(true);
  };

  /**
   * Cierra el diálogo
   */
  const cerrarDialogo = () => {
    setDialogoVisible(false);
    setTipoDocSeleccionado(null);
    setModoEdicion(false);
  };

  /**
   * Maneja el submit del formulario
   */
  async function onSubmitForm(data) {
    if (modoEdicion && !permisos.puedeEditar) return;
    if (!modoEdicion && !permisos.puedeCrear) return;

    setFormLoading(true);
    try {
      const payload = {
        codigo: data.codigo,
        codSunat: data.codSunat,
        nombre: data.nombre,
        cesado: data.cesado || false,
      };

      if (modoEdicion) {
        await actualizarTipoDocIdentidad(tipoDocSeleccionado.id, payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Tipo de documento actualizado correctamente",
          life: 3000,
        });
      } else {
        await crearTipoDocIdentidad(payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Tipo de documento creado correctamente",
          life: 3000,
        });
      }

      await cargarTiposDoc();
      cerrarDialogo();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: modoEdicion
          ? "Error al actualizar tipo de documento"
          : "Error al crear tipo de documento",
        life: 3000,
      });
    } finally {
      setFormLoading(false);
    }
  }

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

  const accionesTemplate = (rowData) => (
    <div onClick={(e) => e.stopPropagation()}>
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-text p-button-info"
        style={{ marginRight: 8 }}
        disabled={!permisos.puedeVer && !permisos.puedeEditar}
        onClick={() => {
          if (permisos.puedeVer || permisos.puedeEditar) {
            editarTipoDoc(rowData);
          }
        }}
        tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-text p-button-danger"
        disabled={!permisos.puedeEliminar}
        onClick={() => {
          if (permisos.puedeEliminar) {
            confirmarEliminacion(rowData);
          }
        }}
        tooltip="Eliminar"
      />
    </div>
  );

  return (
    <div className="p-m-4">
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
        size="small"
        showGridlines
        stripedRows
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 15, 20]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} tipos de documentos"
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar
            ? (e) => editarTipoDoc(e.data)
            : undefined
        }
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
              disabled={!permisos.puedeCrear}
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
        scrollable
        scrollHeight="600px"
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
          isEdit={modoEdicion}
          defaultValues={tipoDocSeleccionado}
          onSubmit={onSubmitForm}
          onCancel={cerrarDialogo}
          loading={formLoading}
          readOnly={modoEdicion && !permisos.puedeEditar}
        />
      </Dialog>
    </div>
  );
};

export default TiposDocIdentidad;
