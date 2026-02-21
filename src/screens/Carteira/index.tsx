import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg'; // Precisa instalar: npx expo install react-native-svg react-native-qrcode-svg
import { supabase } from '../../lib/supabase';

export default function Carteira() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Identidade Digital</Text>
      <Text style={styles.sub}>Apresente este código na sede da Capitania</Text>
      
      <View style={styles.qrContainer}>
        {user?.id && (
          <QRCode
            value={user.id}
            size={200}
            color="black"
            backgroundColor="white"
          />
        )}
      </View>
      
      <Text style={styles.idText}>ID: {user?.id.slice(0, 8).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  title: { color: '#D4AF37', fontSize: 24, fontWeight: '900' },
  sub: { color: '#888', marginTop: 10, marginBottom: 40 },
  qrContainer: { padding: 20, backgroundColor: '#FFF', borderRadius: 20 },
  idText: { color: '#FFF', marginTop: 20, fontWeight: 'bold', letterSpacing: 2 }
});