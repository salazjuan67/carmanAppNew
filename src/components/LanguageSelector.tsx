import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Globe, Check } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../config/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../config/translations';

export const LanguageSelector: React.FC = () => {
  const { language, changeLanguage, t } = useLanguage();
  const [showModal, setShowModal] = useState(false);

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
  ];

  const handleLanguageChange = (newLanguage: Language) => {
    changeLanguage(newLanguage);
    setShowModal(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setShowModal(true)}
      >
        <Globe size={20} color="white" />
      </TouchableOpacity>

      <Modal
        transparent
        animationType="fade"
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('selectLanguage')}</Text>
            
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  language === lang.code && styles.selectedOption
                ]}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <Text style={styles.flag}>{lang.flag}</Text>
                <Text style={[
                  styles.languageName,
                  language === lang.code && styles.selectedText
                ]}>
                  {lang.name}
                </Text>
                {language === lang.code && (
                  <Check size={20} color={colors.darkBlue} />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.closeButtonText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selectorButton: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.md,
    padding: 0,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    margin: spacing.lg,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.darkBlue,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.ligthGrey,
  },
  selectedOption: {
    backgroundColor: colors.greyBackground,
    borderColor: colors.darkBlue,
  },
  flag: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  languageName: {
    flex: 1,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.darkGrey,
  },
  selectedText: {
    color: colors.darkBlue,
    fontWeight: typography.weights.bold,
  },
  closeButton: {
    backgroundColor: colors.darkBlue,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  closeButtonText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
});
