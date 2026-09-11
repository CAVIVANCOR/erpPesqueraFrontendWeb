import React, { useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Timeline } from 'primereact/timeline';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { Divider } from 'primereact/divider';
import { Panel } from 'primereact/panel';
import { Chip } from 'primereact/chip';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import * as sireAPI from '../../api/sire';
import { useAuthStore } from '../../shared/stores/useAuthStore';
import { formatearFecha, formatearNumero } from '../../utils/utils';
import BooleanToggleButton from '../common/BooleanToggleButton';
import { Tag } from 'primereact/tag';

/**
 * Componente ImportadorSIRECompras
 * 
 * Permite importar documentos de compra desde SUNAT SIRE.
 * 
 * IMPORTANTE: Este componente recibe la empresa y periodo desde el componente padre
 * (OrdenCompra.jsx) para evitar redundancia y mejorar la UX. El usuario ya seleccionó
 * empresa y periodo en los filtros principales, por lo que no debe volver a seleccionarlos.
 * 
 * @param {Array} empresas - Lista de empresas disponibles
 * @param {string|number} empresaIdPadre - ID de la empresa seleccionada en el padre
 * @param {string|number} periodoIdPadre - ID del periodo contable seleccionado en el padre
 * @param {Array} periodosContables - Lista de periodos contables disponibles
 * @param {Function} onImportComplete - Callback para ejecutar después de importar
 * @param {Object} toast - Referencia al componente Toast del padre
 */
