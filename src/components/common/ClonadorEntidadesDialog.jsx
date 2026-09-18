import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressBar } from 'primereact/progressbar';
import { Message } from 'primereact/message';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import EntidadComercialSelector from './EntidadComercialSelector';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * COMPONENTE GENÉRICO: ClonadorEntidadesDialog
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * Componente totalmente independiente y reutilizable para clonar cualquier tipo
 * de entidad (productos, clientes, proveedores, etc.) a múltiples destinos.
 * 
 * PROPS REQUERIDAS:
 * ────────────────────────────────────────────────────────────────────────────
 * @param {boolean} visible - Controla la visibilidad del diálogo
 * @param {function} onHide - Callback cuando se cierra el diálogo
 * @param {array} entidadesSeleccionadas - Entidades a clonar
 * @param {array} destinosDisponibles - Lista de destinos disponibles
 * @param {string|number} origenId - ID del origen (para excluirlo de destinos)
 * @param {function} onClonar - Función que ejecuta la clonación
 * @param {object} configuracion - Configuración del componente
 * @param {object} toast - Referencia al componente Toast
 * 
 * CONFIGURACIÓN:
 * ────────────────────────────────────────────────────────────────────────────
 * {
 *   titulo: string,                    // Título del diálogo
 *   nombreEntidad: string,             // Nombre de la entidad (ej: "Producto")
 *   nombreDestino: string,             // Nombre del destino (ej: "Empresa")
 *   campoIdDestino: string,            // Campo ID del destino (ej: "id")
 *   campoNombreDestino: string,        // Campo nombre del destino (ej: "razonSocial")
 *   campoSecundarioDestino: string,    // Campo secundario (ej: "ruc")
 *   campoBusquedaDestino: array,       // Campos para búsqueda (ej: ["razonSocial", "ruc"])
 *   renderEntidad: function,           // Función para renderizar cada entidad
 *   renderResumenEntidad: function,    // Función para renderizar resumen de entidad
 *   columnasResultado: array,          // Columnas para tabla de resultados
 *   mensajeAdvertencia: string,        // Mensaje de advertencia personalizado
 * }
 * 
 * EJEMPLO DE USO - CLONAR PRODUCTOS:
 * ────────────────────────────────────────────────────────────────────────────
 * <ClonadorEntidadesDialog
 *   visible={visible}
 *   onHide={() => setVisible(false)}
 *   entidadesSeleccionadas={productosSeleccionados}
 *   destinosDisponibles={empresas}
 *   origenId={empresaActualId}
 *   onClonar={async (entidadesIds, destinosIds) => {
 *     return await clonarProductosAEmpresas(entidadesIds, destinosIds);
 *   }}
 *   configuracion={{
 *     titulo: "Clonar Productos a Otras Empresas",
 *     nombreEntidad: "Producto",
 *     nombreDestino: "Empresa",
 *     campoIdDestino: "id",
 *     campoNombreDestino: "razonSocial",
 *     campoSecundarioDestino: "ruc",
 *     campoBusquedaDestino: ["razonSocial", "ruc"],
 *     renderEntidad: (producto) => (
 *       <div>
 *         <span className="font-semibold">{producto.codigo}</span> - {producto.descripcionBase}
 *       </div>
 *     ),
 *     columnasResultado: [
 *       { field: "productoOrigenCodigo", header: "Código" },
 *       { field: "productoOrigenNombre", header: "Producto" },
 *       { field: "empresaNombre", header: "Empresa Destino" }
 *     ]
 *   }}
 *   toast={toast}
 * />
 * 
 * ════════════════════════════════════════════════════════════════════════════
 */

