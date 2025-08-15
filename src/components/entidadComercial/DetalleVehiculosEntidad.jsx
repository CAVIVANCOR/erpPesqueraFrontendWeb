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

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
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
import { 
  obtenerVehiculosPorEntidad,
  crearVehiculoEntidad, 
  actualizarVehiculoEntidad, 
  eliminarVehiculoEntidad 
} from "../../api/vehiculoEntidad";

// Esquema de validación para vehículos
const esquemaValidacionVehiculo = yup.object().shape({
  tipoVehiculoId: yup.number().required("El tipo de vehículo es requerido"),
  placa: yup.string().required("La placa es requerida").max(10, "Máximo 10 caracteres"),
  marca: yup.string().required("La marca es requerida").max(50, "Máximo 50 caracteres"),
  modelo: yup.string().required("El modelo es requerido").max(50, "Máximo 50 caracteres"),
  color: yup.string().required("El color es requerido").max(30, "Máximo 30 caracteres"),
  anio: yup.number().required("El año es requerido").min(1900, "Año mínimo 1900").max(new Date().getFullYear() + 1, "Año máximo " + (new Date().getFullYear() + 1)),
  numeroMotor: yup.string().max(50, "Máximo 50 caracteres").nullable(),
  numeroChasis: yup.string().max(50, "Máximo 50 caracteres").nullable(),
  capacidadCarga: yup.number().min(0, "La capacidad debe ser mayor o igual a 0").nullable(),
  capacidadPasajeros: yup.number().min(0, "La capacidad debe ser mayor o igual a 0").nullable(),
  observaciones: yup.string().max(500, "Máximo 500 caracteres").nullable(),
  esPrincipal: yup.boolean(),
  estado: yup.boolean(),
});

/**
 * Componente DetalleVehiculosEntidad
 * @param {Object} props - Props del componente
 * @param {number} props.entidadComercialId - ID de la entidad comercial
 * @param {Array} props.vehiculos - Lista de vehículos
 * @param {Function} props.onVehiculosChange - Callback cuando cambian los vehículos
 * @param {Array} props.tiposVehiculo - Lista de tipos de vehículo
 */
