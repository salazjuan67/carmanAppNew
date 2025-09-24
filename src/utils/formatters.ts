import { Sector, Vehicle } from '../types/vehicle';
import { API_ENDPOINTS } from '../config/constants';

export const normalizeSectorList = (sectores: Sector[]) => {
  return sectores.map(sector => ({
    id: sector.nombre,
    description: sector.nombre,
  }));
};

export const generateWhatsAppQR = (vehicle: Vehicle): string => {
  const ticketUrl = `${API_ENDPOINTS.QR_ENDPOINT}/${vehicle._id}`;
  
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const entryTime = `${hours}:${minutes}`;

  const whatsappMessage = `Acceda al siguiente enlace para solicitar su vehículo:
${ticketUrl}

Patente: ${vehicle.patente || 'N/A'}
Llave Nro: ${vehicle.nroLlave || 0}
Sector: ${vehicle.sector || 'N/A'}
Hora de ingreso: ${entryTime}

*Recuerde dejar las llaves y retirar sus pertenencias. No nos responsabilizamos por robos o daños ocasionados por terceros.

Envíe este mensaje para SOLICITAR su vehículo cuando quiera retirarse. No obtendrá respuesta de ningún tipo por este medio.*`;

  const encodedMessage = encodeURIComponent(whatsappMessage);
  return `https://api.whatsapp.com/send/?phone=5491161435069&text=${encodedMessage}&type=phone_number&app_absent=0`;
};