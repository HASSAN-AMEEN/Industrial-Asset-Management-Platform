/**
  * IronTrack - Industrial Equipment Management
  * React Native Application Entry Point
  */
 
 import React from 'react';
 import { StatusBar } from 'react-native';
 import { SafeAreaProvider } from 'react-native-safe-area-context';
 import { Provider as PaperProvider, MD3DarkTheme } from 'react-native-paper';
 import { AppNavigator } from './src/navigation';
 import { Colors, PaperTheme } from './src/utils/theme';
import { AuthProvider } from './src/store/AuthContext';
import { DrawerProvider } from './src/store/DrawerContext';
 
 // Combine Paper theme with custom theme
 const theme = {
   ...MD3DarkTheme,
   colors: {
     ...MD3DarkTheme.colors,
     ...PaperTheme.colors,
   },
   roundness: PaperTheme.roundness,
 };
 
 const App = () => {
   return (
     <SafeAreaProvider>
       <PaperProvider theme={theme}>
        <AuthProvider>
          <DrawerProvider>
            <StatusBar
              barStyle="light-content"
              backgroundColor={Colors.background}
              translucent={false}
            />
            <AppNavigator />
          </DrawerProvider>
        </AuthProvider>
       </PaperProvider>
     </SafeAreaProvider>
   );
 };
 
 export default App;
