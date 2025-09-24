import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Pressable,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, ChevronUp, Camera } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { colors, spacing, typography, borderRadius } from '../config/theme';
import { VehicleFormScheme, VehicleFormDataZod, VehicleDataWithTime, PATENTE_REGEX, Vehicle } from '../types/vehicle';
import { useAddVehicle } from '../hooks/useAddVehicle';
import { vehicleService } from '../services/vehicleService';
import { SectorSelector } from './SectorSelector';
import { BrandAutoComplete } from './BrandAutoComplete';
import { useEstablishmentStore } from '../store/establishmentStore';
import { usePlateRecognitionFetch } from '../hooks/usePlateRecognitionFetch';
import { SimpleCameraCapture } from './SimpleCameraCapture';
import { VIPBadge } from './VIPBadge';
import { VehicleAddedSuccess } from './VehicleAddedSuccess';
import { useLanguage } from '../contexts/LanguageContext';

interface VehicleFormProps {
  establishmentId: string;
  onSuccess?: () => void;
  embedded?: boolean;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({
  establishmentId,
  onSuccess,
  embedded = false
}) => {
  const { t } = useLanguage();
  const [showSuccess, setShowSuccess] = useState(false);
  const [addedVehicle, setAddedVehicle] = useState<Vehicle | null>(null);
  const [showDriverData, setShowDriverData] = useState(false);
  const [isVip, setIsVip] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const { mutateAsync: addVehicle, isPending } = useAddVehicle();
  const { recognizeVehicle, isProcessing: isAIProcessing } = usePlateRecognitionFetch();

  // Obtener marcas
  const { data: brands = [], isLoading: brandsLoading, error: brandsError } = useQuery({
    queryKey: ['brands'],
    queryFn: () => vehicleService.getBrands(),
    staleTime: Infinity,
  });

  // Obtener datos del establecimiento desde el store
  const selectedEstablishment = useEstablishmentStore((state) => state.selectedEstablishment);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    getValues,
    watch,
  } = useForm<VehicleFormDataZod>({
    resolver: zodResolver(VehicleFormScheme),
    defaultValues: {
      patente: '',
      sector: '',
      establecimiento: establishmentId,
      nombreConductor: '',
      telefono: '',
      marca: '',
      modelo: '',
      color: '',
      quienSeLleva: '',
    },
  });

  const watchedPatente = watch('patente');

      // Función para buscar patente
      const searchPlate = async (plate: string) => {
        if (!plate || plate.length < 6) return;

        try {
          console.log('🔍 Searching plate:', plate);
          console.log('🏢 Current establishment:', {
            id: establishmentId,
            name: selectedEstablishment?.nombre,
            fullData: selectedEstablishment
          });
          const result = await vehicleService.getSearchPlate(plate, establishmentId);
      
      if (result) {
        console.log('✅ Plate found - VIP:', result.vip);
        console.log('🔍 Full result data:', JSON.stringify(result, null, 2));
        console.log('🏢 Establishment context:', {
          establishmentId,
          selectedEstablishment: selectedEstablishment?.nombre
        });
        setValue('marca', result.marca || '');
        setValue('modelo', result.modelo || '');
        setValue('color', result.color || '');
        setValue('nombreConductor', result.nombreConductor || '');
        setValue('telefono', result.telefono || '');
        setIsVip(result.vip || false);
        setIsDisabled(result.inhabilitado || false);
      } else {
        // Resetear campos si no se encuentra
        setValue('marca', '');
        setValue('modelo', '');
        setValue('color', '');
        setValue('nombreConductor', '');
        setValue('telefono', '');
        setIsVip(false);
        setIsDisabled(false);
      }
    } catch (error) {
      console.error('❌ Error searching plate:', error);
      setIsVip(false);
      setIsDisabled(false);
    }
  };

  // Efecto para buscar patente cuando cambia
  useEffect(() => {
    if (watchedPatente && PATENTE_REGEX.test(watchedPatente)) {
      searchPlate(watchedPatente);
    }
  }, [watchedPatente]);

