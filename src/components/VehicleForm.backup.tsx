import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, ChevronUp, Camera } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { colors, spacing, typography, borderRadius } from '../config/theme';
import { VehicleFormScheme, VehicleFormDataZod, VehicleDataWithTime, PATENTE_REGEX } from '../types/vehicle';
import { useAddVehicle } from '../hooks/useAddVehicle';
import { vehicleService } from '../services/vehicleService';
import { VIPBadge } from './VIPBadge';
import { SectorSelector } from './SectorSelector';
import { BrandAutoComplete } from './BrandAutoComplete';
import { useEstablishmentStore } from '../store/establishmentStore';

interface VehicleFormProps {
  establishmentId: string;
  onSuccess?: () => void;
  embedded?: boolean; // Nueva prop para indicar si está embebido en otra pantalla
}

export const VehicleForm: React.FC<VehicleFormProps> = ({
  establishmentId,
  onSuccess,
  embedded = false
}) => {
  const [showDriverData, setShowDriverData] = useState(false);
  const [isVip, setIsVip] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  const { mutateAsync: addVehicle, isPending } = useAddVehicle();

  // Obtener marcas
  const { data: brands = [], isLoading: brandsLoading, error: brandsError } = useQuery({
    queryKey: ['brands'],
    queryFn: () => vehicleService.getBrands(),
    staleTime: Infinity,
  });

  // Obtener datos del establecimiento desde el store
  const selectedEstablishment = useEstablishmentStore((state) => state.selectedEstablishment);
  const sectors = selectedEstablishment?.sectores || [];
  
  // Debug logs
  console.log('🏢 Selected establishment from store:', selectedEstablishment);
  console.log('🏢 Sectors from store:', sectors);
  console.log('🏷️ Brands:', brands);
  console.log('🏷️ Brands loading:', brandsLoading);
  console.log('🏷️ Brands error:', brandsError);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<VehicleFormDataZod>({
    resolver: zodResolver(VehicleFormScheme),
    defaultValues: {
      patente: '',
      sector: '',
      establecimiento: establishmentId,
      marca: '',
      modelo: '',
      color: '',
      nombreConductor: '',
      telefono: '',
    },
  });

  useEffect(() => {
    if (isDisabled) {
      Alert.alert('Vehículo Inhabilitado', 'Este vehículo está inhabilitado en el sistema');
    }
  }, [isDisabled]);

  const searchPlate = async (plate: string) => {
    try {
      console.log('🔍 Searching plate:', plate);
      const result = await vehicleService.getSearchPlate(plate, establishmentId);
      
      if (result) {
        const { color, inhabilitado, nombreConductor, telefono, modelo, marca, vip } = result;
        
        console.log('✅ Plate found - VIP:', vip);
        
        // Llenar campos automáticamente
        setValue('marca', marca || '');
        setValue('modelo', modelo || '');
        setValue('color', color || '');
        setValue('nombreConductor', nombreConductor || '');
        setValue('telefono', telefono || '');
        
        setIsDisabled(inhabilitado || false);
        setIsVip(vip || false);
      } else {
        // Si no se encuentra la patente, limpiar campos
        console.log('ℹ️ Plate not found - clearing fields');
        resetVehicleData();
        setIsVip(false);
      }
    } catch (error) {
      console.error('❌ Error searching plate:', error);
      resetVehicleData();
      setIsVip(false);
    }
  };

  const resetVehicleData = () => {
    setValue('marca', '');
    setValue('modelo', '');
    setValue('color', '');
    setValue('nombreConductor', '');
    setValue('telefono', '');
    setIsDisabled(false);
  };

  const onSubmit = async (data: VehicleFormDataZod) => {
    try {
      // Validaciones adicionales
      if (!data.sector) {
        Alert.alert('Error', 'Debe seleccionar un sector');
        return;
      }

      if (isDisabled) {
        Alert.alert('Error', 'No se puede ingresar un vehículo inhabilitado');
        return;
      }

      // Preparar datos para envío
      const vehicleData: VehicleDataWithTime = {
        ...data,
        horaIngreso: new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        }),
      };

      console.log('📤 Submitting vehicle:', vehicleData);

      await addVehicle(vehicleData);
      
      // Limpiar formulario
      reset();
      setIsVip(false);
      setIsDisabled(false);
      setShowDriverData(false);
      
      onSuccess?.();
      
    } catch (error) {
      console.error('❌ Error submitting form:', error);
    }
  };

  const handlePlateChange = (text: string) => {
    resetVehicleData();
    const upperText = text.toUpperCase();
    
    // Validar formato de patente argentina
    if (PATENTE_REGEX.test(upperText)) {
      searchPlate(upperText);
    }
    
    return upperText;
  };

  const content = (
    <ScrollView
      style={embedded ? styles.embeddedScrollView : styles.scrollView}
      contentContainerStyle={embedded ? styles.embeddedScrollContent : styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>Nuevo Vehículo</Text>
            <Text style={styles.headerSubtitle}>
              {selectedEstablishment?.nombre || 'Establecimiento'}
            </Text>
            <VIPBadge visible={isVip} />
          </View>

          {/* Main Form Card */}
          <View style={styles.formCard}>
            {/* Patente Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Información Principal</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Patente *</Text>
                <Controller
                  control={control}
                  name="patente"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View>
                      <View style={styles.plateInputContainer}>
                        <TextInput
                          style={[styles.input, errors.patente && styles.inputError]}
                          value={value}
                          onChangeText={(text) => onChange(handlePlateChange(text))}
                          onBlur={onBlur}
                          placeholder="ABC123 o AA123AA"
                          placeholderTextColor={colors.secondary[500]}
                          autoCapitalize="characters"
                          maxLength={8}
                        />
                        <TouchableOpacity style={styles.cameraButton}>
                          <Camera size={20} color={colors.white} />
                        </TouchableOpacity>
                      </View>
                      {errors.patente && (
                        <Text style={styles.errorText}>{errors.patente.message}</Text>
                      )}
                    </View>
                  )}
                />
              </View>

              <View style={styles.inputGroup}>
                <Controller
                  control={control}
                  name="sector"
                  render={({ field: { onChange, value } }) => (
                    <SectorSelector
                      sectors={sectors}
                      selectedSector={value}
                      onSelect={onChange}
                      error={errors.sector?.message}
                      label="Sector *"
                    />
                  )}
                />
              </View>
            </View>

            {/* Vehicle Data Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Datos del Vehículo</Text>
              
              <View style={styles.inputGroup}>
                <Controller
                  control={control}
                  name="marca"
                  render={({ field: { onChange, value } }) => (
                    <BrandAutoComplete
                      brands={brands}
                      selectedBrand={value}
                      onSelect={onChange}
                      error={errors.marca?.message}
                      label="Marca"
                    />
                  )}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={styles.halfWidth}>
                  <Controller
                    control={control}
                    name="modelo"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Modelo</Text>
                        <TextInput
                          style={[styles.input, errors.modelo && styles.inputError]}
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          placeholder="Corolla"
                          placeholderTextColor={colors.secondary[500]}
                        />
                        {errors.modelo && (
                          <Text style={styles.errorText}>{errors.modelo.message}</Text>
                        )}
                      </View>
                    )}
                  />
                </View>

                <View style={styles.halfWidth}>
                  <Controller
                    control={control}
                    name="color"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Color</Text>
                        <TextInput
                          style={[styles.input, errors.color && styles.inputError]}
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          placeholder="Blanco"
                          placeholderTextColor={colors.secondary[500]}
                        />
                        {errors.color && (
                          <Text style={styles.errorText}>{errors.color.message}</Text>
                        )}
                      </View>
                    )}
                  />
                </View>
              </View>
            </View>

            {/* Driver Data Section */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.driverDataToggle}
                onPress={() => setShowDriverData(!showDriverData)}
              >
                <View style={styles.toggleContent}>
                  <Text style={styles.sectionTitle}>Datos del Conductor</Text>
                  <Text style={styles.toggleSubtitle}>
                    {showDriverData ? 'Ocultar' : 'Mostrar'} información adicional
                  </Text>
                </View>
                {showDriverData ? (
                  <ChevronUp size={24} color={colors.primary[600]} />
                ) : (
                  <ChevronDown size={24} color={colors.primary[600]} />
                )}
              </TouchableOpacity>

              {showDriverData && (
                <View style={styles.driverDataContainer}>
                  <View style={styles.inputGroup}>
                    <Controller
                      control={control}
                      name="nombreConductor"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View>
                          <Text style={styles.label}>Nombre del Conductor</Text>
                          <TextInput
                            style={[styles.input, errors.nombreConductor && styles.inputError]}
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            placeholder="Juan Pérez"
                            placeholderTextColor={colors.secondary[500]}
                            maxLength={60}
                          />
                          {errors.nombreConductor && (
                            <Text style={styles.errorText}>{errors.nombreConductor.message}</Text>
                          )}
                        </View>
                      )}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Controller
                      control={control}
                      name="telefono"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View>
                          <Text style={styles.label}>Teléfono</Text>
                          <TextInput
                            style={[styles.input, errors.telefono && styles.inputError]}
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            placeholder="1123456789"
                            placeholderTextColor={colors.secondary[500]}
                            keyboardType="phone-pad"
                            maxLength={11}
                          />
                          {errors.telefono && (
                            <Text style={styles.errorText}>{errors.telefono.message}</Text>
                          )}
                        </View>
                      )}
                    />
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.submitSection}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (isPending || isDisabled) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={isPending || isDisabled}
            >
              <Text style={styles.submitButtonText}>
                {isPending ? 'Agregando...' : 'Agregar Vehículo'}
              </Text>
            </TouchableOpacity>
          </View>
    </ScrollView>
  );

  if (embedded) {
    return content;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary[50],
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  embeddedScrollView: {
    flex: 1,
  },
  embeddedScrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  
  // Header Section
  headerSection: {
    backgroundColor: colors.white,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  headerTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.secondary[900],
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.sizes.base,
    color: colors.secondary[600],
    textAlign: 'center',
    fontWeight: typography.weights.medium,
  },

  // Form Card
  formCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  // Sections
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.secondary[900],
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary[100],
  },

  // Input Groups
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },

  // Labels and Inputs
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.secondary[700],
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.secondary[200],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.secondary[900],
    minHeight: 52,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputError: {
    borderColor: colors.red[500],
    backgroundColor: colors.red[50],
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.red[600],
    marginTop: spacing.xs,
    fontWeight: typography.weights.medium,
  },

  // Plate Input
  plateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cameraButton: {
    backgroundColor: colors.primary[600],
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  // Driver Data Toggle
  driverDataToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary[50],
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  toggleContent: {
    flex: 1,
  },
  toggleSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.primary[600],
    marginTop: spacing.xs,
    fontWeight: typography.weights.medium,
  },
  driverDataContainer: {
    backgroundColor: colors.secondary[50],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
  },

  // Submit Section
  submitSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  submitButton: {
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: colors.secondary[400],
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
});
