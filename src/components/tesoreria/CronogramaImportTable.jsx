import React, { useState, useRef, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { Toolbar } from "primereact/toolbar";

export default function CronogramaImportTable({ visible, onHide, onImport, prestamoBancarioId }) {
  const [cuotas, setCuotas] = useState([]);
  const [selectedCuotas, setSelectedCuotas] = useState([]);
  const tableRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setCuotas([crearCuotaVacia(1)]);
    }
  }, [visible]);

  const crearCuotaVacia = (numero) => ({
    id: `temp-${Date.now()}-${numero}`,
    numeroCuota: numero,
    fechaVencimiento: null,
    saldoCapitalAntes: 0,
    montoCapital: 0,
    montoInteres: 0,
    montoComision: 0,
    montoSeguro: 0,
    montoTotal: 0,
    saldoCapitalDespues: 0,
  });

  const parsearFecha = (texto) => {
    if (!texto) return null;
    
    const regex = /(\d{2})[/-](\d{2})[/-](\d{4})/;
    const match = texto.match(regex);
    
    if (match) {
      const [, dia, mes, anio] = match;
      return new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));
    }
    
    return null;
  };

  const limpiarNumero = (texto) => {
    if (!texto) return 0;
    
    const limpio = String(texto).replace(/[,\s]/g, '');
    const numero = parseFloat(limpio);
    
    return isNaN(numero) ? 0 : numero;
  };

  const handlePaste = (event) => {
    event.preventDefault();
    
    const pastedText = event.clipboardData.getData('text');
    const lineas = pastedText.split('\n').filter(linea => linea.trim());
    
    const cuotasParseadas = [];
    
    lineas.forEach((linea, index) => {
      const columnas = linea.split(/\t+|\s{2,}/).filter(col => col.trim());
      
      if (columnas.length >= 4) {
        const numeroCuota = parseInt(columnas[0]);
        
        if (!isNaN(numeroCuota) && numeroCuota > 0 && numeroCuota <= 100) {
          let idx = 1;
          const fechaVencimiento = parsearFecha(columnas[idx]);
          
          if (fechaVencimiento) {
            idx++;
          }
          
          const numeros = [];
          for (let i = idx; i < columnas.length; i++) {
            const num = limpiarNumero(columnas[i]);
            if (num >= 0 && !isNaN(num)) {
              numeros.push(num);
            }
          }
          
          if (numeros.length >= 4) {
            const cuota = {
              id: `temp-${Date.now()}-${index}`,
              numeroCuota: numeroCuota,
              fechaVencimiento: fechaVencimiento,
              saldoCapitalAntes: numeros[0],
              montoCapital: numeros[1],
              montoInteres: numeros[2],
              montoComision: numeros.length >= 5 ? numeros[3] : 0,
              montoSeguro: numeros.length >= 6 ? numeros[4] : 0,
              montoTotal: numeros[numeros.length - 1],
              saldoCapitalDespues: numeros[0] - numeros[1],
            };
            
            cuotasParseadas.push(cuota);
          }
        }
      }
    });
    
    if (cuotasParseadas.length > 0) {
      setCuotas(cuotasParseadas);
    }
  };

  const agregarFila = () => {
    const ultimoNumero = cuotas.length > 0 ? Math.max(...cuotas.map(c => c.numeroCuota)) : 0;
    setCuotas([...cuotas, crearCuotaVacia(ultimoNumero + 1)]);
  };

  const eliminarFilasSeleccionadas = () => {
    if (selectedCuotas.length === 0) return;
    
    const idsSeleccionados = selectedCuotas.map(c => c.id);
    const cuotasRestantes = cuotas.filter(c => !idsSeleccionados.includes(c.id));
    
    setCuotas(cuotasRestantes);
    setSelectedCuotas([]);
  };

  const limpiarTabla = () => {
    setCuotas([crearCuotaVacia(1)]);
    setSelectedCuotas([]);
  };

  const onCellEditComplete = (e) => {
    let { rowData, newValue, field, originalEvent: event } = e;

    if (field === 'fechaVencimiento') {
      rowData[field] = newValue;
    } else if (field === 'numeroCuota') {
      const numero = parseInt(newValue);
      rowData[field] = isNaN(numero) ? 0 : numero;
    } else {
      const numero = parseFloat(newValue);
      rowData[field] = isNaN(numero) ? 0 : numero;
      
      if (field === 'saldoCapitalAntes' || field === 'montoCapital') {
        rowData.saldoCapitalDespues = rowData.saldoCapitalAntes - rowData.montoCapital;
      }
    }

    setCuotas([...cuotas]);
  };

  const cellEditor = (options) => {
    if (options.field === 'fechaVencimiento') {
      return (
        <Calendar
          value={options.value}
          onChange={(e) => options.editorCallback(e.value)}
          dateFormat="dd/mm/yy"
          showIcon
        />
      );
    } else if (options.field === 'numeroCuota') {
      return (
        <InputNumber
          value={options.value}
          onValueChange={(e) => options.editorCallback(e.value)}
          mode="decimal"
          useGrouping={false}
        />
      );
    } else {
      return (
        <InputNumber
          value={options.value}
          onValueChange={(e) => options.editorCallback(e.value)}
          mode="decimal"
          minFractionDigits={2}
          maxFractionDigits={2}
        />
      );
    }
  };

  const handleImportar = () => {
    if (cuotas.length === 0) {
      return;
    }

    const cuotasValidas = cuotas.filter(c => 
      c.numeroCuota > 0 && 
      c.fechaVencimiento && 
      c.montoTotal > 0
    );

    if (cuotasValidas.length === 0) {
      return;
    }

    onImport(cuotasValidas);
    onHide();
  };

  const fechaBodyTemplate = (rowData) => {
    if (!rowData.fechaVencimiento) return '';
    return new Date(rowData.fechaVencimiento).toLocaleDateString('es-PE');
  };

  const montoBodyTemplate = (rowData, field) => {
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rowData[field] || 0);
  };

  const toolbarLeft = (
    <div style={{ display: 'flex', gap: '10px' }}>
      <Button
        label="Agregar Fila"
        icon="pi pi-plus"
        size="small"
        onClick={agregarFila}
      />
      <Button
        label="Eliminar Seleccionadas"
        icon="pi pi-trash"
        size="small"
        severity="danger"
        onClick={eliminarFilasSeleccionadas}
        disabled={selectedCuotas.length === 0}
      />
      <Button
        label="Limpiar Todo"
        icon="pi pi-times"
        size="small"
        severity="warning"
        onClick={limpiarTabla}
      />
    </div>
  );

  const toolbarRight = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
      <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
        {cuotas.length} cuota{cuotas.length !== 1 ? 's' : ''}
      </span>
      <span style={{ fontSize: '0.8rem', color: '#666' }}>
        Selecciona celdas y presiona Ctrl+V para pegar
      </span>
    </div>
  );

  const dialogFooter = (
    <div>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        onClick={onHide}
        severity="secondary"
      />
      <Button
        label="Importar Cuotas"
        icon="pi pi-check"
        onClick={handleImportar}
        disabled={cuotas.length === 0}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="Importar Cronograma de Cuotas"
      style={{ width: '95vw', maxWidth: '1400px' }}
      footer={dialogFooter}
      maximizable
    >
      <div style={{ marginBottom: '15px' }}>
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: '5px',
          marginBottom: '10px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>
            <i className="pi pi-info-circle" style={{ marginRight: '8px' }}></i>
            Instrucciones:
          </h4>
          <ol style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Abre el PDF del cronograma del banco</li>
            <li>Selecciona las filas de la tabla (desde Nro. Cuota hasta Total a Pagar)</li>
            <li>Copia con Ctrl+C</li>
            <li>Haz clic en cualquier celda de la tabla de abajo</li>
            <li>Pega con Ctrl+V</li>
            <li>Revisa y edita si es necesario (doble clic en celdas)</li>
            <li>Haz clic en "Importar Cuotas"</li>
          </ol>
        </div>

        <Toolbar left={toolbarLeft} right={toolbarRight} />
      </div>

      <div onPaste={handlePaste} style={{ outline: 'none' }} tabIndex={0}>
        <DataTable
          ref={tableRef}
          value={cuotas}
          selection={selectedCuotas}
          onSelectionChange={(e) => setSelectedCuotas(e.value)}
          editMode="cell"
          size="small"
          scrollable
          scrollHeight="400px"
          stripedRows
          showGridlines
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
          <Column
            field="numeroCuota"
            header="N° Cuota"
            editor={(options) => cellEditor(options)}
            onCellEditComplete={onCellEditComplete}
            style={{ width: '100px' }}
          />
          <Column
            field="fechaVencimiento"
            header="Fecha Vencimiento"
            body={fechaBodyTemplate}
            editor={(options) => cellEditor(options)}
            onCellEditComplete={onCellEditComplete}
            style={{ width: '150px' }}
          />
          <Column
            field="saldoCapitalAntes"
            header="Saldo Capital Antes"
            body={(rowData) => montoBodyTemplate(rowData, 'saldoCapitalAntes')}
            editor={(options) => cellEditor(options)}
            onCellEditComplete={onCellEditComplete}
            style={{ width: '150px' }}
          />
          <Column
            field="montoCapital"
            header="Amortización"
            body={(rowData) => montoBodyTemplate(rowData, 'montoCapital')}
            editor={(options) => cellEditor(options)}
            onCellEditComplete={onCellEditComplete}
            style={{ width: '130px' }}
          />
          <Column
            field="montoInteres"
            header="Interés"
            body={(rowData) => montoBodyTemplate(rowData, 'montoInteres')}
            editor={(options) => cellEditor(options)}
            onCellEditComplete={onCellEditComplete}
            style={{ width: '120px' }}
          />
          <Column
            field="montoComision"
            header="Comisión"
            body={(rowData) => montoBodyTemplate(rowData, 'montoComision')}
            editor={(options) => cellEditor(options)}
            onCellEditComplete={onCellEditComplete}
            style={{ width: '120px' }}
          />
          <Column
            field="montoSeguro"
            header="Seguro"
            body={(rowData) => montoBodyTemplate(rowData, 'montoSeguro')}
            editor={(options) => cellEditor(options)}
            onCellEditComplete={onCellEditComplete}
            style={{ width: '120px' }}
          />
          <Column
            field="montoTotal"
            header="Total a Pagar"
            body={(rowData) => montoBodyTemplate(rowData, 'montoTotal')}
            editor={(options) => cellEditor(options)}
            onCellEditComplete={onCellEditComplete}
            style={{ width: '130px' }}
          />
          <Column
            field="saldoCapitalDespues"
            header="Saldo Capital Después"
            body={(rowData) => montoBodyTemplate(rowData, 'saldoCapitalDespues')}
            style={{ width: '150px', backgroundColor: '#f5f5f5' }}
          />
        </DataTable>
      </div>
    </Dialog>
  );
}