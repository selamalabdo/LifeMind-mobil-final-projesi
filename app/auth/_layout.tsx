import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Login ve Register sayfalarını burada tanımlıyoruz */}
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}