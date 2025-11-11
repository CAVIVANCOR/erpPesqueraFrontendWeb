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

  // Estado único para todos los campos del formulario (patrón eficiente)
  const [formData, setFormData] = useState({
    // Datos básicos
    empresaId: defaultValues?.empresaId ? Number(defaultValues.empresaId) : (empresaFija ? Number(empresaFija) : null),
    tipoDocumentoId: defaultValues?.tipoDocumentoId ? Number(defaultValues.tipoDocumentoId) : 16,
    serieDocId: defaultValues?.serieDocId ? Number(defaultValues.serieDocId) : null,
    numSerieDoc: defaultValues?.numSerieDoc || "",
    numCorreDoc: defaultValues?.numCorreDoc || "",
    numeroDocumento: defaultValues?.numeroDocumento || "",
    
    // Fechas
    fechaDocumento: defaultValues?.fechaDocumento
      ? new Date(defaultValues.fechaDocumento)
      : new Date(),
    fechaRequerida: defaultValues?.fechaRequerida
      ? new Date(defaultValues.fechaRequerida)
      : null,
    fechaAprobacion: defaultValues?.fechaAprobacion
      ? new Date(defaultValues.fechaAprobacion)
      : null,
      
    // Relaciones - CONVERTIDOS A NUMBER PARA DROPDOWNS
    proveedorId: defaultValues?.proveedorId ? Number(defaultValues.proveedorId) : null,
    tipoProductoId: defaultValues?.tipoProductoId ? Number(defaultValues.tipoProductoId) : null,
    tipoEstadoProductoId: defaultValues?.tipoEstadoProductoId ? Number(defaultValues.tipoEstadoProductoId) : null,
    destinoProductoId: defaultValues?.destinoProductoId ? Number(defaultValues.destinoProductoId) : null,
    solicitanteId: defaultValues?.solicitanteId ? Number(defaultValues.solicitanteId) : null,
    estadoId: defaultValues?.estadoId ? Number(defaultValues.estadoId) : 34,
    ordenTrabajoId: defaultValues?.ordenTrabajoId ? Number(defaultValues.ordenTrabajoId) : null,
    
    // Comerciales - CONVERTIDOS A NUMBER PARA DROPDOWNS
    esConCotizacion: defaultValues?.esConCotizacion || false,
    formaPagoId: defaultValues?.formaPagoId ? Number(defaultValues.formaPagoId) : null,
    monedaId: defaultValues?.moneda?.id ? Number(defaultValues.moneda.id) : (defaultValues?.monedaId ? Number(defaultValues.monedaId) : 1),
    tipoCambio: defaultValues?.tipoCambio || null,
    centroCostoId: defaultValues?.centroCostoId ? Number(defaultValues.centroCostoId) : 14,
    porcentajeIGV: defaultValues?.porcentajeIGV || null,
    esExoneradoAlIGV: defaultValues?.esExoneradoAlIGV || false,
    
    // Responsables - CONVERTIDOS A NUMBER PARA DROPDOWNS
    respComprasId: defaultValues?.respComprasId ? Number(defaultValues.respComprasId) : null,
    respProduccionId: defaultValues?.respProduccionId ? Number(defaultValues.respProduccionId) : null,
    respAlmacenId: defaultValues?.respAlmacenId ? Number(defaultValues.respAlmacenId) : null,
    supervisorCampoId: defaultValues?.supervisorCampoId ? Number(defaultValues.supervisorCampoId) : null,
    aprobadoPorId: defaultValues?.aprobadoPorId ? Number(defaultValues.aprobadoPorId) : null,
    autorizaCompraId: defaultValues?.autorizaCompraId ? Number(defaultValues.autorizaCompraId) : null,
    
    // Sistema
    urlReqCompraPdf: defaultValues?.urlReqCompraPdf || "",
    creadoPor: defaultValues?.creadoPor ? Number(defaultValues.creadoPor) : null,
    actualizadoPor: defaultValues?.actualizadoPor ? Number(defaultValues.actualizadoPor) : null,
  });
  
  // Handler genérico para cambios en cualquier campo
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Actualizar formData cuando cambian los defaultValues (modo edición)
  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      setFormData({
        // Datos básicos
        empresaId: defaultValues?.empresaId ? Number(defaultValues.empresaId) : (empresaFija ? Number(empresaFija) : null),
        tipoDocumentoId: defaultValues?.tipoDocumentoId ? Number(defaultValues.tipoDocumentoId) : 16,
        serieDocId: defaultValues?.serieDocId ? Number(defaultValues.serieDocId) : null,
        numSerieDoc: defaultValues?.numSerieDoc || "",
        numCorreDoc: defaultValues?.numCorreDoc || "",
        numeroDocumento: defaultValues?.numeroDocumento || "",
        
        // Fechas
        fechaDocumento: defaultValues?.fechaDocumento
          ? new Date(defaultValues.fechaDocumento)
          : new Date(),
        fechaRequerida: defaultValues?.fechaRequerida
          ? new Date(defaultValues.fechaRequerida)
          : null,
        fechaAprobacion: defaultValues?.fechaAprobacion
          ? new Date(defaultValues.fechaAprobacion)
          : null,
          
        // Relaciones - CONVERTIDOS A NUMBER PARA DROPDOWNS
        proveedorId: defaultValues?.proveedorId ? Number(defaultValues.proveedorId) : null,
        tipoProductoId: defaultValues?.tipoProductoId ? Number(defaultValues.tipoProductoId) : null,
        tipoEstadoProductoId: defaultValues?.tipoEstadoProductoId ? Number(defaultValues.tipoEstadoProductoId) : null,
        destinoProductoId: defaultValues?.destinoProductoId ? Number(defaultValues.destinoProductoId) : null,
        solicitanteId: defaultValues?.solicitanteId ? Number(defaultValues.solicitanteId) : null,
        estadoId: defaultValues?.estadoId ? Number(defaultValues.estadoId) : 34,
        ordenTrabajoId: defaultValues?.ordenTrabajoId ? Number(defaultValues.ordenTrabajoId) : null,
        
        // Comerciales - CONVERTIDOS A NUMBER PARA DROPDOWNS
        esConCotizacion: defaultValues?.esConCotizacion || false,
        formaPagoId: defaultValues?.formaPagoId ? Number(defaultValues.formaPagoId) : null,
        monedaId: defaultValues?.moneda?.id ? Number(defaultValues.moneda.id) : (defaultValues?.monedaId ? Number(defaultValues.monedaId) : 1),
        tipoCambio: defaultValues?.tipoCambio || null,
        centroCostoId: defaultValues?.centroCostoId ? Number(defaultValues.centroCostoId) : 14,
        porcentajeIGV: defaultValues?.porcentajeIGV || null,
        esExoneradoAlIGV: defaultValues?.esExoneradoAlIGV || false,
        
        // Responsables - CONVERTIDOS A NUMBER PARA DROPDOWNS
        respComprasId: defaultValues?.respComprasId ? Number(defaultValues.respComprasId) : null,
        respProduccionId: defaultValues?.respProduccionId ? Number(defaultValues.respProduccionId) : null,
        respAlmacenId: defaultValues?.respAlmacenId ? Number(defaultValues.respAlmacenId) : null,
        supervisorCampoId: defaultValues?.supervisorCampoId ? Number(defaultValues.supervisorCampoId) : null,
        aprobadoPorId: defaultValues?.aprobadoPorId ? Number(defaultValues.aprobadoPorId) : null,
        autorizaCompraId: defaultValues?.autorizaCompraId ? Number(defaultValues.autorizaCompraId) : null,
        
        // Sistema
        urlReqCompraPdf: defaultValues?.urlReqCompraPdf || "",
        creadoPor: defaultValues?.creadoPor ? Number(defaultValues.creadoPor) : null,
        actualizadoPor: defaultValues?.actualizadoPor ? Number(defaultValues.actualizadoPor) : null,
        creadoEn: defaultValues?.creadoEn || null,
        actualizadoEn: defaultValues?.actualizadoEn || null,
      });
    }
  }, [defaultValues, empresaFija]);

  // Estados auxiliares (se mantienen)
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

  // Extraer valores individuales para compatibilidad con código existente
  const {
    empresaId,
    tipoDocumentoId,
    serieDocId,
    numSerieDoc,
    numCorreDoc,
    numeroDocumento,
    fechaDocumento,
    fechaRequerida,
    fechaAprobacion,
    proveedorId,
    tipoProductoId,
    tipoEstadoProductoId,
    destinoProductoId,
    solicitanteId,
    estadoId,
    ordenTrabajoId,
    esConCotizacion,
    formaPagoId,
    monedaId,
    tipoCambio,
    centroCostoId,
    porcentajeIGV,
    esExoneradoAlIGV,
    respComprasId,
    respProduccionId,
    respAlmacenId,
    supervisorCampoId,
    aprobadoPorId,
    autorizaCompraId,
    urlReqCompraPdf,
    creadoPor,
    actualizadoPor,
  } = formData;

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
        handleChange("porcentajeIGV", empresaSeleccionada.porcentajeIgv);
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
        handleChange("porcentajeIGV", 0);
      } else {
        // Si está afecto, porcentaje = empresa.porcentajeIgv
        if (
          empresaSeleccionada &&
          empresaSeleccionada.porcentajeIgv !== undefined
        ) {
          handleChange("porcentajeIGV", empresaSeleccionada.porcentajeIgv);
        }
      }
    }
  }, [esExoneradoAlIGV, empresaId, empresas]);

  // Asignar automáticamente el solicitante basado en el usuario logueado (solo al crear)
  useEffect(() => {
    if (!isEdit && usuario?.personalId && !solicitanteId) {
      handleChange("solicitanteId", Number(usuario.personalId));

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
      handleChange("creadoPor", Number(usuario.personalId));
    }
    if (isEdit && usuario?.personalId) {
      handleChange("actualizadoPor", Number(usuario.personalId));
    }
  }, [isEdit, usuario?.personalId]);

  // Cargar series de documentos cuando cambien empresaId o tipoDocumentoId
  useEffect(() => {
    const cargarSeriesDoc = async () => {
      if (empresaId && tipoDocumentoId) {
        try {
          const series = await getSeriesDocRequerimiento(
            empresaId,
            tipoDocumentoId
          );
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
            handleChange("respComprasId", Number(responsables[0].personalRespId));
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
            handleChange("respProduccionId", Number(responsables[0].personalRespId));
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
            handleChange("respAlmacenId", Number(responsables[0].personalRespId));
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

        handleChange("serieDocId", serieId);
        handleChange("numSerieDoc", numSerie);
        handleChange("numCorreDoc", `PRÓXIMO: ${proximoCorrelativo}`);
        handleChange("numeroDocumento", "Se generará al guardar");
      }
    } else {
      handleChange("serieDocId", null);
      handleChange("numSerieDoc", "");
      handleChange("numCorreDoc", "");
      handleChange("numeroDocumento", "");
    }
  };

  /**
   * Maneja la generación exitosa del PDF
   * Actualiza el estado urlReqCompraPdf con la URL generada
   */
  const handlePdfGenerated = (urlPdf) => {
    handleChange("urlReqCompraPdf", urlPdf);
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
    // Usar formData directamente
    const data = {
      empresaId: formData.empresaId ? Number(formData.empresaId) : null,
      tipoDocumentoId: formData.tipoDocumentoId ? Number(formData.tipoDocumentoId) : null,
      serieDocId: formData.serieDocId ? Number(formData.serieDocId) : null,
      numSerieDoc: formData.numSerieDoc,
      numCorreDoc: formData.numCorreDoc,
      numeroDocumento: formData.numeroDocumento,
      fechaDocumento: formData.fechaDocumento,
      fechaRequerida: formData.fechaRequerida,
      proveedorId: formData.proveedorId ? Number(formData.proveedorId) : null,
      tipoProductoId: formData.tipoProductoId ? Number(formData.tipoProductoId) : null,
      tipoEstadoProductoId: formData.tipoEstadoProductoId
        ? Number(formData.tipoEstadoProductoId)
        : null,
      destinoProductoId: formData.destinoProductoId ? Number(formData.destinoProductoId) : null,
      esConCotizacion: formData.esConCotizacion,
      formaPagoId: formData.formaPagoId ? Number(formData.formaPagoId) : null,
      monedaId: formData.monedaId ? Number(formData.monedaId) : null,
      tipoCambio: formData.tipoCambio,
      solicitanteId: formData.solicitanteId ? Number(formData.solicitanteId) : null,
      estadoId: formData.estadoId ? Number(formData.estadoId) : null,
      ordenTrabajoId: formData.ordenTrabajoId ? Number(formData.ordenTrabajoId) : null,
      fechaAprobacion: formData.fechaAprobacion,
      respComprasId: formData.respComprasId ? Number(formData.respComprasId) : null,
      respProduccionId: formData.respProduccionId ? Number(formData.respProduccionId) : null,
      respAlmacenId: formData.respAlmacenId ? Number(formData.respAlmacenId) : null,
      supervisorCampoId: formData.supervisorCampoId ? Number(formData.supervisorCampoId) : null,
      aprobadoPorId: formData.aprobadoPorId ? Number(formData.aprobadoPorId) : null,
      autorizaCompraId: formData.autorizaCompraId ? Number(formData.autorizaCompraId) : null,
      centroCostoId: formData.centroCostoId ? Number(formData.centroCostoId) : 14,
      urlReqCompraPdf: formData.urlReqCompraPdf,
      creadoPor: formData.creadoPor ? Number(formData.creadoPor) : null,
      actualizadoPor: formData.actualizadoPor ? Number(formData.actualizadoPor) : null,
      porcentajeIGV: formData.porcentajeIGV,
      esExoneradoAlIGV: formData.esExoneradoAlIGV,
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
            puedeEditarDetalles={puedeEditar}
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

          {/* APROBADO: Mostrar Autorizar Compra */}
          {estaAprobado && isEdit && (
            <Button
              label="Autorizar Compra"
              icon="pi pi-lock"
              className="p-button-warning"
              onClick={handleAutorizarCompraClick}
              disabled={loading}
            />
          )}
        </div>

        {/* Botones derecha: Guardar y Cancelar */}
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-secondary"
            onClick={onCancel}
            disabled={loading}
          />
          <Button
            label="Guardar"
            icon="pi pi-save"
            onClick={handleSubmit}
            disabled={loading || !puedeEditar}
          />
        </div>
      </div>
    </div>
  );
}