// src/components/cotizacionVentas/CotizacionVentasForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import DatosGeneralesCotizacionCard from "./DatosGeneralesCotizacionCard";
import DetCotizacionVentasCard from "./DetCotizacionVentasCard";
import CostosExportacionCard from "./CostosExportacionCard";
import DocumentosRequeridosCard from "./DocumentosRequeridosCard";
import EntregaARendirCard from "./EntregaARendirCard";
import VerImpresionCotizacionVentasPDF from "./VerImpresionCotizacionVentasPDF";
import VerImpresionDocumentacionPDF from "./VerImpresionDocumentacionPDF";
import { getEstadosMultiFuncionPorTipoProviene } from "../../api/estadoMultiFuncion";
import { getSeriesDoc } from "../../api/cotizacionVentas";
import { getDocumentosPorCotizacion } from "../../api/detDocsReqCotizaVentas";
import { obtenerContactosPorEntidad } from "../../api/contactoEntidad";
import { obtenerDireccionesPorEntidad } from "../../api/direccionEntidad";
import { consultarTipoCambioSunat } from "../../api/consultaExterna";

const CotizacionVentasForm = ({
  isEdit,
  defaultValues = null,
  onSubmit,
  onCancel,
  empresas = [],
  tiposDocumento = [],
  clientes: clientesProp = [],
  agenteAduanas = [],
  operadoresLogisticos = [],
  navieras = [],
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
  incoterms = [],
  paises = [],
  puertos = [],
  tiposContenedor = [],
  bancos = [],
  formasTransaccion = [],
  modosDespacho = [],
  docRequeridaVentasOptions = [],
  empresaFija = null,
  permisos = {},
  readOnly = false,
  loading: loadingProp = false,
  toast: toastProp,
}) => {
  const [activeCard, setActiveCard] = useState(0);
  const [loading, setLoading] = useState(false);
  const toast = useRef(toastProp || null);

  const [clientes, setClientes] = useState(clientesProp);
  const [seriesDoc, setSeriesDoc] = useState([]);
  const [detalles, setDetalles] = useState(defaultValues?.detallesProductos || []);
  const [costos, setCostos] = useState(defaultValues?.costosExportacion || []);
  const [documentos, setDocumentos] = useState(
    defaultValues?.documentosRequeridos?.map(doc => ({
      id: doc.id,
      docRequeridaVentasId: doc.docRequeridaVentasId,
      nombre: doc.docRequeridaVentas?.nombre || 'Sin nombre',
      esObligatorio: doc.esObligatorio,
      numeroDocumento: doc.numeroDocumento,
      fechaEmision: doc.fechaEmision,
      fechaVencimiento: doc.fechaVencimiento,
      urlDocumento: doc.urlDocumento,
      verificado: doc.verificado,
      fechaVerificacion: doc.fechaVerificacion,
      verificadoPorId: doc.verificadoPorId,
      observacionesVerificacion: doc.observacionesVerificacion || '',
      costoDocumento: doc.costoDocumento,
      monedaId: doc.monedaId,
      docRequeridaVentas: doc.docRequeridaVentas
    })) || []
  );
  const [estadosCotizaciones, setEstadosCotizaciones] = useState([]);
  const [detallesCount, setDetallesCount] = useState(defaultValues?.detallesProductos?.length || 0);
  const [totales, setTotales] = useState({ subtotal: 0, igv: 0, total: 0 });
  const [contactosCliente, setContactosCliente] = useState([]);
  const [direccionesCliente, setDireccionesCliente] = useState([]);
  const [personalFiltrado, setPersonalFiltrado] = useState([]);
  const [loadingAprobar, setLoadingAprobar] = useState(false);
  const [fechaDocumentoInicial, setFechaDocumentoInicial] = useState(null);

  const [formData, setFormData] = useState({
    id: defaultValues?.id || null,
    empresaId: defaultValues?.empresaId ? Number(defaultValues.empresaId) : (empresaFija ? Number(empresaFija) : 1),
    tipoDocumentoId: defaultValues?.tipoDocumentoId ? Number(defaultValues.tipoDocumentoId) : 18,
    serieDocId: defaultValues?.serieDocId ? Number(defaultValues.serieDocId) : null,
    numSerieDoc: defaultValues?.numSerieDoc || "",
    numCorreDoc: defaultValues?.numCorreDoc || "",
    numeroDocumento: defaultValues?.numeroDocumento || "",
    fechaDocumento: defaultValues?.fechaDocumento ? new Date(defaultValues.fechaDocumento) : new Date(),
    fechaVencimiento: defaultValues?.fechaVencimiento ? new Date(defaultValues.fechaVencimiento) : null,
    fechaEntregaEstimada: defaultValues?.fechaEntregaEstimada ? new Date(defaultValues.fechaEntregaEstimada) : null,
    fechaZarpeEstimada: defaultValues?.fechaZarpeEstimada ? new Date(defaultValues.fechaZarpeEstimada) : null,
    fechaArriboEstimada: defaultValues?.fechaArriboEstimada ? new Date(defaultValues.fechaArriboEstimada) : null,
    fechaAprobacion: defaultValues?.fechaAprobacion ? new Date(defaultValues.fechaAprobacion) : null,
    fechaConversionPreFactura: defaultValues?.fechaConversionPreFactura ? new Date(defaultValues.fechaConversionPreFactura) : null,
    diasTransito: defaultValues?.diasTransito || null,
    clienteId: defaultValues?.clienteId ? Number(defaultValues.clienteId) : null,
    contactoClienteId: defaultValues?.contactoClienteId ? Number(defaultValues.contactoClienteId) : null,
    dirEntregaId: defaultValues?.dirEntregaId ? Number(defaultValues.dirEntregaId) : null,
    dirFiscalId: defaultValues?.dirFiscalId ? Number(defaultValues.dirFiscalId) : null,
    estadoId: defaultValues?.estadoId ? Number(defaultValues.estadoId) : 41,
    respVentasId: defaultValues?.respVentasId ? Number(defaultValues.respVentasId) : null,
    autorizaVentaId: defaultValues?.autorizaVentaId ? Number(defaultValues.autorizaVentaId) : null,
    supervisorVentaCampoId: defaultValues?.supervisorVentaCampoId ? Number(defaultValues.supervisorVentaCampoId) : null,
    respEmbarqueId: defaultValues?.respEmbarqueId ? Number(defaultValues.respEmbarqueId) : null,
    respProduccionId: defaultValues?.respProduccionId ? Number(defaultValues.respProduccionId) : null,
    respAlmacenId: defaultValues?.respAlmacenId ? Number(defaultValues.respAlmacenId) : null,
    tipoProductoId: defaultValues?.tipoProductoId ? Number(defaultValues.tipoProductoId) : null,
    formaPagoId: defaultValues?.formaPagoId ? Number(defaultValues.formaPagoId) : null,
    bancoId: defaultValues?.bancoId ? Number(defaultValues.bancoId) : null,
    monedaId: defaultValues?.monedaId ? Number(defaultValues.monedaId) : 1,
    tipoCambio: defaultValues?.tipoCambio || 3.75,
    esExportacion: defaultValues?.esExportacion !== undefined ? defaultValues.esExportacion : false,
    paisDestinoId: defaultValues?.paisDestinoId ? Number(defaultValues.paisDestinoId) : null,
    incotermsId: defaultValues?.incotermsId ? Number(defaultValues.incotermsId) : null,
    puertoCargaId: defaultValues?.puertoCargaId ? Number(defaultValues.puertoCargaId) : null,
    puertoDescargaId: defaultValues?.puertoDescargaId ? Number(defaultValues.puertoDescargaId) : null,
    agenteAduanasId: defaultValues?.agenteAduanasId ? Number(defaultValues.agenteAduanasId) : null,
    operadorLogisticoId: defaultValues?.operadorLogisticoId ? Number(defaultValues.operadorLogisticoId) : null,
    navieraId: defaultValues?.navieraId ? Number(defaultValues.navieraId) : null,
    tipoContenedorId: defaultValues?.tipoContenedorId ? Number(defaultValues.tipoContenedorId) : null,
    cantidadContenedores: defaultValues?.cantidadContenedores || null,
    pesoMaximoContenedor: defaultValues?.pesoMaximoContenedor || null,
    porcentajeIGV: defaultValues?.porcentajeIGV || null,
    esExoneradoAlIGV: defaultValues?.esExoneradoAlIGV !== undefined ? defaultValues.esExoneradoAlIGV : false,
    metodoCalculoFactor: defaultValues?.metodoCalculoFactor || "PORCENTUAL",
    factorExportacion: defaultValues?.factorExportacion || 1.0,
    margenUtilidadPorcentaje: defaultValues?.margenUtilidadPorcentaje || null,
    montoAdelantadoCliente: defaultValues?.montoAdelantadoCliente || null,
    porcentajeAdelanto: defaultValues?.porcentajeAdelanto || null,
    motivoRechazo: defaultValues?.motivoRechazo || null,
    aprobadoPorId: defaultValues?.aprobadoPorId ? Number(defaultValues.aprobadoPorId) : null,
    prefacturaVentaId: defaultValues?.prefacturaVentaId ? Number(defaultValues.prefacturaVentaId) : null,
    usuarioConversionId: defaultValues?.usuarioConversionId ? Number(defaultValues.usuarioConversionId) : null,
    destinoProductoId: defaultValues?.destinoProductoId ? Number(defaultValues.destinoProductoId) : null,
    formaTransaccionId: defaultValues?.formaTransaccionId ? Number(defaultValues.formaTransaccionId) : null,
    modoDespachoRecepcionId: defaultValues?.modoDespachoRecepcionId ? Number(defaultValues.modoDespachoRecepcionId) : null,
    tipoEstadoProductoId: defaultValues?.tipoEstadoProductoId ? Number(defaultValues.tipoEstadoProductoId) : null,
    observaciones: defaultValues?.observaciones || "",
    observacionesInternas: defaultValues?.observacionesInternas || "",
    urlCotizacionPdf: defaultValues?.urlCotizacionPdf || null,
    urlDocumentacionRequeridaPdf: defaultValues?.urlDocumentacionRequeridaPdf || null,
    centroCostoId: defaultValues?.centroCostoId ? Number(defaultValues.centroCostoId) : null,
    creadoPor: defaultValues?.creadoPor ? Number(defaultValues.creadoPor) : null,
    actualizadoPor: defaultValues?.actualizadoPor ? Number(defaultValues.actualizadoPor) : null,
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const { empresaId, tipoDocumentoId, fechaDocumento } = formData;

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

  // Filtrar personal por empresa
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

  // Personal general (todos los responsables excepto Resp. Ventas)
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

  const responsablesVentas = personalVendedorOptions;
  const responsablesAutorizaVenta = personalOptionsFormatted;
  const responsablesSupervisorCampo = personalOptionsFormatted;
  const responsablesEmbarque = personalOptionsFormatted;
  const responsablesProduccion = personalOptionsFormatted;
  const responsablesAlmacen = personalOptionsFormatted;

  const handleDocumentosGenerados = async () => {
    // Recargar documentos desde la API
    if (defaultValues?.id) {
      try {
        const documentosActualizados = await getDocumentosPorCotizacion(defaultValues.id);
        
        // Transformar los documentos al formato esperado por el componente
        const documentosFormateados = documentosActualizados.map(doc => ({
          id: doc.id,
          docRequeridaVentasId: doc.docRequeridaVentasId,
          nombre: doc.docRequeridaVentas?.nombre || 'Sin nombre',
          esObligatorio: doc.esObligatorio,
          numeroDocumento: doc.numeroDocumento,
          fechaEmision: doc.fechaEmision,
          fechaVencimiento: doc.fechaVencimiento,
          urlDocumento: doc.urlDocumento,
          verificado: doc.verificado,
          fechaVerificacion: doc.fechaVerificacion,
          verificadoPorId: doc.verificadoPorId,
          observacionesVerificacion: doc.observacionesVerificacion || '',
          costoDocumento: doc.costoDocumento,
          monedaId: doc.monedaId,
          docRequeridaVentas: doc.docRequeridaVentas
        }));
        
        setDocumentos(documentosFormateados);
        
        toast?.current?.show({
          severity: 'info',
          summary: 'Documentos Actualizados',
          detail: `Se cargaron ${documentosFormateados.length} documentos`,
          life: 3000
        });
      } catch (error) {
        console.error('Error al recargar documentos:', error);
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron recargar los documentos',
          life: 3000
        });
      }
    }
  };

  const tiposEstadoProductoOptions = tiposEstadoProducto.map((t) => ({
    ...t,
    id: Number(t.id),
    label: t.descripcion,
    value: Number(t.id),
  }));

  const destinosProductoOptions = destinosProducto.map((d) => ({
    ...d,
    id: Number(d.id),
    label: d.descripcion,
    value: Number(d.id),
  }));

  useEffect(() => {
    if (empresaId && empresas && empresas.length > 0 && !isEdit) {
      const empresaSeleccionada = empresas.find((e) => Number(e.id) === Number(empresaId));
      if (empresaSeleccionada && empresaSeleccionada.porcentajeIgv !== undefined) {
        handleChange("porcentajeIGV", empresaSeleccionada.porcentajeIgv);
      }
    }
  }, [formData.empresaId, empresas, isEdit]);

  useEffect(() => {
    if (formData.empresaId && empresas && empresas.length > 0 && !isEdit) {
      const empresaSeleccionada = empresas.find((e) => Number(e.id) === Number(formData.empresaId));
      if (formData.esExoneradoAlIGV) {
        handleChange("porcentajeIGV", 0);
      } else {
        if (empresaSeleccionada && empresaSeleccionada.porcentajeIgv !== undefined) {
          handleChange("porcentajeIGV", empresaSeleccionada.porcentajeIgv);
        }
      }
    }
  }, [formData.esExoneradoAlIGV, formData.empresaId, empresas, isEdit]);

  const handleSerieDocChange = (serieId) => {
    setFormData((prev) => ({ ...prev, serieDocId: Number(serieId) }));
    if (serieId) {
      const serie = seriesDoc.find((s) => Number(s.id) === Number(serieId));
      if (serie) {
        const proximoCorrelativo = Number(serie.correlativo) + 1;
        const numSerie = String(serie.serie).padStart(serie.numCerosIzqSerie, "0");
        setFormData((prev) => ({
          ...prev,
          serieDocId: Number(serieId),
          numSerieDoc: numSerie,
          numCorreDoc: `Próximo: ${proximoCorrelativo}`,
          numeroDocumento: "Se generará al guardar",
        }));
      }
    } else {
      setFormData((prev) => ({ ...prev, numSerieDoc: "", numCorreDoc: "", numeroDocumento: "" }));
    }
  };

  useEffect(() => {
    const cargarEstados = async () => {
      try {
        const estados = await getEstadosMultiFuncionPorTipoProviene(13);
        setEstadosCotizaciones(estados);
      } catch (err) {
        console.error("Error al cargar estados de cotizaciones:", err);
        setEstadosCotizaciones([]);
      }
    };
    cargarEstados();
  }, []);

  useEffect(() => {
    setClientes(clientesProp);
  }, [clientesProp]);

  // Cargar contactos y direcciones del cliente cuando cambie clienteId
  useEffect(() => {
    const cargarContactosYDirecciones = async () => {
      if (formData.clienteId) {
        try {
          const contactos = await obtenerContactosPorEntidad(formData.clienteId);
          setContactosCliente(contactos || []);

          const direcciones = await obtenerDireccionesPorEntidad(formData.clienteId);
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
  }, [formData.clienteId]);

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

  // Recalcular totales cuando cambien: detalles, moneda, tipo cambio, porcentaje IGV, estado IGV
  useEffect(() => {
    const calcularTotales = async () => {
      if (!defaultValues?.id || !isEdit) {
        setTotales({ subtotal: 0, igv: 0, total: 0 });
        return;
      }

      try {
        const { getDetallesCotizacionVentas } = await import(
          "../../api/detalleCotizacionVentas"
        );
        const detallesData = await getDetallesCotizacionVentas(defaultValues.id);

        // Calcular subtotal sumando cantidad * precioUnitarioFinal de cada detalle
        const subtotalCalc = detallesData.reduce(
          (sum, det) => {
            const cantidad = Number(det.cantidad) || 0;
            const precioFinal = Number(det.precioUnitarioFinal) || 0;
            return sum + (cantidad * precioFinal);
          },
          0
        );
        
        // Calcular IGV (usar valores actuales de formData)
        const igvCalc = formData.esExoneradoAlIGV
          ? 0
          : subtotalCalc * (Number(formData.porcentajeIGV) / 100);
        
        // Calcular total
        const totalCalc = subtotalCalc + igvCalc;

        setTotales({ subtotal: subtotalCalc, igv: igvCalc, total: totalCalc });
      } catch (err) {
        console.error("Error al calcular totales:", err);
        setTotales({ subtotal: 0, igv: 0, total: 0 });
      }
    };

    calcularTotales();
  }, [
    detallesCount,
    formData.monedaId,
    formData.tipoCambio,
    formData.porcentajeIGV,
    formData.esExoneradoAlIGV,
    isEdit,
    defaultValues?.id,
  ]);

  const validarFormulario = () => {
    const camposFaltantes = [];

    // Validar campos obligatorios
    if (!formData.empresaId) camposFaltantes.push("Empresa");
    if (!formData.tipoDocumentoId) camposFaltantes.push("Tipo de Documento");
    if (!formData.serieDocId) camposFaltantes.push("Serie de Documento");
    if (!formData.fechaDocumento) camposFaltantes.push("Fecha de Documento");
    if (!formData.fechaVencimiento) camposFaltantes.push("Fecha de Vencimiento");
    if (!formData.clienteId) camposFaltantes.push("Cliente");
    if (!formData.tipoProductoId) camposFaltantes.push("Tipo de Producto");
    if (!formData.formaPagoId) camposFaltantes.push("Forma de Pago");
    if (!formData.monedaId) camposFaltantes.push("Moneda");
    if (!formData.estadoId) camposFaltantes.push("Estado");
    if (!formData.respVentasId || Number(formData.respVentasId) <= 0) {
      camposFaltantes.push("Responsable de Ventas (necesario para Entrega a Rendir)");
    }

    // Validaciones condicionales para exportación
    if (formData.esExportacion) {
      if (!formData.paisDestinoId) camposFaltantes.push("País de Destino");
      if (!formData.incotermsId) camposFaltantes.push("Incoterms");
    }

    return camposFaltantes;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar formulario antes de enviar
    const camposFaltantes = validarFormulario();
    if (camposFaltantes.length > 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Campos Obligatorios Faltantes",
        detail: (
          <div>
            <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>Por favor complete los siguientes campos:</p>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {camposFaltantes.map((campo, index) => (
                <li key={index}>{campo}</li>
              ))}
            </ul>
          </div>
        ),
        life: 6000,
      });
      return;
    }

    setLoading(true);
    try {
      const dataToSubmit = {
        ...formData,
        detalles,
        costos,
        documentos,
        fechaDocumento: formData.fechaDocumento?.toISOString(),
        fechaVencimiento: formData.fechaVencimiento?.toISOString(),
        fechaEntregaEstimada: formData.fechaEntregaEstimada?.toISOString(),
        fechaZarpeEstimada: formData.fechaZarpeEstimada?.toISOString(),
        fechaArriboEstimada: formData.fechaArriboEstimada?.toISOString(),
        fechaAprobacion: formData.fechaAprobacion?.toISOString(),
        fechaConversionPreFactura: formData.fechaConversionPreFactura?.toISOString(),
      };
      await onSubmit(dataToSubmit);
    } catch (error) {
      console.error("Error al guardar cotización:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
  };

  // Función para aprobar cotización
  const handleAprobarCotizacion = async () => {
    if (!defaultValues?.id) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la cotización antes de aprobarla",
        life: 3000,
      });
      return;
    }

    setLoadingAprobar(true);
    try {
      // TODO: Implementar API de aprobación cuando esté disponible
      toast?.current?.show({
        severity: "info",
        summary: "Función en desarrollo",
        detail: "La función de aprobar cotización estará disponible próximamente.",
        life: 3000,
      });
    } catch (err) {
      console.error("Error al aprobar cotización:", err);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo aprobar la cotización.",
        life: 3000,
      });
    } finally {
      setLoadingAprobar(false);
    }
  };

  const handleTabChange = (e) => {
    setActiveCard(e.index);
  };

  const estadosCotizacionesOptions = estadosCotizaciones.map((e) => ({
    ...e,
    id: Number(e.id),
    label: e.descripcion,
    value: Number(e.id),
  }));

  const seriesDocOptions = seriesDoc.map((s) => ({
    ...s,
    id: Number(s.id),
    label: `${s.serie} (Correlativo: ${Number(s.correlativo)})`,
    value: Number(s.id),
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

  return (
    <div className="cotizacion-ventas-form">
      <Toast ref={toast} position="top-center" appendTo={document.body} style={{ zIndex: 99999 }} />
      <form onSubmit={handleSubmit}>
        <TabView activeIndex={activeCard} onTabChange={handleTabChange} className="p-mb-4">
          <TabPanel header="Generales" leftIcon="pi pi-building">
            <DatosGeneralesCotizacionCard
              formData={formData}
              handleChange={handleChange}
              handleSerieDocChange={handleSerieDocChange}
              empresaFija={empresaFija}
              disabled={loading || loadingProp}
              permisos={permisos}
              empresas={empresas}
              clientes={clientes}
              tiposDocumento={tiposDocumento}
              tiposProducto={tiposProducto}
              formasPago={formasPago}
              monedas={monedas}
              centrosCosto={centrosCosto}
              responsablesVentas={responsablesVentas}
              responsablesAutorizaVenta={responsablesAutorizaVenta}
              responsablesSupervisorCampo={responsablesSupervisorCampo}
              responsablesEmbarque={responsablesEmbarque}
              responsablesProduccion={responsablesProduccion}
              responsablesAlmacen={responsablesAlmacen}
              agenteAduanas={agenteAduanas}
              operadoresLogisticos={operadoresLogisticos}
              navieras={navieras}
              seriesDoc={seriesDoc}
              seriesDocOptions={seriesDocOptions}
              incoterms={incoterms}
              paises={paises}
              puertos={puertos}
              tiposContenedor={tiposContenedor}
              setSeriesDoc={setSeriesDoc}
              setClientes={setClientes}
              estadosCotizacionesOptions={estadosCotizacionesOptions}
              tiposEstadoProductoOptions={tiposEstadoProductoOptions}
              destinosProductoOptions={destinosProductoOptions}
              detalles={detalles}
              setDetalles={setDetalles}
              productos={productos}
              isEdit={isEdit}
              cotizacionId={defaultValues?.id}
              toast={toast}
              onCountChange={setDetallesCount}
              subtotal={totales.subtotal}
              totalIGV={totales.igv}
              total={totales.total}
              monedasOptions={monedas.map(m => ({ value: m.id, codigoSunat: m.codigoSunat || 'PEN', simbolo: m.simbolo }))}
              contactosClienteOptions={contactosClienteOptions}
              direccionesClienteOptions={direccionesClienteOptions}
              readOnly={readOnly}
            />
          </TabPanel>
          <TabPanel header="Costos Exportación" leftIcon="pi pi-dollar">
            <CostosExportacionCard
              cotizacionId={defaultValues?.id}
              incotermId={formData.incotermsId}
              productos={productos}
              monedasOptions={monedas}
              proveedores={clientes}
              puedeEditar={permisos?.puedeEditar && !loading && !loadingProp}
              toast={toast}
              onFactorCalculado={(factor) => handleChange("factorExportacion", factor)}
              detalles={detalles}
              readOnly={readOnly}
            />
          </TabPanel>
          <TabPanel header="Documentos Requeridos" leftIcon="pi pi-file">
            <DocumentosRequeridosCard
              formData={formData}
              handleChange={handleChange}
              documentos={documentos}
              setDocumentos={setDocumentos}
              disabled={loading || loadingProp}
              cotizacionId={defaultValues?.id || null}
              toast={toast}
              onDocumentosGenerados={handleDocumentosGenerados}
              monedasOptions={monedas.map(m => ({ 
                value: m.id, 
                label: `${m.simbolo}`,
                simbolo: m.simbolo 
              }))}
              docRequeridaVentasOptions={docRequeridaVentasOptions}
              readOnly={readOnly}
            />
          </TabPanel>
          <TabPanel header="Entrega a Rendir" leftIcon="pi pi-money-bill" disabled={!isEdit}>
            <EntregaARendirCard
              cotizacionVentas={formData}
              personal={personalOptions}
              centrosCosto={centrosCosto}
              tiposMovimiento={tiposMovimiento}
              entidadesComerciales={clientes}
              monedas={monedas}
              tiposDocumento={tiposDocumento}
              puedeEditar={permisos?.editar !== false}
              readOnly={readOnly}
              permisos={permisos}
            />
          </TabPanel>
          <TabPanel header="PDF Cotización" leftIcon="pi pi-file-pdf">
            <VerImpresionCotizacionVentasPDF 
              cotizacionId={formData.id} 
              datosCotizacion={formData} 
              detalles={detalles}
              toast={toast}
            />
          </TabPanel>
          <TabPanel header="PDF Documentación" leftIcon="pi pi-file-pdf">
            <VerImpresionDocumentacionPDF formData={formData} documentos={documentos} />
          </TabPanel>
        </TabView>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button type="button" label="Cancelar" icon="pi pi-times" className="p-button-secondary" onClick={handleCancel} disabled={loading || loadingProp} />
          <Button type="submit" label={defaultValues ? "Actualizar" : "Guardar"} icon="pi pi-save" className="p-button-primary" loading={loading || loadingProp} disabled={readOnly || !permisos.puedeEditar} tooltip={readOnly ? "Modo solo lectura" : !permisos.puedeEditar ? "No tiene permisos para editar" : ""} />
          {/* Botón Aprobar Cotización */}
          {formData.estadoId !== 42 && permisos.puedeAprobarDocs && defaultValues?.id && (
            <Button
              type="button"
              label="Aprobar Cotización"
              icon="pi pi-check"
              className="p-button-success"
              onClick={handleAprobarCotizacion}
              loading={loadingAprobar}
              disabled={loading || loadingProp || loadingAprobar}
            />
          )}
          {/* Indicador de estado aprobado */}
          {formData.estadoId === 42 && (
            <Button
              type="button"
              label="APROBADO"
              icon="pi pi-check-circle"
              className="p-button-success"
              disabled
            />
          )}
        </div>
      </form>
    </div>
  );
};

export default CotizacionVentasForm;