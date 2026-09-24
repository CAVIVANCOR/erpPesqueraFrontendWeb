import React from 'react';
import { MultiSelect } from 'primereact/multiselect';
import { Chip } from 'primereact/chip';
import { 
  formatearFiltroCliente, 
  formatearFiltroTipoDoc, 
  formatearFiltroMoneda,
  formatearFiltroEstado,
  formatearFiltroPersonal,
  formatearSubtotales
} from '../utils/filtrosFormatters';

/**
 * Componente MultiSelect dinámico con contadores y subtotales
 */
const MultiSelectDinamico = ({
  label,
  value = [],
  opciones = [],
  onChange,
  placeholder = "Seleccionar...",
  filterBy = "razonSocial,nombre,descripcion,codigo",
  showContadores = true,
  tipo = "generico", // cliente, proveedor, tipoDoc, moneda, estado, personal
  icono = ""
}) => {

  // Template para mostrar cada item con contador
  const itemTemplate = (option) => {
    if (!option) return null;

    let texto = '';
    
    switch (tipo) {
      case 'cliente':
      case 'proveedor':
      case 'entidad':
        texto = formatearFiltroCliente(option);
        break;
      case 'tipoDoc':
        texto = formatearFiltroTipoDoc(option);
        break;
      case 'moneda':
        texto = formatearFiltroMoneda(option);
        break;
      case 'estado':
        texto = formatearFiltroEstado(option);
        break;
      case 'personal':
        texto = formatearFiltroPersonal(option);
        break;
      default:
        texto = option.descripcion || option.nombre || option.razonSocial || option.codigo || 'Sin descripción';
        if (showContadores && option.cantidad) {
          texto += ` (${option.cantidad})`;
        }
    }

    return (
      <div className="flex align-items-center">
        <span>{texto}</span>
      </div>
    );
  };

  // Template para mostrar el valor seleccionado
  const selectedItemTemplate = (option) => {
    if (!option) return null;
    
    const nombre = option.razonSocial || option.nombre || option.descripcion || option.codigo || 'Sin nombre';
    return nombre;
  };

  const handleChange = (e) => {
    onChange(e.value);
  };

  const handleRemove = (idToRemove) => {
    const nuevosValores = value.filter(id => id !== idToRemove);
    onChange(nuevosValores);
  };

  // Obtener opciones seleccionadas para mostrar chips
  const opcionesSeleccionadas = opciones.filter(opt => value.includes(opt.id));

  return (
    <div>
      <label htmlFor={`multiselect-${tipo}`}>
        {icono} {label}
      </label>
      <MultiSelect
        id={`multiselect-${tipo}`}
        value={value}
        options={opciones}
        onChange={handleChange}
        optionLabel="razonSocial"
        optionValue="id"
        placeholder={placeholder}
        filter
        filterBy={filterBy}
        itemTemplate={itemTemplate}
        selectedItemTemplate={selectedItemTemplate}
        display="chip"
        showClear
        maxSelectedLabels={3}
        selectedItemsLabel={`{0} ${label.toLowerCase()} seleccionado${value.length !== 1 ? 's' : ''}`}
        emptyFilterMessage={`No se encontraron ${label.toLowerCase()}`}
        className="w-full"
      />
      
      {/* Chips de seleccionados con opción de remover */}
      {opcionesSeleccionadas.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          <small className="text-muted w-full">Seleccionados ({opcionesSeleccionadas.length}):</small>
          {opcionesSeleccionadas.map(opcion => {
            const nombre = opcion.razonSocial || opcion.nombre || opcion.descripcion || opcion.codigo || 'Sin nombre';
            let subtitulo = '';
            
            // Agregar subtotales si es cliente/proveedor
            if ((tipo === 'cliente' || tipo === 'proveedor' || tipo === 'entidad') && showContadores) {
              if (opcion.totalSoles > 0 || opcion.totalDolares > 0) {
                subtitulo = formatearSubtotales(opcion.totalSoles, opcion.totalDolares);
              }
            }
            
            return (
              <div key={opcion.id} className="flex flex-column">
                <Chip
                  label={nombre}
                  removable
                  onRemove={() => handleRemove(opcion.id)}
                  className="p-chip-sm"
                />
                {subtitulo && (
                  <small className="text-muted ml-2">{subtitulo}</small>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Info de opciones disponibles */}
      {opciones.length > 0 && (
        <small className="text-muted block mt-1">
          ℹ️ {opciones.length} {label.toLowerCase()} disponible{opciones.length !== 1 ? 's' : ''} con documentos
        </small>
      )}
    </div>
  );
};

export default MultiSelectDinamico;
