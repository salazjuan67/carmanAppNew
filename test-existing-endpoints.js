/**
 * Script para verificar qué endpoints existentes están funcionando
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

async function testEndpoint(name, method, url) {
  console.log(`\n${colors.cyan}Testing: ${name}${colors.reset}`);
  console.log(`${colors.blue}${method} ${url}${colors.reset}`);
  
  try {
    const response = await fetch(url, { method });
    const statusColor = response.status < 500 ? colors.green : colors.red;
    console.log(`${statusColor}Status: ${response.status} ${response.statusText}${colors.reset}`);
    return response.status;
  } catch (error) {
    console.log(`${colors.red}Error: ${error.message}${colors.reset}`);
    return null;
  }
}

async function runTests() {
  console.log(`${colors.cyan}
╔══════════════════════════════════════════════════════╗
║     VERIFICACIÓN DE ENDPOINTS EXISTENTES             ║
╚══════════════════════════════════════════════════════╝
${colors.reset}`);
  
  const endpoints = [
    { name: 'Establecimientos', method: 'GET', path: '/master/establecimientos' },
    { name: 'Marcas', method: 'GET', path: '/master/marcas' },
    { name: 'Vehículos (maestra)', method: 'GET', path: '/master/vehiculos' },
    { name: 'Turnos', method: 'GET', path: '/turnos' },
    { name: 'Login', method: 'POST', path: '/auth/login' },
    { name: 'Physical Cards - Available', method: 'GET', path: '/physical-cards/available' },
    { name: 'Physical Cards - Assign', method: 'POST', path: '/physical-cards/assign-next' },
  ];
  
  const results = { implemented: 0, notImplemented: 0 };
  
  for (const endpoint of endpoints) {
    const status = await testEndpoint(endpoint.name, endpoint.method, `${API_BASE_URL}${endpoint.path}`);
    if (status === 404 && status !== null) {
      results.notImplemented++;
    } else if (status !== null) {
      results.implemented++;
    }
  }
  
  console.log(`\n${colors.cyan}
╔══════════════════════════════════════════════════════╗
║                      RESUMEN                         ║
╚══════════════════════════════════════════════════════╝
${colors.reset}`);
  
  console.log(`${colors.green}✓ Endpoints implementados (responden): ${results.implemented}${colors.reset}`);
  console.log(`${colors.red}✗ Endpoints NO implementados (404): ${results.notImplemented}${colors.reset}`);
  
  if (results.notImplemented > 0) {
    console.log(`\n${colors.yellow}⚠️  Los endpoints de Physical Cards NO están implementados en el backend.${colors.reset}`);
    console.log(`${colors.yellow}   El backend necesita implementar las rutas según PHYSICAL_CARDS_BACKEND_IMPLEMENTATION.md${colors.reset}`);
  }
}

runTests().catch(console.error);












