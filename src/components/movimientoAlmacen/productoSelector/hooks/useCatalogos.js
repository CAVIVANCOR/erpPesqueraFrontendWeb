// src/components/movimientoAlmacen/productoSelector/hooks/useCatalogos.js
import { useState, useEffect } from "react";
import { getFamiliasProducto } from "../../../../api/familiaProducto";
import { getSubfamiliasProducto } from "../../../../api/subfamiliaProducto";
import { getMarcas } from "../../../../api/marca";
import { getPaises } from "../../../../api/pais";
import { getTiposAlmacenamiento } from "../../../../api/tipoAlmacenamiento";
import { getTiposMaterial } from "../../../../api/tipoMaterial";
import { getUnidadesMedida } from "../../../../api/unidadMedida";
import { getEspecies } from "../../../../api/especie";

/**
 * Custom hook para cargar y gestionar catálogos
 * @param {boolean} visible - Si el diálogo está visible
 * @param {React.RefObject} toast - Referencia al componente Toast
 * @returns {Object} Catálogos cargados
 */
export const useCatalogos = (visible, toast) => {
  const [familias, setFamilias] = useState([]);
  const [subfamilias, setSubfamilias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [paises, setPaises] = useState([]);
  const [tiposAlmacenamiento, setTiposAlmacenamiento] = useState([]);
  const [tiposMaterial, setTiposMaterial] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      cargarCatalogos();
    }
  }, [visible]);

  const cargarCatalogos = async () => {
    setLoading(true);
    try {
      const [
        familiasData,
        subfamiliasData,
        marcasData,
        paisesData,
        tiposAlmData,
        tiposMatData,
        unidadesData,
        especiesData,
      ] = await Promise.all([
        getFamiliasProducto(),
        getSubfamiliasProducto(),
        getMarcas(),
        getPaises(),
        getTiposAlmacenamiento(),
        getTiposMaterial(),
        getUnidadesMedida(),
        getEspecies(),
      ]);

      setFamilias(familiasData);
      setSubfamilias(subfamiliasData);
      setMarcas(marcasData);
      setPaises(paisesData);
      setTiposAlmacenamiento(tiposAlmData);
      setTiposMaterial(tiposMatData);
      setUnidadesMedida(unidadesData);
      setEspecies(especiesData);
    } catch (error) {
      console.error("Error al cargar catálogos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar catálogos",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    familias,
    subfamilias,
    marcas,
    paises,
    tiposAlmacenamiento,
    tiposMaterial,
    unidadesMedida,
    especies,
    loading,
  };
};