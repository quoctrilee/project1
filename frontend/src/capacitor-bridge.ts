import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Network } from '@capacitor/network';

export interface SurveyLocation { latitude: number | null; longitude: number | null; locationAccuracy: number | null; }
export async function takePhoto(): Promise<string | null> {
  try { const photo = await Camera.getPhoto({ resultType: CameraResultType.Base64, quality: 70, source: CameraSource.Camera }); return photo.base64String ?? null; }
  catch (error) { console.warn('Photo unavailable', error); return null; }
}
export async function getNetworkStatus() { return Capacitor.isNativePlatform() ? Network.getStatus() : { connected: navigator.onLine, connectionType: 'browser' }; }
export async function listenNetworkChanges(onChange: (connected: boolean) => void) {
  if (Capacitor.isNativePlatform()) await Network.addListener('networkStatusChange', status => onChange(status.connected));
  else window.addEventListener('online', () => onChange(true));
  if (!Capacitor.isNativePlatform()) window.addEventListener('offline', () => onChange(false));
}
export async function getCurrentLocation(): Promise<SurveyLocation> {
  try { const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 }); return { latitude: position.coords.latitude, longitude: position.coords.longitude, locationAccuracy: position.coords.accuracy }; }
  catch (error) { console.warn('Location unavailable; submitting without coordinates', error); return { latitude: null, longitude: null, locationAccuracy: null }; }
}