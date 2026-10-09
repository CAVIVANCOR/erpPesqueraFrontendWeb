import React from 'react';
import RangoFechasField from '../comunes/RangoFechasField';
import RangoMontosField from '../comunes/RangoMontosField';
import MultiSelectDinamico from '../comunes/MultiSelectDinamico';

/**
 * Filtros especializados para las secciones de Préstamos (cuotas pendientes y desembolsos
 * pendientes). Rango de fechas y de montos: la empresa, la moneda y el vencimiento se
 * filtran desde la cabecera, y el préstamo y la cuota no tienen tipos de deuda ni estados
 * de catálogo como las deudas.
 *
 * Con `conFiltrosPrestamo` (cuotas) se muestran primero tres filtros en cascada: Banco, Tipo de
 * Préstamo y Préstamo. Cada lista solo ofrece lo que existe con la selección de las anteriores,
 * y al cambiar una selección se descartan las posteriores que dejan de ser válidas.
 */
const FiltrosPrestamo = ({
  filtros,
  opciones,
  onFiltroChange,
  etiquetaFecha = 'Rango de Fechas de Vencimiento',
  conFiltrosPrestamo = false,
}) => {
  const filaStyle = {
    alignItems: "start",
    display: "flex",
    gap: 10,
    marginBottom: 15,
    flexDirection: window.innerWidth < 768 ? "column" : "row",
  };

  const bancoIds = filtros.bancoIds || [];
  const tipoPrestamoIds = filtros.tipoPrestamoIds || [];
  const prestamoIds = filtros.prestamoIds || [];
  const prestamos = opciones.prestamos || [];

  // Préstamos compatibles con una selección de bancos y de tipos (vacía = sin restricción)
  const prestamosCompatibles = (bancos, tipos) =>
    prestamos.filter(
      (p) =>
        (bancos.length === 0 || bancos.includes(p.bancoId)) &&
        (tipos.length === 0 || tipos.includes(p.tipoPrestamoId)),
    );

  // Tipos de préstamo que existen en los bancos elegidos, con el conteo de cuotas de esos bancos
  const prestamosDeLosBancos = prestamosCompatibles(bancoIds, []);
  const tiposDisponibles = (opciones.tiposPrestamo || [])
    .filter((t) => prestamosDeLosBancos.some((p) => p.tipoPrestamoId === t.id))
    .map((t) => ({
      ...t,
      cantidad: prestamosDeLosBancos
        .filter((p) => p.tipoPrestamoId === t.id)
        .reduce((suma, p) => suma + p.cantidad, 0),
    }));
  const prestamosDisponibles = prestamosCompatibles(bancoIds, tipoPrestamoIds);

  const handleBancos = (nuevosBancos) => {
    // Los tipos y préstamos elegidos deben seguir existiendo en los bancos que quedan
    const tiposValidos = tipoPrestamoIds.filter((id) =>
      prestamosCompatibles(nuevosBancos, []).some((p) => p.tipoPrestamoId === id),
    );
    const prestamosValidos = prestamoIds.filter((id) =>
      prestamosCompatibles(nuevosBancos, tiposValidos).some((p) => p.id === id),
    );
    onFiltroChange('bancoIds', nuevosBancos);
    onFiltroChange('tipoPrestamoIds', tiposValidos);
    onFiltroChange('prestamoIds', prestamosValidos);
  };

  const handleTipos = (nuevosTipos) => {
    const prestamosValidos = prestamoIds.filter((id) =>
      prestamosCompatibles(bancoIds, nuevosTipos).some((p) => p.id === id),
    );
    onFiltroChange('tipoPrestamoIds', nuevosTipos);
    onFiltroChange('prestamoIds', prestamosValidos);
  };

  return (
    <div className="p-fluid">
      {conFiltrosPrestamo && (
        <div style={filaStyle}>
          <div style={{ flex: 1 }}>
            <MultiSelectDinamico
              label="Banco"
              value={bancoIds}
              opciones={opciones.bancos || []}
              onChange={handleBancos}
              placeholder="Todos los bancos"
              filterBy="nombre"
              showContadores={true}
              tipo="banco"
              icono="🏦"
            />
          </div>
          <div style={{ flex: 1 }}>
            <MultiSelectDinamico
              label="Tipo de Préstamo"
              value={tipoPrestamoIds}
              opciones={tiposDisponibles}
              onChange={handleTipos}
              placeholder="Todos los tipos de préstamo"
              filterBy="nombre"
              showContadores={true}
              tipo="tipoPrestamo"
              icono="🏷️"
            />
          </div>
          <div style={{ flex: 1 }}>
            <MultiSelectDinamico
              label="Préstamo"
              value={prestamoIds}
              opciones={prestamosDisponibles}
              onChange={(value) => onFiltroChange('prestamoIds', value)}
              placeholder="Todos los préstamos"
              filterBy="nombre"
              showContadores={true}
              tipo="prestamo"
              icono="📑"
            />
          </div>
        </div>
      )}
      <div style={filaStyle}>
        <div style={{ flex: 1 }}>
          <MultiSelectDinamico
            label="Estado del Préstamo"
            value={filtros.estadoIds || []}
            opciones={opciones.estados || []}
            onChange={(value) => onFiltroChange('estadoIds', value)}
            placeholder="Todos los estados"
            filterBy="descripcion"
            showContadores={true}
            tipo="estado"
            icono="📊"
          />
        </div>
        <div style={{ flex: 1 }}>
          <RangoFechasField
            onChange={({ fechaDesde, fechaHasta }) => {
              onFiltroChange('fechaDesde', fechaDesde);
              onFiltroChange('fechaHasta', fechaHasta);
            }}
            totalDocumentos={opciones.totalDocumentos}
            label={etiquetaFecha}
          />
        </div>
      </div>
      <div style={{ ...filaStyle, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <RangoMontosField
            montoDesde={filtros.montoDesde}
            montoHasta={filtros.montoHasta}
            onChange={({ montoDesde, montoHasta }) => {
              onFiltroChange('montoDesde', montoDesde);
              onFiltroChange('montoHasta', montoHasta);
            }}
            rangoDatos={opciones.rangoMontos}
            moneda="S/."
          />
        </div>
      </div>
    </div>
  );
};

export default FiltrosPrestamo;
