/**
 * DetalleDireccionesEntidad.jsx
 *
 * Componente CRUD para gestionar direcciones de una entidad comercial.
 * Sigue el patrón profesional ERP Megui con control de roles y feedback visual.
 * Patrón basado exactamente en TipoEquipo.jsx para máxima consistencia.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { classNames } from "primereact/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../../utils/utils";
import { ButtonGroup } from "primereact/buttongroup";
import { ToggleButton } from "primereact/togglebutton";
import UbigeoSelector from './UbigeoSelector'; // Importar componente UbigeoSelector
import { 
  crearDireccionEntidad, 
  actualizarDireccionEntidad, 
  eliminarDireccionEntidad,
  obtenerDireccionesPorEntidad
} from '../../api/direccionEntidad';
import { getUbigeos } from '../../api/ubigeo';
import { getDepartamentos } from '../../api/departamento';
import { getProvincias } from '../../api/provincia';

// Esquema de validación para direcciones
const esquemaValidacionDireccion = yup.object().shape({
  direccion: yup
    .string()
    .required("La dirección es requerida")
    .max(255, "Máximo 255 caracteres"),
  direccionArmada: yup.string().max(500, "Máximo 500 caracteres").nullable(),
  ubigeoId: yup.number().required("El ubigeo es requerido"),
  fiscal: yup.boolean(),
  almacenPrincipal: yup.boolean(),
  referencia: yup.string().max(255, "Máximo 255 caracteres").nullable(),
  telefono: yup.string().max(20, "Máximo 20 caracteres").nullable(),
  correo: yup
    .string()
    .email("Formato de correo inválido")
    .max(100, "Máximo 100 caracteres")
    .nullable(),
  activo: yup.boolean(),
});

/**
 * Componente DetalleDireccionesEntidad
 * @param {Object} props - Props del componente
 * @param {number} props.entidadComercialId - ID de la entidad comercial
 */