const ClonadorEntidadesDialog = ({
  visible,
  onHide,
  entidadesSeleccionadas = [],
  destinosDisponibles = [],
  origenId,
  onClonar,
  configuracion = {},
  toast
}) => {
  // ════════════════════════════════════════════════════════════════
  // CONFIGURACIÓN CON VALORES POR DEFECTO
  // ════════════════════════════════════════════════════════════════
  
  const config = {
    titulo: configuracion.titulo || "Clonar Entidades",
    nombreEntidad: configuracion.nombreEntidad || "Entidad",
    nombreDestino: configuracion.nombreDestino || "Destino",
    campoIdDestino: configuracion.campoIdDestino || "id",
    campoNombreDestino: configuracion.campoNombreDestino || "nombre",
    campoSecundarioDestino: configuracion.campoSecundarioDestino || null,
    campoBusquedaDestino: configuracion.campoBusquedaDestino || ["nombre"],
    renderEntidad: configuracion.renderEntidad || ((entidad) => (
      <div>{entidad.nombre || entidad.descripcion || entidad.id}</div>
    )),
    renderResumenEntidad: configuracion.renderResumenEntidad || null,
    columnasResultado: configuracion.columnasResultado || [],
    mensajeAdvertencia: configuracion.mensajeAdvertencia || 
      "Se verificará si las entidades ya existen en los destinos. Los duplicados serán omitidos.",
    iconoEntidad: configuracion.iconoEntidad || "pi-box",
    iconoDestino: configuracion.iconoDestino || "pi-building",
  };

  // ════════════════════════════════════════════════════════════════
  // ESTADOS
  // ════════════════════════════════════════════════════════════════
  
  const [destinosSeleccionados, setDestinosSeleccionados] = useState([]);
  const [busquedaDestino, setBusquedaDestino] = useState('');
  const [clonando, setClonando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  // ════════════════════════════════════════════════════════════════
  // EFECTOS
  // ════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    if (visible) {
      setDestinosSeleccionados([]);
      setResultado(null);
      setMostrarResultado(false);
      setBusquedaDestino('');
      setClienteSeleccionado(null);
    }
  }, [visible]);

  // ════════════════════════════════════════════════════════════════
  // FUNCIONES
  // ════════════════════════════════════════════════════════════════
  
  const handleClonar = async () => {
    if (destinosSeleccionados.length === 0) {
      toast?.current?.show({
        severity: 'warn',
        summary: 'Advertencia',
        detail: `Debe seleccionar al menos un ${config.nombreDestino.toLowerCase()}`,
        life: 3000
      });
      return;
    }

    if (!onClonar) {
      toast?.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se ha configurado la función de clonación',
        life: 3000
      });
      return;
    }

    setClonando(true);

    try {
      const entidadesIds = entidadesSeleccionadas.map(e => e[config.campoIdDestino] || e.id);
      const destinosIds = destinosSeleccionados.map(d => d[config.campoIdDestino]);
      // Si clienteSeleccionado es un número, usarlo directamente; si es objeto, extraer el id
      const clienteId = typeof clienteSeleccionado === 'number' 
        ? clienteSeleccionado 
        : (clienteSeleccionado?.id || null);

      const resultado = await onClonar(entidadesIds, destinosIds, clienteId);

      setResultado(resultado);
      setMostrarResultado(true);

      toast?.current?.show({
        severity: 'success',
        summary: 'Clonación Completada',
        detail: `${resultado.totalExitosos} ${config.nombreEntidad.toLowerCase()}(s) clonado(s) exitosamente`,
        life: 5000
      });

    } catch (error) {
      console.error('Error al clonar:', error);
      toast?.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.message || `Error al clonar ${config.nombreEntidad.toLowerCase()}s`,
        life: 5000
      });
    } finally {
      setClonando(false);
    }
  };

  const handleCerrar = () => {
    setDestinosSeleccionados([]);
    setResultado(null);
    setMostrarResultado(false);
    setBusquedaDestino('');
    onHide();
  };

  // ════════════════════════════════════════════════════════════════
  // FILTROS
  // ════════════════════════════════════════════════════════════════
  
  const destinosFiltrados = destinosDisponibles.filter(destino => {
    // Excluir origen
    if (origenId && destino[config.campoIdDestino] === origenId) return false;
    
    // Filtrar por búsqueda
    if (busquedaDestino) {
      const busqueda = busquedaDestino.toLowerCase();
      return config.campoBusquedaDestino.some(campo => {
        const valor = destino[campo];
        return valor && valor.toString().toLowerCase().includes(busqueda);
      });
    }
    
    return true;
  });

  // ════════════════════════════════════════════════════════════════
  // CÁLCULOS
  // ════════════════════════════════════════════════════════════════
  
  const totalEntidadesACrear = entidadesSeleccionadas.length * destinosSeleccionados.length;

  // ════════════════════════════════════════════════════════════════
  // RENDER: VISTA DE SELECCIÓN
  // ════════════════════════════════════════════════════════════════
  
  if (!mostrarResultado) {
    return (
      <Dialog
        visible={visible}
        onHide={handleCerrar}
        header={config.titulo}
        style={{ width: '800px' }}
        modal
        closable={!clonando}
      >
        <div className="p-fluid">
          {/* ENTIDADES A CLONAR */}
          <div className="field mb-4">
            <label className="font-bold text-lg mb-2 block">
              <i className={`pi ${config.iconoEntidad} mr-2`}></i>
              {config.nombreEntidad}s a Clonar
            </label>
            <div className="surface-100 border-round p-3">
              {entidadesSeleccionadas.map((entidad, index) => (
                <div key={index} className="flex align-items-center mb-2">
                  <i className="pi pi-check text-green-500 mr-2"></i>
                  {config.renderEntidad(entidad)}
                </div>
              ))}
            </div>
            <small className="text-500 mt-2 block">
              Total de {config.nombreEntidad.toLowerCase()}s: {entidadesSeleccionadas.length}
            </small>
          </div>

          {/* SELECCIÓN DE DESTINOS */}
          <div className="field mb-4">
            <label className="font-bold text-lg mb-2 block">
              <i className={`pi ${config.iconoDestino} mr-2`}></i>
              Seleccione los {config.nombreDestino}s Destino
            </label>
            
            <DataTable
              value={destinosFiltrados}
              selection={destinosSeleccionados}
              onSelectionChange={(e) => setDestinosSeleccionados(e.value)}
              dataKey={config.campoIdDestino}
              showGridlines
              stripedRows
              size="small"
              scrollable
              scrollHeight="300px"
              globalFilter={busquedaDestino}
              header={
                <div className="p-inputgroup">
                  <span className="p-inputgroup-addon">
                    <i className="pi pi-search"></i>
                  </span>
                  <InputText
                    placeholder={`Buscar ${config.nombreDestino.toLowerCase()}...`}
                    value={busquedaDestino}
                    onChange={(e) => setBusquedaDestino(e.target.value)}
                  />
                </div>
              }
              emptyMessage={`No se encontraron ${config.nombreDestino.toLowerCase()}s`}
            >
              <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
              <Column 
                field={config.campoNombreDestino} 
                header={config.nombreDestino}
                style={{ fontWeight: 'bold' }}
              />
              {config.campoSecundarioDestino && (
                <Column 
                  field={config.campoSecundarioDestino} 
                  header="RUC/Código"
                  style={{ width: '30%' }}
                />
              )}
            </DataTable>

            <small className="text-600 mt-2 block font-semibold">
              {config.nombreDestino}s seleccionados: {destinosSeleccionados.length}
            </small>
          </div>

          {/* SELECCIÓN DE CLIENTE */}
          <div className="field mb-4">
            <label className="font-bold text-lg mb-2 block">
              <i className="pi pi-user mr-2"></i>
              Cliente a Asignar (Opcional)
            </label>
            <EntidadComercialSelector
              value={clienteSeleccionado}
              onChange={setClienteSeleccionado}
              placeholder="Seleccione un cliente para los productos clonados..."
              showClear
            />
            <small className="text-500 mt-2 block">
              Si no selecciona un cliente, los productos clonados no tendrán cliente asignado.
            </small>
          </div>

          {/* RESUMEN */}
          {destinosSeleccionados.length > 0 && (
            <div className="field mb-4">
              <Message
                severity="info"
                text={
                  <div>
                    <div className="font-bold mb-2">📊 Resumen de Clonación:</div>
                    <ul className="ml-3">
                      <li>{entidadesSeleccionadas.length} {config.nombreEntidad.toLowerCase()}(s) a clonar</li>
                      <li>{destinosSeleccionados.length} {config.nombreDestino.toLowerCase()}(s) destino seleccionado(s)</li>
                      <li className="font-bold">
                        Total de {config.nombreEntidad.toLowerCase()}s a crear: {totalEntidadesACrear}
                      </li>
                    </ul>
                    <div className="mt-2 text-sm">
                      ⚠️ {config.mensajeAdvertencia}
                    </div>
                  </div>
                }
              />
            </div>
          )}

          {/* PROGRESO */}
          {clonando && (
            <div className="field mb-4">
              <label className="font-bold mb-2 block">
                🔄 Clonando {config.nombreEntidad.toLowerCase()}s...
              </label>
              <ProgressBar mode="indeterminate" />
              <small className="text-500 mt-2 block">
                Por favor espere, no cierre esta ventana...
              </small>
            </div>
          )}

          {/* BOTONES */}
          <div className="flex justify-content-end gap-2 mt-4">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-text"
              onClick={handleCerrar}
              disabled={clonando}
            />
            <Button
              label={`Clonar ${config.nombreEntidad}s`}
              icon="pi pi-clone"
              onClick={handleClonar}
              disabled={clonando || destinosSeleccionados.length === 0}
              loading={clonando}
            />
          </div>
        </div>
      </Dialog>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // RENDER: VISTA DE RESULTADO
  // ════════════════════════════════════════════════════════════════
  
  return (
    <Dialog
      visible={visible}
      onHide={handleCerrar}
      header="Resultado de Clonación"
      style={{ width: '900px' }}
      modal
    >
      <div className="p-fluid">
        {/* RESUMEN COMPACTO */}
        <div className="mb-4">
          <div className="surface-100 border-round p-3">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>✅ CLONACIÓN COMPLETADA</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ textAlign: 'center', paddingLeft: '1rem', borderLeft: '1px solid #dee2e6' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#22c55e' }}>{resultado?.totalExitosos || 0}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>Exitosos</div>
                </div>
                <div style={{ textAlign: 'center', paddingLeft: '1rem', borderLeft: '1px solid #dee2e6' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#f97316' }}>{resultado?.totalOmitidos || 0}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>Omitidos</div>
                </div>
                <div style={{ textAlign: 'center', paddingLeft: '1rem', borderLeft: '1px solid #dee2e6' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#ef4444' }}>{resultado?.totalErrores || 0}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>Errores</div>
                </div>
                <div style={{ textAlign: 'center', paddingLeft: '1rem', borderLeft: '1px solid #dee2e6' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#3b82f6' }}>{resultado?.totalProcesados || 0}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>Total</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RESULTADOS EXITOSOS */}
        {resultado?.exitosos?.length > 0 && (
          <div className="mb-4">
            <h3 className="text-green-600 mb-2">✅ {config.nombreEntidad}s Clonados Exitosamente</h3>
            <DataTable
              value={resultado.exitosos}
              size="small"
              showGridlines
              stripedRows
              scrollable
              scrollHeight="200px"
            >
              {config.columnasResultado.map((col, index) => (
                <Column key={index} field={col.field} header={col.header} />
              ))}
            </DataTable>
          </div>
        )}

        {/* RESULTADOS OMITIDOS */}
        {resultado?.omitidos?.length > 0 && (
          <div className="mb-4">
            <h3 className="text-orange-600 mb-2">⚠️ {config.nombreEntidad}s Omitidos</h3>
            <DataTable
              value={resultado.omitidos}
              size="small"
              showGridlines
              stripedRows
              scrollable
              scrollHeight="200px"
            >
              {config.columnasResultado.map((col, index) => (
                <Column key={index} field={col.field} header={col.header} />
              ))}
              <Column field="razon" header="Razón" />
            </DataTable>
          </div>
        )}

        {/* ERRORES */}
        {resultado?.errores?.length > 0 && (
          <div className="mb-4">
            <h3 className="text-red-600 mb-2">❌ Errores</h3>
            <DataTable
              value={resultado.errores}
              size="small"
              showGridlines
              stripedRows
              scrollable
              scrollHeight="200px"
            >
              {config.columnasResultado.map((col, index) => (
                <Column key={index} field={col.field} header={col.header} />
              ))}
              <Column field="error" header="Error" />
            </DataTable>
          </div>
        )}

        {/* BOTONES */}
        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            label="Cerrar"
            icon="pi pi-check"
            onClick={handleCerrar}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default ClonadorEntidadesDialog;
