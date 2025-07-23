/**
 * Componente para gestión de Liquidaciones de Proceso de Compras de Producción
 * 
 * Características:
 * - CRUD completo con DataTable
 * - Edición por clic en fila
 * - Eliminación con confirmación (solo superusuario/admin)
 * - Gestión de responsables y verificadores
 * - Control de fechas de liquidación y verificación
 * - Gestión de saldos finales y documentos PDF
 * - Relación única con cotizaciones de compras
 * - Toast para feedback visual
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toolbar } from 'primereact/toolbar';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { getLiquidacionesProcesoComprasProd, crearLiquidacionProcesoComprasProd, actualizarLiquidacionProcesoComprasProd, eliminarLiquidacionProcesoComprasProd } from '../api/liquidacionProcesoComprasProd';
import { getCotizacionesCompras } from '../api/cotizacionCompras';
import { getEmpresas } from '../api/empresa';
import { getPersonal } from '../api/personal';
import { useAuthStore } from '../shared/stores/useAuthStore';
import LiquidacionProcesoComprasProdForm from '../components/liquidacionProcesoComprasProd/LiquidacionProcesoComprasProdForm';

/**
 * Componente principal para gestión de liquidaciones de proceso de compras de producción
 * Implementa las reglas transversales del ERP Megui
 */
