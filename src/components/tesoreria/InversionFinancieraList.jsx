import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { getAllInversionFinanciera, deleteInversionFinanciera } from '../../api/tesoreria/inversionFinanciera';

const InversionFinancieraList = ({ onEdit, onNew, refreshTrigger }) => {
  const toast = useRef(null);
  const [inversiones, setInversiones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');

  useEffect(() => {
    cargarInversiones();
  }, [refreshTrigger]);

  const cargarInversiones = async () => {
    setLoading(true);
    try {
      const data = await getAllInversionFinanciera();
      setInversiones(data);
    } catch (error) {
      toast.current?.show({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Error al cargar inversiones financieras', 
        life: 3000 
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmarEliminar = (inversion) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la inversión ${inversion.numeroInversion}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => eliminarInversion(inversion.id)
    });
  };

  const eliminarInversion = async (id) => {
    try {
      await deleteInversionFinanciera(id);
      toast.current?.show({ 
        severity: 'success', 
        summary: 'Éxito', 
        detail: 'Inversión financiera eliminada', 
        life: 3000 
      });
      cargarInversiones();
    } catch (error) {
      toast.current?.show({ 
        severity: 'error', 
        summary: 'Error', 
        detail: error.response?.data?.message || 'Error al eliminar inversión financiera', 
        life: 3000 
      });
    }
  };

  const formatCurrency = (value, moneda = 'PEN') => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString('es-PE');
  };

  const empresaBodyTemplate = (rowData) => {
    return rowData.empresa?.razonSocial || '';
  };

  const bancoBodyTemplate = (rowData) => {
    return rowData.banco?.nombre || 'N/A';
  };

  const tipoInversionBodyTemplate = (rowData) => {
    const tipoLabels = {
      'PLAZO_FIJO': 'Plazo Fijo',
      'FONDO_MUTUO': 'Fondo Mutuo',
      'BONOS': 'Bonos',
      'ACCIONES': 'Acciones',
      'CTS': 'CTS'
    };
    return tipoLabels[rowData.tipoInversion] || rowData.tipoInversion;
  };

  const montoInvertidoBodyTemplate = (rowData) => {
    const moneda = rowData.moneda?.codigo || 'PEN';
    return formatCurrency(rowData.montoInvertido, moneda);
  };

  const valorActualBodyTemplate = (rowData) => {
    const moneda = rowData.moneda?.codigo || 'PEN';
    return formatCurrency(rowData.valorActual, moneda);
  };

  const rendimientoBodyTemplate = (rowData) => {
    const moneda = rowData.moneda?.codigo || 'PEN';
    const rendimiento = Number(rowData.rendimientoAcumulado) || 0;
    const color = rendimiento >= 0 ? 'text-green-600' : 'text-red-600';
    return (
      <span className={color}>
        {formatCurrency(rendimiento, moneda)}
      </span>
    );
  };

  const tasaBodyTemplate = (rowData) => {
    return rowData.tasaRendimiento ? `${Number(rowData.tasaRendimiento).toFixed(2)}%` : 'N/A';
  };

  const estadoBodyTemplate = (rowData) => {
    const getSeverity = (estado) => {
      switch (estado?.descripcion?.toUpperCase()) {
        case 'VIGENTE': return 'success';
        case 'VENCIDA': return 'warning';
        case 'LIQUIDADA': return 'info';
        case 'CANCELADA': return 'danger';
        default: return 'secondary';
      }
    };

    return <Tag value={rowData.estado?.descripcion || ''} severity={getSeverity(rowData.estado)} />;
  };

  const fechaInversionBodyTemplate = (rowData) => {
    return formatDate(rowData.fechaInversion);
  };

  const fechaVencimientoBodyTemplate = (rowData) => {
    return formatDate(rowData.fechaVencimiento);
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-warning"
          onClick={() => onEdit(rowData)}
          tooltip="Editar"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger"
          onClick={() => confirmarEliminar(rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0">Inversiones Financieras</h4>
      <div className="flex gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <input
            type="text"
            className="p-inputtext p-component"
            placeholder="Buscar..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </span>
        <Button
          label="Nueva Inversión"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={onNew}
        />
      </div>
    </div>
  );

  return (
    <div className="card">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <DataTable
        value={inversiones}
        loading={loading}
        header={header}
        globalFilter={globalFilter}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        dataKey="id"
        emptyMessage="No se encontraron inversiones financieras"
        responsiveLayout="scroll"
      >
        <Column 
          field="numeroInversion" 
          header="N° Inversión" 
          sortable 
          style={{ minWidth: '10rem' }}
        />
        <Column 
          field="empresa.razonSocial" 
          header="Empresa" 
          body={empresaBodyTemplate}
          sortable 
          style={{ minWidth: '12rem' }}
        />
        <Column 
          field="banco.nombre" 
          header="Banco" 
          body={bancoBodyTemplate}
          sortable 
          style={{ minWidth: '10rem' }}
        />
        <Column 
          field="tipoInversion" 
          header="Tipo" 
          body={tipoInversionBodyTemplate}
          sortable 
          style={{ minWidth: '10rem' }}
        />
        <Column 
          field="descripcion" 
          header="Descripción" 
          sortable 
          style={{ minWidth: '15rem' }}
        />
        <Column 
          field="fechaInversion" 
          header="Fecha Inversión" 
          body={fechaInversionBodyTemplate}
          sortable 
          style={{ minWidth: '10rem' }}
        />
        <Column 
          field="fechaVencimiento" 
          header="Vencimiento" 
          body={fechaVencimientoBodyTemplate}
          sortable 
          style={{ minWidth: '10rem' }}
        />
        <Column 
          field="montoInvertido" 
          header="Monto Invertido" 
          body={montoInvertidoBodyTemplate}
          sortable 
          style={{ minWidth: '12rem' }}
        />
        <Column 
          field="valorActual" 
          header="Valor Actual" 
          body={valorActualBodyTemplate}
          sortable 
          style={{ minWidth: '12rem' }}
        />
        <Column 
          field="rendimientoAcumulado" 
          header="Rendimiento" 
          body={rendimientoBodyTemplate}
          sortable 
          style={{ minWidth: '12rem' }}
        />
        <Column 
          field="tasaRendimiento" 
          header="Tasa %" 
          body={tasaBodyTemplate}
          sortable 
          style={{ minWidth: '8rem' }}
        />
        <Column 
          field="estado.descripcion" 
          header="Estado" 
          body={estadoBodyTemplate}
          sortable 
          style={{ minWidth: '10rem' }}
        />
        <Column 
          body={actionBodyTemplate} 
          exportable={false} 
          style={{ minWidth: '8rem' }}
        />
      </DataTable>
    </div>
  );
};

export default InversionFinancieraList;
