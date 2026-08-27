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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, ChevronUp, Camera } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { colors, spacing, borderRadius } from '../config/theme';
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
import { PhysicalCardButton } from './PhysicalCardButton';
import { PhysicalCard } from '../types/vehicle';
import { physicalCardService } from '../services/physicalCardService';
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();
  const [showSuccess, setShowSuccess] = useState(false);
  const [addedVehicle, setAddedVehicle] = useState<Vehicle | null>(null);
  const [showDriverData, setShowDriverData] = useState(false);
  const [isVip, setIsVip] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [assignedCard, setAssignedCard] = useState<PhysicalCard | null>(null);
  /** QR digital por defecto; tarjeta física sigue siendo opcional vía PhysicalCardButton */
  const [noPhysicalCard, setNoPhysicalCard] = useState(true);
  const [cardButtonReset, setCardButtonReset] = useState(0);

  const { mutateAsync: addVehicle, isPending } = useAddVehicle(establishmentId);
  const { recognizeVehicle, isProcessing: isAIProcessing } = usePlateRecognitionFetch();

  // Obtener marcas
  const { data: brands = [], isLoading: brandsLoading, error: brandsError } = useQuery({
    queryKey: ['brands'],
    queryFn: () => vehicleService.getBrands(),
    staleTime: Infinity,
  });

  // Establecimiento seleccionado global (Zustand) — se sincroniza desde home al elegir en el combo / al ir a "nuevo vehículo"
  const selectedEstablishment = useEstablishmentStore((state) => state.selectedEstablishment);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<VehicleFormDataZod>({
    resolver: zodResolver(VehicleFormScheme),
    mode: 'onChange',
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
  const watchedSector = watch('sector');

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
        const marcaId =
          typeof result.marca === 'string'
            ? result.marca
            : result.marca && typeof result.marca === 'object' && '_id' in result.marca
              ? (result.marca as { _id: string })._id
              : '';
        setValue('marca', marcaId, { shouldValidate: true });
        setValue('modelo', result.modelo || '', { shouldValidate: true });
        setValue('color', result.color || '', { shouldValidate: true });
        setValue('nombreConductor', result.nombreConductor || '', { shouldValidate: true });
        setValue('telefono', result.telefono || '', { shouldValidate: true });
        setIsVip(result.vip || false);
        setIsDisabled(result.inhabilitado || false);
      } else {
        // Resetear campos si no se encuentra
        setValue('marca', '', { shouldValidate: true });
        setValue('modelo', '', { shouldValidate: true });
        setValue('color', '', { shouldValidate: true });
        setValue('nombreConductor', '', { shouldValidate: true });
        setValue('telefono', '', { shouldValidate: true });
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

  const onSubmit = async (data: VehicleFormDataZod) => {
    if (!assignedCard && !noPhysicalCard) {
      Alert.alert(
        'Advertencia',
        'Elegí: asignar tarjeta, escanear una tarjeta o "Solo QR digital".'
      );
      return;
    }

    const input: VehicleDataWithTime = {
      ...data,
      establecimiento: establishmentId,
      horaIngreso: new Date().toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      ...(noPhysicalCard && {
        noPhysicalCard: true,
      }),
    };
    console.log('input: ----------------->', input);
    console.log('quienSeLleva: ----------------->', data.quienSeLleva);

    try {
      console.log('🚗 Paso 1: Creando vehículo/ingreso...');
      console.log('🚗 Input data:', JSON.stringify(input, null, 2));
      
      // PASO 1: Crear el ingreso primero (sin tarjeta)
      const result = await addVehicle(input);
      console.log('✅ Ingreso creado:', result);
      
      // PASO 2: Si hay tarjeta asignada, vincularla al vehículo/ingreso
      if (assignedCard && result._id) {
        try {
          console.log('🏷️ Paso 2: Vinculando tarjeta al vehículo...');
          console.log('🏷️ Tarjeta:', assignedCard.cardNumber);
          console.log('🏷️ Vehículo ID:', result._id);
          
          const cardResponse = await physicalCardService.assignToVehicle(
            establishmentId,
            selectedEstablishment?.nombre || 'Establecimiento',
            result._id,
            data.patente
          );
          
          console.log('✅ Tarjeta vinculada:', cardResponse.assignedCard.cardNumber);
          
          // Actualizar el resultado con la información de la tarjeta
          result.physicalCardId = cardResponse.assignedCard._id;
          result.physicalCardNumber = cardResponse.assignedCard.cardNumber;
          result.qrCode = cardResponse.assignedCard.qrCode;
          result.noPhysicalCard = false;
          
          // Invalidar la lista de vehículos para que se actualice con la tarjeta
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
          
        } catch (cardError: any) {
          console.error('⚠️ Error vinculando tarjeta:', cardError);
          Alert.alert(
            'Advertencia',
            'El vehículo se creó pero no se pudo asignar la tarjeta física. Use QR digital.'
          );
        }
      }
      
      reset();
      setAssignedCard(null);
      setNoPhysicalCard(true);
      
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
    <KeyboardAvoidingView
      style={styles.keyboardAvoiding}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={embedded ? styles.embeddedContainer : styles.container}>
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

          <View>
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
                            onChange(text.toUpperCase());
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
                  render={({ field: { onChange, value } }) => {
                    // temporal — confirmar sectores del store al renderizar SectorSelector
                    console.log('🏢 sectores disponibles:', selectedEstablishment?.sectores);
                    return (
                      <SectorSelector
                        sectors={selectedEstablishment?.sectores || []}
                        selectedSector={value}
                        onSectorChange={onChange}
                      />
                    );
                  }}
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

        <View style={styles.footerActions}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (isPending ||
              isDisabled ||
              isAIProcessing ||
              !(watchedPatente ?? '').trim() ||
              !(watchedSector ?? '').trim()) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit(onSubmit, (invalid) => {
            if (invalid.establecimiento) {
              Alert.alert(
                'Advertencia',
                'No hay establecimiento seleccionado. Volvé al inicio y elegí un establecimiento.'
              );
            } else if (invalid.sector) {
              Alert.alert('Advertencia', 'Seleccione un sector');
            } else if (invalid.patente) {
              Alert.alert('Advertencia', invalid.patente.message ?? 'Patente incorrecta');
            }
          })}
          disabled={
            isPending ||
            isDisabled ||
            isAIProcessing ||
            !(watchedPatente ?? '').trim() ||
            !(watchedSector ?? '').trim()
          }
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

        <View style={styles.cardConfigSection}>
          <PhysicalCardButton
            establishmentId={establishmentId}
            onCardAssigned={(card) => {
              setAssignedCard(card);
              if (card) setNoPhysicalCard(false);
            }}
            onNoCardSelected={() => setNoPhysicalCard(true)}
            onExpandPhysicalOptions={() => setNoPhysicalCard(false)}
            disabled={isPending || isAIProcessing}
            resetTrigger={cardButtonReset}
          />
        </View>

      <SimpleCameraCapture
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onImageCaptured={handleImageCaptured}
      />
    </View>
    </KeyboardAvoidingView>
  );

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setAddedVehicle(null);
    // Reiniciar el formulario con valores vacíos
    reset({
      patente: '',
      sector: '',
      establecimiento: establishmentId,
      nombreConductor: '',
      telefono: '',
      marca: '',
      modelo: '',
      color: '',
      quienSeLleva: '',
      nroLlave: undefined,
    });
    // Reiniciar estados de tarjeta física (QR digital por defecto)
    setAssignedCard(null);
    setNoPhysicalCard(true);
    // Reiniciar el componente PhysicalCardButton
    setCardButtonReset(prev => prev + 1);
    // Reiniciar estados VIP y Disabled
    setIsVip(false);
    setIsDisabled(false);
    setShowDriverData(false);
  };

  if (embedded) {
    return (
      <View style={styles.embeddedRoot}>
        {content}
        {showSuccess && addedVehicle && (
          <VehicleAddedSuccess
            vehicle={addedVehicle}
            onClose={handleSuccessClose}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {content}
      {showSuccess && addedVehicle && (
        <VehicleAddedSuccess
          vehicle={addedVehicle}
          onClose={handleSuccessClose}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.greyBackground,
  },
  embeddedRoot: {
    flex: 1,
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
    paddingBottom: 12,
  },
  vipBadgeContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    marginBottom: 12,
    backgroundColor: colors.ligthGrey,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ligthGrey,
    padding: 16,
  },
  modelColorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  modelContainer: {
    flex: 1,
  },
  colorContainer: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 12,
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
    marginBottom: 12,
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
    marginBottom: 12,
  },
  cardConfigSection: {
    paddingHorizontal: 4,
    paddingBottom: 12,
  },
  footerActions: {
    padding: 16,
    paddingBottom: 12,
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