const LiquidacionProcesoComprasProd = () => {
  // Estados principales
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Referencias y stores
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  /**
   * Cargar datos iniciales
   */
  useEffect(() => {
    cargarDatos();
  }, []);

  /**
   * Función para cargar todos los datos necesarios
   */
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [liquidacionesData, cotizacionesData, empresasData, personalData] = await Promise.all([
        getLiquidacionesProcesoComprasProd(),
        getCotizacionesCompras(),
        getEmpresas(),
        getPersonal()
      ]);
      
      setLiquidaciones(liquidacionesData);
      setCotizaciones(cotizacionesData);
      setEmpresas(empresasData);
      setPersonal(personalData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los datos',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manejar creación de nueva liquidación
   */
  const handleCreate = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  /**
   * Manejar edición de liquidación (clic en fila)
   */
  const handleEdit = (rowData) => {
    setEditingItem(rowData);
    setShowForm(true);
  };

  /**
   * Manejar eliminación de liquidación
   * Solo visible para superusuario o admin
   */
  const handleDelete = (rowData) => {
    const cotizacion = cotizaciones.find(c => Number(c.id) === Number(rowData.cotizacionComprasId));
    confirmDialog({
      message: `¿Está seguro de eliminar la liquidación de la cotización "${cotizacion?.numeroReferencia || 'Sin referencia'}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          await eliminarLiquidacionProcesoComprasProd(rowData.id);
          await cargarDatos();
          toast.current?.show({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Liquidación eliminada correctamente',
            life: 3000
          });
        } catch (error) {
          console.error('Error al eliminar:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Error al eliminar la liquidación',
            life: 3000
          });
        }
      }
    });
  };

  /**
   * Manejar guardado desde el formulario
   */
  const handleSave = async (data) => {
    try {
      if (editingItem) {
        await actualizarLiquidacionProcesoComprasProd(editingItem.id, data);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Liquidación actualizada correctamente',
          life: 3000
        });
      } else {
        await crearLiquidacionProcesoComprasProd(data);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Liquidación creada correctamente',
          life: 3000
        });
      }
      
      setShowForm(false);
      setEditingItem(null);
      await cargarDatos();
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Error al guardar la liquidación',
        life: 3000
      });
    }
  };

  /**
   * Template para mostrar cotización
   */
  const cotizacionTemplate = (rowData) => {
    const cotizacion = cotizaciones.find(c => Number(c.id) === Number(rowData.cotizacionComprasId));
    return cotizacion ? (
      <div>
        <div className="font-semibold">{cotizacion.numeroReferencia || 'Sin referencia'}</div>
        <div className="text-sm text-gray-600">{cotizacion.empresa?.nombre || 'Sin empresa'}</div>
      </div>
    ) : 'No encontrada';
  };

  /**
   * Template para mostrar empresa
   */
  const empresaTemplate = (rowData) => {
    const empresa = empresas.find(e => Number(e.id) === Number(rowData.empresaId));
    return empresa ? (
      <div>
        <div className="font-semibold">{empresa.nombre}</div>
        <div className="text-sm text-gray-600">{empresa.ruc || 'Sin RUC'}</div>
      </div>
    ) : 'No encontrada';
  };

  /**
   * Template para mostrar responsable
   */
  const responsableTemplate = (rowData) => {
    const responsable = personal.find(p => Number(p.id) === Number(rowData.responsableId));
    return responsable ? (
      <div>
        <div className="font-semibold">{responsable.nombres} {responsable.apellidos}</div>
        <div className="text-sm text-gray-600">{responsable.numeroDocumento || 'Sin documento'}</div>
      </div>
    ) : 'No encontrado';
  };

  /**
   * Template para mostrar verificador
   */
  const verificadorTemplate = (rowData) => {
    if (!rowData.verificadorId) {
      return <Tag value="Sin verificador" severity="warning" size="small" />;
    }
    
    const verificador = personal.find(p => Number(p.id) === Number(rowData.verificadorId));
    return verificador ? (
      <div>
        <div className="font-semibold">{verificador.nombres} {verificador.apellidos}</div>
        <div className="text-sm text-gray-600">{verificador.numeroDocumento || 'Sin documento'}</div>
      </div>
    ) : 'No encontrado';
  };

  /**
   * Template para mostrar fecha de liquidación
   */
  const fechaLiquidacionTemplate = (rowData) => {
    const fecha = new Date(rowData.fechaLiquidacion);
    return (
      <div>
        <div className="font-semibold">{fecha.toLocaleDateString('es-PE')}</div>
        <div className="text-sm text-gray-600">{fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    );
  };

  /**
   * Template para mostrar fecha de verificación
   */
  const fechaVerificacionTemplate = (rowData) => {
    if (!rowData.fechaVerificacion) {
      return <Tag value="Sin verificar" severity="warning" size="small" />;
    }
    
    const fecha = new Date(rowData.fechaVerificacion);
    return (
      <div>
        <div className="font-semibold">{fecha.toLocaleDateString('es-PE')}</div>
        <div className="text-sm text-gray-600">{fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    );
  };

  /**
   * Template para mostrar saldo final
   */
  const saldoFinalTemplate = (rowData) => {
    const saldo = Number(rowData.saldoFinal);
    return (
      <div className={`text-right font-semibold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        S/ {saldo.toFixed(2)}
      </div>
    );
  };

  /**
   * Template para mostrar estado de verificación
   */
  const estadoVerificacionTemplate = (rowData) => {
    const verificado = rowData.verificadorId && rowData.fechaVerificacion;
    return (
      <Tag
        value={verificado ? 'Verificada' : 'Pendiente'}
        severity={verificado ? 'success' : 'warning'}
        icon={verificado ? 'pi pi-check' : 'pi pi-clock'}
      />
    );
  };

  /**
   * Template para mostrar PDF
   */
  const pdfTemplate = (rowData) => {
    if (!rowData.urlPdfLiquidacion) {
      return <Tag value="Sin PDF" severity="secondary" size="small" />;
    }
    
    return (
      <Button
        icon="pi pi-file-pdf"
        rounded
        outlined
        severity="info"
        size="small"
        onClick={() => window.open(rowData.urlPdfLiquidacion, '_blank')}
        tooltip="Ver PDF"
        tooltipOptions={{ position: 'top' }}
      />
    );
  };

  /**
   * Template para acciones
   * Solo muestra eliminar para superusuario o admin
   */
  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            rounded
            outlined
            severity="danger"
            size="small"
            onClick={() => handleDelete(rowData)}
            tooltip="Eliminar"
            tooltipOptions={{ position: 'top' }}
          />
        )}
      </div>
    );
  };

  /**
   * Toolbar del componente
   */
  const toolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
        <h4 className="m-0">Liquidaciones de Proceso - Compras Producción</h4>
        <Button
          label="Nueva Liquidación"
          icon="pi pi-plus"
          onClick={handleCreate}
          className="p-button-primary"
        />
      </div>
    );
  };

  /**
   * Header del DataTable con filtro global
   */
  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0">Gestión de Liquidaciones</h4>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <input
          type="search"
          placeholder="Buscar..."
          className="p-inputtext p-component"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </span>
    </div>
  );

  return (
    <div className="liquidacionprocesocomprasprod-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <Card>
        <Toolbar className="mb-4" template={toolbarTemplate} />
        
        <DataTable
          value={liquidaciones}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          globalFilter={globalFilter}
          header={header}
          emptyMessage="No se encontraron liquidaciones"
          onRowClick={(e) => handleEdit(e.data)}
          selectionMode="single"
          className="datatable-responsive"
          scrollable
          scrollHeight="600px"
        >
          <Column 
            field="cotizacionCompras" 
            header="Cotización" 
            body={cotizacionTemplate}
            sortable
            style={{ minWidth: '200px' }}
          />
          <Column 
            field="empresa" 
            header="Empresa" 
            body={empresaTemplate}
            sortable
            style={{ minWidth: '200px' }}
          />
          <Column 
            field="responsable" 
            header="Responsable" 
            body={responsableTemplate}
            sortable
            style={{ minWidth: '200px' }}
          />
          <Column 
            field="verificador" 
            header="Verificador" 
            body={verificadorTemplate}
            sortable
            style={{ minWidth: '200px' }}
          />
          <Column 
            field="fechaLiquidacion" 
            header="Fecha Liquidación" 
            body={fechaLiquidacionTemplate}
            sortable
            style={{ minWidth: '150px' }}
          />
          <Column 
            field="fechaVerificacion" 
            header="Fecha Verificación" 
            body={fechaVerificacionTemplate}
            sortable
            style={{ minWidth: '150px' }}
          />
          <Column 
            field="estado" 
            header="Estado" 
            body={estadoVerificacionTemplate}
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column 
            field="saldoFinal" 
            header="Saldo Final" 
            body={saldoFinalTemplate}
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column 
            field="pdf" 
            header="PDF" 
            body={pdfTemplate}
            exportable={false}
            style={{ minWidth: '80px' }}
          />
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ minWidth: '100px' }}
            frozen
            alignFrozen="right"
          />
        </DataTable>
      </Card>

      {showForm && (
        <LiquidacionProcesoComprasProdForm
          visible={showForm}
          onHide={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          onSave={handleSave}
          editingItem={editingItem}
          cotizaciones={cotizaciones}
          empresas={empresas}
          personal={personal}
        />
      )}
    </div>
  );
};

export default LiquidacionProcesoComprasProd;
