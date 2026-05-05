// src/components/contabilidad/AsientoContableForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { Tag } from "primereact/tag";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { getPlanCuentasContable } from "../../api/contabilidad/planCuentasContable";
import { getTiposDocumento } from "../../api/tipoDocumento";
import {
  createAsientoContable,
  updateAsientoContable,
} from "../../api/contabilidad/asientoContable";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../../utils/utils";
import { consultarTipoCambioSunat } from "../../api/consultaExterna";
import { getCentrosCosto } from "../../api/centroCosto";
import { getEntidadesComercialesPorEmpresa } from "../../api/entidadComercial";
import { getPersonalPorId } from "../../api/personal";
import CrearEntidadComercialButton from "../shared/CrearEntidadComercialButton";
import { getDocumentosOrigenPorModelo } from "../../api/contabilidad/documentosOrigen";
import { getSubmodulos } from "../../api/submoduloSistema";

export default function AsientoContableForm({
  isEdit = false,
  defaultValues = {},
  empresaFija = null,
  periodoFijo = null,
  empresas = [],
  periodos = [],
  estados = [],
  monedas = [],
  onSubmit,
  onCancel,
  loading = false,
  readOnly = false,
}) {
  const { usuario } = useAuthStore();
  const toast = useRef(null);

  const [formData, setFormData] = useState({
    empresaId: defaultValues?.empresaId
      ? Number(defaultValues.empresaId)
      : empresaFija
        ? Number(empresaFija)
        : null,
    periodoContableId: defaultValues?.periodoContableId
      ? Number(defaultValues.periodoContableId)
      : periodoFijo
        ? Number(periodoFijo)
        : null,
    numeroAsiento: defaultValues?.numeroAsiento || "",
    correlativo: defaultValues?.correlativo || null,
    fechaAsiento: defaultValues?.fechaAsiento
      ? new Date(defaultValues.fechaAsiento)
      : new Date(),
    glosa: defaultValues?.glosa || "",
    tipoLibro: defaultValues?.tipoLibro || "FISCAL",
    origenAsiento: defaultValues?.origenAsiento || "MANUAL",
    estadoId: defaultValues?.estadoId ? Number(defaultValues.estadoId) : 76,
    monedaId: defaultValues?.monedaId ? Number(defaultValues.monedaId) : 1,
    tipoCambio: defaultValues?.tipoCambio || null,
    totalDebe: defaultValues?.totalDebe || 0,
    totalHaber: defaultValues?.totalHaber || 0,
    diferencia: defaultValues?.diferencia || 0,
    estaCuadrado: defaultValues?.estaCuadrado || false,
  });
  const [detalles, setDetalles] = useState(defaultValues?.detalles || []);
  const [planCuentas, setPlanCuentas] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);
  const [preFacturas, setPreFacturas] = useState([]);
  const [nombreUsuarioCreador, setNombreUsuarioCreador] = useState("N/A");
  const [nombreUsuarioActualizador, setNombreUsuarioActualizador] =
    useState("N/A");
  const [showDetalleDialog, setShowDetalleDialog] = useState(false);
  const [editingDetalle, setEditingDetalle] = useState(null);
  const [detalleFormData, setDetalleFormData] = useState({
    planCuentaId: null,
    codigoCuenta: "",
    nombreCuenta: "",
    glosa: "",
    monedaId: 1,
    tipoCambio: null,
    debe: 0,
    haber: 0,
    debeMonedaExtranjera: null,
    haberMonedaExtranjera: null,
    centroCostoId: null,
    entidadComercialId: null,
    tipoDocumentoOrigenId: null,
    numeroDocumentoOrigen: "",
    fechaDocumentoOrigen: null,
    fechaVenceDocumentoOrigen: null,
    submoduloOrigenLineaId: null,
    procesoOrigenLineaId: null,
  });
  const [guardando, setGuardando] = useState(false);
  const [fechaAsientoInicial, setFechaAsientoInicial] = useState(null);
  const [asientoId, setAsientoId] = useState(defaultValues?.id || null);
  const [tipoCambioSunat, setTipoCambioSunat] = useState(null);
  const [submodulosMap, setSubmodulosMap] = useState({});
  const [submodulosOptions, setSubmodulosOptions] = useState([]);
  const [detallesSeleccionados, setDetallesSeleccionados] = useState([]);
  const [showClonarDialog, setShowClonarDialog] = useState(false);
  const [cantidadClones, setCantidadClones] = useState(1);

  useEffect(() => {
    // Cargar submódulos con nombreModeloOrigen
    getSubmodulos()
      .then((data) => {
        const map = {};
        const options = data
          .filter((sub) => sub.nombreModeloOrigen)
          .map((sub) => ({
            label: `${sub.nombre} - ${sub.nombreModeloOrigen}`,
            value: Number(sub.id),
            nombreModelo: sub.nombreModeloOrigen,
          }));

        data.forEach((sub) => {
          if (sub.nombreModeloOrigen) {
            map[Number(sub.id)] = sub.nombreModeloOrigen;
          }
        });

        setSubmodulosMap(map);
        setSubmodulosOptions(options);
      })
      .catch((error) => {
        console.error("❌ [ASIENTO] Error cargando submódulos:", error);
      });
  }, []);

  useEffect(() => {
    cargarPlanCuentas();
    cargarTiposDocumento();
    cargarCentrosCosto();
  }, []);

  useEffect(() => {
    if (formData.empresaId) {
      cargarEntidadesComerciales();
    }
  }, [formData.empresaId]);

  useEffect(() => {
    if (!isEdit) {
      setFormData((prev) => ({ ...prev, estadoId: 76 }));
    }
  }, [isEdit]);

  useEffect(() => {
    calcularTotales();
  }, [detalles]);

  // Actualizar detalles cuando cambian los defaultValues (al editar)
  useEffect(() => {
    if (defaultValues?.detalles) {
      setDetalles(
        defaultValues.detalles.map((d) => ({
          ...d,
          // SIEMPRE usar datos de la relación planCuenta (no los campos desnormalizados)
          codigoCuenta: d.planCuenta?.codigoCuenta || d.codigoCuenta,
          nombreCuenta: d.planCuenta?.nombreCuenta || d.nombreCuenta,
          fechaDocumentoOrigen: d.fechaDocumentoOrigen
            ? new Date(d.fechaDocumentoOrigen)
            : null,
        })),
      );
    }
  }, [defaultValues?.detalles]);

  // Actualizar asientoId cuando cambian los defaultValues
  useEffect(() => {
    if (defaultValues?.id) {
      setAsientoId(defaultValues.id);
    }
  }, [defaultValues?.id]);

  // Guardar fecha inicial para evitar carga automática en mount
  useEffect(() => {
    if (formData.fechaAsiento && fechaAsientoInicial === null) {
      setFechaAsientoInicial(formData.fechaAsiento);
    }
  }, [formData.fechaAsiento, fechaAsientoInicial]);

  // Cargar tipo de cambio SUNAT solo cuando el usuario modifica manualmente fechaAsiento
  useEffect(() => {
    const cargarTipoCambio = async () => {
      // No ejecutar si no hay fecha o si es la carga inicial
      if (!formData.fechaAsiento || fechaAsientoInicial === null) return;

      // Comparar fechas por valor (ISO string) en lugar de por referencia
      const fechaActualISO = new Date(formData.fechaAsiento).toISOString();
      const fechaInicialISO = new Date(fechaAsientoInicial).toISOString();

      // No ejecutar si la fecha no ha cambiado realmente
      if (fechaActualISO === fechaInicialISO) return;

      try {
        // Convertir fecha a formato YYYY-MM-DD
        const fecha = new Date(formData.fechaAsiento);
        const fechaISO = fecha.toISOString().split("T")[0];
        // Consultar tipo de cambio SUNAT
        const tipoCambioData = await consultarTipoCambioSunat({
          date: fechaISO,
        });
        // Para CONTABILIDAD usamos buy_price (tipo de cambio de compra)
        // Es el estándar contable para valorizar activos/pasivos en moneda extranjera
        if (tipoCambioData && tipoCambioData.buy_price) {
          const tipoCambioCompra = parseFloat(tipoCambioData.buy_price);
          handleChange("tipoCambio", tipoCambioCompra.toFixed(4));
          // Actualizar fecha inicial para permitir consultas futuras a esta misma fecha
          setFechaAsientoInicial(formData.fechaAsiento);
          toast?.current?.show({
            severity: "success",
            summary: "Tipo de Cambio Actualizado",
            detail: `Tipo de cambio SUNAT: S/ ${tipoCambioCompra.toFixed(4)} por USD`,
            life: 3000,
          });
        }
      } catch (error) {
        console.error("Error al cargar tipo de cambio SUNAT:", error);
        // No mostrar error al usuario, solo log en consola
        // El usuario puede ingresar el tipo de cambio manualmente si falla
      }
    };
    cargarTipoCambio();
  }, [formData.fechaAsiento, fechaAsientoInicial]);

  const cargarPlanCuentas = async () => {
    try {
      const data = await getPlanCuentasContable();
      const cuentasActivas = data.filter((c) => c.activo === true);
      setPlanCuentas(cuentasActivas);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar plan de cuentas",
        life: 3000,
      });
    }
  };

  const cargarTiposDocumento = async () => {
    try {
      const data = await getTiposDocumento();
      setTiposDocumento(data || []);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar tipos de documento",
        life: 3000,
      });
    }
  };

  const cargarCentrosCosto = async () => {
    try {
      const data = await getCentrosCosto();
      setCentrosCosto(data);
    } catch (error) {
      console.error("Error al cargar centros de costo:", error);
    }
  };

  const cargarEntidadesComerciales = async () => {
    try {
      if (!formData.empresaId) return;
      const data = await getEntidadesComercialesPorEmpresa(
        Number(formData.empresaId),
      );
      setEntidadesComerciales(data);
    } catch (error) {
      console.error("Error al cargar entidades comerciales:", error);
    }
  };

  const cargarNombresUsuarios = async (creadoPor, actualizadoPor) => {
    try {
      // Si creadoPor es null, usar el usuario actual (quien está modificando)
      const idCreador = creadoPor || usuario?.personalId;

      if (idCreador) {
        const personalCreador = await getPersonalPorId(Number(idCreador));
        if (personalCreador) {
          const nombreCompleto =
            `${personalCreador.nombres || ""} ${personalCreador.apellidoPaterno || ""} ${personalCreador.apellidoMaterno || ""}`.trim();
          setNombreUsuarioCreador(nombreCompleto || "N/A");
        } else {
          setNombreUsuarioCreador("N/A");
        }
      } else {
        setNombreUsuarioCreador("N/A");
      }

      if (actualizadoPor) {
        const personalActualizador = await getPersonalPorId(
          Number(actualizadoPor),
        );
        if (personalActualizador) {
          const nombreCompleto =
            `${personalActualizador.nombres || ""} ${personalActualizador.apellidoPaterno || ""} ${personalActualizador.apellidoMaterno || ""}`.trim();
          setNombreUsuarioActualizador(nombreCompleto || "N/A");
        } else {
          setNombreUsuarioActualizador("N/A");
        }
      } else {
        setNombreUsuarioActualizador("N/A");
      }
    } catch (error) {
      console.error("Error al cargar nombres de usuarios:", error);
      setNombreUsuarioCreador("N/A");
      setNombreUsuarioActualizador("N/A");
    }
  };

  const calcularTotales = () => {
    const totalDebe = detalles.reduce((sum, d) => sum + Number(d.debe || 0), 0);
    const totalHaber = detalles.reduce(
      (sum, d) => sum + Number(d.haber || 0),
      0,
    );
    const diferencia = totalDebe - totalHaber;
    const estaCuadrado = Math.abs(diferencia) < 0.01;
    setFormData((prev) => ({
      ...prev,
      totalDebe,
      totalHaber,
      diferencia,
      estaCuadrado,
    }));
  };
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const openNewDetalle = () => {
    setEditingDetalle(null);
    setDetalleFormData({
      planCuentaId: null,
      codigoCuenta: "",
      nombreCuenta: "",
      glosa: "",
      monedaId: Number(formData.monedaId) || 1,
      tipoCambio: formData.tipoCambio || null,
      debe: 0,
      haber: 0,
      debeMonedaExtranjera: null,
      haberMonedaExtranjera: null,
      centroCostoId: null,
      entidadComercialId: null,
      tipoDocumentoOrigenId: null,
      numeroDocumentoOrigen: "",
      fechaDocumentoOrigen: null,
      fechaVenceDocumentoOrigen: null,
      submoduloOrigenLineaId: null,
      procesoOrigenLineaId: null,
    });
    setPreFacturas([]);
    setShowDetalleDialog(true);
  };

  const openEditDetalle = (detalle) => {
    setEditingDetalle(detalle); // ✅ CORRECTO - usar setEditingDetalle
    setDetalleFormData({
      planCuentaId: detalle.planCuentaId ? Number(detalle.planCuentaId) : null,
      codigoCuenta: detalle.codigoCuenta || "",
      nombreCuenta: detalle.nombreCuenta || "",
      glosa: detalle.glosa || "",
      monedaId: detalle.monedaId ? Number(detalle.monedaId) : null,
      tipoCambio: detalle.tipoCambio || null,
      debe: detalle.debe || 0,
      haber: detalle.haber || 0,
      debeMonedaExtranjera: detalle.debeMonedaExtranjera || null,
      haberMonedaExtranjera: detalle.haberMonedaExtranjera || null,
      centroCostoId: detalle.centroCostoId
        ? Number(detalle.centroCostoId)
        : null,
      entidadComercialId: detalle.entidadComercialId
        ? Number(detalle.entidadComercialId)
        : null,
      tipoDocumentoOrigenId: detalle.tipoDocumentoOrigenId
        ? Number(detalle.tipoDocumentoOrigenId)
        : null,
      numeroDocumentoOrigen: detalle.numeroDocumentoOrigen || "",
      fechaDocumentoOrigen: detalle.fechaDocumentoOrigen
        ? new Date(detalle.fechaDocumentoOrigen)
        : null,
      fechaVenceDocumentoOrigen: detalle.fechaVenceDocumentoOrigen
        ? new Date(detalle.fechaVenceDocumentoOrigen)
        : null,
      submoduloOrigenLineaId: detalle.submoduloOrigenLineaId
        ? Number(detalle.submoduloOrigenLineaId)
        : null,
      procesoOrigenLineaId: detalle.procesoOrigenLineaId
        ? Number(detalle.procesoOrigenLineaId)
        : null,
    });

    // Cargar documentos origen si hay submódulo, entidad y empresa
    if (
      detalle.submoduloOrigenLineaId &&
      detalle.entidadComercialId &&
      formData.empresaId
    ) {
      const nombreModelo = submodulosMap[detalle.submoduloOrigenLineaId];
      if (nombreModelo) {
        cargarRegistrosOrigen(
          nombreModelo,
          detalle.entidadComercialId,
          formData.empresaId,
        );
      }
    } else {
      setPreFacturas([]);
    }

    // Cargar nombres de usuarios para auditoría
    cargarNombresUsuarios(detalle.creadoPor, detalle.actualizadoPor);

    setShowDetalleDialog(true);
  };

  const handleCuentaChange = (planCuentaId) => {
    const cuenta = planCuentas.find(
      (c) => Number(c.id) === Number(planCuentaId),
    );
    if (cuenta) {
      setDetalleFormData({
        ...detalleFormData,
        planCuentaId: Number(cuenta.id),
        codigoCuenta: cuenta.codigoCuenta,
        nombreCuenta: cuenta.nombreCuenta,
      });
    }
  };

  const handleEntidadComercialChange = (entidadComercialId) => {
    setDetalleFormData({
      ...detalleFormData,
      entidadComercialId: entidadComercialId,
      procesoOrigenLineaId: null,
      numeroDocumentoOrigen: "",
      fechaDocumentoOrigen: null,
      fechaVenceDocumentoOrigen: null,
      tipoDocumentoOrigenId: null,
    });

    // Si hay submódulo seleccionado, RECARGAR documentos filtrados por entidad
    if (
      entidadComercialId &&
      detalleFormData.submoduloOrigenLineaId &&
      formData.empresaId
    ) {
      const nombreModelo =
        submodulosMap[detalleFormData.submoduloOrigenLineaId];
      if (nombreModelo) {
        cargarRegistrosOrigen(
          nombreModelo,
          entidadComercialId, // ✅ Ahora SÍ filtrar por entidad
          formData.empresaId,
        );
      }
    } else if (detalleFormData.submoduloOrigenLineaId && formData.empresaId) {
      // Si limpia la entidad, recargar TODOS los documentos
      const nombreModelo =
        submodulosMap[detalleFormData.submoduloOrigenLineaId];
      if (nombreModelo) {
        cargarRegistrosOrigen(nombreModelo, null, formData.empresaId);
      }
    } else {
      setPreFacturas([]);
    }
  };

  // ✅ NUEVO: Callback cuando se crea una entidad comercial
  const handleEntidadComercialCreada = async (entidad) => {
    // Recargar entidades comerciales
    if (formData.empresaId) {
      await cargarEntidadesComerciales(formData.empresaId);
    }

    // Auto-seleccionar la nueva entidad
    if (entidad && entidad.id) {
      setTimeout(() => {
        handleEntidadComercialChange(Number(entidad.id));
      }, 100);
    }

    // Mostrar mensaje de éxito
    if (toast && toast.current) {
      toast.current.show({
        severity: "success",
        summary: "Entidad Creada",
        detail: `Entidad "${entidad.razonSocial || entidad.nombre}" creada y seleccionada exitosamente.`,
        life: 4000,
      });
    }
  };

  const handleSubmoduloOrigenChange = (submoduloId) => {
    setDetalleFormData({
      ...detalleFormData,
      submoduloOrigenLineaId: submoduloId,
      procesoOrigenLineaId: null,
      entidadComercialId: null, // Limpiar entidad comercial
      numeroDocumentoOrigen: "",
      fechaDocumentoOrigen: null,
      fechaVenceDocumentoOrigen: null,
      tipoDocumentoOrigenId: null,
    });

    // Cargar TODOS los documentos del modelo (sin filtrar por entidad)
    if (submoduloId && formData.empresaId) {
      const nombreModelo = submodulosMap[submoduloId];

      if (nombreModelo) {
        cargarRegistrosOrigen(
          nombreModelo,
          null, // ✅ SIN entidadComercialId - cargar todos
          formData.empresaId,
        );
      } else {
        console.warn(
          "⚠️ [FRONTEND] No se encontró nombreModelo para submoduloId:",
          submoduloId,
        );
      }
    } else {
      setPreFacturas([]);
    }
  };

  const cargarRegistrosOrigen = async (
    nombreModelo,
    entidadComercialId,
    empresaId,
  ) => {
    try {
      const data = await getDocumentosOrigenPorModelo(
        nombreModelo,
        entidadComercialId,
        empresaId,
      );
      setPreFacturas(data);
    } catch (error) {
      console.error("❌ [FRONTEND] Error cargando registros origen:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar documentos origen",
        life: 3000,
      });
    }
  };

  const handlePreFacturaChange = (registroId) => {
    const registroSeleccionado = preFacturas.find(
      (reg) => Number(reg.id) === Number(registroId),
    );

    if (registroSeleccionado) {
      setDetalleFormData({
        ...detalleFormData,
        procesoOrigenLineaId: Number(registroSeleccionado.id),
        // ✅ AUTO-LLENAR ENTIDAD COMERCIAL
        entidadComercialId: registroSeleccionado.clienteId
          ? Number(registroSeleccionado.clienteId)
          : registroSeleccionado.proveedorId
            ? Number(registroSeleccionado.proveedorId)
            : null,
        numeroDocumentoOrigen: registroSeleccionado.numeroDocumento || "",
        fechaDocumentoOrigen: registroSeleccionado.fechaDocumento
          ? new Date(registroSeleccionado.fechaDocumento)
          : null,
        fechaVenceDocumentoOrigen: registroSeleccionado.fechaVencimiento
          ? new Date(registroSeleccionado.fechaVencimiento)
          : null,
        tipoDocumentoOrigenId: registroSeleccionado.tipoDocumentoId
          ? Number(registroSeleccionado.tipoDocumentoId)
          : null,
      });
    } else {
      setDetalleFormData({
        ...detalleFormData,
        procesoOrigenLineaId: null,
        entidadComercialId: null, // ✅ Limpiar también
        numeroDocumentoOrigen: "",
        fechaDocumentoOrigen: null,
        fechaVenceDocumentoOrigen: null,
        tipoDocumentoOrigenId: null,
      });
    }
  };

  const handleSaveDetalle = async () => {
    // ✅ EVITAR DOBLE GUARDADO
    if (guardando) {
      return;
    }

    if (!detalleFormData.planCuentaId) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar una cuenta contable",
        life: 3000,
      });
      return;
    }

    if (!detalleFormData.glosa) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe ingresar una glosa",
        life: 3000,
      });
      return;
    }

    if (!detalleFormData.monedaId) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar una moneda",
        life: 3000,
      });
      return;
    }

    // Determinar si es moneda extranjera (USD = id 2)
    const esMonedaExtranjera = Number(detalleFormData.monedaId) !== 1;
    const tipoCambio = Number(formData.tipoCambio) || 1;

    // Si es moneda extranjera, usar los montos en ME (si existen) o los del input
    const debe = esMonedaExtranjera
      ? Number(
          detalleFormData.debeMonedaExtranjera || detalleFormData.debe || 0,
        )
      : Number(detalleFormData.debe || 0);
    const haber = esMonedaExtranjera
      ? Number(
          detalleFormData.haberMonedaExtranjera || detalleFormData.haber || 0,
        )
      : Number(detalleFormData.haber || 0);

    if (debe === 0 && haber === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe ingresar un monto en Debe o Haber",
        life: 3000,
      });
      return;
    }

    if (debe > 0 && haber > 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "No puede tener monto en Debe y Haber al mismo tiempo",
        life: 3000,
      });
      return;
    }

    // ✅ ACTIVAR FLAG DE GUARDANDO
    setGuardando(true);

    let detalleConvertido = {
      ...detalleFormData,
      debe: 0,
      haber: 0,
      debeMonedaExtranjera: null,
      haberMonedaExtranjera: null,
      centroCostoId: detalleFormData.centroCostoId,
      entidadComercialId: detalleFormData.entidadComercialId,
      tipoDocumentoOrigenId: detalleFormData.tipoDocumentoOrigenId,
      numeroDocumentoOrigen: detalleFormData.numeroDocumentoOrigen,
      fechaDocumentoOrigen: detalleFormData.fechaDocumentoOrigen,
      fechaVenceDocumentoOrigen: detalleFormData.fechaVenceDocumentoOrigen,
      submoduloOrigenLineaId: detalleFormData.submoduloOrigenLineaId,
      procesoOrigenLineaId: detalleFormData.procesoOrigenLineaId,
    };

    if (esMonedaExtranjera) {
      // Si la línea es en moneda extranjera
      if (debe > 0) {
        detalleConvertido.debeMonedaExtranjera = debe;
        detalleConvertido.debe = debe * tipoCambio;
      }
      if (haber > 0) {
        detalleConvertido.haberMonedaExtranjera = haber;
        detalleConvertido.haber = haber * tipoCambio;
      }
    } else {
      // Si la línea es en soles
      detalleConvertido.debe = debe;
      detalleConvertido.haber = haber;
    }

    let nuevosDetalles;
    if (editingDetalle) {
      // ✅ MODO EDICIÓN: Actualizar el detalle existente por ID
      nuevosDetalles = detalles.map((d) =>
        d.id === editingDetalle.id
          ? {
              ...d,
              ...detalleConvertido,
              numeroLinea: d.numeroLinea,
              id: d.id, // ✅ Preservar el ID
            }
          : d,
      );
    } else {
      // ✅ MODO NUEVO: Siempre crear nuevo detalle
      // El backend se encargará de evitar duplicados si es necesario
      const nuevoDetalle = {
        ...detalleConvertido,
        numeroLinea: detalles.length + 1,
      };
      nuevosDetalles = [...detalles, nuevoDetalle];
    }

    await autoGuardarAsiento(nuevosDetalles);

    // ✅ DESACTIVAR FLAG DE GUARDANDO
    setGuardando(false);

    // ✅ CERRAR DIÁLOGO SOLO SI ES NUEVO (NO AL EDITAR)
    if (!editingDetalle) {
      setShowDetalleDialog(false);
      setEditingDetalle(null);
      setNombreUsuarioCreador("N/A");
      setNombreUsuarioActualizador("N/A");
    }
  };

  const handleDeleteDetalle = async (detalle) => {
    const nuevosDetalles = detalles
      .filter((d) => d !== detalle)
      .map((d, index) => ({ ...d, numeroLinea: index + 1 }));
    setDetalles(nuevosDetalles);

    // AUTO-GUARDAR después de eliminar detalle
    await autoGuardarAsiento(nuevosDetalles);
  };

  const handleClonarDetalles = async () => {
    if (detallesSeleccionados.length === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Sin Selección",
        detail: "Debe seleccionar al menos un detalle para clonar",
        life: 3000,
      });
      return;
    }

    if (!cantidadClones || cantidadClones < 1) {
      toast.current?.show({
        severity: "warn",
        summary: "Cantidad Inválida",
        detail: "Debe ingresar una cantidad válida de clones (mínimo 1)",
        life: 3000,
      });
      return;
    }

    const nuevosDetalles = [...detalles];

    // Por cada detalle seleccionado, crear N clones
    detallesSeleccionados.forEach((detalleOriginal) => {
      for (let i = 0; i < cantidadClones; i++) {
        const clon = {
          ...detalleOriginal,
          id: undefined, // Nuevo detalle sin ID (el backend asignará uno nuevo)
          numeroLinea: nuevosDetalles.length + 1,
          creadoEn: undefined,
          creadoPor: undefined,
          actualizadoEn: undefined,
          actualizadoPor: undefined,
        };
        nuevosDetalles.push(clon);
      }
    });

    // Renumerar todos los detalles
    const detallesRenumerados = nuevosDetalles.map((d, index) => ({
      ...d,
      numeroLinea: index + 1,
    }));

    await autoGuardarAsiento(detallesRenumerados);

    setDetallesSeleccionados([]);
    setShowClonarDialog(false);
    setCantidadClones(1);

    toast.current?.show({
      severity: "success",
      summary: "Clonación Exitosa",
      detail: `Se clonaron ${detallesSeleccionados.length} detalle(s) ${cantidadClones} ${cantidadClones === 1 ? "vez" : "veces"}`,
      life: 3000,
    });
  };

  const autoGuardarAsiento = async (detallesActualizados) => {
    // Validar solo datos mínimos requeridos por el backend
    if (!formData.empresaId || !formData.periodoContableId) {
      toast.current?.show({
        severity: "warn",
        summary: "Datos Incompletos",
        detail: "Seleccione Empresa y Período antes de agregar detalles",
        life: 3000,
      });
      return;
    }

    const totalDebe = detallesActualizados.reduce(
      (sum, d) => sum + Number(d.debe || 0),
      0,
    );
    const totalHaber = detallesActualizados.reduce(
      (sum, d) => sum + Number(d.haber || 0),
      0,
    );
    const diferencia = totalDebe - totalHaber;
    const estaCuadrado = Math.abs(diferencia) < 0.01;

    const dataToSend = {
      empresaId: Number(formData.empresaId),
      periodoContableId: Number(formData.periodoContableId),
      fechaAsiento: formData.fechaAsiento?.toISOString(),
      glosa: formData.glosa,
      tipoLibro: formData.tipoLibro,
      origenAsiento: formData.origenAsiento,
      estadoId: Number(formData.estadoId),
      monedaId: Number(formData.monedaId),
      tipoCambio: formData.tipoCambio ? Number(formData.tipoCambio) : null,
      totalDebe,
      totalHaber,
      diferencia,
      estaCuadrado,
      detalles: detallesActualizados.map((d) => ({
        numeroLinea: d.numeroLinea,
        planCuentaId: Number(d.planCuentaId),
        codigoCuenta: d.codigoCuenta,
        nombreCuenta: d.nombreCuenta,
        glosa: d.glosa,
        debe: Number(d.debe || 0),
        haber: Number(d.haber || 0),
        monedaId: Number(d.monedaId) || Number(formData.monedaId),
        tipoCambio:
          d.tipoCambio || formData.tipoCambio
            ? Number(d.tipoCambio || formData.tipoCambio)
            : null,
        debeMonedaExtranjera: d.debeMonedaExtranjera
          ? Number(d.debeMonedaExtranjera)
          : null,
        haberMonedaExtranjera: d.haberMonedaExtranjera
          ? Number(d.haberMonedaExtranjera)
          : null,
        centroCostoId: d.centroCostoId ? Number(d.centroCostoId) : null,
        entidadComercialId: d.entidadComercialId
          ? Number(d.entidadComercialId)
          : null,
        tipoDocumentoOrigenId: d.tipoDocumentoOrigenId
          ? Number(d.tipoDocumentoOrigenId)
          : null,
        numeroDocumentoOrigen: d.numeroDocumentoOrigen || null,
        fechaDocumentoOrigen:
          d.fechaDocumentoOrigen instanceof Date
            ? d.fechaDocumentoOrigen.toISOString()
            : d.fechaDocumentoOrigen,
        fechaVenceDocumentoOrigen:
          d.fechaVenceDocumentoOrigen instanceof Date
            ? d.fechaVenceDocumentoOrigen.toISOString()
            : d.fechaVenceDocumentoOrigen,
        submoduloOrigenLineaId: d.submoduloOrigenLineaId
          ? Number(d.submoduloOrigenLineaId)
          : null,
        procesoOrigenLineaId: d.procesoOrigenLineaId
          ? Number(d.procesoOrigenLineaId)
          : null,
        creadoPor: d.creadoPor ? Number(d.creadoPor) : null,
        creadoEn: d.creadoEn || null, // Preservar creadoEn
      })),
    };

    if (!asientoId) {
      dataToSend.creadoPor = usuario?.personalId;
    } else {
      dataToSend.actualizadoPor = usuario?.personalId;
    }

    try {
      let response;
      if (asientoId) {
        // Actualizar asiento existente
        response = await updateAsientoContable(asientoId, dataToSend);
      } else {
        // Crear nuevo asiento
        response = await createAsientoContable(dataToSend);
        setAsientoId(response.id); // Guardar el ID para futuras actualizaciones
      }

      // ✅ ACTUALIZAR DETALLES CON DATOS DEL BACKEND (incluye relaciones y auditoría)
      if (response.detalles && response.detalles.length > 0) {
        const detallesConRelaciones = response.detalles.map((d) => ({
          ...d,
          // SIEMPRE usar datos de la relación planCuenta (no los campos desnormalizados)
          codigoCuenta: d.planCuenta?.codigoCuenta || d.codigoCuenta,
          nombreCuenta: d.planCuenta?.nombreCuenta || d.nombreCuenta,
          fechaDocumentoOrigen: d.fechaDocumentoOrigen
            ? new Date(d.fechaDocumentoOrigen)
            : null,
          fechaVenceDocumentoOrigen: d.fechaVenceDocumentoOrigen
            ? new Date(d.fechaVenceDocumentoOrigen)
            : null,
        }));
        setDetalles(detallesConRelaciones);
      }

      // ✅ ACTUALIZAR TOTALES EN EL FORMULARIO
      setFormData((prev) => ({
        ...prev,
        numeroAsiento: response.numeroAsiento || prev.numeroAsiento,
        totalDebe: response.totalDebe,
        totalHaber: response.totalHaber,
        diferencia: response.diferencia,
        estaCuadrado: response.estaCuadrado,
      }));

      toast.current?.show({
        severity: "success",
        summary: "Guardado Automático",
        detail: "El detalle se guardó correctamente",
        life: 2000,
      });
    } catch (error) {
      console.error("❌ [AUTO] Error en autoGuardarAsiento:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error al Guardar",
        detail: error.response?.data?.message || "Error al guardar el detalle",
        life: 3000,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.empresaId) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar una empresa",
        life: 3000,
      });
      return;
    }

    if (!formData.periodoContableId) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar un período contable",
        life: 3000,
      });
      return;
    }

    // VALIDACIONES ELIMINADAS: Permitir guardar sin glosa y sin detalles
    // El backend ya no requiere estas validaciones para asientos en proceso

    // Advertencia si no está cuadrado, pero NO bloquear el guardado
    if (detalles.length > 0 && !formData.estaCuadrado) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia: Asiento Descuadrado",
        detail: `El asiento no está balanceado. Debe: ${formData.totalDebe.toFixed(
          2,
        )}, Haber: ${formData.totalHaber.toFixed(2)}, Diferencia: ${Math.abs(
          formData.diferencia,
        ).toFixed(2)}. Se guardará de todas formas.`,
        life: 4000,
      });
      // NO hacer return, permitir que continúe el guardado
    }

    const dataToSend = {
      empresaId: Number(formData.empresaId),
      periodoContableId: Number(formData.periodoContableId),
      fechaAsiento: formData.fechaAsiento?.toISOString(),
      glosa: formData.glosa,
      tipoLibro: formData.tipoLibro,
      origenAsiento: formData.origenAsiento,
      estadoId: Number(formData.estadoId),
      monedaId: Number(formData.monedaId),
      tipoCambio: formData.tipoCambio ? Number(formData.tipoCambio) : null,
      totalDebe: Number(formData.totalDebe),
      totalHaber: Number(formData.totalHaber),
      diferencia: Number(formData.diferencia),
      estaCuadrado: formData.estaCuadrado,
      detalles:
        detalles.length > 0
          ? detalles.map((d) => ({
              numeroLinea: d.numeroLinea,
              planCuentaId: Number(d.planCuentaId),
              codigoCuenta: d.codigoCuenta,
              nombreCuenta: d.nombreCuenta,
              glosa: d.glosa,
              debe: Number(d.debe || 0),
              haber: Number(d.haber || 0),
              monedaId: Number(d.monedaId) || Number(formData.monedaId),
              tipoCambio:
                d.tipoCambio || formData.tipoCambio
                  ? Number(d.tipoCambio || formData.tipoCambio)
                  : null,
              debeMonedaExtranjera: d.debeMonedaExtranjera
                ? Number(d.debeMonedaExtranjera)
                : null,
              haberMonedaExtranjera: d.haberMonedaExtranjera
                ? Number(d.haberMonedaExtranjera)
                : null,
              centroCostoId: d.centroCostoId ? Number(d.centroCostoId) : null,
              entidadComercialId: d.entidadComercialId
                ? Number(d.entidadComercialId)
                : null,
              tipoDocumentoOrigenId: d.tipoDocumentoOrigenId
                ? Number(d.tipoDocumentoOrigenId)
                : null,
              numeroDocumentoOrigen: d.numeroDocumentoOrigen || null,
              fechaDocumentoOrigen: d.fechaDocumentoOrigen?.toISOString(),
              creadoPor: d.creadoPor ? Number(d.creadoPor) : null,
              creadoEn: d.creadoEn || null,
            }))
          : [],
    };

    if (!asientoId) {
      dataToSend.creadoPor = usuario?.personalId;
    } else {
      dataToSend.actualizadoPor = usuario?.personalId;
    }

    setGuardando(true);
    try {
      let response;
      if (asientoId) {
        response = await updateAsientoContable(asientoId, dataToSend);
        toast.current?.show({
          severity: "success",
          summary: "Asiento Actualizado",
          detail: "El asiento contable se actualizó correctamente",
          life: 3000,
        });
      } else {
        response = await createAsientoContable(dataToSend);
        setAsientoId(response.id);
        toast.current?.show({
          severity: "success",
          summary: "Asiento Creado",
          detail:
            "El asiento contable se creó correctamente. Puede seguir agregando líneas de detalle.",
          life: 4000,
        });
      }

      // Actualizar datos del formulario con la respuesta
      setFormData((prev) => ({
        ...prev,
        numeroAsiento: response.numeroAsiento || prev.numeroAsiento,
        totalDebe: response.totalDebe,
        totalHaber: response.totalHaber,
        diferencia: response.diferencia,
        estaCuadrado: response.estaCuadrado,
      }));

      // NO ejecutar onSubmit porque cierra el diálogo
      // El formulario permanece abierto para seguir trabajando
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error al Guardar",
        detail:
          error.response?.data?.message || "Error al guardar asiento contable",
        life: 5000,
      });
    } finally {
      setGuardando(false);
    }
  };

  const estadoId = Number(formData.estadoId);
  const esPendiente = estadoId === 76;
  const isReadOnly = readOnly || !esPendiente;

  const montoBodyTemplate = (rowData, field) => {
    // Siempre mostrar en PEN
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rowData[field] || 0);
  };

  const totalDebeME = detalles.reduce(
    (sum, d) => sum + Number(d.debeMonedaExtranjera || 0),
    0,
  );
  const totalHaberME = detalles.reduce(
    (sum, d) => sum + Number(d.haberMonedaExtranjera || 0),
    0,
  );
  const totalNetoME = totalDebeME - totalHaberME;

  const monedaExtranjeraCodigo = (() => {
    const detalleME = detalles.find((d) => Number(d.monedaId) !== 1);
    if (!detalleME) return null;

    const moneda = monedas.find(
      (m) => Number(m.id) === Number(detalleME.monedaId),
    );
    const codigoMoneda = moneda?.codigoSunat || null;
    return codigoMoneda && codigoMoneda !== "PEN" ? codigoMoneda : null;
  })();

  const footerMonedaMontoTemplate = () => {
    if (
      !monedaExtranjeraCodigo ||
      Math.abs(Number(totalNetoME || 0)) < 0.0001
    ) {
      return null;
    }

    return (
      <div
        style={{
          textAlign: "right",
          fontWeight: "bold",
          fontSize: "1.1rem",
          color: "#059669",
          whiteSpace: "nowrap",
        }}
      >
        {monedaExtranjeraCodigo}{" "}
        {new Intl.NumberFormat("es-PE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(totalNetoME)}
      </div>
    );
  };

  const footerDebeTemplate = () => {
    return (
      <div
        style={{
          textAlign: "right",
          fontWeight: "bold",
          fontSize: "1.1rem",
          color: "#1d4ed8",
          whiteSpace: "nowrap",
        }}
      >
        {new Intl.NumberFormat("es-PE", {
          style: "currency",
          currency: "PEN",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(Number(formData.totalDebe || 0))}
      </div>
    );
  };

  const footerHaberTemplate = () => {
    return (
      <div
        style={{
          textAlign: "right",
          fontWeight: "bold",
          fontSize: "1.1rem",
          color: "#dc2626",
          whiteSpace: "nowrap",
        }}
      >
        {new Intl.NumberFormat("es-PE", {
          style: "currency",
          currency: "PEN",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(Number(formData.totalHaber || 0))}
      </div>
    );
  };

  const monedaMontoBodyTemplate = (rowData) => {
    const moneda = monedas.find(
      (m) => Number(m.id) === Number(rowData.monedaId),
    );
    const codigoMoneda = moneda?.codigoSunat || "PEN";

    // Solo mostrar si NO es PEN
    if (codigoMoneda === "PEN") {
      return null;
    }

    // Determinar el monto en moneda extranjera
    const montoME =
      rowData.debeMonedaExtranjera || rowData.haberMonedaExtranjera || 0;

    return (
      <div
        style={{
          textAlign: "right",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        <span style={{ fontWeight: "bold", color: "#059669" }}>
          {codigoMoneda}
        </span>
        <span style={{ marginLeft: 6, fontSize: "0.95em" }}>
          {new Intl.NumberFormat("es-PE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(montoME)}
        </span>
      </div>
    );
  };

  const tipoCambioBodyTemplate = (rowData) => {
    const moneda = monedas.find(
      (m) => Number(m.id) === Number(rowData.monedaId),
    );
    const codigoMoneda = moneda?.codigoSunat || "PEN";

    // Solo mostrar si NO es PEN
    if (codigoMoneda === "PEN") {
      return null;
    }

    const tc = tipoCambioSunat || rowData.tipoCambio || formData.tipoCambio;

    return (
      <div style={{ textAlign: "center", fontSize: "0.9em" }}>
        {tc ? Number(tc).toFixed(3) : "-"}
      </div>
    );
  };

  const rowClassName = (rowData) => {
    const moneda = monedas.find(
      (m) => Number(m.id) === Number(rowData.monedaId),
    );
    const codigoMoneda = moneda?.codigoSunat || "PEN";

    if (codigoMoneda === "USD" || codigoMoneda === "ME") {
      return "row-moneda-usd"; // Verde claro
    }
    return "row-moneda-pen"; // Amarillo claro
  };

  const actionBodyTemplate = (rowData) => {
    if (isReadOnly) return null;
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-warning"
          onClick={() => openEditDetalle(rowData)}
          tooltip="Editar"
          type="button"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger"
          onClick={() => handleDeleteDetalle(rowData)}
          tooltip="Eliminar"
          type="button"
        />
      </div>
    );
  };

  const cuentasOptions = planCuentas.map((c) => ({
    label: `${c.codigoCuenta} - ${c.nombreCuenta}`,
    value: Number(c.id),
  }));

  const monedasOptions = monedas.map((m) => ({
    label: m.codigoSunat,
    value: Number(m.id),
  }));

  const centrosCostoOptions = centrosCosto.map((cc) => ({
    label: `${cc.Codigo} - ${cc.Nombre}`,
    value: Number(cc.id),
  }));

  const entidadesComercialesOptions = entidadesComerciales.map((ec) => ({
    label: ec.label || ec.razonSocial || ec.nombreComercial,
    value: Number(ec.value || ec.id),
  }));

  const preFacturasOptions = preFacturas.map((pf) => ({
    label: `${pf.numeroDocumento} - ${new Date(pf.fechaDocumento).toLocaleDateString()}${pf.estado ? ` - ${pf.estado.descripcion}` : ""}`,
    value: Number(pf.id),
    data: pf, // Para auto-llenar campos
  }));

  return (
    <>
      <Toast ref={toast} />
      <form onSubmit={handleSubmit} className="p-fluid">
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="empresaId" style={{ fontWeight: "bold" }}>
              Empresa <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              id="empresaId"
              value={formData.empresaId}
              options={empresas.map((e) => ({
                label: e.razonSocial,
                value: Number(e.id),
              }))}
              onChange={(e) => handleChange("empresaId", e.value)}
              placeholder="Seleccione empresa"
              disabled={!!empresaFija || isReadOnly}
              filter
              required
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="periodoContableId" style={{ fontWeight: "bold" }}>
              Período Contable <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              id="periodoContableId"
              value={formData.periodoContableId}
              options={periodos.map((p) => ({
                label: p.nombrePeriodo,
                value: Number(p.id),
              }))}
              onChange={(e) => handleChange("periodoContableId", e.value)}
              placeholder="Seleccione período"
              disabled={!!periodoFijo || isReadOnly}
              filter
              required
            />
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="fechaAsiento" style={{ fontWeight: "bold" }}>
              Fecha Asiento <span style={{ color: "red" }}>*</span>
            </label>
            <Calendar
              id="fechaAsiento"
              value={formData.fechaAsiento}
              onChange={(e) => handleChange("fechaAsiento", e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              disabled={isReadOnly}
              required
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="numeroAsiento">Número Asiento</label>
            <InputText
              id="numeroAsiento"
              value={formData.numeroAsiento}
              disabled
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="tipoLibro">Tipo Libro</label>
            <Dropdown
              id="tipoLibro"
              value={formData.tipoLibro}
              options={[
                { label: "FISCAL", value: "FISCAL" },
                { label: "GERENCIAL", value: "GERENCIAL" },
              ]}
              onChange={(e) => handleChange("tipoLibro", e.value)}
              disabled={isReadOnly}
            />
          </div>
          <div style={{ flex: 0.5 }}>
            <label htmlFor="monedaId">Moneda</label>
            <Dropdown
              id="monedaId"
              value={formData.monedaId}
              onChange={(e) => handleChange("monedaId", e.value)}
              options={monedas.map((m) => ({
                label: m.descripcion || m.codigoSunat,
                value: Number(m.id),
              }))}
              disabled={isReadOnly}
            />
          </div>
          <div style={{ flex: 0.5 }}>
            <label htmlFor="tipoCambio">Tipo Cambio</label>
            <InputNumber
              id="tipoCambio"
              value={formData.tipoCambio}
              onValueChange={(e) => handleChange("tipoCambio", e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={4}
              disabled={isReadOnly}
            />
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
            <label htmlFor="glosa" style={{ fontWeight: "bold" }}>
              Glosa <span style={{ color: "red" }}>*</span>
            </label>
            <InputTextarea
              id="glosa"
              value={formData.glosa}
              onChange={(e) => handleChange("glosa", e.target.value)}
              rows={2}
              disabled={isReadOnly}
              required
            />
          </div>
        </div>

        <DataTable
          value={detalles}
          paginator
          size="small"
          showGridlines
          stripedRows
          rows={40}
          rowsPerPageOptions={[40, 80, 160, 320]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} detalles"
          emptyMessage="No hay detalles agregados"
          rowClassName={rowClassName}
          selection={detallesSeleccionados}
          onSelectionChange={(e) => setDetallesSeleccionados(e.value)}
          dataKey="id"
          style={{
            cursor: !isReadOnly ? "pointer" : "default",
            fontSize: getResponsiveFontSize(),
          }}
          onRowClick={(e) => {
            // Solo abrir edición si NO está en modo selección
            if (!isReadOnly && detallesSeleccionados.length === 0) {
              openEditDetalle(e.data);
            }
          }}
          header={
            <div
              style={{
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <h2>Detalles del Asiento</h2>
              </div>
              <div style={{ flex: 1 }}>
                {!isReadOnly && detallesSeleccionados.length > 0 && (
                  <Button
                    label={`Clonar (${detallesSeleccionados.length})`}
                    icon="pi pi-clone"
                    className="p-button-info"
                    size="small"
                    raised
                    outlined
                    onClick={() => setShowClonarDialog(true)}
                    type="button"
                  />
                )}
              </div>
              <div style={{ flex: 1 }}>
                {!isReadOnly && (
                  <Button
                    label="Agregar Detalle"
                    icon="pi pi-plus"
                    className="p-button-success"
                    size="small"
                    raised
                    outlined
                    onClick={openNewDetalle}
                    type="button"
                    disabled={!asientoId}
                    tooltip={
                      !asientoId
                        ? "Primero debe guardar la cabecera del asiento"
                        : ""
                    }
                  />
                )}
              </div>
            </div>
          }
        >
          {!isReadOnly && (
            <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
          )}
          <Column field="numeroLinea" header="#" style={{ width: "5%" }} />
          <Column
            field="codigoCuenta"
            header="Código"
            style={{ width: "10%" }}
          />
          <Column
            field="nombreCuenta"
            header="Cuenta"
            style={{ width: "20%" }}
          />
          <Column
            header="Entidad Comercial"
            body={(rowData) =>
              rowData.entidadComercial?.razonSocial ||
              rowData.entidadComercial?.nombreComercial ||
              ""
            }
            style={{ width: "10%" }}
          />
          <Column field="glosa" header="Glosa" style={{ width: "25%" }} />
          <Column
            header="Moneda/Monto"
            body={monedaMontoBodyTemplate}
            footer={footerMonedaMontoTemplate}
            style={{ width: "10%", textAlign: "right" }}
            headerStyle={{
              whiteSpace: "nowrap",
              paddingTop: "0.25rem",
              paddingBottom: "0.25rem",
              textAlign: "right",
            }}
            bodyStyle={{
              whiteSpace: "nowrap",
              paddingTop: "0.15rem",
              paddingBottom: "0.15rem",
              textAlign: "right",
            }}
            footerStyle={{
              whiteSpace: "nowrap",
              paddingTop: "0.25rem",
              paddingBottom: "0.25rem",
              textAlign: "right",
              backgroundColor: "#ecfdf5",
            }}
          />
          <Column
            header="T/C"
            body={tipoCambioBodyTemplate}
            style={{ width: "5%", textAlign: "center" }}
          />
          <Column
            header="Debe"
            body={(rowData) => montoBodyTemplate(rowData, "debe")}
            footer={footerDebeTemplate}
            style={{ width: "12%", textAlign: "right" }}
            headerStyle={{
              whiteSpace: "nowrap",
              paddingTop: "0.25rem",
              paddingBottom: "0.25rem",
              textAlign: "right",
            }}
            bodyStyle={{
              whiteSpace: "nowrap",
              paddingTop: "0.15rem",
              paddingBottom: "0.15rem",
              textAlign: "right",
            }}
            footerStyle={{
              whiteSpace: "nowrap",
              paddingTop: "0.25rem",
              paddingBottom: "0.25rem",
              textAlign: "right",
              backgroundColor: "#eff6ff",
            }}
          />
          <Column
            header="Haber"
            body={(rowData) => montoBodyTemplate(rowData, "haber")}
            footer={footerHaberTemplate}
            style={{ width: "12%", textAlign: "right" }}
            headerStyle={{
              whiteSpace: "nowrap",
              paddingTop: "0.25rem",
              paddingBottom: "0.25rem",
              textAlign: "right",
            }}
            bodyStyle={{
              whiteSpace: "nowrap",
              paddingTop: "0.15rem",
              paddingBottom: "0.15rem",
              textAlign: "right",
            }}
            footerStyle={{
              whiteSpace: "nowrap",
              paddingTop: "0.25rem",
              paddingBottom: "0.25rem",
              textAlign: "right",
              backgroundColor: "#fef2f2",
            }}
          />
          {!isReadOnly && (
            <Column
              header="Acciones"
              body={actionBodyTemplate}
              style={{ width: "8%" }}
              headerStyle={{
                whiteSpace: "nowrap",
                paddingTop: "0.25rem",
                paddingBottom: "0.25rem",
              }}
              bodyStyle={{
                whiteSpace: "nowrap",
                paddingTop: "0.15rem",
                paddingBottom: "0.15rem",
              }}
            />
          )}
        </DataTable>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: "1rem",
            marginBottom: "1rem",
            alignItems: "end",
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="estadoId">Estado</label>
            <Dropdown
              id="estadoId"
              value={formData.estadoId}
              options={estados.map((e) => ({
                label: e.descripcion,
                value: Number(e.id),
              }))}
              disabled
            />
          </div>
          <div style={{ flex: 1 }}>
            <Button
              label={formData.estaCuadrado ? "CUADRADO" : "DESCUADRADO"}
              icon={
                formData.estaCuadrado
                  ? "pi pi-check-circle"
                  : "pi pi-times-circle"
              }
              className={
                formData.estaCuadrado ? "p-button-success" : "p-button-danger"
              }
              severity={formData.estaCuadrado ? "success" : "danger"}
              style={{
                width: "100%",
                marginTop: "1.5rem",
                fontWeight: "bold",
              }}
              disabled
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold" }}>Total Debe</label>
            <InputNumber
              value={formData.totalDebe}
              mode="decimal"
              minFractionDigits={2}
              disabled
              inputStyle={{ fontWeight: "bold" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold" }}>Total Haber</label>
            <InputNumber
              value={formData.totalHaber}
              mode="decimal"
              minFractionDigits={2}
              disabled
              inputStyle={{ fontWeight: "bold" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold" }}>Diferencia</label>
            <InputNumber
              value={formData.diferencia}
              mode="decimal"
              minFractionDigits={2}
              disabled
              inputStyle={{
                fontWeight: "bold",
                color: formData.estaCuadrado ? "#22c55e" : "#ef4444",
                backgroundColor: formData.estaCuadrado ? "#f0fdf4" : "#fef2f2",
              }}
            />
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
              severity="secondary"
              size="small"
              raised
              outlined
              onClick={onCancel}
              type="button"
              disabled={loading || guardando}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Button
              label={asientoId ? "Actualizar" : "Guardar"}
              icon="pi pi-check"
              type="submit"
              loading={loading || guardando}
              disabled={isReadOnly || loading || guardando}
              className="p-button-success"
              severity="success"
              raised
              size="small"
              outlined
            />
          </div>
        </div>
        <Dialog
          visible={showDetalleDialog}
          style={{ width: "1300px" }}
          header={editingDetalle ? "Editar Detalle" : "Nuevo Detalle"}
          modal
          className="p-fluid"
          onHide={() => setShowDetalleDialog(false)}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="planCuentaId" style={{ fontWeight: "bold" }}>
                Cuenta Contable <span style={{ color: "red" }}>*</span>
              </label>
              <Dropdown
                id="planCuentaId"
                value={detalleFormData.planCuentaId}
                options={cuentasOptions}
                onChange={(e) => handleCuentaChange(e.value)}
                placeholder="Seleccionar cuenta"
                filter
                filterBy="label"
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "end",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
              marginTop: 10,
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="submoduloOrigenLineaId">Submódulo Origen</label>
              <Dropdown
                id="submoduloOrigenLineaId"
                value={detalleFormData.submoduloOrigenLineaId}
                options={submodulosOptions}
                onChange={(e) => handleSubmoduloOrigenChange(e.value)}
                placeholder="Seleccionar submódulo"
                showClear
                disabled={!formData.empresaId}
                filter
                filterBy="label"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="procesoOrigenLineaId">Documento Origen</label>
              <Dropdown
                id="procesoOrigenLineaId"
                value={detalleFormData.procesoOrigenLineaId}
                options={preFacturasOptions}
                onChange={(e) => handlePreFacturaChange(e.value)}
                placeholder={
                  detalleFormData.submoduloOrigenLineaId
                    ? "Seleccionar documento"
                    : "Primero seleccione submódulo"
                }
                disabled={!detalleFormData.submoduloOrigenLineaId}
                showClear
                filter
                filterBy="label"
              />
            </div>
            <div style={{ flex: 2 }}>
              <label htmlFor="entidadComercialId">Entidad Comercial</label>
              <Dropdown
                id="entidadComercialId"
                value={detalleFormData.entidadComercialId}
                options={entidadesComercialesOptions}
                onChange={(e) => handleEntidadComercialChange(e.value)}
                placeholder="Seleccionar entidad"
                showClear
                filter
                filterBy="label"
              />
            </div>
            <div style={{ flex: 0.25 }}>
              <CrearEntidadComercialButton
                empresaId={formData.empresaId}
                tipoEntidad="ambos"
                onEntidadCreada={handleEntidadComercialCreada}
                label="Crear"
                icon="pi pi-building"
                severity="info"
                outlined={true}
                disabled={!formData.empresaId}
                className="w-full"
                toast={toast}
                tooltip="Crear nueva entidad comercial"
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
              marginTop: 10,
            }}
          ></div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
              marginTop: 10,
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="tipoDocumentoOrigenId">Tipo Doc. Origen</label>
              <Dropdown
                id="tipoDocumentoOrigenId"
                value={detalleFormData.tipoDocumentoOrigenId}
                options={tiposDocumento.map((td) => ({
                  label: td.descripcion,
                  value: Number(td.id),
                }))}
                onChange={(e) =>
                  setDetalleFormData({
                    ...detalleFormData,
                    tipoDocumentoOrigenId: e.value,
                  })
                }
                placeholder="Seleccionar tipo"
                showClear
                disabled={isReadOnly}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="procesoOrigenLineaId"
                style={{ fontWeight: "bold" }}
              >
                ID (Doc. Origen)
              </label>
              <InputNumber
                id="procesoOrigenLineaId"
                value={detalleFormData.procesoOrigenLineaId}
                onValueChange={(e) =>
                  setDetalleFormData({
                    ...detalleFormData,
                    procesoOrigenLineaId: e.value,
                  })
                }
                useGrouping={false}
                disabled={true}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="numeroDocumentoOrigen"
                style={{ fontWeight: "bold" }}
              >
                Número Doc. Origen
              </label>
              <InputText
                id="numeroDocumentoOrigen"
                value={detalleFormData.numeroDocumentoOrigen}
                onChange={(e) =>
                  setDetalleFormData({
                    ...detalleFormData,
                    numeroDocumentoOrigen: e.target.value,
                  })
                }
                disabled={isReadOnly}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label
                htmlFor="fechaDocumentoOrigen"
                style={{ fontWeight: "bold" }}
              >
                Fecha Doc. Origen
              </label>
              <Calendar
                id="fechaDocumentoOrigen"
                value={detalleFormData.fechaDocumentoOrigen}
                onChange={(e) =>
                  setDetalleFormData({
                    ...detalleFormData,
                    fechaDocumentoOrigen: e.value,
                  })
                }
                dateFormat="dd/mm/yy"
                showIcon
                disabled={isReadOnly}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="fechaVenceDocumentoOrigen">
                Fecha Vence Doc. Origen
              </label>
              <Calendar
                id="fechaVenceDocumentoOrigen"
                value={detalleFormData.fechaVenceDocumentoOrigen}
                onChange={(e) =>
                  setDetalleFormData({
                    ...detalleFormData,
                    fechaVenceDocumentoOrigen: e.value,
                  })
                }
                dateFormat="dd/mm/yy"
                showIcon
                disabled={isReadOnly}
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
              marginTop: 10,
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="glosaDetalle" style={{ fontWeight: "bold" }}>
                Glosa <span style={{ color: "red" }}>*</span>
              </label>
              <InputTextarea
                id="glosaDetalle"
                value={detalleFormData.glosa}
                onChange={(e) =>
                  setDetalleFormData({
                    ...detalleFormData,
                    glosa: e.target.value,
                  })
                }
                rows={2}
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
              marginTop: 10,
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="monedaIdDetalle" style={{ fontWeight: "bold" }}>
                Moneda <span style={{ color: "red" }}>*</span>
              </label>
              <Dropdown
                id="monedaIdDetalle"
                value={detalleFormData.monedaId}
                options={monedasOptions}
                onChange={(e) =>
                  setDetalleFormData({
                    ...detalleFormData,
                    monedaId: e.value,
                  })
                }
                placeholder="Seleccionar moneda"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="debe">Debe</label>
              <InputNumber
                id="debe"
                value={
                  Number(detalleFormData.monedaId) !== 1
                    ? detalleFormData.debeMonedaExtranjera || 0
                    : detalleFormData.debe || 0
                }
                onValueChange={(e) => {
                  const valor = e.value || 0;
                  if (Number(detalleFormData.monedaId) !== 1) {
                    setDetalleFormData({
                      ...detalleFormData,
                      debeMonedaExtranjera: valor,
                      haberMonedaExtranjera: 0,
                      debe: 0,
                      haber: 0,
                    });
                  } else {
                    setDetalleFormData({
                      ...detalleFormData,
                      debe: valor,
                      haber: 0,
                      debeMonedaExtranjera: null,
                      haberMonedaExtranjera: null,
                    });
                  }
                }}
                mode="currency"
                currency={
                  Number(detalleFormData.monedaId) === 2 ? "USD" : "PEN"
                }
                locale="es-PE"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="haber">Haber</label>
              <InputNumber
                id="haber"
                value={
                  Number(detalleFormData.monedaId) !== 1
                    ? detalleFormData.haberMonedaExtranjera || 0
                    : detalleFormData.haber || 0
                }
                onValueChange={(e) => {
                  const valor = e.value || 0;
                  if (Number(detalleFormData.monedaId) !== 1) {
                    setDetalleFormData({
                      ...detalleFormData,
                      haberMonedaExtranjera: valor,
                      debeMonedaExtranjera: 0,
                      debe: 0,
                      haber: 0,
                    });
                  } else {
                    setDetalleFormData({
                      ...detalleFormData,
                      haber: valor,
                      debe: 0,
                      debeMonedaExtranjera: null,
                      haberMonedaExtranjera: null,
                    });
                  }
                }}
                mode="currency"
                currency={
                  Number(detalleFormData.monedaId) === 2 ? "USD" : "PEN"
                }
                locale="es-PE"
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
              marginTop: 10,
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="centroCostoId">Centro de Costo</label>
              <Dropdown
                id="centroCostoId"
                value={detalleFormData.centroCostoId}
                options={centrosCostoOptions}
                onChange={(e) =>
                  setDetalleFormData({
                    ...detalleFormData,
                    centroCostoId: e.value,
                  })
                }
                placeholder="Seleccionar centro de costo"
                showClear
              />
            </div>
          </div>
          {editingDetalle &&
            (editingDetalle.creadoEn || editingDetalle.actualizadoEn) && (
              <div
                style={{
                  marginTop: 20,
                  padding: 10,
                  backgroundColor: "#f5f5f5",
                  borderRadius: 5,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 10,
                  }}
                >
                  <div>
                    <label style={{ fontSize: "12px", color: "#666" }}>
                      Creado
                    </label>
                    <InputText
                      value={
                        editingDetalle.creadoEn
                          ? new Date(editingDetalle.creadoEn).toLocaleString(
                              "es-PE",
                            )
                          : "N/A"
                      }
                      disabled
                      style={{ fontSize: "12px" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#666" }}>
                      Creado Por
                    </label>
                    <InputText
                      value={nombreUsuarioCreador}
                      disabled
                      style={{ fontSize: "12px" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#666" }}>
                      Actualizado
                    </label>
                    <InputText
                      value={
                        editingDetalle.actualizadoEn
                          ? new Date(
                              editingDetalle.actualizadoEn,
                            ).toLocaleString("es-PE")
                          : "N/A"
                      }
                      disabled
                      style={{ fontSize: "12px" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#666" }}>
                      Actualizado Por
                    </label>
                    <InputText
                      value={nombreUsuarioActualizador}
                      disabled
                      style={{ fontSize: "12px" }}
                    />
                  </div>
                </div>
              </div>
            )}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 18,
            }}
          >
            <Button
              label="Cancelar"
              icon="pi pi-times"
              onClick={() => {
                setShowDetalleDialog(false);
                setEditingDetalle(null);
                setNombreUsuarioCreador("N/A");
                setNombreUsuarioActualizador("N/A");
              }}
              type="button"
              className="p-button-warning"
              severity="warning"
              raised
            />
            <Button
              label="Guardar"
              icon="pi pi-check"
              onClick={handleSaveDetalle}
              type="button"
              className="p-button-success"
              severity="success"
              raised
            />
          </div>
        </Dialog>

        {/* DIÁLOGO: CLONAR DETALLES */}
        <Dialog
          header="🔄 Clonar Detalle(s)"
          visible={showClonarDialog}
          style={{ width: "450px" }}
          onHide={() => {
            setShowClonarDialog(false);
            setCantidadClones(1);
          }}
          footer={
            <div>
              <Button
                label="Cancelar"
                icon="pi pi-times"
                className="p-button-text"
                onClick={() => {
                  setShowClonarDialog(false);
                  setCantidadClones(1);
                }}
                type="button"
              />
              <Button
                label="Clonar"
                icon="pi pi-clone"
                onClick={handleClonarDetalles}
                disabled={cantidadClones < 1}
                type="button"
              />
            </div>
          }
        >
          <div className="p-fluid">
            <div className="field">
              <label htmlFor="cantidadClones">
                ¿Cuántas veces desea clonar?{" "}
                <span style={{ color: "red" }}>*</span>
              </label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Button
                  icon="pi pi-minus"
                  className="p-button-rounded p-button-outlined"
                  onClick={() =>
                    setCantidadClones((prev) => Math.max(1, prev - 1))
                  }
                  disabled={cantidadClones <= 1}
                  type="button"
                />
                <InputText
                  id="cantidadClones"
                  value={cantidadClones}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setCantidadClones(Math.min(100, Math.max(1, val)));
                  }}
                  style={{
                    textAlign: "center",
                    width: "80px",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                  }}
                />
                <Button
                  icon="pi pi-plus"
                  className="p-button-rounded p-button-outlined"
                  onClick={() =>
                    setCantidadClones((prev) => Math.min(100, prev + 1))
                  }
                  disabled={cantidadClones >= 100}
                  type="button"
                />
              </div>
            </div>
            <div
              style={{
                marginTop: 20,
                padding: 15,
                backgroundColor: "#f0f9ff",
                borderRadius: 6,
                border: "1px solid #bae6fd",
              }}
            >
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#0369a1" }}>
                <i className="pi pi-info-circle" style={{ marginRight: 8 }}></i>
                Se crearán <strong>{cantidadClones}</strong>{" "}
                {cantidadClones === 1 ? "copia" : "copias"} de{" "}
                <strong>{detallesSeleccionados.length}</strong>{" "}
                {detallesSeleccionados.length === 1 ? "detalle" : "detalles"}{" "}
                seleccionado(s).
              </p>
              <p
                style={{
                  margin: "8px 0 0 0",
                  fontSize: "0.85rem",
                  color: "#64748b",
                }}
              >
                Total de nuevos detalles:{" "}
                <strong>{detallesSeleccionados.length * cantidadClones}</strong>
              </p>
            </div>
          </div>
        </Dialog>
      </form>
    </>
  );
}
