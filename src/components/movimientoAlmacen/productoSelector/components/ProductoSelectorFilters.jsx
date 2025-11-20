// src/components/movimientoAlmacen/productoSelector/components/ProductoSelectorFilters.jsx
import React from "react";
import { Panel } from "primereact/panel";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";

/**
 * Panel de filtros para el selector de productos
 */
export const ProductoSelectorFilters = ({
  filtros,
  opcionesDinamicas,
  onFiltroChange,
  onLimpiar,
  onNuevoProducto,
  esIngreso,
}) => {
  return (
    <Panel header="Filtros" toggleable collapsed={false}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "10px",
        }}
      >
        {/* Búsqueda */}
        <div>
          <label htmlFor="busqueda" style={{ fontWeight: "bold", fontSize: "0.9em" }}>
            Búsqueda
          </label>
          <InputText
            id="busqueda"
            value={filtros.busqueda}
            onChange={(e) => onFiltroChange("busqueda", e.target.value.toUpperCase())}
            placeholder="BUSCAR..."
            style={{ width: "100%", textTransform: "uppercase" }}
          />
        </div>

        {/* Familia */}
        <div>
          <label htmlFor="familiaId" style={{ fontWeight: "bold", fontSize: "0.9em" }}>
            Familia
          </label>
          <Dropdown
            id="familiaId"
            value={filtros.familiaId}
            options={opcionesDinamicas.familias.map((f) => ({
              label: f.nombre,
              value: Number(f.id),
            }))}
            onChange={(e) => onFiltroChange("familiaId", e.value)}
            placeholder="Todas"
            showClear
            style={{ width: "100%" }}
          />
        </div>

        {/* Subfamilia */}
        <div>
          <label htmlFor="subfamiliaId" style={{ fontWeight: "bold", fontSize: "0.9em" }}>
            Subfamilia
          </label>
          <Dropdown
            id="subfamiliaId"
            value={filtros.subfamiliaId}
            options={opcionesDinamicas.subfamilias.map((s) => ({
              label: s.nombre,
              value: Number(s.id),
            }))}
            onChange={(e) => onFiltroChange("subfamiliaId", e.value)}
            placeholder="Todas"
            showClear
            style={{ width: "100%" }}
          />
        </div>

        {/* Marca */}
        <div>
          <label htmlFor="marcaId" style={{ fontWeight: "bold", fontSize: "0.9em" }}>
            Marca
          </label>
          <Dropdown
            id="marcaId"
            value={filtros.marcaId}
            options={opcionesDinamicas.marcas.map((m) => ({
              label: m.nombre,
              value: Number(m.id),
            }))}
            onChange={(e) => onFiltroChange("marcaId", e.value)}
            placeholder="Todas"
            showClear
            style={{ width: "100%" }}
          />
        </div>

        {/* Procedencia */}
        <div>
          <label htmlFor="procedenciaId" style={{ fontWeight: "bold", fontSize: "0.9em" }}>
            Procedencia
          </label>
          <Dropdown
            id="procedenciaId"
            value={filtros.procedenciaId}
            options={opcionesDinamicas.procedencias.map((p) => ({
              label: p.gentilicio,
              value: Number(p.id),
            }))}
            onChange={(e) => onFiltroChange("procedenciaId", e.value)}
            placeholder="Todas"
            showClear
            style={{ width: "100%" }}
          />
        </div>

        {/* Tipo Almacenamiento */}
        <div>
          <label htmlFor="tipoAlmacenamientoId" style={{ fontWeight: "bold", fontSize: "0.9em" }}>
            Tipo Almacenamiento
          </label>
          <Dropdown
            id="tipoAlmacenamientoId"
            value={filtros.tipoAlmacenamientoId}
            options={opcionesDinamicas.tiposAlmacenamiento.map((t) => ({
              label: t.nombre,
              value: Number(t.id),
            }))}
            onChange={(e) => onFiltroChange("tipoAlmacenamientoId", e.value)}
            placeholder="Todos"
            showClear
            style={{ width: "100%" }}
          />
        </div>

        {/* Tipo Material */}
        <div>
          <label htmlFor="tipoMaterialId" style={{ fontWeight: "bold", fontSize: "0.9em" }}>
            Tipo Material
          </label>
          <Dropdown
            id="tipoMaterialId"
            value={filtros.tipoMaterialId}
            options={opcionesDinamicas.tiposMaterial.map((t) => ({
              label: t.nombre,
              value: Number(t.id),
            }))}
            onChange={(e) => onFiltroChange("tipoMaterialId", e.value)}
            placeholder="Todos"
            showClear
            style={{ width: "100%" }}
          />
        </div>

        {/* Unidad Medida */}
        <div>
          <label htmlFor="unidadMedidaId" style={{ fontWeight: "bold", fontSize: "0.9em" }}>
            Unidad Medida
          </label>
          <Dropdown
            id="unidadMedidaId"
            value={filtros.unidadMedidaId}
            options={opcionesDinamicas.unidadesMedida.map((u) => ({
              label: u.nombre,
              value: Number(u.id),
            }))}
            onChange={(e) => onFiltroChange("unidadMedidaId", e.value)}
            placeholder="Todas"
            showClear
            style={{ width: "100%" }}
          />
        </div>

        {/* Especie */}
        <div>
          <label htmlFor="especieId" style={{ fontWeight: "bold", fontSize: "0.9em" }}>
            Especie
          </label>
          <Dropdown
            id="especieId"
            value={filtros.especieId}
            options={opcionesDinamicas.especies.map((e) => ({
              label: e.nombre,
              value: Number(e.id),
            }))}
            onChange={(e) => onFiltroChange("especieId", e.value)}
            placeholder="Todas"
            showClear
            style={{ width: "100%" }}
          />
        </div>
      </div>

      {/* Botones */}
      <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
        <Button
          label="Limpiar Filtros"
          icon="pi pi-filter-slash"
          className="p-button-sm p-button-secondary"
          onClick={onLimpiar}
        />
        {esIngreso && (
          <Button
            label="Nuevo Producto"
            icon="pi pi-plus"
            className="p-button-sm p-button-success"
            onClick={onNuevoProducto}
          />
        )}
      </div>
    </Panel>
  );
};