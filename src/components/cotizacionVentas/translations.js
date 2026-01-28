// translations.js
// Traducciones para el PDF de Cotización de Ventas

export const translations = {
  en: {
    // Headers de información
    documentDate: "Document Date:",
    expirationDate: "Expiration Date:",
    customer: "Customer:",
    productType: "Product Type:",
    productState: "Product State:",
    productDestination: "Product Destination:",
    paymentMethod: "Payment Method:",
    incoterm: "Incoterm:",
    currency: "Currency:",
    exchangeRate: "Exchange Rate:",
    departureDate: "Departure Date:",
    loadingPort: "Loading Port:",
    arrivalDate: "Arrival Date:",
    unloadingPort: "Unloading Port:",
    destinationCountry: "Destination Country:",
    transitDays: "Transit Days:",
    
    // Tabla de detalles
    productDetails: "PRODUCT DETAILS",
    item: "#",
    product: "Product",
    quantity: "Qty.",
    unit: "Unit",
    netWeight: "Net Weight",
    productionLot: "Prod. Lot",
    productionDate: "Prod. Date",
    expiryDate: "Exp. Date",
    temperature: "Temp.",
    unitPrice: "Unit Price",
    totalPrice: "Total Price",
    
    // Totales
    subtotal: "Subtotal:",
    igv: "VAT",
    total: "TOTAL:",
    totalSalesPrice: "Total Sales Price:",
    
    // Firmas
    salesResponsible: "Sales Responsible",
    authorizedBy: "Authorized By",
    
    // Pie de página
    page: "Page",
    of: "of",
    generated: "Generated:",
    system: "ERP Megui System",
    
    // Document Title
    exportQuotation: "EXPORT QUOTATION",
    salesQuotation: "SALES QUOTATION",
    documentNumber: "No.",
    
    // Additional Information Labels
    containers: "Containers:",
    customsAgent: "Customs Agent:",
    logisticsOperator: "Logistics Operator:",
    shippingLine: "Shipping Line:",
    salesRep: "Sales Rep.:",
    observations: "Observations:",
    address: "Address:",
  },
  es: {
    // Headers de información
    documentDate: "Fecha Documento:",
    expirationDate: "Fecha Vencimiento:",
    customer: "Cliente:",
    productType: "Tipo Producto:",
    productState: "Estado Producto:",
    productDestination: "Destino Producto:",
    paymentMethod: "Forma de Pago:",
    incoterm: "Incoterm:",
    currency: "Moneda:",
    exchangeRate: "Tipo Cambio:",
    departureDate: "Fecha Zarpe:",
    loadingPort: "Puerto Carga:",
    arrivalDate: "Fecha Arribo:",
    unloadingPort: "Puerto Descarga:",
    destinationCountry: "País Destino:",
    transitDays: "Días Tránsito:",
    
    // Tabla de detalles
    productDetails: "DETALLE DE PRODUCTOS",
    item: "#",
    product: "Producto",
    quantity: "Cant.",
    unit: "Unidad",
    netWeight: "Peso Neto",
    productionLot: "Lote Prod.",
    productionDate: "F. Prod.",
    expiryDate: "F. Venc.",
    temperature: "Temp.",
    unitPrice: "V.V.Unit.",
    totalPrice: "V.V.Total",
    
    // Totales
    subtotal: "Subtotal:",
    igv: "IGV",
    total: "TOTAL:",
    totalSalesPrice: "Precio Venta Total:",
    
    // Firmas
    salesResponsible: "Responsable de Ventas",
    authorizedBy: "Autorizado Por",
    
    // Pie de página
    generated: "Generado:",
    system: "Sistema ERP Megui",
    page: "Página",
    of: "de",
    
    // Document Title
    exportQuotation: "COTIZACIÓN",
    salesQuotation: "COTIZACIÓN",
    documentNumber: "No.",
    
    // Additional Information Labels
    containers: "Contenedores:",
    customsAgent: "Agente Aduanas:",
    logisticsOperator: "Operador Logístico:",
    shippingLine: "Naviera:",
    salesRep: "Rep. Ventas:",
    observations: "Observaciones:",
    address: "Dirección:",
  }
};

export const getTranslation = (lang, key) => {
  return translations[lang]?.[key] || translations.en[key] || key;
};