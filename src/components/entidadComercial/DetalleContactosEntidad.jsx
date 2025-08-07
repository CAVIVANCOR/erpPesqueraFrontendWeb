/**
 * DetalleContactosEntidad.jsx
 * 
 * Componente CRUD para gestionar contactos de una entidad comercial.
 * Sigue el patrón profesional ERP Megui con control de roles y feedback visual.
 * Patrón basado exactamente en TipoEquipo.jsx para máxima consistencia.
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { classNames } from "primereact/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../../utils/utils";

// Esquema de validación para contactos
const esquemaValidacionContacto = yup.object().shape({
  tipoContactoId: yup.number().required("El tipo de contacto es requerido"),
  nombres: yup.string().required("Los nombres son requeridos").max(100, "Máximo 100 caracteres"),
  apellidos: yup.string().required("Los apellidos son requeridos").max(100, "Máximo 100 caracteres"),
  cargo: yup.string().max(100, "Máximo 100 caracteres").nullable(),
  telefono: yup.string().max(20, "Máximo 20 caracteres").nullable(),
  email: yup.string().email("Email inválido").max(100, "Máximo 100 caracteres").nullable(),
  esPrincipal: yup.boolean(),
  estado: yup.boolean(),
});

/**
 * Componente DetalleContactosEntidad
 * @param {Object} props - Props del componente
 * @param {number} props.entidadComercialId - ID de la entidad comercial
 * @param {Array} props.contactos - Lista de contactos
 * @param {Function} props.onContactosChange - Callback cuando cambian los contactos
 * @param {Array} props.tiposContacto - Lista de tipos de contacto
 */
