import React from 'react';
import { Dimensions, ImageBackground, StyleSheet } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function QuizScreen() {
  return (
    <ImageBackground
      source={require('@/assets/images/backgraund3.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    ></ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
  },
});
