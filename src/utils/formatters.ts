import { Sector, Vehicle } from '../types/vehicle';
import { API_ENDPOINTS } from '../config/constants';
import { format } from 'date-fns';

export const normalizeSectorList = (sectores: Sector[]) => {
  return sectores.map(sector => ({
    id: sector.nombre,
    description: sector.nombre,
  }));
};

export const generateWhatsAppQR = (vehicle: Vehicle): string => {
  const entryId =
    vehicle._id ?? (vehicle as Vehicle & { id?: string }).id;
  if (!entryId) {
    console.warn(
      '[generateWhatsAppQR] Sin _id ni id en el ingreso; URL de ticket inválida',
      vehicle
    );
  }
  const ticketUrl = `${API_ENDPOINTS.QR_ENDPOINT}/${entryId ?? ''}`;
  
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

*Recuerde dejar las llaves y retirar sus pertenencias. No nos responsabilizamos por robos o daños ocasionados por terceros.*

No obtendrá respuesta de ningún tipo por este medio.`;

  const encodedMessage = encodeURIComponent(whatsappMessage);
  return `https://api.whatsapp.com/send/?phone=5491161435069&text=${encodedMessage}&type=phone_number&app_absent=0`;
};

export const dateFormat = (date: Date, formatString: string): string => {
  return format(date, formatString);
};