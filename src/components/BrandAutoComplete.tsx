import React from 'react';
import { AutoCompleteInput } from './AutoCompleteInput';
import { SelectItem } from './CustomSelect';
import { useLanguage } from '../contexts/LanguageContext';

interface Brand {
  _id: string;
  descripcion: string;
  ord: number;
}

interface BrandAutoCompleteProps {
  brands: Brand[];
  selectedBrand: string;
  onBrandChange: (brandId: string) => void;
  searchText: string;
}

export const BrandAutoComplete: React.FC<BrandAutoCompleteProps> = ({
  brands,
  selectedBrand,
  onBrandChange,
  searchText,
}) => {
  const { t } = useLanguage();
  // Convertir marcas al formato SelectItem
  const brandItems: SelectItem[] = brands.map((brand) => ({
    id: brand._id,
    description: brand.descripcion,
  }));

  return (
    <AutoCompleteInput
      label={`${t('brand')} (${t('optional')})`}
      arrayData={brandItems}
      setValue={onBrandChange}
      blank={selectedBrand === ''}
      newText={searchText}
    />
  );
};
