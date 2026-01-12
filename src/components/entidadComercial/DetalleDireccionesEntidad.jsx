/**
 * DetalleDireccionesEntidad.jsx
 *
 * Componente CRUD para gestionar direcciones de una entidad comercial.
 * Sigue el patrón profesional ERP Megui con control de roles y feedback visual.
 * Patrón basado exactamente en TipoEquipo.jsx para máxima consistencia.
 * ACTUALIZADO: Incluye campos conceptoAlmacenCompraId, conceptoAlmacenVentaId, esAlmacenExterno, condicionesRecepcionAlmacen, condicionesEntregaAlmacen
 * NUEVA FUNCIONALIDAD: Importar direcciones desde plantas industriales (tipoEntidadId=18)
 *
 * @author ERP Megui
 * @version 1.2.0
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
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { Panel } from "primereact/panel";
import AuditInfo from "../shared/AuditInfo";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { classNames } from "primereact/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../../utils/utils";
import { ButtonGroup } from "primereact/buttongroup";
import { ToggleButton } from "primereact/togglebutton";
import UbigeoSelector from "./UbigeoSelector";
import {
  crearDireccionEntidad,
  actualizarDireccionEntidad,
  eliminarDireccionEntidad,
  obtenerDireccionesPorEntidad,
} from "../../api/direccionEntidad";
import { getUbigeos } from "../../api/ubigeo";
import { getDepartamentos } from "../../api/departamento";
import { getProvincias } from "../../api/provincia";
import { getConceptosMovAlmacen } from "../../api/conceptoMovAlmacen";
import { getPlantasIndustriales } from "../../api/entidadComercial";

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
  conceptoAlmacenCompraId: yup.number().nullable(),
  conceptoAlmacenVentaId: yup.number().nullable(),
  esAlmacenExterno: yup.boolean(),
  condicionesRecepcionAlmacen: yup.string().nullable(),
  condicionesEntregaAlmacen: yup.string().nullable(),
});

/**
 * Componente DetalleDireccionesEntidad
 * @param {Object} props - Props del componente
 * @param {number} props.entidadComercialId - ID de la entidad comercial
 */
