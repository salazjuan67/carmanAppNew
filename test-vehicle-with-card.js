/**
 * Script de prueba para verificar si el backend guarda los campos de tarjeta física
 */

const API_BASE_URL = 'https://carmanparking.com/api';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function testVehicleWithCard() {
  console.log(`${colors.cyan}
╔══════════════════════════════════════════════════════════╗
║   PRUEBA: Crear Vehículo con Tarjeta Física            ║
╚══════════════════════════════════════════════════════════╝
${colors.reset}`);

  // Primero, asignar una tarjeta
  console.log(`\n${colors.blue}Paso 1: Asignar una tarjeta física...${colors.reset}`);
  
  try {
    const assignResponse = await fetch(`${API_BASE_URL}/physical-cards/assign-next`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        establishmentId: '666236d2b6316ac455e22509',
        establishmentName: 'Malloys'
      })
    });
    
    const assignData = await assignResponse.json();
    
    if (!assignResponse.ok) {
      console.log(`${colors.red}✗ Error asignando tarjeta: ${assignResponse.status}${colors.reset}`);
      console.log(assignData);
      return;
    }
    
    console.log(`${colors.green}✓ Tarjeta asignada: ${assignData.assignedCard.cardNumber}${colors.reset}`);
    const card = assignData.assignedCard;
    
    // Paso 2: Crear vehículo con tarjeta
    console.log(`\n${colors.blue}Paso 2: Crear vehículo con tarjeta física...${colors.reset}`);
    
    const vehicleData = {
      patente: `TEST${Date.now().toString().slice(-4)}`,
      sector: 'A1',
      nroLlave: '101',
      establecimiento: '666236d2b6316ac455e22509',
      horaIngreso: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      
      // Campos de tarjeta física
      physicalCardId: card._id,
      physicalCardNumber: card.cardNumber,
      qrCode: card.qrCode,
      noPhysicalCard: false,
    };
    
    console.log(`${colors.yellow}Datos a enviar:${colors.reset}`);
    console.log(JSON.stringify(vehicleData, null, 2));
    
    const createResponse = await fetch(`${API_BASE_URL}/cobranzas/ingresos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vehicleData)
    });
    
    const createData = await createResponse.json();
    
    if (!createResponse.ok) {
      console.log(`${colors.red}✗ Error creando vehículo: ${createResponse.status}${colors.reset}`);
      console.log(createData);
      return;
    }
    
    console.log(`${colors.green}✓ Vehículo creado exitosamente${colors.reset}`);
    console.log(`${colors.yellow}Respuesta del backend:${colors.reset}`);
    console.log(JSON.stringify(createData, null, 2));
    
    // Paso 3: Verificar que el backend guardó los campos
    console.log(`\n${colors.blue}Paso 3: Verificar campos guardados...${colors.reset}`);
    
    const hasPhysicalCard = createData.physicalCardNumber !== undefined;
    const hasQRCode = createData.qrCode !== undefined;
    const hasCardId = createData.physicalCardId !== undefined;
    
    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${hasPhysicalCard ? colors.green : colors.red}${hasPhysicalCard ? '✓' : '✗'} physicalCardNumber: ${createData.physicalCardNumber || 'NO GUARDADO'}${colors.reset}`);
    console.log(`${hasQRCode ? colors.green : colors.red}${hasQRCode ? '✓' : '✗'} qrCode: ${createData.qrCode || 'NO GUARDADO'}${colors.reset}`);
    console.log(`${hasCardId ? colors.green : colors.red}${hasCardId ? '✓' : '✗'} physicalCardId: ${createData.physicalCardId || 'NO GUARDADO'}${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    
    if (hasPhysicalCard && hasQRCode && hasCardId) {
      console.log(`\n${colors.green}🎉 ¡ÉXITO! El backend está guardando todos los campos correctamente.${colors.reset}`);
      console.log(`${colors.green}Los badges deberían aparecer en la app.${colors.reset}`);
    } else {
      console.log(`\n${colors.red}⚠️  PROBLEMA: El backend NO está guardando algunos campos.${colors.reset}`);
      console.log(`${colors.yellow}Solución: Actualizar el modelo y controller del backend.${colors.reset}`);
      console.log(`${colors.yellow}Ver: TROUBLESHOOTING_PHYSICAL_CARDS.md${colors.reset}`);
    }
    
  } catch (error) {
    console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
  }
}

testVehicleWithCard().catch(console.error);












