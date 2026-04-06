# 📥 MANUAL DE PROCEDIMIENTOS - ÁREA COBRANZAS

**ERP MEGUI - Sistema de Gestión Empresarial**  
**Versión:** 1.0  
**Fecha:** Abril 2026

---

## 📋 ÍNDICE

1. [Responsabilidades del Área](#responsabilidades)
2. [Registro de Clientes](#registro-clientes)
3. [Cuentas por Cobrar - Saldos Iniciales](#cuentas-por-cobrar)
4. [Gestión de Cobros](#gestion-cobros)
5. [Seguimiento de Cobranzas](#seguimiento)
6. [Reportes de Cobranzas](#reportes)
7. [Checklist de Implementación](#checklist)

---

## 🎯 RESPONSABILIDADES DEL ÁREA {#responsabilidades}

El área de Cobranzas es responsable de:

- ✅ Registrar y mantener actualizada la base de clientes
- ✅ Registrar saldos iniciales de cuentas por cobrar
- ✅ Gestionar el cobro de facturas pendientes
- ✅ Realizar seguimiento a clientes morosos
- ✅ Coordinar pagos parciales
- ✅ Gestionar letras de cambio
- ✅ Reportar estado de cobranzas
- ✅ Verificar asientos contables de cobros

---

## 👥 REGISTRO DE CLIENTES {#registro-clientes}

### **PASO 1: Registrar Clientes**

**Módulo:** Maestros → Entidad Comercial

**Tipos de cliente:**

| Tipo | Descripción |
|------|-------------|
| CLIENTE | Cliente regular |
| CLIENTE_PROVEEDOR | Es cliente y proveedor |

**Datos requeridos:**

#### **A. IDENTIFICACIÓN**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Tipo Entidad | CLIENTE | CLIENTE |
| Tipo Documento | RUC / DNI / CE | RUC |
| Número Documento | Número de documento | 20123456789 |
| Razón Social | Nombre legal | ABC TRADING SAC |
| Nombre Comercial | Nombre comercial | ABC Trading |

#### **B. CONTACTO**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Dirección Fiscal | Dirección legal | Av. Principal 123, Lima |
| Teléfono | Teléfono principal | (01) 234-5678 |
| Email | Correo electrónico | ventas@abctrading.com |
| Contacto Principal | Nombre del contacto | Juan Pérez |
| Cargo Contacto | Cargo | Gerente de Compras |

#### **C. INFORMACIÓN COMERCIAL**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Condición Pago | Días de crédito | 30 días |
| Límite Crédito | Monto máximo | S/. 50,000.00 |
| Moneda Preferida | PEN / USD | PEN |
| Vendedor Asignado | Responsable | Carlos López |

#### **D. INFORMACIÓN SUNAT**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Estado SUNAT | ACTIVO / BAJA | ACTIVO |
| Condición SUNAT | HABIDO / NO HABIDO | HABIDO |
| Agente Retención | Sí / No | No |
| Agente Percepción | Sí / No | No |
| Buen Contribuyente | Sí / No | Sí |

---

### **PASO 2: Procedimiento de Registro**

1. Ingresar al módulo **Maestros → Entidad Comercial**
2. Clic en **"Nueva Entidad"**
3. Seleccionar Tipo: **CLIENTE**
4. Completar todos los campos obligatorios
5. Verificar RUC en SUNAT (si aplica)
6. Asignar vendedor responsable
7. Configurar condiciones de crédito
8. Guardar

---

### **Validación de RUC en SUNAT:**

**Procedimiento:**
1. Ingresar a: https://e-consultaruc.sunat.gob.pe/
2. Buscar RUC del cliente
3. Verificar:
   - ✅ Estado: ACTIVO
   - ✅ Condición: HABIDO
   - ✅ Razón Social coincide
   - ✅ Dirección fiscal actualizada
4. Si hay inconsistencias, solicitar documentos al cliente

---

## 📊 CUENTAS POR COBRAR - SALDOS INICIALES {#cuentas-por-cobrar}

### **PASO 1: Preparar Excel de Cuentas por Cobrar**

**Formato sugerido:**

| Cliente | RUC | Nro Factura | Fecha Emisión | Fecha Vencimiento | Monto Total | Monto Pagado | **Saldo Pendiente** | Moneda | Tipo | Días Vencidos |
|---------|-----|-------------|---------------|-------------------|-------------|--------------|---------------------|--------|------|---------------|
| ABC SAC | 20123456789 | F001-1234 | 15/11/2025 | 15/01/2026 | S/. 25,000 | S/. 10,000 | **S/. 15,000** | PEN | Blanca | 0 |
| XYZ EIRL | 20987654321 | F001-5678 | 20/10/2025 | 20/12/2025 | S/. 8,500 | S/. 0 | **S/. 8,500** | PEN | Blanca | 11 |
| DEF SAC | 20456789123 | SI-CXC-001 | 05/12/2025 | 05/02/2026 | S/. 12,000 | S/. 5,000 | **S/. 7,000** | PEN | Negra | 0 |

**Columnas obligatorias:**
- Cliente (nombre)
- RUC o DNI
- Número de factura o código
- Fecha de emisión
- Fecha de vencimiento
- Monto total original
- Monto ya pagado
- **Saldo pendiente al 31/12/2025**
- Moneda (PEN/USD)
- Tipo (Blanca/Negra)

---

### **PASO 2: Clasificación de Cuentas por Cobrar**

#### **CxC Blancas (Formales):**
- ✅ Tienen comprobante electrónico SUNAT
- ✅ Factura o boleta emitida
- ✅ Declaradas en impuestos
- ✅ Cliente con RUC válido

#### **CxC Negras (Gerenciales):**
- ⚠️ NO tienen comprobante SUNAT
- ⚠️ Operaciones informales
- ⚠️ Solo para control interno
- ⚠️ No declaradas en impuestos

**⚠️ IMPORTANTE:** Marcar correctamente el tipo para efectos tributarios.

---

### **PASO 3: Registrar Cuentas por Cobrar**

**Módulo:** Finanzas → Cuenta Por Cobrar

**Datos por cada CxC:**

#### **A. IDENTIFICACIÓN**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Empresa | Tu empresa | PESQUERA MEGUI SAC |
| Cliente | Cliente deudor | ABC TRADING SAC |
| Número PreFactura | Código único | SI-CXC-0001 |

**⚠️ IMPORTANTE:** Para saldos iniciales, usar código como "SI-CXC-0001", "SI-CXC-0002", etc.

#### **B. DOCUMENTO**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Fecha Emisión | Fecha de la factura | 15/11/2025 |
| Fecha Vencimiento | Fecha de pago | 15/01/2026 |
| Tipo Comprobante | FACTURA / BOLETA | FACTURA |
| Serie Comprobante | Serie | F001 |
| Número Comprobante | Número | 1234 |

#### **C. MONTOS AL 31/12/2025**

| Campo | Descripción | Valor |
|-------|-------------|-------|
| Monto Total | Deuda original | S/. 25,000.00 |
| Monto Pagado | Lo que YA pagó | S/. 10,000.00 |
| Saldo Pendiente | **Se calcula automático** | S/. 15,000.00 |
| Moneda | PEN / USD | PEN |

#### **D. CLASIFICACIÓN**

| Campo | Descripción | Valor |
|-------|-------------|-------|
| Es Contado | true / false | false |
| **Es Saldo Inicial** | **✅ MARCAR TRUE** | **true** |
| **Es Gerencial** | Blanca=false / Negra=true | false |

#### **E. SUNAT (si aplica)**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Tiene Detracción | Sí / No | Sí |
| Monto Detracción | Monto detraído | S/. 2,500.00 (10%) |
| Porcentaje Detracción | Porcentaje | 10% |
| Fecha Detracción | Fecha del depósito | 20/11/2025 |
| Número Constancia | Nro constancia | 123456789 |

---

### **PASO 4: Procedimiento de Registro**

1. Ingresar al módulo **Finanzas → Cuenta Por Cobrar**
2. Clic en **"Nueva Cuenta por Cobrar"**
3. Completar sección A (Identificación)
4. Completar sección B (Documento)
5. Completar sección C (Montos):
   - Ingresar Monto Total
   - Ingresar Monto Pagado
   - El sistema calcula Saldo Pendiente automáticamente
6. **IMPORTANTE:** Marcar **"Es Saldo Inicial" = TRUE**
7. Marcar "Es Gerencial" según corresponda
8. Si aplica, completar datos SUNAT (Detracción)
9. Guardar

**Asiento automático generado:**

```
1212 - Facturas por Cobrar (DEBE)  15,000.00
  591 - Resultados Acumulados (HABER)  15,000.00

Glosa: Saldo inicial CxC Cliente ABC SAC - F001-1234
```

10. **Repetir para cada cuenta por cobrar pendiente**

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
□ CxC vencidas marcadas como VENCIDO
□ CxC con pagos parciales marcadas como PAGO PARCIAL
□ Saldos pendientes correctos
```

---

## 💰 GESTIÓN DE COBROS {#gestion-cobros}

### **Registrar Cobro de Cuenta por Cobrar**

**Módulo:** Finanzas → Pagos Cuentas Por Cobrar

**Escenarios de cobro:**

#### **1. Cobro Total en Efectivo**

| Campo | Valor |
|-------|-------|
| Cuenta por Cobrar | Seleccionar CxC |
| Fecha Cobro | Fecha del cobro |
| Monto Cobro | Saldo total |
| Moneda | PEN |
| Medio Pago | EFECTIVO |
| Observaciones | "Cobro total Factura F001-1234" |

**Asiento automático:**
```
1011 - Caja (DEBE)  15,000.00
  1212 - Facturas por Cobrar (HABER)  15,000.00
```

#### **2. Cobro Parcial con Transferencia**

| Campo | Valor |
|-------|-------|
| Cuenta por Cobrar | Seleccionar CxC |
| Fecha Cobro | Fecha del cobro |
| Monto Cobro | Monto parcial |
| Moneda | PEN |
| Medio Pago | TRANSFERENCIA |
| Banco | BCP |
| Cuenta Bancaria | BCP 0012-3456 |
| Número Operación | 123456789 |
| Observaciones | "Cobro parcial 1/3" |

**Asiento automático:**
```
1041 - Banco BCP (DEBE)  5,000.00
  1212 - Facturas por Cobrar (HABER)  5,000.00
```

#### **3. Cobro con Cheque**

| Campo | Valor |
|-------|-------|
| Cuenta por Cobrar | Seleccionar CxC |
| Fecha Cobro | Fecha del cheque |
| Monto Cobro | Monto del cheque |
| Moneda | PEN |
| Medio Pago | CHEQUE |
| Banco | Banco del cheque |
| Número Operación | Número del cheque |
| Fecha Vencimiento Cheque | Fecha de cobro |
| Observaciones | "Cheque Nro 123456" |

---

### **Cobro en Moneda Extranjera**

**Ejemplo: Cobro en USD cuando la factura es en PEN**

| Campo | Valor |
|-------|-------|
| Cuenta por Cobrar | CxC en PEN |
| Fecha Cobro | 15/01/2026 |
| Monto Cobro | $ 4,000.00 |
| Moneda | USD |
| Tipo Cambio | 3.75 (del día) |
| Monto Equivalente | S/. 15,000.00 |
| Medio Pago | TRANSFERENCIA |

**El sistema:**
1. Convierte USD a PEN usando el tipo de cambio
2. Aplica el pago a la CxC
3. Genera asiento con diferencia de cambio (si aplica)

---

## 📈 SEGUIMIENTO DE COBRANZAS {#seguimiento}

### **Clasificación de Cartera**

| Clasificación | Días Vencidos | Acción |
|---------------|---------------|--------|
| **Al Día** | 0 | Monitoreo normal |
| **Por Vencer** | -7 a 0 | Recordatorio preventivo |
| **Vencido Leve** | 1 a 15 | Llamada telefónica |
| **Vencido Moderado** | 16 a 30 | Carta de cobranza |
| **Vencido Grave** | 31 a 60 | Visita personal |
| **Vencido Crítico** | > 60 | Acciones legales |

---

### **Procedimiento de Seguimiento**

#### **Diario:**
```
□ Revisar cobros del día
□ Registrar pagos recibidos
□ Actualizar estado de CxC
□ Identificar nuevas CxC vencidas
```

#### **Semanal:**
```
□ Generar reporte de CxC vencidas
□ Contactar clientes con deuda vencida
□ Programar visitas a clientes críticos
□ Actualizar plan de cobranzas
```

#### **Mensual:**
```
□ Análisis de antigüedad de saldos
□ Evaluación de límites de crédito
□ Reporte de cobranzas a gerencia
□ Provisión de cuentas incobrables
```

---

### **Gestión de Clientes Morosos**

**Procedimiento escalonado:**

#### **Día 1-7 de atraso:**
- ✅ Llamada telefónica amigable
- ✅ Recordatorio por email
- ✅ Consultar motivo del atraso

#### **Día 8-15 de atraso:**
- ⚠️ Llamada más formal
- ⚠️ Carta de cobranza simple
- ⚠️ Proponer plan de pagos

#### **Día 16-30 de atraso:**
- 🔴 Carta de cobranza formal
- 🔴 Visita personal
- 🔴 Suspender nuevos créditos

#### **Día 31-60 de atraso:**
- 🚨 Carta notarial
- 🚨 Negociación de deuda
- 🚨 Considerar canje por letras

#### **Más de 60 días:**
- ⚖️ Evaluación legal
- ⚖️ Demanda judicial
- ⚖️ Provisión como incobrable

---

### **Formato de Carta de Cobranza**

```
[MEMBRETE EMPRESA]

Lima, [Fecha]

Señores
[RAZÓN SOCIAL CLIENTE]
[Dirección]

Asunto: Cobranza de Factura Vencida

De nuestra consideración:

Por medio de la presente, nos dirigimos a ustedes para recordarles 
que mantienen una deuda pendiente con nuestra empresa por concepto de:

Factura: F001-1234
Fecha Emisión: 15/11/2025
Fecha Vencimiento: 15/01/2026
Monto: S/. 15,000.00
Días de Atraso: 15 días

Les solicitamos regularizar esta situación a la brevedad posible.
De lo contrario, nos veremos en la obligación de tomar las medidas 
legales correspondientes.

Para coordinar el pago, pueden contactarnos al teléfono [XXX] o 
email [XXX].

Atentamente,

[Firma]
[Nombre]
Jefe de Cobranzas
```

---

## 📊 REPORTES DE COBRANZAS {#reportes}

### **Reportes Principales**

| Reporte | Descripción | Frecuencia |
|---------|-------------|------------|
| **CxC Pendientes** | Todas las CxC con saldo | Diario |
| **CxC Vencidas** | CxC con fecha vencida | Diario |
| **Antigüedad de Saldos** | Clasificación por días | Semanal |
| **Cobranzas del Día** | Cobros realizados | Diario |
| **Proyección de Cobros** | Cobros esperados | Semanal |
| **Análisis por Cliente** | Comportamiento de pago | Mensual |

---

### **Reporte de Antigüedad de Saldos**

**Módulo:** Finanzas → Reportes → Antigüedad CxC

**Formato:**

| Cliente | Total Deuda | Al Día | 1-15 días | 16-30 días | 31-60 días | > 60 días |
|---------|-------------|--------|-----------|------------|------------|-----------|
| ABC SAC | S/. 50,000 | S/. 30,000 | S/. 10,000 | S/. 5,000 | S/. 5,000 | S/. 0 |
| XYZ EIRL | S/. 20,000 | S/. 0 | S/. 0 | S/. 8,000 | S/. 12,000 | S/. 0 |
| DEF SAC | S/. 15,000 | S/. 15,000 | S/. 0 | S/. 0 | S/. 0 | S/. 0 |

---

### **Dashboard de Cobranzas**

**Indicadores clave:**

```
┌─────────────────────────────────────────────────────────────┐
│ DASHBOARD DE COBRANZAS - ENERO 2026                        │
├─────────────────────────────────────────────────────────────┤
│ Total CxC Pendientes:           S/. 250,000.00             │
│ CxC Al Día:                     S/. 180,000.00 (72%)       │
│ CxC Vencidas:                   S/.  70,000.00 (28%)       │
│                                                             │
│ Cobros del Mes:                 S/. 120,000.00             │
│ Meta de Cobranza:               S/. 150,000.00             │
│ Cumplimiento:                   80%                        │
│                                                             │
│ Clientes Morosos:               8 clientes                 │
│ Clientes al Día:                45 clientes                │
│                                                             │
│ Promedio Días de Cobro:         35 días                    │
│ Índice de Morosidad:            28%                        │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN {#checklist}

### **Semana 1: Preparación**

```
□ Clientes registrados en el sistema
□ Datos de contacto verificados
□ Condiciones de crédito configuradas
□ Vendedores asignados
□ Límites de crédito establecidos
```

### **Semana 2: Saldos Iniciales**

```
□ Excel de CxC preparado
□ Facturas verificadas
□ Saldos confirmados con clientes
□ Clasificación Blanca/Negra definida
□ Detracciones identificadas
```

### **Semana 3: Registro**

```
□ Todas las CxC registradas
□ Estados verificados
□ Asientos automáticos generados
□ Total CxC cuadra con contabilidad
□ Reporte de antigüedad generado
```

### **Semana 4: Operación**

```
□ Procedimientos de cobranza implementados
□ Formatos de cartas preparados
□ Plan de seguimiento definido
□ Reportes configurados
□ Personal capacitado
□ ¡Sistema operativo!
```
