// src/components/requerimientoCompra/RequerimientoCompraForm.jsx
import React, { useState, useEffect } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import DatosGeneralesTab from "./DatosGeneralesTab";
import DetallesTab from "./DetallesTab";
import CotizacionesCompras from "./CotizacionesCompras";
import EntregasARendirComprasCard from "./EntregasARendirComprasCard";
import { getSeriesDocRequerimiento } from "../../api/requerimientoCompra";
import { getEstadosMultiFuncionPorTipoProviene } from "../../api/estadoMultiFuncion";
import { getParametrosAprobadorPorModulo } from "../../api/parametroAprobador";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import VerImpresionRequerimientoCompraPDF from "./VerImpresionRequerimientoCompraPDF";

export default function RequerimientoCompraForm({
  isEdit,
  defaultValues,
  empresas,
  tiposDocumento,
  proveedores,
  tiposProducto,
  tiposEstadoProducto,
  destinosProducto,
  formasPago,
  productos,
  personalOptions,
  centrosCosto = [],
  tiposMovimiento = [],
  monedas = [],
  empresaFija,
  onSubmit,
  onCancel,
  onAprobar,
  onAnular,
  onAutorizarCompra,
  loading,
  toast,
}) {
  const { usuario } = useAuthStore();

  // Estados individuales para cada campo (patrón MovimientoAlmacenForm)
  const [empresaId, setEmpresaId] = useState(
    defaultValues?.empresaId || empresaFija || null
  );
  const [tipoDocumentoId, setTipoDocumentoId] = useState(
    defaultValues?.tipoDocumentoId || 16
  );
  const [serieDocId, setSerieDocId] = useState(
    defaultValues?.serieDocId || null
  );
  const [numSerieDoc, setNumSerieDoc] = useState(
    defaultValues?.numSerieDoc || ""
  );
  const [numCorreDoc, setNumCorreDoc] = useState(
    defaultValues?.numCorreDoc || ""
  );
  const [numeroDocumento, setNumeroDocumento] = useState(
    defaultValues?.numeroDocumento || ""
  );
  const [fechaDocumento, setFechaDocumento] = useState(
    defaultValues?.fechaDocumento
      ? new Date(defaultValues.fechaDocumento)
      : new Date()
  );
  const [fechaRequerida, setFechaRequerida] = useState(
    defaultValues?.fechaRequerida
      ? new Date(defaultValues.fechaRequerida)
      : null
  );
  const [proveedorId, setProveedorId] = useState(
    defaultValues?.proveedorId || null
  );
  const [tipoProductoId, setTipoProductoId] = useState(
    defaultValues?.tipoProductoId || null
  );
  const [tipoEstadoProductoId, setTipoEstadoProductoId] = useState(
    defaultValues?.tipoEstadoProductoId || null
  );
  const [destinoProductoId, setDestinoProductoId] = useState(
    defaultValues?.destinoProductoId || null
  );
  const [esConCotizacion, setEsConCotizacion] = useState(
    defaultValues?.esConCotizacion || false
  );
  const [formaPagoId, setFormaPagoId] = useState(
    defaultValues?.formaPagoId || null
  );
  const [monedaId, setMonedaId] = useState(
    defaultValues?.moneda?.id || defaultValues?.monedaId || 1
  ); // Default: Soles - Usa relación directa si existe
  const [tipoCambio, setTipoCambio] = useState(
    defaultValues?.tipoCambio || null
  );
  const [solicitanteId, setSolicitanteId] = useState(
    defaultValues?.solicitanteId || null
  );
  const [estadoId, setEstadoId] = useState(
    defaultValues?.estadoId ? Number(defaultValues.estadoId) : 34 // Default: Pendiente
  );
  const [ordenTrabajoId, setOrdenTrabajoId] = useState(
    defaultValues?.ordenTrabajoId || null
  );
  const [fechaAprobacion, setFechaAprobacion] = useState(
    defaultValues?.fechaAprobacion
      ? new Date(defaultValues.fechaAprobacion)
      : null
  );
  const [respComprasId, setRespComprasId] = useState(
    defaultValues?.respComprasId || null
  );
  const [respProduccionId, setRespProduccionId] = useState(
    defaultValues?.respProduccionId || null
  );
  const [respAlmacenId, setRespAlmacenId] = useState(
    defaultValues?.respAlmacenId || null
  );
  const [supervisorCampoId, setSupervisorCampoId] = useState(
    defaultValues?.supervisorCampoId || null
  );
  const [aprobadoPorId, setAprobadoPorId] = useState(
    defaultValues?.aprobadoPorId || null
  );
  const [autorizaCompraId, setAutorizaCompraId] = useState(
    defaultValues?.autorizaCompraId || null
  );
  const [centroCostoId, setCentroCostoId] = useState(
    defaultValues?.centroCostoId || 14
  );
  const [urlReqCompraPdf, setUrlReqCompraPdf] = useState(
    defaultValues?.urlReqCompraPdf || ""
  );
  const [creadoPor, setCreadoPor] = useState(defaultValues?.creadoPor || null);
  const [actualizadoPor, setActualizadoPor] = useState(
    defaultValues?.actualizadoPor || null
  );
  const [porcentajeIGV, setPorcentajeIGV] = useState(
    defaultValues?.porcentajeIGV || null
  );
  const [esExoneradoAlIGV, setEsExoneradoAlIGV] = useState(
    defaultValues?.esExoneradoAlIGV || false
  );

  const [seriesDoc, setSeriesDoc] = useState([]);
  const [proveedoresFiltrados, setProveedoresFiltrados] = useState([]);
  const [personalFiltrado, setPersonalFiltrado] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [detallesCount, setDetallesCount] = useState(0);
  const [cotizacionesCount, setCotizacionesCount] = useState(0);
  const [entregasCount, setEntregasCount] = useState(0);
  const [totales, setTotales] = useState({ subtotal: 0, igv: 0, total: 0 });
  const [estadosRequerimiento, setEstadosRequerimiento] = useState([]);
  const [responsablesCompras, setResponsablesCompras] = useState([]);
  const [responsablesProduccion, setResponsablesProduccion] = useState([]);
  const [responsablesAlmacen, setResponsablesAlmacen] = useState([]);

  // Actualizar estados cuando cambien los defaultValues (patrón MovimientoAlmacenForm)
  // Filtrar proveedores por empresaId
  useEffect(() => {
    if (proveedores && proveedores.length > 0 && empresaId) {
      const proveedoresPorEmpresa = proveedores.filter(
        (p) => Number(p.empresaId) === Number(empresaId)
      );
      setProveedoresFiltrados(proveedoresPorEmpresa);
    } else {
      setProveedoresFiltrados([]);
    }
  }, [proveedores, empresaId]);

  // Filtrar personal por empresaId
  useEffect(() => {
    if (personalOptions && personalOptions.length > 0 && empresaId) {
      const personalPorEmpresa = personalOptions.filter(
        (p) => Number(p.empresaId) === Number(empresaId)
      );
      setPersonalFiltrado(personalPorEmpresa);
    } else {
      setPersonalFiltrado([]);
    }
  }, [personalOptions, empresaId]);

  // Inicializar porcentajeIGV desde la empresa cuando cambie empresaId (solo en creación)
  useEffect(() => {
    if (empresaId && empresas && empresas.length > 0 && !isEdit) {
      const empresaSeleccionada = empresas.find(
        (e) => Number(e.id) === Number(empresaId)
      );
      if (
        empresaSeleccionada &&
        empresaSeleccionada.porcentajeIgv !== undefined
      ) {
        setPorcentajeIGV(empresaSeleccionada.porcentajeIgv);
      }
    }
  }, [empresaId, empresas, isEdit]);

  // Actualizar porcentajeIGV cuando cambie esExoneradoAlIGV
  useEffect(() => {
    if (empresaId && empresas && empresas.length > 0) {
      const empresaSeleccionada = empresas.find(
        (e) => Number(e.id) === Number(empresaId)
      );

      if (esExoneradoAlIGV) {
        // Si está exonerado, porcentaje = 0
        setPorcentajeIGV(0);
      } else {
        // Si está afecto, porcentaje = empresa.porcentajeIgv
        if (
          empresaSeleccionada &&
          empresaSeleccionada.porcentajeIgv !== undefined
        ) {
          setPorcentajeIGV(empresaSeleccionada.porcentajeIgv);
        }
      }
    }
  }, [esExoneradoAlIGV, empresaId, empresas]);

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      setEmpresaId(
        defaultValues.empresaId
          ? Number(defaultValues.empresaId)
          : empresaFija
          ? Number(empresaFija)
          : null
      );
      setTipoDocumentoId(
        defaultValues.tipoDocumentoId
          ? Number(defaultValues.tipoDocumentoId)
          : 16
      );
      setSerieDocId(
        defaultValues.serieDocId ? Number(defaultValues.serieDocId) : null
      );
      setNumSerieDoc(defaultValues.numSerieDoc || "");
      setNumCorreDoc(defaultValues.numCorreDoc || "");
      setNumeroDocumento(defaultValues.numeroDocumento || "");
      setFechaDocumento(
        defaultValues.fechaDocumento
          ? new Date(defaultValues.fechaDocumento)
          : new Date()
      );
      setFechaRequerida(
        defaultValues.fechaRequerida
          ? new Date(defaultValues.fechaRequerida)
          : null
      );
      setProveedorId(
        defaultValues.proveedorId ? Number(defaultValues.proveedorId) : null
      );
      setTipoProductoId(
        defaultValues.tipoProductoId
          ? Number(defaultValues.tipoProductoId)
          : null
      );
      setTipoEstadoProductoId(
        defaultValues.tipoEstadoProductoId
          ? Number(defaultValues.tipoEstadoProductoId)
          : null
      );
      setDestinoProductoId(
        defaultValues.destinoProductoId
          ? Number(defaultValues.destinoProductoId)
          : null
      );
      setEsConCotizacion(defaultValues.esConCotizacion || false);
      setFormaPagoId(
        defaultValues.formaPagoId ? Number(defaultValues.formaPagoId) : null
      );
      setMonedaId(
        defaultValues.moneda?.id
          ? Number(defaultValues.moneda.id)
          : defaultValues.monedaId
          ? Number(defaultValues.monedaId)
          : null
      );
      setTipoCambio(defaultValues.tipoCambio || null);
      setSolicitanteId(
        defaultValues.solicitanteId ? Number(defaultValues.solicitanteId) : null
      );
      setEstadoId(
        defaultValues.estadoId ? Number(defaultValues.estadoId) : 34 // Default: Pendiente
      );
      setRespComprasId(
        defaultValues.respComprasId ? Number(defaultValues.respComprasId) : null
      );
      setRespProduccionId(
        defaultValues.respProduccionId
          ? Number(defaultValues.respProduccionId)
          : null
      );
      setRespAlmacenId(
        defaultValues.respAlmacenId ? Number(defaultValues.respAlmacenId) : null
      );
      setSupervisorCampoId(
        defaultValues.supervisorCampoId
          ? Number(defaultValues.supervisorCampoId)
          : null
      );
      setCentroCostoId(
        defaultValues.centroCostoId ? Number(defaultValues.centroCostoId) : 14
      );
      setOrdenTrabajoId(defaultValues.ordenTrabajoId || null);
      setFechaAprobacion(
        defaultValues.fechaAprobacion
          ? new Date(defaultValues.fechaAprobacion)
          : null
      );
      setAprobadoPorId(defaultValues.aprobadoPorId || null);
      setAutorizaCompraId(defaultValues.autorizaCompraId || null);
      setUrlReqCompraPdf(defaultValues.urlReqCompraPdf || "");
    }
  }, [defaultValues, empresaFija]);

  /**
   * Maneja la generación exitosa del PDF
   * Actualiza el estado urlReqCompraPdf con la URL generada
   */
  const handlePdfGenerated = (urlPdf) => {
    setUrlReqCompraPdf(urlPdf);
  };

  // Asignar automáticamente el solicitante basado en el usuario logueado (solo al crear)
  useEffect(() => {
    if (!isEdit && usuario?.personalId && !solicitanteId) {
      setSolicitanteId(Number(usuario.personalId));

      // Mostrar toast informativo
      if (toast?.current) {
        setTimeout(() => {
          toast.current.show({
            severity: "info",
            summary: "Solicitante Asignado",
            detail:
              "Se ha asignado automáticamente como solicitante del requerimiento",
            life: 3000,
          });
        }, 500);
      }
    }
  }, [isEdit, usuario?.personalId, toast]);

  // Asignar automáticamente creadoPor al crear y actualizadoPor al editar
  useEffect(() => {
    if (!isEdit && usuario?.personalId && !creadoPor) {
      setCreadoPor(Number(usuario.personalId));
    }
    if (isEdit && usuario?.personalId) {
      setActualizadoPor(Number(usuario.personalId));
    }
  }, [isEdit, usuario?.personalId]);

  // Cargar series de documentos cuando cambien empresaId o tipoDocumentoId
  // Filtrado: SerieDoc.empresaId = RequerimientoCompra.empresaId
  //           SerieDoc.activo = true (filtrado en backend)
  //           SerieDoc.tipoDocumentoId = RequerimientoCompra.tipoDocumentoId
  useEffect(() => {
    const cargarSeriesDoc = async () => {
      if (empresaId && tipoDocumentoId) {
        try {
          const series = await getSeriesDocRequerimiento(
            empresaId,
            tipoDocumentoId
          );
          // El backend ya filtra por activo=true, no necesitamos filtrar aquí
          setSeriesDoc(series);
        } catch (err) {
          console.error("Error al cargar series de documentos:", err);
          setSeriesDoc([]);
        }
      } else {
        setSeriesDoc([]);
      }
    };
    cargarSeriesDoc();
  }, [empresaId, tipoDocumentoId]);

  // Cargar estados de requerimiento (tipoProvieneDeId = 11)
  useEffect(() => {
    const cargarEstados = async () => {
      try {
        const estados = await getEstadosMultiFuncionPorTipoProviene(11);
        setEstadosRequerimiento(estados);
      } catch (err) {
        console.error("Error al cargar estados de requerimiento:", err);
        setEstadosRequerimiento([]);
      }
    };
    cargarEstados();
  }, []);

  // Cargar responsables de compras (moduloSistemaId = 4)
  useEffect(() => {
    const cargarResponsablesCompras = async () => {
      if (empresaId) {
        try {
          const responsables = await getParametrosAprobadorPorModulo(
            empresaId,
            4
          );
          setResponsablesCompras(responsables);
          // Asignar automáticamente si solo hay uno
          if (responsables.length === 1 && !respComprasId) {
            setRespComprasId(Number(responsables[0].personalRespId));
          }
        } catch (err) {
          console.error("Error al cargar responsables de compras:", err);
          setResponsablesCompras([]);
        }
      }
    };
    cargarResponsablesCompras();
  }, [empresaId]);

  // Cargar responsables de producción (moduloSistemaId = 13)
  useEffect(() => {
    const cargarResponsablesProduccion = async () => {
      if (empresaId) {
        try {
          const responsables = await getParametrosAprobadorPorModulo(
            empresaId,
            13
          );
          setResponsablesProduccion(responsables);
          // Asignar automáticamente si solo hay uno
          if (responsables.length === 1 && !respProduccionId) {
            setRespProduccionId(Number(responsables[0].personalRespId));
          }
        } catch (err) {
          console.error("Error al cargar responsables de producción:", err);
          setResponsablesProduccion([]);
        }
      }
    };
    cargarResponsablesProduccion();
  }, [empresaId]);

  // Cargar responsables de almacén (moduloSistemaId = 6)
  useEffect(() => {
    const cargarResponsablesAlmacen = async () => {
      if (empresaId) {
        try {
          const responsables = await getParametrosAprobadorPorModulo(
            empresaId,
            6
          );
          setResponsablesAlmacen(responsables);
          // Asignar automáticamente si solo hay uno
          if (responsables.length === 1 && !respAlmacenId) {
            setRespAlmacenId(Number(responsables[0].personalRespId));
          }
        } catch (err) {
          console.error("Error al cargar responsables de almacén:", err);
          setResponsablesAlmacen([]);
        }
      }
    };
    cargarResponsablesAlmacen();
  }, [empresaId]);

  // Handler para cambio de serie - Calcula y muestra el próximo correlativo
  // Mostrar información de referencia cuando se seleccione una serie
  // El número real se generará al guardar (igual que MovimientoAlmacenForm)
  const handleSerieDocChange = (serieId) => {
    if (serieId) {
      const serie = seriesDoc.find((s) => Number(s.id) === Number(serieId));
      if (serie) {
        // Mostrar formato de referencia (no el número real)
        const correlativoActual = Number(serie.correlativo);
        const proximoCorrelativo = correlativoActual + 1;
        const numSerie = String(serie.serie).padStart(
          serie.numCerosIzqSerie,
          "0"
        );

        setSerieDocId(serieId);
        setNumSerieDoc(numSerie);
        setNumCorreDoc(`PRÓXIMO: ${proximoCorrelativo}`);
        setNumeroDocumento("Se generará al guardar");
      }
    } else {
      setSerieDocId(null);
      setNumSerieDoc("");
      setNumCorreDoc("");
      setNumeroDocumento("");
    }
  };

  // Handler genérico para cambios de campos
  const handleChange = (field, value) => {
    const setters = {
      empresaId: setEmpresaId,
      tipoDocumentoId: setTipoDocumentoId,
      serieDocId: setSerieDocId,
      numSerieDoc: setNumSerieDoc,
      numCorreDoc: setNumCorreDoc,
      numeroDocumento: setNumeroDocumento,
      fechaDocumento: setFechaDocumento,
      fechaRequerida: setFechaRequerida,
      proveedorId: setProveedorId,
      tipoProductoId: setTipoProductoId,
      tipoEstadoProductoId: setTipoEstadoProductoId,
      destinoProductoId: setDestinoProductoId,
      esConCotizacion: setEsConCotizacion,
      formaPagoId: setFormaPagoId,
      monedaId: setMonedaId,
      tipoCambio: setTipoCambio,
      solicitanteId: setSolicitanteId,
      estadoId: setEstadoId,
      ordenTrabajoId: setOrdenTrabajoId,
      fechaAprobacion: setFechaAprobacion,
      respComprasId: setRespComprasId,
      respProduccionId: setRespProduccionId,
      respAlmacenId: setRespAlmacenId,
      supervisorCampoId: setSupervisorCampoId,
      aprobadoPorId: setAprobadoPorId,
      autorizaCompraId: setAutorizaCompraId,
      centroCostoId: setCentroCostoId,
      urlReqCompraPdf: setUrlReqCompraPdf,
      creadoPor: setCreadoPor,
      actualizadoPor: setActualizadoPor,
      porcentajeIGV: setPorcentajeIGV,
      esExoneradoAlIGV: setEsExoneradoAlIGV,
    };

    const setter = setters[field];
    if (setter) {
      setter(value);
    }
  };

  // Recalcular totales cuando cambien los detalles, porcentaje IGV o estado IGV
  useEffect(() => {
    const calcularTotales = async () => {
      if (!defaultValues?.id || !isEdit) return;

      try {
        const { getDetallesReqCompra } = await import(
          "../../api/detalleReqCompra"
        );
        const detalles = await getDetallesReqCompra(defaultValues.id);

        const subtotalCalc = detalles.reduce(
          (sum, det) => sum + (Number(det.subtotal) || 0),
          0
        );
        const igvCalc = esExoneradoAlIGV
          ? 0
          : subtotalCalc * (Number(porcentajeIGV) / 100);
        const totalCalc = subtotalCalc + igvCalc;

        setTotales({ subtotal: subtotalCalc, igv: igvCalc, total: totalCalc });
      } catch (err) {
        console.error("Error al calcular totales:", err);
      }
    };

    calcularTotales();
  }, [
    detallesCount,
    porcentajeIGV,
    esExoneradoAlIGV,
    isEdit,
    defaultValues?.id,
  ]);

  const handleSubmit = () => {
    // Construir el objeto con todos los estados individuales
    const data = {
      empresaId: empresaId ? Number(empresaId) : null,
      tipoDocumentoId: tipoDocumentoId ? Number(tipoDocumentoId) : null,
      serieDocId: serieDocId ? Number(serieDocId) : null,
      numSerieDoc,
      numCorreDoc,
      numeroDocumento,
      fechaDocumento,
      fechaRequerida,
      proveedorId: proveedorId ? Number(proveedorId) : null,
      tipoProductoId: tipoProductoId ? Number(tipoProductoId) : null,
      tipoEstadoProductoId: tipoEstadoProductoId
        ? Number(tipoEstadoProductoId)
        : null,
      destinoProductoId: destinoProductoId ? Number(destinoProductoId) : null,
      esConCotizacion,
      formaPagoId: formaPagoId ? Number(formaPagoId) : null,
      monedaId: monedaId ? Number(monedaId) : null,
      tipoCambio,
      solicitanteId: solicitanteId ? Number(solicitanteId) : null,
      estadoId: estadoId ? Number(estadoId) : null,
      ordenTrabajoId: ordenTrabajoId ? Number(ordenTrabajoId) : null,
      fechaAprobacion,
      respComprasId: respComprasId ? Number(respComprasId) : null,
      respProduccionId: respProduccionId ? Number(respProduccionId) : null,
      respAlmacenId: respAlmacenId ? Number(respAlmacenId) : null,
      supervisorCampoId: supervisorCampoId ? Number(supervisorCampoId) : null,
      aprobadoPorId: aprobadoPorId ? Number(aprobadoPorId) : null,
      autorizaCompraId: autorizaCompraId ? Number(autorizaCompraId) : null,
      centroCostoId: centroCostoId ? Number(centroCostoId) : 14,
      urlReqCompraPdf,
      creadoPor: creadoPor ? Number(creadoPor) : null,
      actualizadoPor: actualizadoPor ? Number(actualizadoPor) : null,
      porcentajeIGV,
      esExoneradoAlIGV,
    };

    // Validaciones
    if (!data.empresaId || !data.tipoDocumentoId || !data.serieDocId) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail:
          "Complete los campos obligatorios (Empresa, Tipo Documento, Serie)",
      });
      return;
    }

    if (!data.esConCotizacion && !data.proveedorId) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Para compra directa debe seleccionar un proveedor",
      });
      return;
    }

    onSubmit(data);
  };

  const handleAprobarClick = () => {
    if (!defaultValues?.id) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe guardar el requerimiento antes de aprobar",
      });
      return;
    }

    if (detallesCount === 0) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe agregar al menos un detalle antes de aprobar",
      });
      return;
    }

    onAprobar(defaultValues.id);
  };

  const handleAnularClick = () => {
    if (!defaultValues?.id) return;

    if (!puedeAnular) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Solo se puede anular un requerimiento pendiente o aprobado",
      });
      return;
    }

    onAnular(defaultValues.id);
  };

  const handleAutorizarCompraClick = () => {
    if (!defaultValues?.id) return;

    if (!puedeAutorizar) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Solo se puede autorizar un requerimiento aprobado",
      });
      return;
    }

    // Llamar a onAutorizarCompra pasando el ID y el usuario actual
    if (onAutorizarCompra) {
      onAutorizarCompra(defaultValues.id, usuario?.personalId);
    }
  };

  // Estados del documento
  const estaPendiente = estadoId === 34 || !estadoId;
  const estaAprobado = estadoId === 35;
  const estaAnulado = estadoId === 36;
  const estaAutorizado = estadoId === 37;
  const puedeEditar = estaPendiente && !loading;
  const puedeAnular = (estaPendiente || estaAprobado) && !loading;
  const puedeAutorizar = estaAprobado && !loading;

  // Crear objeto formData temporal para componentes hijos
  const formData = {
    empresaId,
    tipoDocumentoId,
    serieDocId,
    numSerieDoc,
    numCorreDoc,
    numeroDocumento,
    fechaDocumento,
    fechaRequerida,
    proveedorId,
    tipoProductoId,
    tipoEstadoProductoId,
    destinoProductoId,
    esConCotizacion,
    formaPagoId,
    monedaId,
    tipoCambio,
    solicitanteId,
    estadoId,
    ordenTrabajoId,
    fechaAprobacion,
    respComprasId,
    respProduccionId,
    respAlmacenId,
    supervisorCampoId,
    aprobadoPorId,
    autorizaCompraId,
    centroCostoId,
    urlReqCompraPdf,
    creadoPor,
    actualizadoPor,
    porcentajeIGV,
    esExoneradoAlIGV,
    creadoEn: defaultValues?.creadoEn,
    actualizadoEn: defaultValues?.actualizadoEn,
    empresa: defaultValues?.empresa, // Incluir objeto empresa completo del backend
  };

  // Preparar options para dropdowns siguiendo patrón MovimientoAlmacenForm
  const tiposDocumentoOptions = tiposDocumento.map((t) => ({
    ...t,
    id: Number(t.id),
    label: t.descripcion || t.nombre, // TipoDocumento usa 'descripcion'
    value: Number(t.id),
  }));

  const seriesDocOptions = seriesDoc.map((s) => {
    const correlativoActual = Number(s.correlativo);
    return {
      ...s,
      id: Number(s.id),
      label: `${s.serie} (Correlativo: ${correlativoActual})`,
      value: Number(s.id),
    };
  });

  const proveedoresOptions = proveedoresFiltrados.map((p) => ({
    ...p,
    id: Number(p.id),
    label: p.razonSocial,
    value: Number(p.id),
  }));

  const tiposProductoOptions = tiposProducto.map((t) => ({
    ...t,
    id: Number(t.id),
    label: t.nombre,
    value: Number(t.id),
  }));

  const tiposEstadoProductoOptions = tiposEstadoProducto.map((t) => ({
    ...t,
    id: Number(t.id),
    label: t.nombre,
    value: Number(t.id),
  }));

  const destinosProductoOptions = destinosProducto.map((d) => ({
    ...d,
    id: Number(d.id),
    label: d.nombre,
    value: Number(d.id),
  }));

  const formasPagoOptions = formasPago.map((f) => ({
    ...f,
    id: Number(f.id),
    label: f.nombre,
    value: Number(f.id),
  }));

  const empresasOptions = empresas.map((e) => ({
    ...e,
    id: Number(e.id),
    label: e.razonSocial,
    value: Number(e.id),
  }));

  const personalOptionsFormatted = personalFiltrado.map((p) => ({
    ...p,
    id: Number(p.id),
    label: p.nombreCompleto,
    value: Number(p.id),
  }));

  const estadosRequerimientoOptions = estadosRequerimiento.map((e) => ({
    ...e,
    id: Number(e.id),
    label: e.descripcion,
    value: Number(e.id),
  }));

  const responsablesComprasOptions = responsablesCompras.map((r) => ({
    id: Number(r.personalRespId),
    label: r.personal
      ? `${r.personal.nombres} ${r.personal.apellidos}`
      : `ID: ${r.personalRespId}`,
    value: Number(r.personalRespId),
  }));

  const responsablesProduccionOptions = responsablesProduccion.map((r) => ({
    id: Number(r.personalRespId),
    label: r.personal
      ? `${r.personal.nombres} ${r.personal.apellidos}`
      : `ID: ${r.personalRespId}`,
    value: Number(r.personalRespId),
  }));

  const responsablesAlmacenOptions = responsablesAlmacen.map((r) => ({
    id: Number(r.personalRespId),
    label: r.personal
      ? `${r.personal.nombres} ${r.personal.apellidos}`
      : `ID: ${r.personalRespId}`,
    value: Number(r.personalRespId),
  }));

  const centrosCostoOptions = centrosCosto.map((c) => ({
    ...c,
    id: Number(c.id),
    label: `${c.Codigo} ${c.Nombre}`,
    value: Number(c.id),
  }));

  const monedasOptions = monedas.map((m) => ({
    ...m,
    id: Number(m.id),
    label: `${m.nombreLargo} (${m.simbolo})`,
    value: Number(m.id),
  }));

  return (
    <div className="p-fluid">
      <TabView
        activeIndex={activeTab}
        onTabChange={(e) => setActiveTab(e.index)}
      >
        {/* TAB 1: DATOS GENERALES */}
        <TabPanel header="Datos Generales" leftIcon="pi pi-file">
          <DatosGeneralesTab
            formData={formData}
            onChange={handleChange}
            onSerieChange={handleSerieDocChange}
            empresasOptions={empresasOptions}
            tiposDocumentoOptions={tiposDocumentoOptions}
            proveedoresOptions={proveedoresOptions}
            tiposProductoOptions={tiposProductoOptions}
            tiposEstadoProductoOptions={tiposEstadoProductoOptions}
            destinosProductoOptions={destinosProductoOptions}
            formasPagoOptions={formasPagoOptions}
            personalOptions={personalOptionsFormatted}
            seriesDocOptions={seriesDocOptions}
            estadosRequerimientoOptions={estadosRequerimientoOptions}
            responsablesComprasOptions={responsablesComprasOptions}
            responsablesProduccionOptions={responsablesProduccionOptions}
            responsablesAlmacenOptions={responsablesAlmacenOptions}
            centrosCostoOptions={centrosCostoOptions}
            monedasOptions={monedasOptions}
            isEdit={isEdit}
            puedeEditar={puedeEditar}
            detallesCount={detallesCount}
            // Props para DetallesTab
            requerimientoId={defaultValues?.id}
            productos={productos}
            empresaId={empresaId}
            toast={toast}
            onCountChange={setDetallesCount}
            subtotal={totales.subtotal}
            totalIGV={totales.igv}
            total={totales.total}
            monedaRequerimiento={defaultValues?.moneda}
          />
        </TabPanel>

        {/* TAB 2: COTIZACIONES */}
        <TabPanel
          header={`Cotizaciones ${
            cotizacionesCount > 0 ? `(${cotizacionesCount})` : ""
          }`}
          leftIcon="pi pi-shopping-cart"
          disabled={!isEdit || !formData.esConCotizacion}
        >
          <CotizacionesCompras
            requerimientoId={defaultValues?.id}
            detallesRequerimiento={defaultValues?.detalles || []}
            proveedores={proveedores}
            monedas={monedas}
            puedeEditar={puedeEditar}
            toast={toast}
            onCountChange={setCotizacionesCount}
          />
        </TabPanel>
        {/* TAB 3: IMPRESION PDF */}
        <TabPanel header="Impresión PDF">
          <VerImpresionRequerimientoCompraPDF
            requerimientoId={defaultValues?.id}
            datosRequerimiento={defaultValues}
            toast={toast}
            personalOptions={personalOptions}
            onPdfGenerated={handlePdfGenerated}
          />
        </TabPanel>
        {/* TAB 4: ENTREGAS A RENDIR */}
        <TabPanel
          header={`Entregas a Rendir ${
            entregasCount > 0 ? `(${entregasCount})` : ""
          }`}
          leftIcon="pi pi-money-bill"
          disabled={!isEdit}
        >
          <EntregasARendirComprasCard
            requerimientoCompra={defaultValues}
            personal={personalOptions}
            centrosCosto={centrosCosto}
            tiposMovimiento={tiposMovimiento}
            entidadesComerciales={proveedores}
            monedas={monedas}
            tiposDocumento={tiposDocumento}
            puedeEditar={puedeEditar}
            onCountChange={setEntregasCount}
          />
        </TabPanel>
      </TabView>

      {/* BOTONES DE ACCIÓN */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 18,
        }}
      >
        {/* Botones izquierda: Aprobar, Anular, Autorizar Compra */}
        <div style={{ display: "flex", gap: 8 }}>
          {/* PENDIENTE: Mostrar Aprobar y Anular */}
          {estaPendiente && isEdit && (
            <>
              <Button
                label="Aprobar"
                icon="pi pi-check"
                className="p-button-success"
                onClick={handleAprobarClick}
                disabled={loading}
              />
              <Button
                label="Anular"
                icon="pi pi-ban"
                className="p-button-danger"
                onClick={handleAnularClick}
                disabled={loading}
              />
            </>
          )}

          {/* APROBADO: Mostrar Autorizar Compra y Anular */}
          {estaAprobado && isEdit && (
            <>
              <Tag
                value="APROBADO"
                severity="success"
                icon="pi pi-check"
                style={{ marginRight: 8 }}
              />
              <Button
                label="Autorizar Compra"
                icon="pi pi-verified"
                className="p-button-info"
                onClick={handleAutorizarCompraClick}
                disabled={loading}
              />
              <Button
                label="Anular"
                icon="pi pi-ban"
                className="p-button-danger"
                onClick={handleAnularClick}
                disabled={loading}
              />
            </>
          )}

          {/* ANULADO: Solo mostrar tag */}
          {estaAnulado && (
            <Tag value="ANULADO" severity="danger" icon="pi pi-ban" />
          )}

          {/* AUTORIZADO: Solo mostrar tag */}
          {estaAutorizado && (
            <Tag
              value="AUTORIZADO PARA COMPRA"
              severity="info"
              icon="pi pi-verified"
            />
          )}
        </div>

        {/* Botones derecha: Cancelar y Actualizar/Guardar */}
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-secondary"
            onClick={onCancel}
            disabled={loading}
          />

          {estaPendiente && (
            <Button
              label={isEdit ? "Actualizar" : "Guardar"}
              icon="pi pi-save"
              className="p-button-primary"
              onClick={handleSubmit}
              disabled={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
