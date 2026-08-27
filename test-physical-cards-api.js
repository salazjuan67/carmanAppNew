/**
 * Script de prueba para endpoints de tarjetas físicas
 * Verifica que la API esté respondiendo correctamente
 */

const API_BASE_URL = 'https://carmanparking.com/api';

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Token de prueba (debes reemplazar con un token válido)
const TEST_TOKEN = process.env.TEST_TOKEN || '';
const TEST_ESTABLISHMENT_ID = '666236d2b6316ac455e22509'; // Malloys

async function testEndpoint(name, method, url, body = null, expectedStatus = 200) {
  console.log(`\n${colors.cyan}🧪 Testing: ${name}${colors.reset}`);
  console.log(`${colors.blue}   ${method} ${url}${colors.reset}`);
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(TEST_TOKEN && { 'Authorization': `Bearer ${TEST_TOKEN}` })
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
      console.log(`${colors.yellow}   Body: ${JSON.stringify(body, null, 2)}${colors.reset}`);
    }
    
    const startTime = Date.now();
    const response = await fetch(url, options);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    const statusColor = response.ok ? colors.green : colors.red;
    console.log(`${statusColor}   ✓ Status: ${response.status} ${response.statusText}${colors.reset}`);
    console.log(`${colors.cyan}   ⏱️  Duration: ${duration}ms${colors.reset}`);
    
    if (responseData) {
      console.log(`${colors.yellow}   Response:${colors.reset}`);
      console.log(JSON.stringify(responseData, null, 2));
    }
    
    return {
      success: response.ok,
      status: response.status,
      data: responseData,
      duration
    };
  } catch (error) {
    console.log(`${colors.red}   ✗ Error: ${error.message}${colors.reset}`);
    return {
      success: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log(`${colors.cyan}
╔══════════════════════════════════════════════════════════╗
║     PRUEBAS DE ENDPOINTS - TARJETAS FÍSICAS             ║
╚══════════════════════════════════════════════════════════╝
${colors.reset}`);
  
  console.log(`${colors.blue}Base URL: ${API_BASE_URL}${colors.reset}`);
  console.log(`${colors.blue}Token: ${TEST_TOKEN ? '✓ Configurado' : '✗ No configurado'}${colors.reset}`);
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  // Test 1: Health check (si existe)
  console.log(`\n${colors.cyan}═══ Test 1: Health Check ═══${colors.reset}`);
  const healthResult = await testEndpoint(
    'Health Check',
    'GET',
    `${API_BASE_URL}/health`
  );
  results.total++;
  healthResult.success ? results.passed++ : results.failed++;
  
  // Test 2: Obtener tarjetas disponibles
  console.log(`\n${colors.cyan}═══ Test 2: Obtener Tarjetas Disponibles ═══${colors.reset}`);
  const availableResult = await testEndpoint(
    'Get Available Cards',
    'GET',
    `${API_BASE_URL}/physical-cards/available?establishmentId=${TEST_ESTABLISHMENT_ID}`
  );
  results.total++;
  availableResult.success ? results.passed++ : results.failed++;
  
  // Test 3: Asignar próxima tarjeta disponible
  console.log(`\n${colors.cyan}═══ Test 3: Asignar Tarjeta ═══${colors.reset}`);
  const assignResult = await testEndpoint(
    'Assign Next Available Card',
    'POST',
    `${API_BASE_URL}/physical-cards/assign-next`,
    {
      establishmentId: TEST_ESTABLISHMENT_ID,
      establishmentName: 'Malloys'
    }
  );
  results.total++;
  assignResult.success ? results.passed++ : results.failed++;
  
  // Guardar el ID de la tarjeta asignada para tests posteriores
  let assignedCardId = null;
  if (assignResult.success && assignResult.data && assignResult.data.assignedCard) {
    assignedCardId = assignResult.data.assignedCard._id;
  }
  
  // Test 4: Buscar tarjeta por número (si se asignó una)
  if (assignResult.success && assignResult.data && assignResult.data.assignedCard) {
    const cardNumber = assignResult.data.assignedCard.cardNumber;
    console.log(`\n${colors.cyan}═══ Test 4: Buscar por Número (${cardNumber}) ═══${colors.reset}`);
    const byNumberResult = await testEndpoint(
      'Get Card By Number',
      'GET',
      `${API_BASE_URL}/physical-cards/number/${cardNumber}`
    );
    results.total++;
    byNumberResult.success ? results.passed++ : results.failed++;
    
    // Test 5: Buscar tarjeta por QR
    const qrCode = assignResult.data.assignedCard.qrCode;
    console.log(`\n${colors.cyan}═══ Test 5: Buscar por QR (${qrCode}) ═══${colors.reset}`);
    const byQRResult = await testEndpoint(
      'Get Card By QR',
      'GET',
      `${API_BASE_URL}/physical-cards/qr/${qrCode}`
    );
    results.total++;
    byQRResult.success ? results.passed++ : results.failed++;
  }
  
  // Test 6: Liberar tarjeta (si tenemos ID)
  if (assignedCardId) {
    console.log(`\n${colors.cyan}═══ Test 6: Liberar Tarjeta ═══${colors.reset}`);
    const releaseResult = await testEndpoint(
      'Release Card',
      'POST',
      `${API_BASE_URL}/physical-cards/${assignedCardId}/release`
    );
    results.total++;
    releaseResult.success ? results.passed++ : results.failed++;
  }
  
  // Test 7: Buscar tarjeta inexistente (debe dar 404)
  console.log(`\n${colors.cyan}═══ Test 7: Buscar Tarjeta Inexistente (404 esperado) ═══${colors.reset}`);
  const notFoundResult = await testEndpoint(
    'Get Card By Number (Not Found)',
    'GET',
    `${API_BASE_URL}/physical-cards/number/INEXISTENTE999`,
    null,
    404
  );
  results.total++;
  // Para este test, 404 es éxito
  notFoundResult.status === 404 ? results.passed++ : results.failed++;
  
  // Resumen final
  console.log(`\n${colors.cyan}
╔══════════════════════════════════════════════════════════╗
║                    RESUMEN DE PRUEBAS                    ║
╚══════════════════════════════════════════════════════════╝
${colors.reset}`);
  
  console.log(`${colors.green}✓ Pasadas: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}✗ Fallidas: ${results.failed}${colors.reset}`);
  console.log(`${colors.blue}━ Total: ${results.total}${colors.reset}`);
  
  const percentage = ((results.passed / results.total) * 100).toFixed(1);
  const percentageColor = percentage >= 80 ? colors.green : percentage >= 50 ? colors.yellow : colors.red;
  console.log(`${percentageColor}📊 Tasa de éxito: ${percentage}%${colors.reset}`);
  
  if (results.failed === 0) {
    console.log(`\n${colors.green}🎉 ¡Todos los tests pasaron exitosamente!${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️  Algunos tests fallaron. Revisa los errores arriba.${colors.reset}`);
  }
  
  // Notas importantes
  console.log(`\n${colors.cyan}📝 NOTAS:${colors.reset}`);
  console.log(`${colors.yellow}1. Si ves errores 401 (Unauthorized), configura el token:${colors.reset}`);
  console.log(`   ${colors.blue}export TEST_TOKEN="tu_token_aqui"${colors.reset}`);
  console.log(`   ${colors.blue}node test-physical-cards-api.js${colors.reset}`);
  console.log(`${colors.yellow}2. Si ves errores de conexión, verifica que el backend esté corriendo.${colors.reset}`);
  console.log(`${colors.yellow}3. Si ves errores 404 en endpoints principales, el backend no está implementado.${colors.reset}`);
}

// Ejecutar tests
runTests().catch(console.error);












