import { Audio } from 'expo-av';
import { Platform } from 'react-native';

class SoundService {
  private static instance: SoundService;
  private soundObject: Audio.Sound | null = null;
  private isInitialized = false;

  static getInstance(): SoundService {
    if (!SoundService.instance) {
      SoundService.instance = new SoundService();
    }
    return SoundService.instance;
  }

  /**
   * Initialize audio mode for iOS/Android
   * Critical for iOS - must be set before playing any sounds
   */
  private async initializeAudio(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Simplified audio mode configuration
      const audioConfig: any = {
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true, // Critical for iOS - allows sound in silent mode
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      };

      // Add interruption mode only if available
      if (Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX !== undefined) {
        audioConfig.interruptionModeIOS = Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX;
      }

      await Audio.setAudioModeAsync(audioConfig);
      this.isInitialized = true;
      console.log('🔊 Audio mode initialized');
    } catch (error: any) {
      // Silently handle initialization errors - audio might already be configured
      // or some platforms might not need explicit initialization
      // Only log if it's not a common/normal error
      if (error?.message && !error.message.includes('already')) {
        console.log('ℹ️ Audio mode initialization:', error.message);
      }
      this.isInitialized = true; // Mark as initialized to avoid repeated attempts
    }
  }

  /**
   * Sonido in-app cuando el ingreso pasa a estado de atención (EN LA PUERTA / SOLICITADO vía polling).
   * Con la app cerrada hace falta sonido en el payload push (Android: mismo channelId que en constants).
   * Uses expo-av with local sound file or generated sound
   * Plays the sound multiple times for better noticeability
   */
  async playNotificationSound(): Promise<void> {
    try {
      // Initialize audio mode first (critical for iOS)
      await this.initializeAudio();

      // Play sound 3 times with small delays between for better noticeability
      const repetitions = 3;
      const delayBetween = 150; // 150ms delay between beeps

      for (let i = 0; i < repetitions; i++) {
        // Wait before each repetition (except the first)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, delayBetween));
        }

        // Unload previous sound if exists
        if (this.soundObject) {
          try {
            await this.soundObject.unloadAsync();
          } catch (e) {
            // Ignore unload errors
          }
          this.soundObject = null;
        }

        // Try to load local sound file first, if available
        let soundSource;
        try {
          // Try to require a local sound file
          // If file doesn't exist, this will throw and we'll use generated sound
          soundSource = require('../../assets/sounds/notification.mp3');
        } catch (e) {
          // If local file doesn't exist, create a sound programmatically
          if (i === 0) {
            console.log('📁 Local sound file not found, generating alert chirp sound');
          }
          soundSource = this.createBeepSound();
        }

        // Create and play sound at maximum volume for better alert visibility
        const { sound } = await Audio.Sound.createAsync(
          soundSource,
          {
            shouldPlay: true,
            volume: 1.0, // Maximum volume for stronger, more noticeable alerts
            isLooping: false,
            isMuted: false,
          }
        );

        this.soundObject = sound;

        // Wait for sound to finish playing before next iteration
        await new Promise<void>((resolve) => {
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              sound.unloadAsync().catch(() => {});
              this.soundObject = null;
              resolve();
            }
          });
        });
      }

      console.log(`🔊 Notification sound played ${repetitions} times`);
    } catch (error) {
      console.error('❌ Error playing notification sound:', error);
      // Fail silently - don't interrupt the notification flow
    }
  }

  /**
   * Create an alert sound programmatically
   * This is used as fallback if no local sound file exists
   * Creates a distinctive ascending chirp alert sound
   */
  private createBeepSound(): { uri: string } {
    // Generate a distinctive ascending chirp alert sound
    // Creates a rising tone pattern that's more attention-grabbing
    const sampleRate = 44100;
    const duration = 0.4; // Duration for the chirp
    const samples = Math.floor(sampleRate * duration);
    
    // Create WAV file buffer
    const buffer = new ArrayBuffer(44 + samples * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples * 2, true);
    
    // Generate ascending chirp sound (rising frequency)
    // Start at 600Hz and rise to 1200Hz for a distinctive alert sound
    const startFreq = 600;
    const endFreq = 1200;
    
    for (let i = 0; i < samples; i++) {
      const progress = i / samples; // 0 to 1
      
      // Create ascending frequency (chirp effect)
      const currentFreq = startFreq + (endFreq - startFreq) * progress;
      
      // Create envelope: quick attack, sustain, then fade out
      let envelope = 1.0;
      if (progress < 0.1) {
        // Quick attack (10% of duration)
        envelope = progress / 0.1;
      } else if (progress > 0.7) {
        // Fade out in last 30%
        envelope = (1.0 - progress) / 0.3;
      }
      
      // Generate sine wave with ascending frequency and envelope
      const sample = Math.sin(2 * Math.PI * currentFreq * i / sampleRate);
      const intSample = Math.max(-1, Math.min(1, sample * envelope));
      
      // Maximum volume for strong, noticeable alerts
      view.setInt16(44 + i * 2, intSample * 0x7FFF * 1.0, true);
    }
    
    // Convert to base64 data URI
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    // Use Buffer if available (Node.js environment) or polyfill
    let base64: string;
    if (typeof Buffer !== 'undefined') {
      base64 = Buffer.from(bytes).toString('base64');
    } else {
      // Fallback: try to use btoa or create base64 manually
      try {
        base64 = btoa(binary);
      } catch (e) {
        // If btoa doesn't work, use a simple workaround
        // Create a minimal valid WAV and encode it
        base64 = this.simpleBase64Encode(bytes);
      }
    }
    
    return { uri: `data:audio/wav;base64,${base64}` };
  }

  /**
   * Simple base64 encoding fallback
   */
  private simpleBase64Encode(bytes: Uint8Array): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    
    while (i < bytes.length) {
      const a = bytes[i++];
      const b = i < bytes.length ? bytes[i++] : 0;
      const c = i < bytes.length ? bytes[i++] : 0;
      
      const bitmap = (a << 16) | (b << 8) | c;
      result += chars.charAt((bitmap >> 18) & 63);
      result += chars.charAt((bitmap >> 12) & 63);
      result += i - 2 < bytes.length ? chars.charAt((bitmap >> 6) & 63) : '=';
      result += i - 1 < bytes.length ? chars.charAt(bitmap & 63) : '=';
    }
    
    return result;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.soundObject) {
        await this.soundObject.unloadAsync();
        this.soundObject = null;
      }
      this.isInitialized = false;
    } catch (error) {
      console.error('❌ Error cleaning up sound service:', error);
    }
  }
}

export const soundService = SoundService.getInstance();

