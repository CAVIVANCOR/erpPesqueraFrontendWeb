// src/pages/DetDocTripulantesFaenaConsumo.jsx
// Pantalla CRUD profesional para DetDocTripulantesFaenaConsumo. Cumple regla transversal ERP Megui:
// - Edición por clic en fila, borrado seguro con roles, ConfirmDialog, Toast
// - Autenticación JWT desde Zustand, normalización de IDs, documentación en español
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { useAuthStore } from '../shared/stores/useAuthStore';
import { getAllDetDocTripulantesFaenaConsumo, deleteDetDocTripulantesFaenaConsumo } from '../api/detDocTripulantesFaenaConsumo';
import DetDocTripulantesFaenaConsumoForm from '../components/detDocTripulantesFaenaConsumo/DetDocTripulantesFaenaConsumoForm';

/**
 * Componente DetDocTripulantesFaenaConsumo
 * Gestión CRUD de documentación de tripulantes de faenas con patrón profesional ERP Megui
 */
const DetDocTripulantesFaenaConsumo = () => {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedDocumento, setSelectedDocumento] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarDocumentos();
  }, []);

  const cargarDocumentos = async () => {
    try {
      setLoading(true);
      const data = await getAllDetDocTripulantesFaenaConsumo();
      setDocumentos(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar documentos de tripulantes'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setSelectedDocumento(null);
    setIsEditing(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (documento) => {
    setSelectedDocumento(documento);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setSelectedDocumento(null);
    setIsEditing(false);
  };

  const confirmarEliminacion = (documento) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el documento "${documento.numeroDocumento || 'ID: ' + documento.id}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarDocumento(documento.id)
    });
  };

  const eliminarDocumento = async (id) => {
    try {
      await deleteDetDocTripulantesFaenaConsumo(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Documento eliminado correctamente'
      });
      cargarDocumentos();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar el documento'
      });
    }
  };

  const onRowClick = (event) => {
    abrirDialogoEdicion(event.data);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const fechaEmisionTemplate = (rowData) => {
    return formatearFecha(rowData.fechaEmision);
  };

  const fechaVencimientoTemplate = (rowData) => {
    if (!rowData.fechaVencimiento) return '';
    
    const fechaVenc = new Date(rowData.fechaVencimiento);
    const ahora = new Date();
    const diasRestantes = Math.ceil((fechaVenc - ahora) / (1000 * 60 * 60 * 24));
    
    let className = '';
    if (diasRestantes < 0) {
      className = 'text-red-600 font-bold'; // Vencido
    } else if (diasRestantes <= 30) {
      className = 'text-orange-600 font-semibold'; // Por vencer
    }
    
    return (
      <span className={className}>
        {formatearFecha(rowData.fechaVencimiento)}
        {diasRestantes < 0 && ' (Vencido)'}
        {diasRestantes >= 0 && diasRestantes <= 30 && ` (${diasRestantes}d)`}
      </span>
    );
  };

  const estadoVencimientoTemplate = (rowData) => {
    if (!rowData.fechaVencimiento) return '';
    
    const fechaVenc = new Date(rowData.fechaVencimiento);
    const ahora = new Date();
    const diasRestantes = Math.ceil((fechaVenc - ahora) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes < 0) {
      return <Tag value="Vencido" severity="danger" />;
    } else if (diasRestantes <= 30) {
      return <Tag value="Por Vencer" severity="warning" />;
    } else {
      return <Tag value="Vigente" severity="success" />;
    }
  };

  const estadoVerificadoTemplate = (rowData) => {
    return (
      <Tag 
        value={rowData.verificado ? 'Verificado' : 'Sin Verificar'} 
        severity={rowData.verificado ? 'success' : 'secondary'} 
      />
    );
  };

  const observacionesTemplate = (rowData) => {
    if (!rowData.observaciones) return '';
    return (
      <span title={rowData.observaciones}>
        {rowData.observaciones.length > 30 ? 
          `${rowData.observaciones.substring(0, 30)}...` : 
          rowData.observaciones}
      </span>
    );
  };

  const documentoTemplate = (rowData) => {
    if (!rowData.urlDocTripulantePdf) return '';
    return (
      <Button
        icon="pi pi-file-pdf"
        className="p-button-rounded p-button-text p-button-sm"
        onClick={(e) => {
          e.stopPropagation();
          window.open(rowData.urlDocTripulantePdf, '_blank');
        }}
        tooltip="Ver documento PDF"
      />
    );
  };

  const accionesTemplate = (rowData) => {
    // Solo mostrar botón eliminar para superusuario o admin
    const puedeEliminar = usuario?.esSuperUsuario || usuario?.esAdmin;
    
    return (
      <div className="flex gap-2">
        {puedeEliminar && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-danger p-button-sm"
            onClick={(e) => {
              e.stopPropagation();
              confirmarEliminacion(rowData);
            }}
            tooltip="Eliminar"
          />
        )}
      </div>
    );
  };

  return (
    <div className="det-doc-tripulantes-faena-consumo-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Documentos de Tripulantes - Faenas de Consumo</h2>
          <Button
            label="Nuevo Documento"
            icon="pi pi-plus"
            onClick={abrirDialogoNuevo}
            className="p-button-primary"
          />
        </div>

        <DataTable
          value={documentos}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          onRowClick={onRowClick}
          selectionMode="single"
          className="datatable-responsive"
          emptyMessage="No se encontraron documentos"
          scrollable
          scrollHeight="600px"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} frozen />
          <Column field="faenaPescaConsumoId" header="Faena ID" sortable style={{ width: '100px' }} />
          <Column field="tripulanteId" header="Tripulante ID" sortable style={{ width: '120px' }} />
          <Column field="documentoId" header="Documento ID" sortable style={{ width: '130px' }} />
          <Column 
            field="numeroDocumento" 
            header="Número" 
            sortable 
            style={{ width: '150px' }}
            body={(rowData) => (
              <span className="font-semibold">{rowData.numeroDocumento || 'Sin número'}</span>
            )}
          />
          <Column 
            field="fechaEmision" 
            header="F. Emisión" 
            body={fechaEmisionTemplate}
            sortable 
            style={{ width: '120px' }}
          />
          <Column 
            field="fechaVencimiento" 
            header="F. Vencimiento" 
            body={fechaVencimientoTemplate}
            sortable 
            style={{ width: '150px' }}
          />
          <Column 
            header="Estado" 
            body={estadoVencimientoTemplate}
            style={{ width: '120px' }}
            className="text-center"
          />
          <Column 
            field="verificado" 
            header="Verificación" 
            body={estadoVerificadoTemplate}
            sortable 
            style={{ width: '130px' }}
            className="text-center"
          />
          <Column 
            field="observaciones" 
            header="Observaciones" 
            body={observacionesTemplate}
            sortable 
            style={{ minWidth: '150px' }}
          />
          <Column 
            header="Documento" 
            body={documentoTemplate}
            style={{ width: '100px' }}
            className="text-center"
          />
          <Column
            header="Acciones"
            body={accionesTemplate}
            style={{ width: '100px' }}
            className="text-center"
            frozen
            alignFrozen="right"
          />
        </DataTable>
      </div>

      <Dialog
        visible={dialogVisible}
        style={{ width: '900px' }}
        header={isEditing ? 'Editar Documento' : 'Nuevo Documento'}
        modal
        onHide={cerrarDialogo}
      >
        <DetDocTripulantesFaenaConsumoForm
          documento={selectedDocumento}
          onSave={() => {
            cargarDocumentos();
            cerrarDialogo();
          }}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default DetDocTripulantesFaenaConsumo;
