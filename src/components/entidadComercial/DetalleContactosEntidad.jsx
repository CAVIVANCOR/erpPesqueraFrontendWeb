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

import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { ButtonGroup } from "primereact/buttongroup";
import { ToggleButton } from "primereact/togglebutton";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { ConfirmDialog } from "primereact/confirmdialog";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  obtenerContactosPorEntidad,
  crearContactoEntidad,
  actualizarContactoEntidad,
  eliminarContactoEntidad,
} from "../../api/contactoEntidad";
import { getCargosPersonal } from "../../api/cargosPersonal";
import { toUpperCaseSafe } from "../../utils/utils";
import { classNames } from "primereact/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../../utils/utils";

// Esquema de validación para contactos - ALINEADO AL MODELO PRISMA
const esquemaValidacionContacto = yup.object().shape({
  nombres: yup
    .string()
    .required("Los nombres son requeridos")
    .max(255, "Máximo 255 caracteres")
    .trim(),
  cargoId: yup.number().nullable().integer("Debe ser un número entero"),
  telefono: yup.string().nullable().max(20, "Máximo 20 caracteres").trim(),
  correoCorportivo: yup
    .string()
    .nullable()
    .email("Formato de email inválido")
    .max(100, "Máximo 100 caracteres")
    .trim(),
  correoPersonal: yup
    .string()
    .nullable()
    .email("Formato de email inválido")
    .max(100, "Máximo 100 caracteres")
    .trim(),
  compras: yup.boolean(),
  ventas: yup.boolean(),
  finanzas: yup.boolean(),
  logistica: yup.boolean(),
  representanteLegal: yup.boolean(),
  observaciones: yup
    .string()
    .nullable()
    .max(500, "Máximo 500 caracteres")
    .trim(),
  activo: yup.boolean(),
});

/**
 * Componente DetalleContactosEntidad
 * @param {Object} props - Props del componente
 * @param {number} props.entidadComercialId - ID de la entidad comercial
 * @param {Array} props.cargosPersonal - Lista de cargos de personal disponibles
 */
