// src/components/preFactura/PreFacturaForm.jsx
import React, { useState, useEffect } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import DatosGeneralesTab from "./DatosGeneralesTab";
import VerImpresionPreFacturaPDF from "./VerImpresionPreFacturaPDF";
import BotonesGeneracionComprobante from "./BotonesGeneracionComprobante";
import { getEstadosMultiFuncionPorTipoProviene } from "../../api/estadoMultiFuncion";
import { getSeriesDoc } from "../../api/preFactura";
import { obtenerContactosPorEntidad } from "../../api/contactoEntidad";
import { obtenerDireccionesPorEntidad } from "../../api/direccionEntidad";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { consultarTipoCambioSunat } from "../../api/consultaExterna";
import { partirPreFactura, facturarPreFacturaNegra } from "../../api/preFactura";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";

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
  bancos = [],
  incoterms = [],
  paises = [],
  puertos = [],
  tiposContenedor = [],
  agenteAduanas = [],
  empresaFija,
  onSubmit,
  onCancel,
  onAprobar,
  onAnular,
  loading,
  toast,
  permisos = {},
  readOnly = false,
}) {
  const { usuario } = useAuthStore();

  // Estado único para todos los campos del formulario (patrón eficiente)
  const [formData, setFormData] = useState({
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

    // Montos
    subtotal: defaultValues?.subtotal || 0,
    totalDescuentos: defaultValues?.totalDescuentos || 0,
    totalIGV: defaultValues?.totalIGV || 0,
    total: defaultValues?.total || 0,
    montoAdelantadoCliente: defaultValues?.montoAdelantadoCliente || 0,
    porcentajeAdelanto: defaultValues?.porcentajeAdelanto || 0,

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

    // Sistema
    creadoPor: defaultValues?.creadoPor
      ? Number(defaultValues.creadoPor)
      : null,
    actualizadoPor: defaultValues?.actualizadoPor
      ? Number(defaultValues.actualizadoPor)
      : null,
  });

  // Handler genérico para cambios en cualquier campo
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Actualizar formData cuando cambian los defaultValues (modo edición)
  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      setFormData({
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

        // Montos
        subtotal: defaultValues?.subtotal || 0,
        totalDescuentos: defaultValues?.totalDescuentos || 0,
        totalIGV: defaultValues?.totalIGV || 0,
        total: defaultValues?.total || 0,
        montoAdelantadoCliente: defaultValues?.montoAdelantadoCliente || 0,
        porcentajeAdelanto: defaultValues?.porcentajeAdelanto || 0,

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

        // Sistema
        creadoPor: defaultValues?.creadoPor
          ? Number(defaultValues.creadoPor)
          : null,
        actualizadoPor: defaultValues?.actualizadoPor
          ? Number(defaultValues.actualizadoPor)
          : null,
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
  const [totales, setTotales] = useState({ subtotal: 0, igv: 0, total: 0 });
  const [estadosPreFactura, setEstadosPreFactura] = useState([]);
  const [fechaDocumentoInicial, setFechaDocumentoInicial] = useState(null);

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
        (c) => Number(c.empresaId) === Number(empresaId)
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
        (p) => Number(p.empresaId) === Number(empresaId)
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
          console.error("Error al cargar contactos/direcciones del cliente:", err);
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
        (e) => Number(e.id) === Number(empresaId)
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
        (e) => Number(e.id) === Number(empresaId)
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
        const fechaISO = fecha.toISOString().split('T')[0];

        // Consultar tipo de cambio SUNAT
        const tipoCambioData = await consultarTipoCambioSunat({ date: fechaISO });
        
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

  // Recalcular totales cuando cambien los detalles
  useEffect(() => {
    const calcularTotales = async () => {
      if (!defaultValues?.id || !isEdit) return;

      try {
        const { getDetallesPreFactura } = await import(
          "../../api/detallePreFactura"
        );
        const detalles = await getDetallesPreFactura(defaultValues.id);

        const subtotalCalc = detalles.reduce(
          (sum, det) =>
            sum + (Number(det.cantidad) * Number(det.precioUnitario) || 0),
          0
        );
        const igvCalc = exoneradoIgv
          ? 0
          : subtotalCalc * (Number(porcentajeIgv) / 100);
        const totalCalc = subtotalCalc + igvCalc;

        setTotales({ subtotal: subtotalCalc, igv: igvCalc, total: totalCalc });
      } catch (err) {
        console.error("Error al calcular totales:", err);
      }
    };

    calcularTotales();
  }, [detallesCount, porcentajeIgv, exoneradoIgv, isEdit, defaultValues?.id]);

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
      factorExportacion: formData.factorExportacion,
      factorExportacionReal: formData.factorExportacionReal,
      observaciones: formData.observaciones,
      centroCostoId: formData.centroCostoId
        ? Number(formData.centroCostoId)
        : null,
      contratoServicioId: formData.contratoServicioId
        ? Number(formData.contratoServicioId)
        : null,
      movSalidaAlmacenId: formData.movSalidaAlmacenId
        ? Number(formData.movSalidaAlmacenId)
        : null,
      creadoPor: formData.creadoPor ? Number(formData.creadoPor) : null,
      actualizadoPor: formData.actualizadoPor
        ? Number(formData.actualizadoPor)
        : null,
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


  // Handler para partir PreFactura (Caso 2: Mixto Blanco/Negro)
  const [showPartirDialog, setShowPartirDialog] = useState(false);
  const [porcentajeNegro, setPorcentajeNegro] = useState(40);
  const [porcentajeBlanco, setPorcentajeBlanco] = useState(60);

  const handlePartirClick = () => {
    setShowPartirDialog(true);
  };

  const handlePartirPreFactura = async () => {
    if (porcentajeNegro + porcentajeBlanco !== 100) {
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "La suma de porcentajes debe ser 100%",
        life: 3000,
      });
      return;
    }

    try {
      const resultado = await partirPreFactura(defaultValues.id, {
        porcentajeNegro,
        porcentajeBlanco
      });

      toast?.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `PreFactura partida: ${porcentajeNegro}% Negro + ${porcentajeBlanco}% Blanco`,
        life: 5000,
      });

      setShowPartirDialog(false);
      onComprobanteGenerado?.();
    } catch (error) {
      console.error("Error al partir PreFactura:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.mensaje || "No se pudo partir la PreFactura",
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
        detail: "CxC Negra (Gerencial) generada exitosamente",
        life: 5000,
      });

      onComprobanteGenerado?.();
    } catch (error) {
      console.error("Error al facturar negra:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.mensaje || "No se pudo facturar la PreFactura negra",
        life: 3000,
      });
    }
  };




  // Estados del documento
  const estaPendiente = estadoId === 45 || !estadoId;
  const estaAprobada = estadoId === 46;
  const estaAnulada = estadoId === 47;
  const estaParticionada = estadoId === 48;
  const estaFacturada = estadoId === 95;
  const puedeEditar = estaPendiente && !loading;
  const puedeAnular = (estaPendiente || estaAprobada) && !loading;

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
    return {
      ...s,
      id: Number(s.id),
      label: `${s.serie} (Correlativo: ${correlativoActual})`,
      value: Number(s.id),
    };
  });

  const clientesOptions = (clientes || []).map((c) => ({
    ...c,
    id: Number(c.id),
    label: `${c.tipoDocumento?.codigo || ""} - ${c.numeroDocumento} - ${
      c.razonSocial
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
    label: `${c.nombres} ${c.compras ? ` - COMPRAS` : "" }${c.finanzas ? ` - FINANZAS` : "" }${c.logistica ? ` - LOGISTICA` : "" }${c.ventas ? ` - VENTAS` : "" }`,
    value: Number(c.id),
  }));

  // Opciones de direcciones del cliente
  const direccionesClienteOptions = (direccionesCliente || []).map((d) => ({
    ...d,
    id: Number(d.id),
    label: d.direccion || `${d.calle || ""} ${d.numero || ""}`.trim(),
    value: Number(d.id),
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
            clientesOptions={clientesOptions}
            tiposProductoOptions={tiposProductoOptions}
            formasPagoOptions={formasPagoOptions}
            personalOptions={personalOptionsFormatted}
            personalVendedorOptions={personalVendedorOptions}
            seriesDocOptions={seriesDocOptions}
            estadosPreFacturaOptions={estadosPreFacturaOptions}
            centrosCostoOptions={centrosCostoOptions}
            monedasOptions={monedasOptions}
            bancosOptions={bancosOptions}
            incotermsOptions={incotermsOptions}
            paisesOptions={paisesOptions}
            puertosOptions={puertosOptions}
            tiposContenedorOptions={tiposContenedorOptions}
            agenteAduanasOptions={agenteAduanasOptions}
            contactosClienteOptions={contactosClienteOptions}
            direccionesClienteOptions={direccionesClienteOptions}
            isEdit={isEdit}
            puedeEditar={puedeEditar}
            puedeEditarDetalles={puedeEditar}
            detallesCount={detallesCount}
            preFacturaId={defaultValues?.id}
            productos={productos}
            empresaId={empresaId}
            toast={toast}
            onCountChange={setDetallesCount}
            subtotal={totales.subtotal}
            totalIGV={totales.igv}
            total={totales.total}
            monedaPreFactura={defaultValues?.moneda}
            readOnly={readOnly}
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
            facturado={formData.facturado}
            toast={toast}
            onComprobanteGenerado={(resultado) => {
              handleChange("facturado", true);
              handleChange("fechaFacturacion", new Date());
            }}
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
                disabled={readOnly || loading || !permisos.puedeEditar}
                tooltip={
                  readOnly
                    ? "Modo solo lectura"
                    : !permisos.puedeEditar
                    ? "No tiene permisos para aprobar"
                    : ""
                }
              />
              <Button
                label="Anular"
                icon="pi pi-ban"
                className="p-button-danger"
                onClick={handleAnularClick}
                disabled={readOnly || loading || !permisos.puedeEliminar}
                tooltip={
                  readOnly
                    ? "Modo solo lectura"
                    : !permisos.puedeEliminar
                    ? "No tiene permisos para anular"
                    : ""
                }
              />
            </>
          )}

          {/* Botón Partir PreFactura - Solo visible si está APROBADA */}
          {estaAprobada && isEdit && (
            <Button
              label="Partir PreFactura"
              icon="pi pi-clone"
              className="p-button-warning"
              onClick={handlePartirClick}
              disabled={readOnly || loading || !permisos.puedeEditar}
              tooltip="Dividir en Blanca (Formal) y Negra (Gerencial)"
            />
          )}

          {/* Botón Facturar Negra - Solo visible si está APROBADA y es GERENCIAL */}
          {estaAprobada && isEdit && formData.esGerencial && (
            <Button
              label="Facturar Negra"
              icon="pi pi-file"
              className="p-button-help"
              onClick={handleFacturarNegraClick}
              disabled={readOnly || loading || !permisos.puedeEditar}
              tooltip="Generar CxC Negra (Gerencial) sin comprobante"
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
            disabled={readOnly || loading || !puedeEditar}
            tooltip={
              readOnly
                ? "Modo solo lectura"
                : !puedeEditar
                ? "No se puede editar"
                : ""
            }
          />
        </div>
      </div>

 {/* Dialog para Partir PreFactura */}
      <Dialog
        visible={showPartirDialog}
        style={{ width: "450px" }}
        header="Partir PreFactura (Blanca + Negra)"
        modal
        onHide={() => setShowPartirDialog(false)}
      >
        <div className="p-fluid">
          <div className="mb-3">
            <label htmlFor="porcentajeNegro" className="block mb-2 font-bold">
              % Negra (Gerencial) ⚫
            </label>
            <InputNumber
              id="porcentajeNegro"
              value={porcentajeNegro}
              onValueChange={(e) => {
                setPorcentajeNegro(e.value);
                setPorcentajeBlanco(100 - e.value);
              }}
              mode="decimal"
              min={0}
              max={100}
              suffix="%"
              showButtons
              step={5}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="porcentajeBlanco" className="block mb-2 font-bold">
              % Blanca (Formal) ⚪
            </label>
            <InputNumber
              id="porcentajeBlanco"
              value={porcentajeBlanco}
              onValueChange={(e) => {
                setPorcentajeBlanco(e.value);
                setPorcentajeNegro(100 - e.value);
              }}
              mode="decimal"
              min={0}
              max={100}
              suffix="%"
              showButtons
              step={5}
            />
          </div>
          <div className="mb-3 p-3" style={{ backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
            <p className="m-0 text-sm">
              <strong>Total:</strong> {porcentajeNegro + porcentajeBlanco}%
            </p>
            <p className="m-0 text-sm mt-2">
              <strong>Monto Negra:</strong> S/ {((formData.total || 0) * porcentajeNegro / 100).toFixed(2)}
            </p>
            <p className="m-0 text-sm">
              <strong>Monto Blanca:</strong> S/ {((formData.total || 0) * porcentajeBlanco / 100).toFixed(2)}
            </p>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-secondary"
              onClick={() => setShowPartirDialog(false)}
            />
            <Button
              label="Partir"
              icon="pi pi-check"
              className="p-button-warning"
              onClick={handlePartirPreFactura}
            />
          </div>
        </div>
      </Dialog>

    </div>
  );
}
