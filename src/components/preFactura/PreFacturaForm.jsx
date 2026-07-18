// src/components/preFactura/PreFacturaForm.jsx
import React, { useState, useEffect } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import DatosGeneralesTab from "./DatosGeneralesTab";
import VerImpresionPreFacturaPDF from "./VerImpresionPreFacturaPDF";
import BotonesGeneracionComprobante from "./BotonesGeneracionComprobante";
import { getMediosPago } from "../../api/medioPago";
import { getAllCuentaCorriente } from "../../api/cuentaCorriente";
import { getEstadosMultiFuncionPorTipoProviene } from "../../api/estadoMultiFuncion";
import { getSeriesDoc } from "../../api/preFactura";
import { obtenerContactosPorEntidad } from "../../api/contactoEntidad";
import { obtenerDireccionesPorEntidad } from "../../api/direccionEntidad";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { consultarTipoCambioSunat } from "../../api/consultaExterna";
import {
  partirPreFactura,
  facturarPreFacturaNegra,
  facturarPreFacturaBlanca,
  generarComprobanteElectronico,
} from "../../api/preFactura";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { SERIES_DOCUMENTO, getDescripcionSerie } from "../../utils/utils";
import AsientoContableManager from "../common/AsientoContableManager";
import { crearDetallePreFactura } from "../../api/detallePreFactura";
import { ESTADO_PREFACTURA } from "../../utils/estados.constants";
import { getPreFacturaPorId } from "../../api/preFactura";
import { confirmDialog } from "primereact/confirmdialog";