  // Efecto para detectar el teclado
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const onSubmit = async (data: VehicleFormDataZod) => {
    const input: VehicleDataWithTime = { 
      ...data, 
      horaIngreso: new Date().toLocaleTimeString('es-AR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
    const { sector } = getValues();

    console.log('input: ----------------->', input);
    console.log('quienSeLleva: ----------------->', data.quienSeLleva);

    // Solo validar campos obligatorios
    if (errors.patente) {
      Alert.alert('Advertencia', errors.patente.message);
      return;
    }
    if (sector === '') {
      Alert.alert('Advertencia', 'Seleccione un sector');
      return;
    }

    try {
      console.log('🚗 Starting vehicle addition...');
      console.log('🚗 Input data:', JSON.stringify(input, null, 2));
      
      // Si pasa las validaciones obligatorias, proceder
      const result = await addVehicle(input);
      console.log('🚗 Vehicle added successfully:', result);
      
      reset();
      
      // Mostrar componente de éxito con QR
      setAddedVehicle(result as Vehicle);
      setShowSuccess(true);
    } catch (error) {
      console.error('🚗 Error adding vehicle:', error);
      console.error('🚗 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        input: input
      });
      Alert.alert('Error', 'Hubo un problema al agregar el vehículo. Intenta nuevamente.');
    }
  };

  const toggleDriverData = () => {
    setShowDriverData(!showDriverData);
  };

  const getBrandDescription = (id: string) => {
    const brand = brands.find((b) => b._id === id);
    return brand ? brand.descripcion : '';
  };

  const resetStates = () => {
    setValue('marca', '');
    setValue('modelo', '');
    setValue('color', '');
    setValue('nombreConductor', '');
    setValue('telefono', '');
    setIsDisabled(false);
    setIsVip(false);
  };

  const handlePlateChange = (text: string) => {
    resetStates();
    const upper = text.toUpperCase();
    setValue('patente', upper);
    if (PATENTE_REGEX.test(upper)) {
      searchPlate(upper);
    }
  };

  const handleImageCaptured = async (imageUri: string) => {
    try {
      const result = await recognizeVehicle(imageUri);
      if (result) {
        // Actualizar los campos del formulario con los datos reconocidos
        setValue('patente', result.plate);
        if (result.brand) {
          // Buscar la marca en la lista de marcas disponibles
          const foundBrand = brands.find(brand => 
            brand.descripcion.toLowerCase().includes(result.brand!.toLowerCase()) ||
            result.brand!.toLowerCase().includes(brand.descripcion.toLowerCase())
          );
          if (foundBrand) {
            setValue('marca', foundBrand._id);
          }
        }
        if (result.model) {
          setValue('modelo', result.model);
        }
        if (result.color) {
          setValue('color', result.color);
        }
        
        // Buscar la patente en el sistema
        if (result.plate) {
          await searchPlate(result.plate);
        }
      }
    } catch (error) {
      console.error('Error processing captured image:', error);
    }
  };

  const content = (
      <View style={embedded ? styles.embeddedContainer : styles.container}>
        {/* Contenido principal - ScrollView para permitir scroll cuando aparece el teclado */}
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Badge VIP - Solo se muestra si es VIP */}
          {isVip && (
            <View style={styles.vipBadgeContainer}>
              <VIPBadge isVip={isVip} size="medium" />
            </View>
          )}

          <View style={styles.mainContent}>
            {/* Fila de Patente y Sector */}
            <View style={styles.rowContainer}>
              {/* Patente */}
              <View style={styles.patenteContainer}>
                <Controller
                  control={control}
                  name="patente"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.patenteInputContainer}>
                      <View style={styles.patenteInputWrapper}>
                        <TextInput
                          style={styles.patenteInput}
                          value={value}
                          onChangeText={(text) => {
                            const upper = text.toUpperCase();
                            onChange(upper);
                            handlePlateChange(upper);
                          }}
                          onBlur={onBlur}
                          placeholder={t('plate')}
                          placeholderTextColor={colors.darkGrey}
                          autoCapitalize="characters"
                          maxLength={8}
                        />
                      </View>
                      <Pressable 
                        style={[styles.cameraButton, isAIProcessing && styles.cameraButtonDisabled]}
                        onPress={() => setShowCamera(true)}
                        disabled={isAIProcessing}
                      >
                        <Camera color="white" size={20} />
                      </Pressable>
                    </View>
                  )}
                />
              </View>

              {/* Sector */}
              <View style={styles.sectorContainer}>
                <Controller
                  control={control}
                  name="sector"
                  render={({ field: { onChange, value } }) => (
                    <SectorSelector
                      sectors={selectedEstablishment?.sectores || []}
                      selectedSector={value}
                      onSectorChange={onChange}
                    />
                  )}
                />
              </View>
            </View>

            {/* Campo Quien se lleva */}
            <View style={styles.fieldContainer}>
              <Controller
                control={control}
                name="quienSeLleva"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.textInput}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder={t('whoTakesVehicle')}
                    placeholderTextColor={colors.darkGrey}
                  />
                )}
              />
            </View>

            {/* Sección de Marca con fondo gris */}
            <View style={styles.brandSection}>
              <Controller
                control={control}
                name="marca"
                render={({ field: { onChange, value } }) => (
                  <BrandAutoComplete
                    brands={brands}
                    selectedBrand={value}
                    onBrandChange={onChange}
                    searchText={getBrandDescription(value)}
                  />
                )}
              />
            </View>

            {/* Modelo y Color en fila */}
            <View style={styles.modelColorRow}>
              {/* Modelo */}
              <View style={styles.modelContainer}>
                <Controller
                  control={control}
                  name="modelo"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.textInput}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder={t('model')}
                      placeholderTextColor={colors.darkGrey}
                    />
                  )}
                />
              </View>

              {/* Color */}
              <View style={styles.colorContainer}>
                <Controller
                  control={control}
                  name="color"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.textInput}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder={t('color')}
                      placeholderTextColor={colors.darkGrey}
                    />
                  )}
                />
              </View>
            </View>

            {/* Botón de Datos del Conductor */}
            <Pressable style={styles.driverDataButton} onPress={toggleDriverData}>
            <Text style={styles.driverDataButtonText}>{t('driverData')}</Text>
            {showDriverData ? <ChevronUp color="black" size={22} /> : <ChevronDown color="black" size={22} />}
          </Pressable>

          {/* Datos del Conductor (colapsable) */}
          {showDriverData && (
            <View style={styles.driverDataContainer}>
              <View style={styles.fieldContainer}>
                <Controller
                  control={control}
                  name="nombreConductor"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.textInput}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder={t('driverName')}
                      placeholderTextColor={colors.darkGrey}
                    />
                  )}
                />
              </View>
              <View style={styles.fieldContainer}>
                <Controller
                  control={control}
                  name="telefono"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.textInput}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder={t('phone')}
                      placeholderTextColor={colors.darkGrey}
                      keyboardType="phone-pad"
                    />
                  )}
                />
              </View>
            </View>
          )}
          </View>
        </ScrollView>

        {/* Botones - Fijos en la parte inferior */}
        {!isKeyboardVisible && (
        <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.submitButton, (isPending || isDisabled || isAIProcessing) && styles.submitButtonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isPending || isDisabled || isAIProcessing}
        >
          <Text style={styles.submitButtonText}>
            {isPending ? t('adding') : isAIProcessing ? t('processing') : t('addVehicle')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>{t('back')}</Text>
        </TouchableOpacity>
        </View>
        )}

      {/* Componente de cámara */}
      <SimpleCameraCapture
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onImageCaptured={handleImageCaptured}
      />
    </View>
  );

  if (embedded) {
    return (
      <>
        {content}
        {showSuccess && addedVehicle && (
          <VehicleAddedSuccess
            vehicle={addedVehicle}
            onClose={() => {
              setShowSuccess(false);
              setAddedVehicle(null);
              if (onSuccess) {
                onSuccess();
              }
            }}
          />
        )}
      </>
    );
  }

  return (
    <View style={styles.container}>
      {content}
      {showSuccess && addedVehicle && (
        <VehicleAddedSuccess
          vehicle={addedVehicle}
          onClose={() => {
            setShowSuccess(false);
            setAddedVehicle(null);
            if (onSuccess) {
              onSuccess();
            }
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.greyBackground,
  },
  embeddedContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  vipBadgeContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  mainContent: {
    flex: 1,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  patenteContainer: {
    flex: 1,
  },
  patenteInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // Usar gap en lugar de marginLeft
  },
  patenteInputWrapper: {
    flex: 1,
  },
  patenteInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGrey,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 18,
    color: colors.black,
  },
  cameraButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 8,
    padding: 12,
  },
  cameraButtonDisabled: {
    opacity: 0.5,
  },
  sectorContainer: {
    flex: 1,
  },
  brandSection: {
    marginBottom: 20,
    backgroundColor: colors.ligthGrey,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ligthGrey,
    padding: 16,
  },
  modelColorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  modelContainer: {
    flex: 1,
  },
  colorContainer: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  textInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGrey,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 18,
    color: colors.black,
    placeholderTextColor: colors.darkGrey,
  },
  driverDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.ligthGrey,
  },
  driverDataButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkGrey,
  },
  driverDataContainer: {
    marginBottom: 20,
  },
  buttonsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
    backgroundColor: colors.greyBackground,
    borderTopWidth: 1,
    borderTopColor: colors.ligthGrey,
    gap: 12,
  },
  submitButton: {
    backgroundColor: colors.darkBlue,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: colors.ligthGrey,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.darkGrey,
  },
  backButtonText: {
    color: colors.darkGrey,
    fontSize: 16,
    fontWeight: '600',
  },
});
