import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Clock, ChevronLeft, Ban, Repeat, Edit, User, Car, Crown, RotateCcw, X } from 'lucide-react-native';
import {
  View,
  ImageBackground,
  Text,
  ActivityIndicator,
  Alert,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import { IconButton } from '../components/IconButton';
import { WideButton } from '../components/WideButton';
import { colors, spacing, typography, borderRadius } from '../config/theme';
import { router } from 'expo-router';
import { CarmanIcon } from '../components/CarmanIcon';
import { VehicleState } from '../types/vehicle';
import { useUpdateState } from '../hooks/useUpdateState';
import { useQuery } from '@tanstack/react-query';
import { vehicleService } from '../services/vehicleService';
import { Dialog } from '../components/Dialog';
import { useUpdateInfo } from '../hooks/useUpdateInfo';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';
import { normalizeSectorList, generateWhatsAppQR } from '../utils/formatters';
import { format } from 'date-fns';
import { useLanguage } from '../contexts/LanguageContext';
import { CustomSelect } from '../components/CustomSelect';
import QRCode from 'react-native-qrcode-svg';
import { API_ENDPOINTS } from '../config/constants';
import { AnimatedQRCode } from '../components/AnimatedQRCode';

export const DetailsScreen = ({ id }: { id: string }) => {
  const [showModal, setShowModal] = useState(false);
  const [showVehicleInfoModal, setShowVehicleInfoModal] = useState(false);
  const [showPersonInfoModal, setShowPersonInfoModal] = useState(false);
  const shineAnimation = useRef(new Animated.Value(0)).current;
  const { t } = useLanguage();

  const {
    data: vehicle,
    error: vehicleErr,
    isError: vehicleHasErr,
    refetch: refetchVehicle,
    isFetching: gettingVehicle,
  } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => vehicleService.getEntryById(id),
    staleTime: Infinity,
    gcTime: 0,
    refetchInterval: 1000 * 60,
  });

  const { error, isPending, mutateAsync: updateState } = useUpdateState();
  const { mutateAsync: updateInfoAsync } = useUpdateInfo();

  useRefreshOnFocus(refetchVehicle);

  // Estados para el modal de edición
  const [newPlateText, setNewPlateText] = useState('');
  const [newSectorText, setNewSectorText] = useState('');

  // Inicializar estados cuando cambia el vehículo
  useEffect(() => {
    if (vehicle) {
      setNewPlateText(vehicle.patente || '');
      setNewSectorText(vehicle.sector || '');
    }
  }, [vehicle]);

  useEffect(() => {
    if (vehicle?.vip) {
      const startShineAnimation = () => {
        Animated.sequence([
          Animated.timing(shineAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shineAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setTimeout(startShineAnimation, 2000); // Esperar 2 segundos antes de repetir
        });
      };
      startShineAnimation();
    }
  }, [vehicle?.vip, shineAnimation]);

  const bgPath = (vehicle?.estado === 'ESTACIONADO' || vehicle?.estado === 'INGRESADO')
    ? require('../../assets/bg/red-parking.png')
    : require('../../assets/bg/yellow-parking.png');

  const handleChangeState = (state: VehicleState) => () => {
    const body = {
      estado: state,
      ingresoId: vehicle?._id!,
      horaEgreso: state === 'ENTREGADO' ? format(new Date(), 'HH:mm') : undefined,
    };
    updateState(body)
      .then(() => {
        if (state === 'ENTREGADO') {
          Alert.alert('Vehiculo egresado', 'El vehiculo ha sido egresado con exito', [
            {
              text: 'OK',
              onPress: router.back,
            },
          ]);
        }
      })
      .finally(() => {
        refetchVehicle();
      });
  };

  const handleChangeInfo = async () => {
    const body = {
      patente: newPlateText || vehicle?.patente!,
      sector: newSectorText || vehicle?.sector!,
      establecimiento: vehicle?.establecimiento._id!,
      horaIngreso: vehicle?.horaIngreso!,
      nombreConductor: vehicle?.nombreConductor,
      telefono: vehicle?.telefono,
      marca: vehicle?.marca?._id,
      modelo: vehicle?.modelo,
      color: vehicle?.color,
      active: vehicle?.active,
    };

    console.log('🔄 Starting vehicle info update...');
    console.log('🔄 Body:', body);
    console.log('🔄 Vehicle ID:', vehicle?._id);

    try {
      // Llamar directamente al servicio sin usar el hook
      await vehicleService.putEntryInfo(vehicle?._id!, body);
      console.log('✅ Vehicle info updated successfully');
      setShowModal(false);
      Alert.alert('Éxito', 'Información del vehículo actualizada correctamente');
    } catch (e) {
      console.error('❌ Error actualizando info', e);
      Alert.alert('Error', 'No se pudo actualizar la información del vehículo');
      setShowModal(false);
    }
  };

  const openEditModal = () => {
    // Reinicializar los valores del modal
    if (vehicle) {
      setNewPlateText(vehicle.patente || '');
      setNewSectorText(vehicle.sector || '');
    }
    setShowModal(true);
  };

  const closeEditModal = () => {
    setShowModal(false);
  };

  if (vehicleErr) {
    console.error(vehicleErr);
    return (
      <Dialog
        message={t('errorLoadingVehicle')}
        title={t('unexpectedError')}
        btnAccept={router.back}
        showDialog={vehicleHasErr}
      />
    );
  }

  if (error) console.error('-- Error en DetailsScreen --', error.message);

  if (vehicle) {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={bgPath}
          resizeMode="stretch"
          style={styles.headerContainer}
        >
          {/* Botón de regreso */}
          <View style={styles.backButtonContainer}>
            <IconButton icon={<ChevronLeft size={25} color="black" />} onPress={router.back} />
          </View>

          {/* Información principal */}
          <View style={styles.mainInfoContainer}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{t('plate')}</Text>
                <Text style={styles.infoValue}>{vehicle?.patente}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{t('key')}</Text>
                <Text style={styles.infoValue}>{vehicle?.nroLlave}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{t('sector')}</Text>
                <Text style={styles.infoValue}>{vehicle?.sector}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{t('schedule')}</Text>
                <Text style={styles.infoValue}>{vehicle?.horaIngreso}</Text>
              </View>
            </View>
          </View>
          
          {/* Iconos de información */}
          <View style={styles.iconsContainer}>
            {vehicle?.vip && (
              <Pressable style={styles.vipButton} onPress={() => setShowVehicleInfoModal(true)}>
                <Animated.View
                  style={[
                    styles.vipContainer,
                    {
                      transform: [
                        {
                          scale: shineAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.05],
                          }),
                        },
                      ],
                      opacity: shineAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 0.8],
                      }),
                    },
                  ]}
                >
                  <Crown size={16} color="black" />
                  <Text style={styles.vipText}>{t('vip')}</Text>
                </Animated.View>
              </Pressable>
            )}
            <Pressable style={styles.iconButton} onPress={openEditModal}>
              <Edit size={20} color="black" />
            </Pressable>
            {vehicle?.recurrente && (
              <Pressable style={styles.iconButton} onPress={() => setShowVehicleInfoModal(true)}>
                <RotateCcw size={20} color="black" />
              </Pressable>
            )}
            {vehicle?.inhabilitado && (
              <Pressable style={styles.iconButton} onPress={() => setShowVehicleInfoModal(true)}>
                <X size={20} color="black" />
              </Pressable>
            )}
            <Pressable style={styles.iconButton} onPress={() => setShowVehicleInfoModal(true)}>
              <Car size={20} color="black" />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => setShowPersonInfoModal(true)}>
              <User size={20} color="black" />
            </Pressable>
          </View>
          </ImageBackground>
        
        <View style={styles.scrollContainer}>
          {/* Sección del QR - Separada y centrada */}
          <View style={styles.qrSection}>
            <AnimatedQRCode 
              value={generateWhatsAppQR(vehicle)} 
              vehicle={vehicle}
              size={200} 
              backgroundColor="white"
              color="black"
            />
          </View>

          {/* Sección de botones - Separada del QR */}
          <View style={styles.buttonsSection}>
            {isPending || gettingVehicle ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.black} size="large" />
              </View>
            ) : (
              <View style={styles.stateButtonsContainer}>
                <WideButton
                  onPress={handleChangeState('SOLICITADO')}
                  title={t('request')}
                  primary={vehicle?.estado === 'SOLICITADO'}
                />
                <WideButton
                  onPress={handleChangeState('INGRESADO')}
                  title={t('enter')}
                  primary={vehicle?.estado === 'INGRESADO'}
                />
                <WideButton
                  onPress={handleChangeState('ESTACIONADO')}
                  title={t('park')}
                  primary={vehicle?.estado === 'ESTACIONADO'}
                />
                <WideButton
                  onPress={handleChangeState('EN CAMINO')}
                  title={t('onWay')}
                  primary={vehicle?.estado === 'EN CAMINO'}
                />
                <WideButton
                  onPress={handleChangeState('ENTREGADO')}
                  title={t('exit')}
                  primary={vehicle?.estado === 'ENTREGADO'}
                />
              </View>
            )}
          </View>

        </View>

        {/* Modal de edición - Solo patente y sector */}
        <Modal transparent animationType="fade" visible={showModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{t('newPlate')}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newPlateText}
                  onChangeText={setNewPlateText}
                />
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{t('newSector')}</Text>
                <CustomSelect
                  title=""
                  items={vehicle?.establecimiento?.sectores ? normalizeSectorList(vehicle.establecimiento.sectores) : []}
                  onValueChange={(val) => setNewSectorText(val)}
                  selectedValue={newSectorText}
                />
              </View>
              
              <View style={styles.modalButtons}>
                <WideButton title={t('accept')} onPress={handleChangeInfo} medium primary />
                <WideButton title={t('cancel')} onPress={closeEditModal} medium />
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal de información del vehículo */}
        <Modal transparent animationType="fade" visible={showVehicleInfoModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('vehicleInformation')}</Text>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{t('plate')}</Text>
                <Text style={styles.modalValue}>{vehicle?.patente}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{t('brand')}</Text>
                <Text style={styles.modalValue}>{vehicle?.marca?.descripcion || t('notLoaded')}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{t('color')}</Text>
                <Text style={styles.modalValue}>{vehicle?.color || t('notLoaded')}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{t('model')}</Text>
                <Text style={styles.modalValue}>{vehicle?.modelo || t('notLoaded')}</Text>
              </View>
              
              <View style={styles.modalButtons}>
                <WideButton title={t('close')} onPress={() => setShowVehicleInfoModal(false)} medium primary />
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal de información de la persona */}
        <Modal transparent animationType="fade" visible={showPersonInfoModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('personInformation')}</Text>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{t('whoTakesVehicle')}</Text>
                <Text style={styles.modalValue}>{vehicle?.quienSeLleva || t('notSpecified')}</Text>
              </View>
              
              <View style={styles.modalButtons}>
                <WideButton title={t('close')} onPress={() => setShowPersonInfoModal(false)} medium primary />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator color={colors.white} size="large" />
    </View>
  );
};

