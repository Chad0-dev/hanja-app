import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function TabTwoScreen() {
  return (
    <ThemedView className="flex-1 justify-center items-center p-5">
      <ThemedText type="title" className="text-center mb-6">
        탐색
      </ThemedText>
      <ThemedText className="text-base text-center leading-6">
        한자 학습을 위한 탐색 페이지입니다.
      </ThemedText>
      <ThemedText className="text-sm text-gray-500 text-center mt-4">
        곧 다양한 학습 기능들이 추가될 예정입니다! ✨
      </ThemedText>
    </ThemedView>
  );
}
