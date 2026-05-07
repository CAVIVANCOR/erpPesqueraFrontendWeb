// src/components/contabilidad/asientoContable/useAsientoLogic.js
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../../../shared/stores/useAuthStore";
import { getPlanCuentasContable } from "../../../api/contabilidad/planCuentasContable";
import { getTiposDocumento } from "../../../api/tipoDocumento";
import { getCentrosCosto } from "../../../api/centroCosto";
import { getEntidadesComercialesPorEmpresa } from "../../../api/entidadComercial";
import { getPersonalPorId } from "../../../api/personal";
import { getDocumentosOrigenPorModelo } from "../../../api/contabilidad/documentosOrigen";
import { getSubmodulos } from "../../../api/submoduloSistema";
import { consultarTipoCambioSunat } from "../../../api/consultaExterna";
import { getActivos } from "../../../api/activo";
import {
  createAsientoContable,
  updateAsientoContable,
} from "../../../api/contabilidad/asientoContable";
import {
  calcularTotales,
  validarDetalle,
  prepararDetalleParaGuardar,
} from "./asientoHelpers";

export default function useAsientoLogic({
  isEdit,
  defaultValues,
  empresaFija,
  periodoFijo,
  toast,
}) {
  const { usuario } = useAuthStore();

  // Estados principales
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
  const [activos, setActivos] = useState([]);
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
    activoId: null,
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

  // Estados para filtros
  const [detallesFiltrados, setDetallesFiltrados] = useState([]);
  const [filtroCodigoCuenta, setFiltroCodigoCuenta] = useState("");
  const [filtroEntidadComercial, setFiltroEntidadComercial] = useState(null);
  const [filtroGlosa, setFiltroGlosa] = useState("");
  const [filtroNumeroDocOrigen, setFiltroNumeroDocOrigen] = useState("");
  const [filtroFechaDocRango, setFiltroFechaDocRango] = useState(null);
  const [filtroFechaVenceRango, setFiltroFechaVenceRango] = useState(null);
  const [filtroSubmodulo, setFiltroSubmodulo] = useState(null);

  // Cargar submódulos
  useEffect(() => {
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

  // Cargar datos iniciales
  useEffect(() => {
    cargarPlanCuentas();
    cargarTiposDocumento();
    cargarCentrosCosto();
    cargarActivos();
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

  // Calcular totales cuando cambian los detalles
  useEffect(() => {
    const totales = calcularTotales(detalles);
    setFormData((prev) => ({ ...prev, ...totales }));
  }, [detalles]);

  // Actualizar detalles cuando cambian los defaultValues
  useEffect(() => {
    if (defaultValues?.detalles) {
      setDetalles(
        defaultValues.detalles.map((d) => ({
          ...d,
          codigoCuenta: d.planCuenta?.codigoCuenta || "",
          nombreCuenta: d.planCuenta?.nombreCuenta || "",
          fechaDocumentoOrigen: d.fechaDocumentoOrigen
            ? new Date(d.fechaDocumentoOrigen)
            : null,
        })),
      );
    }
  }, [defaultValues?.detalles]);

  useEffect(() => {
    if (defaultValues?.id) {
      setAsientoId(defaultValues.id);
    }
  }, [defaultValues?.id]);

  // Guardar fecha inicial
  useEffect(() => {
    if (formData.fechaAsiento && fechaAsientoInicial === null) {
      setFechaAsientoInicial(formData.fechaAsiento);
    }
  }, [formData.fechaAsiento, fechaAsientoInicial]);

  // Cargar tipo de cambio SUNAT
  useEffect(() => {
    const cargarTipoCambio = async () => {
      if (!formData.fechaAsiento || fechaAsientoInicial === null) return;

      const fechaActualISO = new Date(formData.fechaAsiento).toISOString();
      const fechaInicialISO = new Date(fechaAsientoInicial).toISOString();

      if (fechaActualISO === fechaInicialISO) return;

      try {
        const fecha = new Date(formData.fechaAsiento);
        const fechaISO = fecha.toISOString().split("T")[0];
        const tipoCambioData = await consultarTipoCambioSunat({
          date: fechaISO,
        });

        if (tipoCambioData && tipoCambioData.buy_price) {
          const tipoCambioCompra = parseFloat(tipoCambioData.buy_price);
          handleChange("tipoCambio", tipoCambioCompra.toFixed(4));
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
      }
    };
    cargarTipoCambio();
  }, [formData.fechaAsiento, fechaAsientoInicial]);

  // Aplicar filtros
  useEffect(() => {
    filtrarDetalles();
  }, [
    detalles,
    filtroCodigoCuenta,
    filtroEntidadComercial,
    filtroGlosa,
    filtroNumeroDocOrigen,
    filtroFechaDocRango,
    filtroFechaVenceRango,
    filtroSubmodulo,
  ]);

  // Funciones de carga
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

  const cargarActivos = async () => {
    try {
      const data = await getActivos();
      setActivos(data);
    } catch (error) {
      console.error("Error al cargar activos:", error);
    }
  };

  const cargarNombresUsuarios = async (creadoPor, actualizadoPor) => {
    try {
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

  // Handlers
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
    setEditingDetalle(detalle);
    setDetalleFormData({
      planCuentaId: detalle.planCuentaId ? Number(detalle.planCuentaId) : null,
      codigoCuenta: detalle.planCuenta?.codigoCuenta || "",
      nombreCuenta: detalle.planCuenta?.nombreCuenta || "",
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
      activoId: detalle.activoId ? Number(detalle.activoId) : null,
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
          entidadComercialId,
          formData.empresaId,
        );
      }
    } else if (detalleFormData.submoduloOrigenLineaId && formData.empresaId) {
      const nombreModelo =
        submodulosMap[detalleFormData.submoduloOrigenLineaId];
      if (nombreModelo) {
        cargarRegistrosOrigen(nombreModelo, null, formData.empresaId);
      }
    } else {
      setPreFacturas([]);
    }
  };

  const handleEntidadComercialCreada = async (entidad) => {
    if (formData.empresaId) {
      await cargarEntidadesComerciales(formData.empresaId);
    }

    if (entidad && entidad.id) {
      setTimeout(() => {
        handleEntidadComercialChange(Number(entidad.id));
      }, 100);
    }

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
      entidadComercialId: null,
      numeroDocumentoOrigen: "",
      fechaDocumentoOrigen: null,
      fechaVenceDocumentoOrigen: null,
      tipoDocumentoOrigenId: null,
    });

    if (submoduloId && formData.empresaId) {
      const nombreModelo = submodulosMap[submoduloId];
      if (nombreModelo) {
        cargarRegistrosOrigen(nombreModelo, null, formData.empresaId);
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

  const handlePreFacturaChange = (registroId) => {
    const registroSeleccionado = preFacturas.find(
      (reg) => Number(reg.id) === Number(registroId),
    );

    if (registroSeleccionado) {
      setDetalleFormData({
        ...detalleFormData,
        procesoOrigenLineaId: Number(registroSeleccionado.id),
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
        entidadComercialId: null,
        numeroDocumentoOrigen: "",
        fechaDocumentoOrigen: null,
        fechaVenceDocumentoOrigen: null,
        tipoDocumentoOrigenId: null,
      });
    }
  };

  const handleSaveDetalle = async () => {
    if (guardando) return;

    const validacion = validarDetalle(detalleFormData);
    if (!validacion.isValid) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: validacion.mensaje,
        life: 3000,
      });
      return;
    }

    setGuardando(true);

    const detalleConvertido = prepararDetalleParaGuardar(
      detalleFormData,
      formData.tipoCambio,
    );

    let nuevosDetalles;
    if (editingDetalle) {
      nuevosDetalles = detalles.map((d) =>
        d.id === editingDetalle.id
          ? {
              ...d,
              ...detalleConvertido,
              numeroLinea: d.numeroLinea,
              id: d.id,
            }
          : d,
      );
    } else {
      const nuevoDetalle = {
        ...detalleConvertido,
        numeroLinea: detalles.length + 1,
      };
      nuevosDetalles = [...detalles, nuevoDetalle];
    }

    await autoGuardarAsiento(nuevosDetalles);
    setGuardando(false);

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

    detallesSeleccionados.forEach((detalleOriginal) => {
      for (let i = 0; i < cantidadClones; i++) {
        const clon = {
          ...detalleOriginal,
          id: undefined,
          numeroLinea: nuevosDetalles.length + 1,
          creadoEn: undefined,
          creadoPor: undefined,
          actualizadoEn: undefined,
          actualizadoPor: undefined,
        };
        nuevosDetalles.push(clon);
      }
    });

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

  const filtrarDetalles = () => {
    let filtrados = [...detalles];

    if (filtroCodigoCuenta && filtroCodigoCuenta.trim() !== "") {
      const busqueda = filtroCodigoCuenta.trim().toLowerCase();
      filtrados = filtrados.filter((item) => {
        const codigo = item.codigoCuenta ? item.codigoCuenta.toLowerCase() : "";
        return codigo.startsWith(busqueda);
      });
    }

    if (filtroEntidadComercial) {
      filtrados = filtrados.filter(
        (item) =>
          item.entidadComercialId &&
          Number(item.entidadComercialId) === Number(filtroEntidadComercial),
      );
    }

    if (filtroGlosa && filtroGlosa.trim() !== "") {
      const busqueda = filtroGlosa.trim().toLowerCase();
      filtrados = filtrados.filter((item) => {
        const glosa = item.glosa ? item.glosa.toLowerCase() : "";
        return glosa.includes(busqueda);
      });
    }

    if (filtroNumeroDocOrigen && filtroNumeroDocOrigen.trim() !== "") {
      const busqueda = filtroNumeroDocOrigen.trim().toLowerCase();
      filtrados = filtrados.filter((item) => {
        const numero = item.numeroDocumentoOrigen
          ? item.numeroDocumentoOrigen.toLowerCase()
          : "";
        return numero.includes(busqueda);
      });
    }

    if (filtroFechaDocRango && filtroFechaDocRango[0]) {
      filtrados = filtrados.filter((item) => {
        if (!item.fechaDocumentoOrigen) return false;
        const fechaDoc = new Date(item.fechaDocumentoOrigen);
        const fechaDesde = new Date(filtroFechaDocRango[0]);
        fechaDesde.setHours(0, 0, 0, 0);

        if (filtroFechaDocRango[1]) {
          const fechaHasta = new Date(filtroFechaDocRango[1]);
          fechaHasta.setHours(23, 59, 59, 999);
          return fechaDoc >= fechaDesde && fechaDoc <= fechaHasta;
        }

        return fechaDoc >= fechaDesde;
      });
    }

    if (filtroFechaVenceRango && filtroFechaVenceRango[0]) {
      filtrados = filtrados.filter((item) => {
        if (!item.fechaVenceDocumentoOrigen) return false;
        const fechaVence = new Date(item.fechaVenceDocumentoOrigen);
        const fechaDesde = new Date(filtroFechaVenceRango[0]);
        fechaDesde.setHours(0, 0, 0, 0);

        if (filtroFechaVenceRango[1]) {
          const fechaHasta = new Date(filtroFechaVenceRango[1]);
          fechaHasta.setHours(23, 59, 59, 999);
          return fechaVence >= fechaDesde && fechaVence <= fechaHasta;
        }

        return fechaVence >= fechaDesde;
      });
    }

    if (filtroSubmodulo) {
      filtrados = filtrados.filter(
        (item) =>
          item.submoduloOrigenLineaId &&
          Number(item.submoduloOrigenLineaId) === Number(filtroSubmodulo),
      );
    }

    setDetallesFiltrados(filtrados);
  };

  // ✅ NUEVA FUNCIÓN: Obtener opciones dinámicas de filtros
  const obtenerOpcionesDinamicas = () => {
    // Aplicar filtros excluyendo Entidad Comercial y Submódulo para obtener opciones dinámicas
    let datosFiltrados = [...detalles];

    // Aplicar filtro de código de cuenta
    if (filtroCodigoCuenta && filtroCodigoCuenta.trim() !== "") {
      const busqueda = filtroCodigoCuenta.trim().toLowerCase();
      datosFiltrados = datosFiltrados.filter((item) => {
        const codigo = item.codigoCuenta ? item.codigoCuenta.toLowerCase() : "";
        return codigo.startsWith(busqueda);
      });
    }

    // Aplicar filtro de glosa
    if (filtroGlosa && filtroGlosa.trim() !== "") {
      const busqueda = filtroGlosa.trim().toLowerCase();
      datosFiltrados = datosFiltrados.filter((item) => {
        const glosa = item.glosa ? item.glosa.toLowerCase() : "";
        return glosa.includes(busqueda);
      });
    }

    // Aplicar filtro de número de documento
    if (filtroNumeroDocOrigen && filtroNumeroDocOrigen.trim() !== "") {
      const busqueda = filtroNumeroDocOrigen.trim().toLowerCase();
      datosFiltrados = datosFiltrados.filter((item) => {
        const numero = item.numeroDocumentoOrigen
          ? item.numeroDocumentoOrigen.toLowerCase()
          : "";
        return numero.includes(busqueda);
      });
    }

    // Aplicar filtro de fecha documento
    if (filtroFechaDocRango && filtroFechaDocRango[0]) {
      datosFiltrados = datosFiltrados.filter((item) => {
        if (!item.fechaDocumentoOrigen) return false;
        const fechaDoc = new Date(item.fechaDocumentoOrigen);
        const fechaDesde = new Date(filtroFechaDocRango[0]);
        fechaDesde.setHours(0, 0, 0, 0);

        if (filtroFechaDocRango[1]) {
          const fechaHasta = new Date(filtroFechaDocRango[1]);
          fechaHasta.setHours(23, 59, 59, 999);
          return fechaDoc >= fechaDesde && fechaDoc <= fechaHasta;
        }

        return fechaDoc >= fechaDesde;
      });
    }

    // Aplicar filtro de fecha vencimiento
    if (filtroFechaVenceRango && filtroFechaVenceRango[0]) {
      datosFiltrados = datosFiltrados.filter((item) => {
        if (!item.fechaVenceDocumentoOrigen) return false;
        const fechaVence = new Date(item.fechaVenceDocumentoOrigen);
        const fechaDesde = new Date(filtroFechaVenceRango[0]);
        fechaDesde.setHours(0, 0, 0, 0);

        if (filtroFechaVenceRango[1]) {
          const fechaHasta = new Date(filtroFechaVenceRango[1]);
          fechaHasta.setHours(23, 59, 59, 999);
          return fechaVence >= fechaDesde && fechaVence <= fechaHasta;
        }

        return fechaVence >= fechaDesde;
      });
    }

    // Obtener entidades comerciales únicas de los datos filtrados (sin filtro de entidad)
    const entidadesUnicas = new Map();
    let datosParaEntidades = [...datosFiltrados];

    datosParaEntidades.forEach((detalle) => {
      if (detalle.entidadComercialId && detalle.entidadComercial) {
        entidadesUnicas.set(Number(detalle.entidadComercialId), {
          id: Number(detalle.entidadComercialId),
          razonSocial:
            detalle.entidadComercial.razonSocial ||
            detalle.entidadComercial.nombreComercial,
        });
      }
    });

    // Obtener submódulos únicos de los datos filtrados (sin filtro de submódulo)
    const submodulosUnicos = new Map();
    let datosParaSubmodulos = [...datosFiltrados];

    datosParaSubmodulos.forEach((detalle) => {
      if (detalle.submoduloOrigenLineaId) {
        const submodulo = submodulosOptions.find(
          (s) => Number(s.value) === Number(detalle.submoduloOrigenLineaId),
        );
        if (submodulo) {
          submodulosUnicos.set(
            Number(detalle.submoduloOrigenLineaId),
            submodulo,
          );
        }
      }
    });

    return {
      entidadesComercialesFiltradas: Array.from(entidadesUnicas.values()),
      submodulosFiltrados: Array.from(submodulosUnicos.values()),
    };
  };

  const limpiarFiltros = () => {
    setFiltroCodigoCuenta("");
    setFiltroEntidadComercial(null);
    setFiltroGlosa("");
    setFiltroNumeroDocOrigen("");
    setFiltroFechaDocRango(null);
    setFiltroFechaVenceRango(null);
    setFiltroSubmodulo(null);
  };

  const autoGuardarAsiento = async (detallesActualizados) => {
    if (!formData.empresaId || !formData.periodoContableId) {
      toast.current?.show({
        severity: "warn",
        summary: "Datos Incompletos",
        detail: "Seleccione Empresa y Período antes de agregar detalles",
        life: 3000,
      });
      return;
    }

    const totales = calcularTotales(detallesActualizados);

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
      ...totales,
      detalles: detallesActualizados.map((d) => ({
        numeroLinea: d.numeroLinea,
        planCuentaId: Number(d.planCuentaId),
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
        activoId: d.activoId ? Number(d.activoId) : null,
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
        creadoEn: d.creadoEn || null,
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
        response = await updateAsientoContable(asientoId, dataToSend);
      } else {
        response = await createAsientoContable(dataToSend);
        setAsientoId(response.id);
      }

      if (response.detalles && response.detalles.length > 0) {
        const detallesConRelaciones = response.detalles.map((d) => ({
          ...d,
          codigoCuenta: d.planCuenta?.codigoCuenta || "",
          nombreCuenta: d.planCuenta?.nombreCuenta || "",
          fechaDocumentoOrigen: d.fechaDocumentoOrigen
            ? new Date(d.fechaDocumentoOrigen)
            : null,
          fechaVenceDocumentoOrigen: d.fechaVenceDocumentoOrigen
            ? new Date(d.fechaVenceDocumentoOrigen)
            : null,
        }));
        setDetalles(detallesConRelaciones);
      }

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

    // Prevenir doble submit
    if (guardando) {
      return;
    }

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

    if (detalles.length > 0 && !formData.estaCuadrado) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia: Asiento Descuadrado",
        detail: `El asiento no está balanceado. Debe: ${Number(
          formData.totalDebe || 0,
        ).toFixed(
          2,
        )}, Haber: ${Number(formData.totalHaber || 0).toFixed(2)}, Diferencia: ${Math.abs(
          Number(formData.diferencia) || 0,
        ).toFixed(2)}. Se guardará de todas formas.`,
        life: 4000,
      });
    }

    const totales = calcularTotales(detalles);

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
      ...totales,
      detalles:
        detalles.length > 0
          ? detalles.map((d) => ({
              numeroLinea: d.numeroLinea,
              planCuentaId: Number(d.planCuentaId),
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
              activoId: d.activoId ? Number(d.activoId) : null,
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

      setFormData((prev) => ({
        ...prev,
        numeroAsiento: response.numeroAsiento || prev.numeroAsiento,
        totalDebe: response.totalDebe,
        totalHaber: response.totalHaber,
        diferencia: response.diferencia,
        estaCuadrado: response.estaCuadrado,
      }));
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

  return {
    formData,
    detalles,
    planCuentas,
    tiposDocumento,
    centrosCosto,
    entidadesComerciales,
    activos,
    preFacturas,
    nombreUsuarioCreador,
    nombreUsuarioActualizador,
    showDetalleDialog,
    setShowDetalleDialog,
    editingDetalle,
    setEditingDetalle,
    detalleFormData,
    setDetalleFormData,
    guardando,
    asientoId,
    tipoCambioSunat,
    submodulosMap,
    submodulosOptions,
    detallesSeleccionados,
    setDetallesSeleccionados,
    showClonarDialog,
    setShowClonarDialog,
    cantidadClones,
    setCantidadClones,
    detallesFiltrados,
    filtroCodigoCuenta,
    setFiltroCodigoCuenta,
    filtroEntidadComercial,
    setFiltroEntidadComercial,
    filtroGlosa,
    setFiltroGlosa,
    filtroNumeroDocOrigen,
    setFiltroNumeroDocOrigen,
    filtroFechaDocRango,
    setFiltroFechaDocRango,
    filtroFechaVenceRango,
    setFiltroFechaVenceRango,
    filtroSubmodulo,
    setFiltroSubmodulo,
    obtenerOpcionesDinamicas,
    handleChange,
    openNewDetalle,
    openEditDetalle,
    handleCuentaChange,
    handleEntidadComercialChange,
    handleEntidadComercialCreada,
    handleSubmoduloOrigenChange,
    handlePreFacturaChange,
    handleSaveDetalle,
    handleDeleteDetalle,
    handleClonarDetalles,
    limpiarFiltros,
    handleSubmit,
    setNombreUsuarioCreador,
    setNombreUsuarioActualizador,
  };
}
