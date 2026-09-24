import React from 'react';
import { InputText } from 'primereact/inputtext';
import { formatearContador } from '../utils/filtrosFormatters';

/**
 * Componente para buscar por número de documento
 */
const NumeroDocumentoField = ({ 
  value = '', 
  onChange, 
  totalDocumentos = 0,
  placeholder = "E001-2258"
}) => {
  
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div>
      <label htmlFor="numeroDocumento">🔢 Número de Documento</label>
      <div className="p-inputgroup">
        <span className="p-inputgroup-addon">
          <i className="pi pi-search"></i>
        </span>
        <InputText
          id="numeroDocumento"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full"
        />
      </div>
      <small className="text-muted">
        Búsqueda parcial en {formatearContador(totalDocumentos)}
      </small>
    </div>
  );
};

export default NumeroDocumentoField;
