/**
 * DetalleVehiculosEntidad.jsx
 *
 * Componente CRUD para gestionar vehículos de una entidad comercial.
 * Sigue el patrón profesional ERP Megui con control de roles y feedback visual.
 * Patrón basado exactamente en TipoEquipo.jsx para máxima consistencia.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { ButtonGroup } from "primereact/buttongroup";
import { ToggleButton } from "primereact/togglebutton";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import AuditInfo from "../shared/AuditInfo";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { classNames } from "primereact/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../../utils/utils";
import {
  obtenerVehiculosPorEntidad,
  crearVehiculoEntidad,
  actualizarVehiculoEntidad,
  eliminarVehiculoEntidad,
} from "../../api/vehiculoEntidad";
import { getTiposVehiculo } from "../../api/tipoVehiculo";
import { getVehiculosPorRuc } from "../../api/activo";

// Esquema de validación para vehículos
const esquemaValidacionVehiculo = yup.object().shape({
  tipoVehiculoId: yup.number().required("El tipo de vehículo es requerido"),
  placa: yup
    .string()
    .required("La placa es requerida")
    .max(10, "Máximo 10 caracteres"),
  marca: yup
    .string()
    .required("La marca es requerida")
    .max(50, "Máximo 50 caracteres"),
  modelo: yup
    .string()
    .required("El modelo es requerido")
    .max(50, "Máximo 50 caracteres"),
  color: yup
    .string()
    .required("El color es requerido")
    .max(30, "Máximo 30 caracteres"),
  anio: yup
    .number()
    .required("El año es requerido")
    .min(1900, "Año mínimo 1900")
    .max(
      new Date().getFullYear() + 1,
      "Año máximo " + (new Date().getFullYear() + 1)
    ),
  numeroMotor: yup.string().max(50, "Máximo 50 caracteres").nullable(),
  numeroSerie: yup.string().max(50, "Máximo 50 caracteres").nullable(),
  capacidadTon: yup
    .number()
    .min(0, "La capacidad debe ser mayor o igual a 0")
    .nullable(),
  observaciones: yup.string().max(500, "Máximo 500 caracteres").nullable(),
  cesado: yup.boolean(),
  activoId: yup.number().nullable(), // Corregido para hacer activoId opcional
});

/**
 * Componente DetalleVehiculosEntidad
 * @param {Object} props - Props del componente
 * @param {number} props.entidadComercialId - ID de la entidad comercial
 * @param {Object} props.entidadComercial - Entidad comercial
 */