const DetalleContactosEntidad = forwardRef(
  ({ entidadComercialId, cargosPersonal = [] }, ref) => {
    // Estados del componente
    const [contactosData, setContactosData] = useState([]);
    const [cargosPersonalData, setCargosPersonalData] = useState([]);
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
      trigger,
      getValues,
      setValue,
    } = useForm({
      resolver: yupResolver(esquemaValidacionContacto),
      defaultValues: {
        nombres: "",
        cargoId: null,
        telefono: "",
        correoCorportivo: "",
        correoPersonal: "",
        compras: false,
        ventas: false,
        finanzas: false,
        logistica: false,
        representanteLegal: false,
        observaciones: "",
        activo: true,
      },
    });

    // Normalizar opciones para dropdowns
    const cargosOptions = cargosPersonalData.map((cargo) => ({
      label: cargo.descripcion,
      value: Number(cargo.id),
    }));

    // Función para cargar contactos desde la API
    const cargarContactos = async () => {
      if (!entidadComercialId) return; // ← ¡YA TIENE LA VALIDACIÓN!
      try {
        setLoading(true);
        const response = await obtenerContactosPorEntidad(entidadComercialId);
        setContactosData(response);
      } catch (error) {
        console.error("❌ [FRONTEND] Error al cargar contactos:", error);
        setContactosData([]);
        toast.current?.show({
          severity: "error",
          summary: "Error al Cargar",
          detail:
            error.response?.data?.message ||
            "Error al cargar los contactos desde el servidor",
          life: 4000,
        });
      } finally {
        setLoading(false);
      }
    };

    // Exponer función recargar mediante ref
    useImperativeHandle(ref, () => ({
      recargar: cargarContactos,
    }));

    // Cargar contactos al montar el componente o cambiar entidadComercialId
    useEffect(() => {
      cargarContactos();
    }, [entidadComercialId]);

    useEffect(() => {
      const cargarCargosPersonal = async () => {
        try {
          const response = await getCargosPersonal();
          setCargosPersonalData(response);
        } catch (error) {
          console.error(
            "❌ [FRONTEND] Error al cargar cargos personal:",
            error
          );
          toast.current?.show({
            severity: "error",
            summary: "Error al Cargar",
            detail:
              error.response?.data?.message ||
              "Error al cargar los cargos personal desde el servidor",
            life: 4000,
          });
        }
      };
      cargarCargosPersonal();
    }, []);

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
      setValue("nombres", contacto.nombres || "");
      setValue("cargoId", contacto.cargoId ? Number(contacto.cargoId) : null);
      setValue("telefono", contacto.telefono || "");
      setValue("correoCorportivo", contacto.correoCorportivo || "");
      setValue("correoPersonal", contacto.correoPersonal || "");
      setValue("compras", Boolean(contacto.compras));
      setValue("ventas", Boolean(contacto.ventas));
      setValue("finanzas", Boolean(contacto.finanzas));
      setValue("logistica", Boolean(contacto.logistica));
      setValue("representanteLegal", Boolean(contacto.representanteLegal));
      setValue("observaciones", contacto.observaciones || "");
      setValue("activo", Boolean(contacto.activo));
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
     * Función ejecutada después de guardar exitosamente
     * Recarga la lista y cierra el diálogo
     */
    const onGuardarExitoso = () => {
      cargarContactos(); // Recargar la lista
      cerrarDialogo(); // Cerrar el diálogo
      reset(); // Limpiar el formulario
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
        const nuevosContactos = contactosData.filter(
          (c) => c.id !== contactoAEliminar.id
        );
        setContactosData(nuevosContactos);

        await eliminarContactoEntidad(contactoAEliminar.id);

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
    const onSubmitContacto = async (data, event) => {
      if (event) event.preventDefault();

      try {
        setLoading(true);

        // Normalizar datos
        const contactoNormalizado = {
          entidadComercialId: Number(entidadComercialId),
          nombres: data.nombres?.trim().toUpperCase(),
          cargoId: data.cargoId || null,
          telefono: data.telefono?.trim().toUpperCase() || null,
          correoCorportivo: data.correoCorportivo?.trim().toLowerCase() || null,
          correoPersonal: data.correoPersonal?.trim().toLowerCase() || null,
          compras: Boolean(data.compras),
          ventas: Boolean(data.ventas),
          finanzas: Boolean(data.finanzas),
          logistica: Boolean(data.logistica),
          representanteLegal: Boolean(data.representanteLegal),
          observaciones: data.observaciones?.trim().toUpperCase() || null,
          activo: Boolean(data.activo),
        };

        let resultado;
        if (contactoSeleccionado) {
          // Actualizar contacto existente
          resultado = await actualizarContactoEntidad(
            contactoSeleccionado.id,
            contactoNormalizado
          );

          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Contacto actualizado correctamente",
            life: 3000,
          });
          onGuardarExitoso();
        } else {
          // Crear nuevo contacto
          resultado = await crearContactoEntidad(contactoNormalizado);

          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Contacto creado correctamente",
            life: 3000,
          });
          onGuardarExitoso();
        }
      } catch (error) {
        console.error("Error al guardar contacto:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail:
            error.response?.data?.message || "Error al guardar el contacto",
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
      return (
        errors[name] && (
          <small className="p-error">{errors[name]?.message}</small>
        )
      );
    };

    // Templates para las columnas
    const cargoTemplate = (rowData) => {
      const cargo = cargosPersonalData.find(
        (c) => Number(c.id) === Number(rowData.cargoId)
      );
      return cargo?.descripcion || rowData.cargoId;
    };
    const estadoTemplate = (rowData) => {
      return (
        <Tag
          value={rowData.activo ? "Activo" : "Inactivo"}
          severity={rowData.activo ? "success" : "danger"}
        />
      );
    };

    const nombreCompletoTemplate = (rowData) => {
      return rowData.nombres;
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
                type="button"
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
          <Column
            field="cargoId"
            header="Cargo"
            body={cargoTemplate}
            sortable
          />
          <Column
            header="Nombre Completo"
            body={nombreCompletoTemplate}
            sortable
          />
          <Column field="telefono" header="Teléfono" sortable />
          <Column
            field="correoCorportivo"
            header="Correo Corporativo"
            sortable
          />
          <Column field="correoPersonal" header="Correo Personal" sortable />
          <Column
            field="activo"
            header="Estado"
            body={estadoTemplate}
            sortable
          />
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
          style={{ width: "900px" }}
          modal
        >
          <form className="p-fluid">
            <div className="formgrid grid">
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
                      maxLength={255}
                      style={{ textTransform: "uppercase" }}
                    />
                  )}
                />
                {getFormErrorMessage("nombres")}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                }}
              >
                <div style={{ flex: 2 }}>
                  <label htmlFor="cargoId">Cargo</label>
                  <Controller
                    name="cargoId"
                    control={control}
                    render={({ field }) => (
                      <Dropdown
                        id="cargoId"
                        value={field.value}
                        onChange={(e) => field.onChange(e.value)}
                        options={cargosOptions}
                        placeholder="Seleccione cargo"
                        className={getFieldClass("cargoId")}
                      />
                    )}
                  />
                  {getFormErrorMessage("cargoId")}
                </div>

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
                        placeholder="INGRESE TELÉFONO"
                        className={getFieldClass("telefono")}
                        maxLength={20}
                        style={{ textTransform: "uppercase" }}
                      />
                    )}
                  />
                  {getFormErrorMessage("telefono")}
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
                  <label htmlFor="correoCorportivo">Correo Corporativo</label>
                  <Controller
                    name="correoCorportivo"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="correoCorportivo"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="INGRESE CORREO CORPORATIVO"
                        className={getFieldClass("correoCorportivo")}
                        maxLength={100}
                      />
                    )}
                  />
                  {getFormErrorMessage("correoCorportivo")}
                </div>

                <div style={{ flex: 1 }}>
                  <label htmlFor="correoPersonal">Correo Personal</label>
                  <Controller
                    name="correoPersonal"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="correoPersonal"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="INGRESE CORREO PERSONAL"
                        className={getFieldClass("correoPersonal")}
                        maxLength={100}
                      />
                    )}
                  />
                  {getFormErrorMessage("correoPersonal")}
                </div>
              </div>
              <div className="field col-12 md:col-6">
                <label htmlFor="observaciones">Observaciones</label>
                <Controller
                  name="observaciones"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="observaciones"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="INGRESE OBSERVACIONES"
                      className={getFieldClass("observaciones")}
                      maxLength={500}
                      style={{ textTransform: "uppercase" }}
                    />
                  )}
                />
                {getFormErrorMessage("observaciones")}
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
                    name="compras"
                    control={control}
                    render={({ field }) => (
                      <ToggleButton
                        id="compras"
                        onLabel="COMPRAS"
                        offLabel="COMPRAS"
                        onIcon="pi pi-check"
                        offIcon="pi pi-times"
                        checked={field.value}
                        size="small"
                        onChange={(e) => field.onChange(e.value)}
                        className={`${getFieldClass("compras")}`}
                      />
                    )}
                  />
                  <Controller
                    name="ventas"
                    control={control}
                    render={({ field }) => (
                      <ToggleButton
                        id="ventas"
                        onLabel="VENTAS"
                        offLabel="VENTAS"
                        onIcon="pi pi-check"
                        offIcon="pi pi-times"
                        checked={field.value}
                        size="small"
                        onChange={(e) => field.onChange(e.value)}
                        className={`${getFieldClass("ventas")}`}
                      />
                    )}
                  />
                  <Controller
                    name="finanzas"
                    control={control}
                    render={({ field }) => (
                      <ToggleButton
                        id="finanzas"
                        onLabel="FINANZAS"
                        offLabel="FINANZAS"
                        onIcon="pi pi-check"
                        offIcon="pi pi-times"
                        checked={field.value}
                        size="small"
                        onChange={(e) => field.onChange(e.value)}
                        className={`${getFieldClass("finanzas")}`}
                      />
                    )}
                  />
                  <Controller
                    name="logistica"
                    control={control}
                    render={({ field }) => (
                      <ToggleButton
                        id="logistica"
                        onLabel="LOGISTICA"
                        offLabel="LOGISTICA"
                        onIcon="pi pi-check"
                        offIcon="pi pi-times"
                        checked={field.value}
                        size="small"
                        onChange={(e) => field.onChange(e.value)}
                        className={`${getFieldClass("logistica")}`}
                      />
                    )}
                  />
                  <Controller
                    name="representanteLegal"
                    control={control}
                    render={({ field }) => (
                      <ToggleButton
                        id="representanteLegal"
                        onLabel="REP. LEGAL"
                        offLabel="REP. LEGAL"
                        onIcon="pi pi-check"
                        offIcon="pi pi-times"
                        checked={field.value}
                        size="small"
                        onChange={(e) => field.onChange(e.value)}
                        className={`${getFieldClass("representanteLegal")}`}
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
                        offLabel="CESADO"
                        onIcon="pi pi-check"
                        offIcon="pi pi-times"
                        checked={field.value}
                        size="small"
                        onChange={(e) => field.onChange(e.value)}
                        className={`${getFieldClass("activo")}`}
                      />
                    )}
                  />
                </ButtonGroup>
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
                type="button"
                onClick={async () => {
                  // Validar formulario manualmente
                  const isValid = await trigger();
                  if (isValid) {
                    // Obtener datos del formulario y guardar
                    const formData = getValues();
                    await onSubmitContacto(formData);
                  }
                }}
                loading={loading}
              />
            </div>
          </form>
        </Dialog>

        <ConfirmDialog
          visible={confirmVisible}
          onHide={() => setConfirmVisible(false)}
          message={`¿Está seguro de eliminar el contacto "${contactoAEliminar?.nombres}"?`}
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
  }
);

export default DetalleContactosEntidad;
