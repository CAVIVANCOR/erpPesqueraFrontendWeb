/**
 * DetalleCtasCteEntidad.jsx
 *
 * Componente CRUD para gestionar cuentas corrientes de una entidad comercial.
 * Sigue el patrón profesional ERP Megui con control de roles y feedback visual.
 * Patrón basado exactamente en DetalleLineasCreditoEntidad.jsx para máxima consistencia.
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
import { Dropdown } from "primereact/dropdown";
import { ToggleButton } from "primereact/togglebutton";
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
  obtenerCtasCtePorEntidad,
  crearCtaCteEntidad,
  actualizarCtaCteEntidad,
  eliminarCtaCteEntidad,
} from "../../api/ctaCteEntidad";
import { getMonedas } from "../../api/moneda";
import { getBancos } from "../../api/banco";

// Esquema de validación para cuentas corrientes
const esquemaValidacionCtaCte = yup.object().shape({
  bancoId: yup.number().required("El banco es requerido"),
  monedaId: yup.number().required("La moneda es requerida"),
  numeroCuenta: yup
    .string()
    .max(50, "Máximo 50 caracteres")
    .nullable()
    .test(
      "al-menos-uno",
      "Debe ingresar al menos un número de cuenta, CCI o teléfono de billetera",
      function (value) {
        const { numeroCuentaCCI, numeroTelefonoBilletera } = this.parent;
        return value || numeroCuentaCCI || numeroTelefonoBilletera;
      }
    ),
  numeroCuentaCCI: yup.string().max(50, "Máximo 50 caracteres").nullable(),
  numeroTelefonoBilletera: yup
    .string()
    .max(20, "Máximo 20 caracteres")
    .nullable(),
  BilleteraDigital: yup.boolean(),
  activo: yup.boolean(),
});

/**
 * Componente DetalleCtasCteEntidad
 * @param {Object} props - Props del componente
 * @param {number} props.entidadComercialId - ID de la entidad comercial
 */
