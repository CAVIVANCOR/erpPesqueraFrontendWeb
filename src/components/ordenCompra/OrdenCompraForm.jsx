// src/components/ordenCompra/OrdenCompraForm.jsx
import React, { useState, useEffect } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import DatosGeneralesTab from "./DatosGeneralesTab";
import VerImpresionOrdenCompraPDF from "./VerImpresionOrdenCompraPDF";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { consultarTipoCambioSunat } from "../../api/consultaExterna";

export default function OrdenCompraForm({
  isEdit,
  defaultValues,
  empresas,
  proveedores,
  formasPago,
  productos,
  personalOptions,
  requerimientos,
  monedas,
  centrosCosto,
  tiposDocumento,
  seriesDoc,
  estadosOrden,
  empresaFija,
  onSubmit,
  onCancel,
  onAprobar,
  onAnular,
  onGenerarDesdeRequerimiento,
  onIrAlOrigen,
  loading,
  toast,
  permisos = {},
  readOnly = false,
}) {
  const { usuario } = useAuthStore();
  
  // Estados individuales para cada campo (patrón MovimientoAlmacenForm)
  const [empresaId, setEmpresaId] = useState(defaultValues?.empresaId || empresaFija || null);
  const [tipoDocumentoId, setTipoDocumentoId] = useState(defaultValues?.tipoDocumentoId || 17); // ORDEN DE COMPRA
  const [serieDocId, setSerieDocId] = useState(defaultValues?.serieDocId || null);
  const [numSerieDoc, setNumSerieDoc] = useState(defaultValues?.numSerieDoc || "");
  const [numCorreDoc, setNumCorreDoc] = useState(defaultValues?.numCorreDoc || "");
  const [numeroDocumento, setNumeroDocumento] = useState(defaultValues?.numeroDocumento || "");
  const [fechaDocumento, setFechaDocumento] = useState(
    defaultValues?.fechaDocumento ? new Date(defaultValues.fechaDocumento) : new Date()
  );
  const [requerimientoCompraId, setRequerimientoCompraId] = useState(defaultValues?.requerimientoCompraId || null);
  const [proveedorId, setProveedorId] = useState(defaultValues?.proveedorId || null);
  const [formaPagoId, setFormaPagoId] = useState(defaultValues?.formaPagoId || null);
  const [monedaId, setMonedaId] = useState(defaultValues?.monedaId || null);
  const [tipoCambio, setTipoCambio] = useState(defaultValues?.tipoCambio || null);
  const [fechaEntrega, setFechaEntrega] = useState(
    defaultValues?.fechaEntrega ? new Date(defaultValues.fechaEntrega) : null
  );
  const [fechaRecepcion, setFechaRecepcion] = useState(
    defaultValues?.fechaRecepcion ? new Date(defaultValues.fechaRecepcion) : null
  );
  const [solicitanteId, setSolicitanteId] = useState(defaultValues?.solicitanteId || null);
  const [aprobadoPorId, setAprobadoPorId] = useState(defaultValues?.aprobadoPorId || null);
  const [estadoId, setEstadoId] = useState(defaultValues?.estadoId ? Number(defaultValues.estadoId) : null);
  const [centroCostoId, setCentroCostoId] = useState(defaultValues?.centroCostoId || null);
  const [movIngresoAlmacenId, setMovIngresoAlmacenId] = useState(defaultValues?.movIngresoAlmacenId || null);
  const [observaciones, setObservaciones] = useState(defaultValues?.observaciones || "");
  const [porcentajeIGV, setPorcentajeIGV] = useState(defaultValues?.porcentajeIGV || null);
  const [esExoneradoAlIGV, setEsExoneradoAlIGV] = useState(defaultValues?.esExoneradoAlIGV || false);

  const [proveedoresFiltrados, setProveedoresFiltrados] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [detallesCount, setDetallesCount] = useState(0);
  const [totales, setTotales] = useState({ subtotal: 0, igv: 0, total: 0 });
  const [fechaDocumentoInicial, setFechaDocumentoInicial] = useState(null);

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

  // Actualizar estados cuando cambien los defaultValues (patrón MovimientoAlmacenForm)
  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      setEmpresaId(defaultValues.empresaId ? Number(defaultValues.empresaId) : (empresaFija ? Number(empresaFija) : null));
      setTipoDocumentoId(defaultValues.tipoDocumentoId ? Number(defaultValues.tipoDocumentoId) : 17);
      setSerieDocId(defaultValues.serieDocId ? Number(defaultValues.serieDocId) : null);
      setNumSerieDoc(defaultValues.numSerieDoc || "");
      setNumCorreDoc(defaultValues.numCorreDoc || "");
      setNumeroDocumento(defaultValues.numeroDocumento || "");
      setFechaDocumento(defaultValues.fechaDocumento ? new Date(defaultValues.fechaDocumento) : new Date());
      setRequerimientoCompraId(defaultValues.requerimientoCompraId ? Number(defaultValues.requerimientoCompraId) : null);
      setProveedorId(defaultValues.proveedorId ? Number(defaultValues.proveedorId) : null);
      setFormaPagoId(defaultValues.formaPagoId ? Number(defaultValues.formaPagoId) : null);
      setMonedaId(defaultValues.monedaId ? Number(defaultValues.monedaId) : null);
      setTipoCambio(defaultValues.tipoCambio || null);
      setFechaEntrega(defaultValues.fechaEntrega ? new Date(defaultValues.fechaEntrega) : null);
      setFechaRecepcion(defaultValues.fechaRecepcion ? new Date(defaultValues.fechaRecepcion) : null);
      setSolicitanteId(defaultValues.solicitanteId ? Number(defaultValues.solicitanteId) : null);
      setAprobadoPorId(defaultValues.aprobadoPorId ? Number(defaultValues.aprobadoPorId) : null);
      setEstadoId(defaultValues.estadoId ? Number(defaultValues.estadoId) : null);
      setCentroCostoId(defaultValues.centroCostoId ? Number(defaultValues.centroCostoId) : null);
      setMovIngresoAlmacenId(defaultValues.movIngresoAlmacenId ? Number(defaultValues.movIngresoAlmacenId) : null);
      setObservaciones(defaultValues.observaciones || "");
      setPorcentajeIGV(defaultValues.porcentajeIGV || null);
      setEsExoneradoAlIGV(defaultValues.esExoneradoAlIGV || false);
    }
  }, [defaultValues, empresaFija]);

  // Asignar automáticamente el solicitante basado en el usuario logueado (solo al crear)
  useEffect(() => {
    if (!isEdit && usuario?.personalId && !solicitanteId) {
      setSolicitanteId(Number(usuario.personalId));

      if (toast?.current) {
        setTimeout(() => {
          toast.current.show({
            severity: "info",
            summary: "Solicitante Asignado",
            detail: "Se ha asignado automáticamente como solicitante de la orden",
            life: 3000,
          });
        }, 500);
      }
    }
  }, [isEdit, usuario?.personalId, toast]);

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
        
        // Para COMPRAS usamos sell_price (precio de venta del dólar)
        if (tipoCambioData && tipoCambioData.sell_price) {
          const tipoCambioVenta = parseFloat(tipoCambioData.sell_price);
          setTipoCambio(tipoCambioVenta.toFixed(3));
          
          // Actualizar fecha inicial para permitir consultas futuras a esta misma fecha
          setFechaDocumentoInicial(fechaDocumento);
          
          toast?.current?.show({
            severity: "success",
            summary: "Tipo de Cambio Actualizado",
            detail: `Tipo de cambio SUNAT: S/ ${tipoCambioVenta.toFixed(3)} por USD`,
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

  // Recalcular totales cuando cambien los detalles, porcentaje IGV o estado IGV
  useEffect(() => {
    const calcularTotales = async () => {
      if (!defaultValues?.id || !isEdit) return;

      try {
        const { getDetallesOrdenCompra } = await import(
          "../../api/detalleOrdenCompra"
        );
        const detalles = await getDetallesOrdenCompra(defaultValues.id);

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

  // Handler para cambio de serie - Calcula y muestra el próximo correlativo
  const handleSerieChange = (serieId) => {
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
      requerimientoCompraId: setRequerimientoCompraId,
      proveedorId: setProveedorId,
      formaPagoId: setFormaPagoId,
      monedaId: setMonedaId,
      tipoCambio: setTipoCambio,
      fechaEntrega: setFechaEntrega,
      fechaRecepcion: setFechaRecepcion,
      solicitanteId: setSolicitanteId,
      aprobadoPorId: setAprobadoPorId,
      estadoId: setEstadoId,
      centroCostoId: setCentroCostoId,
      movIngresoAlmacenId: setMovIngresoAlmacenId,
      observaciones: setObservaciones,
      porcentajeIGV: setPorcentajeIGV,
      esExoneradoAlIGV: setEsExoneradoAlIGV,
    };
    
    const setter = setters[field];
    if (setter) {
      setter(value);
    }
  };

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
      requerimientoCompraId: requerimientoCompraId ? Number(requerimientoCompraId) : null,
      proveedorId: proveedorId ? Number(proveedorId) : null,
      formaPagoId: formaPagoId ? Number(formaPagoId) : null,
      monedaId: monedaId ? Number(monedaId) : null,
      tipoCambio,
      fechaEntrega,
      fechaRecepcion,
      solicitanteId: solicitanteId ? Number(solicitanteId) : null,
      aprobadoPorId: aprobadoPorId ? Number(aprobadoPorId) : null,
      estadoId: estadoId ? Number(estadoId) : null,
      centroCostoId: centroCostoId ? Number(centroCostoId) : null,
      movIngresoAlmacenId: movIngresoAlmacenId ? Number(movIngresoAlmacenId) : null,
      observaciones,
      porcentajeIGV,
      esExoneradoAlIGV,
    };

    if (!data.empresaId || !data.proveedorId) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Complete los campos obligatorios (Empresa, Proveedor)",
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
        detail: "Debe guardar la orden antes de aprobar",
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
    onAnular(defaultValues.id);
  };

  const handlePdfGenerated = (urlPdf) => {
    // Actualizar defaultValues con la nueva URL del PDF
    if (defaultValues) {
      defaultValues.urlOrdenCompraPdf = urlPdf;
    }
  };

  // Objeto formData para pasar a componentes hijos
  const formData = {
    empresaId,
    tipoDocumentoId,
    serieDocId,
    numSerieDoc,
    numCorreDoc,
    numeroDocumento,
    fechaDocumento,
    requerimientoCompraId,
    proveedorId,
    formaPagoId,
    monedaId,
    tipoCambio,
    fechaEntrega,
    fechaRecepcion,
    solicitanteId,
    aprobadoPorId,
    estadoId,
    centroCostoId,
    movIngresoAlmacenId,
    observaciones,
    porcentajeIGV,
    esExoneradoAlIGV,
  };

  // Estados del documento
  const estaAprobado = estadoId === 33;
  const estaAnulado = estadoId === 40;
  const estaPendiente = estadoId === 38 || !estadoId;
  const puedeEditar = estaPendiente && !loading;

  // Preparar options para dropdowns siguiendo patrón RequerimientoCompraForm
  const tiposDocumentoOptions = (tiposDocumento || []).map((t) => ({
    ...t,
    id: Number(t.id),
    label: t.descripcion || t.nombre,
    value: Number(t.id),
  }));

  const seriesDocOptions = (seriesDoc || []).map((s) => {
    const correlativoActual = Number(s.correlativo);
    return {
      ...s,
      id: Number(s.id),
      label: `${s.serie} (Correlativo: ${correlativoActual})`,
      value: Number(s.id),
    };
  });

  const estadosOrdenOptions = (estadosOrden || []).map((e) => ({
    ...e,
    id: Number(e.id),
    label: e.descripcion || e.nombre,
    value: Number(e.id),
  }));

  return (
    <div className="p-fluid">
      <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
        {/* TAB 1: DATOS GENERALES */}
        <TabPanel header="Datos Generales" leftIcon="pi pi-file">
          <DatosGeneralesTab
            formData={formData}
            onChange={handleChange}
            onSerieChange={handleSerieChange}
            empresas={empresas}
            proveedores={proveedoresFiltrados}
            formasPago={formasPago}
            personalOptions={personalOptions}
            monedas={monedas}
            centrosCosto={centrosCosto}
            tiposDocumentoOptions={tiposDocumentoOptions}
            seriesDocOptions={seriesDocOptions}
            estadosOrdenOptions={estadosOrdenOptions}
            isEdit={isEdit}
            puedeEditar={puedeEditar}
            detallesCount={detallesCount}
            ordenCompraId={defaultValues?.id}
            productos={productos}
            toast={toast}
            onCountChange={setDetallesCount}
            subtotal={totales.subtotal}
            totalIGV={totales.igv}
            total={totales.total}
            monedaOrden={defaultValues?.moneda}
            readOnly={readOnly}
            permisos={permisos}
            onIrAlOrigen={onIrAlOrigen}
          />
        </TabPanel>

        {/* TAB 2: IMPRESIÓN PDF */}
        <TabPanel header="Impresión PDF" leftIcon="pi pi-file-pdf" disabled={!isEdit}>
          <VerImpresionOrdenCompraPDF
            ordenCompraId={defaultValues?.id}
            datosOrdenCompra={defaultValues}
            toast={toast}
            personalOptions={personalOptions}
            onPdfGenerated={handlePdfGenerated}
          />
        </TabPanel>
      </TabView>

      {/* BOTONES DE ACCIÓN */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Botones izquierda: Aprobar, Anular */}
        <div style={{ display: "flex", gap: 8 }}>
          {/* Botón Aprobar: siempre visible en edición, deshabilitado si ya está aprobado o anulado */}
          {isEdit && (
            <Button
              label="Aprobar"
              icon="pi pi-check"
              className="p-button-success"
              onClick={handleAprobarClick}
              disabled={readOnly || loading || !permisos.puedeEditar || estaAprobado || estaAnulado}
              tooltip={
                estaAprobado ? "La orden ya está aprobada" :
                estaAnulado ? "No se puede aprobar una orden anulada" :
                readOnly ? "Modo solo lectura" : 
                !permisos.puedeEditar ? "No tiene permisos para aprobar" : 
                "Aprobar orden de compra"
              }
            />
          )}
          
          {/* Botón Anular: solo visible si está pendiente o aprobado */}
          {isEdit && (estaPendiente || estaAprobado) && (
            <Button
              label="Anular"
              icon="pi pi-ban"
              className="p-button-danger"
              onClick={handleAnularClick}
              disabled={readOnly || loading || !permisos.puedeEliminar}
              tooltip={readOnly ? "Modo solo lectura" : !permisos.puedeEliminar ? "No tiene permisos para anular" : "Anular orden de compra"}
            />
          )}

          {/* Tags de estado cuando está aprobado o anulado */}
          {estaAprobado && (
            <Tag value="APROBADO" severity="success" icon="pi pi-check-circle" />
          )}

          {estaAnulado && (
            <Tag value="ANULADO" severity="danger" icon="pi pi-times-circle" />
          )}
        </div>

        {/* Botones derecha: Guardar y Cancelar */}
        <div style={{ display: "flex", gap: 10 }}>
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
            tooltip={readOnly ? "Modo solo lectura" : !puedeEditar ? "No se puede editar" : ""}
          />
        </div>
      </div>
    </div>
  );
}