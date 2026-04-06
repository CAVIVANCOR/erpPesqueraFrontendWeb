# 💳 MANUAL DE PROCEDIMIENTOS - ÁREA PAGOS Y CUENTAS POR PAGAR

**ERP MEGUI - Sistema de Gestión Empresarial**  
**Versión:** 1.0  
**Fecha:** Abril 2026

---

## 📋 ÍNDICE

1. [Responsabilidades del Área](#responsabilidades)
2. [Registro de Proveedores](#registro-proveedores)
3. [Cuentas por Pagar - Saldos Iniciales](#cuentas-por-pagar)
4. [Gestión de Pagos](#gestion-pagos)
5. [Control de Vencimientos](#control-vencimientos)
6. [Reportes de Pagos](#reportes)
7. [Checklist de Implementación](#checklist)

---

## 🎯 RESPONSABILIDADES DEL ÁREA {#responsabilidades}

El área de Pagos y Cuentas por Pagar es responsable de:

- ✅ Registrar y mantener actualizada la base de proveedores
- ✅ Registrar saldos iniciales de cuentas por pagar
- ✅ Gestionar el pago de facturas de proveedores
- ✅ Programar pagos según vencimientos
- ✅ Coordinar pagos parciales
- ✅ Gestionar detracciones, retenciones y percepciones
- ✅ Reportar estado de pagos
- ✅ Verificar asientos contables de pagos

---

## 🏢 REGISTRO DE PROVEEDORES {#registro-proveedores}

### **PASO 1: Registrar Proveedores**

**Módulo:** Maestros → Entidad Comercial

**Tipos de proveedor:**

| Tipo | Descripción |
|------|-------------|
| PROVEEDOR | Proveedor regular |
| CLIENTE_PROVEEDOR | Es cliente y proveedor |

**Datos requeridos:**

#### **A. IDENTIFICACIÓN**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Tipo Entidad | PROVEEDOR | PROVEEDOR |
| Tipo Documento | RUC / DNI / CE | RUC |
| Número Documento | Número de documento | 20987654321 |
| Razón Social | Nombre legal | XYZ DISTRIBUIDORES SAC |
| Nombre Comercial | Nombre comercial | XYZ Distribuidores |

#### **B. CONTACTO**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Dirección Fiscal | Dirección legal | Jr. Comercio 456, Lima |
| Teléfono | Teléfono principal | (01) 345-6789 |
| Email | Correo electrónico | ventas@xyzdist.com |
| Contacto Principal | Nombre del contacto | María González |
| Cargo Contacto | Cargo | Jefe de Ventas |

#### **C. INFORMACIÓN COMERCIAL**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Condición Pago | Días de crédito | 45 días |
| Moneda Preferida | PEN / USD | PEN |
| Forma Pago Preferida | TRANSFERENCIA / CHEQUE | TRANSFERENCIA |

#### **D. INFORMACIÓN BANCARIA**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Banco | Banco del proveedor | BCP |
| Tipo Cuenta | AHORROS / CORRIENTE | CORRIENTE |
| Número Cuenta | Número de cuenta | 0098-7654-3210 |
| CCI | Código interbancario | 00209876543210987654 |

#### **E. INFORMACIÓN SUNAT**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Estado SUNAT | ACTIVO / BAJA | ACTIVO |
| Condición SUNAT | HABIDO / NO HABIDO | HABIDO |
| Agente Retención | Sí / No | No |
| Agente Percepción | Sí / No | Sí |
| Buen Contribuyente | Sí / No | Sí |
| Sujeto a Detracción | Sí / No | Sí |

---

### **PASO 2: Procedimiento de Registro**

1. Ingresar al módulo **Maestros → Entidad Comercial**
2. Clic en **"Nueva Entidad"**
3. Seleccionar Tipo: **PROVEEDOR**
4. Completar todos los campos obligatorios
5. Verificar RUC en SUNAT
6. Registrar datos bancarios completos
7. Configurar condiciones de pago
8. Guardar

---

### **Validación de Proveedor en SUNAT:**

**Procedimiento:**
1. Ingresar a: https://e-consultaruc.sunat.gob.pe/
2. Buscar RUC del proveedor
3. Verificar:
   - ✅ Estado: ACTIVO
   - ✅ Condición: HABIDO
   - ✅ Razón Social coincide
   - ✅ Si está sujeto a detracción
   - ✅ Si es agente de percepción
4. Documentar la verificación

---

## 📊 CUENTAS POR PAGAR - SALDOS INICIALES {#cuentas-por-pagar}

### **PASO 1: Preparar Excel de Cuentas por Pagar**

**Formato sugerido:**

| Proveedor | RUC | Factura Proveedor | Fecha Emisión | Fecha Vencimiento | Monto Total | Monto Pagado | **Saldo Pendiente** | Moneda | Tipo | Detracción | Días para Vencer |
|-----------|-----|-------------------|---------------|-------------------|-------------|--------------|---------------------|--------|------|------------|------------------|
| XYZ DIST SAC | 20987654321 | F001-98765 | 20/11/2025 | 20/02/2026 | S/. 45,000 | S/. 15,000 | **S/. 30,000** | PEN | Blanca | S/. 4,500 | 51 |
| PROV ABC | 20456789123 | F002-11111 | 10/12/2025 | 10/01/2026 | S/. 12,000 | S/. 0 | **S/. 12,000** | PEN | Blanca | S/. 0 | 10 |
| SERV DEF | 20789456123 | SI-CXP-001 | 05/12/2025 | 05/01/2026 | S/. 8,000 | S/. 3,000 | **S/. 5,000** | PEN | Negra | S/. 0 | 5 |

**Columnas obligatorias:**
- Proveedor (nombre)
- RUC
- Número de factura del proveedor
- Fecha de emisión
- Fecha de vencimiento
- Monto total original
- Monto ya pagado
- **Saldo pendiente al 31/12/2025**
- Moneda (PEN/USD)
- Tipo (Blanca/Negra)
- Detracción aplicada (si aplica)

---

### **PASO 2: Clasificación de Cuentas por Pagar**

#### **CxP Blancas (Formales):**
- ✅ Tienen factura del proveedor
- ✅ Proveedor con RUC válido
- ✅ Operación formal
- ✅ Sustenta gasto tributario

#### **CxP Negras (Gerenciales):**
- ⚠️ NO tienen factura formal
- ⚠️ Operaciones informales
- ⚠️ Solo para control interno
- ⚠️ No sustentan gasto tributario

**⚠️ IMPORTANTE:** Marcar correctamente el tipo para efectos tributarios.

---

### **PASO 3: Registrar Cuentas por Pagar**

**Módulo:** Finanzas → Cuenta Por Pagar

**Datos por cada CxP:**

#### **A. IDENTIFICACIÓN**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Empresa | Tu empresa | PESQUERA MEGUI SAC |
| Proveedor | Proveedor acreedor | XYZ DISTRIBUIDORES SAC |
| Número Orden Compra | Código único | SI-CXP-0001 |

**⚠️ IMPORTANTE:** Para saldos iniciales, usar código como "SI-CXP-0001", "SI-CXP-0002", etc.

#### **B. FACTURA DEL PROVEEDOR**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Número Factura Proveedor | Nro de su factura | F001-98765 |
| Fecha Factura Proveedor | Fecha de su factura | 20/11/2025 |
| Fecha Emisión | Fecha de registro | 20/11/2025 |
| Fecha Vencimiento | Fecha de pago | 20/02/2026 |

#### **C. MONTOS AL 31/12/2025**

| Campo | Descripción | Valor |
|-------|-------------|-------|
| Monto Total | Deuda original | S/. 45,000.00 |
| Monto Pagado | Lo que YA pagaste | S/. 15,000.00 |
| Saldo Pendiente | **Se calcula automático** | S/. 30,000.00 |
| Moneda | PEN / USD | PEN |

#### **D. CLASIFICACIÓN**

| Campo | Descripción | Valor |
|-------|-------------|-------|
| Es Contado | true / false | false |
| **Es Saldo Inicial** | **✅ MARCAR TRUE** | **true** |
| **Es Gerencial** | Blanca=false / Negra=true | false |

#### **E. DETRACCIÓN (si aplica)**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Tiene Detracción | Sí / No | Sí |
| Monto Detracción | Monto detraído | S/. 4,500.00 (10%) |
| Porcentaje Detracción | Porcentaje | 10% |
| Fecha Detracción | Fecha del depósito | 25/11/2025 |
| Número Constancia | Nro constancia | 987654321 |

---

### **PASO 4: Procedimiento de Registro**

1. Ingresar al módulo **Finanzas → Cuenta Por Pagar**
2. Clic en **"Nueva Cuenta por Pagar"**
3. Completar sección A (Identificación)
4. Completar sección B (Factura del Proveedor)
5. Completar sección C (Montos):
   - Ingresar Monto Total
   - Ingresar Monto Pagado
   - El sistema calcula Saldo Pendiente automáticamente
6. **IMPORTANTE:** Marcar **"Es Saldo Inicial" = TRUE**
7. Marcar "Es Gerencial" según corresponda
8. Si aplica, completar datos de Detracción
9. Guardar

**Asiento automático generado:**

```
591 - Resultados Acumulados (DEBE)  30,000.00
  4212 - Facturas por Pagar (HABER)  30,000.00

Glosa: Saldo inicial CxP Proveedor XYZ - F001-98765
```

10. **Repetir para cada cuenta por pagar pendiente**

---

### **PASO 5: Verificación de Estados**

El sistema calcula automáticamente el estado según:

| Estado | Condición |
|--------|-----------|
| **PENDIENTE** | Monto Pagado = 0 y NO vencido |
| **PAGO PARCIAL** | 0 < Monto Pagado < Monto Total |
| **PAGADO** | Monto Pagado = Monto Total |
| **VENCIDO** | Fecha Vencimiento < Hoy y Saldo > 0 |

**Verificar:**
```
□ Estados calculados correctamente
□ CxP vencidas marcadas como VENCIDO
□ CxP con pagos parciales marcadas como PAGO PARCIAL
□ Saldos pendientes correctos
```

---

## 💰 GESTIÓN DE PAGOS {#gestion-pagos}

### **Registrar Pago de Cuenta por Pagar**

**Módulo:** Finanzas → Pagos Cuentas Por Pagar

**Escenarios de pago:**

#### **1. Pago Total con Transferencia**

| Campo | Valor |
|-------|-------|
| Cuenta por Pagar | Seleccionar CxP |
| Fecha Pago | Fecha del pago |
| Monto Pago | Saldo total |
| Moneda | PEN |
| Medio Pago | TRANSFERENCIA |
| Banco | BCP |
| Cuenta Bancaria | BCP 0012-3456 |
| Número Operación | 123456789 |
| Observaciones | "Pago total Factura F001-98765" |

**Asiento automático:**
```
4212 - Facturas por Pagar (DEBE)  30,000.00
  1041 - Banco BCP (HABER)  30,000.00
```

#### **2. Pago Parcial con Cheque**

| Campo | Valor |
|-------|-------|
| Cuenta por Pagar | Seleccionar CxP |
| Fecha Pago | Fecha del cheque |
| Monto Pago | Monto parcial |
| Moneda | PEN |
| Medio Pago | CHEQUE |
| Banco | BCP |
| Cuenta Bancaria | BCP 0012-3456 |
| Número Operación | Nro del cheque |
| Observaciones | "Pago parcial 1/2 - Cheque 789456" |

**Asiento automático:**
```
4212 - Facturas por Pagar (DEBE)  15,000.00
  1041 - Banco BCP (HABER)  15,000.00
```

#### **3. Pago en Efectivo**

| Campo | Valor |
|-------|-------|
| Cuenta por Pagar | Seleccionar CxP |
| Fecha Pago | Fecha del pago |
| Monto Pago | Monto en efectivo |
| Moneda | PEN |
| Medio Pago | EFECTIVO |
| Observaciones | "Pago en efectivo" |

**Asiento automático:**
```
4212 - Facturas por Pagar (DEBE)  5,000.00
  1011 - Caja (HABER)  5,000.00
```

---

### **Pago con Detracción**

**Procedimiento:**

1. **Calcular detracción:**
   - Monto Factura: S/. 45,000.00
   - Porcentaje Detracción: 10%
   - Monto Detracción: S/. 4,500.00
   - Monto a Pagar: S/. 40,500.00

2. **Depositar detracción en Banco de la Nación:**
   - Cuenta del proveedor
   - Obtener constancia de depósito

3. **Registrar pago en el sistema:**

| Campo | Valor |
|-------|-------|
| Cuenta por Pagar | Seleccionar CxP |
| Fecha Pago | Fecha del pago |
| Monto Pago | S/. 45,000.00 (total) |
| Monto Detracción | S/. 4,500.00 |
| Monto Neto Pagado | S/. 40,500.00 (automático) |
| Número Constancia | 123456789 |
| Fecha Detracción | Fecha del depósito |

**Asientos automáticos:**
```
4212 - Facturas por Pagar (DEBE)  45,000.00
  1041 - Banco BCP (HABER)  40,500.00
  4011X - Detracciones por Pagar (HABER)  4,500.00
```

---

### **Pago en Moneda Extranjera**

**Ejemplo: Pago en USD cuando la factura es en PEN**

| Campo | Valor |
|-------|-------|
| Cuenta por Pagar | CxP en PEN |
| Fecha Pago | 15/01/2026 |
| Monto Pago | $ 8,000.00 |
| Moneda | USD |
| Tipo Cambio | 3.75 (del día) |
| Monto Equivalente | S/. 30,000.00 |
| Medio Pago | TRANSFERENCIA |

**El sistema:**
1. Convierte USD a PEN usando el tipo de cambio
2. Aplica el pago a la CxP
3. Genera asiento con diferencia de cambio (si aplica)

---

## 📅 CONTROL DE VENCIMIENTOS {#control-vencimientos}

### **Clasificación de Pagos**

| Clasificación | Días para Vencer | Acción |
|---------------|------------------|--------|
| **Vencido** | < 0 | Pago urgente |
| **Por Vencer Hoy** | 0 | Pago inmediato |
| **Próximos 7 días** | 1 a 7 | Programar pago |
| **Próximos 15 días** | 8 a 15 | Monitorear |
| **Próximos 30 días** | 16 a 30 | Planificar |
| **Más de 30 días** | > 30 | Seguimiento normal |

---

### **Programación de Pagos**

**Procedimiento semanal:**

#### **Lunes:**
```
□ Generar reporte de CxP por vencer en la semana
□ Verificar saldo disponible en bancos
□ Priorizar pagos según:
  1. Vencidos (evitar moras)
  2. Proveedores críticos
  3. Descuentos por pronto pago
  4. Resto según vencimiento
□ Solicitar aprobación de pagos
```

#### **Martes-Jueves:**
```
□ Ejecutar pagos aprobados
□ Generar transferencias bancarias
□ Emitir cheques (si aplica)
□ Registrar pagos en el sistema
□ Archivar comprobantes
```

#### **Viernes:**
```
□ Verificar pagos ejecutados
□ Actualizar estado de CxP
□ Enviar constancias a proveedores
□ Reporte de pagos de la semana
```

---

### **Priorización de Pagos**

**Criterios de priorización:**

| Prioridad | Criterio | Ejemplo |
|-----------|----------|---------|
| **1 - Crítico** | Servicios básicos | Luz, agua, internet |
| **2 - Muy Alta** | Planilla | Sueldos, beneficios |
| **3 - Alta** | Proveedores críticos | Materia prima clave |
| **4 - Media** | Vencidos con mora | Evitar intereses |
| **5 - Normal** | Próximos a vencer | Dentro del plazo |
| **6 - Baja** | Con plazo amplio | Más de 30 días |

---

### **Gestión de Descuentos por Pronto Pago**

**Ejemplo:**

```
Factura: S/. 100,000.00
Vencimiento: 30 días
Descuento pronto pago: 2% si paga en 10 días

Análisis:
- Pago en 10 días: S/. 98,000.00 (ahorro S/. 2,000)
- Pago en 30 días: S/. 100,000.00

Decisión: Aprovechar descuento si hay liquidez
```

**Registro del pago con descuento:**

| Campo | Valor |
|-------|-------|
| Monto Factura | S/. 100,000.00 |
| Descuento Pronto Pago | S/. 2,000.00 |
| Monto a Pagar | S/. 98,000.00 |

**Asiento:**
```
4212 - Facturas por Pagar (DEBE)  100,000.00
  1041 - Banco (HABER)  98,000.00
  779 - Otros Ingresos (HABER)  2,000.00
```

---

## 📊 REPORTES DE PAGOS {#reportes}

### **Reportes Principales**

| Reporte | Descripción | Frecuencia |
|---------|-------------|------------|
| **CxP Pendientes** | Todas las CxP con saldo | Diario |
| **CxP por Vencer** | CxP próximas a vencer | Diario |
| **CxP Vencidas** | CxP con fecha vencida | Diario |
| **Pagos del Día** | Pagos realizados | Diario |
| **Programación de Pagos** | Pagos planificados | Semanal |
| **Análisis por Proveedor** | Compras y pagos | Mensual |
| **Flujo de Pagos** | Proyección de salidas | Mensual |

---

### **Reporte de Vencimientos**

**Módulo:** Finanzas → Reportes → Vencimientos CxP

**Formato:**

| Proveedor | Factura | Fecha Vencimiento | Monto | Días | Prioridad |
|-----------|---------|-------------------|-------|------|-----------|
| XYZ DIST | F001-98765 | 15/01/2026 | S/. 30,000 | Hoy | CRÍTICO |
| ABC SERV | F002-11111 | 16/01/2026 | S/. 12,000 | 1 día | ALTA |
| DEF PROV | F003-22222 | 20/01/2026 | S/. 8,000 | 5 días | MEDIA |

---

### **Dashboard de Pagos**

**Indicadores clave:**

```
┌─────────────────────────────────────────────────────────────┐
│ DASHBOARD DE PAGOS - ENERO 2026                            │
├─────────────────────────────────────────────────────────────┤
│ Total CxP Pendientes:           S/. 350,000.00             │
│ CxP Vencidas:                   S/.  20,000.00 (6%)        │
│ CxP por Vencer (7 días):        S/.  80,000.00 (23%)       │
│ CxP por Vencer (30 días):       S/. 150,000.00 (43%)       │
│                                                             │
│ Pagos del Mes:                  S/. 180,000.00             │
│ Pagos Programados:              S/.  95,000.00             │
│                                                             │
│ Proveedores Activos:            35 proveedores             │
│ Proveedores con Deuda Vencida:  3 proveedores              │
│                                                             │
│ Promedio Días de Pago:          42 días                    │
│ Cumplimiento de Pagos:          94%                        │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN {#checklist}

### **Semana 1: Preparación**

```
□ Proveedores registrados en el sistema
□ Datos de contacto verificados
□ Datos bancarios completos
□ Condiciones de pago configuradas
□ Información SUNAT verificada
```

### **Semana 2: Saldos Iniciales**

```
□ Excel de CxP preparado
□ Facturas de proveedores verificadas
□ Saldos confirmados
□ Clasificación Blanca/Negra definida
□ Detracciones identificadas
```

### **Semana 3: Registro**

```
□ Todas las CxP registradas
□ Estados verificados
□ Asientos automáticos generados
□ Total CxP cuadra con contabilidad
□ Reporte de vencimientos generado
```

### **Semana 4: Operación**

```
□ Procedimientos de pago implementados
□ Programación de pagos definida
□ Criterios de priorización establecidos
□ Reportes configurados
□ Personal capacitado
□ ¡Sistema operativo!
```

