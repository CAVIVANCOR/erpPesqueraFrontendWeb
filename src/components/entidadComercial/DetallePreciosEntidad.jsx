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

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
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
import { 
  obtenerPreciosPorEntidad,
  crearPrecioEntidad, 
  actualizarPrecioEntidad, 
  eliminarPrecioEntidad 
} from "../../api/precioEntidad";
import { getMonedas } from "../../api/moneda";
import { getProductosPorEntidadYEmpresa } from "../../api/producto";

// Esquema de validación para precios especiales - ALINEADO AL MODELO PRISMA
const esquemaValidacionPrecio = yup.object().shape({
  productoId: yup
    .number()
    .required("El producto es requerido")
    .integer("Debe ser un número entero"),
  monedaId: yup
    .number()
    .required("La moneda es requerida")
    .integer("Debe ser un número entero"),
  precioUnitario: yup
    .number()
    .required("El precio unitario es requerido")
    .min(0.01, "El precio debe ser mayor a 0"),
  vigenteDesde: yup
    .date()
    .required("La fecha de vigencia desde es requerida"),
  vigenteHasta: yup
    .date()
    .nullable()
    .test(
      "fecha-vigencia-mayor",
      "La fecha vigente hasta debe ser mayor a la fecha vigente desde",
      function(value) {
        const { vigenteDesde } = this.parent;
        if (!value || !vigenteDesde) return true;
        return new Date(value) > new Date(vigenteDesde);
      }
    ),
  observaciones: yup
    .string()
    .nullable()
    .max(500, "Máximo 500 caracteres")
    .trim(),
  activo: yup.boolean(),
});

/**
 * Componente DetallePreciosEntidad
 * @param {Object} props - Props del componente
 * @param {number} props.entidadComercialId - ID de la entidad comercial
 * @param {number} props.empresaId - ID de la empresa
 * @param {Array} props.productos - Lista de productos disponibles
 */