const DetalleCtasCteEntidad = forwardRef(
  ({ entidadComercialId, readOnly = false, permisos = {} }, ref) => {
    // Estados del componente
    const [ctasCteData, setCtasCteData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [ctaCteSeleccionada, setCtaCteSeleccionada] = useState(null);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [ctaCteAEliminar, setCtaCteAEliminar] = useState(null);
    const [globalFilter, setGlobalFilter] = useState("");
    const [monedasData, setMonedasData] = useState([]);
    const [bancosData, setBancosData] = useState([]);

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
      resolver: yupResolver(esquemaValidacionCtaCte),
      defaultValues: {
        bancoId: null,
        monedaId: null,
        numeroCuenta: "",
        numeroCuentaCCI: "",
        numeroTelefonoBilletera: "",
        BilleteraDigital: false,
        activo: true,
      },
    });

    // Observar el valor de BilleteraDigital
    const esBilleteraDigital = watch("BilleteraDigital");

    // Cargar datos iniciales
    useEffect(() => {
      cargarMonedas();
      cargarBancos();
      if (entidadComercialId) {
        cargarCtasCte();
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
     * Carga los bancos disponibles
     */
    const cargarBancos = async () => {
      try {
        const data = await getBancos();
        // Formatear bancos para el dropdown
        const bancosFormateados = data
          .filter((banco) => banco.activo)
          .map((banco) => ({
            value: Number(banco.id),
            label: banco.nombre,
          }));
        setBancosData(bancosFormateados);
      } catch (error) {
        console.error("Error al cargar bancos:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar los bancos",
          life: 3000,
        });
      }
    };

    /**
     * Carga las cuentas corrientes de la entidad
     */
    const cargarCtasCte = async () => {
      try {
        setLoading(true);
        const data = await obtenerCtasCtePorEntidad(entidadComercialId);
        setCtasCteData(data);
      } catch (error) {
        console.error("Error al cargar cuentas corrientes:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar las cuentas corrientes",
          life: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    /**
     * Abre el diálogo para crear una nueva cuenta corriente
     */
    const abrirDialogoNuevo = () => {
      setCtaCteSeleccionada(null);
      reset();
      setDialogVisible(true);
    };

    /**
     * Abre el diálogo para editar una cuenta corriente existente
     * @param {Object} ctaCte - Cuenta corriente a editar
     */
    const abrirDialogoEdicion = (ctaCte) => {
      setCtaCteSeleccionada(ctaCte);
      setValue("bancoId", Number(ctaCte.bancoId));
      setValue("monedaId", Number(ctaCte.monedaId));
      setValue("numeroCuenta", ctaCte.numeroCuenta || "");
      setValue("numeroCuentaCCI", ctaCte.numeroCuentaCCI || "");
      setValue("numeroTelefonoBilletera", ctaCte.numeroTelefonoBilletera || "");
      setValue("BilleteraDigital", Boolean(ctaCte.BilleteraDigital));
      setValue("activo", Boolean(ctaCte.activo));
      setDialogVisible(true);
    };

    /**
     * Cierra el diálogo
     */
    const cerrarDialogo = () => {
      setDialogVisible(false);
      setCtaCteSeleccionada(null);
    };

    /**
     * Confirma la eliminación de una cuenta corriente
     * @param {Object} ctaCte - Cuenta corriente a eliminar
     */
    const confirmarEliminacion = (ctaCte) => {
      setCtaCteAEliminar(ctaCte);
      setConfirmVisible(true);
    };

    /**
     * Elimina una cuenta corriente
     */
    const eliminar = async () => {
      try {
        setLoading(true);
        await eliminarCtaCteEntidad(ctaCteAEliminar.id);

        // Actualizar estado local
        const nuevasCtasCte = ctasCteData.filter(
          (c) => c.id !== ctaCteAEliminar.id
        );
        setCtasCteData(nuevasCtasCte);

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cuenta corriente eliminada correctamente",
          life: 3000,
        });
      } catch (error) {
        console.error("Error al eliminar cuenta corriente:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail:
            error.response?.data?.message ||
            "Error al eliminar la cuenta corriente",
          life: 3000,
        });
      } finally {
        setLoading(false);
        setConfirmVisible(false);
        setCtaCteAEliminar(null);
      }
    };

    /**
     * Guarda una cuenta corriente (crear o actualizar)
     * @param {Object} data - Datos de la cuenta corriente
     */
    const onSubmitCtaCte = async (data) => {
      try {
        setLoading(true);

        // Normalizar datos para envío
        const datosNormalizados = {
          entidadComercialId: Number(entidadComercialId),
          bancoId: Number(data.bancoId),
          monedaId: Number(data.monedaId),
          numeroCuenta: data.numeroCuenta?.trim().toUpperCase() || null,
          numeroCuentaCCI: data.numeroCuentaCCI?.trim().toUpperCase() || null,
          numeroTelefonoBilletera:
            data.numeroTelefonoBilletera?.trim() || null,
          BilleteraDigital: Boolean(data.BilleteraDigital),
          activo: Boolean(data.activo),
        };

        let resultado;
        const esEdicion = ctaCteSeleccionada && ctaCteSeleccionada.id;

        if (esEdicion) {
          // Actualizar cuenta corriente existente
          // Agregar campos de auditoría para actualización
          const datosActualizacion = {
            ...datosNormalizados,
            // Si fechaCreacion o creadoPor son null/vacíos, asignarlos ahora
            fechaCreacion: ctaCteSeleccionada.fechaCreacion || new Date(),
            creadoPor:
              ctaCteSeleccionada.creadoPor ||
              (usuario?.personalId ? Number(usuario.personalId) : null),
            // Siempre actualizar estos campos
            fechaActualizacion: new Date(),
            actualizadoPor: usuario?.personalId
              ? Number(usuario.personalId)
              : null,
          };

          resultado = await actualizarCtaCteEntidad(
            ctaCteSeleccionada.id,
            datosActualizacion
          );

          // Actualizar en el estado local
          const nuevasCtasCte = ctasCteData.map((cuenta) =>
            cuenta.id === ctaCteSeleccionada.id ? resultado : cuenta
          );
          setCtasCteData(nuevasCtasCte);
        } else {
          // Crear nueva cuenta corriente
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

          resultado = await crearCtaCteEntidad(datosCreacion);

          // Agregar al estado local
          const nuevasCtasCte = [...ctasCteData, resultado];
          setCtasCteData(nuevasCtasCte);
        }

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: esEdicion
            ? "Cuenta corriente actualizada correctamente"
            : "Cuenta corriente creada correctamente",
          life: 3000,
        });

        cerrarDialogo();
      } catch (error) {
        console.error("Error al guardar cuenta corriente:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail:
            error.response?.data?.message ||
            "Error al guardar la cuenta corriente",
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
    const bancoTemplate = (rowData) => {
      const banco = bancosData.find(
        (b) => Number(b.value) === Number(rowData.bancoId)
      );
      return banco?.label || rowData.bancoId;
    };

    const monedaTemplate = (rowData) => {
      const moneda = monedasData.find(
        (m) => Number(m.value) === Number(rowData.monedaId)
      );
      return moneda?.label || rowData.monedaId;
    };

    const tipoCuentaTemplate = (rowData) => {
      return (
        <Tag
          value={rowData.BilleteraDigital ? "Billetera Digital" : "Cuenta Bancaria"}
          severity={rowData.BilleteraDigital ? "info" : "primary"}
        />
      );
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
      recargar: cargarCtasCte,
    }));

    return (
      <div className="p-4">
        <Toast ref={toast} />
        <DataTable
          value={ctasCteData}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onRowClick={(e) => abrirDialogoEdicion(e.data)}
          selectionMode="single"
          className="p-datatable-hover cursor-pointer"
          emptyMessage="No se encontraron cuentas corrientes"
          globalFilter={globalFilter}
          header={
            <div className="flex align-items-center gap-2">
              <h2>Gestión de Cuentas Corrientes</h2>
              <Button
                label="Nuevo"
                icon="pi pi-plus"
                size="small"
                raised
                tooltip="Nueva Cuenta Corriente"
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
                  placeholder="Buscar cuentas..."
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
            field="bancoId"
            header="Banco"
            body={bancoTemplate}
            sortable
          />
          <Column
            field="monedaId"
            header="Moneda"
            body={monedaTemplate}
            sortable
          />
          <Column field="numeroCuenta" header="Nro. Cuenta" sortable />
          <Column field="numeroCuentaCCI" header="CCI" sortable />
          <Column
            field="numeroTelefonoBilletera"
            header="Teléfono Billetera"
            sortable
          />
          <Column
            field="BilleteraDigital"
            header="Tipo"
            body={tipoCuentaTemplate}
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
            ctaCteSeleccionada
              ? "Editar Cuenta Corriente"
              : "Nueva Cuenta Corriente"
          }
          visible={dialogVisible}
          onHide={cerrarDialogo}
          style={{ width: "800px" }}
          modal
        >
          <form onSubmit={handleSubmit(onSubmitCtaCte)} className="p-fluid">
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
                  <label htmlFor="bancoId">Banco *</label>
                  <Controller
                    name="bancoId"
                    control={control}
                    render={({ field }) => (
                      <Dropdown
                        id="bancoId"
                        value={field.value}
                        onChange={(e) => field.onChange(e.value)}
                        options={bancosData}
                        placeholder="Seleccione banco"
                        className={getFieldClass("bancoId")}
                        disabled={readOnly || loading}
                        style={{ fontWeight: "bold" }}
                      />
                    )}
                  />
                  {getFormErrorMessage("bancoId")}
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
                        style={{ fontWeight: "bold" }}
                      />
                    )}
                  />
                  {getFormErrorMessage("monedaId")}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 10,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                  marginBottom: 10,
                }}
              >
                <div style={{ flex: 1 }}>
                  <label htmlFor="numeroCuenta">Número de Cuenta</label>
                  <Controller
                    name="numeroCuenta"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="numeroCuenta"
                        {...field}
                        style={{ textTransform: "uppercase", fontWeight: "bold" }}
                        placeholder="INGRESE NÚMERO DE CUENTA"
                        className={getFieldClass("numeroCuenta")}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                  {getFormErrorMessage("numeroCuenta")}
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="numeroCuentaCCI">CCI</label>
                  <Controller
                    name="numeroCuentaCCI"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="numeroCuentaCCI"
                        {...field}
                        style={{ textTransform: "uppercase", fontWeight: "bold" }}
                        placeholder="INGRESE CCI"
                        className={getFieldClass("numeroCuentaCCI")}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                  {getFormErrorMessage("numeroCuentaCCI")}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "end",
                  gap: 10,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                  marginBottom: 10,
                }}
              >
                <div style={{ flex: 1 }}>
                  <label htmlFor="numeroTelefonoBilletera">
                    Teléfono Billetera Digital
                  </label>
                  <Controller
                    name="numeroTelefonoBilletera"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="numeroTelefonoBilletera"
                        {...field}
                        placeholder="Ingrese teléfono"
                        className={getFieldClass("numeroTelefonoBilletera")}
                        disabled={!esBilleteraDigital || readOnly || loading}
                        style={{ fontWeight: "bold" }}
                      />
                    )}
                  />
                  {getFormErrorMessage("numeroTelefonoBilletera")}
                </div>
                <div style={{ flex: 1 }}>
                  <Controller
                    name="BilleteraDigital"
                    control={control}
                    render={({ field }) => (
                      <ToggleButton
                        id="BilleteraDigital"
                        onLabel="BILLETERA DIGITAL"
                        offLabel="BILLETERA DIGITAL"
                        onIcon="pi pi-check"
                        offIcon="pi pi-times"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.value)}
                        className={getFieldClass("BilleteraDigital")}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                </div>
                <div style={{ flex: 1 }}>
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
                        className={getFieldClass("activo")}
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
              <AuditInfo data={ctaCteSeleccionada} />
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
                  label={ctaCteSeleccionada ? "Actualizar" : "Crear"}
                  icon={ctaCteSeleccionada ? "pi pi-check" : "pi pi-plus"}
                  className="p-button-success"
                  type="button"
                  onClick={handleSubmit(onSubmitCtaCte)}
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
          message={`¿Está seguro de eliminar esta cuenta corriente?`}
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

export default DetalleCtasCteEntidad;