/**
 * DetalleLineasCreditoEntidad.jsx
 *
 * Componente CRUD para gestionar líneas de crédito de una entidad comercial.
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
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { ToggleButton } from "primereact/togglebutton";
import { ButtonGroup } from "primereact/buttongroup";
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
import {
  obtenerLineasCreditoPorEntidad,
  crearLineaCreditoEntidad,
  actualizarLineaCreditoEntidad,
  eliminarLineaCreditoEntidad,
} from "../../api/lineaCreditoEntidad";
import { getMonedas } from "../../api/moneda";

// Esquema de validación para líneas de crédito
const esquemaValidacionLineaCredito = yup.object().shape({
  montoMaximo: yup
    .number()
    .required("El monto máximo es requerido")
    .min(0, "El monto debe ser mayor a 0"),
  monedaId: yup.number().required("La moneda es requerida"),
  diasCredito: yup
    .number()
    .required("Los días de crédito son requeridos")
    .min(1, "Debe ser mayor a 0"),
  vigenteDesde: yup.date().required("La fecha de inicio es requerida"),
  vigenteHasta: yup
    .date()
    .nullable()
    .test(
      "fecha-hasta-mayor",
      "La fecha hasta debe ser mayor a la fecha desde",
      function (value) {
        const { vigenteDesde } = this.parent;
        if (!value || !vigenteDesde) return true;
        return new Date(value) > new Date(vigenteDesde);
      }
    ),
  condiciones: yup.string().max(500, "Máximo 500 caracteres").nullable(),
  observaciones: yup.string().max(500, "Máximo 500 caracteres").nullable(),
  activo: yup.boolean(),
});

/**
 * Componente DetalleLineasCreditoEntidad
 * @param {Object} props - Props del componente
 * @param {number} props.entidadComercialId - ID de la entidad comercial
 * @param {Array} props.monedas - Lista de monedas
 */
