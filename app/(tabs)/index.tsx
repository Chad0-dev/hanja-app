import { Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 16,
          color: 'black',
        }}
      >
        한자 앱 입니다
      </Text>
      <Text
        style={{
          fontSize: 18,
          color: '#666666',
          textAlign: 'center',
        }}
      >
        한자 학습을 시작해보세요! 🇰🇷
      </Text>
    </View>
  );
}