const DetalleDireccionesEntidad = forwardRef(
  ({ entidadComercialId, readOnly = false, permisos = {} }, ref) => {
    // Estados del componente
    const [direccionesData, setDireccionesData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [direccionSeleccionada, setDireccionSeleccionada] = useState(null);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [direccionAEliminar, setDireccionAEliminar] = useState(null);
    const [globalFilter, setGlobalFilter] = useState("");
    const [ubigeoModalVisible, setUbigeoModalVisible] = useState(false);
    const [ubigeoTextoSeleccionado, setUbigeoTextoSeleccionado] = useState(
      "Seleccione un ubigeo"
    );
    const [conceptosAlmacen, setConceptosAlmacen] = useState([]);

    // Estados para importar direcciones desde plantas industriales
    const [plantasIndustriales, setPlantasIndustriales] = useState([]);
    const [plantaSeleccionada, setPlantaSeleccionada] = useState(null);
    const [direccionesPlanta, setDireccionesPlanta] = useState([]);
    const [direccionPlantaSeleccionada, setDireccionPlantaSeleccionada] = useState(null);

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
        conceptoAlmacenCompraId: null,
        conceptoAlmacenVentaId: null,
        esAlmacenExterno: false,
        condicionesRecepcionAlmacen: "",
        condicionesEntregaAlmacen: "",
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

    // Función para cargar conceptos de almacén
    const cargarConceptosAlmacen = async () => {
      try {
        const response = await getConceptosMovAlmacen();
        setConceptosAlmacen(response || []);
      } catch (error) {
        console.error("Error al cargar conceptos de almacén:", error);
      }
    };

    // Función para cargar plantas industriales
    const cargarPlantasIndustriales = async () => {
      try {
        const response = await getPlantasIndustriales();
        setPlantasIndustriales(response || []);
      } catch (error) {
        console.error("Error al cargar plantas industriales:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar plantas industriales",
          life: 3000,
        });
      }
    };

    // Función para cargar direcciones de la planta seleccionada
    const cargarDireccionesPlanta = async (plantaId) => {
      if (!plantaId) {
        setDireccionesPlanta([]);
        setDireccionPlantaSeleccionada(null);
        return;
      }

      try {
        const response = await obtenerDireccionesPorEntidad(plantaId);
        setDireccionesPlanta(response || []);
        setDireccionPlantaSeleccionada(null);
      } catch (error) {
        console.error("Error al cargar direcciones de la planta:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar direcciones de la planta",
          life: 3000,
        });
      }
    };

    // Función para importar dirección seleccionada al formulario
    const importarDireccion = async () => {
      if (!direccionPlantaSeleccionada) {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Debe seleccionar una dirección para importar",
          life: 3000,
        });
        return;
      }

      try {
        const direccion = direccionesPlanta.find(
          (d) => Number(d.id) === Number(direccionPlantaSeleccionada)
        );

        if (!direccion) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Dirección no encontrada",
            life: 3000,
          });
          return;
        }

        // Cargar todos los datos de la dirección en el formulario
        setValue("direccion", direccion.direccion || "");
        setValue("direccionArmada", direccion.direccionArmada || "");
        setValue("ubigeoId", Number(direccion.ubigeoId));
        setValue("referencia", direccion.referencia || "");
        setValue("telefono", direccion.telefono || "");
        setValue("correo", direccion.correo || "");
        setValue("conceptoAlmacenCompraId", direccion.conceptoAlmacenCompraId ? Number(direccion.conceptoAlmacenCompraId) : null);
        setValue("conceptoAlmacenVentaId", direccion.conceptoAlmacenVentaId ? Number(direccion.conceptoAlmacenVentaId) : null);
        setValue("esAlmacenExterno", Boolean(direccion.esAlmacenExterno));
        setValue("condicionesRecepcionAlmacen", direccion.condicionesRecepcionAlmacen || "");
        setValue("condicionesEntregaAlmacen", direccion.condicionesEntregaAlmacen || "");

        // Actualizar texto del ubigeo
        if (direccion.ubigeo) {
          setUbigeoTextoSeleccionado(
            `${direccion.ubigeo.codigo} - ${direccion.ubigeo.nombreDistrito || "N/A"}`
          );
        }

        // Limpiar selección de ayuda
        setPlantaSeleccionada(null);
        setDireccionesPlanta([]);
        setDireccionPlantaSeleccionada(null);

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Dirección importada correctamente. Revise y guarde los cambios.",
          life: 4000,
        });
      } catch (error) {
        console.error("Error al importar dirección:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al importar la dirección",
          life: 3000,
        });
      }
    };

    // Exponer función recargar mediante ref
    useImperativeHandle(ref, () => ({
      recargar: cargarDirecciones,
    }));

    // Cargar direcciones, conceptos y plantas al montar el componente
    useEffect(() => {
      cargarDirecciones();
      cargarConceptosAlmacen();
      cargarPlantasIndustriales();
    }, [entidadComercialId]);

    /**
     * Abre el diálogo para crear una nueva dirección
     */
    const abrirDialogoNuevo = () => {
      setDireccionSeleccionada(null);
      reset();
      setUbigeoTextoSeleccionado("Seleccione un ubigeo");
      setPlantaSeleccionada(null);
      setDireccionesPlanta([]);
      setDireccionPlantaSeleccionada(null);
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
      setValue("conceptoAlmacenCompraId", direccion.conceptoAlmacenCompraId ? Number(direccion.conceptoAlmacenCompraId) : null);
      setValue("conceptoAlmacenVentaId", direccion.conceptoAlmacenVentaId ? Number(direccion.conceptoAlmacenVentaId) : null);
      setValue("esAlmacenExterno", Boolean(direccion.esAlmacenExterno));
      setValue("condicionesRecepcionAlmacen", direccion.condicionesRecepcionAlmacen || "");
      setValue("condicionesEntregaAlmacen", direccion.condicionesEntregaAlmacen || "");

      // Establecer texto del ubigeo para edición
      if (direccion.ubigeo) {
        setUbigeoTextoSeleccionado(
          `${direccion.ubigeo.codigo} - ${
            direccion.ubigeo.nombreDistrito || "N/A"
          }`
        );
      } else {
        setUbigeoTextoSeleccionado("Seleccione un ubigeo");
      }

      // Limpiar ayuda de importación
      setPlantaSeleccionada(null);
      setDireccionesPlanta([]);
      setDireccionPlantaSeleccionada(null);

      setDialogVisible(true);
    };

    /**
     * Cierra el diálogo
     */
    const cerrarDialogo = () => {
      setDialogVisible(false);
      setDireccionSeleccionada(null);
      setPlantaSeleccionada(null);
      setDireccionesPlanta([]);
      setDireccionPlantaSeleccionada(null);
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

        await eliminarDireccionEntidad(direccionAEliminar.id);

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
          detail:
            error.response?.data?.message || "Error al eliminar la dirección",
          life: 3000,
        });
      } finally {
        setLoading(false);
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
        const ubigeos = await getUbigeos();
        const ubigeoEncontrado = ubigeos.find(
          (u) => Number(u.id) === Number(ubigeoId)
        );

        if (!ubigeoEncontrado) {
          console.warn("⚠️ [FRONTEND] Ubigeo no encontrado:", ubigeoId);
          return direccion;
        }

        const departamentos = await getDepartamentos();
        const provincias = await getProvincias();

        const departamento = departamentos.find(
          (d) => Number(d.id) === Number(ubigeoEncontrado.departamentoId)
        );
        const provincia = provincias.find(
          (p) => Number(p.id) === Number(ubigeoEncontrado.provinciaId)
        );

        const direccionArmada = [
          direccion,
          ubigeoEncontrado.nombreDistrito || "",
          departamento?.nombre || "",
          provincia?.nombre || "",
        ]
          .filter(Boolean)
          .join(", ");
        return direccionArmada;
      } catch (error) {
        console.error(
          "❌ [FRONTEND] Error construyendo direccionArmada:",
          error
        );
        return direccion;
      }
    };

    /**
     * Callback de guardado exitoso
     */
    const onGuardarExitoso = () => {
      cerrarDialogo();
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

        const direccionArmada = await construirDireccionArmada(
          data.direccion?.trim().toUpperCase(),
          data.ubigeoId
        );

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
          conceptoAlmacenCompraId: data.conceptoAlmacenCompraId ? Number(data.conceptoAlmacenCompraId) : null,
          conceptoAlmacenVentaId: data.conceptoAlmacenVentaId ? Number(data.conceptoAlmacenVentaId) : null,
          esAlmacenExterno: Boolean(data.esAlmacenExterno),
          condicionesRecepcionAlmacen: data.condicionesRecepcionAlmacen?.trim() || null,
          condicionesEntregaAlmacen: data.condicionesEntregaAlmacen?.trim() || null,
        };

        let resultado;
        const esEdicion = direccionSeleccionada && direccionSeleccionada.id;

        if (esEdicion) {
          const datosActualizacion = {
            ...direccionNormalizada,
            fechaCreacion: direccionSeleccionada.fechaCreacion || new Date(),
            creadoPor:
              direccionSeleccionada.creadoPor ||
              (usuario?.personalId ? Number(usuario.personalId) : null),
            fechaActualizacion: new Date(),
            actualizadoPor: usuario?.personalId
              ? Number(usuario.personalId)
              : null,
          };

          resultado = await actualizarDireccionEntidad(
            direccionSeleccionada.id,
            datosActualizacion
          );

          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Dirección actualizada correctamente",
            life: 3000,
          });
        } else {
          const datosCreacion = {
            ...direccionNormalizada,
            fechaCreacion: new Date(),
            creadoPor: usuario?.personalId ? Number(usuario.personalId) : null,
            fechaActualizacion: new Date(),
            actualizadoPor: usuario?.personalId
              ? Number(usuario.personalId)
              : null,
          };

          resultado = await crearDireccionEntidad(datosCreacion);

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
          detail:
            error.response?.data?.message || "Error al guardar la dirección",
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
          value={
            rowData.almacenPrincipal ? "Almacén Principal" : "No Principal"
          }
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

    // Preparar opciones para los Dropdowns
    const conceptosOptions = conceptosAlmacen.map((c) => ({
      label: c.descripcionArmada,
      value: Number(c.id),
    }));

    const plantasOptions = plantasIndustriales.map((p) => ({
      label: p.label,
      value: p.value,
    }));

    const direccionesPlantaOptions = direccionesPlanta.map((d) => ({
      label: `${d.direccion} - ${d.ubigeo?.nombreDistrito || ""}`,
      value: Number(d.id),
    }));

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
                disabled={readOnly || loading}
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
          <Column
            field="fiscal"
            header="Fiscal"
            body={fiscalTemplate}
            sortable
          />
          <Column
            field="almacenPrincipal"
            header="Almacén Principal"
            body={almacenPrincipalTemplate}
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
            direccionSeleccionada ? "Editar Dirección" : "Nueva Dirección"
          }
          visible={dialogVisible}
          onHide={cerrarDialogo}
          style={{ width: "900px" }}
          modal
        >
          <form className="p-fluid">
            {/* PANEL DE AYUDA: IMPORTAR DESDE PLANTAS INDUSTRIALES */}
            <Panel 
              header="🏭 Ayuda: Importar Dirección desde Planta Industrial" 
              toggleable 
              collapsed={true}
              className="mb-3"
              style={{ backgroundColor: "#f8f9fa" }}
            >
              <div className="formgrid grid">
                <div className="field col-12 md:col-6">
                  <label htmlFor="plantaIndustrial">1. Seleccionar Planta Industrial</label>
                  <Dropdown
                    id="plantaIndustrial"
                    value={plantaSeleccionada}
                    options={plantasOptions}
                    onChange={(e) => {
                      setPlantaSeleccionada(e.value);
                      cargarDireccionesPlanta(e.value);
                    }}
                    placeholder="Seleccione una planta"
                    filter
                    showClear
                    disabled={readOnly || loading}
                    style={{ fontWeight: "bold" }}
                  />
                  <small className="p-text-secondary">
                    Filtra empresas con tipoEntidadId=18 (Plantas Industriales)
                  </small>
                </div>

                <div className="field col-12 md:col-6">
                  <label htmlFor="direccionPlanta">2. Seleccionar Dirección de la Planta</label>
                  <Dropdown
                    id="direccionPlanta"
                    value={direccionPlantaSeleccionada}
                    options={direccionesPlantaOptions}
                    onChange={(e) => setDireccionPlantaSeleccionada(e.value)}
                    placeholder="Seleccione una dirección"
                    filter
                    showClear
                    disabled={!plantaSeleccionada || readOnly || loading}
                    style={{ fontWeight: "bold" }}
                  />
                  <small className="p-text-secondary">
                    Direcciones disponibles de la planta seleccionada
                  </small>
                </div>

                <div className="field col-12">
                  <Button
                    label="Importar Dirección Seleccionada"
                    icon="pi pi-download"
                    type="button"
                    onClick={importarDireccion}
                    disabled={!direccionPlantaSeleccionada || readOnly || loading}
                    className="p-button-info"
                    severity="info"
                    raised
                  />
                  <small className="p-text-secondary">
                    Al importar, todos los datos de la dirección seleccionada se cargarán en el formulario actual
                  </small>
                </div>
              </div>
            </Panel>

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
                      disabled={readOnly || loading}
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
                      disabled={readOnly || loading}
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
                    value={ubigeoTextoSeleccionado}
                    className={getFieldClass("ubigeoId")}
                    disabled={readOnly || loading}
                    style={{ fontWeight: "bold" }}
                  />
                  <Button
                    icon="pi pi-search"
                    className="p-button-outlined"
                    type="button"
                    tooltip="Buscar Ubigeo"
                    onClick={() => setUbigeoModalVisible(true)}
                    disabled={readOnly || loading}
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
                      disabled={readOnly || loading}
                    />
                  )}
                />
                {getFormErrorMessage("referencia")}
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
                      className={getFieldClass("telefono")}
                      maxLength={20}
                      style={{
                        fontWeight: "bold",
                        textTransform: "uppercase",
                      }}
                      disabled={readOnly || loading}
                    />
                  )}
                />
                {getFormErrorMessage("telefono")}
              </div>

              <div className="field col-12 md:col-6">
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
                      style={{
                        fontWeight: "bold",
                        textTransform: "uppercase",
                      }}
                      disabled={readOnly || loading}
                    />
                  )}
                />
                {getFormErrorMessage("correo")}
              </div>

              {/* NUEVOS CAMPOS */}
              <div className="field col-12 md:col-6">
                <label htmlFor="conceptoAlmacenCompraId">Concepto Almacén para Compras</label>
                <Controller
                  name="conceptoAlmacenCompraId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="conceptoAlmacenCompraId"
                      value={field.value}
                      options={conceptosOptions}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccionar concepto"
                      className={getFieldClass("conceptoAlmacenCompraId")}
                      disabled={readOnly || loading}
                      showClear
                      filter
                      style={{ fontWeight: "bold" }}
                    />
                  )}
                />
                {getFormErrorMessage("conceptoAlmacenCompraId")}
              </div>

              <div className="field col-12 md:col-6">
                <label htmlFor="conceptoAlmacenVentaId">Concepto Almacén para Ventas</label>
                <Controller
                  name="conceptoAlmacenVentaId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="conceptoAlmacenVentaId"
                      value={field.value}
                      options={conceptosOptions}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccionar concepto"
                      className={getFieldClass("conceptoAlmacenVentaId")}
                      disabled={readOnly || loading}
                      showClear
                      filter
                      style={{ fontWeight: "bold" }}
                    />
                  )}
                />
                {getFormErrorMessage("conceptoAlmacenVentaId")}
              </div>

              <div className="field col-12">
                <label htmlFor="condicionesRecepcionAlmacen">Condiciones de Recepción en Almacén</label>
                <Controller
                  name="condicionesRecepcionAlmacen"
                  control={control}
                  render={({ field }) => (
                    <InputTextarea
                      id="condicionesRecepcionAlmacen"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      rows={3}
                      className={getFieldClass("condicionesRecepcionAlmacen")}
                      placeholder="Ej: Horario de recepción, requisitos de documentación, etc."
                      disabled={readOnly || loading}
                    />
                  )}
                />
                {getFormErrorMessage("condicionesRecepcionAlmacen")}
              </div>

              <div className="field col-12">
                <label htmlFor="condicionesEntregaAlmacen">Condiciones de Entrega desde Almacén</label>
                <Controller
                  name="condicionesEntregaAlmacen"
                  control={control}
                  render={({ field }) => (
                    <InputTextarea
                      id="condicionesEntregaAlmacen"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      rows={3}
                      className={getFieldClass("condicionesEntregaAlmacen")}
                      placeholder="Ej: Horario de despacho, condiciones de transporte, etc."
                      disabled={readOnly || loading}
                    />
                  )}
                />
                {getFormErrorMessage("condicionesEntregaAlmacen")}
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
                        onLabel="DIRECCION FISCAL"
                        offLabel="DIRECCION FISCAL"
                        onIcon="pi pi-check"
                        offIcon="pi pi-times"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.value)}
                        className={`${getFieldClass("fiscal")}`}
                        disabled={readOnly || loading}
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
                        onChange={(e) => field.onChange(e.value)}
                        className={`${getFieldClass("activo")}`}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                  <Controller
                    name="almacenPrincipal"
                    control={control}
                    render={({ field }) => (
                      <ToggleButton
                        id="almacenPrincipal"
                        onLabel="ALMACEN PRINCIPAL"
                        offLabel="ALMACEN PRINCIPAL"
                        onIcon="pi pi-check"
                        offIcon="pi pi-times"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.value)}
                        className={`${getFieldClass("almacenPrincipal")}`}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                  <Controller
                    name="esAlmacenExterno"
                    control={control}
                    render={({ field }) => (
                      <ToggleButton
                        id="esAlmacenExterno"
                        onLabel="ALMACEN EXTERNO"
                        offLabel="ALMACEN EXTERNO"
                        onIcon="pi pi-check"
                        offIcon="pi pi-times"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.value)}
                        className={`${getFieldClass("esAlmacenExterno")}`}
                        disabled={readOnly || loading}
                      />
                    )}
                  />
                </ButtonGroup>
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
              <AuditInfo data={direccionSeleccionada} />
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
                  label={direccionSeleccionada ? "Actualizar" : "Crear"}
                  icon={direccionSeleccionada ? "pi pi-check" : "pi pi-plus"}
                  type="button"
                  loading={loading}
                  onClick={async () => {
                    const isValid = await trigger();
                    if (isValid) {
                      const formData = getValues();
                      await onSubmitDireccion(formData);
                    }
                  }}
                  disabled={readOnly || loading}
                  className="p-button-success"
                  severity="success"
                  raised
                  size="small"
                  outlined
                />
              </div>
            </div>
          </form>
        </Dialog>

        <Dialog
          header={`Seleccionar Ubigeo ${
            direccionSeleccionada?.ubigeo
              ? `(Actual: ${direccionSeleccionada.ubigeo.codigo} - ${direccionSeleccionada.ubigeo.nombreDistrito})`
              : ""
          }`}
          visible={ubigeoModalVisible}
          onHide={() => setUbigeoModalVisible(false)}
          style={{ width: "800px" }}
          modal
        >
          <UbigeoSelector
            onUbigeoSelect={(ubigeo) => {
              setValue("ubigeoId", ubigeo.id);
              if (direccionSeleccionada) {
                setDireccionSeleccionada({
                  ...direccionSeleccionada,
                  ubigeoId: ubigeo.id,
                  ubigeo: ubigeo,
                });
              }
              setUbigeoTextoSeleccionado(
                `${ubigeo.codigo} - ${ubigeo.nombreDistrito}`
              );
              setUbigeoModalVisible(false);
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
  }
);

export default DetalleDireccionesEntidad;