const DetalleVehiculosEntidad = forwardRef(
  (
    { entidadComercialId, entidadComercial, readOnly = false, permisos = {} },
    ref
  ) => {
    const [vehiculosData, setVehiculosData] = useState([]);
    const [tiposVehiculo, setTiposVehiculo] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [vehiculoAEliminar, setVehiculoAEliminar] = useState(null);
    const [globalFilter, setGlobalFilter] = useState("");
    const [activos, setActivos] = useState([]); // Estado para almacenar los activos

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
      resolver: yupResolver(esquemaValidacionVehiculo),
      defaultValues: {
        tipoVehiculoId: null,
        placa: "",
        marca: "",
        modelo: "",
        color: "",
        anio: null,
        numeroMotor: "",
        numeroSerie: "",
        capacidadTon: null,
        observaciones: "",
        cesado: false,
        activoId: null,
      },
    });

    /**
     * Abre el diálogo para crear un nuevo vehículo
     */
    const abrirDialogoNuevo = () => {
      setVehiculoSeleccionado(null);
      reset();
      setDialogVisible(true);
    };

    /**
     * Abre el diálogo para editar un vehículo existente
     * @param {Object} vehiculo - Vehículo a editar
     */
    const abrirDialogoEdicion = (vehiculo) => {
      setVehiculoSeleccionado(vehiculo);
      setValue("tipoVehiculoId", Number(vehiculo.tipoVehiculoId));
      setValue("placa", vehiculo.placa || "");
      setValue("marca", vehiculo.marca || "");
      setValue("modelo", vehiculo.modelo || "");
      setValue("color", vehiculo.color || "");
      setValue("anio", Number(vehiculo.anio) || new Date().getFullYear());
      setValue("numeroMotor", vehiculo.numeroMotor || "");
      setValue("numeroSerie", vehiculo.numeroSerie || "");
      setValue("capacidadTon", vehiculo.capacidadTon || null);
      setValue("observaciones", vehiculo.observaciones || "");
      setValue("cesado", Boolean(vehiculo.cesado));
      setValue(
        "activoId",
        vehiculo.activoId ? Number(vehiculo.activoId) : null
      );
      setDialogVisible(true);
    };

    /**
     * Cierra el diálogo
     */
    const cerrarDialogo = () => {
      setDialogVisible(false);
      setVehiculoSeleccionado(null);
    };

    /**
     * Confirma la eliminación de un vehículo
     * @param {Object} vehiculo - Vehículo a eliminar
     */
    const confirmarEliminacion = (vehiculo) => {
      setVehiculoAEliminar(vehiculo);
      setConfirmVisible(true);
    };

    /**
     * Elimina un vehículo
     */
    const eliminar = async () => {
      try {
        await eliminarVehiculoEntidad(vehiculoAEliminar.id);
        await cargarVehiculos();
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Vehículo eliminado correctamente",
          life: 3000,
        });
      } catch (error) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al eliminar vehículo",
          life: 3000,
        });
      } finally {
        setConfirmVisible(false);
        setVehiculoAEliminar(null);
      }
    };

    /**
     * Callback de guardado exitoso
     */
    const onGuardarExitoso = () => {
      cerrarDialogo();
    };

    /**
     * Guarda un vehículo (crear o actualizar)
     * @param {Object} data - Datos del vehículo
     */
    const onSubmitVehiculo = async (data) => {
      try {
        setLoading(true);

        // Normalizar datos según estándar ERP
        const vehiculoNormalizado = {
          ...data,
          entidadComercialId: entidadComercialId,
          placa: data.placa?.trim().toUpperCase(),
          marca: data.marca?.trim().toUpperCase(),
          modelo: data.modelo?.trim().toUpperCase(),
          color: data.color?.trim().toUpperCase(),
          numeroMotor: data.numeroMotor?.trim().toUpperCase() || null,
          numeroSerie: data.numeroSerie?.trim().toUpperCase() || null,
          observaciones: data.observaciones?.trim().toUpperCase() || null,
        };

        const esEdicion = vehiculoSeleccionado && vehiculoSeleccionado.id;

        if (esEdicion) {
          // Actualizar vehículo existente en BD
          // Agregar campos de auditoría para actualización
          const datosActualizacion = {
            ...vehiculoNormalizado,
            // Si fechaCreacion o creadoPor son null/vacíos, asignarlos ahora
            fechaCreacion: vehiculoSeleccionado.fechaCreacion || new Date(),
            creadoPor:
              vehiculoSeleccionado.creadoPor ||
              (usuario?.personalId ? Number(usuario.personalId) : null),
            // Siempre actualizar estos campos
            fechaActualizacion: new Date(),
            actualizadoPor: usuario?.personalId
              ? Number(usuario.personalId)
              : null,
          };

          await actualizarVehiculoEntidad(
            vehiculoSeleccionado.id,
            datosActualizacion
          );
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Vehículo actualizado correctamente",
            life: 3000,
          });
        } else {
          // Crear nuevo vehículo en BD
          // Agregar campos de auditoría para creación
          const datosCreacion = {
            ...vehiculoNormalizado,
            fechaCreacion: new Date(),
            creadoPor: usuario?.personalId ? Number(usuario.personalId) : null,
            fechaActualizacion: new Date(),
            actualizadoPor: usuario?.personalId
              ? Number(usuario.personalId)
              : null,
          };

          await crearVehiculoEntidad(datosCreacion);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Vehículo creado correctamente",
            life: 3000,
          });
        }

        // Recargar datos desde BD
        await cargarVehiculos();
        cerrarDialogo();
      } catch (error) {
        console.error("Error al guardar vehículo:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: error.response?.data?.message || "Error al guardar vehículo",
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
    const tipoVehiculoTemplate = (rowData) => {
      const tipo = tiposVehiculo.find(
        (t) => Number(t.value) === Number(rowData.tipoVehiculoId)
      );
      return tipo?.label || rowData.tipoVehiculoId;
    };

    const vehiculoTemplate = (rowData) => {
      return `${rowData.placa} - ${rowData.marca} ${rowData.modelo}`;
    };

    const capacidadTemplate = (rowData) => {
      const carga = rowData.capacidadTon ? `${rowData.capacidadTon}kg` : "";
      const capacidades = [carga].filter(Boolean);
      return capacidades.length > 0 ? capacidades.join(" / ") : "N/A";
    };

    const cesadoTemplate = (rowData) => {
      return (
        <Tag
          value={rowData.cesado ? "Cesado" : "Activo"}
          severity={rowData.cesado ? "danger" : "success"}
        />
      );
    };

    const activoTemplate = (rowData) => {
      const activo = activos.find(
        (t) => Number(t.value) === Number(rowData.activoId)
      );
      return activo?.label || rowData.activoId;
    };

    // Renderizado de botones de acción
    const accionesTemplate = (rowData) => (
      <div onClick={(e) => e.stopPropagation()}>
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-mr-2"
          disabled={!permisos.puedeVer && !permisos.puedeEditar}
          onClick={(ev) => {
            if (permisos.puedeVer || permisos.puedeEditar) {
              abrirDialogoEdicion(rowData);
            }
          }}
          tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
          type="button"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger"
          disabled={!permisos.puedeEliminar}
          onClick={(ev) => {
            if (permisos.puedeEliminar) {
              confirmarEliminacion(rowData);
            }
          }}
          tooltip="Eliminar"
          type="button"
        />
      </div>
    );

    const cargarVehiculos = async () => {
      try {
        const vehiculos = await obtenerVehiculosPorEntidad(entidadComercialId);
        setVehiculosData(vehiculos);
      } catch (error) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar vehículos",
          life: 3000,
        });
      }
    };

    const cargarTiposVehiculo = async () => {
      try {
        const tipos = await getTiposVehiculo();
        // Transformar los datos al formato que espera el Dropdown (value/label)
        const tiposFormateados = tipos
          .filter((tipo) => tipo.activo) // Solo tipos activos
          .map((tipo) => ({
            value: Number(tipo.id), // Asegurar que sea número
            label: tipo.nombre,
          }));

        setTiposVehiculo(tiposFormateados);
      } catch (error) {
        console.error("Error al cargar tipos de vehículo:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar tipos de vehículo",
          life: 3000,
        });
      }
    };

    const cargarActivos = async () => {
      try {
        const activos = await getVehiculosPorRuc(
          entidadComercial.numeroDocumento
        );
        // Formatear activos para el dropdown
        const activosFormateados = activos.map((activo) => ({
          value: Number(activo.id),
          label: `${activo.nombre}${
            activo.descripcion ? " - " + activo.descripcion : ""
          }`,
        }));
        setActivos(activosFormateados);
      } catch (error) {
        console.error("Error al cargar activos:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar activos",
          life: 3000,
        });
      }
    };

    // Exponer función recargar mediante ref
    useImperativeHandle(ref, () => ({
      recargar: cargarVehiculos,
    }));

    useEffect(() => {
      if (entidadComercialId) {
        cargarVehiculos();
        cargarTiposVehiculo();
      }
    }, [entidadComercialId]);

    useEffect(() => {
      if (entidadComercial?.numeroDocumento) {
        cargarActivos();
      }
    }, [entidadComercial]);

    return (
      <div className="p-4">
        <Toast ref={toast} />
        <DataTable
          value={vehiculosData}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onRowClick={(e) => abrirDialogoEdicion(e.data)}
          selectionMode="single"
          className="p-datatable-hover cursor-pointer"
          emptyMessage="No se encontraron vehículos"
          globalFilter={globalFilter}
          header={
            <div className="flex align-items-center gap-2">
              <h2>Gestión de Vehículos</h2>
              <Button
                label="Nuevo"
                icon="pi pi-plus"
                size="small"
                raised
                tooltip="Nuevo Vehículo"
                outlined
                className="p-button-success"
                onClick={abrirDialogoNuevo}
                type="button"
                disabled={readOnly || loading}
              />
              <span className="p-input-icon-left">
                <InputText
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Buscar vehículos..."
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
            field="tipoVehiculoId"
            header="Tipo"
            body={tipoVehiculoTemplate}
            sortable
          />
          <Column header="Vehículo" body={vehiculoTemplate} sortable />
          <Column field="color" header="Color" sortable />
          <Column field="anio" header="Año" sortable />
          <Column header="Capacidad" body={capacidadTemplate} sortable />
          <Column
            field="cesado"
            header="Cesado"
            body={cesadoTemplate}
            sortable
          />
          <Column
            field="activoId"
            header="Activo"
            body={activoTemplate}
            sortable
          />
          <Column
            body={accionesTemplate}
            header="Acciones"
            style={{ width: "8rem" }}
          />
        </DataTable>

        <Dialog
          header={vehiculoSeleccionado ? "Editar Vehículo" : "Nuevo Vehículo"}
          visible={dialogVisible}
          onHide={cerrarDialogo}
          style={{ width: "900px" }}
          modal
        >
          <form onSubmit={handleSubmit(onSubmitVehiculo)} className="p-fluid">
            <div className="formgrid grid">
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 10,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                  marginBottom: 10,
                  marginTop: 10,
                }}
              >
                <div style={{ flex: 1 }}>
                  <label htmlFor="tipoVehiculoId">Tipo de Vehículo *</label>
                  <Controller
                    name="tipoVehiculoId"
                    control={control}
                    render={({ field }) => (
                      <Dropdown
                        id="tipoVehiculoId"
                        value={field.value}
                        onChange={(e) => field.onChange(e.value)}
                        options={tiposVehiculo}
                        placeholder="Seleccione tipo de vehículo"
                        className={getFieldClass("tipoVehiculoId")}
                        style={{ fontWeight: "bold" }}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                  {getFormErrorMessage("tipoVehiculoId")}
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="placa">Placa *</label>
                  <Controller
                    name="placa"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="placa"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="INGRESE PLACA"
                        className={getFieldClass("placa")}
                        maxLength={10}
                        style={{
                          textTransform: "uppercase",
                          fontWeight: "bold",
                        }}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                  {getFormErrorMessage("placa")}
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="marca">Marca *</label>
                  <Controller
                    name="marca"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="marca"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="INGRESE MARCA"
                        className={getFieldClass("marca")}
                        maxLength={50}
                        style={{
                          textTransform: "uppercase",
                          fontWeight: "bold",
                        }}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                  {getFormErrorMessage("marca")}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 10,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                  marginBottom: 10,
                  marginTop: 10,
                }}
              >
                <div style={{ flex: 1 }}>
                  <label htmlFor="modelo">Modelo *</label>
                  <Controller
                    name="modelo"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="modelo"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="INGRESE MODELO"
                        className={getFieldClass("modelo")}
                        maxLength={50}
                        style={{
                          textTransform: "uppercase",
                          fontWeight: "bold",
                        }}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                  {getFormErrorMessage("modelo")}
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="color">Color *</label>
                  <Controller
                    name="color"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="color"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="INGRESE COLOR"
                        className={getFieldClass("color")}
                        maxLength={30}
                        style={{
                          textTransform: "uppercase",
                          fontWeight: "bold",
                        }}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                  {getFormErrorMessage("color")}
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="anio">Año *</label>
                  <Controller
                    name="anio"
                    control={control}
                    render={({ field }) => (
                      <InputNumber
                        id="anio"
                        value={field.value}
                        onValueChange={(e) => field.onChange(e.value)}
                        min={1900}
                        max={new Date().getFullYear() + 1}
                        useGrouping={false}
                        className={getFieldClass("anio")}
                        disabled={readOnly || loading}
                        inputStyle={{ fontWeight: "bold" }}
                      />
                    )}
                  />
                  {getFormErrorMessage("anio")}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 10,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                  marginBottom: 10,
                  marginTop: 10,
                }}
              >
                <div style={{ flex: 1 }}>
                  <label htmlFor="numeroMotor">Número de Motor</label>
                  <Controller
                    name="numeroMotor"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="numeroMotor"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="INGRESE NÚMERO DE MOTOR"
                        className={getFieldClass("numeroMotor")}
                        maxLength={50}
                        style={{
                          textTransform: "uppercase",
                          fontWeight: "bold",
                        }}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                  {getFormErrorMessage("numeroMotor")}
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="numeroSerie">Número de Serie</label>
                  <Controller
                    name="numeroSerie"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="numeroSerie"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="INGRESE NÚMERO DE SERIE"
                        className={getFieldClass("numeroSerie")}
                        maxLength={50}
                        style={{
                          textTransform: "uppercase",
                          fontWeight: "bold",
                        }}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                  {getFormErrorMessage("numeroSerie")}
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="capacidadTon">Capacidad de Carga (kg)</label>
                  <Controller
                    name="capacidadTon"
                    control={control}
                    render={({ field }) => (
                      <InputNumber
                        id="capacidadTon"
                        value={field.value}
                        onValueChange={(e) => field.onChange(e.value)}
                        min={0}
                        maxFractionDigits={2}
                        className={getFieldClass("capacidadTon")}
                        disabled={readOnly || loading}
                        inputStyle={{ fontWeight: "bold" }}
                      />
                    )}
                  />
                  {getFormErrorMessage("capacidadTon")}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: 10,
                  gap: 5,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                }}
              >
                <div style={{ flex: 1 }}>
                  <label htmlFor="activoId">Enlace con Activos</label>
                  <Controller
                    name="activoId"
                    control={control}
                    render={({ field }) => (
                      <Dropdown
                        id="activoId"
                        value={field.value}
                        onChange={(e) => field.onChange(e.value)}
                        options={activos}
                        placeholder="Seleccione activo"
                        className={getFieldClass("activoId")}
                        style={{
                          textTransform: "uppercase",
                          fontWeight: "bold",
                        }}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                  {getFormErrorMessage("activoId")}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "end",
                  gap: 10,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                  marginBottom: 10,
                  marginTop: 10,
                }}
              >
                <div style={{ flex: 3 }}>
                  <label htmlFor="observaciones">Observaciones</label>
                  <Controller
                    name="observaciones"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="observaciones"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="INGRESE OBSERVACIONES ADICIONALES"
                        className={getFieldClass("observaciones")}
                        style={{
                          textTransform: "uppercase",
                          fontWeight: "bold",
                        }}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                  {getFormErrorMessage("observaciones")}
                </div>
                <div style={{ flex: 0.5 }}>
                  <Controller
                    name="cesado"
                    control={control}
                    render={({ field }) => (
                      <ToggleButton
                        id="cesado"
                        onLabel="CESADO"
                        offLabel="ACTIVO"
                        onIcon="pi pi-check"
                        offIcon="pi pi-times"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.value)}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "end",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
                marginBottom: 10,
                marginTop: 10,
              }}
            >
              {/* Información de Auditoría */}
              <AuditInfo data={vehiculoSeleccionado} />
              <div style={{ flex: 1 }}>
              <Button
                label="Cancelar"
                icon="pi pi-times"
                type="button"
                onClick={cerrarDialogo}
                className="p-button-warning"
                severity="warning"
                raised
                size="small"
                outlined
              />
              </div>
              <div style={{ flex: 1 }}>
              <Button
                label={vehiculoSeleccionado ? "Actualizar" : "Crear"}
                icon={vehiculoSeleccionado ? "pi pi-check" : "pi pi-plus"}
                className="p-button-success"
                type="button"
                onClick={handleSubmit(onSubmitVehiculo)}
                raised
                size="small"
                loading={loading}
                severity="success"
                disabled={readOnly || loading}
              />
              </div>
            </div>
          </form>
        </Dialog>

        <ConfirmDialog
          visible={confirmVisible}
          onHide={() => setConfirmVisible(false)}
          message={`¿Está seguro de eliminar el vehículo "${vehiculoAEliminar?.placa}"?`}
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

export default DetalleVehiculosEntidad;