const IconContainer = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.iconContainer}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.greyBackground,
  },
  headerContainer: {
    flex: 0.175,
    width: '100%',
    marginTop: 0, // Sin margin para que llegue hasta arriba
    paddingTop: 50, // Padding para evitar el notch del iPhone
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 3,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  editButton: {
    position: 'absolute',
    left: 4,
    top: 10, // Ajustar para el nuevo marginTop
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.black,
    backgroundColor: colors.white,
    padding: 8,
  },
  backButtonContainer: {
    position: 'absolute',
    left: 16,
    top: 50,
  },
  mainInfoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  vehicleInfoContainer: {
    flex: 2,
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
  },
  infoLabelSmall: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.black,
  },
  infoValueSmall: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.black,
  },
  badgesContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
  },
  iconButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.black,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipButton: {
    backgroundColor: '#FFD700',
    borderRadius: borderRadius.md,
    padding: 6,
    borderWidth: 1,
    borderColor: colors.black,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  vipText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'black',
  },
  bottomInfoContainer: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingBottom: 16,
  },
  infoChip: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: colors.white,
    width: 109,
    height: 32,
    borderRadius: 5,
  },
  chipText: {
    fontSize: 18,
    textAlign: 'center',
    color: colors.black,
  },
  scrollContainer: {
    flex: 0.825,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
    justifyContent: 'flex-start',
  },
  qrSection: {
    flex: 0.5,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  buttonsSection: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  stateButtonsContainer: {
    gap: 12,
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '75%',
    borderRadius: borderRadius.xl,
    backgroundColor: colors.white,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  modalSection: {
    alignItems: 'center',
    justifyContent: 'space-evenly',
    padding: 16,
  },
  modalLabel: {
    marginVertical: 8,
    fontWeight: '600',
  },
  modalInput: {
    width: '100%',
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.ligthGrey,
  },
  modalValue: {
    fontSize: typography.sizes.base,
    color: colors.darkGrey,
    padding: spacing.sm,
    backgroundColor: colors.greyBackground,
    borderRadius: borderRadius.md,
  },
  modalButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 16,
    gap: 12,
  },
  iconContainer: {
    backgroundColor: colors.white,
    padding: 5,
    borderRadius: 5,
    borderColor: colors.black,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 1,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.blueBackGround,
  },
});
