import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import * as Speech from 'expo-speech';
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
  const [showSparkles, setShowSparkles] = useState(false);
  const [boxLayouts, setBoxLayouts] = useState([]);
  const [debugInfo, setDebugInfo] = useState('Drag circle to matching box!');

  const pan = useRef(new Animated.ValueXY()).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const starAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const currentColorIndexRef = useRef(0);

  const speakColor = (colorName) => {
    try {
      console.log('🔊 Attempting to speak:', colorName);
      
      Speech.speak(colorName, {
        language: 'en-US',
        pitch: 1.3,
        rate: 0.75,
        volume: 1.0,
      });
      
      console.log('✓ Speech initiated for:', colorName);
    } catch (error) {
      console.log('⚠ Speech not available (web platform)');
      console.log('🎨 COLOR MATCHED:', colorName.toUpperCase(), '🎨');
    }
  };

  const checkCollision = (circleCenterX, circleCenterY) => {
    // Use ref to get the ACTUAL current color index (not closure value)
    const colorIndex = currentColorIndexRef.current;
    const currentColor = COLORS[colorIndex];
    
    console.log('Checking collision - colorIndex from ref:', colorIndex, 'color:', currentColor.name);
    setDebugInfo(`Need: ${currentColor.name.toUpperCase()}`);
    
    // Check if circle is in the bottom area (below 60% of screen height)
    const bottomThreshold = height * 0.6;
    
    if (circleCenterY < bottomThreshold) {
      setDebugInfo(`Not in bottom area - try again!`);
      return false;
    }
    
    // Circle is in bottom area - determine which box by X position
    const boxWidth = width / 4;
    
    // Find which section the circle is in
    let selectedBoxIndex = Math.floor(circleCenterX / boxWidth);
    
    // Clamp to valid range (0-3)
    selectedBoxIndex = Math.max(0, Math.min(3, selectedBoxIndex));
    
    const selectedColor = COLORS[selectedBoxIndex];
    
    console.log('Selected box:', selectedBoxIndex, selectedColor.name, '| Need:', currentColor.name);
    setDebugInfo(`You dropped on: ${selectedColor.name.toUpperCase()}`);
    
    if (selectedColor.name === currentColor.name) {
      setDebugInfo(`✓ MATCH! ${currentColor.name.toUpperCase()}!`);
      return true;
    } else {
      setDebugInfo(`✗ Wrong! Need ${currentColor.name.toUpperCase()}, got ${selectedColor.name.toUpperCase()}`);
      return false;
    }
  };

  const handleCorrectMatch = () => {
    try {
      console.log('✓✓✓ CELEBRATION STARTING ✓✓✓');
      console.log('Current color index:', currentColorIndex);
      console.log('Current color:', COLORS[currentColorIndex].name);
      
      // Show sparkles
      setShowSparkles(true);
      console.log('✓ Sparkles enabled');
      
      // Sparkle animation
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowSparkles(false);
        console.log('✓ Sparkle animation complete');
      });

      // Star animation
      Animated.sequence([
        Animated.spring(starAnim, {
          toValue: 1.4,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(starAnim, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start(() => {
        console.log('✓ Star animation complete');
      });

      // Speak the color name
      const colorToSpeak = COLORS[currentColorIndex].displayName;
      console.log('✓ Speaking color:', colorToSpeak);
      speakColor(colorToSpeak);

      // Increment stars
      setStars((prev) => {
        const newStars = prev + 1;
        console.log('✓ Stars increased from', prev, 'to', newStars);
        return newStars;
      });

      // Reset position and move to next color
      setTimeout(() => {
        console.log('✓ Resetting for next color...');
        console.log('  Resetting pan to (0, 0)');
        
        // IMPORTANT: Reset both value AND offset
        pan.flattenOffset();
        pan.setValue({ x: 0, y: 0 });
        pan.setOffset({ x: 0, y: 0 });
        
        console.log('  Resetting scale to 1');
        scaleAnim.setValue(1);
        
        setCurrentColorIndex((prev) => {
          const nextIndex = (prev + 1) % COLORS.length;
          console.log('  Changing color from index', prev, '(' + COLORS[prev].name + ') to index', nextIndex, '(' + COLORS[nextIndex].name + ')');
          
          // Update the ref immediately so checkCollision uses the new value
          currentColorIndexRef.current = nextIndex;
          
          setDebugInfo(`Now match: ${COLORS[nextIndex].displayName}!`);
          return nextIndex;
        });
        
        console.log('✓ Reset complete - new color should appear');
      }, 1000);
      
      console.log('✓✓✓ CELEBRATION SETUP COMPLETE ✓✓✓');
    } catch (error) {
      console.error('❌ ERROR in handleCorrectMatch:', error);
      console.error('Error details:', error.message, error.stack);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: () => {
        console.log('Pan started');
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
        
        Animated.spring(scaleAnim, {
          toValue: 1.15,
          useNativeDriver: true,
        }).start();
      },

      onPanResponderMove: (evt, gestureState) => {
        pan.setValue({
          x: gestureState.dx,
          y: gestureState.dy,
        });
      },

      onPanResponderRelease: (evt, gestureState) => {
        console.log('===== DRAG RELEASED =====');
        console.log('Touch point:', evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        console.log('Gesture delta:', gestureState.dx, gestureState.dy);
        
        pan.flattenOffset();

        // Calculate the circle's final position
        const initialCircleTop = height * 0.22 + CIRCLE_SIZE / 2;
        const initialCircleLeft = width / 2;
        
        const finalCircleCenterX = initialCircleLeft + gestureState.dx;
        const finalCircleCenterY = initialCircleTop + gestureState.dy;
        
        console.log('Initial circle position:', { x: initialCircleLeft, y: initialCircleTop });
        console.log('Final circle center:', { x: finalCircleCenterX, y: finalCircleCenterY });
        console.log('Screen dimensions:', { width, height });
        console.log('Current color to match:', COLORS[currentColorIndex].name);

        const isMatch = checkCollision(finalCircleCenterX, finalCircleCenterY);

        if (isMatch) {
          // Correct match!
          console.log('✓✓✓ MATCH CONFIRMED - Triggering celebration ✓✓✓');
          handleCorrectMatch();
        } else {
          // Bounce back
          console.log('✗ No match - bouncing back');
          Animated.parallel([
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              friction: 6,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const onBoxLayout = (index, colorName) => (event) => {
    // Calculate box positions based on screen dimensions
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const bottomOffset = Platform.OS === 'ios' ? 100 : 80;
    
    // Calculate horizontal position - evenly spaced
    const totalPadding = 30; // 15px on each side
    const availableWidth = screenWidth - totalPadding;
    const spacing = (availableWidth - (BOX_SIZE * 4)) / 3; // space between boxes
    const startX = 15 + (BOX_SIZE / 2); // center of first box
    
    const boxCenterX = startX + (index * (BOX_SIZE + spacing));
    const boxCenterY = screenHeight - bottomOffset - (BOX_SIZE / 2);
    
    console.log(`Box ${colorName} center at: (${boxCenterX}, ${boxCenterY})`);
    
    setBoxLayouts((prev) => {
      const newLayouts = [...prev];
      newLayouts[index] = {
        color: colorName,
        x: boxCenterX - (BOX_SIZE / 2), // top-left x
        y: boxCenterY - (BOX_SIZE / 2), // top-left y
        centerX: boxCenterX,
        centerY: boxCenterY,
        width: BOX_SIZE,
        height: BOX_SIZE,
      };
      return newLayouts;
    });
  };

  const currentColor = COLORS[currentColorIndex];
  
  console.log('Rendering circle with color:', currentColor.name, currentColor.value);

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        {/* Star Counter */}
        <View style={styles.starContainer}>
          <Animated.View style={{ transform: [{ scale: starAnim }] }}>
            <MaterialCommunityIcons name="star" size={50} color="#FFD700" />
          </Animated.View>
          <Text style={styles.starText}>{stars}</Text>
        </View>

        {/* Draggable Circle */}
        <View style={styles.circleContainer}>
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.circle,
              {
                backgroundColor: currentColor.value,
                transform: [
                  { translateX: pan.x },
                  { translateY: pan.y },
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
                          outputRange: [0.5, 2],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <MaterialCommunityIcons name="star-four-points" size={80} color="#FFD700" />
                <MaterialCommunityIcons name="star-four-points" size={50} color="#FFF" style={styles.sparkle1} />
                <MaterialCommunityIcons name="star-four-points" size={50} color="#FFF" style={styles.sparkle2} />
                <MaterialCommunityIcons name="star-four-points" size={50} color="#FFF" style={styles.sparkle3} />
              </Animated.View>
            )}
          </Animated.View>
        </View>

        {/* Instruction Text */}
        <Text style={styles.instructionText}>Drag the circle to matching color!</Text>
        
        {/* Debug Info */}
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>{debugInfo}</Text>
        </View>

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
    </View>
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
    top: Platform.OS === 'ios' ? 60 : 50,
    right: 30,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
    zIndex: 1000,
  },
  starText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FF6347',
    marginLeft: 12,
  },
  circleContainer: {
    position: 'absolute',
    top: height * 0.22,
    left: width / 2 - CIRCLE_SIZE / 2,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    zIndex: 100,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 15,
    borderWidth: 6,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: CIRCLE_SIZE * 2,
    height: CIRCLE_SIZE * 2,
  },
  sparkle1: {
    position: 'absolute',
    top: -30,
    right: -20,
  },
  sparkle2: {
    position: 'absolute',
    bottom: -30,
    left: -20,
  },
  sparkle3: {
    position: 'absolute',
    top: -20,
    left: -30,
  },
  instructionText: {
    position: 'absolute',
    top: height * 0.48,
    width: '100%',
    textAlign: 'center',
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  debugContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 140 : 120,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  debugText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF1493',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  boxesContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 15,
  },
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 6,
    borderColor: '#FFF',
  },
});
