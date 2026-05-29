# 📊 ANÁLISIS COMPLETO: CuentaPorPagar y PagoCuentaPorPagar

## 🎯 OBJETIVO
Implementar **COMPLETAMENTE** los módulos de CuentaPorPagar y PagoCuentaPorPagar siguiendo el mismo patrón profesional aplicado en CuentaPorCobrar.

---

## 📋 PARTE 1: ANÁLISIS DE CuentaPorPagar

### **Campos del Schema (líneas 6271-6386)**

#### ✅ **Campos Básicos**
| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `id` | BigInt | ✅ | ID autoincremental |
| `ordenCompraId` | BigInt? | ❌ | Origen (null para saldos iniciales) |
| `empresaId` | BigInt | ✅ | Empresa deudora |
| `proveedorId` | BigInt | ✅ | Proveedor acreedor |
| `numeroOrdenCompra` | String(30) | ✅ | Número de OC o código |
| `fechaEmision` | DateTime | ✅ | Fecha de emisión |
| `fechaVencimiento` | DateTime | ✅ | Fecha de vencimiento |

#### 💰 **Campos de Montos**
| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `montoTotal` | Decimal(18,2) | - | Total de la deuda |
| `montoPagado` | Decimal(18,2) | 0.00 | Actualizado con cada pago |
| `saldoPendiente` | Decimal(18,2) | - | montoTotal - montoPagado |

#### 🔄 **Campos Renombrados (Totales)**
| Campo Antiguo | Campo Nuevo | Tipo |
|---------------|-------------|------|
| `montoDetraccion` | `montoDetraccionTotal` | Decimal(18,2) |
| `montoRetencion` | `montoRetencionTotal` | Decimal(18,2) |
| `montoPercepcion` | `montoPercepcionTotal` | Decimal(18,2) |

#### ✅ **Campos Nuevos Agregados**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `porcentajeRetencion` | Decimal(5,2)? | % de retención (generalmente 3%) |
| `fechaContable` | DateTime | Fecha del período contable |
| `periodoContableId` | BigInt? | Período contable |
| `fechaCreacion` | DateTime | Auditoría: fecha creación |
| `fechaActualizacion` | DateTime? | Auditoría: fecha actualización |
| `creadoPor` | BigInt? | Auditoría: usuario creador |
| `actualizadoPor` | BigInt? | Auditoría: usuario actualizador |

#### ❌ **Campos Eliminados (Movidos a PagoCuentaPorPagar)**
- `numeroConstanciaDetraccion`
- `fechaDetraccion`
- `numeroComprobanteRetencion`
- `fechaRetencion`
- `numeroComprobantePercepcion`
- `fechaPercepcion`
- `asientoContableId`

#### 🏷️ **Flags Especiales**
| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `esSaldoInicial` | Boolean | false | Saldo inicial de migración |
| `esGerencial` | Boolean | false | CxP Negra (Gerencial) vs Blanca (Formal) |
| `esContado` | Boolean | - | Compra al contado vs crédito |
| `tieneDetraccion` | Boolean | false | Aplica detracción |
| `tieneRetencion` | Boolean | false | Aplica retención |
| `tienePercepcion` | Boolean | false | Aplica percepción |

#### 🔗 **Relaciones**
- `ordenCompra` → OrdenCompra? (opcional)
- `empresa` → Empresa
- `proveedor` → EntidadComercial
- `moneda` → Moneda
- `estado` → EstadoMultiFuncion
- `periodoContable` → PeriodoContable?
- **Inversas:** `pagos`, `detallesFlujoCaja`, `asientosContables`, `letrasCambio`, `retenciones`, `percepciones`

---

## 📋 PARTE 2: ANÁLISIS DE PagoCuentaPorPagar

### **Campos del Schema (líneas 6395-6504)**

#### ✅ **Campos Básicos**
| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `id` | BigInt | ✅ | ID autoincremental |
| `cuentaPorPagarId` | BigInt | ✅ | FK a CuentaPorPagar |
| `empresaId` | BigInt | ✅ | Empresa que realiza el pago |
| `fechaPago` | DateTime | ✅ | Fecha del pago |

#### 🔄 **Campos Renombrados**
| Campo Antiguo | Campo Nuevo | Tipo |
|---------------|-------------|------|
| `montoPago` | `montoPagado` | Decimal(18,2) |
| `monedaId` | `monedaPagoId` | BigInt |

#### ✅ **Campos Nuevos Agregados**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `montoAplicadoDeuda` | Decimal(18,2) | Monto total aplicado a la deuda |
| `monedaDeudaId` | BigInt | Moneda de la CxP |
| `prestamoBancarioId` | BigInt? | FK a PrestamoBancario |
| **15 campos de detracción** | Varios | tieneDetraccion, montoDetraccion, porcentajeDetraccion, numeroConstanciaDetraccion, fechaDetraccion |
| **15 campos de retención** | Varios | tieneRetencion, montoRetencion, porcentajeRetencion, numeroComprobanteRetencion, fechaRetencion |
| **15 campos de percepción** | Varios | tienePercepcion, montoPercepcion, porcentajePercepcion, numeroComprobantePercepcion, fechaPercepcion |
| `fechaContable` | DateTime | Fecha contable |
| `periodoContableId` | BigInt? | Periodo contable |
| `fechaCreacion` | DateTime | Auditoría |
| `fechaActualizacion` | DateTime? | Auditoría |
| `creadoPor` | BigInt? | Auditoría |
| `actualizadoPor` | BigInt? | Auditoría |

