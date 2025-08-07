/**
 * DetallePreciosEntidad.jsx
 * 
 * Componente CRUD para gestionar precios especiales de una entidad comercial.
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
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
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

// Esquema de validación para precios especiales
const esquemaValidacionPrecio = yup.object().shape({
  productoId: yup.number().required("El producto es requerido"),
  tipoListaPrecioId: yup.number().required("El tipo de lista de precio es requerido"),
  precio: yup.number().required("El precio es requerido").min(0, "El precio debe ser mayor a 0"),
  descuento: yup.number().min(0, "El descuento debe ser mayor o igual a 0").max(100, "El descuento no puede ser mayor a 100%").nullable(),
  fechaInicio: yup.date().required("La fecha de inicio es requerida"),
  fechaFin: yup.date().nullable().test(
    "fecha-fin-mayor",
    "La fecha fin debe ser mayor a la fecha de inicio",
    function(value) {
      const { fechaInicio } = this.parent;
      if (!value || !fechaInicio) return true;
      return new Date(value) > new Date(fechaInicio);
    }
  ),
  cantidadMinima: yup.number().min(0, "La cantidad mínima debe ser mayor o igual a 0").nullable(),
  cantidadMaxima: yup.number().nullable().test(
    "cantidad-maxima-mayor",
    "La cantidad máxima debe ser mayor a la cantidad mínima",
    function(value) {
      const { cantidadMinima } = this.parent;
      if (!value || !cantidadMinima) return true;
      return Number(value) > Number(cantidadMinima);
    }
  ),
  estado: yup.boolean(),
});

/**
 * Componente DetallePreciosEntidad
 * @param {Object} props - Props del componente
 * @param {number} props.entidadComercialId - ID de la entidad comercial
 * @param {Array} props.precios - Lista de precios especiales
 * @param {Function} props.onPreciosChange - Callback cuando cambian los precios
 * @param {Array} props.productos - Lista de productos
 * @param {Array} props.tiposListaPrecio - Lista de tipos de lista de precio
 */
