import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';
import { testAPI } from './src/services/api';

/**
 * Main App component
 * Tests API connectivity on app startup
 */

export default function App() {
  useEffect(() => {
    // Test API connection when app starts
    testAPI()
      .then((response) => {
        console.log('API Test Response:', response.data);
      })
      .catch((error) => {
        console.error('API Test Error:', error);
      });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mobile App</Text>
      <Text style={styles.subtitle}>Check console for API test results</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
