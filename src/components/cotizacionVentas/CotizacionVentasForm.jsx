/**
 * Formulario principal para Cotización de Ventas
 *
 * Características:
 * - Navegación por cards con 7 secciones
 * - Validación completa con react-hook-form
 * - Integración con múltiples catálogos
 * - Cálculo automático de factor de exportación
 * - Generación de PDFs
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { ConfirmDialog } from "primereact/confirmdialog";

// Importar APIs
import {
  crearCotizacionVentas,
  actualizarCotizacionVentas,
  getCotizacionVentasPorId,
  getSeriesDoc,
} from "../../api/cotizacionVentas";
import { getClientesPorEmpresa } from "../../api/entidadComercial";
import { getIncoterms } from "../../api/incoterm";
import { getPuertosActivos } from "../../api/puertoPesca";
import { getBancos } from "../../api/banco";
import { getPaises } from "../../api/pais";
import { getAllFormaTransaccion } from "../../api/formaTransaccion";
import { getAllModoDespachoRecepcion } from "../../api/modoDespachoRecepcion";
import { getParametrosAprobadorPorModulo } from "../../api/parametroAprobador";

// Importar componentes de cards
import DatosGeneralesCotizacionCard from "./DatosGeneralesCotizacionCard";
import DetCotizacionVentasCard from "./DetCotizacionVentasCard";
import CostosExportacionCard from "./CostosExportacionCard";
import DocumentosRequeridosCard from "./DocumentosRequeridosCard";
import EntregaARendirCard from "./EntregaARendirCard";
import VerImpresionCotizacionVentasPDF from "./VerImpresionCotizacionVentasPDF";
import VerImpresionDocumentacionPDF from "./VerImpresionDocumentacionPDF";

const CotizacionVentasForm = ({
  cotizacion: cotizacionInicial = null,
  onSave,
  onCancel,
  empresas = [],
  tiposDocumento = [],
  clientes: clientesProp = [],
  tiposProducto = [],
  tiposEstadoProducto = [],
  destinosProducto = [],
  formasPago = [],
  productos = [],
  personalOptions = [],
  estadosDoc = [],
  centrosCosto = [],
  tiposMovimiento = [],
  monedas = [],
  empresaFija = null,
  loading: loadingProp = false,
  toast: toastProp,
}) => {
  const [activeCard, setActiveCard] = useState("datos-generales");
  const [loading, setLoading] = useState(false);
  const [cotizacion, setCotizacion] = useState(cotizacionInicial);
  const toast = useRef(toastProp || null);

  // Estados individuales para datos principales (siguiendo patrón RequerimientoCompraForm)
  const [empresaId, setEmpresaId] = useState(
    cotizacionInicial?.empresaId || empresaFija || null
  );
  const [clienteId, setClienteId] = useState(
    cotizacionInicial?.clienteId || null
  );
  const [numeroDocumento, setNumeroDocumento] = useState(
    cotizacionInicial?.numeroDocumento || ""
  );
  const [tipoDocumentoId, setTipoDocumentoId] = useState(
    cotizacionInicial?.tipoDocumentoId || 18 // Cotización Venta - FIJO
  );
  const [serieDocId, setSerieDocId] = useState(
    cotizacionInicial?.serieDocId || null
  );
  const [numSerieDoc, setNumSerieDoc] = useState(
    cotizacionInicial?.numSerieDoc || ""
  );
  const [numCorreDoc, setNumCorreDoc] = useState(
    cotizacionInicial?.numCorreDoc || ""
  );

  // Estados para fechas (modelo completo)
  const [fechaDocumento, setFechaDocumento] = useState(
    cotizacionInicial?.fechaDocumento
      ? new Date(cotizacionInicial.fechaDocumento)
      : new Date()
  );
  const [fechaVencimiento, setFechaVencimiento] = useState(
    cotizacionInicial?.fechaVencimiento
      ? new Date(cotizacionInicial.fechaVencimiento)
      : null
  );
  const [fechaEntregaEstimada, setFechaEntregaEstimada] = useState(
    cotizacionInicial?.fechaEntregaEstimada
      ? new Date(cotizacionInicial.fechaEntregaEstimada)
      : null
  );
  const [fechaZarpeEstimada, setFechaZarpeEstimada] = useState(
    cotizacionInicial?.fechaZarpeEstimada
      ? new Date(cotizacionInicial.fechaZarpeEstimada)
      : null
  );
  const [fechaArriboEstimada, setFechaArriboEstimada] = useState(
    cotizacionInicial?.fechaArriboEstimada
      ? new Date(cotizacionInicial.fechaArriboEstimada)
      : null
  );
  const [diasTransito, setDiasTransito] = useState(
    cotizacionInicial?.diasTransito || null
  );

  // Estados para cliente y contactos
  const [contactoClienteId, setContactoClienteId] = useState(
    cotizacionInicial?.contactoClienteId || null
  );
  const [dirEntregaId, setDirEntregaId] = useState(
    cotizacionInicial?.dirEntregaId || null
  );
  const [dirFiscalId, setDirFiscalId] = useState(
    cotizacionInicial?.dirFiscalId || null
  );

  // Estados para responsables (6 responsables - modelo completo)
  const [respVentasId, setRespVentasId] = useState(
    cotizacionInicial?.respVentasId || null
  );
  const [autorizaVentaId, setAutorizaVentaId] = useState(
    cotizacionInicial?.autorizaVentaId || null
  );
  const [supervisorVentaCampoId, setSupervisorVentaCampoId] = useState(
    cotizacionInicial?.supervisorVentaCampoId || null
  );
  const [respEmbarqueId, setRespEmbarqueId] = useState(
    cotizacionInicial?.respEmbarqueId || null
  );
  const [respProduccionId, setRespProduccionId] = useState(
    cotizacionInicial?.respProduccionId || null
  );
  const [respAlmacenId, setRespAlmacenId] = useState(
    cotizacionInicial?.respAlmacenId || null
  );

  // Estados para datos comerciales
  const [tipoProductoId, setTipoProductoId] = useState(
    cotizacionInicial?.tipoProductoId || null
  );
  const [formaPagoId, setFormaPagoId] = useState(
    cotizacionInicial?.formaPagoId || null
  );
  const [bancoId, setBancoId] = useState(cotizacionInicial?.bancoId || null);
  const [monedaId, setMonedaId] = useState(cotizacionInicial?.monedaId || null);
  const [tipoCambio, setTipoCambio] = useState(
    cotizacionInicial?.tipoCambio || 3.75
  );

  // Estados para exportación
  const [esExportacion, setEsExportacion] = useState(
    cotizacionInicial?.esExportacion !== undefined
      ? cotizacionInicial.esExportacion
      : true
  );
  const [paisDestinoId, setPaisDestinoId] = useState(
    cotizacionInicial?.paisDestinoId || null
  );
  const [incotermsId, setIncotermsId] = useState(
    cotizacionInicial?.incotermsId || null
  );
  const [puertoCargaId, setPuertoCargaId] = useState(
    cotizacionInicial?.puertoCargaId || null
  );
  const [puertoDescargaId, setPuertoDescargaId] = useState(
    cotizacionInicial?.puertoDescargaId || null
  );

  // Estados para logística
  const [agenteAduanasId, setAgenteAduanasId] = useState(
    cotizacionInicial?.agenteAduanasId || null
  );
  const [operadorLogisticoId, setOperadorLogisticoId] = useState(
    cotizacionInicial?.operadorLogisticoId || null
  );
  const [navieraId, setNavieraId] = useState(
    cotizacionInicial?.navieraId || null
  );
  const [tipoContenedorId, setTipoContenedorId] = useState(
    cotizacionInicial?.tipoContenedorId || null
  );
  const [cantidadContenedores, setCantidadContenedores] = useState(
    cotizacionInicial?.cantidadContenedores || null
  );
  const [pesoMaximoContenedor, setPesoMaximoContenedor] = useState(
    cotizacionInicial?.pesoMaximoContenedor || null
  );

  // Estados para impuestos
  const [porcentajeIGV, setPorcentajeIGV] = useState(
    cotizacionInicial?.porcentajeIGV || null
  );
  const [esExoneradoAlIGV, setEsExoneradoAlIGV] = useState(
    cotizacionInicial?.esExoneradoAlIGV !== undefined
      ? cotizacionInicial.esExoneradoAlIGV
      : false
  );

  // Estados para cálculos
  const [metodoCalculoFactor, setMetodoCalculoFactor] = useState(
    cotizacionInicial?.metodoCalculoFactor || "PORCENTUAL"
  );
  const [factorExportacion, setFactorExportacion] = useState(
    cotizacionInicial?.factorExportacion || 1.0
  );
  const [margenUtilidadPorcentaje, setMargenUtilidadPorcentaje] = useState(
    cotizacionInicial?.margenUtilidadPorcentaje || null
  );

  // Estados para adelantos
  const [montoAdelantadoCliente, setMontoAdelantadoCliente] = useState(
    cotizacionInicial?.montoAdelantadoCliente || null
  );
  const [porcentajeAdelanto, setPorcentajeAdelanto] = useState(
    cotizacionInicial?.porcentajeAdelanto || null
  );

  // Estados para aprobación
  const [estadoId, setEstadoId] = useState(cotizacionInicial?.estadoId || null);
  const [motivoRechazo, setMotivoRechazo] = useState(
    cotizacionInicial?.motivoRechazo || null
  );
  const [fechaAprobacion, setFechaAprobacion] = useState(
    cotizacionInicial?.fechaAprobacion
      ? new Date(cotizacionInicial.fechaAprobacion)
      : null
  );
  const [aprobadoPorId, setAprobadoPorId] = useState(
    cotizacionInicial?.aprobadoPorId || null
  );

  // Estados para conversión a prefactura
  const [prefacturaVentaId, setPrefacturaVentaId] = useState(
    cotizacionInicial?.prefacturaVentaId || null
  );
  const [fechaConversionPreFactura, setFechaConversionPreFactura] = useState(
    cotizacionInicial?.fechaConversionPreFactura
      ? new Date(cotizacionInicial.fechaConversionPreFactura)
      : null
  );
  const [usuarioConversionId, setUsuarioConversionId] = useState(
    cotizacionInicial?.usuarioConversionId || null
  );

  // Estados para campos SUNAT
  const [destinoProductoId, setDestinoProductoId] = useState(
    cotizacionInicial?.destinoProductoId || null
  );
  const [formaTransaccionId, setFormaTransaccionId] = useState(
    cotizacionInicial?.formaTransaccionId || null
  );
  const [modoDespachoRecepcionId, setModoDespachoRecepcionId] = useState(
    cotizacionInicial?.modoDespachoRecepcionId || null
  );
  const [tipoEstadoProductoId, setTipoEstadoProductoId] = useState(
    cotizacionInicial?.tipoEstadoProductoId || null
  );

  // Estados para observaciones y URLs
  const [observaciones, setObservaciones] = useState(
    cotizacionInicial?.observaciones || ""
  );
  const [observacionesInternas, setObservacionesInternas] = useState(
    cotizacionInicial?.observacionesInternas || ""
  );
  const [urlCotizacionPdf, setUrlCotizacionPdf] = useState(
    cotizacionInicial?.urlCotizacionPdf || null
  );
  const [urlDocumentacionRequeridaPdf, setUrlDocumentacionRequeridaPdf] =
    useState(cotizacionInicial?.urlDocumentacionRequeridaPdf || null);

  // Estados para sistema
  const [centroCostoId, setCentroCostoId] = useState(
    cotizacionInicial?.centroCostoId || null
  );
  const [creadoPor, setCreadoPor] = useState(
    cotizacionInicial?.creadoPor || null
  );
  const [actualizadoPor, setActualizadoPor] = useState(
    cotizacionInicial?.actualizadoPor || null
  );

  // Estados para catálogos adicionales que no vienen de props
  const [clientes, setClientes] = useState(clientesProp);
  const [seriesDoc, setSeriesDoc] = useState([]);
  const [incoterms, setIncoterms] = useState([]);
  const [puertos, setPuertos] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [paises, setPaises] = useState([]);
  const [formasTransaccion, setFormasTransaccion] = useState([]);
  const [modosDespacho, setModosDespacho] = useState([]);

  // Estados para responsables (se cargan por empresa)
  const [responsablesVentas, setResponsablesVentas] = useState([]);
  const [responsablesEmbarque, setResponsablesEmbarque] = useState([]);
  const [responsablesProduccion, setResponsablesProduccion] = useState([]);
  const [responsablesAlmacen, setResponsablesAlmacen] = useState([]);
  const [responsablesAutorizaVenta, setResponsablesAutorizaVenta] = useState(
    []
  );
  const [responsablesSupervisorCampo, setResponsablesSupervisorCampo] =
    useState([]);

  // Estados para detalles
  const [detalles, setDetalles] = useState([]);
  const [costos, setCostos] = useState([]);
  const [documentos, setDocumentos] = useState([]);

  // useForm eliminado - ahora se usa estados individuales (patrón RequerimientoCompraForm)

  // Handler genérico para cambios de campos (patrón RequerimientoCompraForm)
  const handleChange = (field, value) => {
    const setters = {
      // Datos principales
      empresaId: setEmpresaId,
      clienteId: setClienteId,
      tipoDocumentoId: setTipoDocumentoId,
      serieDocId: setSerieDocId,
      numSerieDoc: setNumSerieDoc,
      numCorreDoc: setNumCorreDoc,
      numeroDocumento: setNumeroDocumento,

      // Fechas
      fechaDocumento: setFechaDocumento,
      fechaVencimiento: setFechaVencimiento,
      fechaEntregaEstimada: setFechaEntregaEstimada,
      fechaZarpeEstimada: setFechaZarpeEstimada,
      fechaArriboEstimada: setFechaArriboEstimada,
      diasTransito: setDiasTransito,

      // Cliente y contactos
      contactoClienteId: setContactoClienteId,
      dirEntregaId: setDirEntregaId,
      dirFiscalId: setDirFiscalId,

      // Responsables
      respVentasId: setRespVentasId,
      autorizaVentaId: setAutorizaVentaId,
      supervisorVentaCampoId: setSupervisorVentaCampoId,
      respEmbarqueId: setRespEmbarqueId,
      respProduccionId: setRespProduccionId,
      respAlmacenId: setRespAlmacenId,

      // Datos comerciales
      tipoProductoId: setTipoProductoId,
      formaPagoId: setFormaPagoId,
      bancoId: setBancoId,
      monedaId: setMonedaId,
      tipoCambio: setTipoCambio,

      // Exportación
      esExportacion: setEsExportacion,
      paisDestinoId: setPaisDestinoId,
      incotermsId: setIncotermsId,
      puertoCargaId: setPuertoCargaId,
      puertoDescargaId: setPuertoDescargaId,

      // Logística
      agenteAduanasId: setAgenteAduanasId,
      operadorLogisticoId: setOperadorLogisticoId,
      navieraId: setNavieraId,
      tipoContenedorId: setTipoContenedorId,
      cantidadContenedores: setCantidadContenedores,
      pesoMaximoContenedor: setPesoMaximoContenedor,

      // Impuestos
      porcentajeIGV: setPorcentajeIGV,
      esExoneradoAlIGV: setEsExoneradoAlIGV,

      // Cálculos
      metodoCalculoFactor: setMetodoCalculoFactor,
      factorExportacion: setFactorExportacion,
      margenUtilidadPorcentaje: setMargenUtilidadPorcentaje,

      // Adelantos
      montoAdelantadoCliente: setMontoAdelantadoCliente,
      porcentajeAdelanto: setPorcentajeAdelanto,

      // Aprobación
      estadoId: setEstadoId,
      motivoRechazo: setMotivoRechazo,
      fechaAprobacion: setFechaAprobacion,
      aprobadoPorId: setAprobadoPorId,

      // Conversión a prefactura
      prefacturaVentaId: setPrefacturaVentaId,
      fechaConversionPreFactura: setFechaConversionPreFactura,
      usuarioConversionId: setUsuarioConversionId,

      // Campos SUNAT
      destinoProductoId: setDestinoProductoId,
      formaTransaccionId: setFormaTransaccionId,
      modoDespachoRecepcionId: setModosDespachoRecepcionId,
      tipoEstadoProductoId: setTipoEstadoProductoId,

      // Observaciones y URLs
      observaciones: setObservaciones,
      observacionesInternas: setObservacionesInternas,
      urlCotizacionPdf: setUrlCotizacionPdf,
      urlDocumentacionRequeridaPdf: setUrlDocumentacionRequeridaPdf,

      // Sistema
      centroCostoId: setCentroCostoId,
      creadoPor: setCreadoPor,
      actualizadoPor: setActualizadoPor,
    };

    const setter = setters[field];
    if (setter) {
      setter(value);
    }
  };

  // Handler especial para cambio de serie de documento (patrón RequerimientoCompraForm)
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
        const numCorre = String(proximoCorrelativo).padStart(
          serie.numCerosIzqCorrelativo,
          "0"
        );

        setSerieDocId(serieId);
        setNumSerieDoc(numSerie);
        setNumCorreDoc(numCorre);

        // Construir número de documento completo
        const numeroDocCompleto = `${numSerie}-${numCorre}`;
        setNumeroDocumento(numeroDocCompleto);
      }
    } else {
      // Limpiar campos si se deselecciona la serie
      setSerieDocId(null);
      setNumSerieDoc("");
      setNumCorreDoc("");
      setNumeroDocumento("");
    }
  };

  // Crear objeto formData temporal para componentes hijos
  const formData = {
    // Datos principales (completos del modelo)
    id: cotizacionInicial?.id,
    codigo: cotizacionInicial?.codigo,
    version: cotizacionInicial?.version || 1,
    cotizacionPadreId: cotizacionInicial?.cotizacionPadreId,

    // Datos del documento (estados individuales)
    empresaId,
    tipoDocumentoId,
    serieDocId,
    numSerieDoc,
    numCorreDoc,
    numeroDocumento,
    fechaDocumento: cotizacionInicial?.fechaDocumento || new Date(),
    fechaVencimiento: cotizacionInicial?.fechaVencimiento || null,

    // Cliente
    clienteId,
    contactoClienteId: cotizacionInicial?.contactoClienteId || null,
    dirEntregaId: cotizacionInicial?.dirEntregaId || null,
    dirFiscalId: cotizacionInicial?.dirFiscalId || null,

    // Responsables
    respVentasId: cotizacionInicial?.respVentasId || null,
    autorizaVentaId: cotizacionInicial?.autorizaVentaId || null,
    supervisorVentaCampoId: cotizacionInicial?.supervisorVentaCampoId || null,
    respEmbarqueId: cotizacionInicial?.respEmbarqueId || null,
    respProduccionId: cotizacionInicial?.respProduccionId || null,
    respAlmacenId: cotizacionInicial?.respAlmacenId || null,

    // Datos comerciales (estados individuales)
    tipoProductoId,
    formaPagoId,
    bancoId: cotizacionInicial?.bancoId || null,
    monedaId: cotizacionInicial?.monedaId || null,
    tipoCambio: cotizacionInicial?.tipoCambio || 3.75,

    // Datos de exportación
    esExportacion:
      cotizacionInicial?.esExportacion !== undefined
        ? cotizacionInicial.esExportacion
        : true,
    paisDestinoId: cotizacionInicial?.paisDestinoId || null,
    incotermsId: cotizacionInicial?.incotermsId || null,
    puertoCargaId: cotizacionInicial?.puertoCargaId || null,
    puertoDescargaId: cotizacionInicial?.puertoDescargaId || null,

    // Logística (campos completos del modelo)
    agenteAduanasId: cotizacionInicial?.agenteAduanasId || null,
    operadorLogisticoId: cotizacionInicial?.operadorLogisticoId || null,
    navieraId: cotizacionInicial?.navieraId || null,
    tipoContenedorId: cotizacionInicial?.tipoContenedorId || null,
    cantidadContenedores: cotizacionInicial?.cantidadContenedores || null,
    pesoMaximoContenedor: cotizacionInicial?.pesoMaximoContenedor || null,

    // Fechas logísticas
    fechaEntregaEstimada: cotizacionInicial?.fechaEntregaEstimada || null,
    fechaZarpeEstimada: cotizacionInicial?.fechaZarpeEstimada || null,
    fechaArriboEstimada: cotizacionInicial?.fechaArriboEstimada || null,
    diasTransito: cotizacionInicial?.diasTransito || null,

    // Impuestos
    porcentajeIGV: cotizacionInicial?.porcentajeIGV || null,
    esExoneradoAlIGV:
      cotizacionInicial?.esExoneradoAlIGV !== undefined
        ? cotizacionInicial.esExoneradoAlIGV
        : false,

    // Cálculo de costos y utilidad
    metodoCalculoFactor: cotizacionInicial?.metodoCalculoFactor || "PORCENTUAL",
    factorExportacion: cotizacionInicial?.factorExportacion || 1.0,
    margenUtilidadPorcentaje:
      cotizacionInicial?.margenUtilidadPorcentaje || null,

    // Adelantos
    montoAdelantadoCliente: cotizacionInicial?.montoAdelantadoCliente || null,
    porcentajeAdelanto: cotizacionInicial?.porcentajeAdelanto || null,

    // Estado y aprobación
    estadoId: cotizacionInicial?.estadoId || null,
    motivoRechazo: cotizacionInicial?.motivoRechazo || null,
    fechaAprobacion: cotizacionInicial?.fechaAprobacion || null,
    aprobadoPorId: cotizacionInicial?.aprobadoPorId || null,

    // Conversión a PreFactura
    prefacturaVentaId: cotizacionInicial?.prefacturaVentaId || null,
    fechaConversionPreFactura:
      cotizacionInicial?.fechaConversionPreFactura || null,
    usuarioConversionId: cotizacionInicial?.usuarioConversionId || null,

    // Campos SUNAT
    destinoProductoId: cotizacionInicial?.destinoProductoId || null,
    formaTransaccionId: cotizacionInicial?.formaTransaccionId || null,
    modoDespachoRecepcionId: cotizacionInicial?.modoDespachoRecepcionId || null,
    tipoEstadoProductoId: cotizacionInicial?.tipoEstadoProductoId || null,

    // Observaciones
    observaciones: cotizacionInicial?.observaciones || "",
    observacionesInternas: cotizacionInicial?.observacionesInternas || "",
    urlCotizacionPdf: cotizacionInicial?.urlCotizacionPdf || null,
    urlDocumentacionRequeridaPdf:
      cotizacionInicial?.urlDocumentacionRequeridaPdf || null,

    // Centro de costo
    centroCostoId: cotizacionInicial?.centroCostoId || null,

    // Auditoría
    fechaCreacion: cotizacionInicial?.fechaCreacion,
    fechaActualizacion: cotizacionInicial?.fechaActualizacion,
    creadoPor: cotizacionInicial?.creadoPor || null,
    actualizadoPor: cotizacionInicial?.actualizadoPor || null,

    // Relaciones completas del backend
    empresa: cotizacionInicial?.empresa,
    cliente: cotizacionInicial?.cliente,
    tipoDocumento: cotizacionInicial?.tipoDocumento,
    moneda: cotizacionInicial?.moneda,
    formaPago: cotizacionInicial?.formaPago,
    incoterms: cotizacionInicial?.incoterms,
    tipoProducto: cotizacionInicial?.tipoProducto,
    tipoEstadoProducto: cotizacionInicial?.tipoEstadoProducto,
    destinoProducto: cotizacionInicial?.destinoProducto,
    formaTransaccion: cotizacionInicial?.formaTransaccion,
    modoDespachoRecepcion: cotizacionInicial?.modoDespachoRecepcion,
  };

  const seriesDocOptions = seriesDoc.map((s) => {
    const correlativoActual = Number(s.correlativo);
    return {
      ...s,
      id: Number(s.id),
      label: `${s.serie} (Correlativo: ${correlativoActual})`,
      value: Number(s.id),
    };
  });

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    if (cotizacionInicial) {
      cargarDatosCotizacion(cotizacionInicial);
    }
  }, [cotizacionInicial]);

  // Cargar clientes cuando cambie la empresa
  useEffect(() => {
    const cargarClientesEmpresa = async () => {
      if (empresaId) {
        try {
          const clientesData = await getClientesPorEmpresa(empresaId);
          setClientes(clientesData);
        } catch (error) {
          console.error("Error al cargar clientes:", error);
        }
      }
    };
    cargarClientesEmpresa();
  }, [empresaId]);

  // Cargar series de documento cuando cambie el tipo de documento
  useEffect(() => {
    const cargarSeriesDocumento = async () => {
      if (empresaId && tipoDocumentoId) {
        try {
          const series = await getSeriesDoc(empresaId, tipoDocumentoId);
          setSeriesDoc(series);
        } catch (error) {
          console.error("Error al cargar series:", error);
          setSeriesDoc([]);
        }
      } else {
        setSeriesDoc([]);
      }
    };
    cargarSeriesDocumento();
  }, [empresaId, tipoDocumentoId]);

  // Cargar responsables de ventas (moduloSistemaId = 5)
  useEffect(() => {
    const cargarResponsablesVentas = async () => {
      if (empresaId) {
        try {
          const responsables = await getParametrosAprobadorPorModulo(
            empresaId,
            5
          );
          setResponsablesVentas(responsables);
          // Asignar automáticamente si solo hay uno
          if (responsables.length === 1 && !cotizacionInicial?.respVentasId) {
            setValue("respVentasId", Number(responsables[0].personalRespId));
          }
        } catch (err) {
          console.error("Error al cargar responsables de ventas:", err);
          setResponsablesVentas([]);
        }
      }
    };
    cargarResponsablesVentas();
  }, [empresaId]);

  // Cargar responsables de embarque (moduloSistemaId = 14)
  useEffect(() => {
    const cargarResponsablesEmbarque = async () => {
      if (empresaId) {
        try {
          const responsables = await getParametrosAprobadorPorModulo(
            empresaId,
            14
          );
          setResponsablesEmbarque(responsables);
          // Asignar automáticamente si solo hay uno
          if (responsables.length === 1 && !cotizacionInicial?.respEmbarqueId) {
            setRespEmbarqueId(Number(responsables[0].personalRespId));
          }
        } catch (err) {
          console.error("Error al cargar responsables de embarque:", err);
          setResponsablesEmbarque([]);
        }
      }
    };
    cargarResponsablesEmbarque();
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
          if (
            responsables.length === 1 &&
            !cotizacionInicial?.respProduccionId
          ) {
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
          if (responsables.length === 1 && !cotizacionInicial?.respAlmacenId) {
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

  const cargarCatalogos = async () => {
    try {
      // Solo cargar catálogos que NO vienen como props
      const [
        incotermsData,
        puertosData,
        bancosData,
        paisesData,
        formasTransData,
        modosDespachoData,
      ] = await Promise.all([
        getIncoterms(),
        getPuertosActivos(),
        getBancos(),
        getPaises(),
        getAllFormaTransaccion(),
        getAllModoDespachoRecepcion(),
      ]);

      setIncoterms(incotermsData);
      setPuertos(puertosData);
      setBancos(bancosData);
      setPaises(paisesData);
      setFormasTransaccion(formasTransData);
      setModosDespacho(modosDespachoData);
    } catch (error) {
      console.error("Error al cargar catálogos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos del formulario",
        life: 3000,
      });
    }
  };

  const cargarDatosCotizacion = async (cot) => {
    try {
      setCotizacion(cot);

      // Cargar clientes de la empresa
      if (cot.empresaId) {
        const clientesData = await getClientesPorEmpresa(cot.empresaId);
        setClientes(clientesData);
      }

      // Cargar detalles si existe ID
      if (cot.id) {
        // Aquí cargarías los detalles desde la API
        // setDetalles(await getDetallesCotizacion(cot.id));
        // setCostos(await getCostosCotizacion(cot.id));
        // setDocumentos(await getDocumentosCotizacion(cot.id));
      }

      // Setear valores en el formulario usando handleChange
      Object.keys(cot).forEach((key) => {
        if (cot[key] !== null && cot[key] !== undefined) {
          handleChange(key, cot[key]);
        }
      });
    } catch (error) {
      console.error("Error al cargar cotización:", error);
    }
  };

  const handleNavigateToCard = (cardName) => {
    setActiveCard(cardName);
  };

  const handleFormSubmit = async () => {
    try {
      setLoading(true);

      // Usar formData actual en lugar de data de useForm
      const payload = {
        ...formData,
        empresaId: Number(formData.empresaId),
        clienteId: Number(formData.clienteId),
        tipoDocumentoId: Number(formData.tipoDocumentoId),
        monedaId: Number(formData.monedaId),
        formaPagoId: Number(formData.formaPagoId),
        tipoProductoId: Number(formData.tipoProductoId),
        respVentasId: Number(formData.respVentasId),
        autorizaVentaId: Number(formData.autorizaVentaId),
        estadoId: Number(formData.estadoId),
        centroCostoId: formData.centroCostoId
          ? Number(formData.centroCostoId)
          : null,
        incotermsId: formData.incotermsId ? Number(formData.incotermsId) : null,
        paisDestinoId: formData.paisDestinoId
          ? Number(formData.paisDestinoId)
          : null,
        bancoId: formData.bancoId ? Number(formData.bancoId) : null,
        puertoCargaId: formData.puertoCargaId
          ? Number(formData.puertoCargaId)
          : null,
        puertoDescargaId: formData.puertoDescargaId
          ? Number(formData.puertoDescargaId)
          : null,
        respEmbarqueId: formData.respEmbarqueId
          ? Number(formData.respEmbarqueId)
          : null,
        respProduccionId: formData.respProduccionId
          ? Number(formData.respProduccionId)
          : null,
        respAlmacenId: formData.respAlmacenId
          ? Number(formData.respAlmacenId)
          : null,
        tipoCambio: Number(formData.tipoCambio),
        factorExportacion: Number(formData.factorExportacion),
        margenUtilidadPorcentaje: formData.margenUtilidadPorcentaje
          ? Number(formData.margenUtilidadPorcentaje)
          : null,
      };

      let resultado;
      if (cotizacion?.id) {
        resultado = await actualizarCotizacionVentas(cotizacion.id, payload);
        toast.current?.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Cotización actualizada correctamente",
          life: 3000,
        });
      } else {
        resultado = await crearCotizacionVentas(payload);
        toast.current?.show({
          severity: "success",
          summary: "Creado",
          detail: "Cotización creada correctamente",
          life: 3000,
        });
        setCotizacion(resultado);
      }

      if (onSave) {
        onSave(resultado);
      }
    } catch (error) {
      console.error("Error al guardar cotización:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message || "Error al guardar la cotización",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHide = () => {
    setActiveCard("datos-generales");
    // Reset no se necesita más con estados individuales
    onHide();
  };

  const dialogFooter = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 8,
        marginTop: 2,
      }}
    >
      <div
        style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}
      >
        <Button
          icon="pi pi-info-circle"
          tooltip="Datos Generales"
          tooltipOptions={{ position: "bottom" }}
          className={
            activeCard === "datos-generales"
              ? "p-button-info"
              : "p-button-outlined"
          }
          onClick={() => handleNavigateToCard("datos-generales")}
          type="button"
          size="small"
        />
        <Button
          icon="pi pi-list"
          tooltip="Detalle Productos"
          tooltipOptions={{ position: "bottom" }}
          className={
            activeCard === "detalle-productos"
              ? "p-button-info"
              : "p-button-outlined"
          }
          onClick={() => handleNavigateToCard("detalle-productos")}
          type="button"
          size="small"
          disabled={!cotizacion?.id}
        />
      </div>

      <div
        style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}
      >
        <Button
          icon="pi pi-dollar"
          tooltip="Costos Exportación"
          tooltipOptions={{ position: "bottom" }}
          className={
            activeCard === "costos-exportacion"
              ? "p-button-info"
              : "p-button-outlined"
          }
          onClick={() => handleNavigateToCard("costos-exportacion")}
          type="button"
          size="small"
          disabled={!cotizacion?.id}
        />
        <Button
          icon="pi pi-file-check"
          tooltip="Documentos Requeridos"
          tooltipOptions={{ position: "bottom" }}
          className={
            activeCard === "documentos-requeridos"
              ? "p-button-info"
              : "p-button-outlined"
          }
          onClick={() => handleNavigateToCard("documentos-requeridos")}
          type="button"
          size="small"
          disabled={!cotizacion?.id}
        />
      </div>

      <div
        style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}
      >
        <Button
          icon="pi pi-money-bill"
          tooltip="Entrega a Rendir"
          tooltipOptions={{ position: "bottom" }}
          className={
            activeCard === "entrega-rendir"
              ? "p-button-info"
              : "p-button-outlined"
          }
          onClick={() => handleNavigateToCard("entrega-rendir")}
          type="button"
          size="small"
          disabled={!cotizacion?.id}
        />
        <Button
          icon="pi pi-file-pdf"
          tooltip="PDF Cotización"
          tooltipOptions={{ position: "bottom" }}
          className={
            activeCard === "pdf-cotizacion"
              ? "p-button-warning"
              : "p-button-outlined"
          }
          onClick={() => handleNavigateToCard("pdf-cotizacion")}
          type="button"
          size="small"
          disabled={!cotizacion?.id}
        />
      </div>

      <div
        style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}
      >
        <Button
          icon="pi pi-file-pdf"
          tooltip="PDF Documentación"
          tooltipOptions={{ position: "bottom" }}
          className={
            activeCard === "pdf-documentacion"
              ? "p-button-warning"
              : "p-button-outlined"
          }
          onClick={() => handleNavigateToCard("pdf-documentacion")}
          type="button"
          size="small"
          disabled={!cotizacion?.id}
        />
      </div>

      <div
        style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}
      >
        <Button
          label="Cancelar"
          icon="pi pi-times"
          onClick={handleHide}
          className="p-button-secondary"
          size="small"
        />
        <Button
          label={cotizacion?.id ? "Actualizar" : "Crear"}
          icon="pi pi-check"
          onClick={handleFormSubmit}
          loading={loading}
          className="p-button-success"
          size="small"
        />
      </div>
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Tag con código de cotización */}
      <div className="flex justify-content-center mb-4">
        <Tag
          value={cotizacion?.codigo || "Nueva Cotización de Venta"}
          severity={cotizacion?.id ? "success" : "info"}
          style={{
            fontSize: "1.1rem",
            padding: "0.75rem 1.25rem",
            textTransform: "uppercase",
            fontWeight: "bold",
            textAlign: "center",
            width: "100%",
            marginTop: "0.5rem",
          }}
        />
      </div>

      {/* Renderizado condicional de cards */}
      <div className="p-fluid">
        {activeCard === "datos-generales" && (
          <DatosGeneralesCotizacionCard
            // formData y handlers (patrón RequerimientoCompraForm)
            formData={formData}
            onChange={handleChange}
            onSerieChange={handleSerieDocChange}
            // Estados individuales
            empresaId={empresaId}
            setEmpresaId={setEmpresaId}
            clienteId={clienteId}
            setClienteId={setClienteId}
            tipoDocumentoId={tipoDocumentoId}
            setTipoDocumentoId={setTipoDocumentoId}
            serieDocId={serieDocId}
            setSerieDocId={setSerieDocId}
            numSerieDoc={numSerieDoc}
            setNumSerieDoc={setNumSerieDoc}
            numCorreDoc={numCorreDoc}
            setNumCorreDoc={setNumCorreDoc}
            numeroDocumento={numeroDocumento}
            setNumeroDocumento={setNumeroDocumento}
            empresaFija={empresaFija}
            // Catálogos
            empresas={empresas}
            clientes={clientes}
            setClientes={setClientes}
            tiposDocumento={tiposDocumento}
            seriesDoc={seriesDoc}
            monedas={monedas}
            formasPago={formasPago}
            incoterms={incoterms}
            tiposProducto={tiposProducto}
            puertos={puertos}
            bancos={bancos}
            paises={paises}
            personal={personalOptions}
            estados={estadosDoc}
            centrosCosto={centrosCosto}
            tiposEstadoProducto={tiposEstadoProducto}
            destinosProducto={destinosProducto}
            formasTransaccion={formasTransaccion}
            modosDespacho={modosDespacho}
            responsablesVentas={responsablesVentas}
            responsablesEmbarque={responsablesEmbarque}
            responsablesProduccion={responsablesProduccion}
            responsablesAlmacen={responsablesAlmacen}
            loading={loading}
          />
        )}

        {activeCard === "detalle-productos" && (
          <DetCotizacionVentasCard
            cotizacionId={cotizacion?.id}
            detalles={detalles}
            setDetalles={setDetalles}
            toast={toast}
          />
        )}

        {activeCard === "costos-exportacion" && (
          <CostosExportacionCard
            cotizacionId={cotizacion?.id}
            costos={costos}
            setCostos={setCostos}
            toast={toast}
          />
        )}

        {activeCard === "documentos-requeridos" && (
          <DocumentosRequeridosCard
            cotizacionId={cotizacion?.id}
            documentos={documentos}
            setDocumentos={setDocumentos}
            toast={toast}
          />
        )}

        {activeCard === "entrega-rendir" && (
          <EntregaARendirCard cotizacionId={cotizacion?.id} toast={toast} />
        )}

        {activeCard === "pdf-cotizacion" && (
          <VerImpresionCotizacionVentasPDF
            cotizacion={cotizacion}
            detalles={detalles}
            costos={costos}
            toast={toast}
          />
        )}

        {activeCard === "pdf-documentacion" && (
          <VerImpresionDocumentacionPDF
            cotizacion={cotizacion}
            documentos={documentos}
            toast={toast}
          />
        )}
      </div>

      {/* Footer con botones */}
      {dialogFooter}
    </>
  );
};

export default CotizacionVentasForm;
