import React from 'react';
import { CustomSelect, SelectItem } from './CustomSelect';
import { useLanguage } from '../contexts/LanguageContext';

interface Sector {
  _id: string;
  nombre: string;
  capacidad: string;
}

interface SectorSelectorProps {
  sectors: Sector[];
  selectedSector: string;
  onSectorChange: (sectorId: string) => void;
}

export const SectorSelector: React.FC<SectorSelectorProps> = ({
  sectors,
  selectedSector,
  onSectorChange,
}) => {
  const { t } = useLanguage();
  // Convertir sectores al formato SelectItem
  const sectorItems: SelectItem[] = sectors.map((sector) => ({
    id: sector._id,
    description: sector.nombre,
  }));

  // Encontrar el ID del sector seleccionado por nombre
  const selectedSectorId = sectors.find(sector => sector.nombre === selectedSector)?._id || selectedSector;

  return (
    <CustomSelect
      title={t('sector')}
      items={sectorItems}
      onValueChange={(value) => {
        // Buscar el sector por ID y enviar el nombre
        const selectedSectorObj = sectors.find(sector => sector._id === value);
        onSectorChange(selectedSectorObj?.nombre || value);
      }}
      selectedValue={selectedSectorId}
    />
  );
};
