import React, { useState } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Badge } from "primereact/badge";
import TabPanelPescaIndustrial from "../../../components/movimientoCaja/TabPanelPescaIndustrial";
import TabPanelPescaConsumo from "../../../components/movimientoCaja/TabPanelPescaConsumo";
import TabPanelCompras from "../../../components/movimientoCaja/TabPanelCompras";
import TabPanelVentas from "../../../components/movimientoCaja/TabPanelVentas";
import TabPanelAlmacen from "../../../components/movimientoCaja/TabPanelAlmacen";
import TabPanelServicios from "../../../components/movimientoCaja/TabPanelServicios";
import TabPanelOTMantenimiento from "../../../components/movimientoCaja/TabPanelOTMantenimiento";

const AtencionGastosProcesos = ({
  loading,
  toast,
  permisos,
  onAplicarMovimientos,
  personal,
  centrosCosto,
  tipoMovEntregaRendir,
  entidadesComerciales,
  monedas,
  tiposDocumento,
  productos,
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
  cargarEntregasOTMantenimiento
}) => {
  const [activeSubTab, setActiveSubTab] = useState(0);

  return (
    <div className="p-fluid">
      <TabView activeIndex={activeSubTab} onTabChange={(e) => setActiveSubTab(e.index)}>
        <TabPanel
          header={
            <div className="flex align-items-center gap-2">
              <i className="pi pi-ship"></i>
              <span>Pesca Industrial</span>
              <Badge value={movimientosDetEntrega?.length || 0} severity="info" />
            </div>
          }
        >
          <TabPanelPescaIndustrial
            entregaARendir={entregasARendir?.[0] || null}
            movimientos={movimientosDetEntrega}
            personal={personal}
            centrosCosto={centrosCosto}
            tiposMovimiento={tipoMovEntregaRendir}
            entidadesComerciales={entidadesComerciales}
            monedas={monedas}
            loading={loadingDetEntrega}
            permisos={permisos}
            selectedMovimiento={selectedMovimientosDetEntrega}
            onSelectionChange={(e) => {
              setSelectedMovimientosDetEntrega(e.value);
              setSelectedDetMovsIds(e.value ? [e.value.id] : []);
            }}
            onDataChange={() => {
              cargarMovimientosDetEntrega();
              cargarEntregasARendir();
            }}
            onAplicarValidacion={() =>
              onAplicarMovimientos(selectedMovimientosDetEntrega, "industrial")
            }
            toast={toast}
          />
        </TabPanel>

        <TabPanel
          header={
            <div className="flex align-items-center gap-2">
              <i className="pi pi-fish"></i>
              <span>Pesca Consumo</span>
              <Badge value={movimientosDetEntregaConsumo?.length || 0} severity="info" />
            </div>
          }
        >
          <TabPanelPescaConsumo
            entregaARendir={entregasARendirConsumo?.[0] || null}
            movimientos={movimientosDetEntregaConsumo}
            personal={personal}
            centrosCosto={centrosCosto}
            tiposMovimiento={tipoMovEntregaRendir}
            entidadesComerciales={entidadesComerciales}
            monedas={monedas}
            loading={loadingDetEntregaConsumo}
            permisos={permisos}
            selectedMovimiento={selectedMovimientosDetEntregaConsumo}
            onSelectionChange={(e) => {
              setSelectedMovimientosDetEntregaConsumo(e.value);
              setSelectedDetMovsIdsConsumo(e.value ? [e.value.id] : []);
            }}
            onDataChange={() => {
              cargarMovimientosDetEntregaConsumo();
              cargarEntregasARendirConsumo();
            }}
            onAplicarValidacion={() =>
              onAplicarMovimientos(selectedMovimientosDetEntregaConsumo, "consumo")
            }
            toast={toast}
          />
        </TabPanel>

        <TabPanel
          header={
            <div className="flex align-items-center gap-2">
              <i className="pi pi-shopping-cart"></i>
              <span>Compras</span>
              <Badge value={movimientosDetEntregaCompras?.length || 0} severity="info" />
            </div>
          }
        >
          <TabPanelCompras
            entregaARendir={entregasARendirCompras?.[0] || null}
            movimientos={movimientosDetEntregaCompras}
            personal={personal}
            centrosCosto={centrosCosto}
            tiposMovimiento={tipoMovEntregaRendir}
            entidadesComerciales={entidadesComerciales}
            monedas={monedas}
            tiposDocumento={tiposDocumento}
            productos={productos}
            loading={loadingDetEntregaCompras}
            permisos={permisos}
            selectedMovimiento={selectedMovimientosDetEntregaCompras}
            onSelectionChange={(e) => {
              setSelectedMovimientosDetEntregaCompras(e.value);
              setSelectedDetMovsIdsCompras(e.value ? [e.value.id] : []);
            }}
            onDataChange={() => {
              cargarMovimientosDetEntregaCompras();
              cargarEntregasARendirCompras();
            }}
            onAplicarValidacion={() =>
              onAplicarMovimientos(selectedMovimientosDetEntregaCompras, "compras")
            }
            toast={toast}
          />
        </TabPanel>

        <TabPanel
          header={
            <div className="flex align-items-center gap-2">
              <i className="pi pi-dollar"></i>
              <span>Ventas</span>
              <Badge value={movimientosDetEntregaVentas?.length || 0} severity="info" />
            </div>
          }
        >
          <TabPanelVentas
            entregaARendir={entregasARendirVentas?.[0] || null}
            movimientos={movimientosDetEntregaVentas}
            personal={personal}
            centrosCosto={centrosCosto}
            tiposMovimiento={tipoMovEntregaRendir}
            entidadesComerciales={entidadesComerciales}
            monedas={monedas}
            tiposDocumento={tiposDocumento}
            productos={productos}
            loading={loadingDetEntregaVentas}
            permisos={permisos}
            selectedMovimiento={selectedMovimientosDetEntregaVentas}
            onSelectionChange={(e) => {
              setSelectedMovimientosDetEntregaVentas(e.value);
              setSelectedDetMovsIdsVentas(e.value ? [e.value.id] : []);
            }}
            onDataChange={() => {
              cargarMovimientosDetEntregaVentas();
              cargarEntregasARendirVentas();
            }}
            onAplicarValidacion={() =>
              onAplicarMovimientos(selectedMovimientosDetEntregaVentas, "ventas")
            }
            toast={toast}
          />
        </TabPanel>

        <TabPanel
          header={
            <div className="flex align-items-center gap-2">
              <i className="pi pi-box"></i>
              <span>Almacén</span>
              <Badge value={movimientosDetEntregaAlmacen?.length || 0} severity="info" />
            </div>
          }
        >
          <TabPanelAlmacen
            entregaARendir={entregasARendirAlmacen?.[0] || null}
            movimientos={movimientosDetEntregaAlmacen}
            personal={personal}
            centrosCosto={centrosCosto}
            tiposMovimiento={tipoMovEntregaRendir}
            entidadesComerciales={entidadesComerciales}
            monedas={monedas}
            tiposDocumento={tiposDocumento}
            productos={productos}
            loading={loadingDetEntregaAlmacen}
            permisos={permisos}
            selectedMovimiento={selectedMovimientosDetEntregaAlmacen}
            onSelectionChange={(e) => {
              setSelectedMovimientosDetEntregaAlmacen(e.value);
              setSelectedDetMovsIdsAlmacen(e.value ? [e.value.id] : []);
            }}
            onDataChange={() => {
              cargarMovimientosDetEntregaAlmacen();
              cargarEntregasARendirAlmacen();
            }}
            onAplicarValidacion={() =>
              onAplicarMovimientos(selectedMovimientosDetEntregaAlmacen, "almacen")
            }
            toast={toast}
          />
        </TabPanel>

        <TabPanel
          header={
            <div className="flex align-items-center gap-2">
              <i className="pi pi-wrench"></i>
              <span>Servicios</span>
              <Badge value={movimientosDetEntregaServicios?.length || 0} severity="info" />
            </div>
          }
        >
          <TabPanelServicios
            entregaARendir={entregasARendirServicios?.[0] || null}
            movimientos={movimientosDetEntregaServicios}
            personal={personal}
            centrosCosto={centrosCosto}
            tiposMovimiento={tipoMovEntregaRendir}
            entidadesComerciales={entidadesComerciales}
            monedas={monedas}
            tiposDocumento={tiposDocumento}
            productos={productos}
            loading={loadingDetEntregaServicios}
            permisos={permisos}
            selectedMovimiento={selectedMovimientosDetEntregaServicios}
            onSelectionChange={(e) => {
              setSelectedMovimientosDetEntregaServicios(e.value);
              setSelectedDetMovsIdsServicios(e.value ? [e.value.id] : []);
            }}
            onDataChange={() => {
              cargarMovimientosDetEntregaServicios();
              cargarEntregasARendirServicios();
            }}
            onAplicarValidacion={() =>
              onAplicarMovimientos(selectedMovimientosDetEntregaServicios, "servicios")
            }
            toast={toast}
          />
        </TabPanel>

        <TabPanel
          header={
            <div className="flex align-items-center gap-2">
              <i className="pi pi-file-edit"></i>
              <span>OT Mantenimiento</span>
              <Badge value={movimientosOTMantenimiento?.length || 0} severity="info" />
            </div>
          }
        >
          <TabPanelOTMantenimiento
            entregaARendir={entregasOTMantenimiento?.[0] || null}
            movimientos={movimientosOTMantenimiento}
            personal={personal}
            centrosCosto={centrosCosto}
            tiposMovimiento={tipoMovEntregaRendir}
            entidadesComerciales={entidadesComerciales}
            monedas={monedas}
            tiposDocumento={tiposDocumento}
            productos={productos}
            loading={false}
            permisos={permisos}
            selectedMovimiento={selectedMovimientosOTMantenimiento}
            onSelectionChange={(e) => {
              setSelectedMovimientosOTMantenimiento(e.value);
              setSelectedDetMovsIdsOTMantenimiento(e.value ? [e.value.id] : []);
            }}
            onDataChange={() => {
              cargarMovimientosOTMantenimiento();
              cargarEntregasOTMantenimiento();
            }}
            onAplicarValidacion={() =>
              onAplicarMovimientos(selectedMovimientosOTMantenimiento, "otMantenimiento")
            }
            toast={toast}
          />
        </TabPanel>
      </TabView>
    </div>
  );
};

export default AtencionGastosProcesos;