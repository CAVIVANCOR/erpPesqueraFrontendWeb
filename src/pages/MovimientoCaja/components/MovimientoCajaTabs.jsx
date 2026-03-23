import React, { useState } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Card } from "primereact/card";
import { Badge } from "primereact/badge";
import MovimientoCajaTable from "./MovimientoCajaTable";
import AtencionGastosProcesos from "./AtencionGastosProcesos";
import AnalisisMovimientoCaja from "./AnalisisMovimientoCaja";

const MovimientoCajaTabs = ({
  movimientos,
  filteredMovimientos,
  loading,
  onRowClick,
  onSelectionChange,
  permisos,
  onAprobar,
  onRechazar,
  onRevertir,
  onEliminar,
  toast,
  empresas,
  cuentasCorrientes,
  monedas,
  centrosCosto,
  personal,
  modulos,
  estadosMultiFuncion,
  onAplicarMovimientos,
  tipoMovEntregaRendir,
  entidadesComerciales,
  productos,
  tiposDocumento,
  entregasARendir,
  movimientosDetEntrega,
  selectedMovimientosDetEntrega,
  setSelectedMovimientosDetEntrega,
  setSelectedDetMovsIds,
  loadingDetEntrega,
  cargarMovimientosDetEntrega,
  cargarEntregasARendir,
  entregasARendirConsumo,
  movimientosDetEntregaConsumo,
  selectedMovimientosDetEntregaConsumo,
  setSelectedMovimientosDetEntregaConsumo,
  setSelectedDetMovsIdsConsumo,
  loadingDetEntregaConsumo,
  cargarMovimientosDetEntregaConsumo,
  cargarEntregasARendirConsumo,
  entregasARendirCompras,
  movimientosDetEntregaCompras,
  selectedMovimientosDetEntregaCompras,
  setSelectedMovimientosDetEntregaCompras,
  setSelectedDetMovsIdsCompras,
  loadingDetEntregaCompras,
  cargarMovimientosDetEntregaCompras,
  cargarEntregasARendirCompras,
  entregasARendirVentas,
  movimientosDetEntregaVentas,
  selectedMovimientosDetEntregaVentas,
  setSelectedMovimientosDetEntregaVentas,
  setSelectedDetMovsIdsVentas,
  loadingDetEntregaVentas,
  cargarMovimientosDetEntregaVentas,
  cargarEntregasARendirVentas,
  entregasARendirAlmacen,
  movimientosDetEntregaAlmacen,
  selectedMovimientosDetEntregaAlmacen,
  setSelectedMovimientosDetEntregaAlmacen,
  setSelectedDetMovsIdsAlmacen,
  loadingDetEntregaAlmacen,
  cargarMovimientosDetEntregaAlmacen,
  cargarEntregasARendirAlmacen,
  entregasARendirServicios,
  movimientosDetEntregaServicios,
  selectedMovimientosDetEntregaServicios,
  setSelectedMovimientosDetEntregaServicios,
  setSelectedDetMovsIdsServicios,
  loadingDetEntregaServicios,
  cargarMovimientosDetEntregaServicios,
  cargarEntregasARendirServicios,
  entregasOTMantenimiento,
  movimientosOTMantenimiento,
  selectedMovimientosOTMantenimiento,
  setSelectedMovimientosOTMantenimiento,
  setSelectedDetMovsIdsOTMantenimiento,
  cargarMovimientosOTMantenimiento,
  cargarEntregasOTMantenimiento,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <MovimientoCajaTable
            movimientos={filteredMovimientos}
            loading={loading}
            onRowClick={onRowClick}
            onSelectionChange={onSelectionChange}
            permisos={permisos}
            onAprobar={onAprobar}
            onRechazar={onRechazar}
            onRevertir={onRevertir}
            onEliminar={onEliminar}
            empresas={empresas}
            cuentasCorrientes={cuentasCorrientes}
          />
        );

      case 1:
        return (
          <AnalisisMovimientoCaja
            movimientos={filteredMovimientos}
            loading={loading}
            empresas={empresas}
            cuentasCorrientes={cuentasCorrientes}
            monedas={monedas}
            centrosCosto={centrosCosto}
            personal={personal}
            modulos={modulos}
            estadosMultiFuncion={estadosMultiFuncion}
          />
        );

      case 2:
        return (
          <AtencionGastosProcesos
            loading={loading}
            toast={toast}
            permisos={permisos}
            onAplicarMovimientos={onAplicarMovimientos}
            personal={personal}
            centrosCosto={centrosCosto}
            tipoMovEntregaRendir={tipoMovEntregaRendir}
            entidadesComerciales={entidadesComerciales}
            monedas={monedas}
            tiposDocumento={tiposDocumento}
            productos={productos}
            entregasARendir={entregasARendir}
            movimientosDetEntrega={movimientosDetEntrega}
            selectedMovimientosDetEntrega={selectedMovimientosDetEntrega}
            setSelectedMovimientosDetEntrega={setSelectedMovimientosDetEntrega}
            setSelectedDetMovsIds={setSelectedDetMovsIds}
            loadingDetEntrega={loadingDetEntrega}
            cargarMovimientosDetEntrega={cargarMovimientosDetEntrega}
            cargarEntregasARendir={cargarEntregasARendir}
            entregasARendirConsumo={entregasARendirConsumo}
            movimientosDetEntregaConsumo={movimientosDetEntregaConsumo}
            selectedMovimientosDetEntregaConsumo={selectedMovimientosDetEntregaConsumo}
            setSelectedMovimientosDetEntregaConsumo={setSelectedMovimientosDetEntregaConsumo}
            setSelectedDetMovsIdsConsumo={setSelectedDetMovsIdsConsumo}
            loadingDetEntregaConsumo={loadingDetEntregaConsumo}
            cargarMovimientosDetEntregaConsumo={cargarMovimientosDetEntregaConsumo}
            cargarEntregasARendirConsumo={cargarEntregasARendirConsumo}
            entregasARendirCompras={entregasARendirCompras}
            movimientosDetEntregaCompras={movimientosDetEntregaCompras}
            selectedMovimientosDetEntregaCompras={selectedMovimientosDetEntregaCompras}
            setSelectedMovimientosDetEntregaCompras={setSelectedMovimientosDetEntregaCompras}
            setSelectedDetMovsIdsCompras={setSelectedDetMovsIdsCompras}
            loadingDetEntregaCompras={loadingDetEntregaCompras}
            cargarMovimientosDetEntregaCompras={cargarMovimientosDetEntregaCompras}
            cargarEntregasARendirCompras={cargarEntregasARendirCompras}
            entregasARendirVentas={entregasARendirVentas}
            movimientosDetEntregaVentas={movimientosDetEntregaVentas}
            selectedMovimientosDetEntregaVentas={selectedMovimientosDetEntregaVentas}
            setSelectedMovimientosDetEntregaVentas={setSelectedMovimientosDetEntregaVentas}
            setSelectedDetMovsIdsVentas={setSelectedDetMovsIdsVentas}
            loadingDetEntregaVentas={loadingDetEntregaVentas}
            cargarMovimientosDetEntregaVentas={cargarMovimientosDetEntregaVentas}
            cargarEntregasARendirVentas={cargarEntregasARendirVentas}
            entregasARendirAlmacen={entregasARendirAlmacen}
            movimientosDetEntregaAlmacen={movimientosDetEntregaAlmacen}
            selectedMovimientosDetEntregaAlmacen={selectedMovimientosDetEntregaAlmacen}
            setSelectedMovimientosDetEntregaAlmacen={setSelectedMovimientosDetEntregaAlmacen}
            setSelectedDetMovsIdsAlmacen={setSelectedDetMovsIdsAlmacen}
            loadingDetEntregaAlmacen={loadingDetEntregaAlmacen}
            cargarMovimientosDetEntregaAlmacen={cargarMovimientosDetEntregaAlmacen}
            cargarEntregasARendirAlmacen={cargarEntregasARendirAlmacen}
            entregasARendirServicios={entregasARendirServicios}
            movimientosDetEntregaServicios={movimientosDetEntregaServicios}
            selectedMovimientosDetEntregaServicios={selectedMovimientosDetEntregaServicios}
            setSelectedMovimientosDetEntregaServicios={setSelectedMovimientosDetEntregaServicios}
            setSelectedDetMovsIdsServicios={setSelectedDetMovsIdsServicios}
            loadingDetEntregaServicios={loadingDetEntregaServicios}
            cargarMovimientosDetEntregaServicios={cargarMovimientosDetEntregaServicios}
            cargarEntregasARendirServicios={cargarEntregasARendirServicios}
            entregasOTMantenimiento={entregasOTMantenimiento}
            movimientosOTMantenimiento={movimientosOTMantenimiento}
            selectedMovimientosOTMantenimiento={selectedMovimientosOTMantenimiento}
            setSelectedMovimientosOTMantenimiento={setSelectedMovimientosOTMantenimiento}
            setSelectedDetMovsIdsOTMantenimiento={setSelectedDetMovsIdsOTMantenimiento}
            cargarMovimientosOTMantenimiento={cargarMovimientosOTMantenimiento}
            cargarEntregasOTMantenimiento={cargarEntregasOTMantenimiento}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
        <TabPanel
          header={
            <div className="flex align-items-center gap-2">
              <i className="pi pi-list"></i>
              <span>Movimientos</span>
              <Badge value={filteredMovimientos?.length || 0} severity="info" />
            </div>
          }
        >
          {renderTabContent()}
        </TabPanel>

        <TabPanel
          header={
            <div className="flex align-items-center gap-2">
              <i className="pi pi-chart-bar"></i>
              <span>Análisis</span>
            </div>
          }
        >
          {renderTabContent()}
        </TabPanel>

        <TabPanel
          header={
            <div className="flex align-items-center gap-2">
              <i className="pi pi-money-bill"></i>
              <span>Atención Gastos Procesos</span>
            </div>
          }
        >
          {renderTabContent()}
        </TabPanel>
      </TabView>
    </Card>
  );
};

export default MovimientoCajaTabs;