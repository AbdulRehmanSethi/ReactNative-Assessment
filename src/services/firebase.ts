import firebase from '@react-native-firebase/app';

export function logFirebaseInit(): void {
  try {
    const app = firebase.app();
    console.log(`[Firebase] app initialized: "${app.name}" (projectId: ${app.options.projectId})`);
  } catch (err) {
    console.warn(
      '[Firebase] no app initialized — check google-services.json / GoogleService-Info.plist are present and the dev client was rebuilt',
      err
    );
  }
}