const DetalleLineasCreditoEntidad = forwardRef(
  (
    { entidadComercialId, monedas = [], readOnly = false, permisos = {} },
    ref
  ) => {
    // Estados del componente
    const [lineasCreditoData, setLineasCreditoData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [lineaCreditoSeleccionada, setLineaCreditoSeleccionada] =
      useState(null);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [lineaCreditoAEliminar, setLineaCreditoAEliminar] = useState(null);
    const [globalFilter, setGlobalFilter] = useState("");
    const [monedasData, setMonedasData] = useState(monedas);

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
      resolver: yupResolver(esquemaValidacionLineaCredito),
      defaultValues: {
        montoMaximo: 0,
        monedaId: null,
        diasCredito: 30,
        vigenteDesde: new Date(),
        vigenteHasta: null,
        condiciones: "",
        observaciones: "",
        activo: true,
      },
    });

    // Cargar datos iniciales
    useEffect(() => {
      cargarMonedas();
      if (entidadComercialId) {
        cargarLineasCredito();
      }
    }, [entidadComercialId]);

    /**
     * Carga las monedas disponibles
     */
    const cargarMonedas = async () => {
      try {
        const data = await getMonedas();
        // Formatear monedas para el dropdown
        const monedasFormateadas = data
          .filter((moneda) => moneda.activo)
          .map((moneda) => ({
            value: Number(moneda.id),
            label: `${moneda.codigoSunat} - ${moneda.nombreLargo}`,
          }));
        setMonedasData(monedasFormateadas);
      } catch (error) {
        console.error("Error al cargar monedas:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar las monedas",
          life: 3000,
        });
      }
    };

    /**
     * Carga las líneas de crédito de la entidad
     */
    const cargarLineasCredito = async () => {
      try {
        setLoading(true);
        const data = await obtenerLineasCreditoPorEntidad(entidadComercialId);
        setLineasCreditoData(data);
      } catch (error) {
        console.error("Error al cargar líneas de crédito:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar las líneas de crédito",
          life: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    /**
     * Abre el diálogo para crear una nueva línea de crédito
     */
    const abrirDialogoNuevo = () => {
      setLineaCreditoSeleccionada(null);
      reset();
      setDialogVisible(true);
    };

    /**
     * Abre el diálogo para editar una línea de crédito existente
     * @param {Object} lineaCredito - Línea de crédito a editar
     */
    const abrirDialogoEdicion = (lineaCredito) => {
      setLineaCreditoSeleccionada(lineaCredito);
      setValue("montoMaximo", Number(lineaCredito.montoMaximo));
      setValue("monedaId", Number(lineaCredito.monedaId));
      setValue("diasCredito", Number(lineaCredito.diasCredito));
      setValue("vigenteDesde", new Date(lineaCredito.vigenteDesde));
      setValue(
        "vigenteHasta",
        lineaCredito.vigenteHasta ? new Date(lineaCredito.vigenteHasta) : null
      );
      setValue("condiciones", lineaCredito.condiciones || "");
      setValue("observaciones", lineaCredito.observaciones || "");
      setValue("activo", Boolean(lineaCredito.activo));
      setDialogVisible(true);
    };

    /**
     * Cierra el diálogo
     */
    const cerrarDialogo = () => {
      setDialogVisible(false);
      setLineaCreditoSeleccionada(null);
    };

    /**
     * Confirma la eliminación de una línea de crédito
     * @param {Object} lineaCredito - Línea de crédito a eliminar
     */
    const confirmarEliminacion = (lineaCredito) => {
      setLineaCreditoAEliminar(lineaCredito);
      setConfirmVisible(true);
    };

    /**
     * Elimina una línea de crédito
     */
    const eliminar = async () => {
      try {
        setLoading(true);
        await eliminarLineaCreditoEntidad(lineaCreditoAEliminar.id);

        // Actualizar estado local
        const nuevasLineas = lineasCreditoData.filter(
          (l) => l.id !== lineaCreditoAEliminar.id
        );
        setLineasCreditoData(nuevasLineas);

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Línea de crédito eliminada correctamente",
          life: 3000,
        });
      } catch (error) {
        console.error("Error al eliminar línea de crédito:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail:
            error.response?.data?.message ||
            "Error al eliminar la línea de crédito",
          life: 3000,
        });
      } finally {
        setLoading(false);
        setConfirmVisible(false);
        setLineaCreditoAEliminar(null);
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
        detail: lineaCreditoSeleccionada
          ? "Línea de crédito actualizada correctamente"
          : "Línea de crédito creada correctamente",
        life: 3000,
      });
    };

    /**
     * Guarda una línea de crédito (crear o actualizar)
     * @param {Object} data - Datos de la línea de crédito
     */
    const onSubmitLineaCredito = async (data) => {
      try {
        setLoading(true);

        // Normalizar datos para envío
        const datosNormalizados = {
          entidadComercialId: Number(entidadComercialId),
          montoMaximo: Number(data.montoMaximo),
          monedaId: Number(data.monedaId),
          diasCredito: Number(data.diasCredito),
          vigenteDesde: new Date(data.vigenteDesde),
          vigenteHasta: data.vigenteHasta ? new Date(data.vigenteHasta) : null,
          condiciones: data.condiciones?.toUpperCase() || null,
          observaciones: data.observaciones?.toUpperCase() || null,
          activo: Boolean(data.activo),
        };

        let resultado;
        const esEdicion =
          lineaCreditoSeleccionada && lineaCreditoSeleccionada.id;

        if (esEdicion) {
          // Actualizar línea de crédito existente
          // Agregar campos de auditoría para actualización
          const datosActualizacion = {
            ...datosNormalizados,
            // Si fechaCreacion o creadoPor son null/vacíos, asignarlos ahora
            fechaCreacion: lineaCreditoSeleccionada.fechaCreacion || new Date(),
            creadoPor:
              lineaCreditoSeleccionada.creadoPor ||
              (usuario?.personalId ? Number(usuario.personalId) : null),
            // Siempre actualizar estos campos
            fechaActualizacion: new Date(),
            actualizadoPor: usuario?.personalId
              ? Number(usuario.personalId)
              : null,
          };

          resultado = await actualizarLineaCreditoEntidad(
            lineaCreditoSeleccionada.id,
            datosActualizacion
          );

          // Actualizar en el estado local
          const nuevasLineas = lineasCreditoData.map((linea) =>
            linea.id === lineaCreditoSeleccionada.id ? resultado : linea
          );
          setLineasCreditoData(nuevasLineas);
        } else {
          // Crear nueva línea de crédito
          // Agregar campos de auditoría para creación
          const datosCreacion = {
            ...datosNormalizados,
            fechaCreacion: new Date(),
            creadoPor: usuario?.personalId ? Number(usuario.personalId) : null,
            fechaActualizacion: new Date(),
            actualizadoPor: usuario?.personalId
              ? Number(usuario.personalId)
              : null,
          };

          resultado = await crearLineaCreditoEntidad(datosCreacion);

          // Agregar al estado local
          const nuevasLineas = [...lineasCreditoData, resultado];
          setLineasCreditoData(nuevasLineas);
        }

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: esEdicion
            ? "Línea de crédito actualizada correctamente"
            : "Línea de crédito creada correctamente",
          life: 3000,
        });

        cerrarDialogo();
      } catch (error) {
        console.error("Error al guardar línea de crédito:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail:
            error.response?.data?.message ||
            "Error al guardar la línea de crédito",
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
    const monedaTemplate = (rowData) => {
      const moneda = monedasData.find(
        (m) => Number(m.value) === Number(rowData.monedaId)
      );
      return moneda?.label || rowData.monedaId;
    };

    const montoTemplate = (rowData) => {
      return new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: "PEN",
      }).format(rowData.montoMaximo);
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
          type="button"
          icon="pi pi-pencil"
          className="p-button-text p-mr-2"
          disabled={!permisos.puedeVer && !permisos.puedeEditar}
          onClick={(ev) => {
            ev.stopPropagation();
            if (permisos.puedeVer || permisos.puedeEditar) {
              abrirDialogoEdicion(rowData);
            }
          }}
          tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
        />
        <Button
          type="button"
          icon="pi pi-trash"
          className="p-button-text p-button-danger"
          disabled={!permisos.puedeEliminar}
          onClick={(ev) => {
            ev.stopPropagation();
            if (permisos.puedeEliminar) {
              confirmarEliminacion(rowData);
            }
          }}
          tooltip="Eliminar"
        />
      </div>
    );

    useImperativeHandle(ref, () => ({
      recargar: cargarLineasCredito,
    }));

    return (
      <div className="p-4">
        <Toast ref={toast} />
        <DataTable
          value={lineasCreditoData}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onRowClick={(e) => abrirDialogoEdicion(e.data)}
          selectionMode="single"
          className="p-datatable-hover cursor-pointer"
          emptyMessage="No se encontraron líneas de crédito"
          globalFilter={globalFilter}
          header={
            <div className="flex align-items-center gap-2">
              <h2>Gestión de Líneas de Crédito</h2>
              <Button
                label="Nuevo"
                icon="pi pi-plus"
                size="small"
                raised
                tooltip="Nueva Línea de Crédito"
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
                  placeholder="Buscar líneas de crédito..."
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
            field="montoMaximo"
            header="Monto Máximo"
            body={montoTemplate}
            sortable
          />
          <Column
            field="monedaId"
            header="Moneda"
            body={monedaTemplate}
            sortable
          />
          <Column field="diasCredito" header="Días Crédito" sortable />
          <Column
            field="vigenteDesde"
            header="Vigente Desde"
            body={(rowData) => fechaTemplate(rowData, "vigenteDesde")}
            sortable
          />
          <Column
            field="vigenteHasta"
            header="Vigente Hasta"
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
            lineaCreditoSeleccionada
              ? "Editar Línea de Crédito"
              : "Nueva Línea de Crédito"
          }
          visible={dialogVisible}
          onHide={cerrarDialogo}
          style={{ width: "800px" }}
          modal
        >
          <form
            onSubmit={handleSubmit(onSubmitLineaCredito)}
            className="p-fluid"
          >
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
                  <label htmlFor="montoMaximo">Monto Máximo *</label>
                  <Controller
                    name="montoMaximo"
                    control={control}
                    render={({ field }) => (
                      <InputNumber
                        id="montoMaximo"
                        value={field.value}
                        onValueChange={(e) => field.onChange(e.value)}
                        mode="currency"
                        currency="PEN"
                        locale="es-PE"
                        minFractionDigits={2}
                        maxFractionDigits={2}
                        className={getFieldClass("montoMaximo")}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                  {getFormErrorMessage("montoMaximo")}
                </div>
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
                        options={monedasData}
                        placeholder="Seleccione moneda"
                        className={getFieldClass("monedaId")}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                  {getFormErrorMessage("monedaId")}
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="diasCredito">Días de Crédito *</label>
                  <Controller
                    name="diasCredito"
                    control={control}
                    render={({ field }) => (
                      <InputNumber
                        id="diasCredito"
                        value={field.value}
                        onValueChange={(e) => field.onChange(e.value)}
                        min={1}
                        max={365}
                        useGrouping={false}
                        className={getFieldClass("diasCredito")}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                  {getFormErrorMessage("diasCredito")}
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
                  <label htmlFor="condiciones">Condiciones</label>
                  <Controller
                    name="condiciones"
                    control={control}
                    render={({ field }) => (
                      <InputTextarea
                        id="condiciones"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="INGRESE CONDICIONES DE LA LÍNEA DE CRÉDITO"
                        rows={3}
                        className={getFieldClass("condiciones")}
                        maxLength={500}
                        style={{ textTransform: "uppercase" }}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                  {getFormErrorMessage("condiciones")}
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
                        style={{ textTransform: "uppercase" }}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                  {getFormErrorMessage("observaciones")}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "end",
                  gap: 10,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                  marginBottom: 20,
                  marginTop: 10,
                }}
              >
                <div style={{ flex: 1 }}>
                  <label htmlFor="vigenteDesde">Vigente Desde *</label>
                  <Controller
                    name="vigenteDesde"
                    control={control}
                    render={({ field }) => (
                      <Calendar
                        id="vigenteDesde"
                        value={field.value}
                        onChange={(e) => field.onChange(e.value)}
                        dateFormat="dd/mm/yy"
                        placeholder="Seleccione fecha de inicio"
                        className={getFieldClass("vigenteDesde")}
                        showIcon
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                  {getFormErrorMessage("vigenteDesde")}
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="vigenteHasta">Vigente Hasta</label>
                  <Controller
                    name="vigenteHasta"
                    control={control}
                    render={({ field }) => (
                      <Calendar
                        id="vigenteHasta"
                        value={field.value}
                        onChange={(e) => field.onChange(e.value)}
                        dateFormat="dd/mm/yy"
                        placeholder="Seleccione fecha de fin"
                        className={getFieldClass("vigenteHasta")}
                        showIcon
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                  {getFormErrorMessage("vigenteHasta")}
                </div>
                <div style={{ flex: 1 }}>
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
              {lineaCreditoSeleccionada && (
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
                          {lineaCreditoSeleccionada.fechaCreacion
                            ? new Date(
                                lineaCreditoSeleccionada.fechaCreacion
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
                        {lineaCreditoSeleccionada.personalCreador && (
                          <Tag
                            value={`${lineaCreditoSeleccionada.personalCreador.nombres} ${lineaCreditoSeleccionada.personalCreador.apellidos}`}
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
                          {lineaCreditoSeleccionada.fechaActualizacion
                            ? new Date(
                                lineaCreditoSeleccionada.fechaActualizacion
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
                        {lineaCreditoSeleccionada.personalActualizador && (
                          <Tag
                            value={`${lineaCreditoSeleccionada.personalActualizador.nombres} ${lineaCreditoSeleccionada.personalActualizador.apellidos}`}
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
                  label={lineaCreditoSeleccionada ? "Actualizar" : "Crear"}
                  icon={lineaCreditoSeleccionada ? "pi pi-check" : "pi pi-plus"}
                  className="p-button-success"
                  type="button"
                  onClick={handleSubmit(onSubmitLineaCredito)}
                  loading={loading}
                  raised
                  size="small"
                  disabled={readOnly || loading}
                />
              </div>
            </div>
          </form>
        </Dialog>

        <ConfirmDialog
          visible={confirmVisible}
          onHide={() => setConfirmVisible(false)}
          message={`¿Está seguro de eliminar esta línea de crédito?`}
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

export default DetalleLineasCreditoEntidad;