const DetalleContactosEntidad = ({
  entidadComercialId,
  contactos = [],
  onContactosChange,
  tiposContacto = []
}) => {
  // Estados del componente
  const [contactosData, setContactosData] = useState(contactos);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [contactoSeleccionado, setContactoSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [contactoAEliminar, setContactoAEliminar] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  
  // Referencias
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  // Configuración del formulario
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(esquemaValidacionContacto),
    defaultValues: {
      tipoContactoId: null,
      nombres: "",
      apellidos: "",
      cargo: "",
      telefono: "",
      email: "",
      esPrincipal: false,
      estado: true,
    },
  });

  // Sincronizar contactos cuando cambien las props
  useEffect(() => {
    setContactosData(contactos);
  }, [contactos]);

  /**
   * Abre el diálogo para crear un nuevo contacto
   */
  const abrirDialogoNuevo = () => {
    setContactoSeleccionado(null);
    reset();
    setDialogVisible(true);
  };

  /**
   * Abre el diálogo para editar un contacto existente
   * @param {Object} contacto - Contacto a editar
   */
  const abrirDialogoEdicion = (contacto) => {
    setContactoSeleccionado(contacto);
    setValue("tipoContactoId", Number(contacto.tipoContactoId));
    setValue("nombres", contacto.nombres || "");
    setValue("apellidos", contacto.apellidos || "");
    setValue("cargo", contacto.cargo || "");
    setValue("telefono", contacto.telefono || "");
    setValue("email", contacto.email || "");
    setValue("esPrincipal", Boolean(contacto.esPrincipal));
    setValue("estado", Boolean(contacto.estado));
    setDialogVisible(true);
  };

  /**
   * Cierra el diálogo
   */
  const cerrarDialogo = () => {
    setDialogVisible(false);
    setContactoSeleccionado(null);
  };

  /**
   * Confirma la eliminación de un contacto
   * @param {Object} contacto - Contacto a eliminar
   */
  const confirmarEliminacion = (contacto) => {
    setContactoAEliminar(contacto);
    setConfirmVisible(true);
  };

  /**
   * Elimina un contacto
   */
  const eliminar = async () => {
    try {
      const nuevosContactos = contactosData.filter(c => c.tempId !== contactoAEliminar.tempId);
      setContactosData(nuevosContactos);
      onContactosChange?.(nuevosContactos);
      
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Contacto eliminado correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar contacto",
        life: 3000,
      });
    } finally {
      setConfirmVisible(false);
      setContactoAEliminar(null);
    }
  };

  /**
   * Guarda un contacto (crear o actualizar)
   * @param {Object} data - Datos del contacto
   */
  const onGuardarExitoso = () => {
    cerrarDialogo();
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: contactoSeleccionado
        ? "Contacto actualizado correctamente"
        : "Contacto creado correctamente",
      life: 3000,
    });
  };

  const onSubmitContacto = async (data) => {
    try {
      setLoading(true);

      // Normalizar datos a mayúsculas
      const contactoNormalizado = {
        ...data,
        nombres: data.nombres?.trim().toUpperCase(),
        apellidos: data.apellidos?.trim().toUpperCase(),
        cargo: data.cargo?.trim().toUpperCase() || null,
        telefono: data.telefono?.trim().toUpperCase() || null,
        email: data.email?.trim().toLowerCase() || null, // Email en minúsculas
        tempId: contactoSeleccionado?.tempId || Date.now(),
      };

      let nuevosContactos;
      if (contactoSeleccionado) {
        // Actualizar contacto existente
        nuevosContactos = contactosData.map(c => 
          c.tempId === contactoSeleccionado.tempId ? contactoNormalizado : c
        );
      } else {
        // Agregar nuevo contacto
        nuevosContactos = [...contactosData, contactoNormalizado];
      }

      setContactosData(nuevosContactos);
      onContactosChange?.(nuevosContactos);
      onGuardarExitoso();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar contacto",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtiene la clase CSS para campos con errores
   */
  const getFieldClass = (fieldName) => {
    return classNames({ "p-invalid": errors[fieldName] });
  };

  /**
   * Obtiene mensaje de error de validación
   */
  const getFormErrorMessage = (name) => {
    return errors[name] && <small className="p-error">{errors[name]?.message}</small>;
  };

  // Templates para las columnas
  const tipoContactoTemplate = (rowData) => {
    const tipo = tiposContacto.find(t => Number(t.value) === Number(rowData.tipoContactoId));
    return tipo?.label || rowData.tipoContactoId;
  };

  const nombreCompletoTemplate = (rowData) => {
    return `${rowData.nombres} ${rowData.apellidos}`;
  };

  const esPrincipalTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.esPrincipal ? "Principal" : "Secundario"}
        severity={rowData.esPrincipal ? "success" : "info"}
      />
    );
  };

  const estadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.estado ? "Activo" : "Inactivo"}
        severity={rowData.estado ? "success" : "danger"}
      />
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-mr-2"
          onClick={(ev) => {
            ev.stopPropagation();
            abrirDialogoEdicion(rowData);
          }}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-text p-button-danger"
            onClick={() => confirmarEliminacion(rowData)}
            tooltip="Eliminar"
          />
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <DataTable
        value={contactosData}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron contactos"
        globalFilter={globalFilter}
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Contactos</h2>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              size="small"
              raised
              tooltip="Nuevo Contacto"
              outlined
              className="p-button-success"
              onClick={abrirDialogoNuevo}
            />
            <span className="p-input-icon-left">
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar contactos..."
                style={{ width: "300px" }}
              />
            </span>
          </div>
        }
        scrollable
        scrollHeight="600px"
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column field="tipoContactoId" header="Tipo" body={tipoContactoTemplate} sortable />
        <Column header="Nombre Completo" body={nombreCompletoTemplate} sortable />
        <Column field="cargo" header="Cargo" sortable />
        <Column field="telefono" header="Teléfono" sortable />
        <Column field="email" header="Email" sortable />
        <Column field="esPrincipal" header="Principal" body={esPrincipalTemplate} sortable />
        <Column field="estado" header="Estado" body={estadoTemplate} sortable />
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ width: "8rem" }}
        />
      </DataTable>

      <Dialog
        header={contactoSeleccionado ? "Editar Contacto" : "Nuevo Contacto"}
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "800px" }}
        modal
      >
        <form onSubmit={handleSubmit(onSubmitContacto)} className="p-fluid">
          <div className="formgrid grid">
            <div className="field col-12 md:col-6">
              <label htmlFor="tipoContactoId">Tipo de Contacto *</label>
              <Controller
                name="tipoContactoId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="tipoContactoId"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={tiposContacto}
                    placeholder="Seleccione tipo de contacto"
                    className={getFieldClass("tipoContactoId")}
                  />
                )}
              />
              {getFormErrorMessage("tipoContactoId")}
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="nombres">Nombres *</label>
              <Controller
                name="nombres"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="nombres"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="INGRESE NOMBRES"
                    className={getFieldClass("nombres")}
                    maxLength={100}
                    style={{ textTransform: 'uppercase' }}
                  />
                )}
              />
              {getFormErrorMessage("nombres")}
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="apellidos">Apellidos *</label>
              <Controller
                name="apellidos"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="apellidos"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="INGRESE APELLIDOS"
                    className={getFieldClass("apellidos")}
                    maxLength={100}
                    style={{ textTransform: 'uppercase' }}
                  />
                )}
              />
              {getFormErrorMessage("apellidos")}
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="cargo">Cargo</label>
              <Controller
                name="cargo"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="cargo"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="INGRESE CARGO"
                    className={getFieldClass("cargo")}
                    maxLength={100}
                    style={{ textTransform: 'uppercase' }}
                  />
                )}
              />
              {getFormErrorMessage("cargo")}
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="telefono">Teléfono</label>
              <Controller
                name="telefono"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="telefono"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="INGRESE TELÉFONO"
                    className={getFieldClass("telefono")}
                    maxLength={20}
                    style={{ textTransform: 'uppercase' }}
                  />
                )}
              />
              {getFormErrorMessage("telefono")}
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="email">Email</label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="email"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="Ingrese email"
                    className={getFieldClass("email")}
                    maxLength={100}
                  />
                )}
              />
              {getFormErrorMessage("email")}
            </div>

            <div className="field col-12 md:col-6">
              <div className="field-checkbox">
                <Controller
                  name="esPrincipal"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="esPrincipal"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.checked)}
                      className={getFieldClass("esPrincipal")}
                    />
                  )}
                />
                <label htmlFor="esPrincipal">Es Contacto Principal</label>
              </div>
            </div>

            <div className="field col-12 md:col-6">
              <div className="field-checkbox">
                <Controller
                  name="estado"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="estado"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.checked)}
                      className={getFieldClass("estado")}
                    />
                  )}
                />
                <label htmlFor="estado">Activo</label>
              </div>
            </div>
          </div>

          <div className="flex justify-content-end gap-2 mt-3">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-secondary"
              type="button"
              onClick={cerrarDialogo}
            />
            <Button
              label={contactoSeleccionado ? "Actualizar" : "Crear"}
              icon={contactoSeleccionado ? "pi pi-check" : "pi pi-plus"}
              className="p-button-success"
              type="submit"
              loading={loading}
            />
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar el contacto "${contactoAEliminar?.nombres} ${contactoAEliminar?.apellidos}"?`}
        header="Confirmar Eliminación"
        icon="pi pi-exclamation-triangle"
        accept={eliminar}
        reject={() => setConfirmVisible(false)}
        acceptLabel="Sí, Eliminar"
        rejectLabel="Cancelar"
        acceptClassName="p-button-danger"
      />
    </div>
  );
};

export default DetalleContactosEntidad;