#### ❌ **Campos Eliminados**
- `asientoContableId`

#### 🔗 **Relaciones**
- `cuentaPorPagar` → CuentaPorPagar
- `empresa` → Empresa
- `monedaPago` → Moneda (relación "MonedaPagoCxP")
- `monedaDeuda` → Moneda (relación "MonedaDeudaCxP")
- `medioPago` → MedioPago
- `banco` → Banco?
- `cuentaBancaria` → CuentaCorriente?
- `movimientoCaja` → MovimientoCaja?
- `periodoContable` → PeriodoContable?
- `prestamoBancario` → PrestamoBancario? ⭐ **NUEVO**
- **Inversa:** `asientosContables`

---

## 🎯 PLAN DE IMPLEMENTACIÓN

### **FASE 1: Backend - CuentaPorPagar**
1. ✅ Revisar `cuentaPorPagar.service.js`
2. ✅ Corregir campos renombrados
3. ✅ Agregar campos nuevos
4. ✅ Eliminar referencias a campos obsoletos
5. ✅ Actualizar validaciones

### **FASE 2: Backend - PagoCuentaPorPagar**
1. ✅ Crear/revisar service de pagos
2. ✅ Implementar todos los campos del schema
3. ✅ Agregar validaciones
4. ✅ Implementar cálculo de montoAplicadoDeuda

### **FASE 3: Frontend - CuentaPorPagarForm.jsx**
1. ✅ Revisar formulario actual
2. ✅ Corregir campos renombrados
3. ✅ Agregar campos nuevos
4. ✅ Eliminar campos obsoletos
5. ✅ Agregar sección de auditoría
6. ✅ Agregar sección contable

### **FASE 4: Frontend - PagoCuentaPorPagarForm.jsx**
1. ✅ Implementar formulario COMPLETO
2. ✅ Todos los campos del schema
3. ✅ Paneles organizados
4. ✅ Validaciones
5. ✅ Cálculos automáticos

### **FASE 5: Frontend - CuentaPorPagar.jsx (Página)**
1. ✅ Revisar integración
2. ✅ Actualizar llamadas API
3. ✅ Verificar auditoría

---

## 📊 COMPARACIÓN: CuentaPorCobrar vs CuentaPorPagar

| Aspecto | CuentaPorCobrar | CuentaPorPagar |
|---------|-----------------|----------------|
| **Entidad relacionada** | Cliente | Proveedor |
| **Origen** | PreFactura | OrdenCompra |
| **Dirección flujo** | Recibimos dinero | Pagamos dinero |
| **Detracción** | Cliente deposita en SUNAT | Nosotros depositamos en SUNAT |
| **Retención** | Cliente retiene | Nosotros retenemos |
| **Percepción** | Nosotros cobramos adicional | Proveedor cobra adicional |
| **Campo especial** | - | `prestamoBancarioId` |
| **Estructura** | IDÉNTICA | IDÉNTICA |

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### **Backend**
- [ ] cuentaPorPagar.service.js corregido
- [ ] Validaciones actualizadas
- [ ] Campos renombrados
- [ ] Campos nuevos agregados
- [ ] Referencias obsoletas eliminadas

### **Frontend - CuentaPorPagar**
- [ ] CuentaPorPagarForm.jsx completo
- [ ] Campos renombrados
- [ ] Campos nuevos visibles
- [ ] Auditoría implementada
- [ ] Contabilidad implementada

### **Frontend - PagoCuentaPorPagar**
- [ ] PagoCuentaPorPagarForm.jsx completo
- [ ] Todos los campos del schema
- [ ] Paneles organizados
- [ ] Validaciones
- [ ] Cálculos automáticos
- [ ] Campo prestamoBancarioId

### **Integración**
- [ ] CuentaPorPagar.jsx (página) actualizada
- [ ] API calls correctas
- [ ] Auditoría en create/update

---

## 🚀 SIGUIENTE PASO

**Comenzar con la implementación siguiendo el mismo patrón profesional de CuentaPorCobrar.**

**Archivos a entregar:**
1. `cuentaPorPagar.service.js` (corregido)
2. `CuentaPorPagarForm.jsx` (completo)
3. `PagoCuentaPorPagarForm_COMPLETO.jsx` (nuevo archivo completo)
4. `CuentaPorPagar.jsx` (página, corregida)

---

**FECHA:** 2026-05-29  
**ESTADO:** ✅ ANÁLISIS COMPLETO - LISTO PARA IMPLEMENTACIÓN
