import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { CameraView, requestCameraPermissionsAsync } from 'expo-camera';
import type { CameraType } from 'expo-camera';
import { CreditCard, Smartphone, Check, X, RefreshCw, Scan, ScanLine } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../config/theme';
import { PhysicalCard } from '../types/vehicle';
import { physicalCardService } from '../services/physicalCardService';
import { useLanguage } from '../contexts/LanguageContext';
import { useEstablishmentStore } from '../store/establishmentStore';
import { CardSelectorModal } from './CardSelectorModal';

interface PhysicalCardButtonProps {
  establishmentId: string;
  onCardAssigned: (card: PhysicalCard | null) => void;
  onNoCardSelected: () => void;
  /** Al pasar de “solo QR” a elegir tarjeta (asignar / escanear) */
  onExpandPhysicalOptions?: () => void;
  disabled?: boolean;
  resetTrigger?: number;  // Trigger para resetear el componente
}

export const PhysicalCardButton: React.FC<PhysicalCardButtonProps> = ({
  establishmentId,
  onCardAssigned,
  onNoCardSelected,
  onExpandPhysicalOptions,
  disabled = false,
  resetTrigger = 0,
}) => {
  const { t } = useLanguage();
  const [assignedCard, setAssignedCard] = useState<PhysicalCard | null>(null);
  /** Por defecto solo QR digital; el usuario puede abrir opciones de tarjeta física */
  const [noCardSelected, setNoCardSelected] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showCardSelector, setShowCardSelector] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    onNoCardSelected();
  }, []);

  useEffect(() => {
    if (resetTrigger > 0) {
      setAssignedCard(null);
      setNoCardSelected(true);
      setShowCardSelector(false);
      setShowScanner(false);
      onNoCardSelected();
    }
  }, [resetTrigger]);

  const handleAssignCard = async () => {
    if (disabled || isAssigning) return;

    setIsAssigning(true);
    try {
      const selectedEstablishment = useEstablishmentStore.getState().selectedEstablishment;
      
      if (selectedEstablishment) {
        // MODO PRUEBA: Simula la asignación de tarjeta
        const cardResponse = await physicalCardService.assignNextAvailableCard(
          establishmentId, 
          selectedEstablishment.nombre
        );
        
        setAssignedCard(cardResponse.assignedCard);
        setNoCardSelected(false);
        onCardAssigned(cardResponse.assignedCard);
        
        Alert.alert(
          t('cardAssigned'), 
          t('cardAssignedMessage', { cardNumber: cardResponse.assignedCard.cardNumber })
        );
      }
    } catch (error) {
      Alert.alert(
        t('error'), 
        t('cardAssignmentError')
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const handleNoCard = () => {
    if (disabled) return;
    
    setNoCardSelected(true);
    setAssignedCard(null);
    onNoCardSelected(); // ✅ Llamar callback para notificar al formulario
  };

  const handleClearSelection = () => {
    if (assignedCard) {
      setAssignedCard(null);
      setNoCardSelected(true);
      onCardAssigned(null);
      onNoCardSelected();
      return;
    }
    if (noCardSelected) {
      setNoCardSelected(false);
      onExpandPhysicalOptions?.();
    }
  };

  const handleOpenPhysicalOptions = () => {
    setNoCardSelected(false);
    onExpandPhysicalOptions?.();
  };

  const handleChangeCard = () => {
    setShowCardSelector(true);
  };

  const handleCardSelected = (newCard: PhysicalCard) => {
    setAssignedCard(newCard);
    onCardAssigned(newCard);
    Alert.alert(
      t('cardChanged'),
      t('cardChangedMessage', { cardNumber: newCard.cardNumber })
    );
  };

  // Solicitar permisos de cámara
  useEffect(() => {
    (async () => {
      if (showScanner) {
        const { status } = await requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      }
    })();
  }, [showScanner]);

  // Manejar escaneo de QR
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (isScanning) return; // Evitar múltiples escaneos

    setIsScanning(true);
    setShowScanner(false);

    try {
      console.log('📱 QR escaneado:', data);
      
      // Buscar tarjeta por QR code
      const card = await physicalCardService.getCardByQR(data);
      
      if (card) {
        setAssignedCard(card);
        setNoCardSelected(false);
        onCardAssigned(card);
        
        Alert.alert(
          t('cardAssigned'),
          t('cardAssignedMessage', { cardNumber: card.cardNumber })
        );
      } else {
        Alert.alert(
          t('error'),
          t('cardNotFound') || 'Tarjeta no encontrada. Verifique que el QR sea válido.'
        );
      }
    } catch (error: any) {
      console.error('❌ Error al leer tarjeta:', error);
      Alert.alert(
        t('error'),
        t('cardReadingError') || 'Error al leer la tarjeta. Intente nuevamente.'
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanCard = () => {
    if (disabled) return;
    setShowScanner(true);
  };

  const DEFAULT_CAMERA_FACING: CameraType = 'back';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CreditCard size={20} color={colors.primary[600]} />
        <Text style={styles.title}>{t('physicalCard')}</Text>
        {(assignedCard || noCardSelected) && (
          <TouchableOpacity onPress={handleClearSelection} style={styles.clearButton}>
            <X size={16} color={colors.darkGrey} />
          </TouchableOpacity>
        )}
      </View>

      {assignedCard ? (
        // Mostrar tarjeta asignada
        <View style={styles.assignedCardContainer}>
          <View style={styles.assignedCard}>
            <View style={styles.assignedCardHeader}>
              <Check size={20} color={colors.success[600]} />
              <Text style={styles.assignedCardTitle}>{t('cardAssigned')}</Text>
            </View>
            <Text style={styles.assignedCardNumber}>
              {assignedCard.cardNumber}
            </Text>
            <Text style={styles.assignedCardInstructions}>
              {t('findPhysicalCard')}
            </Text>
            <TouchableOpacity
              style={styles.changeCardButton}
              onPress={handleChangeCard}
              disabled={disabled}
            >
              <RefreshCw size={16} color={colors.primary[600]} />
              <Text style={styles.changeCardButtonText}>{t('changeCard')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : noCardSelected ? (
        // Mostrar que no se lleva tarjeta
        <View style={styles.noCardContainer}>
          <View style={styles.noCard}>
            <View style={styles.noCardHeader}>
              <Smartphone size={20} color={colors.primary[600]} />
              <Text style={styles.noCardTitle}>{t('digitalQROnly')}</Text>
            </View>
            <Text style={styles.noCardInstructions}>
              {t('digitalQRInstructions')}
            </Text>
            <TouchableOpacity
              style={styles.expandPhysicalButton}
              onPress={handleOpenPhysicalOptions}
              disabled={disabled}
            >
              <CreditCard size={18} color={colors.primary[600]} />
              <Text style={styles.expandPhysicalButtonText}>
                {t('usePhysicalCardOption')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[
              styles.scanButton,
              (disabled || isScanning) && styles.buttonDisabled,
            ]}
            onPress={handleScanCard}
            disabled={disabled || isScanning}
          >
            <Scan size={20} color={colors.white} />
            <Text style={styles.scanButtonText}>
              {t('scanCard') || 'Escanear Tarjeta'}
            </Text>
          </TouchableOpacity>

          <View style={styles.cardActionsRow}>
            <TouchableOpacity
              style={[
                styles.assignButton,
                (disabled || isAssigning) && styles.buttonDisabled,
              ]}
              onPress={handleAssignCard}
              disabled={disabled || isAssigning}
            >
              <CreditCard size={20} color={colors.white} />
              <Text style={styles.assignButtonText}>
                {isAssigning ? t('assigning') : t('assignCard')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.noCardButton}
              onPress={handleNoCard}
              disabled={disabled}
            >
              <Smartphone size={20} color={colors.primary[600]} />
              <Text style={styles.noCardButtonText}>
                {t('noPhysicalCard')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modal de escáner QR */}
      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>
              {t('scanPhysicalCard') || 'Escanear Tarjeta Física'}
            </Text>
            <TouchableOpacity
              onPress={() => setShowScanner(false)}
              style={styles.scannerCloseButton}
            >
              <X size={24} color={colors.white} />
            </TouchableOpacity>
          </View>

          {hasPermission === null ? (
            <View style={styles.scannerLoading}>
              <ActivityIndicator size="large" color={colors.white} />
              <Text style={styles.scannerLoadingText}>
                {t('requestingCameraPermission') || 'Solicitando permiso de cámara...'}
              </Text>
            </View>
          ) : hasPermission === false ? (
            <View style={styles.scannerError}>
              <Text style={styles.scannerErrorText}>
                {t('cameraPermissionDenied') || 'Se necesita permiso de cámara para escanear la tarjeta'}
              </Text>
              <TouchableOpacity
                style={styles.scannerErrorButton}
                onPress={() => setShowScanner(false)}
              >
                <Text style={styles.scannerErrorButtonText}>
                  {t('close') || 'Cerrar'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cameraContainer}>
              <View style={styles.cameraWrapper}>
                <CameraView
                  style={styles.camera}
                  facing={DEFAULT_CAMERA_FACING}
                  onBarcodeScanned={handleBarCodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                />
                <View pointerEvents="none" style={styles.scannerOverlay}>
                  <View style={styles.scannerFrame} />
                  <Text style={styles.scannerInstruction}>
                    {t('pointAtCardQR') || 'Apunte la cámara al código QR de la tarjeta física'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>

      <CardSelectorModal
        visible={showCardSelector}
        onClose={() => setShowCardSelector(false)}
        onCardSelected={handleCardSelected}
        establishmentId={establishmentId}
        currentCard={assignedCard}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.black,
    flex: 1,
  },
  clearButton: {
    padding: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.ligthGrey,
  },
  buttonsContainer: {
    gap: 12,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  scanButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning[600],
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: borderRadius.lg,
    gap: 8,
    marginBottom: 8,
  },
  scanButtonText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  assignButton: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: borderRadius.lg,
    gap: 8,
  },
  assignButtonText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  noCardButton: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary[200],
    gap: 8,
  },
  noCardButtonSelected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  noCardButtonText: {
    color: colors.primary[600],
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  noCardButtonTextSelected: {
    color: colors.white,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  assignedCardContainer: {
    backgroundColor: colors.success[50],
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.success[200],
  },
  assignedCard: {
    gap: 8,
  },
  assignedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  assignedCardTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.success[700],
  },
  assignedCardNumber: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.success[800],
    fontFamily: 'monospace',
  },
  assignedCardInstructions: {
    fontSize: typography.sizes.sm,
    color: colors.success[600],
    lineHeight: 18,
  },
  changeCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary[200],
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  changeCardButtonText: {
    color: colors.primary[600],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  noCardContainer: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.primary[200],
  },
  noCard: {
    gap: 8,
  },
  noCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noCardTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.primary[700],
  },
  noCardInstructions: {
    fontSize: typography.sizes.sm,
    color: colors.primary[600],
    lineHeight: 18,
  },
  expandPhysicalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary[300],
    backgroundColor: colors.white,
  },
  expandPhysicalButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.primary[700],
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: colors.black,
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.black,
    paddingTop: 50,
  },
  scannerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  scannerCloseButton: {
    padding: spacing.sm,
  },
  scannerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  scannerLoadingText: {
    color: colors.white,
    fontSize: typography.sizes.base,
  },
  scannerError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  scannerErrorText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    textAlign: 'center',
  },
  scannerErrorButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  scannerErrorButtonText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  cameraWrapper: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: colors.primary[600],
    borderRadius: borderRadius.md,
    backgroundColor: 'transparent',
  },
  scannerInstruction: {
    marginTop: spacing.xl,
    color: colors.white,
    fontSize: typography.sizes.base,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
});