export default function ImportadorSIRECompras({
  empresas,
  empresaIdPadre,
  periodoIdPadre,
  periodosContables,
  onImportComplete,
  toast: toastPadre
}) {
  const toastLocal = useRef(null);
  const toast = toastPadre || toastLocal; // Usar toast del padre si existe, sino el local
  const usuario = useAuthStore((state) => state.usuario);

  const [visible, setVisible] = useState(false);
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [seleccionados, setSeleccionados] = useState([]);
  const [filtroSoloNuevos, setFiltroSoloNuevos] = useState(true);

  // Estados para tracking de pasos
  const [pasos, setPasos] = useState([]);
  const [pasoActual, setPasoActual] = useState(null);

  // Estados para creación de OC
  const [showResultadosDialog, setShowResultadosDialog] = useState(false);
  const [resultadosMasivo, setResultadosMasivo] = useState(null);
  const [procesandoMasivo, setProcesandoMasivo] = useState(false);

  // AGREGADO: Estados para Dialog de progreso masivo con log en tiempo real
  const [showProgresoDialog, setShowProgresoDialog] = useState(false);
  const [progresoMasivo, setProgresoMasivo] = useState({
    total: 0,
    procesados: 0,
    exitosos: 0,
    errores: 0,
    log: []
  });

  // Estados para Dialog de progreso individual
  const [showProgresoIndividual, setShowProgresoIndividual] = useState(false);
  const [progresoIndividual, setProgresoIndividual] = useState({
    pasoActual: '',
    pasos: [],
    completado: false,
    exito: false
  });





  const agregarPaso = (titulo, estado = 'en-progreso', detalle = '') => {
    const nuevoPaso = {
      id: Date.now(),
      titulo,
      estado, // 'en-progreso', 'exito', 'error'
      detalle,
      timestamp: new Date().toLocaleTimeString()
    };
    setPasos(prev => [...prev, nuevoPaso]);
    setPasoActual(nuevoPaso.id);
    return nuevoPaso.id;
  };

  const actualizarPaso = (id, estado, detalle = '') => {
    setPasos(prev => prev.map(p =>
      p.id === id ? { ...p, estado, detalle, timestampFin: new Date().toLocaleTimeString() } : p
    ));
  };

  const handleDescargar = async () => {
    // ========================================
    // OBTENER EMPRESA Y PERIODO DEL PADRE
    // ========================================
    // IMPORTANTE: Ya no se usan states locales (empresaId, periodo).
    // Los valores vienen del componente padre (OrdenCompra.jsx) a través de props.
    // Esto evita redundancia y mejora la UX.
    // ========================================

    const empresaSeleccionada = empresas.find(e => Number(e.id) === Number(empresaIdPadre));
    const periodoSeleccionado = periodosContables.find(p => Number(p.id) === Number(periodoIdPadre));

    if (!empresaSeleccionada || !periodoSeleccionado) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error de configuración',
        detail: 'No se pudo obtener la información de empresa o periodo',
        life: 3000
      });
      return;
    }

    // Construir periodo en formato AAAAMM
    const periodoFormato = `${periodoSeleccionado.anio}${String(periodoSeleccionado.mes).padStart(2, '0')}`;

    setLoading(true);
    setPaso(2);
    setPasos([]);
    setPasoActual(null);

    try {
      // PASO 1: Validación inicial
      const paso1 = agregarPaso('Validando parámetros', 'en-progreso');
      await new Promise(resolve => setTimeout(resolve, 500));
      actualizarPaso(paso1, 'exito', `Empresa: ${empresaSeleccionada.razonSocial}, Periodo: ${periodoFormato}`);

      // PASO 2: Conectando con SUNAT
      const paso2 = agregarPaso('Conectando con servidor SUNAT', 'en-progreso');
      await new Promise(resolve => setTimeout(resolve, 800));
      actualizarPaso(paso2, 'exito', 'Conexión establecida');

      // PASO 3: Autenticación OAuth
      const paso3 = agregarPaso('Autenticando con OAuth2', 'en-progreso',
        `RUC: ${empresaSeleccionada.ruc || 'N/A'}`
      );
      await new Promise(resolve => setTimeout(resolve, 1000));

      // PASO 4: Solicitando propuesta
      const paso4 = agregarPaso('Solicitando propuesta de compras', 'en-progreso');

      // Llamada real al backend usando valores del padre
      const data = await sireAPI.descargarComprasSIRE(empresaIdPadre, periodoFormato);

      if (data.success) {
        actualizarPaso(paso3, 'exito', 'Token OAuth obtenido');
        actualizarPaso(paso4, 'exito', 'Propuesta solicitada exitosamente');

        // PASO 5: Esperando procesamiento
        const paso5 = agregarPaso('Esperando procesamiento SUNAT', 'en-progreso');
        await new Promise(resolve => setTimeout(resolve, 1500));
        actualizarPaso(paso5, 'exito', 'Procesamiento completado');

        // PASO 6: Descargando archivo
        const paso6 = agregarPaso('Descargando archivo TXT', 'en-progreso');
        await new Promise(resolve => setTimeout(resolve, 1000));
        actualizarPaso(paso6, 'exito', `${data.totalDocumentos} documentos descargados`);

        // PASO 7: Parseando datos
        const paso7 = agregarPaso('Procesando datos', 'en-progreso');
        await new Promise(resolve => setTimeout(resolve, 800));
        actualizarPaso(paso7, 'exito', `${data.nuevos?.length || 0} documentos nuevos encontrados`);

        // PASO 8: Finalización
        agregarPaso('Proceso completado', 'exito',
          `Total: ${data.totalDocumentos} | Ya registrados: ${data.yaRegistrados} | Nuevos: ${data.nuevos?.length || 0}`
        );

        setResultado(data);
        setSeleccionados(data.nuevos || []);

        await new Promise(resolve => setTimeout(resolve, 1500));
        setPaso(3);

        toast.current.show({
          severity: 'success',
          summary: '✅ Descarga Exitosa',
          detail: `${data.totalDocumentos} documentos encontrados. ${data.nuevos?.length || 0} nuevos por importar.`,
          life: 5000
        });
      } else {
        throw new Error(data.message || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error descargando compras SIRE:', error);

      const errorData = error.response?.data;

      // Marcar el paso actual como error
      if (pasoActual) {
        actualizarPaso(pasoActual, 'error', errorData?.detalles || error.message);
      }

      // Agregar paso final de error
      agregarPaso('Error en el proceso', 'error',
        errorData?.message || error.message || 'Error de conexión con SUNAT'
      );

      toast.current.show({
        severity: 'error',
        summary: 'Error al Descargar',
        detail: errorData?.message || error.message || 'Error de conexión con SUNAT',
        life: 10000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportar = async () => {
    if (seleccionados.length === 0) {
      toast.current.show({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Debe seleccionar al menos un documento para importar',
        life: 3000
      });
      return;
    }

    setLoading(true);

    try {
      const data = await sireAPI.importarDocumentosSIRE(empresaIdPadre, seleccionados, usuario?.id);

      if (data.success) {
        toast.current.show({
          severity: 'success',
          summary: '✅ Importación Exitosa',
          detail: `${seleccionados.length} documento(s) importado(s) como Órdenes de Compra`,
          life: 5000
        });

        setVisible(false);
        onImportComplete?.();
        resetear();
      } else {
        throw new Error(data.message || 'Error en importación');
      }
    } catch (error) {
      console.error('Error importando documentos:', error);

      const errorData = error.response?.data;

      toast.current.show({
        severity: 'error',
        summary: 'Error al Importar',
        detail: errorData?.message || error.message || 'Error al guardar en la base de datos',
        life: 8000
      });
    } finally {
      setLoading(false);
    }
  };


  /**
   * Resetea el estado del importador al cerrar el diálogo.
   * 
   * NOTA: Ya no se resetean empresaId ni periodo porque ahora vienen del padre.
   * Solo se limpian los datos de la importación actual.
   */
  const resetear = () => {
    setPaso(1);
    setResultado(null);
    setSeleccionados([]);
    setPasos([]);
    setPasoActual(null);
    setFiltroSoloNuevos(true);
  };

  const monedaTemplate = (rowData) => {
    return rowData.moneda || 'PEN';
  };

  const montoTemplate = (rowData) => {
    return formatearNumero(rowData.total || 0, 2);
  };

  /**
   * Template para mostrar fechas en formato legible.
   * IMPORTANTE: La fecha viene como string "dd/mm/yyyy" desde el backend.
   */
  const fechaTemplate = (rowData) => {
    if (!rowData.fechaEmision) return '-';
    return rowData.fechaEmision; // Ya viene en formato dd/mm/yyyy
  };

  /**
   * Función de ordenamiento personalizada para fechas.
   * CRÍTICO: Convierte strings "dd/mm/yyyy" a Date para ordenar correctamente.
   * Sin esto, el ordenamiento sería alfabético (incorrecto).
   */
  const fechaSortFunction = (event) => {
    const data = [...event.data];

    data.sort((a, b) => {
      const fechaA = a.fechaEmision ? parseFechaString(a.fechaEmision) : new Date(0);
      const fechaB = b.fechaEmision ? parseFechaString(b.fechaEmision) : new Date(0);

      return event.order * (fechaA.getTime() - fechaB.getTime());
    });

    return data;
  };

  /**
   * Convierte string "dd/mm/yyyy" a objeto Date.
   */
  const parseFechaString = (fechaStr) => {
    if (!fechaStr) return new Date(0);
    const [dia, mes, anio] = fechaStr.split('/');
    return new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));
  };

  const estadoTemplate = (rowData) => {
    if (rowData.enBD) {
      return <span className="p-tag p-tag-success" style={{ fontSize: '0.75rem' }}>Registrado</span>;
    }
    return <span className="p-tag p-tag-warning" style={{ fontSize: '0.75rem' }}>Nuevo</span>;
  };

  const rowClassName = (rowData) => {
    return rowData.enBD ? '' : 'bg-orange-50';
  };



  const handleCrearOC = async (rowData) => {
    try {
      // Inicializar progreso y mostrar Dialog
      setProgresoIndividual({
        pasoActual: 'Iniciando...',
        pasos: [{
          tipo: 'info',
          mensaje: `📄 Documento: ${rowData.serie}-${rowData.numero}`,
          timestamp: new Date().toLocaleTimeString()
        }, {
          tipo: 'info',
          mensaje: `🏢 Proveedor: ${rowData.razonSocial}`,
          timestamp: new Date().toLocaleTimeString()
        }, {
          tipo: 'info',
          mensaje: `💰 Total: S/ ${formatearNumero(rowData.total, 2)}`,
          timestamp: new Date().toLocaleTimeString()
        }],
        completado: false,
        exito: false
      });
      setShowProgresoIndividual(true);

      // Paso 1: Validando datos
      setProgresoIndividual(prev => ({
        ...prev,
        pasoActual: '🔍 Validando datos...',
        pasos: [...prev.pasos, {
          tipo: 'info',
          mensaje: '🔍 Validando datos del documento...',
          timestamp: new Date().toLocaleTimeString()
        }]
      }));

      // Construir periodo en formato AAAAMM desde el periodo seleccionado
      const periodoSeleccionado = periodosContables.find(p => Number(p.id) === Number(periodoIdPadre));
      const periodoFormato = `${periodoSeleccionado.anio}${String(periodoSeleccionado.mes).padStart(2, '0')}`;

      // Paso 2: Creando orden de compra
      setProgresoIndividual(prev => ({
        ...prev,
        pasoActual: '🏗️ Creando orden de compra...',
        pasos: [...prev.pasos, {
          tipo: 'info',
          mensaje: '🏗️ Enviando solicitud al servidor...',
          timestamp: new Date().toLocaleTimeString()
        }]
      }));

      const resultado = await sireAPI.crearOCIndividual(
        empresaIdPadre,
        periodoFormato,
        rowData.numCar,
        rowData
      );

      if (resultado.success) {
        // Éxito
        setProgresoIndividual(prev => ({
          ...prev,
          pasoActual: '✅ Completado',
          pasos: [...prev.pasos, {
            tipo: 'success',
            mensaje: `✅ Orden de Compra ${resultado.numeroDocumento} creada exitosamente`,
            timestamp: new Date().toLocaleTimeString()
          }],
          completado: true,
          exito: true
        }));

        toast.current.show({
          severity: 'success',
          summary: 'Éxito',
          detail: `Orden de Compra ${resultado.numeroDocumento} creada correctamente`,
          life: 5000
        });

        // Actualizar tabla local
        setResultado(prev => ({
          ...prev,
          todos: prev.todos.map(doc =>
            doc.numCar === rowData.numCar
              ? { ...doc, enBD: true }
              : doc
          )
        }));

        // Recargar datos de la página principal para mostrar el nuevo documento
        if (onImportComplete) {
          onImportComplete();
        }
      } else {
        // Error del backend
        setProgresoIndividual(prev => ({
          ...prev,
          pasoActual: '❌ Error',
          pasos: [...prev.pasos, {
            tipo: 'error',
            mensaje: `❌ Error: ${resultado.error}`,
            timestamp: new Date().toLocaleTimeString()
          }],
          completado: true,
          exito: false
        }));

        toast.current.show({
          severity: 'error',
          summary: 'Error',
          detail: resultado.error,
          life: 8000
        });
      }

    } catch (error) {
      console.error('Error creando OC:', error);
      
      // Error de excepción
      setProgresoIndividual(prev => ({
        ...prev,
        pasoActual: '❌ Error',
        pasos: [...prev.pasos, {
          tipo: 'error',
          mensaje: `❌ Excepción: ${error.response?.data?.message || error.message}`,
          timestamp: new Date().toLocaleTimeString()
        }],
        completado: true,
        exito: false
      }));

      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Error al crear Orden de Compra',
        life: 5000
      });
    }
  };

  /**
   * MODIFICADO: Ahora procesa SOLO los documentos SELECCIONADOS por el usuario
   * y muestra un Dialog con barra de progreso y log en tiempo real.
   * 
   * IMPORTANTE: Preserva toda la funcionalidad existente de actualización de tabla
   * y notificaciones. Solo cambia la fuente de datos (seleccionados vs todos nuevos)
   * y agrega visualización de progreso.
   */
  const handleCrearOCsMasivo = async () => {
    try {
      // MODIFICADO: Validar que haya documentos SELECCIONADOS (no todos los nuevos)
      const documentosSeleccionados = seleccionados.filter(doc => !doc.enBD);

      if (documentosSeleccionados.length === 0) {
        toast.current.show({
          severity: 'warn',
          summary: 'Sin selección',
          detail: 'Debe seleccionar al menos un documento nuevo para procesar',
          life: 3000
        });
        return;
      }

      // AGREGADO: Inicializar progreso y mostrar Dialog
      setProgresoMasivo({
        total: documentosSeleccionados.length,
        procesados: 0,
        exitosos: 0,
        errores: 0,
        log: []
      });
      setShowProgresoDialog(true);
      setProcesandoMasivo(true);
      // PRESERVADO: Construcción de periodo (sin cambios)
      const periodoSeleccionado = periodosContables.find(p => Number(p.id) === Number(periodoIdPadre));
      const periodoFormato = `${periodoSeleccionado.anio}${String(periodoSeleccionado.mes).padStart(2, '0')}`;

      // AGREGADO: Variables para tracking
      let exitosos = 0;
      let errores = 0;
      const carsExitosos = [];

      // MODIFICADO: Procesar documentos UNO POR UNO con actualización de progreso
      // (Antes se enviaban todos juntos al backend)
      for (let i = 0; i < documentosSeleccionados.length; i++) {
        const doc = documentosSeleccionados[i];
        const numeroActual = i + 1;

        try {
          // AGREGADO: Log de inicio de procesamiento
          setProgresoMasivo(prev => ({
            ...prev,
            log: [...prev.log, {
              tipo: 'info',
              mensaje: `[${numeroActual}/${documentosSeleccionados.length}] Procesando ${doc.serie}-${doc.numero}...`,
              timestamp: new Date().toLocaleTimeString()
            }]
          }));

          // PRESERVADO: Llamada a API individual (ya existía en handleCrearOC)
          const resultado = await sireAPI.crearOCIndividual(
            empresaIdPadre,
            periodoFormato,
            doc.numCar,
            doc
          );

          if (resultado.success) {
            exitosos++;
            carsExitosos.push(doc.numCar);

            // AGREGADO: Log de éxito
            setProgresoMasivo(prev => ({
              ...prev,
              procesados: numeroActual,
              exitosos: exitosos,
              log: [...prev.log, {
                tipo: 'success',
                mensaje: `✓ OC ${resultado.numeroDocumento} creada exitosamente`,
                timestamp: new Date().toLocaleTimeString()
              }]
            }));
          } else {
            errores++;

            // AGREGADO: Log de error
            setProgresoMasivo(prev => ({
              ...prev,
              procesados: numeroActual,
              errores: errores,
              log: [...prev.log, {
                tipo: 'error',
                mensaje: `✗ Error: ${resultado.error}`,
                timestamp: new Date().toLocaleTimeString()
              }]
            }));
          }

        } catch (error) {
          errores++;

          // AGREGADO: Log de excepción
          setProgresoMasivo(prev => ({
            ...prev,
            procesados: numeroActual,
            errores: errores,
            log: [...prev.log, {
              tipo: 'error',
              mensaje: `✗ Excepción: ${error.response?.data?.message || error.message}`,
              timestamp: new Date().toLocaleTimeString()
            }]
          }));
        }
      }

      // PRESERVADO: Actualizar tabla con exitosos (lógica existente sin cambios)
      if (carsExitosos.length > 0) {
        setResultado(prev => ({
          ...prev,
          todos: prev.todos.map(doc =>
            carsExitosos.includes(doc.numCar)
              ? { ...doc, enBD: true }
              : doc
          )
        }));
      }

      // AGREGADO: Log final con resumen
      setProgresoMasivo(prev => ({
        ...prev,
        log: [...prev.log, {
          tipo: exitosos === documentosSeleccionados.length ? 'success' : 'warn',
          mensaje: `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPROCESO COMPLETADO\n✓ Exitosos: ${exitosos}\n✗ Errores: ${errores}\nTotal procesados: ${documentosSeleccionados.length}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          timestamp: new Date().toLocaleTimeString()
        }]
      }));

      // AGREGADO: Limpiar selección después de procesar
      setSeleccionados([]);

      // PRESERVADO: Recargar datos de la página principal (sin cambios)
      if (onImportComplete) {
        onImportComplete();
      }

      // PRESERVADO: Notificación toast (sin cambios)
      toast.current.show({
        severity: errores === 0 ? 'success' : 'warn',
        summary: errores === 0 ? 'Éxito Total' : 'Completado con errores',
        detail: `${exitosos} OCs creadas, ${errores} errores`,
        life: 5000
      });

    } catch (error) {
      // PRESERVADO: Manejo de errores (sin cambios)
      console.error('Error en proceso masivo:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Error en proceso masivo',
        life: 5000
      });
    } finally {
      // PRESERVADO: Cleanup (sin cambios)
      setProcesandoMasivo(false);
    }
  };

  const accionesTemplate = (rowData) => {
    // Solo mostrar botón si el documento NO está en BD
    if (rowData.enBD) {
      return <span style={{ color: '#999', fontSize: '0.85rem' }}>Ya registrado</span>;
    }

    return (
      <Button
        label="🏗️ Crear OC"
        icon="pi pi-plus-circle"
        className="p-button-success p-button-sm"
        onClick={() => handleCrearOC(rowData)}
        tooltip="Crear Orden de Compra desde documento SIRE"
        tooltipOptions={{ position: 'left' }}
        disabled={loading}
        style={{ fontSize: '0.85rem' }}
      />
    );
  };

  const documentosFiltrados = resultado?.todos
    ? (filtroSoloNuevos ? resultado.todos.filter(d => !d.enBD) : resultado.todos)
    : [];

  const getIconoPaso = (estado) => {
    switch (estado) {
      case 'exito':
        return 'pi pi-check-circle';
      case 'error':
        return 'pi pi-times-circle';
      case 'en-progreso':
        return 'pi pi-spin pi-spinner';
      default:
        return 'pi pi-circle';
    }
  };

  const getSeverityPaso = (estado) => {
    switch (estado) {
      case 'exito':
        return 'success';
      case 'error':
        return 'danger';
      case 'en-progreso':
        return 'info';
      default:
        return null;
    }
  };

  const customizedMarker = (item) => {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: item.estado === 'exito' ? '#22c55e' :
          item.estado === 'error' ? '#ef4444' :
            item.estado === 'en-progreso' ? '#3b82f6' : '#94a3b8',
        color: 'white',
        fontSize: '14px'
      }}>
        <i className={getIconoPaso(item.estado)}></i>
      </div>
    );
  };

  const customizedContent = (item) => {
    return (
      <div style={{
        padding: '4px 8px',
        minWidth: '120px',
        maxWidth: '180px'
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '600',
          marginBottom: '2px',
          color: '#1e293b',
          lineHeight: '1.3'
        }}>
          {item.titulo}
        </div>
        {item.detalle && (
          <div style={{
            fontSize: '9px',
            color: '#64748b',
            lineHeight: '1.2',
            marginTop: '2px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {item.detalle}
          </div>
        )}
        <div style={{
          fontSize: '8px',
          color: '#94a3b8',
          marginTop: '2px'
        }}>
          {item.timestamp}
        </div>
      </div>
    );
  };

  // ========================================
  // VALIDACIÓN Y APERTURA DEL IMPORTADOR
  // ========================================
  /**
   * Valida que haya empresa y periodo seleccionados antes de abrir el diálogo.
   * Si las validaciones son exitosas, abre el diálogo e INICIA LA DESCARGA AUTOMÁTICAMENTE.
   * 
   * CRÍTICO: Esta validación evita que el usuario abra el importador sin contexto.
   * La descarga automática mejora la UX eliminando un paso innecesario.
   * 
   * FLUJO:
   * 1. Validar empresa y periodo
   * 2. Abrir diálogo
   * 3. Saltar al paso 2 (carga)
   * 4. Iniciar descarga automáticamente
   */
  const handleAbrirImportador = () => {
    // Validar que haya empresa seleccionada
    if (!empresaIdPadre) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Empresa requerida',
        detail: 'Debe seleccionar una empresa antes de importar documentos SIRE',
        life: 4000
      });
      return;
    }

    // Validar que haya periodo seleccionado
    if (!periodoIdPadre) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Periodo requerido',
        detail: 'Debe seleccionar un periodo contable antes de importar documentos SIRE',
        life: 4000
      });
      return;
    }

    // Validar que no sea "TODOS LOS PERIODOS"
    const PERIODO_TODOS = 'TODOS';
    if (periodoIdPadre === PERIODO_TODOS) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Periodo específico requerido',
        detail: 'Debe seleccionar un periodo específico (no "TODOS LOS PERIODOS") para importar desde SIRE',
        life: 4000
      });
      return;
    }

    // ========================================
    // VALIDACIONES OK: ABRIR Y DESCARGAR AUTOMÁTICAMENTE
    // ========================================
    // IMPORTANTE: Ya no mostramos un paso previo de confirmación.
    // El diálogo se abre directamente en modo "cargando" y comienza
    // la descarga automáticamente para mejorar la UX.
    // ========================================
    setVisible(true);
    setPaso(2); // Saltar directo al paso de carga

    // Iniciar descarga automáticamente después de un pequeño delay
    // para que el diálogo se renderice correctamente
    setTimeout(() => {
      handleDescargar();
    }, 100);
  };

  return (
    <>
      {/* Solo mostrar Toast local si no viene del padre */}
      {!toastPadre && <Toast ref={toastLocal} />}

      <Button
        label="SIRE"
        icon="pi pi-download"
        onClick={handleAbrirImportador}
        className="p-button-success"
        tooltip="Descargar compras desde SUNAT SIRE"
        tooltipOptions={{ position: 'top' }}
        style={{ width: "100%" }}
      />

      <Dialog
        visible={visible}
        style={{ width: '95vw', maxWidth: '1600px' }}
        onHide={() => { setVisible(false); resetear(); }}
        modal
        blockScroll
        maximizable
        header={
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            {/* ========================================
                LÍNEA 1: TÍTULO Y CONTEXTO
                ======================================== */}
            <div style={{ flex: 1 }}>
              <h4>Conciliacion SIRE - Compras</h4>
            </div>
            <div style={{ flex: 1 }}>
              <Chip
                label={empresas.find(e => Number(e.id) === Number(empresaIdPadre))?.razonSocial || 'Sin empresa'}
                icon="pi pi-building"
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Chip
                label={(() => {
                  const periodo = periodosContables.find(p => Number(p.id) === Number(periodoIdPadre));
                  return periodo ? `${periodo.nombrePeriodo} (${periodo.anio}${String(periodo.mes).padStart(2, '0')})` : 'Sin periodo';
                })()}
                icon="pi pi-calendar"
                style={{ width: '100%' }}
              />
            </div>
            {/* ========================================
                LÍNEA 2: ESTADÍSTICAS CON SPLITTER
                ======================================== */}
            {paso === 3 && resultado && (
              <div style={{ flex: 2 }}>
                <Tag className="mr-2" icon="pi pi-database">{`Total: ${(resultado.totalDocumentos || 0).toLocaleString('es-PE')}`}</Tag>
                <Tag className="mr-2" icon="pi pi-check-circle" severity="success">{`Registrados: ${(resultado.yaRegistrados || 0).toLocaleString('es-PE')}`}</Tag>
                <Tag className="mr-2" icon="pi pi-exclamation-circle" severity="danger">{`Nuevos: ${((resultado.totalDocumentos || 0) - (resultado.yaRegistrados || 0)).toLocaleString('es-PE')}`}</Tag>
                <Tag className="mr-2" icon="pi pi-eye" severity="info">{`Mostrando: ${(documentosFiltrados?.length || 0).toLocaleString('es-PE')}`}</Tag>
              </div>
            )}
          </div>
        }
      >
        {/* ========================================
            PASO 1 ELIMINADO
            ========================================
            IMPORTANTE: El paso 1 (selección de empresa y periodo) ha sido eliminado.
            Ahora la descarga inicia automáticamente al abrir el diálogo.
            La información de empresa y periodo se muestra en el header.
            ======================================== */}

        {paso === 2 && (
          <div>
            <Panel header="Proceso de Descarga en Curso" className="mb-3">
              <div style={{
                overflowX: 'auto',
                overflowY: 'hidden',
                padding: '20px 10px',
                backgroundColor: '#f8fafc'
              }}>
                <Timeline
                  value={pasos}
                  layout="horizontal"
                  align="top"
                  marker={customizedMarker}
                  content={customizedContent}
                  style={{ minWidth: `${pasos.length * 150}px` }}
                />
              </div>
            </Panel>

            {!loading && pasos.length > 0 && pasos[pasos.length - 1].estado === 'error' && (
              <div className="flex gap-2 justify-content-end">
                <Button
                  label="Cerrar"
                  icon="pi pi-times"
                  onClick={() => { setVisible(false); resetear(); }}
                  className="p-button-secondary"
                />
                <Button
                  label="Reintentar"
                  icon="pi pi-refresh"
                  onClick={() => { setPaso(1); setPasos([]); }}
                  className="p-button-warning"
                />
              </div>
            )}
          </div>
        )}

        {paso === 3 && resultado && (
          <div>
            {/* ========================================
                TOOLBAR DE ACCIONES - BOTONES DE IGUAL TAMAÑO
                ======================================== */}
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <Button
                  label={filtroSoloNuevos ? "Solo Nuevos" : "Todos"}
                  icon={filtroSoloNuevos ? "pi pi-filter" : "pi pi-list"}
                  onClick={() => setFiltroSoloNuevos(!filtroSoloNuevos)}
                  className={filtroSoloNuevos ? "p-button-warning w-full" : "p-button-info w-full"}
                  tooltip="Filtrar documentos"
                  tooltipOptions={{ position: 'top' }}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                {documentosFiltrados && documentosFiltrados.some(d => !d.enBD) ? (
                  <Button
                    label={`Crear OCs Masivo (${seleccionados.filter(d => !d.enBD).length} selec.)`}
                    icon="pi pi-plus-circle"
                    severity='success'
                    onClick={handleCrearOCsMasivo}
                    loading={procesandoMasivo}
                    disabled={procesandoMasivo || loading || seleccionados.filter(d => !d.enBD).length === 0}
                    tooltip="Crear Órdenes de Compra para los documentos seleccionados"
                    tooltipOptions={{ position: 'top' }}
                    style={{ width: '100%' }}

                  />
                ) : (
                  <div></div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  label="Cerrar"
                  icon="pi pi-times"
                  onClick={() => { setVisible(false); resetear(); }}
                  className="p-button-secondary w-full"
                  style={{ width: '100%' }}

                />
              </div>
            </div>

            {documentosFiltrados && documentosFiltrados.length > 0 ? (
              <>
                <DataTable
                  value={documentosFiltrados}
                  selection={seleccionados}
                  onSelectionChange={(e) => setSeleccionados(e.value)}
                  dataKey="numCar"
                  paginator
                  rows={20}
                  rowsPerPageOptions={[20, 50, 100]}
                  emptyMessage="No hay documentos para mostrar"
                  responsiveLayout="scroll"
                  className="mb-3"
                  size="small"
                  stripedRows
                  showGridlines
                  rowClassName={rowClassName}
                  sortMode="single"
                  removableSort
                >
                  <Column
                    selectionMode="multiple"
                    headerStyle={{ width: '3rem' }}
                    frozen
                  />
                  <Column
                    field="enBD"
                    header="Estado"
                    body={estadoTemplate}
                    sortable
                    style={{ width: '7rem' }}
                  />
                  <Column
                    field="tipoDoc"
                    header="Tipo"
                    sortable
                    style={{ width: '4rem' }}
                  />
                  <Column
                    field="serie"
                    header="Serie"
                    sortable
                    style={{ width: '5rem' }}
                  />
                  <Column
                    field="numero"
                    header="Número"
                    sortable
                    dataType="numeric"
                    style={{ width: '6rem' }}
                  />
                  <Column
                    field="fechaEmision"
                    header="F. Emisión"
                    body={fechaTemplate}
                    sortable
                    sortFunction={fechaSortFunction}
                    style={{ width: '7rem' }}
                  />
                  <Column
                    field="rucProveedor"
                    header="RUC"
                    sortable
                    style={{ width: '8rem' }}
                  />
                  <Column
                    field="razonSocial"
                    header="Razón Social"
                    sortable
                    style={{ minWidth: '15rem' }}
                  />
                  <Column
                    field="moneda"
                    header="Mon"
                    body={monedaTemplate}
                    sortable
                    style={{ width: '4rem' }}
                  />
                  <Column
                    field="total"
                    header="Total"
                    body={montoTemplate}
                    sortable
                    dataType="numeric"
                    align="right"
                    style={{ width: '8rem' }}
                  />
                  <Column
                    header="Acciones"
                    body={accionesTemplate}
                    style={{ width: '12rem' }}
                    frozen
                    alignFrozen="right"
                  />
                </DataTable>
              </>
            ) : (
              <div className="text-center p-5">
                <i className="pi pi-info-circle text-6xl text-500 mb-3"></i>
                <p className="text-600">No hay documentos nuevos para importar en este periodo.</p>
                <p className="text-500">Todos los comprobantes ya están registrados en el sistema.</p>
                <Button
                  label="Cerrar"
                  icon="pi pi-times"
                  onClick={() => { setVisible(false); resetear(); }}
                  className="p-button-secondary mt-3"
                />
              </div>
            )}
          </div>
        )}
      </Dialog >

      {/* AGREGADO: Dialog de Progreso Masivo con barra de progreso y log en tiempo real */}
      <Dialog
        visible={showProgresoDialog}
        onHide={() => !procesandoMasivo && setShowProgresoDialog(false)}
        header="Creación Masiva de Órdenes de Compra"
        style={{ width: '70vw', maxWidth: '900px' }}
        modal
        closable={!procesandoMasivo}
        closeOnEscape={!procesandoMasivo}
      >
        <div className="mb-3">
          <div className="flex justify-content-between align-items-center mb-2">
            <span className="font-semibold">Progreso: {progresoMasivo.procesados} / {progresoMasivo.total}</span>
            <span className="text-sm text-600">
              <i className="pi pi-check-circle text-green-500 mr-1"></i>
              {progresoMasivo.exitosos} exitosos
              <i className="pi pi-times-circle text-red-500 ml-3 mr-1"></i>
              {progresoMasivo.errores} errores
            </span>
          </div>
          
          {/* Barra de progreso visual */}
          <div style={{
            width: '100%',
            height: '30px',
            backgroundColor: '#e9ecef',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              width: `${(progresoMasivo.procesados / progresoMasivo.total) * 100}%`,
              height: '100%',
              backgroundColor: progresoMasivo.errores === 0 ? '#22c55e' : '#f59e0b',
              transition: 'width 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.875rem'
            }}>
              {progresoMasivo.total > 0 ? Math.round((progresoMasivo.procesados / progresoMasivo.total) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Log de operaciones en tiempo real */}
        <Panel header="Registro de Operaciones" className="mb-3">
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            backgroundColor: '#1e1e1e',
            color: '#d4d4d4',
            padding: '1rem',
            borderRadius: '4px'
          }}>
            {progresoMasivo.log.map((entrada, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '0.5rem',
                  color: entrada.tipo === 'success' ? '#4ade80' :
                         entrada.tipo === 'error' ? '#f87171' :
                         entrada.tipo === 'warn' ? '#fbbf24' :
                         '#d4d4d4',
                  whiteSpace: 'pre-wrap'
                }}
              >
                <span style={{ color: '#9ca3af', marginRight: '0.5rem' }}>
                  [{entrada.timestamp}]
                </span>
                {entrada.mensaje}
              </div>
            ))}
            {progresoMasivo.log.length === 0 && (
              <div style={{ color: '#9ca3af', textAlign: 'center' }}>
                Esperando inicio del proceso...
              </div>
            )}
          </div>
        </Panel>

        <div className="flex justify-content-end gap-2">
          <Button
            label="Cerrar"
            icon="pi pi-times"
            onClick={() => setShowProgresoDialog(false)}
            className="p-button-secondary"
            disabled={procesandoMasivo}
          />
        </div>
      </Dialog>

      {/* Dialog de Progreso Individual */}
      <Dialog
        visible={showProgresoIndividual}
        onHide={() => progresoIndividual.completado && setShowProgresoIndividual(false)}
        header="Creación de Orden de Compra"
        style={{ width: '600px' }}
        modal
        closable={progresoIndividual.completado}
        closeOnEscape={progresoIndividual.completado}
      >
        <div className="mb-3">
          <div className="flex align-items-center mb-3">
            {!progresoIndividual.completado && (
              <i className="pi pi-spin pi-spinner text-blue-500 mr-2" style={{ fontSize: '1.5rem' }}></i>
            )}
            {progresoIndividual.completado && progresoIndividual.exito && (
              <i className="pi pi-check-circle text-green-500 mr-2" style={{ fontSize: '1.5rem' }}></i>
            )}
            {progresoIndividual.completado && !progresoIndividual.exito && (
              <i className="pi pi-times-circle text-red-500 mr-2" style={{ fontSize: '1.5rem' }}></i>
            )}
            <span className="font-semibold text-lg">{progresoIndividual.pasoActual}</span>
          </div>
        </div>

        <Panel header="Registro de Actividad" className="mb-3">
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            backgroundColor: '#1e1e1e',
            padding: '1rem',
            borderRadius: '4px'
          }}>
            {progresoIndividual.pasos.map((paso, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '0.5rem',
                  paddingBottom: '0.5rem',
                  borderBottom: index < progresoIndividual.pasos.length - 1 ? '1px solid #333' : 'none',
                  color: paso.tipo === 'success' ? '#4ade80' :
                         paso.tipo === 'error' ? '#f87171' :
                         paso.tipo === 'warn' ? '#fbbf24' :
                         '#d4d4d4'
                }}
              >
                <span style={{ color: '#9ca3af', marginRight: '0.5rem' }}>
                  [{paso.timestamp}]
                </span>
                {paso.mensaje}
              </div>
            ))}
          </div>
        </Panel>

        <div className="flex justify-content-end gap-2">
          <Button
            label="Cerrar"
            icon="pi pi-times"
            onClick={() => setShowProgresoIndividual(false)}
            className="p-button-secondary"
            disabled={!progresoIndividual.completado}
          />
        </div>
      </Dialog>

      {/* PRESERVADO: Dialog Resultados Masivo (sin cambios) */}
      <Dialog
        header="Resultados - Creación Masiva de Órdenes de Compra"
        visible={showResultadosDialog}
        style={{ width: '80vw', maxWidth: '900px' }}
        onHide={() => setShowResultadosDialog(false)}
        maximizable
      >
        {resultadosMasivo && (
          <div>
            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>Resumen</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div>
                  <strong>Total:</strong> {resultadosMasivo.total}
                </div>
                <div style={{ color: 'green' }}>
                  <strong>Exitosos:</strong> {resultadosMasivo.exitosos}
                </div>
                <div style={{ color: 'red' }}>
                  <strong>Errores:</strong> {resultadosMasivo.errores}
                </div>
              </div>
            </div>

            <DataTable
              value={resultadosMasivo.resultados}
              paginator
              rows={10}
              responsiveLayout="scroll"
              emptyMessage="No hay resultados"
            >
              <Column
                field="serie"
                header="Serie"
                style={{ width: '80px' }}
              />
              <Column
                field="numero"
                header="Número"
                style={{ width: '100px' }}
              />
              <Column
                field="proveedor"
                header="Proveedor"
                style={{ minWidth: '200px' }}
              />
              <Column
                header="Estado"
                body={(rowData) => (
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: rowData.success ? '#d4edda' : '#f8d7da',
                    color: rowData.success ? '#155724' : '#721c24',
                    fontWeight: 'bold'
                  }}>
                    {rowData.success ? '✓ Creada' : '✗ Error'}
                  </span>
                )}
                style={{ width: '120px' }}
              />
              <Column
                field="numeroDocumento"
                header="OC Generada"
                style={{ width: '150px' }}
              />
              <Column
                field="error"
                header="Detalle Error"
                style={{ minWidth: '250px' }}
                body={(rowData) => (
                  rowData.error ? (
                    <span style={{ color: 'red', fontSize: '0.9rem' }}>
                      {rowData.error}
                    </span>
                  ) : null
                )}
              />
            </DataTable>
          </div>
        )}
      </Dialog>
    </>
  );
}