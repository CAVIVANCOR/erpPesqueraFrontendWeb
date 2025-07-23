// src/pages/LiqNovedadPescaConsumo.jsx
// Pantalla CRUD profesional para LiqNovedadPescaConsumo. Cumple regla transversal ERP Megui:
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
import { getAllLiqNovedadPescaConsumo, deleteLiqNovedadPescaConsumo } from '../api/liqNovedadPescaConsumo';
import LiqNovedadPescaConsumoForm from '../components/liqNovedadPescaConsumo/LiqNovedadPescaConsumoForm';

/**
 * Componente LiqNovedadPescaConsumo
 * Gestión CRUD de liquidaciones de novedades de pesca de consumo con patrón profesional ERP Megui
 */
const LiqNovedadPescaConsumo = () => {
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedLiquidacion, setSelectedLiquidacion] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarLiquidaciones();
  }, []);

  const cargarLiquidaciones = async () => {
    try {
      setLoading(true);
      const data = await getAllLiqNovedadPescaConsumo();
      setLiquidaciones(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar liquidaciones de novedad'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setSelectedLiquidacion(null);
    setIsEditing(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (liquidacion) => {
    setSelectedLiquidacion(liquidacion);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setSelectedLiquidacion(null);
    setIsEditing(false);
  };

  const confirmarEliminacion = (liquidacion) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la liquidación ${liquidacion.numeroLiquidacion}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarLiquidacion(liquidacion.id)
    });
  };

  const eliminarLiquidacion = async (id) => {
    try {
      await deleteLiqNovedadPescaConsumo(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Liquidación eliminada correctamente'
      });
      cargarLiquidaciones();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar la liquidación'
      });
    }
  };

  const onRowClick = (event) => {
    abrirDialogoEdicion(event.data);
  };

  const formatearMoneda = (valor) => {
    if (!valor) return 'S/ 0.00';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const numeroLiquidacionTemplate = (rowData) => {
    return (
      <div>
        <div className="font-bold text-primary">{rowData.numeroLiquidacion}</div>
        <div className="text-sm text-gray-600">{formatearFecha(rowData.fechaLiquidacion)}</div>
      </div>
    );
  };

  const novedadTemplate = (rowData) => {
    // Simulación de novedad basado en ID
    const novedades = {
      1: { numero: 'NOV-2024-001', tipo: 'AVERIA_MOTOR', descripcion: 'Avería en motor principal' },
      2: { numero: 'NOV-2024-002', tipo: 'MAL_TIEMPO', descripcion: 'Condiciones climáticas adversas' },
      3: { numero: 'NOV-2024-003', tipo: 'FALTA_PESCA', descripcion: 'Escasez de recursos pesqueros' },
      4: { numero: 'NOV-2024-004', tipo: 'ACCIDENTE', descripcion: 'Accidente de tripulante' }
    };
    
    const novedad = novedades[rowData.novedadPescaConsumoId] || { 
      numero: `NOV-${rowData.novedadPescaConsumoId}`, 
      tipo: 'OTROS',
      descripcion: 'Novedad no especificada'
    };
    
    const getSeverity = (tipo) => {
      switch (tipo) {
        case 'AVERIA_MOTOR': return 'danger';
        case 'MAL_TIEMPO': return 'warning';
        case 'FALTA_PESCA': return 'info';
        case 'ACCIDENTE': return 'danger';
        default: return 'secondary';
      }
    };
    
    return (
      <div>
        <div className="font-medium text-blue-600">{novedad.numero}</div>
        <div className="text-sm text-gray-600">{novedad.descripcion}</div>
        <Tag value={novedad.tipo} severity={getSeverity(novedad.tipo)} className="text-xs mt-1" />
      </div>
    );
  };

  const empresaTemplate = (rowData) => {
    // Simulación de empresa basado en ID
    const empresas = {
      1: { razonSocial: 'Pesquera del Norte S.A.', ruc: '20123456789' },
      2: { razonSocial: 'Industrias Marinas del Pacífico S.A.C.', ruc: '20234567890' },
      3: { razonSocial: 'Conservera San Martín S.A.', ruc: '20345678901' }
    };
    
    const empresa = empresas[rowData.empresaId] || { 
      razonSocial: `Empresa ${rowData.empresaId}`, 
      ruc: 'N/A' 
    };
    
    return (
      <div>
        <div className="font-medium">{empresa.razonSocial}</div>
        <div className="text-sm text-gray-600">RUC: {empresa.ruc}</div>
      </div>
    );
  };

  const responsableTemplate = (rowData) => {
    if (!rowData.responsableLiquidacion) return <span className="text-gray-400">Sin asignar</span>;
    
    // Simulación de personal basado en ID
    const personal = {
      1: { nombres: 'Carlos', apellidos: 'Mendoza García', cargo: 'Jefe de Operaciones' },
      2: { nombres: 'Ana María', apellidos: 'Torres Vega', cargo: 'Supervisora de Pesca' },
      3: { nombres: 'Luis Alberto', apellidos: 'Ramírez Silva', cargo: 'Contador' },
      4: { nombres: 'Patricia', apellidos: 'Flores Díaz', cargo: 'Administradora' }
    };
    
    const responsable = personal[rowData.responsableLiquidacion] || { 
      nombres: 'Personal', 
      apellidos: `${rowData.responsableLiquidacion}`,
      cargo: 'N/A'
    };
    
    return (
      <div>
        <div className="font-medium">{responsable.nombres} {responsable.apellidos}</div>
        <div className="text-sm text-gray-600">{responsable.cargo}</div>
      </div>
    );
  };

  const verificadorTemplate = (rowData) => {
    if (!rowData.verificadoPor) return <span className="text-gray-400">Sin verificar</span>;
    
    // Simulación de personal basado en ID
    const personal = {
      1: { nombres: 'Carlos', apellidos: 'Mendoza García', cargo: 'Jefe de Operaciones' },
      2: { nombres: 'Ana María', apellidos: 'Torres Vega', cargo: 'Supervisora de Pesca' },
      3: { nombres: 'Luis Alberto', apellidos: 'Ramírez Silva', cargo: 'Contador' },
      4: { nombres: 'Patricia', apellidos: 'Flores Díaz', cargo: 'Administradora' }
    };
    
    const verificador = personal[rowData.verificadoPor] || { 
      nombres: 'Personal', 
      apellidos: `${rowData.verificadoPor}`,
      cargo: 'N/A'
    };
    
    return (
      <div>
        <div className="font-medium text-green-600">{verificador.nombres} {verificador.apellidos}</div>
        <div className="text-sm text-gray-600">{verificador.cargo}</div>
        {rowData.fechaVerificacion && (
          <div className="text-xs text-gray-500">{formatearFecha(rowData.fechaVerificacion)}</div>
        )}
      </div>
    );
  };

  const estadoTemplate = (rowData) => {
    const getSeverity = (estado) => {
      switch (estado) {
        case 'BORRADOR': return 'secondary';
        case 'PENDIENTE': return 'warning';
        case 'APROBADA': return 'success';
        case 'RECHAZADA': return 'danger';
        case 'ANULADA': return 'danger';
        default: return 'secondary';
      }
    };

    const getLabel = (estado) => {
      switch (estado) {
        case 'BORRADOR': return 'Borrador';
        case 'PENDIENTE': return 'Pendiente';
        case 'APROBADA': return 'Aprobada';
        case 'RECHAZADA': return 'Rechazada';
        case 'ANULADA': return 'Anulada';
        default: return estado || 'Borrador';
      }
    };

    return (
      <Tag 
        value={getLabel(rowData.estado)} 
        severity={getSeverity(rowData.estado)} 
      />
    );
  };

  const montosTemplate = (rowData) => {
    return (
      <div className="text-right">
        <div className="font-bold text-green-600">{formatearMoneda(rowData.totalIngresos)}</div>
        <div className="text-sm text-red-600">{formatearMoneda(rowData.totalEgresos)}</div>
        <div className="text-sm font-medium text-blue-600">{formatearMoneda(rowData.saldoFinal)}</div>
      </div>
    );
  };

  const fechasTemplate = (rowData) => {
    return (
      <div className="text-sm">
        <div>
          <span className="font-medium">Inicio:</span> {formatearFecha(rowData.fechaInicio)}
        </div>
        <div>
          <span className="font-medium">Fin:</span> {formatearFecha(rowData.fechaFin)}
        </div>
        {rowData.fechaAprobacion && (
          <div className="text-green-600">
            <span className="font-medium">Aprobada:</span> {formatearFecha(rowData.fechaAprobacion)}
          </div>
        )}
      </div>
    );
  };

  const tipoNovedadTemplate = (rowData) => {
    const getSeverity = (tipo) => {
      switch (tipo) {
        case 'OPERACIONAL': return 'info';
        case 'TECNICA': return 'warning';
        case 'ADMINISTRATIVA': return 'secondary';
        case 'EMERGENCIA': return 'danger';
        default: return 'secondary';
      }
    };

    const getLabel = (tipo) => {
      switch (tipo) {
        case 'OPERACIONAL': return 'Operacional';
        case 'TECNICA': return 'Técnica';
        case 'ADMINISTRATIVA': return 'Administrativa';
        case 'EMERGENCIA': return 'Emergencia';
        default: return tipo || 'Operacional';
      }
    };

    return (
      <Tag 
        value={getLabel(rowData.tipoNovedad)} 
        severity={getSeverity(rowData.tipoNovedad)} 
      />
    );
  };

  const impactoTemplate = (rowData) => {
    const getSeverity = (impacto) => {
      switch (impacto) {
        case 'BAJO': return 'success';
        case 'MEDIO': return 'warning';
        case 'ALTO': return 'danger';
        case 'CRITICO': return 'danger';
        default: return 'secondary';
      }
    };

    const getLabel = (impacto) => {
      switch (impacto) {
        case 'BAJO': return 'Bajo';
        case 'MEDIO': return 'Medio';
        case 'ALTO': return 'Alto';
        case 'CRITICO': return 'Crítico';
        default: return impacto || 'Bajo';
      }
    };

    return (
      <Tag 
        value={getLabel(rowData.impactoEconomico)} 
        severity={getSeverity(rowData.impactoEconomico)} 
      />
    );
  };

  const documentosTemplate = (rowData) => {
    const documentos = [];
    if (rowData.urlPdfLiquidacion) documentos.push('PDF');
    if (rowData.urlExcelDetalle) documentos.push('Excel');
    if (rowData.numeroActaConformidad) documentos.push('Acta');
    
    if (documentos.length === 0) return <span className="text-gray-400">Sin documentos</span>;
    
    return (
      <div className="flex gap-1">
        {documentos.map((doc, index) => (
          <Tag key={index} value={doc} severity="info" className="text-xs" />
        ))}
      </div>
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
    <div className="liq-novedad-pesca-consumo-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Liquidaciones de Novedad - Pesca Consumo</h2>
          <Button
            label="Nueva Liquidación"
            icon="pi pi-plus"
            onClick={abrirDialogoNuevo}
            className="p-button-primary"
          />
        </div>

        <DataTable
          value={liquidaciones}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          onRowClick={onRowClick}
          selectionMode="single"
          className="datatable-responsive"
          emptyMessage="No se encontraron liquidaciones de novedad"
          scrollable
          scrollHeight="600px"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} frozen />
          <Column 
            field="numeroLiquidacion" 
            header="N° Liquidación" 
            body={numeroLiquidacionTemplate}
            sortable 
            style={{ width: '150px' }}
          />
          <Column 
            field="novedadPescaConsumoId" 
            header="Novedad" 
            body={novedadTemplate}
            sortable 
            style={{ width: '200px' }}
          />
          <Column 
            field="empresaId" 
            header="Empresa" 
            body={empresaTemplate}
            sortable 
            style={{ width: '200px' }}
          />
          <Column 
            field="tipoNovedad" 
            header="Tipo" 
            body={tipoNovedadTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-center"
          />
          <Column 
            field="impactoEconomico" 
            header="Impacto" 
            body={impactoTemplate}
            sortable 
            style={{ width: '100px' }}
            className="text-center"
          />
          <Column 
            field="responsableLiquidacion" 
            header="Responsable" 
            body={responsableTemplate}
            sortable 
            style={{ width: '180px' }}
          />
          <Column 
            field="verificadoPor" 
            header="Verificado Por" 
            body={verificadorTemplate}
            sortable 
            style={{ width: '180px' }}
          />
          <Column 
            field="estado" 
            header="Estado" 
            body={estadoTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-center"
          />
          <Column 
            header="Montos" 
            body={montosTemplate}
            style={{ width: '150px' }}
            className="text-right"
          />
          <Column 
            header="Fechas" 
            body={fechasTemplate}
            style={{ width: '150px' }}
          />
          <Column 
            header="Documentos" 
            body={documentosTemplate}
            style={{ width: '120px' }}
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
        style={{ width: '1000px' }}
        header={isEditing ? 'Editar Liquidación de Novedad' : 'Nueva Liquidación de Novedad'}
        modal
        onHide={cerrarDialogo}
      >
        <LiqNovedadPescaConsumoForm
          liquidacion={selectedLiquidacion}
          onSave={() => {
            cargarLiquidaciones();
            cerrarDialogo();
          }}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default LiqNovedadPescaConsumo;
