// src/components/ordenCompra/OrdenCompraForm.jsx
import React, { useState, useEffect } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import DatosGeneralesTab from "./DatosGeneralesTab";
import DetallesTab from "./DetallesTab";
import MovimientosTab from "./MovimientosTab";
import { useAuthStore } from "../../shared/stores/useAuthStore";

export default function OrdenCompraForm({
  isEdit,
  defaultValues,
  empresas,
  proveedores,
  formasPago,
  productos,
  personalOptions,
  requerimientos,
  empresaFija,
  onSubmit,
  onCancel,
  onAprobar,
  onAnular,
  onGenerarDesdeRequerimiento,
  loading,
  toast,
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

  const [proveedoresFiltrados, setProveedoresFiltrados] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [detallesCount, setDetallesCount] = useState(0);
  const [movimientosCount, setMovimientosCount] = useState(0);

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

  // Estados del documento
  const estaAprobado = formData.estadoId === 33;
  const estaAnulado = formData.estadoId === 34;
  const estaPendiente = formData.estadoId === 32 || !formData.estadoId;
  const puedeEditar = estaPendiente && !loading;

  return (
    <div className="p-fluid">
      <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
        {/* TAB 1: DATOS GENERALES */}
        <TabPanel header="Datos Generales" leftIcon="pi pi-file">
          <DatosGeneralesTab
            formData={formData}
            onChange={handleChange}
            empresas={empresas}
            proveedores={proveedoresFiltrados}
            formasPago={formasPago}
            personalOptions={personalOptions}
            requerimientos={requerimientos}
            isEdit={isEdit}
            puedeEditar={puedeEditar}
            onGenerarDesdeRequerimiento={onGenerarDesdeRequerimiento}
          />
        </TabPanel>

        {/* TAB 2: DETALLES */}
        <TabPanel
          header={`Detalles ${detallesCount > 0 ? `(${detallesCount})` : ""}`}
          leftIcon="pi pi-list"
          disabled={!isEdit}
        >
          <DetallesTab
            ordenCompraId={defaultValues?.id}
            productos={productos}
            puedeEditar={puedeEditar}
            toast={toast}
            onCountChange={setDetallesCount}
          />
        </TabPanel>

        {/* TAB 3: MOVIMIENTOS DE ALMACÉN */}
        <TabPanel
          header={`Movimientos ${movimientosCount > 0 ? `(${movimientosCount})` : ""}`}
          leftIcon="pi pi-warehouse"
          disabled={!isEdit || !estaAprobado}
        >
          <MovimientosTab
            ordenCompraId={defaultValues?.id}
            toast={toast}
            onCountChange={setMovimientosCount}
          />
        </TabPanel>
      </TabView>

      {/* BOTONES DE ACCIÓN */}
      <div className="flex justify-content-end gap-2 mt-4">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-secondary"
          onClick={onCancel}
          disabled={loading}
        />

        {estaPendiente && (
          <>
            <Button
              label="Guardar"
              icon="pi pi-save"
              className="p-button-primary"
              onClick={handleSubmit}
              disabled={loading}
            />

            {isEdit && (
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
          </>
        )}

        {estaAprobado && (
          <Tag value="APROBADO" severity="success" icon="pi pi-check-circle" />
        )}

        {estaAnulado && (
          <Tag value="ANULADO" severity="danger" icon="pi pi-times-circle" />
        )}
      </div>
    </div>
  );
}