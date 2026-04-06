# 📊 MANUAL DE PROCEDIMIENTOS - ÁREA CONTABILIDAD

**ERP MEGUI - Sistema de Gestión Empresarial**  
**Versión:** 1.0  
**Fecha:** Abril 2026

---

## 📋 ÍNDICE

1. [Responsabilidades del Área](#responsabilidades)
2. [Plan de Cuentas Contable](#plan-cuentas)
3. [Períodos Contables](#periodos-contables)
4. [Configuración de Cuentas Contables](#configuracion-cuentas)
5. [Asiento de Apertura](#asiento-apertura)
6. [Asientos Contables](#asientos-contables)
7. [Verificación y Cierre](#verificacion-cierre)
8. [Reportes Contables](#reportes)
9. [Checklist de Implementación](#checklist)

---

## 🎯 RESPONSABILIDADES DEL ÁREA {#responsabilidades}

El área de Contabilidad es responsable de:

- ✅ Cargar y mantener el Plan de Cuentas Contable
- ✅ Crear y gestionar Períodos Contables
- ✅ Configurar cuentas contables para generación automática de asientos
- ✅ Registrar el Asiento de Apertura
- ✅ Revisar y aprobar asientos automáticos
- ✅ Registrar asientos manuales cuando sea necesario
- ✅ Verificar cuadre de asientos
- ✅ Generar reportes contables (Balance, Estado de Resultados, Libros)
- ✅ Cerrar períodos contables

---

## 📖 PLAN DE CUENTAS CONTABLE {#plan-cuentas}

### **PASO 1: Cargar Plan Contable General Empresarial (PCGE)**

**Módulo:** Contabilidad → Plan Contable

**Estructura del PCGE Perú:**

| Elemento | Código | Descripción | Ejemplo |
|----------|--------|-------------|---------|
| Clase | 1 dígito | Categoría principal | 1 - ACTIVO |
| Cuenta | 2 dígitos | Subcategoría | 10 - EFECTIVO Y EQUIVALENTES |
| Subcuenta | 3 dígitos | Detalle | 104 - CUENTAS CORRIENTES |
| Divisionaria | 4 dígitos | Mayor detalle | 1041 - CUENTAS CORRIENTES OPERATIVAS |
| Subdivisionaria | 5 dígitos | Máximo detalle | 10411 - BANCO BCP SOLES |

**Clases del PCGE:**

| Clase | Descripción | Naturaleza |
|-------|-------------|------------|
| 1 | ACTIVO | Deudora |
| 2 | ACTIVO | Deudora |
| 3 | ACTIVO | Deudora |
| 4 | PASIVO | Acreedora |
| 5 | PATRIMONIO | Acreedora |
| 6 | GASTOS | Deudora |
| 7 | INGRESOS | Acreedora |
| 8 | SALDOS INTERMEDIARIOS DE GESTIÓN | Variable |
| 9 | CONTABILIDAD ANALÍTICA DE EXPLOTACIÓN | Variable |
| 0 | CUENTAS DE ORDEN | Variable |

---

### **PASO 2: Registrar Cuentas Contables**

**Procedimiento:**

1. Ingresar al módulo **Contabilidad → Plan Contable**
2. Clic en **"Nueva Cuenta"**
3. Completar los siguientes campos:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Código | Código de la cuenta | 10411 |
| Descripción | Nombre de la cuenta | Banco BCP Soles |
| Nivel | Nivel de la cuenta (1-5) | 5 |
| Cuenta Padre | Cuenta superior | 1041 |
| Naturaleza | DEUDORA o ACREEDORA | DEUDORA |
| Tipo | DETALLE o TÍTULO | DETALLE |
| Acepta Movimiento | Sí/No | SÍ |
| Estado | ACTIVO | ACTIVO |

4. Guardar
5. **Repetir para todas las cuentas del PCGE**

**⚠️ IMPORTANTE:**
- Solo las cuentas de nivel 5 (subdivisionarias) deben tener "Acepta Movimiento = SÍ"
- Las cuentas de nivel 1-4 son solo títulos (Acepta Movimiento = NO)

---

### **Cuentas Principales a Crear:**

#### **ACTIVO (Clase 1 y 2)**

```
10 - EFECTIVO Y EQUIVALENTES DE EFECTIVO
  101 - Caja
    1011 - Caja Principal
  104 - Cuentas Corrientes en Instituciones Financieras
    1041 - Cuentas Corrientes Operativas
      10411 - Banco BCP Soles
      10412 - Banco BBVA Soles
      10413 - Banco BCP Dólares

12 - CUENTAS POR COBRAR COMERCIALES - TERCEROS
  121 - Facturas, boletas y otros comprobantes por cobrar
    1212 - Emitidas en cartera
      12121 - Facturas por Cobrar

20 - MERCADERÍAS
  201 - Mercaderías Manufacturadas
    2011 - Mercaderías Manufacturadas
      20111 - Harina de Pescado
      20112 - Aceite de Pescado

33 - INMUEBLES, MAQUINARIA Y EQUIPO
  333 - Maquinarias y Equipos de Explotación
  334 - Unidades de Transporte
  335 - Muebles y Enseres
  336 - Equipos Diversos

39 - DEPRECIACIÓN, AMORTIZACIÓN Y AGOTAMIENTO ACUMULADOS
  391 - Depreciación Acumulada
```

#### **PASIVO (Clase 4)**

```
40 - TRIBUTOS, CONTRAPRESTACIONES Y APORTES AL SISTEMA DE PENSIONES
  401 - Gobierno Central
    4011 - Impuesto General a las Ventas
      40111 - IGV - Cuenta Propia

42 - CUENTAS POR PAGAR COMERCIALES - TERCEROS
  421 - Facturas, boletas y otros comprobantes por pagar
    4212 - Emitidas

45 - OBLIGACIONES FINANCIERAS
  451 - Préstamos de Instituciones Financieras
    4511 - Instituciones Financieras - Corto Plazo
    4512 - Instituciones Financieras - Largo Plazo
```

#### **PATRIMONIO (Clase 5)**

```
50 - CAPITAL
  501 - Capital Social

58 - RESERVAS
  582 - Legal

59 - RESULTADOS ACUMULADOS
  591 - Utilidades no Distribuidas
  592 - Pérdidas Acumuladas
```

#### **GASTOS (Clase 6)**

```
60 - COMPRAS
  601 - Mercaderías
  609 - Costos Vinculados con las Compras

63 - GASTOS DE SERVICIOS PRESTADOS POR TERCEROS
  631 - Transporte, Correos y Gastos de Viaje
  634 - Mantenimiento y Reparaciones
  636 - Servicios Básicos

64 - GASTOS POR TRIBUTOS
  641 - Gobierno Central

68 - VALUACIÓN Y DETERIORO DE ACTIVOS Y PROVISIONES
  681 - Depreciación

69 - COSTO DE VENTAS
  691 - Mercaderías
```

#### **INGRESOS (Clase 7)**

```
70 - VENTAS
  701 - Mercaderías
    7011 - Mercaderías Manufacturadas
      70111 - Terceros

77 - INGRESOS FINANCIEROS
  772 - Rendimientos Ganados
  776 - Diferencia de Cambio

67 - GASTOS FINANCIEROS
  673 - Intereses por Préstamos
  677 - Diferencia de Cambio
```

---

## 📅 PERÍODOS CONTABLES {#periodos-contables}

### **PASO 1: Crear Período Contable 2025**

**Módulo:** Contabilidad → Período Contable

**Datos requeridos:**

| Campo | Valor |
|-------|-------|
| Año | 2025 |
| Mes | Diciembre |
| Fecha Inicio | 01/12/2025 |
| Fecha Fin | 31/12/2025 |
| Estado | ABIERTO (50) |
| Empresa | Seleccionar empresa |

**Procedimiento:**
1. Ingresar al módulo **Contabilidad → Período Contable**
2. Clic en **"Nuevo Período"**
3. Completar los datos de la tabla
4. Estado inicial: **ABIERTO**
5. Guardar

**⚠️ IMPORTANTE:** Este período se usará para registrar los saldos iniciales al 31/12/2025.

---

### **PASO 2: Crear Período Contable 2026**

**Crear todos los meses del año 2026:**

| Mes | Fecha Inicio | Fecha Fin | Estado |
|-----|--------------|-----------|--------|
| Enero | 01/01/2026 | 31/01/2026 | ABIERTO |
| Febrero | 01/02/2026 | 28/02/2026 | ABIERTO |
| Marzo | 01/03/2026 | 31/03/2026 | ABIERTO |
| ... | ... | ... | ... |
| Diciembre | 01/12/2026 | 31/12/2026 | ABIERTO |

**Procedimiento:**
1. Crear cada mes del año 2026
2. Todos inician en estado **ABIERTO**
3. Se cerrarán mensualmente después de verificar

---

### **Estados de Período Contable:**

| Estado | ID | Descripción | Permite Asientos |
|--------|-----|-------------|------------------|
| ABIERTO | 50 | Período activo | ✅ SÍ |
| CERRADO | 51 | Período cerrado | ❌ NO |
| BLOQUEADO | 52 | Período bloqueado | ❌ NO |

---

## ⚙️ CONFIGURACIÓN DE CUENTAS CONTABLES {#configuracion-cuentas}

### **PASO 1: Configurar Cuentas para Ventas**

**Módulo:** Contabilidad → Configuración Cuenta Contable

**Mapeo de cuentas para productos:**

| Concepto | Cuenta | Descripción |
|----------|--------|-------------|
| Ingreso por Venta | 70111 | Ventas - Mercaderías - Terceros |
| Costo de Venta | 69111 | Costo de Ventas - Mercaderías |
| IGV Ventas | 40111 | IGV - Cuenta Propia |
| Cuentas por Cobrar | 12121 | Facturas por Cobrar |

**Procedimiento:**
1. Ingresar al módulo **Maestros → Productos y Servicios**
2. Seleccionar un producto
3. En la pestaña **"Contabilidad"**:
   - Cuenta de Ingreso: 70111
   - Cuenta de Costo: 69111
4. Guardar
5. **Repetir para cada producto**

---

### **PASO 2: Configurar Cuentas para Compras**

**Mapeo de cuentas:**

| Concepto | Cuenta | Descripción |
|----------|--------|-------------|
| Compra de Mercadería | 60111 | Compras - Mercaderías |
| IGV Compras | 40111 | IGV - Cuenta Propia |
| Cuentas por Pagar | 42121 | Facturas por Pagar |

---

### **PASO 3: Configurar Cuentas para Tesorería**

**Mapeo de cuentas bancarias:**

| Banco | Cuenta | Moneda | Cuenta Contable |
|-------|--------|--------|-----------------|
| BCP | 0012-3456 | PEN | 10411 |
| BBVA | 0089-7654 | USD | 10413 |
| Caja Principal | - | PEN | 10111 |

**Procedimiento:**
1. Ingresar al módulo **Tesorería → Cuenta Corriente**
2. Seleccionar una cuenta bancaria
3. En campo **"Cuenta Contable"**: Seleccionar 10411 (o la que corresponda)
4. Guardar
5. **Repetir para cada cuenta bancaria**

---

### **PASO 4: Configurar Cuentas para CxC y CxP**

**Configuración automática:**

| Módulo | Cuenta Contable |
|--------|-----------------|
| Cuentas por Cobrar | 12121 - Facturas por Cobrar |
| Cuentas por Pagar | 42121 - Facturas por Pagar |
| Préstamos Bancarios CP | 45111 - Préstamos CP |
| Préstamos Bancarios LP | 45121 - Préstamos LP |

Esta configuración permite que el sistema genere automáticamente los asientos contables.

---

## 📝 ASIENTO DE APERTURA {#asiento-apertura}

### **¿Qué incluir en el Asiento de Apertura?**

**INCLUIR (Registro Manual):**
- ✅ Activos Fijos y Depreciación Acumulada
- ✅ Cuentas por Cobrar Diversas (14XX)
- ✅ Gastos Pagados por Adelantado (18XX)
- ✅ Tributos por Pagar (40XX)
- ✅ Remuneraciones por Pagar (41XX)
- ✅ Cuentas por Pagar Diversas (46XX)
- ✅ Capital (50XX)
- ✅ Reservas (58XX)
- ✅ Resultados Acumulados (591)

**NO INCLUIR (Se registran en otros módulos):**
- ❌ Caja (se registra en Movimientos de Caja)
- ❌ Bancos (se registra en Saldos Cuenta Corriente)
- ❌ Cuentas por Cobrar Comerciales (se registra en CxC)
- ❌ Cuentas por Pagar Comerciales (se registra en CxP)
- ❌ Préstamos Bancarios (se registra en Préstamos)
- ❌ Inventarios (se registra en Movimientos Almacén)

---

### **PASO 1: Preparar Balance General al 31/12/2025**

**Formato sugerido en Excel:**

```
BALANCE GENERAL AL 31/12/2025

ACTIVO
  Efectivo y Equivalentes
    Caja                          10,000.00    (Se registra en Caja)
    Bancos                       150,000.00    (Se registra en Saldos Cta Cte)
  
  Cuentas por Cobrar
    Facturas por Cobrar           50,000.00    (Se registra en CxC)
    Otras Cuentas por Cobrar       5,000.00    ✅ ASIENTO APERTURA
  
  Inventarios
    Mercaderías                  200,000.00    (Se registra en Inventarios)
  
  Activos Fijos
    Maquinaria                   500,000.00    ✅ ASIENTO APERTURA
    Depreciación Acumulada      (150,000.00)   ✅ ASIENTO APERTURA

PASIVO
  Cuentas por Pagar
    Facturas por Pagar            80,000.00    (Se registra en CxP)
    Tributos por Pagar            15,000.00    ✅ ASIENTO APERTURA
  
  Préstamos Bancarios             70,000.00    (Se registra en Préstamos)

PATRIMONIO
  Capital                        500,000.00    ✅ ASIENTO APERTURA
  Resultados Acumulados          100,000.00    ✅ ASIENTO APERTURA (cuadra)
```

---

### **PASO 2: Registrar Asiento de Apertura**

**Módulo:** Contabilidad → Asiento Contable

**Datos del asiento:**

| Campo | Valor |
|-------|-------|
| Fecha Contable | 31/12/2025 |
| Período | Diciembre 2025 |
| Tipo Libro | FISCAL |
| Glosa | Asiento de Apertura Ejercicio 2026 - Complementario |
| Moneda | PEN |

**Ejemplo de asiento:**

| Cuenta | Descripción | DEBE | HABER |
|--------|-------------|------|-------|
| 14XXX | Otras Cuentas por Cobrar | 5,000.00 | |
| 33XXX | Maquinaria y Equipo | 500,000.00 | |
| | | | |
| 39XXX | Depreciación Acumulada | | 150,000.00 |
| 40XXX | Tributos por Pagar | | 15,000.00 |
| 50XXX | Capital | | 500,000.00 |
| 591 | Resultados Acumulados | | 100,000.00 |
| | **TOTALES** | **505,000.00** | **505,000.00** |

**Procedimiento:**
1. Ingresar al módulo **Contabilidad → Asiento Contable**
2. Clic en **"Nuevo Asiento"**
3. Completar datos del encabezado
4. Agregar cada línea del asiento:
   - Cuenta contable
   - Glosa (descripción)
   - Monto en DEBE o HABER
5. Verificar que **DEBE = HABER**
6. Guardar

**⚠️ IMPORTANTE:** 
- La cuenta 591 (Resultados Acumulados) se usa para cuadrar el asiento
- El asiento debe estar perfectamente cuadrado (DEBE = HABER)

---

## 📋 ASIENTOS CONTABLES {#asientos-contables}

### **Tipos de Asientos**

| Tipo | Origen | Ejemplo |
|------|--------|---------|
| **Automático** | Generado por el sistema | Pago de CxP, Cobro de CxC |
| **Manual** | Registrado por contador | Provisiones, Ajustes |
| **Apertura** | Saldos iniciales | Asiento de apertura |
| **Cierre** | Fin de período | Asiento de cierre anual |

---

### **Flujo de Asientos Automáticos**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. TRANSACCIÓN OPERATIVA                                   │
│    Usuario registra: Pago de CxP por S/. 10,000           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. ASIENTO CONTABLE INTERFAZ (Staging)                     │
│    Estado: PENDIENTE                                        │
│    Módulo: Tesorería → Asientos Contables                 │
│                                                             │
│    4212 - Facturas por Pagar    DEBE: 10,000              │
│    1041 - Banco BCP             HABER: 10,000             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. REVISIÓN CONTABILIDAD                                    │
│    Contador revisa y aprueba                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. ASIENTO CONTABLE DEFINITIVO                             │
│    Estado: ENVIADO                                          │
│    Número: ASI-2026-000123                                 │
│    Módulo: Contabilidad → Asiento Contable                │
└─────────────────────────────────────────────────────────────┘
```

---

### **Revisar Asientos Automáticos**

**Módulo:** Tesorería → Asientos Contables (Interfaz)

**Procedimiento:**
1. Ingresar al módulo
2. Filtrar por Estado: **PENDIENTE**
3. Revisar cada asiento:
   - ✅ Cuentas contables correctas
   - ✅ Montos correctos
   - ✅ DEBE = HABER
   - ✅ Fecha correcta
4. Si está correcto: **Aprobar**
5. Si tiene error: **Rechazar** y corregir en el módulo origen

---

### **Registrar Asientos Manuales**

**Módulo:** Contabilidad → Asiento Contable

**Casos comunes:**

#### **Provisión de Servicios:**
```
DEBE  63XX - Servicios Prestados por Terceros
DEBE  40111 - IGV
  HABER 42XX - Cuentas por Pagar Diversas
```

#### **Depreciación Mensual:**
```
DEBE  68XX - Depreciación
  HABER 39XX - Depreciación Acumulada
```

#### **Provisión de Planilla:**
```
DEBE  62XX - Gastos de Personal
  HABER 41XX - Remuneraciones por Pagar
  HABER 40XX - Tributos por Pagar (ONP/AFP)
```

---

## ✅ VERIFICACIÓN Y CIERRE {#verificacion-cierre}

### **PASO 1: Verificar Balance General**

**Módulo:** Contabilidad → Reportes → Balance General

**Verificaciones:**

```
□ ACTIVO = PASIVO + PATRIMONIO
□ Caja y Bancos = Saldos registrados en Tesorería
□ Cuentas por Cobrar = Total CxC del módulo
□ Inventarios = Total valorizado de almacén
□ Cuentas por Pagar = Total CxP del módulo
□ Préstamos = Saldo capital de préstamos
□ Todas las cuentas tienen saldo correcto
```

**Procedimiento:**
1. Generar Balance General al 31/12/2025
2. Comparar con Balance preparado en Excel
3. Investigar cualquier diferencia
4. Corregir si es necesario
5. Volver a generar hasta que cuadre perfectamente

---

### **PASO 2: Verificar Libro Diario**

**Módulo:** Contabilidad → Reportes → Libro Diario

**Verificaciones:**

```
□ Todos los asientos están cuadrados (DEBE = HABER)
□ No hay asientos en estado PENDIENTE
□ Fechas contables correctas
□ Glosas descriptivas
□ Numeración correlativa
```

---

### **PASO 3: Verificar Libro Mayor**

**Módulo:** Contabilidad → Reportes → Libro Mayor

**Verificaciones:**

```
□ Saldos por cuenta coinciden con Balance
□ Movimientos correctamente clasificados
□ No hay cuentas con saldo incorrecto
```

---

### **PASO 4: Cerrar Período Diciembre 2025**

**Módulo:** Contabilidad → Período Contable

**Procedimiento:**
1. Verificar que todos los asientos estén correctos
2. Verificar que Balance General cuadre
3. Seleccionar período **Diciembre 2025**
4. Cambiar estado de **ABIERTO (50)** a **CERRADO (51)**
5. Confirmar cierre

**⚠️ IMPORTANTE:** 
- Una vez cerrado, NO se pueden crear ni modificar asientos
- Solo se puede reabrir con autorización de Gerencia
- Documentar el cierre en acta

---

### **PASO 5: Verificar Período Enero 2026**

**Módulo:** Contabilidad → Período Contable

**Verificaciones:**

```
□ Período Enero 2026 existe
□ Estado: ABIERTO (50)
□ Fecha Inicio: 01/01/2026
□ Fecha Fin: 31/01/2026
□ Sistema permite crear asientos en Enero 2026
```

---

## 📊 REPORTES CONTABLES {#reportes}

### **Reportes Disponibles**

| Reporte | Descripción | Frecuencia |
|---------|-------------|------------|
| **Balance General** | Estado de situación financiera | Mensual |
| **Estado de Resultados** | Ingresos y gastos del período | Mensual |
| **Libro Diario** | Registro cronológico de asientos | Mensual |
| **Libro Mayor** | Movimientos por cuenta | Mensual |
| **Balance de Comprobación** | Saldos y movimientos | Mensual |
| **Análisis de Cuentas** | Detalle de una cuenta específica | Según necesidad |

---

### **Generar Reportes**

**Módulo:** Contabilidad → Reportes

**Procedimiento:**
1. Seleccionar el reporte deseado
2. Ingresar parámetros:
   - Fecha Inicio
   - Fecha Fin
   - Empresa
   - Moneda (PEN/USD)
3. Clic en **"Generar"**
4. Exportar a Excel o PDF según necesidad

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN {#checklist}

### **Semana 1: Plan Contable y Períodos**

```
□ Plan de Cuentas Contable cargado (PCGE completo)
□ Cuentas de nivel 1 a 5 creadas
□ Naturaleza de cuentas configurada (Deudora/Acreedora)
□ Cuentas que aceptan movimiento marcadas
□ Período Diciembre 2025 creado (ABIERTO)
□ Períodos 2026 creados (Enero a Diciembre)
```

### **Semana 2: Configuración de Cuentas**

```
□ Cuentas contables asignadas a productos
□ Cuentas de ingreso y costo configuradas
□ Cuentas bancarias mapeadas
□ Configuración de IGV completada
□ Prueba de generación automática de asientos
```

### **Semana 3: Asiento de Apertura**

```
□ Balance General al 31/12/2025 preparado
□ Activos Fijos valorizados
□ Depreciación acumulada calculada
□ Pasivos verificados
□ Capital y Reservas confirmados
□ Asiento de Apertura registrado
□ Asiento de Apertura cuadrado (DEBE = HABER)
```

### **Semana 4: Verificación**

```
□ Balance General generado y verificado
□ Libro Diario revisado
□ Libro Mayor verificado
□ Todos los asientos cuadrados
□ No hay asientos PENDIENTES
□ Diferencias investigadas y corregidas
```

### **Semana 5: Cierre**

```
□ Balance General cuadra perfectamente
□ ACTIVO = PASIVO + PATRIMONIO
□ Período Diciembre 2025 cerrado
□ Período Enero 2026 abierto y verificado
□ Documentación de cierre completada
□ ¡Sistema listo para operar en 2026!
```
