/**
 * Pantalla CRUD para gestión de Cotizaciones de Compra
 * 
 * Características implementadas:
 * - Edición profesional por clic en fila (abre modal de edición)
 * - Botón eliminar visible solo para superusuario/admin (usuario?.esSuperUsuario || usuario?.esAdmin)
 * - Confirmación de borrado con ConfirmDialog visual rojo y mensajes claros
 * - Feedback visual con Toast para éxito/error
 * - Cumple regla transversal ERP Megui completa
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { getCotizacionesCompras, eliminarCotizacionCompras } from '../api/cotizacionCompras';
import { useAuthStore } from '../shared/stores/useAuthStore';
import CotizacionCompraForm from '../components/cotizacionCompra/CotizacionCompraForm';

const CotizacionCompra = () => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [cotizacionAEliminar, setCotizacionAEliminar] = useState(null);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarCotizaciones();
  }, []);

  const cargarCotizaciones = async () => {
    try {
      setLoading(true);
      const data = await getCotizacionesCompras();
      setCotizaciones(data);
    } catch (error) {
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar cotizaciones de compra',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setCotizacionSeleccionada(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (cotizacion) => {
    setCotizacionSeleccionada(cotizacion);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setCotizacionSeleccionada(null);
  };

  const onGuardarExitoso = () => {
    cargarCotizaciones();
    cerrarDialogo();
    toast.current.show({
      severity: 'success',
      summary: 'Éxito',
      detail: cotizacionSeleccionada ? 'Cotización actualizada correctamente' : 'Cotización creada correctamente',
      life: 3000
    });
  };

  const confirmarEliminacion = (cotizacion) => {
    setCotizacionAEliminar(cotizacion);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      await eliminarCotizacionCompras(cotizacionAEliminar.id);
      setCotizaciones(cotizaciones.filter(c => c.id !== cotizacionAEliminar.id));
      toast.current.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Cotización eliminada correctamente',
        life: 3000
      });
    } catch (error) {
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar cotización',
        life: 3000
      });
    } finally {
      setConfirmVisible(false);
      setCotizacionAEliminar(null);
    }
  };

  const fechaTemplate = (rowData, field) => {
    if (!rowData[field.field]) return '-';
    return new Date(rowData[field.field]).toLocaleDateString('es-ES');
  };

  const montoTemplate = (rowData, field) => {
    if (!rowData[field.field]) return '-';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(rowData[field.field]);
  };

  const estadoTemplate = (rowData) => {
    const estados = {
      'BORRADOR': { label: 'Borrador', severity: 'info' },
      'ENVIADA': { label: 'Enviada', severity: 'warning' },
      'APROBADA': { label: 'Aprobada', severity: 'success' },
      'RECHAZADA': { label: 'Rechazada', severity: 'danger' },
      'VENCIDA': { label: 'Vencida', severity: 'secondary' },
      'CONVERTIDA': { label: 'Convertida', severity: 'success' }
    };
    
    const estado = estados[rowData.estado] || { label: rowData.estado, severity: 'info' };
    return <Tag value={estado.label} severity={estado.severity} />;
  };

  const empresaTemplate = (rowData) => {
    return rowData.empresa?.nombre || '-';
  };

  const proveedorTemplate = (rowData) => {
    return rowData.proveedor?.razonSocial || '-';
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-danger p-button-sm"
            onClick={() => confirmarEliminacion(rowData)}
            tooltip="Eliminar"
          />
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      
      <div className="flex justify-content-between align-items-center mb-4">
        <h2>Gestión de Cotizaciones de Compra</h2>
        <Button
          label="Nueva Cotización"
          icon="pi pi-plus"
          onClick={abrirDialogoNuevo}
        />
      </div>

      <DataTable
        value={cotizaciones}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron cotizaciones de compra"
        scrollable
        scrollHeight="600px"
      >
        <Column field="numero" header="Número" sortable style={{ width: '120px' }} />
        <Column field="empresa" header="Empresa" body={empresaTemplate} sortable />
        <Column field="proveedor" header="Proveedor" body={proveedorTemplate} sortable />
        <Column field="fechaCotizacion" header="Fecha Cotización" body={fechaTemplate} sortable style={{ width: '140px' }} />
        <Column field="fechaEntrega" header="Fecha Entrega" body={fechaTemplate} sortable style={{ width: '140px' }} />
        <Column field="montoTotal" header="Monto Total" body={montoTemplate} sortable style={{ width: '120px' }} />
        <Column field="estado" header="Estado" body={estadoTemplate} sortable style={{ width: '120px' }} />
        <Column body={accionesTemplate} header="Acciones" style={{ width: '8rem' }} />
      </DataTable>

      <Dialog
        header={cotizacionSeleccionada ? 'Editar Cotización de Compra' : 'Nueva Cotización de Compra'}
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: '90vw', maxWidth: '1200px' }}
        modal
        maximizable
      >
        <CotizacionCompraForm
          cotizacion={cotizacionSeleccionada}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
        />
      </Dialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar la cotización "${cotizacionAEliminar?.numero}"?`}
        header="Confirmar Eliminación"
        icon="pi pi-exclamation-triangle"
        accept={eliminar}
        reject={() => setConfirmVisible(false)}
        acceptLabel="Sí, Eliminar"
        rejectLabel="Cancelar"
        acceptClassName="p-button-danger"
      />
    </div>
  );
};

export default CotizacionCompra;
