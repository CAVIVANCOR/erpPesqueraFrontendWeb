// src/pages/CotizacionVentas.jsx
// Pantalla CRUD profesional para CotizacionVentas. Cumple regla transversal ERP Megui:
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
import { getAllCotizacionVentas, deleteCotizacionVentas } from '../api/cotizacionVentas';
import CotizacionVentasForm from '../components/cotizacionVentas/CotizacionVentasForm';

/**
 * Componente CotizacionVentas
 * Gestión CRUD de cotizaciones de ventas con patrón profesional ERP Megui
 */
const CotizacionVentas = () => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedCotizacion, setSelectedCotizacion] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarCotizaciones();
  }, []);

  const cargarCotizaciones = async () => {
    try {
      setLoading(true);
      const data = await getAllCotizacionVentas();
      setCotizaciones(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar cotizaciones de ventas'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setSelectedCotizacion(null);
    setIsEditing(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (cotizacion) => {
    setSelectedCotizacion(cotizacion);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setSelectedCotizacion(null);
    setIsEditing(false);
  };

  const confirmarEliminacion = (cotizacion) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la cotización ${cotizacion.id}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarCotizacion(cotizacion.id)
    });
  };

  const eliminarCotizacion = async (id) => {
    try {
      await deleteCotizacionVentas(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Cotización eliminada correctamente'
      });
      cargarCotizaciones();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar la cotización'
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

  const fechaRegistroTemplate = (rowData) => {
    return (
      <div>
        <div className="font-bold text-primary">COT-{String(rowData.id).padStart(6, '0')}</div>
        <div className="text-sm text-gray-600">{formatearFecha(rowData.fechaRegistro)}</div>
      </div>
    );
  };

  const empresaTemplate = (rowData) => {
    // Simulación de empresa basado en ID
    const empresas = {
      1: { razonSocial: 'Pesquera del Sur S.A.', ruc: '20123456789' },
      2: { razonSocial: 'Industrias Marinas SAC', ruc: '20987654321' },
      3: { razonSocial: 'Exportadora Oceánica EIRL', ruc: '20456789123' },
      4: { razonSocial: 'Pesca y Conservas del Norte', ruc: '20789123456' }
    };
    
    const empresa = empresas[rowData.empresaId] || { 
      razonSocial: `Empresa ${rowData.empresaId}`, 
      ruc: `20${String(rowData.empresaId).padStart(9, '0')}` 
    };
    
    return (
      <div>
        <div className="font-medium text-blue-600">{empresa.razonSocial}</div>
        <div className="text-sm text-gray-600">RUC: {empresa.ruc}</div>
      </div>
    );
  };

  const tipoProductoTemplate = (rowData) => {
    // Simulación de tipos de producto
    const tiposProducto = {
      1: { nombre: 'Harina de Pescado', descripcion: 'Prime', paraVentas: true },
      2: { nombre: 'Aceite de Pescado', descripcion: 'Crudo', paraVentas: true },
      3: { nombre: 'Conservas', descripcion: 'Atún en aceite', paraVentas: true },
      4: { nombre: 'Congelado', descripcion: 'Filete de pescado', paraVentas: true }
    };
    
    const tipo = tiposProducto[rowData.tipoProductoId] || { 
      nombre: `Tipo ${rowData.tipoProductoId}`, 
      descripcion: 'N/A',
      paraVentas: true
    };
    
    return (
      <div>
        <div className="font-medium">{tipo.nombre}</div>
        <div className="text-sm text-gray-600">{tipo.descripcion}</div>
        {tipo.paraVentas && (
          <Tag value="Para Ventas" severity="success" className="text-xs mt-1" />
        )}
      </div>
    );
  };

  const clienteTemplate = (rowData) => {
    // Simulación de clientes
    const clientes = {
      1: { razonSocial: 'Distribuidora Internacional SAC', pais: 'Perú' },
      2: { razonSocial: 'Global Fish Trading Ltd', pais: 'China' },
      3: { razonSocial: 'European Seafood Import', pais: 'España' },
      4: { razonSocial: 'Asian Marine Products', pais: 'Japón' }
    };
    
    const cliente = clientes[rowData.clienteId] || { 
      razonSocial: `Cliente ${rowData.clienteId}`, 
      pais: 'N/A'
    };
    
    return (
      <div>
        <div className="font-medium text-green-600">{cliente.razonSocial}</div>
        <div className="text-sm text-gray-600">{cliente.pais}</div>
      </div>
    );
  };

  const estadoTemplate = (rowData) => {
    // Simulación de estados de cotización
    const estados = {
      1: { nombre: 'Borrador', severity: 'secondary' },
      2: { nombre: 'Enviada', severity: 'info' },
      3: { nombre: 'Aprobada', severity: 'success' },
      4: { nombre: 'Rechazada', severity: 'danger' },
      5: { nombre: 'Vencida', severity: 'warning' },
      6: { nombre: 'Convertida', severity: 'success' }
    };
    
    const estado = estados[rowData.estadoCotizacionId] || { 
      nombre: 'Borrador', 
      severity: 'secondary'
    };
    
    return (
      <Tag 
        value={estado.nombre} 
        severity={estado.severity} 
      />
    );
  };

  const fechasTemplate = (rowData) => {
    return (
      <div className="text-sm">
        <div>
          <span className="font-medium">Entrega:</span> {formatearFecha(rowData.fechaEntrega)}
        </div>
        {rowData.fechaZarpe && (
          <div>
            <span className="font-medium">Zarpe:</span> {formatearFecha(rowData.fechaZarpe)}
          </div>
        )}
        {rowData.fechaArribo && (
          <div>
            <span className="font-medium">Arribo:</span> {formatearFecha(rowData.fechaArribo)}
          </div>
        )}
      </div>
    );
  };

  const responsablesTemplate = (rowData) => {
    // Simulación de responsables
    const personal = {
      1: { nombres: 'Carlos', apellidos: 'Mendoza García', cargo: 'Jefe Ventas' },
      2: { nombres: 'Ana María', apellidos: 'Torres Vega', cargo: 'Supervisor Embarque' },
      3: { nombres: 'Luis Alberto', apellidos: 'Ramírez Silva', cargo: 'Jefe Producción' },
      4: { nombres: 'Patricia', apellidos: 'Flores Díaz', cargo: 'Jefe Almacén' }
    };
    
    const respVentas = personal[rowData.respVentasId] || { nombres: 'N/A', apellidos: '', cargo: '' };
    const respEmbarque = personal[rowData.respEmbarqueId] || { nombres: 'N/A', apellidos: '', cargo: '' };
    
    return (
      <div className="text-sm">
        <div>
          <span className="font-medium">Ventas:</span> {respVentas.nombres} {respVentas.apellidos}
        </div>
        <div>
          <span className="font-medium">Embarque:</span> {respEmbarque.nombres} {respEmbarque.apellidos}
        </div>
      </div>
    );
  };

  const destinoTemplate = (rowData) => {
    // Simulación de destinos
    const destinos = {
      1: { nombre: 'Exportación', descripcion: 'Mercado Internacional' },
      2: { nombre: 'Nacional', descripcion: 'Mercado Local' },
      3: { nombre: 'Zona Franca', descripcion: 'Zona Especial' },
      4: { nombre: 'Reexportación', descripcion: 'Tránsito' }
    };
    
    const destino = destinos[rowData.destinoProductoId] || { 
      nombre: `Destino ${rowData.destinoProductoId}`, 
      descripcion: 'N/A'
    };
    
    return (
      <div>
        <div className="font-medium">{destino.nombre}</div>
        <div className="text-sm text-gray-600">{destino.descripcion}</div>
      </div>
    );
  };

  const montosTemplate = (rowData) => {
    const tipoCambio = rowData.tipoCambio || 3.75;
    const montoAdelantado = rowData.montoAdelantadoCliente || 0;
    
    return (
      <div className="text-right">
        <div className="font-medium">
          T.C: {Number(tipoCambio).toFixed(2)}
        </div>
        {montoAdelantado > 0 && (
          <div className="text-green-600">
            Adelanto: {formatearMoneda(montoAdelantado)}
          </div>
        )}
      </div>
    );
  };

  const logisticaTemplate = (rowData) => {
    // Simulación de datos logísticos
    const incoterms = {
      1: 'FOB',
      2: 'CIF',
      3: 'CFR',
      4: 'EXW'
    };
    
    const puertos = {
      1: 'Callao',
      2: 'Paita',
      3: 'Chimbote',
      4: 'Ilo'
    };
    
    const incoterm = incoterms[rowData.incotermsId] || 'FOB';
    const puertoCarga = puertos[rowData.puertoCargaId] || 'N/A';
    
    return (
      <div className="text-sm">
        <div>
          <span className="font-medium">Incoterm:</span> {incoterm}
        </div>
        <div>
          <span className="font-medium">Puerto:</span> {puertoCarga}
        </div>
        {rowData.pesoMaximoContenedor && (
          <div>
            <span className="font-medium">Peso Max:</span> {Number(rowData.pesoMaximoContenedor).toFixed(2)} TM
          </div>
        )}
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
    <div className="cotizacion-ventas-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Cotizaciones de Ventas</h2>
          <Button
            label="Nueva Cotización"
            icon="pi pi-plus"
            onClick={abrirDialogoNuevo}
            className="p-button-primary"
          />
        </div>

        <DataTable
          value={cotizaciones}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          onRowClick={onRowClick}
          selectionMode="single"
          className="datatable-responsive"
          emptyMessage="No se encontraron cotizaciones de ventas"
          scrollable
          scrollHeight="600px"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} frozen />
          <Column 
            field="fechaRegistro" 
            header="N° Cotización" 
            body={fechaRegistroTemplate}
            sortable 
            style={{ width: '150px' }}
          />
          <Column 
            field="empresaId" 
            header="Empresa" 
            body={empresaTemplate}
            sortable 
            style={{ width: '200px' }}
          />
          <Column 
            field="tipoProductoId" 
            header="Tipo Producto" 
            body={tipoProductoTemplate}
            sortable 
            style={{ width: '180px' }}
          />
          <Column 
            field="clienteId" 
            header="Cliente" 
            body={clienteTemplate}
            sortable 
            style={{ width: '200px' }}
          />
          <Column 
            field="destinoProductoId" 
            header="Destino" 
            body={destinoTemplate}
            sortable 
            style={{ width: '150px' }}
          />
          <Column 
            field="estadoCotizacionId" 
            header="Estado" 
            body={estadoTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-center"
          />
          <Column 
            header="Fechas" 
            body={fechasTemplate}
            style={{ width: '150px' }}
          />
          <Column 
            header="Responsables" 
            body={responsablesTemplate}
            style={{ width: '180px' }}
          />
          <Column 
            header="Logística" 
            body={logisticaTemplate}
            style={{ width: '150px' }}
          />
          <Column 
            header="Montos" 
            body={montosTemplate}
            style={{ width: '120px' }}
            className="text-right"
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
        style={{ width: '1200px' }}
        header={isEditing ? 'Editar Cotización de Ventas' : 'Nueva Cotización de Ventas'}
        modal
        onHide={cerrarDialogo}
      >
        <CotizacionVentasForm
          cotizacion={selectedCotizacion}
          onSave={() => {
            cargarCotizaciones();
            cerrarDialogo();
          }}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default CotizacionVentas;
