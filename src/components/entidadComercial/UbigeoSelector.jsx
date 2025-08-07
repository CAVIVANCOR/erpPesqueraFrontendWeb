/**
 * UbigeoSelector.jsx
 *
 * Componente selector de ubigeo con filtros en cascada.
 * Permite filtrar por departamento → provincia → distrito y seleccionar un ubigeo.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { ButtonGroup } from "primereact/buttongroup";

// APIs
import { getDepartamentos } from "../../api/departamento";
import { getProvincias } from "../../api/provincia";
import { getUbigeos } from "../../api/ubigeo";

const UbigeoSelector = ({ onUbigeoSelect, onCancel }) => {
  // Estados
  const [departamentos, setDepartamentos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [ubigeos, setUbigeos] = useState([]);
  const [ubigeosFiltered, setUbigeosFiltered] = useState([]);

  // Filtros
  const [selectedDepartamento, setSelectedDepartamento] = useState(null);
  const [selectedProvincia, setSelectedProvincia] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");

  // Estados de carga
  const [loading, setLoading] = useState(false);
  const [loadingProvincias, setLoadingProvincias] = useState(false);

  const toast = useRef(null);

  /**
   * Cargar departamentos al montar el componente
   */
  useEffect(() => {
    cargarDepartamentos();
    cargarTodasProvincias(); // Cargar todas las provincias inicialmente
    cargarTodosUbigeos();
  }, []);

  /**
   * Cargar provincias cuando se selecciona un departamento
   */
  useEffect(() => {
    if (selectedDepartamento) {
      // Obtener el valor correcto del departamento
      const departamentoId = selectedDepartamento.value || selectedDepartamento;
      cargarProvincias(departamentoId); // Filtrar por departamento
      setSelectedProvincia(null); // Reset provincia
    } else {
      // Si no hay departamento seleccionado, mostrar todas las provincias
      console.log('🔄 Sin departamento seleccionado, cargando todas las provincias');
      cargarProvincias(); // Sin parámetro = todas las provincias
      setSelectedProvincia(null);
    }
  }, [selectedDepartamento]);

  /**
   * Filtrar ubigeos cuando cambian los filtros
   */
  useEffect(() => {
    filtrarUbigeos();
  }, [selectedDepartamento, selectedProvincia, ubigeos]);

  /**
   * Cargar departamentos
   */
  const cargarDepartamentos = async () => {
    try {
      const data = await getDepartamentos();
      const departamentosOptions = data.map((dept) => ({
        label: dept.nombre,
        value: Number(dept.id),
      }));
      setDepartamentos(departamentosOptions);
    } catch (error) {
      console.error("Error al cargar departamentos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar departamentos",
        life: 3000,
      });
    }
  };

  /**
   * Cargar provincias por departamento
   */
  const cargarProvincias = async (departamentoId) => {
    try {
      setLoadingProvincias(true);
      const data = await getProvincias();      
      let provinciasFiltradas;
      
      // Si no hay departamentoId o es null/undefined, mostrar todas las provincias
      if (!departamentoId || departamentoId === null || departamentoId === undefined) {
        provinciasFiltradas = data;
      } else {
        provinciasFiltradas = data.filter(
          (prov) => Number(prov.departamentoId) === Number(departamentoId)
        );
      }      
      const provinciasOptions = provinciasFiltradas.map((prov) => ({
        label: prov.nombre,
        value: Number(prov.id),
      }));
      setProvincias(provinciasOptions);
    } catch (error) {
      console.error("Error al cargar provincias:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar provincias",
        life: 3000,
      });
    } finally {
      setLoadingProvincias(false);
    }
  };

  /**
   * Cargar todas las provincias
   */
  const cargarTodasProvincias = async () => {
    try {
      setLoadingProvincias(true);
      const data = await getProvincias();
      const provinciasOptions = data.map((prov) => ({
        label: prov.nombre,
        value: Number(prov.id),
      }));
      setProvincias(provinciasOptions);
    } catch (error) {
      console.error("Error al cargar provincias:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar provincias",
        life: 3000,
      });
    } finally {
      setLoadingProvincias(false);
    }
  };

  /**
   * Cargar todos los ubigeos
   */
  const cargarTodosUbigeos = async () => {
    try {
      setLoading(true);
      const data = await getUbigeos();
      setUbigeos(data);
      setUbigeosFiltered(data);
    } catch (error) {
      console.error("Error al cargar ubigeos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar ubigeos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filtrar ubigeos según los filtros seleccionados
   */
  const filtrarUbigeos = () => {
    let filtered = [...ubigeos];
    // Filtrar por departamento
    if (selectedDepartamento) {
      // Obtener el valor correcto (puede ser objeto {value: X} o valor directo X)
      const departamentoId = selectedDepartamento.value || selectedDepartamento;      
      filtered = filtered.filter(
        (ubigeo) => {
          // Convertir ambos a string para comparación segura
          const ubigeoDeptoId = Number(ubigeo.departamentoId);
          const selectedDeptoId = Number(departamentoId);
          const match = ubigeoDeptoId === selectedDeptoId;
          return match;
        }
      );
    }

    // Filtrar por provincia
    if (selectedProvincia) {
      // Obtener el valor correcto (puede ser objeto {value: X} o valor directo X)
      const provinciaId = selectedProvincia.value || selectedProvincia;      
      filtered = filtered.filter(
        (ubigeo) => {
          // Convertir ambos a string para comparación segura
          const ubigeoProvId = Number(ubigeo.provinciaId);
          const selectedProvId = Number(provinciaId);
          const match = ubigeoProvId === selectedProvId;
          return match;
        }
      );
    }
    setUbigeosFiltered(filtered);
  };

  /**
   * Limpiar filtros
   */
  const limpiarFiltros = () => {
    setSelectedDepartamento(null);
    setSelectedProvincia(null);
    setGlobalFilter("");
    setUbigeosFiltered(ubigeos);
  };

  /**
   * Template para mostrar el código del ubigeo
   */
  const codigoTemplate = (rowData) => {
    return <strong>{rowData.codigo}</strong>;
  };

  /**
   * Template para acciones (seleccionar)
   */
  const accionesTemplate = (rowData) => {
    console.log("Selecciona Opcion Ubigeo",rowData);
    return (
      <Button
        icon="pi pi-check"
        className="p-button-success p-button-sm"
        tooltip="Seleccionar"
        onClick={() => onUbigeoSelect(rowData)}
      />
    );
  };

  return (
    <div className="ubigeo-selector">
      <Toast ref={toast} />

      {/* Filtros */}

      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <Dropdown
            id="departamento"
            value={selectedDepartamento}
            onChange={(e) => setSelectedDepartamento(e.value)}
            options={departamentos}
            placeholder="Seleccione Departamento"
            showClear
            filter
          />
        </div>
        <div style={{ flex: 1 }}>
          <Dropdown
            id="provincia"
            value={selectedProvincia}
            onChange={(e) => setSelectedProvincia(e.value)}
            options={provincias}
            placeholder="Seleccione Provincia"
            loading={loadingProvincias}
            showClear
            filter
          />
        </div>
        <div style={{ flex: 1 }}>
          <InputText
            id="buscar"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar x código o distrito..."
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 10,
          gap: 15,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <ButtonGroup>
          <Button
            label="Limpiar Filtros"
            icon="pi pi-filter-slash"
            className="p-button-secondary"
            style={{ marginRight: 15 }}
            onClick={limpiarFiltros}
          />
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-secondary mr-2"
            onClick={onCancel}
          />
        </ButtonGroup>
      </div>

      {/* Tabla de ubigeos */}
      <DataTable
        value={ubigeosFiltered}
        loading={loading}
        size="small"
        paginator
        rows={10}
        globalFilter={globalFilter}
        emptyMessage="No se encontraron ubigeos"
        scrollable
        scrollHeight="400px"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} - {last} de {totalRecords} registros"
        rowsPerPageOptions={[10, 25, 50]}        
      >
        <Column
          field="codigo"
          header="Código"
          body={codigoTemplate}
          sortable
          style={{ width: "120px" }}
        />
        <Column field="nombreDistrito" header="Distrito" sortable />
        <Column field="departamento.nombre" header="Departamento" sortable />
        <Column field="provincia.nombre" header="Provincia" sortable />
        <Column
          body={accionesTemplate}
          header="Acción"
          style={{ width: "80px" }}
        />
      </DataTable>
    </div>
  );
};

export default UbigeoSelector;
