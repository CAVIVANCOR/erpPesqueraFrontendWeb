// src/api/sire.js
import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/sire/compras`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function descargarComprasSIRE(empresaId, periodo) {
  const res = await axios.post(
    `${API_URL}/descargar`,
    { empresaId, periodo },
    { headers: getAuthHeaders() }
  );
  return res.data;
}

export async function importarDocumentosSIRE(empresaId, documentos, usuarioId) {
  const res = await axios.post(
    `${API_URL}/importar`,
    { empresaId, documentos, usuarioId },
    { headers: getAuthHeaders() }
  );
  return res.data;
}

export async function descargarXMLsMasivo(empresaId, periodo, listaCars) {
  const res = await axios.post(
    `${API_URL}/descargar-xmls`,
    { empresaId, periodo, listaCars },
    { headers: getAuthHeaders() }
  );
  return res.data;
}

export async function generarPDFIndividual(empresaId, periodo, car) {
  const res = await axios.post(
    `${API_URL}/generar-pdf-individual`,
    { empresaId, periodo, car },
    { headers: getAuthHeaders() }
  );
  
  return res.data;
}

export async function crearOCIndividual(empresaId, periodo, car, documentoSIRE) {
  const res = await axios.post(
    `${API_URL}/crear-oc-individual`,
    { empresaId, periodo, car, documentoSIRE },
    { headers: getAuthHeaders() }
  );
  
  return res.data;
}

export async function descargarPDFParaOrdenCompra(empresaId, periodo, car, ordenCompraId) {
  const res = await axios.post(
    `${API_URL}/descargar-pdf-orden-compra`,
    { empresaId, periodo, car, ordenCompraId },
    { headers: getAuthHeaders() }
  );
  return res.data;
}

export async function crearOCMasivo(empresaId, periodo, documentos) {
  const res = await axios.post(
    `${API_URL}/crear-oc-masivo`,
    { empresaId, periodo, documentos },
    { headers: getAuthHeaders() }
  );
  
  return res.data;
}