const DetallePreciosEntidad = ({
  entidadComercialId,
  precios = [],
  onPreciosChange,
  productos = [],
  tiposListaPrecio = []
}) => {
  // Estados del componente
  const [preciosData, setPreciosData] = useState(precios);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [precioSeleccionado, setPrecioSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [precioAEliminar, setPrecioAEliminar] = useState(null);
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
    watch,
  } = useForm({
    resolver: yupResolver(esquemaValidacionPrecio),
    defaultValues: {
      productoId: null,
      tipoListaPrecioId: null,
      precio: 0,
      descuento: 0,
      fechaInicio: new Date(),
      fechaFin: null,
      cantidadMinima: 1,
      cantidadMaxima: null,
      estado: true,
    },
  });

  // Sincronizar precios cuando cambien las props
  useEffect(() => {
    setPreciosData(precios);
  }, [precios]);

  /**
   * Abre el diálogo para crear un nuevo precio especial
   */
  const abrirDialogoNuevo = () => {
    setPrecioSeleccionado(null);
    reset();
    setDialogVisible(true);
  };

  /**
   * Abre el diálogo para editar un precio especial existente
   * @param {Object} precio - Precio a editar
   */
  const abrirDialogoEdicion = (precio) => {
    setPrecioSeleccionado(precio);
    setValue("productoId", Number(precio.productoId));
    setValue("tipoListaPrecioId", Number(precio.tipoListaPrecioId));
    setValue("precio", Number(precio.precio));
    setValue("descuento", Number(precio.descuento) || 0);
    setValue("fechaInicio", new Date(precio.fechaInicio));
    setValue("fechaFin", precio.fechaFin ? new Date(precio.fechaFin) : null);
    setValue("cantidadMinima", Number(precio.cantidadMinima) || 1);
    setValue("cantidadMaxima", Number(precio.cantidadMaxima) || null);
    setValue("estado", Boolean(precio.estado));
    setDialogVisible(true);
  };

  /**
   * Cierra el diálogo
   */
  const cerrarDialogo = () => {
    setDialogVisible(false);
    setPrecioSeleccionado(null);
  };

  /**
   * Confirma la eliminación de un precio especial
   * @param {Object} precio - Precio a eliminar
   */
  const confirmarEliminacion = (precio) => {
    setPrecioAEliminar(precio);
    setConfirmVisible(true);
  };

  /**
   * Elimina un precio especial
   */
  const eliminar = async () => {
    try {
      const nuevosPrecios = preciosData.filter(p => p.tempId !== precioAEliminar.tempId);
      setPreciosData(nuevosPrecios);
      onPreciosChange?.(nuevosPrecios);
      
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Precio especial eliminado correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar precio especial",
        life: 3000,
      });
    } finally {
      setConfirmVisible(false);
      setPrecioAEliminar(null);
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
      detail: precioSeleccionado
        ? "Precio especial actualizado correctamente"
        : "Precio especial creado correctamente",
      life: 3000,
    });
  };

  /**
   * Guarda un precio especial (crear o actualizar)
   * @param {Object} data - Datos del precio
   */
  const onSubmitPrecio = async (data) => {
    try {
      setLoading(true);

      // Normalizar datos
      const precioNormalizado = {
        ...data,
        tempId: precioSeleccionado?.tempId || Date.now(),
      };

      let nuevosPrecios;
      if (precioSeleccionado) {
        // Actualizar precio existente
        nuevosPrecios = preciosData.map(p => 
          p.tempId === precioSeleccionado.tempId ? precioNormalizado : p
        );
      } else {
        // Agregar nuevo precio
        nuevosPrecios = [...preciosData, precioNormalizado];
      }

      setPreciosData(nuevosPrecios);
      onPreciosChange?.(nuevosPrecios);
      onGuardarExitoso();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar precio especial",
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
  const productoTemplate = (rowData) => {
    const producto = productos.find(p => Number(p.value) === Number(rowData.productoId));
    return producto?.label || rowData.productoId;
  };

  const tipoListaPrecioTemplate = (rowData) => {
    const tipo = tiposListaPrecio.find(t => Number(t.value) === Number(rowData.tipoListaPrecioId));
    return tipo?.label || rowData.tipoListaPrecioId;
  };

  const precioTemplate = (rowData) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(rowData.precio);
  };

  const descuentoTemplate = (rowData) => {
    return rowData.descuento ? `${rowData.descuento}%` : "0%";
  };

  const fechaTemplate = (rowData, field) => {
    const fecha = rowData[field];
    return fecha ? new Date(fecha).toLocaleDateString('es-PE') : "N/A";
  };

  const cantidadTemplate = (rowData, field) => {
    return rowData[field] || "N/A";
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
        value={preciosData}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron precios especiales"
        globalFilter={globalFilter}
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Precios Especiales</h2>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              size="small"
              raised
              tooltip="Nuevo Precio Especial"
              outlined
              className="p-button-success"
              onClick={abrirDialogoNuevo}
            />
            <span className="p-input-icon-left">
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar precios especiales..."
                style={{ width: "300px" }}
              />
            </span>
          </div>
        }
        scrollable
        scrollHeight="600px"
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column field="productoId" header="Producto" body={productoTemplate} sortable />
        <Column field="tipoListaPrecioId" header="Tipo Lista" body={tipoListaPrecioTemplate} sortable />
        <Column field="precio" header="Precio" body={precioTemplate} sortable />
        <Column field="descuento" header="Descuento" body={descuentoTemplate} sortable />
        <Column field="fechaInicio" header="Fecha Inicio" body={(rowData) => fechaTemplate(rowData, 'fechaInicio')} sortable />
        <Column field="fechaFin" header="Fecha Fin" body={(rowData) => fechaTemplate(rowData, 'fechaFin')} sortable />
        <Column field="cantidadMinima" header="Cant. Mín." body={(rowData) => cantidadTemplate(rowData, 'cantidadMinima')} sortable />
        <Column field="estado" header="Estado" body={estadoTemplate} sortable />
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ width: "8rem" }}
        />
      </DataTable>

      <Dialog
        header={precioSeleccionado ? "Editar Precio Especial" : "Nuevo Precio Especial"}
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "900px" }}
        modal
      >
        <form onSubmit={handleSubmit(onSubmitPrecio)} className="p-fluid">
          <div className="formgrid grid">
            <div className="field col-12 md:col-6">
              <label htmlFor="productoId">Producto *</label>
              <Controller
                name="productoId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="productoId"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={productos}
                    placeholder="Seleccione producto"
                    className={getFieldClass("productoId")}
                    filter
                    showClear
                  />
                )}
              />
              {getFormErrorMessage("productoId")}
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="tipoListaPrecioId">Tipo de Lista de Precio *</label>
              <Controller
                name="tipoListaPrecioId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="tipoListaPrecioId"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={tiposListaPrecio}
                    placeholder="Seleccione tipo de lista"
                    className={getFieldClass("tipoListaPrecioId")}
                  />
                )}
              />
              {getFormErrorMessage("tipoListaPrecioId")}
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="precio">Precio *</label>
              <Controller
                name="precio"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="precio"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="currency"
                    currency="PEN"
                    locale="es-PE"
                    minFractionDigits={2}
                    maxFractionDigits={4}
                    className={getFieldClass("precio")}
                  />
                )}
              />
              {getFormErrorMessage("precio")}
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="descuento">Descuento (%)</label>
              <Controller
                name="descuento"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="descuento"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    min={0}
                    max={100}
                    suffix="%"
                    maxFractionDigits={2}
                    className={getFieldClass("descuento")}
                  />
                )}
              />
              {getFormErrorMessage("descuento")}
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="fechaInicio">Fecha de Inicio *</label>
              <Controller
                name="fechaInicio"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaInicio"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    dateFormat="dd/mm/yy"
                    placeholder="Seleccione fecha de inicio"
                    className={getFieldClass("fechaInicio")}
                    showIcon
                  />
                )}
              />
              {getFormErrorMessage("fechaInicio")}
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="fechaFin">Fecha de Fin</label>
              <Controller
                name="fechaFin"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaFin"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    dateFormat="dd/mm/yy"
                    placeholder="Seleccione fecha de fin"
                    className={getFieldClass("fechaFin")}
                    showIcon
                    showClear
                  />
                )}
              />
              {getFormErrorMessage("fechaFin")}
            </div>

            <div className="field col-12 md:col-4">
              <label htmlFor="cantidadMinima">Cantidad Mínima</label>
              <Controller
                name="cantidadMinima"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="cantidadMinima"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    min={0}
                    useGrouping={false}
                    className={getFieldClass("cantidadMinima")}
                  />
                )}
              />
              {getFormErrorMessage("cantidadMinima")}
            </div>

            <div className="field col-12 md:col-4">
              <label htmlFor="cantidadMaxima">Cantidad Máxima</label>
              <Controller
                name="cantidadMaxima"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="cantidadMaxima"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    min={0}
                    useGrouping={false}
                    className={getFieldClass("cantidadMaxima")}
                  />
                )}
              />
              {getFormErrorMessage("cantidadMaxima")}
            </div>

            <div className="field col-12 md:col-4">
              <div className="field-checkbox mt-4">
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
              label={precioSeleccionado ? "Actualizar" : "Crear"}
              icon={precioSeleccionado ? "pi pi-check" : "pi pi-plus"}
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
        message={`¿Está seguro de eliminar este precio especial?`}
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

export default DetallePreciosEntidad;
