// src/components/contratoServicio/ContratoServicioForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import DatosGeneralesContratoCard from "./DatosGeneralesContratoCard";
import ContratoServicioPdfCard from "./ContratoServicioPdfCard";
import EntregaARendirContratoCard from "./EntregaARendirContratoCard";
import { getSeriesDoc } from "../../api/contratoServicio";
import { consultarTipoCambioSunat } from "../../api/consultaExterna";

const ContratoServicioForm = ({
  contrato = null,
  onGuardar,
  onCancelar,
  empresas = [],
  sedes = [],
  activos = [],
  almacenes = [],
  clientes = [],
  contactos = [],
  personalOptions = [],
  tiposDocumento = [],
  monedas = [],
  estadosContrato = [],
  productos = [],
  centrosAlmacen = [],
  centrosCosto = [],
  tiposMovimiento = [],
  entidadesComerciales = [],
  empresaFija = null,
  toast: toastProp,
  isEdit = false,
  permisos = {},
  readOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const toast = useRef(toastProp || null);
  const [seriesDoc, setSeriesDoc] = useState([]);
  const [detalles, setDetalles] = useState(contrato?.detallesServicios || []);
  const [urlContratoPdf, setUrlContratoPdf] = useState(contrato?.urlContratoPdf || null);
  const [countEntregasRendir, setCountEntregasRendir] = useState(0);
  const [detallesCount, setDetallesCount] = useState(contrato?.detallesServicios?.length || 0);
  const [totales, setTotales] = useState({ subtotal: 0, total: 0 });
  const [fechaCelebracionInicial, setFechaCelebracionInicial] = useState(null);

  const [formData, setFormData] = useState({
    id: contrato?.id || null,
    empresaId: contrato?.empresaId ? Number(contrato.empresaId) : (empresaFija ? Number(empresaFija) : null),
    sedeId: contrato?.sedeId ? Number(contrato.sedeId) : null,
    activoId: contrato?.activoId ? Number(contrato.activoId) : null,
    almacenId: contrato?.almacenId ? Number(contrato.almacenId) : null,
    clienteId: contrato?.clienteId ? Number(contrato.clienteId) : null,
    contactoClienteId: contrato?.contactoClienteId ? Number(contrato.contactoClienteId) : null,
    responsableId: contrato?.responsableId ? Number(contrato.responsableId) : null,
    aprobadorId: contrato?.aprobadorId ? Number(contrato.aprobadorId) : null,
    tipoDocumentoId: contrato?.tipoDocumentoId ? Number(contrato.tipoDocumentoId) : 20,
    serieDocId: contrato?.serieDocId ? Number(contrato.serieDocId) : null,
    numeroSerie: contrato?.numeroSerie || "",
    numeroCorrelativo: contrato?.numeroCorrelativo || 0,
    numeroCompleto: contrato?.numeroCompleto || "",
    monedaId: contrato?.monedaId ? Number(contrato.monedaId) : 1,
    estadoContratoId: contrato?.estadoContratoId ? Number(contrato.estadoContratoId) : 67,
    fechaCelebracion: contrato?.fechaCelebracion ? new Date(contrato.fechaCelebracion) : new Date(),
    fechaInicioContrato: contrato?.fechaInicioContrato ? new Date(contrato.fechaInicioContrato) : new Date(),
    fechaFinContrato: contrato?.fechaFinContrato ? new Date(contrato.fechaFinContrato) : null,
    fechaInicioCobro: contrato?.fechaInicioCobro ? new Date(contrato.fechaInicioCobro) : new Date(),
    periodicidadCobro: contrato?.periodicidadCobro || 1,
    textoEsenciaContrato: contrato?.textoEsenciaContrato || "",
    urlContratoPdf: contrato?.urlContratoPdf || null,
    incluyeLuz: contrato?.incluyeLuz || false,
    porcentajeRecargoLuz: contrato?.porcentajeRecargoLuz || null,
    costoPorKilovatio: contrato?.costoPorKilovatio || null,
    tipoCambio: contrato?.tipoCambio || 3.75,
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Cargar series de documentos cuando cambie empresa (tipoDocumentoId siempre es 20)
  useEffect(() => {
    if (formData.empresaId) {
      cargarSeriesDoc();
    }
  }, [formData.empresaId]);

  const cargarSeriesDoc = async () => {
    try {
      // Siempre usar tipoDocumentoId = 20 (Contratos de Servicios)
      const series = await getSeriesDoc(formData.empresaId, 20);
      setSeriesDoc(series);
    } catch (error) {
      console.error("Error al cargar series:", error);
    }
  };

  const handleSerieDocChange = (serieId) => {
    setFormData((prev) => ({ ...prev, serieDocId: Number(serieId) }));
    if (serieId) {
      const serie = seriesDoc.find((s) => Number(s.id) === Number(serieId));
      if (serie) {
        const proximoCorrelativo = Number(serie.correlativo) + 1;
        const numSerie = String(serie.serie).padStart(serie.numCerosIzqSerie, "0");
        const numCorre = String(proximoCorrelativo).padStart(serie.numCerosIzqCorre, "0");
        const numeroCompleto = `${numSerie}-${numCorre}`;
        
        setFormData((prev) => ({
          ...prev,
          numeroSerie: numSerie,
          numeroCorrelativo: proximoCorrelativo,
          numeroCompleto: numeroCompleto,
        }));
      }
    }
  };

  // Calcular fecha fin automáticamente (1 año después de inicio)
  useEffect(() => {
    if (formData.fechaInicioContrato && !isEdit) {
      const fechaFin = new Date(formData.fechaInicioContrato);
      fechaFin.setFullYear(fechaFin.getFullYear() + 1);
      handleChange("fechaFinContrato", fechaFin);
    }
  }, [formData.fechaInicioContrato, isEdit]);

  // Sincronizar urlContratoPdf con formData
  useEffect(() => {
    setFormData((prev) => ({ ...prev, urlContratoPdf: urlContratoPdf }));
  }, [urlContratoPdf]);

  // Guardar fecha inicial para evitar carga automática en mount
  useEffect(() => {
    if (formData.fechaCelebracion && fechaCelebracionInicial === null) {
      setFechaCelebracionInicial(formData.fechaCelebracion);
    }
  }, [formData.fechaCelebracion, fechaCelebracionInicial]);

  // Cargar tipo de cambio SUNAT solo cuando el usuario modifica manualmente fechaCelebracion
  useEffect(() => {
    const cargarTipoCambio = async () => {
      // No ejecutar si no hay fecha o si es la carga inicial
      if (!formData.fechaCelebracion || fechaCelebracionInicial === null) return;
      
      // Comparar fechas por valor (ISO string) en lugar de por referencia
      const fechaActualISO = new Date(formData.fechaCelebracion).toISOString();
      const fechaInicialISO = new Date(fechaCelebracionInicial).toISOString();
      
      // No ejecutar si la fecha no ha cambiado realmente
      if (fechaActualISO === fechaInicialISO) return;

      try {
        // Convertir fecha a formato YYYY-MM-DD
        const fecha = new Date(formData.fechaCelebracion);
        const fechaISO = fecha.toISOString().split('T')[0];

        // Consultar tipo de cambio SUNAT
        const tipoCambioData = await consultarTipoCambioSunat({ date: fechaISO });
        
        // Para COMPRAS DE SERVICIOS usamos sell_price (precio de venta del dólar)
        if (tipoCambioData && tipoCambioData.sell_price) {
          const tipoCambioVenta = parseFloat(tipoCambioData.sell_price);
          handleChange("tipoCambio", tipoCambioVenta.toFixed(3));
          
          // Actualizar fecha inicial para permitir consultas futuras a esta misma fecha
          setFechaCelebracionInicial(formData.fechaCelebracion);
          
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
  }, [formData.fechaCelebracion, fechaCelebracionInicial]);

  // Recalcular totales cuando cambien los detalles
  useEffect(() => {
    const calcularTotales = async () => {
      if (!formData.id || !isEdit) {
        setTotales({ subtotal: 0, total: 0 });
        return;
      }

      try {
        const { getDetallesServicioContrato } = await import("../../api/detServicioContrato");
        const detallesData = await getDetallesServicioContrato(formData.id);

        // Calcular subtotal sumando cantidad * valorVentaUnitario de cada detalle
        const subtotalCalc = detallesData.reduce((sum, det) => {
          const cantidad = Number(det.cantidad) || 0;
          const valorUnitario = Number(det.valorVentaUnitario) || 0;
          return sum + (cantidad * valorUnitario);
        }, 0);

        // Para contratos de servicio, el total es igual al subtotal (sin IGV)
        const totalCalc = subtotalCalc;

        setTotales({ subtotal: subtotalCalc, total: totalCalc });
      } catch (err) {
        console.error("Error al calcular totales:", err);
        setTotales({ subtotal: 0, total: 0 });
      }
    };

    calcularTotales();
  }, [detallesCount, formData.id, isEdit]);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validaciones
      if (!formData.empresaId) {
        toast?.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Debe seleccionar una empresa",
        });
        return;
      }

      if (!formData.clienteId) {
        toast?.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Debe seleccionar un cliente",
        });
        return;
      }

      if (!formData.responsableId) {
        toast?.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Debe seleccionar un responsable",
        });
        return;
      }

      // Preparar datos para enviar
      const dataToSend = {
        ...formData,
        detalles: detalles,
      };

      await onGuardar(dataToSend);
    } catch (error) {
      console.error("Error al guardar contrato:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar el contrato",
      });
    } finally {
      setLoading(false);
    }
  };

  // Crear opciones de series con formato: "001 (Correlativo: 5)"
  const seriesDocOptions = seriesDoc.map((s) => ({
    ...s,
    id: Number(s.id),
    label: `${s.serie} (Correlativo: ${Number(s.correlativo)})`,
    value: Number(s.id),
  }));

  return (
    <div>
      <Toast ref={toast} />
      
      <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
        <TabPanel header="Datos Generales" leftIcon="pi pi-file-edit">
          <DatosGeneralesContratoCard
            formData={formData}
            handleChange={handleChange}
            empresas={empresas}
            sedes={sedes}
            activos={activos}
            almacenes={almacenes}
            clientes={clientes}
            contactos={contactos}
            personalOptions={personalOptions}
            tiposDocumento={tiposDocumento}
            seriesDoc={seriesDoc}
            seriesDocOptions={seriesDocOptions}
            monedas={monedas}
            estadosContrato={estadosContrato}
            centrosAlmacen={centrosAlmacen}
            handleSerieDocChange={handleSerieDocChange}
            isEdit={isEdit}
            detalles={detalles}
            setDetalles={setDetalles}
            productos={productos}
            contratoId={formData.id}
            toast={toast}
            onCountChange={setDetallesCount}
            subtotal={totales.subtotal}
            total={totales.total}
            readOnly={readOnly}
          />
        </TabPanel>

        <TabPanel header="Documento PDF" leftIcon="pi pi-file-pdf">
          <ContratoServicioPdfCard
            contratoId={formData.id}
            urlContratoPdf={urlContratoPdf}
            setUrlContratoPdf={setUrlContratoPdf}
            toast={toast}
            readOnly={readOnly}
          />
        </TabPanel>

        <TabPanel 
          header={`Entrega a Rendir ${countEntregasRendir > 0 ? `(${countEntregasRendir})` : ""}`}
          leftIcon="pi pi-money-bill"
        >
          <EntregaARendirContratoCard
            contratoServicio={formData}
            personal={personalOptions}
            centrosCosto={centrosCosto}
            tiposMovimiento={tiposMovimiento}
            entidadesComerciales={entidadesComerciales}
            monedas={monedas}
            tiposDocumento={tiposDocumento}
            puedeEditar={isEdit}
            onCountChange={setCountEntregasRendir}
            readOnly={readOnly}
            permisos={permisos}
          />
        </TabPanel>
      </TabView>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "1rem",
          marginTop: "2rem",
          paddingTop: "1rem",
          borderTop: "1px solid #dee2e6",
        }}
      >
        <Button
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-secondary"
          onClick={onCancelar}
          type="button"
        />
        <Button
          label={isEdit ? "Actualizar" : "Guardar"}
          icon="pi pi-check"
          className="p-button-success"
          onClick={handleSubmit}
          loading={loading}
          disabled={readOnly || !permisos.puedeEditar}
          tooltip={readOnly ? "Modo solo lectura" : !permisos.puedeEditar ? "No tiene permisos para editar" : ""}
          type="button"
        />
      </div>
    </div>
  );
};

export default ContratoServicioForm;