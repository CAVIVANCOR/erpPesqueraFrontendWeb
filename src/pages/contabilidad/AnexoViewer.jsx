import React, { useMemo } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { formatearNumero } from "../../utils/utils";
import { getAnexoConfig, getCuentasParaAnexo, procesarDatosAnexo } from "./anexosConfig";

/**
 * Componente genérico para visualizar anexos del Balance General
 * Renderiza dinámicamente según la configuración del anexo
 */
const AnexoViewer = ({ 
  visible, 
  onHide, 
  numeroAnexo, 
  todasLasCuentas,
  empresaData,
  periodoData,
  onAnexoAnterior,
  onAnexoSiguiente,
  tieneAnterior,
  tieneSiguiente
}) => {
  
  // Obtener configuración del anexo
  const config = useMemo(() => {
    return getAnexoConfig(numeroAnexo);
  }, [numeroAnexo]);

  // Obtener cuentas filtradas para este anexo
  const cuentasAnexo = useMemo(() => {
    if (!config || !todasLasCuentas) return [];
    return getCuentasParaAnexo(numeroAnexo, todasLasCuentas);
  }, [numeroAnexo, todasLasCuentas, config]);

  // Procesar datos según configuración
  const datosAnexo = useMemo(() => {
    if (!config || cuentasAnexo.length === 0) return [];
    return procesarDatosAnexo(numeroAnexo, cuentasAnexo);
  }, [numeroAnexo, cuentasAnexo, config]);

  // Calcular total
  const totalAnexo = useMemo(() => {
    if (datosAnexo.length === 0) return 0;
    
    // Buscar el campo que contiene el monto principal
    const campoMonto = config?.columnas.find(col => 
      col.tipo === 'monto' && (col.field === 'saldo' || col.field === 'importe' || col.field === 'total' || col.field === 'costoTotal')
    );
    
    if (!campoMonto) return 0;
    
    return datosAnexo.reduce((sum, row) => {
      const valor = Number(row[campoMonto.field] || 0);
      return sum + (isNaN(valor) ? 0 : valor);
    }, 0);
  }, [datosAnexo, config]);

  if (!config) {
    return (
      <Dialog
        visible={visible}
        onHide={onHide}
        header="Anexo no encontrado"
        style={{ width: '50vw' }}
      >
        <p>No se encontró la configuración para el anexo {numeroAnexo}</p>
      </Dialog>
    );
  }

  // Template para renderizar celdas según tipo
  const cellTemplate = (rowData, column) => {
    const valor = rowData[column.field];
    
    // Si es un grupo o detalle, aplicar estilo especial
    if (rowData.esGrupo) {
      return <strong>{valor || ''}</strong>;
    }
    
    if (rowData.esDetalle) {
      return <span style={{ paddingLeft: '1rem', fontStyle: 'italic' }}>{valor || ''}</span>;
    }
    
    // Renderizar según tipo de columna
    switch (column.tipo) {
      case 'monto':
        if (valor === null || valor === undefined || valor === '') return '-';
        const num = Number(valor);
        if (isNaN(num) || Math.abs(num) < 0.01) return '-';
        return (
          <span style={{ fontWeight: rowData.esGrupo ? 'bold' : 'normal' }}>
            {formatearNumero(num, 2)}
          </span>
        );
      
      case 'cantidad':
        if (valor === null || valor === undefined || valor === '') return '-';
        return formatearNumero(Number(valor), 2);
      
      case 'porcentaje':
        if (valor === null || valor === undefined || valor === '') return '-';
        return `${formatearNumero(Number(valor), 2)}%`;
      
      default:
        return valor || '-';
    }
  };

  // Renderizar encabezado adicional (para anexos especiales como Capital)
  const renderEncabezadoAdicional = () => {
    if (!config.encabezadoAdicional) return null;
    
    const info = config.encabezadoAdicional(cuentasAnexo);
    
    return (
      <div style={{ 
        backgroundColor: '#F5F5F5', 
        padding: '1rem', 
        marginBottom: '1rem',
        borderRadius: '4px',
        border: '1px solid #E0E0E0'
      }}>
        <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>DETALLE DE LA PARTICIPACIÓN ACCIONARIA:</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
          <div><strong>Capital Social al {periodoData?.nombrePeriodo || ''}:</strong></div>
          <div>S/. {formatearNumero(info.capitalSocial, 2)}</div>
          
          <div><strong>Valor nominal por acción:</strong></div>
          <div>S/. {formatearNumero(info.valorNominal, 2)}</div>
          
          <div><strong>Número de acciones suscritas:</strong></div>
          <div>{formatearNumero(info.numeroAccionesSuscritas, 2)}</div>
          
          <div><strong>Número de acciones pagadas:</strong></div>
          <div>{formatearNumero(info.numeroAccionesPagadas, 2)}</div>
          
          <div><strong>Número de accionistas:</strong></div>
          <div>{info.numeroAccionistas}</div>
        </div>
        <Divider />
        <h4 style={{ marginBottom: '0.5rem' }}>ESTRUCTURA DE PARTICIPACIÓN ACCIONARIA:</h4>
      </div>
    );
  };

  // Header del diálogo
  const dialogHeader = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
          {empresaData?.razonSocial || 'EMPRESA'}
        </div>
        <div style={{ fontSize: '0.9rem' }}>
          RUC {empresaData?.ruc || ''}
        </div>
        <div style={{ fontSize: '0.9rem' }}>
          BALANCE GENERAL
        </div>
        <div style={{ fontSize: '0.9rem' }}>
          Al {periodoData?.nombrePeriodo || ''}
        </div>
        <div style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>
          (Expresado en Soles)
        </div>
      </div>
      <Divider />
      <div style={{ 
        backgroundColor: '#1976D2', 
        color: 'white', 
        padding: '0.75rem', 
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>
            ANEXO {config.numero}
          </div>
          <div style={{ fontSize: '0.9rem' }}>
            {config.titulo}
          </div>
        </div>
        <div style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>
          Cuenta{config.cuentas.length > 1 ? 's' : ''}: {config.cuentas.join(', ')}
        </div>
      </div>
    </div>
  );

  // Footer del diálogo con navegación
  const dialogFooter = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
      <Button
        label="◀ Anexo Anterior"
        icon="pi pi-chevron-left"
        onClick={onAnexoAnterior}
        disabled={!tieneAnterior}
        outlined
        size="small"
      />
      
      <div style={{ 
        flex: 1,
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '1.1rem',
        backgroundColor: '#FFEB3B',
        padding: '0.75rem',
        borderRadius: '4px',
        border: '2px solid #FBC02D'
      }}>
        SALDO FINAL TOTAL: S/. {formatearNumero(totalAnexo, 2)}
      </div>
      
      <Button
        label="Anexo Siguiente ▶"
        icon="pi pi-chevron-right"
        iconPos="right"
        onClick={onAnexoSiguiente}
        disabled={!tieneSiguiente}
        outlined
        size="small"
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={dialogHeader}
      footer={dialogFooter}
      style={{ width: '90vw', maxWidth: '1200px' }}
      maximizable
      modal
    >
      {renderEncabezadoAdicional()}
      
      <DataTable
        value={datosAnexo}
        size="small"
        stripedRows
        emptyMessage={`No hay datos para el anexo ${config.numero}`}
        scrollable
        scrollHeight="60vh"
        showGridlines
      >
        {config.columnas.map((columna, index) => (
          <Column
            key={index}
            field={columna.field}
            header={columna.header}
            body={(rowData) => cellTemplate(rowData, columna)}
            style={{ 
              width: columna.width, 
              textAlign: columna.align,
              fontSize: '0.85rem'
            }}
            headerStyle={{ 
              fontSize: '0.8rem', 
              fontWeight: 'bold',
              textAlign: columna.align,
              backgroundColor: '#E3F2FD'
            }}
          />
        ))}
      </DataTable>
      
      <Divider />
      
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
        <Button
          label="Volver al Balance General"
          icon="pi pi-arrow-left"
          onClick={onHide}
          severity="secondary"
        />
      </div>
    </Dialog>
  );
};

export default AnexoViewer;
