import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const COLORS = [
  { name: 'red', value: '#FF3B30', displayName: 'Red' },
  { name: 'blue', value: '#007AFF', displayName: 'Blue' },
  { name: 'green', value: '#34C759', displayName: 'Green' },
  { name: 'yellow', value: '#FFCC00', displayName: 'Yellow' },
];

const CIRCLE_SIZE = 120;
const BOX_SIZE = 90;

export default function ColorMatchingGame() {
  const [currentColorIndex, setCurrentColorIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const starAnim = useRef(new Animated.Value(1)).current;

  const circleStartPosition = useRef({ x: 0, y: 0 });
  const boxPositions = useRef([]);

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
    } catch (error) {
      console.log('Audio setup error:', error);
    }
  };

  useEffect(() => {
    setupAudio();
  }, []);

  const speakColor = (colorName) => {
    const options = {
      language: 'en-US',
      pitch: 1.2,
      rate: 0.8,
    };
    Speech.speak(colorName, options);
  };

  const handleGestureEvent = (event) => {
    if (!dragging) return;
    
    const { translationX, translationY } = event.nativeEvent;
    translateX.setValue(translationX);
    translateY.setValue(translationY);
  };

  const handleGestureStateChange = (event) => {
    const { state, translationX, translationY } = event.nativeEvent;

    if (state === 5) { // ENDED
      setDragging(false);
      
      // Calculate final position
      const finalX = circleStartPosition.current.x + translationX;
      const finalY = circleStartPosition.current.y + translationY;

      // Check collision with boxes
      let matched = false;
      const currentColor = COLORS[currentColorIndex];

      boxPositions.current.forEach((box) => {
        const circleCenter = {
          x: finalX + CIRCLE_SIZE / 2,
          y: finalY + CIRCLE_SIZE / 2,
        };

        if (
          circleCenter.x >= box.x &&
          circleCenter.x <= box.x + box.width &&
          circleCenter.y >= box.y &&
          circleCenter.y <= box.y + box.height &&
          box.color === currentColor.name
        ) {
          matched = true;
        }
      });

      if (matched) {
        // Correct match!
        handleCorrectMatch();
      } else {
        // Wrong or no match - bounce back
        bounceBack();
      }
    } else if (state === 4) { // BEGAN
      setDragging(true);
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleCorrectMatch = () => {
    // Play sparkle animation
    setShowSparkles(true);
    Animated.sequence([
      Animated.timing(sparkleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(sparkleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSparkles(false);
    });

    // Animate star
    Animated.sequence([
      Animated.spring(starAnim, {
        toValue: 1.3,
        useNativeDriver: true,
      }),
      Animated.spring(starAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    // Speak color name
    speakColor(COLORS[currentColorIndex].displayName);

    // Add star
    setStars(stars + 1);

    // Reset and show next color
    setTimeout(() => {
      resetCircle();
      setCurrentColorIndex((currentColorIndex + 1) % COLORS.length);
    }, 800);
  };

  const bounceBack = () => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        friction: 5,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 5,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const resetCircle = () => {
    translateX.setValue(0);
    translateY.setValue(0);
    scaleAnim.setValue(1);
  };

  const onCircleLayout = (event) => {
    const { x, y } = event.nativeEvent.layout;
    circleStartPosition.current = { x, y };
  };

  const onBoxLayout = (index, color) => (event) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    boxPositions.current[index] = { x, y, width, height, color };
  };

  const currentColor = COLORS[currentColorIndex];

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.background}>
        {/* Star Counter */}
        <View style={styles.starContainer}>
          <Animated.View style={{ transform: [{ scale: starAnim }] }}>
            <MaterialCommunityIcons name="star" size={50} color="#FFD700" />
          </Animated.View>
          <Text style={styles.starText}>{stars}</Text>
        </View>

        {/* Draggable Circle */}
        <View style={styles.circleContainer} onLayout={onCircleLayout}>
          <PanGestureHandler
            onGestureEvent={handleGestureEvent}
            onHandlerStateChange={handleGestureStateChange}
          >
            <Animated.View
              style={[
                styles.circle,
                {
                  backgroundColor: currentColor.value,
                  transform: [
                    { translateX },
                    { translateY },
                    { scale: scaleAnim },
                  ],
                },
              ]}
            >
              {showSparkles && (
                <Animated.View
                  style={[
                    styles.sparkleContainer,
                    {
                      opacity: sparkleAnim,
                      transform: [
                        {
                          scale: sparkleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.5, 1.5],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <MaterialCommunityIcons name="star-four-points" size={60} color="#FFD700" />
                  <MaterialCommunityIcons name="star-four-points" size={40} color="#FFF" style={styles.sparkle1} />
                  <MaterialCommunityIcons name="star-four-points" size={40} color="#FFF" style={styles.sparkle2} />
                  <MaterialCommunityIcons name="star-four-points" size={40} color="#FFF" style={styles.sparkle3} />
                </Animated.View>
              )}
            </Animated.View>
          </PanGestureHandler>
        </View>

        {/* Instruction Text */}
        <Text style={styles.instructionText}>Drag to matching color! 🎨</Text>

        {/* Color Boxes */}
        <View style={styles.boxesContainer}>
          {COLORS.map((color, index) => (
            <View
              key={color.name}
              style={[styles.box, { backgroundColor: color.value }]}
              onLayout={onBoxLayout(index, color.name)}
            />
          ))}
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  starContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 30,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 1000,
  },
  starText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6347',
    marginLeft: 10,
  },
  circleContainer: {
    position: 'absolute',
    top: height * 0.25,
    left: width / 2 - CIRCLE_SIZE / 2,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 5,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
  },
  sparkle1: {
    position: 'absolute',
    top: -20,
    right: -10,
  },
  sparkle2: {
    position: 'absolute',
    bottom: -20,
    left: -10,
  },
  sparkle3: {
    position: 'absolute',
    top: -10,
    left: -20,
  },
  instructionText: {
    position: 'absolute',
    top: height * 0.5,
    width: '100%',
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  boxesContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 80 : 60,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 20,
  },
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 5,
    borderColor: '#FFF',
  },
});