const DetalleDireccionesEntidad = forwardRef(({
  entidadComercialId,
}, ref) => {
  // Estados del componente
  const [direccionesData, setDireccionesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [direccionSeleccionada, setDireccionSeleccionada] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [direccionAEliminar, setDireccionAEliminar] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [ubigeoModalVisible, setUbigeoModalVisible] = useState(false);
  const [ubigeoTextoSeleccionado, setUbigeoTextoSeleccionado] = useState("Seleccione un ubigeo"); // Estado global para texto del ubigeo

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
    trigger,
    getValues,
  } = useForm({
    resolver: yupResolver(esquemaValidacionDireccion),
    defaultValues: {
      direccion: "",
      direccionArmada: "",
      ubigeoId: null,
      fiscal: false,
      almacenPrincipal: false,
      referencia: "",
      telefono: "",
      correo: "",
      activo: true,
    },
  });

  // Función para cargar direcciones desde la API
  const cargarDirecciones = async () => {
    if (!entidadComercialId) return;
    try {
      setLoading(true);
      const response = await obtenerDireccionesPorEntidad(entidadComercialId);
      setDireccionesData(response || []);
    } catch (error) {
      console.error("Error al cargar direcciones:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar las direcciones",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Exponer función recargar mediante ref
  useImperativeHandle(ref, () => ({
    recargar: cargarDirecciones
  }));

  // Cargar direcciones al montar el componente o cambiar entidadComercialId
  useEffect(() => {
    cargarDirecciones();
  }, [entidadComercialId]);

  /**
   * Abre el diálogo para crear una nueva dirección
   */
  const abrirDialogoNuevo = () => {
    setDireccionSeleccionada(null);
    reset();
    setDialogVisible(true);
  };

  /**
   * Abre el diálogo para editar una dirección existente
   * @param {Object} direccion - Dirección a editar
   */
  const abrirDialogoEdicion = (direccion) => {
    setDireccionSeleccionada(direccion);
    setValue("direccion", direccion.direccion || "");
    setValue("direccionArmada", direccion.direccionArmada || "");
    setValue("ubigeoId", Number(direccion.ubigeoId));
    setValue("fiscal", Boolean(direccion.fiscal));
    setValue("almacenPrincipal", Boolean(direccion.almacenPrincipal));
    setValue("referencia", direccion.referencia || "");
    setValue("telefono", direccion.telefono || "");
    setValue("correo", direccion.correo || "");
    setValue("activo", Boolean(direccion.activo));
    
    // Establecer texto del ubigeo para edición
    if (direccion.ubigeo) {
      setUbigeoTextoSeleccionado(`${direccion.ubigeo.codigo} - ${direccion.ubigeo.nombreDistrito || 'N/A'}`);
    } else {
      setUbigeoTextoSeleccionado("Seleccione un ubigeo");
    }
    
    setDialogVisible(true);
  };

  /**
   * Cierra el diálogo
   */
  const cerrarDialogo = () => {
    setDialogVisible(false);
    setDireccionSeleccionada(null);
  };

  /**
   * Confirma la eliminación de una dirección
   * @param {Object} direccion - Dirección a eliminar
   */
  const confirmarEliminacion = (direccion) => {
    setDireccionAEliminar(direccion);
    setConfirmVisible(true);
  };

  /**
   * Elimina una dirección
   */
  const eliminar = async () => {
    try {
      setLoading(true);
      
      // Recargar datos desde la API
      await eliminarDireccionEntidad(direccionAEliminar.id);
      
      // Recargar datos desde la API
      await cargarDirecciones();
      
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Dirección eliminada correctamente",
        life: 3000,
      });
    } catch (error) {
      console.error("Error al eliminar dirección:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al eliminar la dirección",
        life: 3000,
      });
    } finally {
      setLoading(false)
    }
  };




   /**
   * Construye automáticamente la direccionArmada combinando:
   * direccion + nombreDistrito + departamento.nombre + provincia.nombre
   * @param {string} direccion - Dirección base
   * @param {number} ubigeoId - ID del ubigeo seleccionado
   * @returns {Promise<string>} Dirección armada completa
   */
   const construirDireccionArmada = async (direccion, ubigeoId) => {
    try {      
      // 1. Obtener datos del ubigeo
      const ubigeos = await getUbigeos();
      const ubigeoEncontrado = ubigeos.find(u => Number(u.id) === Number(ubigeoId));
      
      if (!ubigeoEncontrado) {
        console.warn('⚠️ [FRONTEND] Ubigeo no encontrado:', ubigeoId);
        return direccion; // Retornar solo la dirección base
      }

      // 2. Obtener departamento y provincia
      const departamentos = await getDepartamentos();
      const provincias = await getProvincias();
      
      const departamento = departamentos.find(d => Number(d.id) === Number(ubigeoEncontrado.departamentoId));
      const provincia = provincias.find(p => Number(p.id) === Number(ubigeoEncontrado.provinciaId));

      // 3. Construir direccionArmada
      const direccionArmada = [
        direccion,
        ubigeoEncontrado.nombreDistrito || "",
        departamento?.nombre || "",
        provincia?.nombre || ""
      ].filter(Boolean).join(", ");
      return direccionArmada;

    } catch (error) {
      console.error('❌ [FRONTEND] Error construyendo direccionArmada:', error);
      return direccion; // Fallback: retornar solo la dirección base
    }
  };


  /**
   * Callback de guardado exitoso
   */
  const onGuardarExitoso = () => {
    cerrarDialogo();
    // Recargar datos desde la API
    cargarDirecciones();
  };

  /**
   * Guarda una dirección (crear o actualizar)
   * @param {Object} data - Datos de la dirección
   * @param {Event} event - Evento del formulario
   */
  const onSubmitDireccion = async (data, event) => {
    if (event) event.preventDefault();
    
    try {
      setLoading(true);
            
      // Construir direccionArmada automáticamente
      const direccionArmada = await construirDireccionArmada(
        data.direccion?.trim().toUpperCase(),
        data.ubigeoId
      );
      // Normalizar datos
      const direccionNormalizada = {
        entidadComercialId: Number(entidadComercialId),
        direccion: data.direccion?.trim().toUpperCase(),
        direccionArmada: direccionArmada || null,
        ubigeoId: Number(data.ubigeoId),
        fiscal: Boolean(data.fiscal),
        almacenPrincipal: Boolean(data.almacenPrincipal),
        referencia: data.referencia?.trim().toUpperCase() || null,
        telefono: data.telefono?.trim().toUpperCase() || null,
        correo: data.correo?.trim().toLowerCase() || null,
        activo: Boolean(data.activo),
      };

      let resultado;
      if (direccionSeleccionada) {
        // Actualizar dirección existente
        resultado = await actualizarDireccionEntidad(direccionSeleccionada.id, direccionNormalizada);
        
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Dirección actualizada correctamente",
          life: 3000,
        });
      } else {
        // Crear nueva dirección
        resultado = await crearDireccionEntidad(direccionNormalizada);
        
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Dirección creada correctamente",
          life: 3000,
        });
      }

      onGuardarExitoso();
    } catch (error) {
      console.error("Error al guardar dirección:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al guardar la dirección",
        life: 3000,
      });
    } finally {
      setLoading(false)
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
    return (
      errors[name] && <small className="p-error">{errors[name]?.message}</small>
    );
  };

  // Templates para las columnas
  const ubigeoTemplate = (rowData) => {
    return rowData.ubigeo?.codigo || rowData.ubigeoId;
  };

  const fiscalTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.fiscal ? "Fiscal" : "No Fiscal"}
        severity={rowData.fiscal ? "success" : "info"}
      />
    );
  };

  const almacenPrincipalTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.almacenPrincipal ? "Almacén Principal" : "No Principal"}
        severity={rowData.almacenPrincipal ? "success" : "info"}
      />
    );
  };

  const estadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.activo ? "Activa" : "Inactiva"}
        severity={rowData.activo ? "success" : "danger"}
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
          type="button"
        />
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-text p-button-danger"
            onClick={() => confirmarEliminacion(rowData)}
            tooltip="Eliminar"
            type="button"
          />
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <DataTable
        value={direccionesData}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron direcciones"
        globalFilter={globalFilter}
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Direcciones</h2>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              size="small"
              raised
              tooltip="Nueva Dirección"
              outlined
              className="p-button-success"
              onClick={abrirDialogoNuevo}
              type="button"
            />
            <span className="p-input-icon-left">
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar direcciones..."
                style={{ width: "300px" }}
              />
            </span>
          </div>
        }
        scrollable
        scrollHeight="600px"
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column
          field="ubigeoId"
          header="Ubigeo"
          body={ubigeoTemplate}
          sortable
        />
        <Column field="direccion" header="Dirección" sortable />
        <Column field="direccionArmada" header="Dirección Armada" sortable />
        <Column field="fiscal" header="Fiscal" body={fiscalTemplate} sortable />
        <Column
          field="almacenPrincipal"
          header="Almacén Principal"
          body={almacenPrincipalTemplate}
          sortable
        />
        <Column field="activo" header="Estado" body={estadoTemplate} sortable />
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ width: "8rem" }}
        />
      </DataTable>

      <Dialog
        header={direccionSeleccionada ? "Editar Dirección" : "Nueva Dirección"}
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "900px" }}
        modal
      >
        <form className="p-fluid">
          <div className="formgrid grid">
            <div className="field col-12">
              <label htmlFor="direccion">Dirección *</label>
              <Controller
                name="direccion"
                control={control}
                render={({ field }) => (
                  <InputTextarea
                    id="direccion"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    rows={2}
                    className={getFieldClass("direccion")}
                    maxLength={255}
                    style={{ fontWeight: "bold", textTransform: "uppercase" }}
                  />
                )}
              />
              {getFormErrorMessage("direccion")}
            </div>

            <div className="field col-12">
              <label htmlFor="direccionArmada">Dirección Armada</label>
              <Controller
                name="direccionArmada"
                control={control}
                render={({ field }) => (
                  <InputTextarea
                    id="direccionArmada"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    rows={2}
                    className={getFieldClass("direccionArmada")}
                    maxLength={500}
                    style={{ fontWeight: "bold", textTransform: "uppercase" }}
                    disabled
                  />
                )}
              />
              {getFormErrorMessage("direccionArmada")}
            </div>

            <div className="field col-12">
              <label htmlFor="ubigeoId">Ubigeo *</label>
              <div className="p-inputgroup">
                <InputText
                  id="ubigeoId"
                  value={direccionSeleccionada?.ubigeo ? 
                    `${direccionSeleccionada.ubigeo.codigo} - ${direccionSeleccionada.ubigeo.nombreDistrito || 'N/A'}` : 
                    ubigeoTextoSeleccionado
                  }
                  className={getFieldClass("ubigeoId")}
                  disabled
                  style={{ fontWeight: "bold" }}
                />
                <Button
                  icon="pi pi-search"
                  className="p-button-outlined"
                  type="button"
                  tooltip="Buscar Ubigeo"
                  onClick={() => setUbigeoModalVisible(true)}
                />
              </div>
              {getFormErrorMessage("ubigeoId")}
            </div>

            <div className="field col-12">
              <label htmlFor="referencia">Referencia</label>
              <Controller
                name="referencia"
                control={control}
                render={({ field }) => (
                  <InputTextarea
                    id="referencia"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    rows={2}
                    className={getFieldClass("referencia")}
                    maxLength={255}
                    style={{ fontWeight: "bold", textTransform: "uppercase" }}
                  />
                )}
              />
              {getFormErrorMessage("referencia")}
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="telefono">Teléfono</label>
                <Controller
                  name="telefono"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="telefono"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className={getFieldClass("telefono")}
                      maxLength={20}
                      style={{ fontWeight: "bold", textTransform: "uppercase" }}
                    />
                  )}
                />
                {getFormErrorMessage("telefono")}
              </div>

              <div style={{ flex: 1 }}>
                <label htmlFor="correo">Correo</label>
                <Controller
                  name="correo"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="correo"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className={getFieldClass("correo")}
                      maxLength={100}
                      style={{ fontWeight: "bold", textTransform: "uppercase" }}
                    />
                  )}
                />
                {getFormErrorMessage("correo")}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 10,
                marginBottom: 10,
                gap: 5,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <ButtonGroup style={{ gap: 5 }}>
                <Controller
                  name="fiscal"
                  control={control}
                  render={({ field }) => (
                    <ToggleButton
                      id="fiscal"
                      onLabel="ES FISCAL"
                      offLabel="NO ES FISCAL"
                      onIcon="pi pi-check"
                      offIcon="pi pi-times"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      className={`${getFieldClass("fiscal")}`}
                    />
                  )}
                />
                <Controller
                  name="activo"
                  control={control}
                  render={({ field }) => (
                    <ToggleButton
                      id="activo"
                      onLabel="ACTIVO"
                      offLabel="INACTIVO"
                      onIcon="pi pi-check"
                      offIcon="pi pi-times"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      className={`${getFieldClass("activo")}`}
                    />
                  )}
                />
                <Controller
                  name="almacenPrincipal"
                  control={control}
                  render={({ field }) => (
                    <ToggleButton
                      id="almacenPrincipal"
                      onLabel="ES ALMACEN PRINCIPAL"
                      offLabel="NO ES ALMACEN PRINCIPAL"
                      onIcon="pi pi-check"
                      offIcon="pi pi-times"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      className={`${getFieldClass("almacenPrincipal")}`}
                    />
                  )}
                />
              </ButtonGroup>
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
              <Button
                label="Cancelar"
                icon="pi pi-times"
                className="p-button-secondary"
                type="button"
                onClick={cerrarDialogo}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Button
                label={direccionSeleccionada ? "Actualizar" : "Crear"}
                icon={direccionSeleccionada ? "pi pi-check" : "pi pi-plus"}
                className="p-button-success"
                type="button"
                loading={loading}
                onClick={async () => {
                  // Validar formulario manualmente
                  const isValid = await trigger();
                  if (isValid) {
                    // Obtener datos del formulario y guardar
                    const formData = getValues();
                    await onSubmitDireccion(formData);
                  }
                }}
              />
            </div>
          </div>
        </form>
      </Dialog>
      {/* Modal de selección de Ubigeo */}
      <Dialog
        header={`Seleccionar Ubigeo ${direccionSeleccionada?.ubigeo ? 
          `(Actual: ${direccionSeleccionada.ubigeo.codigo} - ${direccionSeleccionada.ubigeo.nombreDistrito})` : 
          ''}`}
        visible={ubigeoModalVisible}
        onHide={() => setUbigeoModalVisible(false)}
        style={{ width: "800px" }}
        modal
      >
        <UbigeoSelector
          onUbigeoSelect={(ubigeo) => {
            // Actualizar el campo ubigeoId con el ID seleccionado
            setValue("ubigeoId", ubigeo.id);
            // Actualizar la dirección seleccionada para mostrar la info
            if (direccionSeleccionada) {
              setDireccionSeleccionada({
                ...direccionSeleccionada,
                ubigeoId: ubigeo.id,
                ubigeo: ubigeo
              });
            }
            // Actualizar texto seleccionado
            setUbigeoTextoSeleccionado(`${ubigeo.codigo} - ${ubigeo.nombreDistrito}`);
            // Cerrar modal
            setUbigeoModalVisible(false);
            // Mostrar confirmación
            toast.current?.show({
              severity: "success",
              summary: "Éxito",
              detail: `Ubigeo seleccionado: ${ubigeo.codigo} - ${ubigeo.nombreDistrito}`,
              life: 3000,
            });
          }}
          onCancel={() => setUbigeoModalVisible(false)}
        />
      </Dialog>
      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar la dirección "${direccionAEliminar?.direccion}"?`}
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
});

export default DetalleDireccionesEntidad;
