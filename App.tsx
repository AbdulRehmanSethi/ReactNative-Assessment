import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { store, persistor } from '~/redux/store';
import { ThemeProvider, useTheme } from '~/theme';
import RootNavigator from '~/navigation';
import Splash from '~/screens/Splash';
import { logFirebaseInit } from '~/services/firebase';

function AppContent() {
  const theme = useTheme();

  useEffect(() => {
    logFirebaseInit();
  }, []);

  return (
    <>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <ThemeProvider>
          <PersistGate loading={<Splash />} persistor={persistor}>
            <SafeAreaProvider>
              <AppContent />
            </SafeAreaProvider>
          </PersistGate>
        </ThemeProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
