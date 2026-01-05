import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import { getAllEmpresas } from '../../api/empresa';
import { getAllBancos } from '../../api/banco';
import { getAllMonedas } from '../../api/moneda';
import { getEstadosMultiFuncionPorTipoProviene } from '../../api/estadoMultiFuncion';
import { createLineaCredito, updateLineaCredito } from '../../api/tesoreria/lineaCredito';

const LineaCreditoForm = forwardRef(({ lineaCredito, empresaFija = null, onSave, onCancel }, ref) => {
  const toast = useRef(null);
  const [formData, setFormData] = useState({
    empresaId: empresaFija ? Number(empresaFija) : null,
    bancoId: null,
    numeroLinea: '',
    tipoLinea: null,
    montoAprobado: 0,
    monedaId: null,
    tasaInteres: 0,
    comisionMantenimiento: null,
    comisionUtilizacion: null,
    fechaAprobacion: null,
    fechaVencimiento: null,
    estadoId: null,
    observaciones: '',
    urlDocumentoPDF: ''
  });

  const [empresas, setEmpresas] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [estados, setEstados] = useState([]);
  const [loading, setLoading] = useState(false);

  const tiposLinea = [
    { label: 'Revolvente', value: 'REVOLVENTE' },
    { label: 'Carta de Crédito', value: 'CARTA_CREDITO' },
    { label: 'Garantía Bancaria', value: 'GARANTIA_BANCARIA' },
    { label: 'Sobregiro', value: 'SOBREGIRO' }
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (lineaCredito) {
      setFormData({
        empresaId: lineaCredito.empresaId ? lineaCredito.empresaId : (empresaFija ? Number(empresaFija) : null),
        bancoId: lineaCredito.bancoId,
        numeroLinea: lineaCredito.numeroLinea || '',
        tipoLinea: lineaCredito.tipoLinea,
        montoAprobado: parseFloat(lineaCredito.montoAprobado) || 0,
        monedaId: lineaCredito.monedaId,
        tasaInteres: parseFloat(lineaCredito.tasaInteres) || 0,
        comisionMantenimiento: lineaCredito.comisionMantenimiento ? parseFloat(lineaCredito.comisionMantenimiento) : null,
        comisionUtilizacion: lineaCredito.comisionUtilizacion ? parseFloat(lineaCredito.comisionUtilizacion) : null,
        fechaAprobacion: lineaCredito.fechaAprobacion ? new Date(lineaCredito.fechaAprobacion) : null,
        fechaVencimiento: lineaCredito.fechaVencimiento ? new Date(lineaCredito.fechaVencimiento) : null,
        estadoId: lineaCredito.estadoId,
        observaciones: lineaCredito.observaciones || '',
        urlDocumentoPDF: lineaCredito.urlDocumentoPDF || ''
      });
    }
  }, [lineaCredito]);

  const cargarDatos = async () => {
    try {
      const [empresasData, bancosData, monedasData, estadosData] = await Promise.all([
        getAllEmpresas(),
        getAllBancos(),
        getAllMonedas(),
        getEstadosMultiFuncionPorTipoProviene(22)
      ]);

      setEmpresas(empresasData.map(e => ({ label: e.razonSocial, value: e.id })));
      setBancos(bancosData.map(b => ({ label: b.nombre, value: b.id })));
      setMonedas(monedasData.map(m => ({ label: m.codigoSunat, value: m.id })));
      setEstados(estadosData.map(e => ({ label: e.descripcion || e.estado, value: e.id })));
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al cargar datos', life: 3000 });
    }
  };

  const handleSubmit = async () => {
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      const dataToSend = {
        ...formData,
        fechaAprobacion: formData.fechaAprobacion?.toISOString(),
        fechaVencimiento: formData.fechaVencimiento?.toISOString()
      };

      if (lineaCredito?.id) {
        await updateLineaCredito(lineaCredito.id, dataToSend);
        toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Línea de crédito actualizada', life: 3000 });
      } else {
        await createLineaCredito(dataToSend);
        toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Línea de crédito creada', life: 3000 });
      }
      
      if (onSave) onSave();
    } catch (error) {
      toast.current?.show({ 
        severity: 'error', 
        summary: 'Error', 
        detail: error.response?.data?.message || 'Error al guardar línea de crédito', 
        life: 3000 
      });
    } finally {
      setLoading(false);
    }
  };

  const validarFormulario = () => {
    if (!formData.empresaId) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'Seleccione una empresa', life: 3000 });
      return false;
    }
    if (!formData.bancoId) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'Seleccione un banco', life: 3000 });
      return false;
    }
    if (!formData.numeroLinea) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'Ingrese el número de línea', life: 3000 });
      return false;
    }
    if (!formData.tipoLinea) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'Seleccione el tipo de línea', life: 3000 });
      return false;
    }
    if (!formData.montoAprobado || formData.montoAprobado <= 0) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'Ingrese un monto aprobado válido', life: 3000 });
      return false;
    }
    if (!formData.monedaId) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'Seleccione una moneda', life: 3000 });
      return false;
    }
    if (!formData.fechaAprobacion) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'Ingrese la fecha de aprobación', life: 3000 });
      return false;
    }
    if (!formData.fechaVencimiento) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'Ingrese la fecha de vencimiento', life: 3000 });
      return false;
    }
    if (!formData.estadoId) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'Seleccione un estado', life: 3000 });
      return false;
    }
    return true;
  };

  useImperativeHandle(ref, () => ({
    submit: handleSubmit
  }));

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      
      <div className="grid">
        <div className="col-12 md:col-6">
          <div className="field">
            <label htmlFor="empresaId">Empresa *</label>
            <Dropdown
              id="empresaId"
              value={formData.empresaId}
              options={empresas}
              onChange={(e) => setFormData({ ...formData, empresaId: e.value })}
              placeholder="Seleccione una empresa"
              filter
            />
          </div>
        </div>

        <div className="col-12 md:col-6">
          <div className="field">
            <label htmlFor="bancoId">Banco *</label>
            <Dropdown
              id="bancoId"
              value={formData.bancoId}
              options={bancos}
              onChange={(e) => setFormData({ ...formData, bancoId: e.value })}
              placeholder="Seleccione un banco"
              filter
            />
          </div>
        </div>

        <div className="col-12 md:col-6">
          <div className="field">
            <label htmlFor="numeroLinea">Número de Línea *</label>
            <InputText
              id="numeroLinea"
              value={formData.numeroLinea}
              onChange={(e) => setFormData({ ...formData, numeroLinea: e.target.value })}
              placeholder="Ej: LC-2025-001"
            />
          </div>
        </div>

        <div className="col-12 md:col-6">
          <div className="field">
            <label htmlFor="tipoLinea">Tipo de Línea *</label>
            <Dropdown
              id="tipoLinea"
              value={formData.tipoLinea}
              options={tiposLinea}
              onChange={(e) => setFormData({ ...formData, tipoLinea: e.value })}
              placeholder="Seleccione tipo de línea"
            />
          </div>
        </div>

        <div className="col-12 md:col-4">
          <div className="field">
            <label htmlFor="montoAprobado">Monto Aprobado *</label>
            <InputNumber
              id="montoAprobado"
              value={formData.montoAprobado}
              onValueChange={(e) => setFormData({ ...formData, montoAprobado: e.value })}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
            />
          </div>
        </div>

        <div className="col-12 md:col-4">
          <div className="field">
            <label htmlFor="monedaId">Moneda *</label>
            <Dropdown
              id="monedaId"
              value={formData.monedaId}
              options={monedas}
              onChange={(e) => setFormData({ ...formData, monedaId: e.value })}
              placeholder="Seleccione moneda"
              filter
            />
          </div>
        </div>

        <div className="col-12 md:col-4">
          <div className="field">
            <label htmlFor="tasaInteres">Tasa de Interés (%) *</label>
            <InputNumber
              id="tasaInteres"
              value={formData.tasaInteres}
              onValueChange={(e) => setFormData({ ...formData, tasaInteres: e.value })}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={4}
              suffix="%"
            />
          </div>
        </div>

        <div className="col-12 md:col-6">
          <div className="field">
            <label htmlFor="comisionMantenimiento">Comisión Mantenimiento</label>
            <InputNumber
              id="comisionMantenimiento"
              value={formData.comisionMantenimiento}
              onValueChange={(e) => setFormData({ ...formData, comisionMantenimiento: e.value })}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
            />
          </div>
        </div>

        <div className="col-12 md:col-6">
          <div className="field">
            <label htmlFor="comisionUtilizacion">Comisión Utilización (%)</label>
            <InputNumber
              id="comisionUtilizacion"
              value={formData.comisionUtilizacion}
              onValueChange={(e) => setFormData({ ...formData, comisionUtilizacion: e.value })}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={4}
              suffix="%"
            />
          </div>
        </div>

        <div className="col-12 md:col-6">
          <div className="field">
            <label htmlFor="fechaAprobacion">Fecha de Aprobación *</label>
            <Calendar
              id="fechaAprobacion"
              value={formData.fechaAprobacion}
              onChange={(e) => setFormData({ ...formData, fechaAprobacion: e.value })}
              dateFormat="dd/mm/yy"
              showIcon
            />
          </div>
        </div>

        <div className="col-12 md:col-6">
          <div className="field">
            <label htmlFor="fechaVencimiento">Fecha de Vencimiento *</label>
            <Calendar
              id="fechaVencimiento"
              value={formData.fechaVencimiento}
              onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.value })}
              dateFormat="dd/mm/yy"
              showIcon
            />
          </div>
        </div>

        <div className="col-12 md:col-6">
          <div className="field">
            <label htmlFor="estadoId">Estado *</label>
            <Dropdown
              id="estadoId"
              value={formData.estadoId}
              options={estados}
              onChange={(e) => setFormData({ ...formData, estadoId: e.value })}
              placeholder="Seleccione un estado"
            />
          </div>
        </div>

        <div className="col-12">
          <div className="field">
            <label htmlFor="observaciones">Observaciones</label>
            <InputTextarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-content-end gap-2 mt-3">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-secondary"
          onClick={onCancel}
          disabled={loading}
        />
        <Button
          label="Guardar"
          icon="pi pi-check"
          onClick={handleSubmit}
          loading={loading}
        />
      </div>
    </div>
  );
});

LineaCreditoForm.displayName = 'LineaCreditoForm';

export default LineaCreditoForm;