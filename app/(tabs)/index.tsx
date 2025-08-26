import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function HomeScreen() {
  return (
    <ThemedView className="flex-1 justify-center items-center p-5">
      <ThemedText type="title" className="text-center mb-4">
        한자 앱 입니다
      </ThemedText>
      <ThemedText className="text-lg text-gray-600 text-center">
        한자 학습을 시작해보세요! 🇰🇷
      </ThemedText>
    </ThemedView>
  );
}
