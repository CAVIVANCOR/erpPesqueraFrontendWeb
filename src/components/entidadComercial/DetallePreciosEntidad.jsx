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
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { ButtonGroup } from "primereact/buttongroup";
import { ToggleButton } from "primereact/togglebutton";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
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
  eliminarPrecioEntidad,
} from "../../api/precioEntidad";
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
  vigenteDesde: yup.date().required("La fecha de vigencia desde es requerida"),
  vigenteHasta: yup
    .date()
    .nullable()
    .test(
      "fecha-vigencia-mayor",
      "La fecha vigente hasta debe ser mayor a la fecha vigente desde",
      function (value) {
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
const DetallePreciosEntidad = forwardRef(
  (
    {
      entidadComercialId,
      empresaId,
      monedas = [],
      readOnly = false,
      permisos = {},
    },
    ref
  ) => {
    // Estados del componente
    const [preciosData, setPreciosData] = useState([]);
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

    useEffect(() => {
      cargarProductos();
    }, [entidadComercialId, empresaId]);

    // Normalizar opciones para dropdowns
    const productosOptions = productosData.map((producto) => ({
      label: producto.descripcionArmada,
      value: Number(producto.id),
    }));

    const monedasOptions = monedas.map((moneda) => ({
      label: `${moneda.codigoSunat} - ${moneda.nombreLargo || moneda.simbolo}`,
      value: Number(moneda.id),
    }));

    // Función para cargar productos filtrados por empresa y entidad comercial
    const cargarProductos = async () => {
      if (!entidadComercialId || !empresaId) {
        console.warn(
          "No se pueden cargar productos: falta entidadComercialId o empresaId"
        );
        setProductosData([]);
        return [];
      }

      try {
        setLoading(true);
        const response = await getProductosPorEntidadYEmpresa(
          entidadComercialId,
          empresaId
        );

        if (!response || !Array.isArray(response)) {
          console.error(
            "Formato de respuesta inesperado al cargar productos:",
            response
          );
          toast.current?.show({
            severity: "warn",
            summary: "Advertencia",
            detail: "No se pudieron cargar los productos. Intente nuevamente.",
            life: 3000,
          });
          setProductosData([]);
          return [];
        }

        setProductosData(response);
        return response;
      } catch (error) {
        console.error("Error al cargar productos:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar la lista de productos",
          life: 3000,
        });
        setProductosData([]);
        return [];
      } finally {
        setLoading(false);
      }
    };

    /**
     * Abre el diálogo para crear un nuevo precio especial
     */
    const abrirDialogoNuevo = async () => {
      try {
        setLoading(true);
        // Restablecer el formulario
        reset({
          productoId: null,
          monedaId: null,
          precioUnitario: 0,
          vigenteDesde: new Date(),
          vigenteHasta: null,
          observaciones: "",
          activo: true,
        });

        setPrecioSeleccionado(null);
        setDialogVisible(true);
      } catch (error) {
        console.error("Error al abrir diálogo de nuevo precio:", error);
      } finally {
        setLoading(false);
      }
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
      setValue(
        "vigenteHasta",
        precio.vigenteHasta ? new Date(precio.vigenteHasta) : null
      );
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
        const nuevosPrecios = preciosData.filter(
          (p) => p.tempId !== precioAEliminar.tempId
        );
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
          productoId: Number(data.productoId),
          monedaId: Number(data.monedaId),
          precioUnitario: Number(data.precioUnitario),
          vigenteDesde: data.vigenteDesde,
          vigenteHasta: data.vigenteHasta || null,
          observaciones: data.observaciones?.trim().toUpperCase() || null,
          activo: Boolean(data.activo),
        };

        let resultado;
        const esEdicion = precioSeleccionado && precioSeleccionado.id;

        if (esEdicion) {
          // Actualizar precio existente
          // Agregar campos de auditoría para actualización
          const datosActualizacion = {
            ...precioNormalizado,
            // Si fechaCreacion o creadoPor son null/vacíos, asignarlos ahora
            fechaCreacion: precioSeleccionado.fechaCreacion || new Date(),
            creadoPor:
              precioSeleccionado.creadoPor ||
              (usuario?.personalId ? Number(usuario.personalId) : null),
            // Siempre actualizar estos campos
            fechaActualizacion: new Date(),
            actualizadoPor: usuario?.personalId
              ? Number(usuario.personalId)
              : null,
          };

          resultado = await actualizarPrecioEntidad(
            precioSeleccionado.id,
            datosActualizacion
          );
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Precio actualizado correctamente",
            life: 3000,
          });
        } else {
          // Crear nuevo precio
          // Agregar campos de auditoría para creación
          const datosCreacion = {
            ...precioNormalizado,
            fechaCreacion: new Date(),
            creadoPor: usuario?.personalId ? Number(usuario.personalId) : null,
            fechaActualizacion: new Date(),
            actualizadoPor: usuario?.personalId
              ? Number(usuario.personalId)
              : null,
          };

          resultado = await crearPrecioEntidad(datosCreacion);
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
      return (
        errors[name] && (
          <small className="p-error">{errors[name]?.message}</small>
        )
      );
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
      } catch (error) {
        console.error(
          "❌ [FRONTEND] Error al cargar precios especiales:",
          error
        );
        setPreciosData([]);
        toast.current?.show({
          severity: "error",
          summary: "Error al Cargar",
          detail:
            error.response?.data?.message ||
            "Error al cargar los precios especiales desde el servidor",
          life: 4000,
        });
      } finally {
        setLoading(false);
      }
    };

    // Exponer función recargar mediante ref
    useImperativeHandle(ref, () => ({
      recargar: cargarPrecios,
    }));

    // Cargar precios especiales al montar el componente o cambiar entidadComercialId
    useEffect(() => {
      cargarPrecios();
    }, [entidadComercialId]);

    // Templates para las columnas
    const productoTemplate = (rowData) => {
      const producto = productosOptions.find(
        (p) => Number(p.value) === Number(rowData.productoId)
      );
      return producto?.label || rowData.productoId;
    };

    const monedaTemplate = (rowData) => {
      const moneda = monedasOptions.find(
        (m) => Number(m.value) === Number(rowData.monedaId)
      );
      return moneda?.label || rowData.monedaId;
    };

    const precioTemplate = (rowData) => {
      // Buscar la moneda del registro
      const moneda = monedas.find(
        (m) => Number(m.id) === Number(rowData.monedaId)
      );

      // Obtener código ISO de la moneda (PEN, USD, EUR, etc.)
      const codigoMoneda = moneda?.codigoSunat || "PEN";
      const simboloMoneda = moneda?.simbolo || "S/";

      try {
        // Intentar formatear con Intl.NumberFormat
        return new Intl.NumberFormat("es-PE", {
          style: "currency",
          currency: codigoMoneda,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(rowData.precioUnitario);
      } catch (error) {
        // Si el código de moneda no es válido para Intl, usar formato manual
        return `${simboloMoneda} ${Number(rowData.precioUnitario).toFixed(2)}`;
      }
    };

    const fechaTemplate = (rowData, field) => {
      const fecha = rowData[field];
      return fecha ? new Date(fecha).toLocaleDateString("es-PE") : "N/A";
    };

    const estadoTemplate = (rowData) => {
      return (
        <Tag
          value={rowData.activo ? "Activo" : "Inactivo"}
          severity={rowData.activo ? "success" : "danger"}
        />
      );
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
                disabled={readOnly || loading}
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
          <Column
            field="productoId"
            header="Producto"
            body={productoTemplate}
            sortable
          />
          <Column
            field="monedaId"
            header="Moneda"
            body={monedaTemplate}
            sortable
          />
          <Column
            field="precioUnitario"
            header="Precio"
            body={precioTemplate}
            sortable
          />
          <Column
            field="vigenteDesde"
            header="Desde"
            body={(rowData) => fechaTemplate(rowData, "vigenteDesde")}
            sortable
          />
          <Column
            field="vigenteHasta"
            header="Hasta"
            body={(rowData) => fechaTemplate(rowData, "vigenteHasta")}
            sortable
          />
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
          header={
            precioSeleccionado
              ? "Editar Precio Especial"
              : "Nuevo Precio Especial"
          }
          visible={dialogVisible}
          onHide={cerrarDialogo}
          style={{ width: "900px" }}
          modal
        >
          <form onSubmit={handleSubmit(onSubmitPrecio)} className="p-fluid">
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
                  <Controller
                    name="productoId"
                    control={control}
                    render={({ field, fieldState }) => (
                      <div className="field">
                        <label htmlFor="productoId">Producto *</label>
                        <Dropdown
                          id="productoId"
                          value={field.value}
                          options={productosOptions}
                          onChange={(e) => {
                            field.onChange(e.value);
                          }}
                          optionLabel="label"
                          optionValue="value"
                          placeholder="Seleccione un producto"
                          className={classNames("w-full", {
                            "p-invalid": fieldState.error,
                          })}
                          filter
                          filterBy="label"
                          loading={loading}
                          style={{ fontWeight: "bold" }}
                          disabled={readOnly || loading}
                        />
                        {getFormErrorMessage("productoId")}
                      </div>
                    )}
                  />
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
                        style={{ fontWeight: "bold" }}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                  {getFormErrorMessage("monedaId")}
                </div>
                <div style={{ flex: 1 }}>
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
                        inputStyle={{ fontWeight: "bold" }}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                  {getFormErrorMessage("precioUnitario")}
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
                        inputStyle={{ fontWeight: "bold" }}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                  {getFormErrorMessage("vigenteDesde")}
                </div>

                <div style={{ flex: 1 }}>
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
                        inputStyle={{ fontWeight: "bold" }}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                  {getFormErrorMessage("vigenteHasta")}
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
                        placeholder="Ingrese observaciones"
                        className={getFieldClass("observaciones")}
                        style={{ fontWeight: "bold", width: "100%" }}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                  {getFormErrorMessage("observaciones")}
                </div>
                <div style={{ flex: 0.5 }}>
                  <Controller
                    name="activo"
                    control={control}
                    render={({ field }) => (
                      <ToggleButton
                        id="activo"
                        onLabel="ACTIVO"
                        offLabel="ACTIVO"
                        onIcon="pi pi-check"
                        offIcon="pi pi-times"
                        checked={field.value}
                        size="small"
                        onChange={(e) => field.onChange(e.value)}
                        className={`${getFieldClass("activo")}`}
                        style={{ fontWeight: "bold" }}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
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
                <ButtonGroup style={{ gap: 5 }}></ButtonGroup>
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
              {precioSeleccionado && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 10,
                    backgroundColor: "#f8f9fa",
                    borderRadius: 5,
                    border: "1px solid #dee2e6",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 20,
                      flexDirection: window.innerWidth < 768 ? "column" : "row",
                    }}
                  >
                    {/* Creado */}
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: "0.9rem", color: "#495057" }}>
                        Creado:
                      </strong>
                      <div style={{ marginTop: 5 }}>
                        <div style={{ fontSize: "0.85rem", color: "#6c757d" }}>
                          {precioSeleccionado.fechaCreacion
                            ? new Date(
                                precioSeleccionado.fechaCreacion
                              ).toLocaleString("es-PE", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                            : "N/A"}
                        </div>
                        {precioSeleccionado.personalCreador && (
                          <Tag
                            value={`${precioSeleccionado.personalCreador.nombres} ${precioSeleccionado.personalCreador.apellidos}`}
                            style={{
                              marginTop: 5,
                              backgroundColor: "#cfe2ff",
                              color: "#000",
                              fontSize: "0.8rem",
                            }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Actualizado */}
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: "0.9rem", color: "#495057" }}>
                        Actualizado:
                      </strong>
                      <div style={{ marginTop: 5 }}>
                        <div style={{ fontSize: "0.85rem", color: "#6c757d" }}>
                          {precioSeleccionado.fechaActualizacion
                            ? new Date(
                                precioSeleccionado.fechaActualizacion
                              ).toLocaleString("es-PE", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                            : "N/A"}
                        </div>
                        {precioSeleccionado.personalActualizador && (
                          <Tag
                            value={`${precioSeleccionado.personalActualizador.nombres} ${precioSeleccionado.personalActualizador.apellidos}`}
                            style={{
                              marginTop: 5,
                              backgroundColor: "#f8d7da",
                              color: "#000",
                              fontSize: "0.8rem",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                  label={precioSeleccionado ? "Actualizar" : "Crear"}
                  icon={precioSeleccionado ? "pi pi-check" : "pi pi-plus"}
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
                  disabled={readOnly || loading}
                  className="p-button-success"
                  severity="success"
                  raised
                  size="small"
                />
              </div>
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
  }
);

export default DetallePreciosEntidad;
