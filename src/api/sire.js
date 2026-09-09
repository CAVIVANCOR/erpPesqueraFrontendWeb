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
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📡 API - descargarXMLsMasivo');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📤 Request params:');
  console.log('   URL:', `${API_URL}/descargar-xmls`);
  console.log('   empresaId:', empresaId, typeof empresaId);
  console.log('   periodo:', periodo, typeof periodo);
  console.log('   listaCars:', listaCars);
  console.log('   listaCars.length:', listaCars?.length);
  console.log('   listaCars type:', Array.isArray(listaCars) ? 'Array' : typeof listaCars);
  console.log('📤 Request body:', JSON.stringify({ empresaId, periodo, listaCars }, null, 2));
  
  const res = await axios.post(
    `${API_URL}/descargar-xmls`,
    { empresaId, periodo, listaCars },
    { headers: getAuthHeaders() }
  );
  
  console.log('📥 Response:', res.data);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  return res.data;
}

export async function generarPDFIndividual(empresaId, periodo, car) {
  console.log('📄 API - generarPDFIndividual');
  console.log('   empresaId:', empresaId);
  console.log('   periodo:', periodo);
  console.log('   car:', car);
  
  const res = await axios.post(
    `${API_URL}/generar-pdf-individual`,
    { empresaId, periodo, car },
    { headers: getAuthHeaders() }
  );
  
  return res.data;
}

export async function crearOCIndividual(empresaId, periodo, car, documentoSIRE) {
  console.log('📄 API - crearOCIndividual');
  console.log('   empresaId:', empresaId);
  console.log('   periodo:', periodo);
  console.log('   car:', car);
  
  const res = await axios.post(
    `${API_URL}/crear-oc-individual`,
    { empresaId, periodo, car, documentoSIRE },
    { headers: getAuthHeaders() }
  );
  
  return res.data;
}

export async function descargarPDFParaOrdenCompra(empresaId, periodo, car, ordenCompraId) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📄 API - descargarPDFParaOrdenCompra');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📤 Request:');
  console.log('   URL:', `${API_URL}/descargar-pdf-orden-compra`);
  console.log('   empresaId:', empresaId, typeof empresaId);
  console.log('   periodo:', periodo, typeof periodo);
  console.log('   car:', car, typeof car);
  console.log('   ordenCompraId:', ordenCompraId, typeof ordenCompraId);
  console.log('   Body:', JSON.stringify({ empresaId, periodo, car, ordenCompraId }, null, 2));
  
  const res = await axios.post(
    `${API_URL}/descargar-pdf-orden-compra`,
    { empresaId, periodo, car, ordenCompraId },
    { headers: getAuthHeaders() }
  );
  
  console.log('📥 Response:', res.data);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  return res.data;
}

export async function crearOCMasivo(empresaId, periodo, documentos) {
  console.log('📄 API - crearOCMasivo');
  console.log('   empresaId:', empresaId);
  console.log('   periodo:', periodo);
  console.log('   documentos:', documentos.length);
  
  const res = await axios.post(
    `${API_URL}/crear-oc-masivo`,
    { empresaId, periodo, documentos },
    { headers: getAuthHeaders() }
  );
  
  return res.data;
}