const DetalleVehiculosEntidad = forwardRef(({
  entidadComercialId,
  vehiculos = [],
  onVehiculosChange,
  tiposVehiculo = []
}, ref) => {
  // Estados del componente
  const [vehiculosData, setVehiculosData] = useState(vehiculos);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [vehiculoAEliminar, setVehiculoAEliminar] = useState(null);
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
    resolver: yupResolver(esquemaValidacionVehiculo),
    defaultValues: {
      tipoVehiculoId: null,
      placa: "",
      marca: "",
      modelo: "",
      color: "",
      anio: new Date().getFullYear(),
      numeroMotor: "",
      numeroChasis: "",
      capacidadCarga: null,
      capacidadPasajeros: null,
      observaciones: "",
      esPrincipal: false,
      estado: true,
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
    setValue("numeroChasis", vehiculo.numeroChasis || "");
    setValue("capacidadCarga", vehiculo.capacidadCarga || null);
    setValue("capacidadPasajeros", vehiculo.capacidadPasajeros || null);
    setValue("observaciones", vehiculo.observaciones || "");
    setValue("esPrincipal", Boolean(vehiculo.esPrincipal));
    setValue("estado", Boolean(vehiculo.estado));
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
      const nuevosVehiculos = vehiculosData.filter(v => v.tempId !== vehiculoAEliminar.tempId);
      setVehiculosData(nuevosVehiculos);
      onVehiculosChange?.(nuevosVehiculos);
      
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
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: vehiculoSeleccionado
        ? "Vehículo actualizado correctamente"
        : "Vehículo creado correctamente",
      life: 3000,
    });
  };

  /**
   * Guarda un vehículo (crear o actualizar)
   * @param {Object} data - Datos del vehículo
   */
  const onSubmitVehiculo = async (data) => {
    try {
      setLoading(true);

      // Normalizar datos a mayúsculas
      const vehiculoNormalizado = {
        ...data,
        placa: data.placa?.trim().toUpperCase(),
        marca: data.marca?.trim().toUpperCase(),
        modelo: data.modelo?.trim().toUpperCase(),
        color: data.color?.trim().toUpperCase(),
        numeroMotor: data.numeroMotor?.trim().toUpperCase() || null,
        numeroChasis: data.numeroChasis?.trim().toUpperCase() || null,
        observaciones: data.observaciones?.trim().toUpperCase() || null,
        tempId: vehiculoSeleccionado?.tempId || Date.now(),
      };

      let nuevosVehiculos;
      if (vehiculoSeleccionado) {
        // Actualizar vehículo existente
        nuevosVehiculos = vehiculosData.map(v => 
          v.tempId === vehiculoSeleccionado.tempId ? vehiculoNormalizado : v
        );
      } else {
        // Agregar nuevo vehículo
        nuevosVehiculos = [...vehiculosData, vehiculoNormalizado];
      }

      setVehiculosData(nuevosVehiculos);
      onVehiculosChange?.(nuevosVehiculos);
      onGuardarExitoso();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar vehículo",
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
  const tipoVehiculoTemplate = (rowData) => {
    const tipo = tiposVehiculo.find(t => Number(t.value) === Number(rowData.tipoVehiculoId));
    return tipo?.label || rowData.tipoVehiculoId;
  };

  const vehiculoTemplate = (rowData) => {
    return `${rowData.placa} - ${rowData.marca} ${rowData.modelo}`;
  };

  const capacidadTemplate = (rowData) => {
    const carga = rowData.capacidadCarga ? `${rowData.capacidadCarga}kg` : "";
    const pasajeros = rowData.capacidadPasajeros ? `${rowData.capacidadPasajeros}p` : "";
    const capacidades = [carga, pasajeros].filter(Boolean);
    return capacidades.length > 0 ? capacidades.join(" / ") : "N/A";
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

  const cargarVehiculos = async () => {
    try {
      const vehiculos = await obtenerVehiculosPorEntidad(entidadComercialId);
      setVehiculosData(vehiculos);
      onVehiculosChange?.(vehiculos);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar vehículos",
        life: 3000,
      });
    }
  };

  // Exponer función recargar mediante ref
  useImperativeHandle(ref, () => ({
    recargar: cargarVehiculos
  }));

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
        <Column field="tipoVehiculoId" header="Tipo" body={tipoVehiculoTemplate} sortable />
        <Column header="Vehículo" body={vehiculoTemplate} sortable />
        <Column field="color" header="Color" sortable />
        <Column field="anio" header="Año" sortable />
        <Column header="Capacidad" body={capacidadTemplate} sortable />
        <Column field="esPrincipal" header="Principal" body={esPrincipalTemplate} sortable />
        <Column field="estado" header="Estado" body={estadoTemplate} sortable />
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
            <div className="field col-12 md:col-6">
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
                  />
                )}
              />
              {getFormErrorMessage("tipoVehiculoId")}
            </div>

            <div className="field col-12 md:col-6">
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
                    style={{ textTransform: 'uppercase' }}
                  />
                )}
              />
              {getFormErrorMessage("placa")}
            </div>

            <div className="field col-12 md:col-6">
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
                    style={{ textTransform: 'uppercase' }}
                  />
                )}
              />
              {getFormErrorMessage("marca")}
            </div>

            <div className="field col-12 md:col-6">
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
                    style={{ textTransform: 'uppercase' }}
                  />
                )}
              />
              {getFormErrorMessage("modelo")}
            </div>

            <div className="field col-12 md:col-6">
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
                    style={{ textTransform: 'uppercase' }}
                  />
                )}
              />
              {getFormErrorMessage("color")}
            </div>

            <div className="field col-12 md:col-6">
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
                  />
                )}
              />
              {getFormErrorMessage("anio")}
            </div>

            <div className="field col-12 md:col-6">
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
                    style={{ textTransform: 'uppercase' }}
                  />
                )}
              />
              {getFormErrorMessage("numeroMotor")}
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="numeroChasis">Número de Chasis</label>
              <Controller
                name="numeroChasis"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="numeroChasis"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="INGRESE NÚMERO DE CHASIS"
                    className={getFieldClass("numeroChasis")}
                    maxLength={50}
                    style={{ textTransform: 'uppercase' }}
                  />
                )}
              />
              {getFormErrorMessage("numeroChasis")}
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="capacidadCarga">Capacidad de Carga (kg)</label>
              <Controller
                name="capacidadCarga"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="capacidadCarga"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    min={0}
                    maxFractionDigits={2}
                    className={getFieldClass("capacidadCarga")}
                  />
                )}
              />
              {getFormErrorMessage("capacidadCarga")}
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="capacidadPasajeros">Capacidad de Pasajeros</label>
              <Controller
                name="capacidadPasajeros"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="capacidadPasajeros"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    min={0}
                    useGrouping={false}
                    className={getFieldClass("capacidadPasajeros")}
                  />
                )}
              />
              {getFormErrorMessage("capacidadPasajeros")}
            </div>

            <div className="field col-12">
              <label htmlFor="observaciones">Observaciones</label>
              <Controller
                name="observaciones"
                control={control}
                render={({ field }) => (
                  <InputTextarea
                    id="observaciones"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="INGRESE OBSERVACIONES ADICIONALES"
                    rows={3}
                    className={getFieldClass("observaciones")}
                    maxLength={500}
                    style={{ textTransform: 'uppercase' }}
                  />
                )}
              />
              {getFormErrorMessage("observaciones")}
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
                <label htmlFor="esPrincipal">Es Vehículo Principal</label>
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
              label={vehiculoSeleccionado ? "Actualizar" : "Crear"}
              icon={vehiculoSeleccionado ? "pi pi-check" : "pi pi-plus"}
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
});

export default DetalleVehiculosEntidad;