const DetallePreciosEntidad = forwardRef(({
  entidadComercialId,
  empresaId,
  productos = []
}, ref) => {
  // Estados del componente
  const [preciosData, setPreciosData] = useState([]);
  const [monedasData, setMonedasData] = useState([]);
  const [productosData, setProductosData] = useState([]);
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
    trigger,
    getValues,
    setValue,
  } = useForm({
    resolver: yupResolver(esquemaValidacionPrecio),
    defaultValues: {
      productoId: null,
      monedaId: null,
      precioUnitario: 0,
      vigenteDesde: new Date(),
      vigenteHasta: null,
      observaciones: "",
      activo: true,
    },
  });

  // Normalizar opciones para dropdowns
  const productosOptions = productosData.map((producto) => ({
    label: `${producto.codigo} - ${producto.descripcionBase}`,
    value: Number(producto.id),
  }));

  const monedasOptions = monedasData.map((moneda) => ({
    label: `${moneda.codigoSunat} - ${moneda.nombreLargo || moneda.simbolo}`,
    value: Number(moneda.id),
  }));

  useEffect(() => {
    const cargarMonedas = async () => {
      try {
        const response = await getMonedas();
        setMonedasData(response);
      } catch (error) {
        console.error("Error al cargar monedas:", error);
      }
    };
    cargarMonedas();
  }, []);

  useEffect(() => {
    const cargarProductos = async () => {
      if (!entidadComercialId || !empresaId) return;
      try {
        const response = await getProductosPorEntidadYEmpresa(entidadComercialId, empresaId);
        setProductosData(response);
      } catch (error) {
        console.error("Error al cargar productos:", error);
      }
    };
    cargarProductos();
  }, [entidadComercialId, empresaId]);

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
    setValue("monedaId", Number(precio.monedaId));
    setValue("precioUnitario", Number(precio.precioUnitario));
    setValue("vigenteDesde", new Date(precio.vigenteDesde));
    setValue("vigenteHasta", precio.vigenteHasta ? new Date(precio.vigenteHasta) : null);
    setValue("observaciones", precio.observaciones || "");
    setValue("activo", Boolean(precio.activo));
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
   * Función ejecutada después de guardar exitosamente
   * Recarga la lista y cierra el diálogo
   */
  const onGuardarExitoso = () => {
    cargarPrecios(); // Recargar la lista
    cerrarDialogo(); // Cerrar el diálogo
    reset(); // Limpiar el formulario
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
  

  /**
   * Guarda un precio especial (crear o actualizar)
   * @param {Object} data - Datos del precio
   */
  const onSubmitPrecio = async (data) => {
    try {
      setLoading(true);

      // Normalizar datos según modelo PrecioEntidad
      const precioNormalizado = {
        entidadComercialId: Number(entidadComercialId),
        empresaId: Number(empresaId),
        productoId: Number(data.productoId),
        monedaId: Number(data.monedaId),
        precioUnitario: Number(data.precioUnitario),
        vigenteDesde: data.vigenteDesde,
        vigenteHasta: data.vigenteHasta || null,
        observaciones: data.observaciones?.trim().toUpperCase() || null,
        activo: Boolean(data.activo),
      };

      let resultado;
      if (precioSeleccionado) {
        // Actualizar precio existente
        resultado = await actualizarPrecioEntidad(precioSeleccionado.id, precioNormalizado);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Precio actualizado correctamente",
          life: 3000,
        });
      } else {
        // Crear nuevo precio
        resultado = await crearPrecioEntidad(precioNormalizado);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Precio creado correctamente",
          life: 3000,
        });
      }

      onGuardarExitoso();
    } catch (error) {
      console.error("Error al guardar precio:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al guardar el precio",
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

  // Función para cargar precios especiales desde la API
  const cargarPrecios = async () => {
    try {
      setLoading(true);
      const response = await obtenerPreciosPorEntidad(entidadComercialId);
      
      // REGLA CRÍTICA: Validar estructura de respuesta antes de usar
      if (!response) {
        setPreciosData([]);
        toast.current?.show({
          severity: "warn",
          summary: "Sin Precios Especiales",
          detail: "No se encontraron precios especiales para esta entidad",
          life: 3000,
        });
        return;
      }

      // Validar que sea un array
      if (!Array.isArray(response)) {
        setPreciosData([]);
        toast.current?.show({
          severity: "error",
          summary: "Error de Datos",
          detail: "Formato de respuesta inesperado del servidor",
          life: 4000,
        });
        return;
      }

      // Actualizar estado con datos validados
      setPreciosData(response);
      
      // Feedback UX positivo
      toast.current?.show({
        severity: "success",
        summary: "Precios Especiales Cargados",
        detail: `${response.length} precio${response.length !== 1 ? 's' : ''} especial${response.length !== 1 ? 'es' : ''} encontrado${response.length !== 1 ? 's' : ''}`,
        life: 2000,
      });

    } catch (error) {
      console.error("❌ [FRONTEND] Error al cargar precios especiales:", error);
      setPreciosData([]);
      toast.current?.show({
        severity: "error",
        summary: "Error al Cargar",
        detail: error.response?.data?.message || "Error al cargar los precios especiales desde el servidor",
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Exponer función recargar mediante ref
  useImperativeHandle(ref, () => ({
    recargar: cargarPrecios
  }));

  // Cargar precios especiales al montar el componente o cambiar entidadComercialId
  useEffect(() => {
    cargarPrecios();
  }, [entidadComercialId]);

  // Templates para las columnas
  const productoTemplate = (rowData) => {
    const producto = productosOptions.find(p => Number(p.value) === Number(rowData.productoId));
    return producto?.label || rowData.productoId;
  };

  const monedaTemplate = (rowData) => {
    const moneda = monedasOptions.find(m => Number(m.value) === Number(rowData.monedaId));
    return moneda?.label || rowData.monedaId;
  };

  const precioTemplate = (rowData) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(rowData.precioUnitario);
  };

  const fechaTemplate = (rowData, field) => {
    const fecha = rowData[field];
    return fecha ? new Date(fecha).toLocaleDateString('es-PE') : "N/A";
  };

  const estadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.activo ? "Activo" : "Inactivo"}
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
              type="button"
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
        <Column field="monedaId" header="Moneda" body={monedaTemplate} sortable />
        <Column field="precioUnitario" header="Precio" body={precioTemplate} sortable />
        <Column field="vigenteDesde" header="Fecha Vigencia Desde" body={(rowData) => fechaTemplate(rowData, 'vigenteDesde')} sortable />
        <Column field="vigenteHasta" header="Fecha Vigencia Hasta" body={(rowData) => fechaTemplate(rowData, 'vigenteHasta')} sortable />
        <Column field="activo" header="Estado" body={estadoTemplate} sortable />
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
                    options={productosOptions}
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
              <label htmlFor="monedaId">Moneda *</label>
              <Controller
                name="monedaId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="monedaId"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={monedasOptions}
                    placeholder="Seleccione moneda"
                    className={getFieldClass("monedaId")}
                  />
                )}
              />
              {getFormErrorMessage("monedaId")}
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="precioUnitario">Precio Unitario *</label>
              <Controller
                name="precioUnitario"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="precioUnitario"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="currency"
                    currency="PEN"
                    locale="es-PE"
                    minFractionDigits={2}
                    maxFractionDigits={4}
                    className={getFieldClass("precioUnitario")}
                  />
                )}
              />
              {getFormErrorMessage("precioUnitario")}
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="vigenteDesde">Fecha Vigencia Desde *</label>
              <Controller
                name="vigenteDesde"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="vigenteDesde"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    dateFormat="dd/mm/yy"
                    placeholder="Seleccione fecha vigencia desde"
                    className={getFieldClass("vigenteDesde")}
                    showIcon
                  />
                )}
              />
              {getFormErrorMessage("vigenteDesde")}
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="vigenteHasta">Fecha Vigencia Hasta</label>
              <Controller
                name="vigenteHasta"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="vigenteHasta"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    dateFormat="dd/mm/yy"
                    placeholder="Seleccione fecha vigencia hasta"
                    className={getFieldClass("vigenteHasta")}
                    showIcon
                    showClear
                  />
                )}
              />
              {getFormErrorMessage("vigenteHasta")}
            </div>

            <div className="field col-12 md:col-12">
              <label htmlFor="observaciones">Observaciones</label>
              <Controller
                name="observaciones"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="observaciones"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="Ingrese observaciones"
                    className={getFieldClass("observaciones")}
                  />
                )}
              />
              {getFormErrorMessage("observaciones")}
            </div>

            <div className="field col-12 md:col-4">
              <div className="field-checkbox mt-4">
                <Controller
                  name="activo"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="activo"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.checked)}
                      className={getFieldClass("activo")}
                    />
                  )}
                />
                <label htmlFor="activo">Activo</label>
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
              type="button"
              onClick={async () => {
                // Validar formulario manualmente
                const isValid = await trigger();
                if (isValid) {
                  // Obtener datos del formulario y guardar
                  const formData = getValues();
                  await onSubmitPrecio(formData);
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
});

export default DetallePreciosEntidad;