export default function PreFacturaForm({
  isEdit,
  defaultValues,
  empresas,
  tiposDocumento,
  clientes: clientesProp,
  tiposProducto,
  formasPago,
  productos,
  personalOptions,
  centrosCosto = [],
  monedas = [],
  unidadesNegocio = [],
  bancos = [],
  incoterms = [],
  paises = [],
  puertos = [],
  tiposContenedor = [],
  agenteAduanas = [],
  periodosContables = [],
  motivosNCND = [],
  empresaFija,
  onSubmit,
  onCancel,
  onAprobar,
  onAnular,
  onReactivar, // ⭐ NUEVO
  onClienteCreado, // ← NUEVO
  onGenerarKardex, // ⭐ AGREGAR ESTA LÍNEA
  loading,
  toast,
  permisos = {},
  readOnly = false,
  onIrAPreFacturaOrigen,
  onIrAMovimientoAlmacen,
  onIrACotizacionVenta,
  onIrAContratoServicio,
}) {
  const { usuario } = useAuthStore();
  // Estado único para todos los campos del formulario (patrón eficiente)
  const [formData, setFormData] = useState({
    id: defaultValues?.id || null,

    // Datos básicos
    empresaId: defaultValues?.empresaId
      ? Number(defaultValues.empresaId)
      : empresaFija
        ? Number(empresaFija)
        : null,
    tipoDocumentoId: defaultValues?.tipoDocumentoId
      ? Number(defaultValues.tipoDocumentoId)
      : 19,
    serieDocId: defaultValues?.serieDocId
      ? Number(defaultValues.serieDocId)
      : null,
    numSerieDoc: defaultValues?.numSerieDoc || "",
    numCorreDoc: defaultValues?.numCorreDoc || "",
    numeroDocumento: defaultValues?.numeroDocumento || "",
    codigo: defaultValues?.codigo || "",

    // Fechas
    fechaDocumento: defaultValues?.fechaDocumento
      ? new Date(defaultValues.fechaDocumento)
      : new Date(),
    fechaVencimiento: defaultValues?.fechaVencimiento
      ? new Date(defaultValues.fechaVencimiento)
      : null,
    fechaAprobacion: defaultValues?.fechaAprobacion
      ? new Date(defaultValues.fechaAprobacion)
      : null,
    fechaFacturacion: defaultValues?.fechaFacturacion
      ? new Date(defaultValues.fechaFacturacion)
      : null,
    fechaContable: defaultValues?.fechaContable
      ? new Date(defaultValues.fechaContable)
      : new Date(),
    periodoContableId: defaultValues?.periodoContableId
      ? Number(defaultValues.periodoContableId)
      : null, // ✅ AGREGADO
    // Cliente y direcciones - CONVERTIDOS A NUMBER PARA DROPDOWNS
    clienteId: defaultValues?.clienteId
      ? Number(defaultValues.clienteId)
      : null,
    contactoClienteId: defaultValues?.contactoClienteId
      ? Number(defaultValues.contactoClienteId)
      : null,
    dirEntregaId: defaultValues?.dirEntregaId
      ? Number(defaultValues.dirEntregaId)
      : null,
    dirFiscalId: defaultValues?.dirFiscalId
      ? Number(defaultValues.dirFiscalId)
      : null,

    // Responsables - CONVERTIDOS A NUMBER PARA DROPDOWNS
    respVentasId: defaultValues?.respVentasId
      ? Number(defaultValues.respVentasId)
      : null,
    autorizaVentaId: defaultValues?.autorizaVentaId
      ? Number(defaultValues.autorizaVentaId)
      : null,
    supervisorVentaCampoId: defaultValues?.supervisorVentaCampoId
      ? Number(defaultValues.supervisorVentaCampoId)
      : null,
    respEmbarqueId: defaultValues?.respEmbarqueId
      ? Number(defaultValues.respEmbarqueId)
      : null,
    respProduccionId: defaultValues?.respProduccionId
      ? Number(defaultValues.respProduccionId)
      : null,
    respAlmacenId: defaultValues?.respAlmacenId
      ? Number(defaultValues.respAlmacenId)
      : null,
    aprobadoPorId: defaultValues?.aprobadoPorId
      ? Number(defaultValues.aprobadoPorId)
      : null,

    // Comerciales - CONVERTIDOS A NUMBER PARA DROPDOWNS
    tipoProductoId: defaultValues?.tipoProductoId
      ? Number(defaultValues.tipoProductoId)
      : null,
    formaPagoId: defaultValues?.formaPagoId
      ? Number(defaultValues.formaPagoId)
      : null,
    bancoId: defaultValues?.bancoId ? Number(defaultValues.bancoId) : null,
    monedaId: defaultValues?.moneda?.id
      ? Number(defaultValues.moneda.id)
      : defaultValues?.monedaId
        ? Number(defaultValues.monedaId)
        : 1,
    tipoCambio: defaultValues?.tipoCambio || 3.75,
    centroCostoId: defaultValues?.centroCostoId
      ? Number(defaultValues.centroCostoId)
      : null,
    unidadNegocioId: defaultValues?.unidadNegocioId
      ? Number(defaultValues.unidadNegocioId)
      : null,
    // Montos
    subtotal: defaultValues?.subtotal || 0,
    totalDescuentos: defaultValues?.totalDescuentos || 0,
    totalIGV: defaultValues?.totalIGV || 0,
    total: defaultValues?.total || 0,
    montoAdelantadoCliente: defaultValues?.montoAdelantadoCliente || 0,
    porcentajeAdelanto: defaultValues?.porcentajeAdelanto || 0,
    pagosPreviosSI: defaultValues?.pagosPreviosSI || 0, // ← AGREGAR ESTA LÍNEA
    // Estado y aprobación - CONVERTIDOS A NUMBER
    estadoId: defaultValues?.estadoId ? Number(defaultValues.estadoId) : 45,
    motivoRechazo: defaultValues?.motivoRechazo || "",

    // Origen - CONVERTIDO A NUMBER
    cotizacionVentaId: defaultValues?.cotizacionVentaId
      ? Number(defaultValues.cotizacionVentaId)
      : null,

    // Exportación (si aplica) - CONVERTIDOS A NUMBER
    incotermId: defaultValues?.incotermId
      ? Number(defaultValues.incotermId)
      : null,
    puertoEmbarqueId: defaultValues?.puertoEmbarqueId
      ? Number(defaultValues.puertoEmbarqueId)
      : null,
    puertoDestinoId: defaultValues?.puertoDestinoId
      ? Number(defaultValues.puertoDestinoId)
      : null,
    paisDestinoId: defaultValues?.paisDestinoId
      ? Number(defaultValues.paisDestinoId)
      : null,
    agenteAduanaId: defaultValues?.agenteAduanaId
      ? Number(defaultValues.agenteAduanaId)
      : null,
    numeroBuque: defaultValues?.numeroBuque || "",
    numeroBL: defaultValues?.numeroBL || "",
    numContenedor: defaultValues?.numContenedor || "",
    tipoContenedorId: defaultValues?.tipoContenedorId
      ? Number(defaultValues.tipoContenedorId)
      : null,

    // Impuestos
    exoneradoIgv: defaultValues?.exoneradoIgv || false,
    porcentajeIgv: defaultValues?.porcentajeIgv || null,
    aplicaImpuestoRenta: defaultValues?.aplicaImpuestoRenta || false,
    porcentajeImpuestoRenta: defaultValues?.porcentajeImpuestoRenta || null,
    montoImpuestoRenta: defaultValues?.montoImpuestoRenta || null,
    // Factores exportación
    factorExportacion: defaultValues?.factorExportacion || null,
    factorExportacionReal: defaultValues?.factorExportacionReal || null,

    // Campos nuevos - Facturación Electrónica
    tipoDocumentoFinalId: defaultValues?.tipoDocumentoFinalId
      ? Number(defaultValues.tipoDocumentoFinalId)
      : null,
    serieDocFinalId: defaultValues?.serieDocFinalId
      ? Number(defaultValues.serieDocFinalId)
      : null,
    numeroDocumentoFinal: defaultValues?.numeroDocumentoFinal || "",
    numSerieDocFinal: defaultValues?.numSerieDocFinal || "",
    numCorreDocFinal: defaultValues?.numCorreDocFinal || "",
    facturado: defaultValues?.facturado || false,

    // Campos nuevos - Tipo de Facturación y Partición
    esGerencial: defaultValues?.esGerencial || false,
    preFacturaOrigenId: defaultValues?.preFacturaOrigenId
      ? Number(defaultValues.preFacturaOrigenId)
      : null,
    esParticionada: defaultValues?.esParticionada || false,

    // Otros
    observaciones: defaultValues?.observaciones || "",
    urlPreFacturaPdf: defaultValues?.urlPreFacturaPdf || "",
    contratoServicioId: defaultValues?.contratoServicioId
      ? Number(defaultValues.contratoServicioId)
      : null,
    movSalidaAlmacenId: defaultValues?.movSalidaAlmacenId
      ? Number(defaultValues.movSalidaAlmacenId)
      : null,

    // Sistema y Auditoría
    creadoPor: defaultValues?.creadoPor
      ? Number(defaultValues.creadoPor)
      : null,
    actualizadoPor: defaultValues?.actualizadoPor
      ? Number(defaultValues.actualizadoPor)
      : null,
    fechaCreacion: defaultValues?.fechaCreacion
      ? new Date(defaultValues.fechaCreacion)
      : null,
    fechaActualizacion: defaultValues?.fechaActualizacion
      ? new Date(defaultValues.fechaActualizacion)
      : null,
    nroLiquidacionFacturacion: defaultValues?.nroLiquidacionFacturacion || "",
    motivoNotaCreditoDebitoId: defaultValues?.motivoNotaCreditoDebitoId
      ? Number(defaultValues.motivoNotaCreditoDebitoId)
      : null,
    fechaDcmtoAfectoNCND: defaultValues?.fechaDcmtoAfectoNCND
      ? new Date(defaultValues.fechaDcmtoAfectoNCND)
      : null,
    dcmtoAfectoNCNDId: defaultValues?.dcmtoAfectoNCNDId
      ? Number(defaultValues.dcmtoAfectoNCNDId)
      : null,
    numeroDcmtoAfectoNCND: defaultValues?.numeroDcmtoAfectoNCND || "",
  });

  // Handler genérico para cambios en cualquier campo
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Actualizar formData cuando cambian los defaultValues (modo edición)
  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      setFormData({
        // ID (CRÍTICO - NO OLVIDAR)
        id: defaultValues?.id || null,
        // Datos básicos
        empresaId: defaultValues?.empresaId
          ? Number(defaultValues.empresaId)
          : empresaFija
            ? Number(empresaFija)
            : null,
        tipoDocumentoId: defaultValues?.tipoDocumentoId
          ? Number(defaultValues.tipoDocumentoId)
          : 19,
        serieDocId: defaultValues?.serieDocId
          ? Number(defaultValues.serieDocId)
          : null,
        numSerieDoc: defaultValues?.numSerieDoc || "",
        numCorreDoc: defaultValues?.numCorreDoc || "",
        numeroDocumento: defaultValues?.numeroDocumento || "",
        codigo: defaultValues?.codigo || "",

        // Fechas
        fechaDocumento: defaultValues?.fechaDocumento
          ? new Date(defaultValues.fechaDocumento)
          : new Date(),
        fechaVencimiento: defaultValues?.fechaVencimiento
          ? new Date(defaultValues.fechaVencimiento)
          : null,
        fechaAprobacion: defaultValues?.fechaAprobacion
          ? new Date(defaultValues.fechaAprobacion)
          : null,
        fechaFacturacion: defaultValues?.fechaFacturacion
          ? new Date(defaultValues.fechaFacturacion)
          : null,
        fechaContable: defaultValues?.fechaContable
          ? new Date(defaultValues.fechaContable)
          : new Date(),
        periodoContableId: defaultValues?.periodoContableId
          ? Number(defaultValues.periodoContableId)
          : null, // ✅ AGREGADO
        // Cliente y direcciones - CONVERTIDOS A NUMBER
        clienteId: defaultValues?.clienteId
          ? Number(defaultValues.clienteId)
          : null,
        contactoClienteId: defaultValues?.contactoClienteId
          ? Number(defaultValues.contactoClienteId)
          : null,
        dirEntregaId: defaultValues?.dirEntregaId
          ? Number(defaultValues.dirEntregaId)
          : null,
        dirFiscalId: defaultValues?.dirFiscalId
          ? Number(defaultValues.dirFiscalId)
          : null,

        // Responsables - CONVERTIDOS A NUMBER
        respVentasId: defaultValues?.respVentasId
          ? Number(defaultValues.respVentasId)
          : null,
        autorizaVentaId: defaultValues?.autorizaVentaId
          ? Number(defaultValues.autorizaVentaId)
          : null,
        supervisorVentaCampoId: defaultValues?.supervisorVentaCampoId
          ? Number(defaultValues.supervisorVentaCampoId)
          : null,
        respEmbarqueId: defaultValues?.respEmbarqueId
          ? Number(defaultValues.respEmbarqueId)
          : null,
        respProduccionId: defaultValues?.respProduccionId
          ? Number(defaultValues.respProduccionId)
          : null,
        respAlmacenId: defaultValues?.respAlmacenId
          ? Number(defaultValues.respAlmacenId)
          : null,
        aprobadoPorId: defaultValues?.aprobadoPorId
          ? Number(defaultValues.aprobadoPorId)
          : null,

        // Comerciales - CONVERTIDOS A NUMBER
        tipoProductoId: defaultValues?.tipoProductoId
          ? Number(defaultValues.tipoProductoId)
          : null,
        formaPagoId: defaultValues?.formaPagoId
          ? Number(defaultValues.formaPagoId)
          : null,
        bancoId: defaultValues?.bancoId ? Number(defaultValues.bancoId) : null,
        monedaId: defaultValues?.moneda?.id
          ? Number(defaultValues.moneda.id)
          : defaultValues?.monedaId
            ? Number(defaultValues.monedaId)
            : 1,
        tipoCambio: defaultValues?.tipoCambio || 3.75,
        centroCostoId: defaultValues?.centroCostoId
          ? Number(defaultValues.centroCostoId)
          : null,
        unidadNegocioId: defaultValues?.unidadNegocioId
          ? Number(defaultValues.unidadNegocioId)
          : null,
        // Montos
        subtotal: defaultValues?.subtotal || 0,
        totalDescuentos: defaultValues?.totalDescuentos || 0,
        totalIGV: defaultValues?.totalIGV || 0,
        total: defaultValues?.total || 0,
        montoAdelantadoCliente: defaultValues?.montoAdelantadoCliente || 0,
        porcentajeAdelanto: defaultValues?.porcentajeAdelanto || 0,
        pagosPreviosSI: defaultValues?.pagosPreviosSI || 0, // ← AGREGAR ESTA LÍNEA
        // Estado y aprobación - CONVERTIDOS A NUMBER
        estadoId: defaultValues?.estadoId ? Number(defaultValues.estadoId) : 45,
        motivoRechazo: defaultValues?.motivoRechazo || "",

        // Origen - CONVERTIDO A NUMBER
        cotizacionVentaId: defaultValues?.cotizacionVentaId
          ? Number(defaultValues.cotizacionVentaId)
          : null,

        // Exportación - CONVERTIDOS A NUMBER
        incotermId: defaultValues?.incotermId
          ? Number(defaultValues.incotermId)
          : null,
        puertoEmbarqueId: defaultValues?.puertoEmbarqueId
          ? Number(defaultValues.puertoEmbarqueId)
          : null,
        puertoDestinoId: defaultValues?.puertoDestinoId
          ? Number(defaultValues.puertoDestinoId)
          : null,
        paisDestinoId: defaultValues?.paisDestinoId
          ? Number(defaultValues.paisDestinoId)
          : null,
        agenteAduanaId: defaultValues?.agenteAduanaId
          ? Number(defaultValues.agenteAduanaId)
          : null,
        numeroBuque: defaultValues?.numeroBuque || "",
        numeroBL: defaultValues?.numeroBL || "",
        numContenedor: defaultValues?.numContenedor || "",
        tipoContenedorId: defaultValues?.tipoContenedorId
          ? Number(defaultValues.tipoContenedorId)
          : null,

        // Impuestos
        exoneradoIgv: defaultValues?.exoneradoIgv || false,
        porcentajeIgv: defaultValues?.porcentajeIgv || null,
        aplicaImpuestoRenta: formData.aplicaImpuestoRenta || false,
        porcentajeImpuestoRenta: formData.porcentajeImpuestoRenta || null,
        montoImpuestoRenta: formData.montoImpuestoRenta || null,
        // Factores exportación
        factorExportacion: defaultValues?.factorExportacion || null,
        factorExportacionReal: defaultValues?.factorExportacionReal || null,

        // Campos nuevos - Facturación Electrónica
        tipoDocumentoFinalId: defaultValues?.tipoDocumentoFinalId
          ? Number(defaultValues.tipoDocumentoFinalId)
          : null,
        serieDocFinalId: defaultValues?.serieDocFinalId
          ? Number(defaultValues.serieDocFinalId)
          : null,
        numeroDocumentoFinal: defaultValues?.numeroDocumentoFinal || "",
        numSerieDocFinal: defaultValues?.numSerieDocFinal || "",
        numCorreDocFinal: defaultValues?.numCorreDocFinal || "",
        facturado: defaultValues?.facturado || false,

        // Campos nuevos - Tipo de Facturación y Partición
        esGerencial: defaultValues?.esGerencial || false,
        preFacturaOrigenId: defaultValues?.preFacturaOrigenId
          ? Number(defaultValues.preFacturaOrigenId)
          : null,
        esParticionada: defaultValues?.esParticionada || false,

        // Otros
        observaciones: defaultValues?.observaciones || "",
        urlPreFacturaPdf: defaultValues?.urlPreFacturaPdf || "",
        contratoServicioId: defaultValues?.contratoServicioId
          ? Number(defaultValues.contratoServicioId)
          : null,
        movSalidaAlmacenId: defaultValues?.movSalidaAlmacenId
          ? Number(defaultValues.movSalidaAlmacenId)
          : null,

        // Sistema y Auditoría
        creadoPor: defaultValues?.creadoPor
          ? Number(defaultValues.creadoPor)
          : null,
        actualizadoPor: defaultValues?.actualizadoPor
          ? Number(defaultValues.actualizadoPor)
          : null,
        fechaCreacion: defaultValues?.fechaCreacion
          ? new Date(defaultValues.fechaCreacion)
          : null,
        fechaActualizacion: defaultValues?.fechaActualizacion
          ? new Date(defaultValues.fechaActualizacion)
          : null,
        nroLiquidacionFacturacion:
          defaultValues?.nroLiquidacionFacturacion || "",
        motivoNotaCreditoDebitoId: defaultValues?.motivoNotaCreditoDebitoId
          ? Number(defaultValues.motivoNotaCreditoDebitoId)
          : null,
        fechaDcmtoAfectoNCND: defaultValues?.fechaDcmtoAfectoNCND
          ? new Date(defaultValues.fechaDcmtoAfectoNCND)
          : null,
        dcmtoAfectoNCNDId: defaultValues?.dcmtoAfectoNCNDId
          ? Number(defaultValues.dcmtoAfectoNCNDId)
          : null,
        numeroDcmtoAfectoNCND: defaultValues?.numeroDcmtoAfectoNCND || "",
      });
    }
  }, [defaultValues, empresaFija]);

  // Estados auxiliares
  const [clientes, setClientes] = useState(clientesProp);
  const [seriesDoc, setSeriesDoc] = useState([]);
  const [personalFiltrado, setPersonalFiltrado] = useState([]);
  const [contactosCliente, setContactosCliente] = useState([]);
  const [direccionesCliente, setDireccionesCliente] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [detallesCount, setDetallesCount] = useState(0);
  const [refreshClientes, setRefreshClientes] = useState(null);
  const [totales, setTotales] = useState({
    subtotal: 0,
    igv: 0,
    impuestoRenta: 0,
    total: 0,
    aplicaDetraccion: false,
    montoDetraccion: 0,
    porcentajeDetraccion: 0,
    aplicaRetencion: false,
    montoRetencion: 0,
    porcentajeRetencion: 0,
    aplicaPercepcion: false,
    montoPercepcion: 0,
    porcentajePercepcion: 0,
  });
  const [estadosPreFactura, setEstadosPreFactura] = useState([]);
  const [fechaDocumentoInicial, setFechaDocumentoInicial] = useState(null);
  const [mediosPago, setMediosPago] = useState([]);
  const [cuentasCorrientes, setCuentasCorrientes] = useState([]);
  const [estadosCxC, setEstadosCxC] = useState([]);

  // Extraer valores individuales para compatibilidad
  const {
    empresaId,
    tipoDocumentoId,
    serieDocId,
    numSerieDoc,
    numCorreDoc,
    numeroDocumento,
    fechaDocumento,
    fechaVencimiento,
    clienteId,
    estadoId,
    formaPagoId,
    monedaId,
    tipoCambio,
    centroCostoId,
    porcentajeIgv,
    exoneradoIgv,
    aplicaImpuestoRenta,
    porcentajeImpuestoRenta,
    respVentasId,
    autorizaVentaId,
    supervisorVentaCampoId,
    creadoPor,
    actualizadoPor,
  } = formData;

  // Filtrar clientes por empresaId
  useEffect(() => {
    if (clientesProp && clientesProp.length > 0 && empresaId) {
      const clientesPorEmpresa = clientesProp.filter(
        (c) => Number(c.empresaId) === Number(empresaId),
      );
      setClientes(clientesPorEmpresa);
    } else {
      setClientes([]);
    }
  }, [clientesProp, empresaId]);

  // Filtrar personal por empresaId (para todos los responsables excepto Resp. Ventas)
  useEffect(() => {
    if (personalOptions && personalOptions.length > 0 && empresaId) {
      const personalPorEmpresa = personalOptions.filter(
        (p) => Number(p.empresaId) === Number(empresaId),
      );
      setPersonalFiltrado(personalPorEmpresa);
    } else {
      setPersonalFiltrado([]);
    }
  }, [personalOptions, empresaId]);

  // Cargar contactos y direcciones del cliente cuando cambie clienteId
  useEffect(() => {
    const cargarContactosYDirecciones = async () => {
      if (clienteId) {
        try {
          // Cargar contactos del cliente
          const contactos = await obtenerContactosPorEntidad(clienteId);
          setContactosCliente(contactos || []);

          // Cargar direcciones del cliente
          const direcciones = await obtenerDireccionesPorEntidad(clienteId);
          setDireccionesCliente(direcciones || []);
        } catch (err) {
          console.error(
            "Error al cargar contactos/direcciones del cliente:",
            err,
          );
          setContactosCliente([]);
          setDireccionesCliente([]);
        }
      } else {
        setContactosCliente([]);
        setDireccionesCliente([]);
      }
    };

    cargarContactosYDirecciones();
  }, [clienteId]);

  // Inicializar porcentajeIgv desde la empresa cuando cambie empresaId (solo en creación)
  useEffect(() => {
    if (empresaId && empresas && empresas.length > 0 && !isEdit) {
      const empresaSeleccionada = empresas.find(
        (e) => Number(e.id) === Number(empresaId),
      );
      if (
        empresaSeleccionada &&
        empresaSeleccionada.porcentajeIgv !== undefined
      ) {
        handleChange("porcentajeIgv", empresaSeleccionada.porcentajeIgv);
      }
    }
  }, [empresaId, empresas, isEdit]);

  // Actualizar porcentajeIgv cuando cambie exoneradoIgv
  useEffect(() => {
    if (empresaId && empresas && empresas.length > 0) {
      const empresaSeleccionada = empresas.find(
        (e) => Number(e.id) === Number(empresaId),
      );

      if (exoneradoIgv) {
        handleChange("porcentajeIgv", 0);
      } else {
        if (
          empresaSeleccionada &&
          empresaSeleccionada.porcentajeIgv !== undefined
        ) {
          handleChange("porcentajeIgv", empresaSeleccionada.porcentajeIgv);
        }
      }
    }
  }, [exoneradoIgv, empresaId, empresas]);


  // Inicializar porcentajeImpuestoRenta desde empresa cuando cambie empresaId (solo en creación)
  useEffect(() => {
    if (empresaId && empresas && empresas.length > 0 && !isEdit) {
      const empresaSeleccionada = empresas.find(
        (e) => Number(e.id) === Number(empresaId),
      );
      if (
        empresaSeleccionada &&
        empresaSeleccionada.porcentajeImpuestoRenta !== undefined
      ) {
        handleChange("porcentajeImpuestoRenta", empresaSeleccionada.porcentajeImpuestoRenta);
      }
    }
  }, [empresaId, empresas, isEdit]);

  // Actualizar porcentajeImpuestoRenta cuando cambie aplicaImpuestoRenta
  useEffect(() => {
    if (empresaId && empresas && empresas.length > 0) {
      const empresaSeleccionada = empresas.find(
        (e) => Number(e.id) === Number(empresaId),
      );

      if (aplicaImpuestoRenta) {
        if (
          empresaSeleccionada &&
          empresaSeleccionada.porcentajeImpuestoRenta !== undefined
        ) {
          handleChange("porcentajeImpuestoRenta", empresaSeleccionada.porcentajeImpuestoRenta);
        }
      } else {
        handleChange("porcentajeImpuestoRenta", 0);
        handleChange("montoImpuestoRenta", 0);
      }
    }
  }, [aplicaImpuestoRenta, empresaId, empresas]);

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
          const series = await getSeriesDoc(empresaId, tipoDocumentoId);
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

  // Cargar estados de pre-factura (tipoProvieneDeId = 14)
  useEffect(() => {
    const cargarEstados = async () => {
      try {
        const estados = await getEstadosMultiFuncionPorTipoProviene(14);
        setEstadosPreFactura(estados);
      } catch (err) {
        console.error("Error al cargar estados de pre-factura:", err);
        setEstadosPreFactura([]);
      }
    };
    cargarEstados();
  }, []);

  // Cargar catálogos para CxC (Medios de Pago, Estados CxC, Cuentas Corrientes)
  useEffect(() => {
    const cargarCatalogosCxC = async () => {
      try {
        // Cargar medios de pago
        const mediosPagoData = await getMediosPago();
        setMediosPago(mediosPagoData);

        // Cargar estados de CxC (tipoProvieneDeId = 24)
        const estadosCxCData = await getEstadosMultiFuncionPorTipoProviene(24);
        setEstadosCxC(estadosCxCData);

        // Cuentas corrientes
        const CuentasCorrientesData = await getAllCuentaCorriente();
        setCuentasCorrientes(CuentasCorrientesData);
      } catch (err) {
        console.error("Error al cargar catálogos de CxC:", err);
        setMediosPago([]);
        setEstadosCxC([]);
        setCuentasCorrientes([]);
      }
    };
    cargarCatalogosCxC();
  }, []);

  // Guardar fecha inicial para evitar carga automática en mount
  useEffect(() => {
    if (fechaDocumento && fechaDocumentoInicial === null) {
      setFechaDocumentoInicial(fechaDocumento);
    }
  }, [fechaDocumento, fechaDocumentoInicial]);

  // Cargar tipo de cambio SUNAT solo cuando el usuario modifica manualmente fechaDocumento
  useEffect(() => {
    const cargarTipoCambio = async () => {
      // No ejecutar si no hay fecha o si es la carga inicial
      if (!fechaDocumento || fechaDocumentoInicial === null) return;

      // Comparar fechas por valor (ISO string) en lugar de por referencia
      const fechaActualISO = new Date(fechaDocumento).toISOString();
      const fechaInicialISO = new Date(fechaDocumentoInicial).toISOString();

      // No ejecutar si la fecha no ha cambiado realmente
      if (fechaActualISO === fechaInicialISO) return;

      try {
        // Convertir fecha a formato YYYY-MM-DD
        const fecha = new Date(fechaDocumento);
        const fechaISO = fecha.toISOString().split("T")[0];

        // Consultar tipo de cambio SUNAT
        const tipoCambioData = await consultarTipoCambioSunat({
          date: fechaISO,
        });

        // Para VENTAS usamos buy_price (precio de compra del dólar)
        if (tipoCambioData && tipoCambioData.buy_price) {
          const tipoCambioCompra = parseFloat(tipoCambioData.buy_price);
          handleChange("tipoCambio", tipoCambioCompra.toFixed(3));

          // Actualizar fecha inicial para permitir consultas futuras a esta misma fecha
          setFechaDocumentoInicial(fechaDocumento);

          toast?.current?.show({
            severity: "success",
            summary: "Tipo de Cambio Actualizado",
            detail: `Tipo de cambio SUNAT: S/ ${tipoCambioCompra.toFixed(3)} por USD`,
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
  }, [fechaDocumento, fechaDocumentoInicial]);

  // Handler para cambio de serie
  const handleSerieDocChange = (serieId) => {
    if (serieId) {
      const serie = seriesDoc.find((s) => Number(s.id) === Number(serieId));
      if (serie) {
        const correlativoActual = Number(serie.correlativo);
        const proximoCorrelativo = correlativoActual + 1;
        const numSerie = String(serie.serie).padStart(
          serie.numCerosIzqSerie,
          "0",
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

  const handleCambiarTipoSerie = (datos) => {
    handleChange('tipoDocumentoId', datos.tipoDocumentoId);
    handleChange('serieDocId', datos.serieDocId);
    handleChange('numSerieDoc', datos.numSerieDoc);
    handleChange('numCorreDoc', datos.numCorreDoc);
    handleChange('numeroDocumento', datos.numeroDocumento);

    toast.current?.show({
      severity: 'success',
      summary: 'Tipo y Serie Actualizados',
      detail: `Nuevo número: ${datos.numeroDocumento}`,
      life: 3000
    });
  };

  useEffect(() => {
    const obtenerTotalesDelBackend = async () => {
      if (!defaultValues?.id || !isEdit) {
        setTotales({
          subtotal: 0,
          igv: 0,
          impuestoRenta: 0,
          total: 0,
          aplicaDetraccion: false,
          montoDetraccion: 0,
          porcentajeDetraccion: 0,
          aplicaRetencion: false,
          montoRetencion: 0,
          porcentajeRetencion: 0,
          aplicaPercepcion: false,
          montoPercepcion: 0,
          porcentajePercepcion: 0,
        });
        return;
      }

      try {
        const preFacturaActualizada = await getPreFacturaPorId(defaultValues.id);

        setTotales({
          subtotal: Number(preFacturaActualizada.subtotal || 0),
          igv: Number(preFacturaActualizada.totalIGV || 0),
          impuestoRenta: Number(preFacturaActualizada.montoImpuestoRenta || 0),
          total: Number(preFacturaActualizada.total || 0),
          aplicaDetraccion: preFacturaActualizada.aplicaDetraccion || false,
          montoDetraccion: Number(preFacturaActualizada.montoDetraccion || 0),
          porcentajeDetraccion: Number(preFacturaActualizada.porcentajeDetraccion || 0),
          aplicaRetencion: preFacturaActualizada.aplicaRetencion || false,
          montoRetencion: Number(preFacturaActualizada.montoRetencion || 0),
          porcentajeRetencion: Number(preFacturaActualizada.porcentajeRetencion || 0),
          aplicaPercepcion: preFacturaActualizada.aplicaPercepcion || false,
          montoPercepcion: Number(preFacturaActualizada.montoPercepcion || 0),
          porcentajePercepcion: Number(preFacturaActualizada.porcentajePercepcion || 0),
        });
      } catch (err) {
        console.error("Error al obtener totales:", err);
        setTotales({
          subtotal: 0,
          igv: 0,
          impuestoRenta: 0,
          total: 0,
          aplicaDetraccion: false,
          montoDetraccion: 0,
          porcentajeDetraccion: 0,
          aplicaRetencion: false,
          montoRetencion: 0,
          porcentajeRetencion: 0,
          aplicaPercepcion: false,
          montoPercepcion: 0,
          porcentajePercepcion: 0,
        });
      }
    };
    obtenerTotalesDelBackend();
  }, [detallesCount, isEdit, defaultValues?.id]);



  // ⭐ CALLBACK para AsientoContableManager
  const handleBeforeGenerateAsiento = async () => {
    // Los totales ya están calculados en el backend, solo verificar
    const preFacturaActualizada = await getPreFacturaPorId(defaultValues.id);
    if (Number(preFacturaActualizada.total) === 0) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Los totales están en cero. Verifique los detalles de la PreFactura.",
        life: 5000,
      });
      return false; // Detener generación
    }
    return true; // Continuar generación
  };

  const handleClienteCreado = async (cliente) => {
    try {
      // ✅ PRIMERO: Recargar clientes desde el padre (si existe callback)
      if (onClienteCreado && typeof onClienteCreado === "function") {
        await onClienteCreado(cliente);
      }

      // ✅ SEGUNDO: Forzar recarga del selector con timestamp
      setRefreshClientes(Date.now());

      // ✅ TERCERO: Esperar un momento para que se actualice el selector
      await new Promise((resolve) => setTimeout(resolve, 300));

      // ✅ CUARTO: Auto-seleccionar el nuevo cliente
      if (cliente && cliente.id) {
        const clienteIdNumber = Number(cliente.id);
        handleChange("clienteId", clienteIdNumber);

        // Mostrar mensaje de éxito
        if (toast && toast.current) {
          toast.current.show({
            severity: "success",
            summary: "Cliente Creado",
            detail: `Cliente "${cliente.razonSocial || cliente.nombreComercial}" creado y seleccionado correctamente`,
            life: 4000,
          });
        }
      }
    } catch (error) {
      console.error("Error al manejar cliente creado:", error);
      if (toast && toast.current) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Error al seleccionar el cliente creado",
          life: 3000,
        });
      }
    }
  };

  const handleGenerarKardexClick = () => {
    if (!defaultValues.id) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la pre-factura antes de generar el kardex",
      });
      return;
    }

    if (!defaultValues.detalles || defaultValues.detalles.length === 0) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "La pre-factura debe tener al menos un detalle para generar el kardex",
      });
      return;
    }

    onGenerarKardex(defaultValues.id);
  };


  // Calcular automáticamente porcentajeAdelanto cuando cambia montoAdelantadoCliente
  useEffect(() => {
    if (formData.montoAdelantadoCliente && totales.total > 0) {
      const porcentaje =
        (Number(formData.montoAdelantadoCliente) / totales.total) * 100;
      setFormData((prev) => ({
        ...prev,
        porcentajeAdelanto: Number(porcentaje.toFixed(2)),
      }));
    } else if (!formData.montoAdelantadoCliente) {
      setFormData((prev) => ({ ...prev, porcentajeAdelanto: 0 }));
    }
  }, [formData.montoAdelantadoCliente, totales.total]);

  // Calcular automáticamente montoAdelantadoCliente cuando cambia porcentajeAdelanto
  useEffect(() => {
    if (formData.porcentajeAdelanto && totales.total > 0) {
      const monto = (totales.total * Number(formData.porcentajeAdelanto)) / 100;
      setFormData((prev) => ({
        ...prev,
        montoAdelantadoCliente: Number(monto.toFixed(2)),
      }));
    } else if (!formData.porcentajeAdelanto) {
      setFormData((prev) => ({ ...prev, montoAdelantadoCliente: 0 }));
    }
  }, [formData.porcentajeAdelanto, totales.total]);

  // Función para cargar items del documento afecto
  const handleCargarItemsDocumentoAfecto = async (detalleItems) => {
    if (!defaultValues?.id) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la NC/ND antes de cargar items del documento afecto",
        life: 5000,
      });
      return;
    }

    if (!detalleItems || detalleItems.length === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Sin Items",
        detail: "El documento seleccionado no tiene items para copiar",
        life: 3000,
      });
      return;
    }

    try {
      let itemsCargados = 0;

      // Crear cada item del documento afecto en la NC/ND
      for (const item of detalleItems) {
        // Extraer valores de almacén (obligatorios)
        const cantidad = Number(item.cantidad) || 0;
        const precioUnitario = Number(item.precioUnitario) || 0;

        // Extraer valores comerciales (opcionales)
        const cantidadVenta = item.cantidadVenta ? Number(item.cantidadVenta) : null;
        const precioUnitarioVenta = item.precioUnitarioVenta ? Number(item.precioUnitarioVenta) : null;

        const nuevoDetalle = {
          preFacturaId: defaultValues.id,
          productoId: Number(item.productoId),
          cantidad: cantidad,
          precioUnitario: precioUnitario,
          cantidadVenta: cantidadVenta,
          precioUnitarioVenta: precioUnitarioVenta,
        };
        await crearDetallePreFactura(nuevoDetalle);
        itemsCargados++;
      }

      toast.current?.show({
        severity: "success",
        summary: "Items Cargados",
        detail: `Se cargaron ${itemsCargados} items del documento afecto correctamente`,
        life: 3000,
      });

      // Refrescar el conteo de detalles
      setDetallesCount(itemsCargados);
    } catch (error) {
      console.error("Error al cargar items:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "No se pudieron cargar los items del documento afecto",
        life: 5000,
      });
    }
  };

  const handleSubmit = () => {
    const data = {
      empresaId: formData.empresaId ? Number(formData.empresaId) : null,
      tipoDocumentoId: formData.tipoDocumentoId
        ? Number(formData.tipoDocumentoId)
        : null,
      serieDocId: formData.serieDocId ? Number(formData.serieDocId) : null,
      numSerieDoc: formData.numSerieDoc,
      numCorreDoc: formData.numCorreDoc,
      numeroDocumento: formData.numeroDocumento,
      fechaDocumento: formData.fechaDocumento,
      fechaVencimiento: formData.fechaVencimiento,
      fechaContable: formData.fechaContable,
      periodoContableId: formData.periodoContableId
        ? Number(formData.periodoContableId)
        : null, // ✅ AGREGADO
      clienteId: formData.clienteId ? Number(formData.clienteId) : null,
      contactoClienteId: formData.contactoClienteId
        ? Number(formData.contactoClienteId)
        : null,
      dirEntregaId: formData.dirEntregaId
        ? Number(formData.dirEntregaId)
        : null,
      dirFiscalId: formData.dirFiscalId ? Number(formData.dirFiscalId) : null,
      respVentasId: formData.respVentasId
        ? Number(formData.respVentasId)
        : null,
      autorizaVentaId: formData.autorizaVentaId
        ? Number(formData.autorizaVentaId)
        : null,
      supervisorVentaCampoId: formData.supervisorVentaCampoId
        ? Number(formData.supervisorVentaCampoId)
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
      tipoProductoId: formData.tipoProductoId
        ? Number(formData.tipoProductoId)
        : null,
      formaPagoId: formData.formaPagoId ? Number(formData.formaPagoId) : null,
      bancoId: formData.bancoId ? Number(formData.bancoId) : null,
      monedaId: formData.monedaId ? Number(formData.monedaId) : null,
      tipoCambio: formData.tipoCambio,
      subtotal: totales.subtotal,
      totalIGV: totales.igv,
      total: totales.total,
      estadoId: formData.estadoId ? Number(formData.estadoId) : null,
      preFacturaOrigenId: formData.preFacturaOrigenId
        ? Number(formData.preFacturaOrigenId)
        : null,
      cotizacionVentaId: formData.cotizacionVentaId
        ? Number(formData.cotizacionVentaId)
        : null,
      incotermId: formData.incotermId ? Number(formData.incotermId) : null,
      puertoEmbarqueId: formData.puertoEmbarqueId
        ? Number(formData.puertoEmbarqueId)
        : null,
      puertoDestinoId: formData.puertoDestinoId
        ? Number(formData.puertoDestinoId)
        : null,
      paisDestinoId: formData.paisDestinoId
        ? Number(formData.paisDestinoId)
        : null,
      agenteAduanaId: formData.agenteAduanaId
        ? Number(formData.agenteAduanaId)
        : null,
      numeroBuque: formData.numeroBuque,
      numeroBL: formData.numeroBL,
      numContenedor: formData.numContenedor,
      tipoContenedorId: formData.tipoContenedorId
        ? Number(formData.tipoContenedorId)
        : null,
      exoneradoIgv: formData.exoneradoIgv,
      porcentajeIgv: formData.porcentajeIgv,
      aplicaImpuestoRenta: formData.aplicaImpuestoRenta || false,
      porcentajeImpuestoRenta: formData.porcentajeImpuestoRenta || null,
      montoImpuestoRenta: formData.montoImpuestoRenta || null,
      factorExportacion: formData.factorExportacion,
      factorExportacionReal: formData.factorExportacionReal,
      observaciones: formData.observaciones,
      centroCostoId: formData.centroCostoId
        ? Number(formData.centroCostoId)
        : null,
      unidadNegocioId: formData.unidadNegocioId
        ? Number(formData.unidadNegocioId)
        : null,
      contratoServicioId: formData.contratoServicioId
        ? Number(formData.contratoServicioId)
        : null,
      movSalidaAlmacenId: formData.movSalidaAlmacenId
        ? Number(formData.movSalidaAlmacenId)
        : null,
      esGerencial: formData.esGerencial || false,
      // ════════════════════════════════════════════════════════════
      // AUDITORÍA - TRAZABILIDAD COMPLETA
      // En CREACIÓN: creadoPor y actualizadoPor = usuario actual
      // En EDICIÓN: creadoPor se mantiene, actualizadoPor = usuario actual
      // Las fechas las asigna automáticamente el backend con @default(now()) y @updatedAt
      // ════════════════════════════════════════════════════════════
      creadoPor: !isEdit && usuario?.personalId
        ? Number(usuario.personalId)  // CREACIÓN: asignar usuario actual
        : (formData.creadoPor ? Number(formData.creadoPor) : null), // EDICIÓN: mantener original

      actualizadoPor: usuario?.personalId
        ? Number(usuario.personalId)  // SIEMPRE asignar usuario actual (creación Y edición)
        : null,
      nroLiquidacionFacturacion:
        formData.nroLiquidacionFacturacion?.trim() || null,
      montoAdelantadoCliente: formData.montoAdelantadoCliente
        ? Number(formData.montoAdelantadoCliente)
        : null,
      porcentajeAdelanto: formData.porcentajeAdelanto
        ? Number(formData.porcentajeAdelanto)
        : null,
      pagosPreviosSI: formData.pagosPreviosSI
        ? Number(formData.pagosPreviosSI)
        : null,
      // ════════════════════════════════════════════════════════════
      // CAMPOS PARA NOTA DE CRÉDITO / DÉBITO
      // ════════════════════════════════════════════════════════════
      motivoNotaCreditoDebitoId: formData.motivoNotaCreditoDebitoId
        ? Number(formData.motivoNotaCreditoDebitoId)
        : null,
      fechaDcmtoAfectoNCND: formData.fechaDcmtoAfectoNCND || null,
      dcmtoAfectoNCNDId: formData.dcmtoAfectoNCNDId
        ? Number(formData.dcmtoAfectoNCNDId)
        : null,
      numeroDcmtoAfectoNCND: formData.numeroDcmtoAfectoNCND?.trim() || null,
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

    if (!data.clienteId) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar un cliente",
      });
      return;
    }
    if (!data.respVentasId) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar un responsable de ventas",
      });
      return;
    }

    if (!data.tipoProductoId) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar un tipo de producto",
      });
      return;
    }
    if (!data.formaPagoId) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar una forma de pago",
      });
      return;
    }

    if (!data.monedaId) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar una moneda",
      });
      return;
    }

    // ✅ VALIDACIÓN: Motivo obligatorio para NC (ID=8) y ND (ID=9)
    const esNotaCreditoDebito =
      Number(data.tipoDocumentoId) === 8 || Number(data.tipoDocumentoId) === 9;

    if (esNotaCreditoDebito && !formData.motivoNotaCreditoDebitoId) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar un motivo para Nota de Crédito/Débito",
      });
      return;
    }

    // Calcular totales antes de enviar
    const igvCalc = data.exoneradoIgv
      ? 0
      : (data.subtotal || 0) * (Number(data.porcentajeIgv || 0) / 100);

    const impuestoRentaCalc = data.aplicaImpuestoRenta
      ? (data.subtotal || 0) * (Number(data.porcentajeImpuestoRenta || 0) / 100)
      : 0;

    const totalCalc = (data.subtotal || 0) + igvCalc - impuestoRentaCalc;

    data.totalIGV = igvCalc;
    data.montoImpuestoRenta = impuestoRentaCalc;
    data.total = totalCalc;

    onSubmit(data);
  };

  const handleAprobarClick = () => {
    if (!defaultValues?.id) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe guardar la pre-factura antes de aprobar",
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
        detail: "Solo se puede anular una pre-factura pendiente o aprobada",
      });
      return;
    }

    onAnular(defaultValues.id);
  };

  const handleReactivarClick = () => {
    // Validación de permisos
    if (!permisos.puedeEditar && !tienePermisoEspecial) {
      toast.current.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para reactivar documentos.",
        life: 3000,
      });
      return;
    }

    onReactivar(defaultValues.id);
  };


  // Handler para particionar PreFactura (Clona en 2 copias idénticas)
  const [showPartirDialog, setShowPartirDialog] = useState(false);

  const handlePartirClick = () => {
    setShowPartirDialog(true);
  };

  const handlePartirPreFactura = async () => {
    try {
      const resultado = await partirPreFactura(defaultValues.id);

      toast?.current?.show({
        severity: "success",
        summary: "Éxito",
        detail:
          resultado.mensaje ||
          "PreFactura particionada exitosamente en 2 copias idénticas",
        life: 5000,
      });

      setShowPartirDialog(false);

      // Cerrar el diálogo del formulario para que se recargue la lista
      if (onCancel) {
        onCancel();
      }
    } catch (error) {
      console.error("Error al particionar PreFactura:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.mensaje ||
          "No se pudo particionar la PreFactura",
        life: 3000,
      });
    }
  };

  // Handler para facturar negra (Caso 1: 100% Negro)
  const handleFacturarNegraClick = async () => {
    try {
      const resultado = await facturarPreFacturaNegra(defaultValues.id);

      toast?.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "CxC Gerencial generada exitosamente",
        life: 5000,
      });

      // ✅ CERRAR VENTANA Y VOLVER A LA LISTA
      if (onCancel) {
        onCancel(); // Cierra el diálogo y refresca la lista
      }
    } catch (error) {
      console.error("Error al facturar Gerencial:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.mensaje || "No se pudo generar la CxC Gerencial",
        life: 3000,
      });
    }
  };

  // Handler para facturar blanca (Caso 2: Comprobante SUNAT)
  const handleFacturarBlancaClick = async () => {
    try {
      // ⭐ RECALCULAR Y GUARDAR TOTALES ANTES DE EMITIR
      const resultado = await facturarPreFacturaBlanca(defaultValues.id);

      toast?.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "CxC Fiscal generada exitosamente. Genere el Comprobante Electrónico desde el TAB Facturación",
        life: 5000,
      });

      // ✅ CERRAR VENTANA Y VOLVER A LA LISTA
      if (onCancel) {
        onCancel(); // Cierra el diálogo y refresca la lista
      }
    } catch (error) {
      console.error("Error al facturar blanca:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.mensaje || "No se pudo emitir el comprobante",
        life: 3000,
      });
    }
  };


  // Handler para generar comprobante electrónico
  const handleGenerarComprobanteClick = async () => {
    try {
      const resultado = await generarComprobanteElectronico(defaultValues.id);

      toast?.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Comprobante Electrónico generado exitosamente",
        life: 5000,
      });

      // ✅ RECARGAR DATOS DEL FORMULARIO
      if (defaultValues.id) {
        const preFacturaActualizada = await getPreFacturaPorId(defaultValues.id);
        setFormData(preFacturaActualizada);
      }
    } catch (error) {
      console.error("Error al generar comprobante:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.mensaje || "No se pudo generar el Comprobante Electrónico",
        life: 3000,
      });
    }
  };

  // Estados del documento
  const estaPendiente = estadoId === ESTADO_PREFACTURA.PENDIENTE || !estadoId;
  const estaAprobada = estadoId === ESTADO_PREFACTURA.APROBADA;
  const estaAnulada = estadoId === ESTADO_PREFACTURA.ANULADA;
  const estaParticionada = estadoId === ESTADO_PREFACTURA.PARTICIONADA;
  const estaFacturada = estadoId === ESTADO_PREFACTURA.FACTURADA;
  const estaEmitida = estadoId === ESTADO_PREFACTURA.EMITIDA;
  const estaComprobanteGenerado = estadoId === ESTADO_PREFACTURA.COMPROBANTE_ELECTRONICO_GENERADO;
  const estaValidadoSunat = estadoId === ESTADO_PREFACTURA.VALIDADO_SUNAT;
  const estaNoValidadoSunat = estadoId === ESTADO_PREFACTURA.NO_VALIDADO_SUNAT;
  const kardexGenerado = Boolean(defaultValues?.movSalidaAlmacenId);

  // ⭐ PERMISOS ESPECIALES: Usuario con puedeAprobarDocs tiene acceso total
  const tienePermisoEspecial = permisos.puedeAprobarDocs === true;

  // Estados válidos para generar kardex (todos excepto PENDIENTE y ANULADA)
  const puedeGenerarKardex = tienePermisoEspecial
    ? !estaAnulada
    : [
      ESTADO_PREFACTURA.APROBADA,
      ESTADO_PREFACTURA.PARTICIONADA,
      ESTADO_PREFACTURA.FACTURADA,
      ESTADO_PREFACTURA.EMITIDA,
      ESTADO_PREFACTURA.COMPROBANTE_ELECTRONICO_GENERADO,
      ESTADO_PREFACTURA.VALIDADO_SUNAT,
      ESTADO_PREFACTURA.NO_VALIDADO_SUNAT,
    ].includes(estadoId);

  const puedeEditar = tienePermisoEspecial
    ? !estaAnulada && !loading
    : estaPendiente && !loading;

  const puedeAnular = tienePermisoEspecial
    ? !estaAnulada && !loading
    : (estaPendiente || estaAprobada) && !loading;
  // Preparar options para dropdowns
  const empresasOptions = empresas.map((e) => ({
    ...e,
    id: Number(e.id),
    label: e.razonSocial,
    value: Number(e.id),
  }));

  const tiposDocumentoOptions = tiposDocumento.map((t) => ({
    ...t,
    id: Number(t.id),
    label: t.descripcion || t.nombre,
    value: Number(t.id),
  }));

  const seriesDocOptions = seriesDoc.map((s) => {
    const correlativoActual = Number(s.correlativo);
    const descripcionSerie = getDescripcionSerie(s.serie);
    return {
      ...s,
      id: Number(s.id),
      empresaId: Number(s.empresaId),
      tipoDocumentoId: Number(s.tipoDocumentoId),
      label: `${descripcionSerie} (N: ${correlativoActual})`,
      value: Number(s.id),
    };
  });

  const clientesOptions = (clientes || []).map((c) => ({
    ...c,
    id: Number(c.id),
    label: `${c.tipoDocumento?.codigo || ""} - ${c.numeroDocumento} - ${c.razonSocial
      }`,
    value: Number(c.id),
  }));

  const tiposProductoOptions = (tiposProducto || []).map((t) => ({
    ...t,
    id: Number(t.id),
    label: t.nombre,
    value: Number(t.id),
  }));

  const formasPagoOptions = (formasPago || []).map((f) => ({
    ...f,
    id: Number(f.id),
    label: f.descripcion || f.nombre,
    value: Number(f.id),
  }));

  // Personal general (para todos los responsables excepto Resp. Ventas)
  const personalOptionsFormatted = (personalFiltrado || []).map((p) => ({
    ...p,
    id: Number(p.id),
    label: `${p.nombres} ${p.apellidos}`,
    value: Number(p.id),
  }));

  // Personal vendedor (solo para Resp. Ventas - filtrado por esVendedor=true)
  const personalVendedorOptions = (personalFiltrado || [])
    .filter((p) => p.esVendedor === true)
    .map((p) => ({
      ...p,
      id: Number(p.id),
      label: `${p.nombres} ${p.apellidos}`,
      value: Number(p.id),
    }));

  const estadosPreFacturaOptions = (estadosPreFactura || []).map((e) => ({
    ...e,
    id: Number(e.id),
    label: e.descripcion,
    value: Number(e.id),
  }));

  const centrosCostoOptions = (centrosCosto || []).map((c) => ({
    ...c,
    id: Number(c.id),
    label: `${c.Codigo} ${c.Nombre}`,
    value: Number(c.id),
  }));

  const monedasOptions = (monedas || []).map((m) => ({
    ...m,
    id: Number(m.id),
    label: m.codigoSunat,
    value: Number(m.id),
  }));

  const bancosOptions = (bancos || []).map((b) => ({
    ...b,
    id: Number(b.id),
    label: b.nombre,
    value: Number(b.id),
  }));

  const incotermsOptions = (incoterms || []).map((i) => ({
    ...i,
    id: Number(i.id),
    label: `${i.codigo} - ${i.descripcion}`,
    value: Number(i.id),
  }));

  const paisesOptions = (paises || []).map((p) => ({
    ...p,
    id: Number(p.id),
    label: p.nombre,
    value: Number(p.id),
  }));

  const puertosOptions = (puertos || []).map((p) => ({
    ...p,
    id: Number(p.id),
    label: p.nombre,
    value: Number(p.id),
  }));

  const tiposContenedorOptions = (tiposContenedor || []).map((t) => ({
    ...t,
    id: Number(t.id),
    label: t.descripcion || t.nombre,
    value: Number(t.id),
  }));

  const agenteAduanasOptions = (agenteAduanas || []).map((a) => ({
    ...a,
    id: Number(a.id),
    label: a.razonSocial,
    value: Number(a.id),
  }));

  // Opciones de contactos del cliente
  const contactosClienteOptions = (contactosCliente || []).map((c) => ({
    ...c,
    id: Number(c.id),
    label: `${c.nombres} ${c.compras ? ` - COMPRAS` : ""}${c.finanzas ? ` - FINANZAS` : ""}${c.logistica ? ` - LOGISTICA` : ""}${c.ventas ? ` - VENTAS` : ""}`,
    value: Number(c.id),
  }));

  // Opciones de direcciones del cliente
  const direccionesClienteOptions = (direccionesCliente || []).map((d) => ({
    ...d,
    id: Number(d.id),
    label: d.direccion || `${d.calle || ""} ${d.numero || ""}`.trim(),
    value: Number(d.id),
  }));
  const unidadesNegocioOptions = unidadesNegocio.map((unidad) => ({
    label: unidad.nombre,
    value: Number(unidad.id),
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
            onCargarItemsDocAfecto={handleCargarItemsDocumentoAfecto}
            onSerieChange={handleSerieDocChange}
            onCambiarTipoSerie={handleCambiarTipoSerie}
            empresasOptions={empresasOptions}
            tiposDocumentoOptions={tiposDocumentoOptions}
            clientesOptions={clientesOptions}
            tiposProductoOptions={tiposProductoOptions}
            formasPagoOptions={formasPagoOptions}
            personalOptions={personalOptionsFormatted}
            personalVendedorOptions={personalVendedorOptions}
            seriesDocOptions={seriesDocOptions}
            estadosPreFacturaOptions={estadosPreFacturaOptions}
            centrosCostoOptions={centrosCostoOptions}
            monedasOptions={monedasOptions}
            unidadesNegocioOptions={unidadesNegocioOptions}
            bancosOptions={bancosOptions}
            incotermsOptions={incotermsOptions}
            paisesOptions={paisesOptions}
            puertosOptions={puertosOptions}
            tiposContenedorOptions={tiposContenedorOptions}
            agenteAduanasOptions={agenteAduanasOptions}
            periodosContables={periodosContables}
            motivosNCND={motivosNCND}
            contactosClienteOptions={contactosClienteOptions}
            direccionesClienteOptions={direccionesClienteOptions}
            mediosPago={mediosPago}
            bancos={bancosOptions}
            cuentasCorrientes={cuentasCorrientes}
            estadosCxC={estadosCxC}
            isEdit={isEdit}
            puedeEditar={puedeEditar}
            puedeEditarDetalles={puedeEditar}
            detallesCount={detallesCount}
            preFacturaId={defaultValues?.id}
            productos={productos}
            empresaId={empresaId}
            empresas={empresas}
            toast={toast}
            onCountChange={setDetallesCount}
            subtotal={totales.subtotal}
            totalIGV={totales.igv}
            montoImpuestoRenta={totales.impuestoRenta || 0}
            total={totales.total}
            monedaPreFactura={defaultValues?.moneda}
            readOnly={readOnly}
            onIrAPreFacturaOrigen={onIrAPreFacturaOrigen}
            onIrAMovimientoAlmacen={onIrAMovimientoAlmacen}
            onIrACotizacionVenta={onIrACotizacionVenta}
            onIrAContratoServicio={onIrAContratoServicio}
            onClienteCreado={handleClienteCreado}
            refreshClientes={refreshClientes}
            aplicaDetraccion={totales.aplicaDetraccion}
            montoDetraccion={totales.montoDetraccion}
            porcentajeDetraccion={totales.porcentajeDetraccion}
            aplicaRetencion={totales.aplicaRetencion}
            montoRetencion={totales.montoRetencion}
            porcentajeRetencion={totales.porcentajeRetencion}
            aplicaPercepcion={totales.aplicaPercepcion}
            montoPercepcion={totales.montoPercepcion}
            porcentajePercepcion={totales.porcentajePercepcion}
            facturado={formData.facturado}
            onFacturadoChange={(value) => handleChange("facturado", value)}
            fechaFacturacion={formData.fechaFacturacion}
            onFechaFacturacionChange={(value) => handleChange("fechaFacturacion", value)}
            tipoDocumentoFinalId={formData.tipoDocumentoFinalId}
            onTipoDocumentoFinalIdChange={(value) => handleChange("tipoDocumentoFinalId", value)}
            numeroDocumentoFinal={formData.numeroDocumentoFinal}
            onNumeroDocumentoFinalChange={(value) => handleChange("numeroDocumentoFinal", value)}
            numSerieDocFinal={formData.numSerieDocFinal}
            onNumSerieDocFinalChange={(value) => handleChange("numSerieDocFinal", value)}
            numCorreDocFinal={formData.numCorreDocFinal}
            onNumCorreDocFinalChange={(value) => handleChange("numCorreDocFinal", value)}
          />
        </TabPanel>
        {/* TAB 2: IMPRESION PDF */}
        <TabPanel header="Impresión PDF" leftIcon="pi pi-file-pdf">
          <VerImpresionPreFacturaPDF
            preFacturaId={defaultValues?.id}
            datosPreFactura={defaultValues}
            toast={toast}
          />
        </TabPanel>
        {/* TAB 3: FACTURACIÓN ELECTRÓNICA */}
        <TabPanel
          header="Facturación Electrónica"
          leftIcon="pi pi-send"
          disabled={!isEdit}
        >
          <BotonesGeneracionComprobante
            preFacturaId={defaultValues?.id}
            empresaId={empresaId}
            tipoDocumentoId={formData.tipoDocumentoId}
            esGerencial={formData.esGerencial}
            estadoId={formData.estadoId}
            toast={toast}
            onGenerarComprobante={handleGenerarComprobanteClick}
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
        {/* Botones izquierda: Aprobar, Anular, Partir, Facturar Negra */}
        <div style={{ display: "flex", gap: 8 }}>
          {estaPendiente && isEdit && (
            <>
              <Button
                label="Aprobar"
                icon="pi pi-check"
                className="p-button-success"
                onClick={handleAprobarClick}
                disabled={
                  tienePermisoEspecial
                    ? (readOnly || loading || estaAnulada)
                    : (readOnly || loading || !permisos.puedeEditar)
                }
                tooltip={
                  readOnly
                    ? "Modo solo lectura"
                    : estaAnulada
                      ? "No se puede aprobar un documento anulado"
                      : !permisos.puedeEditar && !tienePermisoEspecial
                        ? "No tiene permisos para aprobar"
                        : "Aprobar Pre-Factura"
                }
              />
              <Button
                label="Anular"
                icon="pi pi-ban"
                className="p-button-danger"
                onClick={handleAnularClick}
                disabled={
                  tienePermisoEspecial
                    ? (readOnly || loading || estaAnulada)
                    : (readOnly || loading || !permisos.puedeEliminar)
                }
                tooltip={
                  readOnly
                    ? "Modo solo lectura"
                    : estaAnulada
                      ? "El documento ya está anulado"
                      : !permisos.puedeEliminar && !tienePermisoEspecial
                        ? "No tiene permisos para anular"
                        : "Anular Pre-Factura"
                }
              />
            </>
          )}
          {/* Botón Partir PreFactura - Solo visible si está APROBADA */}
          {estaAprobada && isEdit && (
            <Button
              label="Partir"
              icon="pi pi-clone"
              className="p-button-warning"
              onClick={handlePartirClick}
              disabled={
                tienePermisoEspecial
                  ? (readOnly || loading || estaAnulada)
                  : (readOnly || loading || !permisos.puedeEditar)
              }
              tooltip={
                estaAnulada
                  ? "No se puede partir un documento anulado"
                  : "Mantener la Original y Crear Dos Copias Identicas Editables"
              }
            />
          )}
          {/* Botón Reactivar Documento - Visible si está APROBADA, FACTURADA o EMITIDA */}
          {(estaAprobada || estaFacturada || estaEmitida) && isEdit && (
            <Button
              label="Reactivar Documento"
              icon="pi pi-replay"
              className="p-button-warning"
              onClick={handleReactivarClick}
              disabled={
                tienePermisoEspecial
                  ? (readOnly || loading || estaAnulada)
                  : (readOnly || loading || !permisos.puedeEditar)
              }
              tooltip={
                estaAnulada
                  ? "No se puede reactivar un documento anulado"
                  : readOnly
                    ? "Modo solo lectura"
                    : !permisos.puedeEditar && !tienePermisoEspecial
                      ? "No tiene permisos para reactivar"
                      : "Reactivar documento a estado PENDIENTE (elimina kardex y CxC sin pagos)"
              }
            />
          )}
          {/* Botón Generar Venta (Negra) - Visible si está APROBADA o EMITIDA (con permiso de reactivar) y ES GERENCIAL */}
          {(estaAprobada ||
            ((estaEmitida || estaComprobanteGenerado || estaValidadoSunat) &&
              permisos.puedeReactivarDocs)) &&
            isEdit &&
            formData.esGerencial && (
              <Button
                label={
                  estaEmitida || estaComprobanteGenerado || estaValidadoSunat
                    ? "Regenerar CxC Gerencial"
                    : "Facturar Gerencial"
                }
                icon="pi pi-file"
                className="p-button-help"
                onClick={handleFacturarNegraClick}
                disabled={
                  tienePermisoEspecial
                    ? (readOnly || loading || estaAnulada)
                    : (readOnly || loading || !permisos.puedeEditar)
                }
                tooltip={
                  estaAnulada
                    ? "No se puede facturar un documento anulado"
                    : estaEmitida || estaComprobanteGenerado || estaValidadoSunat
                      ? "Regenerar CxC (Gerencial) sin comprobante (elimina y recrea)"
                      : "Generar CxC (Gerencial) sin comprobante"
                }
              />
            )}
          {/* Botón Emitir Comprobante - Visible si está APROBADA o EMITIDA (con permiso de reactivar) y NO es GERENCIAL */}
          {(estaAprobada ||
            ((estaEmitida || estaComprobanteGenerado || estaValidadoSunat) &&
              permisos.puedeReactivarDocs)) &&
            isEdit &&
            !formData.esGerencial && (
              <Button
                label={
                  estaEmitida || estaComprobanteGenerado || estaValidadoSunat
                    ? "Regenerar CxC Fiscal"
                    : "Facturar Fiscal"
                }
                icon="pi pi-file-check"
                className="p-button-success"
                onClick={handleFacturarBlancaClick}
                disabled={
                  tienePermisoEspecial
                    ? (readOnly || loading || estaAnulada)
                    : (readOnly || loading || !permisos.puedeEditar)
                }
                tooltip={
                  estaAnulada
                    ? "No se puede facturar un documento anulado"
                    : estaEmitida || estaComprobanteGenerado || estaValidadoSunat
                      ? "Regenerar CxC Fiscal y Comprobante Electrónico SUNAT (elimina y recrea)"
                      : "Generar CxC Fiscal y Comprobante Electrónico SUNAT"
                }
              />
            )}
        </div>

        {/* Botones derecha: Guardar y Cancelar */}
        <div style={{ display: "flex", gap: 8 }}>
          {/* Botón Generar Kardex */}
          {isEdit && formData.id && (
            <Button
              label={kardexGenerado ? "Regenerar Kardex" : "Generar Kardex"}
              icon="pi pi-database"
              className="p-button-info"
              onClick={handleGenerarKardexClick}
              disabled={
                tienePermisoEspecial
                  ? (readOnly || loading || estaAnulada)
                  : (readOnly || loading || !permisos.puedeEditar || estaAnulada || estaPendiente || !puedeGenerarKardex)
              }
              tooltip={
                readOnly
                  ? "Modo solo lectura"
                  : estaAnulada
                    ? "No se puede generar kardex en pre-facturas ANULADAS"
                    : estaPendiente && !tienePermisoEspecial
                      ? "No se puede generar kardex en pre-factura pendiente"
                      : !permisos.puedeEditar && !tienePermisoEspecial
                        ? "No tiene permisos para generar kardex"
                        : !puedeGenerarKardex && !tienePermisoEspecial
                          ? "Solo se puede generar kardex en pre-facturas APROBADAS, PARTICIONADAS, FACTURADAS, EMITIDAS o con estados SUNAT"
                          : kardexGenerado
                            ? "Regenerar kardex (eliminar y crear nuevo movimiento)"
                            : "Generar movimiento de salida de almacén"
              }
            />
          )}
          {/* Componente genérico de asientos contables */}
          {isEdit && formData.id && (
            <AsientoContableManager
              documentoId={formData.id}
              documentoTipo="PreFactura"
              empresaId={formData.empresaId}
              periodoContableId={formData.periodoContableId}
              showAsButton={true}
              onBeforeGenerate={handleBeforeGenerateAsiento}
            />
          )}
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
            disabled={
              tienePermisoEspecial
                ? (readOnly || loading || estaAnulada)
                : (readOnly || loading || !puedeEditar)
            }
            tooltip={
              readOnly
                ? "Modo solo lectura"
                : estaAnulada
                  ? "No se puede editar un documento anulado"
                  : !puedeEditar && !tienePermisoEspecial
                    ? "No se puede editar"
                    : "Guardar cambios"
            }
          />
        </div>
      </div>

      {/* Dialog para Particionar PreFactura */}
      <Dialog
        visible={showPartirDialog}
        style={{ width: "500px" }}
        header="Particionar PreFactura"
        modal
        onHide={() => setShowPartirDialog(false)}
      >
        <div className="p-fluid">
          <div className="mb-4">
            <i
              className="pi pi-info-circle"
              style={{ fontSize: "3rem", color: "#2196F3" }}
            ></i>
            <p
              className="mt-3 mb-0"
              style={{ fontSize: "16px", lineHeight: "1.6" }}
            >
              Esta acción creará <strong>DOS copias idénticas</strong> de esta
              PreFactura con estado <strong>PARTICIONADA</strong>.
            </p>
            <p
              className="mt-2 mb-0"
              style={{ fontSize: "14px", color: "#666" }}
            >
              Ambas copias conservarán todos los datos de cabecera y detalles,
              permitiéndote editarlas independientemente.
            </p>
            <p
              className="mt-2 mb-0"
              style={{ fontSize: "14px", color: "#666" }}
            >
              Las <strong>3 PreFacturas</strong> (original + 2 copias) quedarán
              con estado <strong>PARTICIONADA</strong> para identificarlas.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 16,
            }}
          >
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-secondary"
              onClick={() => setShowPartirDialog(false)}
            />
            <Button
              label="Particionar"
              icon="pi pi-clone"
              className="p-button-warning"
              onClick={handlePartirPreFactura}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
