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
    // Pasar todas las cuentas para anexos que necesitan cuentas relacionadas (ej: Anexo N°08)
    return procesarDatosAnexo(numeroAnexo, cuentasAnexo, todasLasCuentas);
  }, [numeroAnexo, cuentasAnexo, todasLasCuentas, config]);

  /**
   * Calcular totales por columna
   * Para anexos con múltiples columnas de montos (como Anexo N°08),
   * calcula la suma de cada columna tipo 'monto'
   */
  const totalesPorColumna = useMemo(() => {
    if (datosAnexo.length === 0 || !config) return {};
    
    const totales = {};
    
    // Calcular total para cada columna tipo 'monto'
    config.columnas.forEach(columna => {
      if (columna.tipo === 'monto') {
        totales[columna.field] = datosAnexo.reduce((sum, row) => {
          const valor = Number(row[columna.field] || 0);
          return sum + (isNaN(valor) ? 0 : valor);
        }, 0);
      }
    });
    
    return totales;
  }, [datosAnexo, config]);

  // Calcular total principal (para el footer del diálogo)
  const totalAnexo = useMemo(() => {
    if (datosAnexo.length === 0) return 0;
    
    // Buscar el campo que contiene el monto principal
    // Para Anexo N°08, usar 'valorNeto' (última columna)
    const campoMonto = config?.columnas.find(col => 
      col.tipo === 'monto' && (col.field === 'saldo' || col.field === 'importe' || col.field === 'total' || col.field === 'costoTotal' || col.field === 'valorNeto')
    );
    
    if (!campoMonto) return 0;
    
    return totalesPorColumna[campoMonto.field] || 0;
  }, [totalesPorColumna, config]);

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

  /**
   * Template para renderizar celdas según tipo
   * 
   * Maneja diferentes tipos de datos:
   * - monto: Números con formato de moneda
   * - cantidad: Números sin símbolo de moneda
   * - porcentaje: Números con símbolo %
   * - texto: Valores de texto normales
   * 
   * También aplica estilos especiales para grupos y detalles jerárquicos
   */
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
        if (isNaN(num)) return '-';
        
        // Para el Anexo N°08, mostrar depreciación acumulada como positivo
        // pero en color diferente para indicar que es una resta
        const esDepreciacion = column.field === 'depreciacionAcumulada';
        const esValorNeto = column.field === 'valorNeto';
        
        // Mostrar guion para valores muy pequeños (excepto si es exactamente 0)
        if (Math.abs(num) < 0.01 && num !== 0) return '-';
        
        return (
          <span style={{ 
            fontWeight: rowData.esGrupo ? 'bold' : 'normal',
            color: esDepreciacion ? '#D32F2F' : (esValorNeto ? '#1976D2' : 'inherit')
          }}>
            {esDepreciacion && num > 0 ? `(${formatearNumero(num, 2)})` : formatearNumero(num, 2)}
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
          {/* Mostrar información de cuentas involucradas */}
          {config.cuentasRestar ? (
            <div>
              <div>Cuenta{config.cuentas.length > 1 ? 's' : ''}: {config.cuentas.join(', ')} (Costo)</div>
              <div>(-) Cuenta{config.cuentasRestar.length > 1 ? 's' : ''}: {config.cuentasRestar.join(', ')} (Depreciación)</div>
            </div>
          ) : (
            <div>Cuenta{config.cuentas.length > 1 ? 's' : ''}: {config.cuentas.join(', ')}</div>
          )}
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
      
      {/* Nota explicativa especial para Anexo N°08 */}
      {numeroAnexo === 'N°08' && (
        <div style={{ 
          backgroundColor: '#FFF3E0', 
          border: '2px solid #FF9800',
          padding: '1rem', 
          marginBottom: '1rem',
          borderRadius: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <i className="pi pi-info-circle" style={{ fontSize: '1.2rem', color: '#FF9800' }}></i>
            <strong style={{ fontSize: '1rem', color: '#E65100' }}>CÁLCULO DEL VALOR NETO:</strong>
          </div>
          <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
            <div>• <strong style={{ color: '#1976D2' }}>Costo Histórico (Cuenta 33)</strong>: Valor de adquisición del activo fijo</div>
            <div>• <strong style={{ color: '#D32F2F' }}>Depreciación Acumulada (Cuenta 39)</strong>: Desgaste acumulado del activo (se resta)</div>
            <div>• <strong style={{ color: '#1976D2' }}>Valor Neto</strong>: Resultado de <code>Cuenta 33 - Cuenta 39</code></div>
          </div>
          <div style={{ 
            marginTop: '0.5rem', 
            padding: '0.5rem', 
            backgroundColor: '#FFFFFF', 
            borderRadius: '4px',
            fontSize: '0.85rem',
            fontStyle: 'italic'
          }}>
            💡 <strong>Nota:</strong> Los valores de depreciación acumulada se muestran en <span style={{ color: '#D32F2F' }}>rojo entre paréntesis</span> para indicar que se restan del costo histórico.
          </div>
        </div>
      )}
      
      <DataTable
        value={datosAnexo}
        size="small"
        stripedRows
        emptyMessage={`No hay datos para el anexo ${config.numero}`}
        scrollable
        scrollHeight="60vh"
        showGridlines
      >
        {config.columnas.map((columna, index) => {
          // Template para el footer de cada columna (totales)
          const footerTemplate = () => {
            // Solo mostrar total para columnas tipo 'monto'
            if (columna.tipo !== 'monto') {
              // Para la primera columna, mostrar etiqueta "TOTAL"
              if (index === 0) {
                return <strong style={{ fontSize: '0.9rem' }}>TOTAL</strong>;
              }
              return null;
            }
            
            const total = totalesPorColumna[columna.field] || 0;
            const esDepreciacion = columna.field === 'depreciacionAcumulada';
            const esValorNeto = columna.field === 'valorNeto';
            
            return (
              <div style={{ 
                textAlign: columna.align,
                fontWeight: 'bold',
                fontSize: '0.9rem',
                padding: '0.5rem',
                backgroundColor: '#FFEB3B',
                color: esDepreciacion ? '#D32F2F' : (esValorNeto ? '#1976D2' : '#000000')
              }}>
                {esDepreciacion && total > 0 ? `(${formatearNumero(total, 2)})` : formatearNumero(total, 2)}
              </div>
            );
          };

          return (
            <Column
              key={index}
              field={columna.field}
              header={columna.header}
              body={(rowData) => cellTemplate(rowData, columna)}
              footer={footerTemplate}
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
              footerStyle={{
                backgroundColor: '#FFEB3B',
                borderTop: '3px solid #FBC02D',
                padding: '0'
              }}
            />
          );
        })}
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
