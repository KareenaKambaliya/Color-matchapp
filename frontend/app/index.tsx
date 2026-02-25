import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Platform,
  TouchableOpacity,
} from 'react-native';
import * as Speech from 'expo-speech';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const COLORS = [
  { name: 'red', value: '#FF3B30', displayName: 'Red' },
  { name: 'blue', value: '#007AFF', displayName: 'Blue' },
  { name: 'green', value: '#34C759', displayName: 'Green' },
  { name: 'yellow', value: '#FFCC00', displayName: 'Yellow' },
  { name: 'orange', value: '#FF9500', displayName: 'Orange' },
  { name: 'purple', value: '#AF52DE', displayName: 'Purple' },
  { name: 'pink', value: '#FF2D55', displayName: 'Pink' },
  { name: 'cyan', value: '#5AC8FA', displayName: 'Cyan' },
];

// Level configurations
const LEVELS = [
  { number: 1, colors: ['red', 'blue', 'green'], name: 'Easy Peasy' },
  { number: 2, colors: ['red', 'blue', 'green', 'yellow'], name: 'Getting Good' },
  { number: 3, colors: ['orange', 'purple', 'pink', 'cyan'], name: 'New Colors' },
  { number: 4, colors: ['red', 'green', 'purple', 'orange', 'cyan'], name: 'Color Mix' },
  { number: 5, colors: ['red', 'blue', 'yellow', 'purple', 'pink', 'orange'], name: 'Master Level' },
];

const CIRCLE_SIZE = 120;
const BOX_SIZE = 80;

export default function ColorMatchingGame() {
  const [currentColorIndex, setCurrentColorIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [lifetimeStars, setLifetimeStars] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [matchedColors, setMatchedColors] = useState([]);
  const [showSparkles, setShowSparkles] = useState(false);
  const [debugInfo, setDebugInfo] = useState('Match colors to advance!');
  const [showVictory, setShowVictory] = useState(false);

  const pan = useRef(new Animated.ValueXY()).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const starAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const currentColorIndexRef = useRef(0);
  const currentLevelRef = useRef(0);

  // Get current level colors
  const levelColors = LEVELS[currentLevel].colors.map(colorName => 
    COLORS.find(c => c.name === colorName)
  );

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
    const colorIndex = currentColorIndexRef.current;
    const currentColor = levelColors[colorIndex];
    
    console.log('Checking collision - colorIndex from ref:', colorIndex, 'color:', currentColor.name);
    setDebugInfo(`Need: ${currentColor.displayName.toUpperCase()}`);
    
    const bottomThreshold = height * 0.6;
    
    if (circleCenterY < bottomThreshold) {
      setDebugInfo(`Drag to bottom area!`);
      return false;
    }
    
    const boxWidth = width / levelColors.length;
    let selectedBoxIndex = Math.floor(circleCenterX / boxWidth);
    selectedBoxIndex = Math.max(0, Math.min(levelColors.length - 1, selectedBoxIndex));
    
    const selectedColor = levelColors[selectedBoxIndex];
    
    console.log('Selected box:', selectedBoxIndex, selectedColor.name, '| Need:', currentColor.name);
    
    if (selectedColor.name === currentColor.name) {
      setDebugInfo(`✓ ${currentColor.displayName.toUpperCase()}!`);
      return true;
    } else {
      setDebugInfo(`✗ Try ${currentColor.displayName.toUpperCase()}`);
      return false;
    }
  };

  const checkLevelComplete = (newMatchedColors) => {
    console.log('🔍 Checking level complete...');
    console.log('Matched colors:', newMatchedColors);
    console.log('Total colors in level:', levelColors.length);
    console.log('Level colors:', levelColors.map(c => c.name));
    
    if (newMatchedColors.length >= levelColors.length) {
      console.log('🎉 LEVEL COMPLETE!');
      setDebugInfo('🎉 LEVEL COMPLETE! 🎉');
      
      if (currentLevelRef.current === 4) {
        // Beat Level 5 - Show victory!
        console.log('🏆 ALL LEVELS COMPLETE - VICTORY!');
        setTimeout(() => {
          triggerVictory();
        }, 1500);
      } else {
        // Advance to next level
        const nextLevelNum = currentLevelRef.current + 2;
        console.log(`⬆️ Advancing to Level ${nextLevelNum}...`);
        setTimeout(() => {
          advanceLevel();
        }, 1500);
      }
      return true;
    }
    const remaining = levelColors.length - newMatchedColors.length;
    console.log(`❌ Level not complete yet. Need ${remaining} more`);
    return false;
  };

  const advanceLevel = () => {
    console.log('🚀 ADVANCING LEVEL!');
    console.log('Current level before:', currentLevelRef.current);
    
    const nextLevel = currentLevel + 1;
    console.log('Next level will be:', nextLevel);
    
    setCurrentLevel(nextLevel);
    currentLevelRef.current = nextLevel;
    
    setCurrentColorIndex(0);
    currentColorIndexRef.current = 0;
    
    setMatchedColors([]);
    
    const nextLevelName = LEVELS[nextLevel].name;
    setDebugInfo(`Level ${nextLevel + 1}: ${nextLevelName}!`);
    
    console.log('✅ Level advanced! Now on level:', nextLevel + 1);
    speakColor(`Level ${nextLevel + 1}`);
  };

  const triggerVictory = () => {
    console.log('🏆 VICTORY! 🏆');
    setShowVictory(true);
    speakColor('You are amazing! You beat all levels!');
    
    // Confetti animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
      { iterations: 3 }
    ).start();
  };

  const playAgain = () => {
    setShowVictory(false);
    setCurrentLevel(0);
    currentLevelRef.current = 0;
    setCurrentColorIndex(0);
    currentColorIndexRef.current = 0;
    setMatchedColors([]);
    setStars(0);
    confettiAnim.setValue(0);
    setDebugInfo('Level 1: Easy Peasy!');
  };

  const handleCorrectMatch = () => {
    try {
      console.log('✓✓✓ CELEBRATION STARTING ✓✓✓');
      const currentColor = levelColors[currentColorIndexRef.current];
      console.log('Matched color:', currentColor.name);
      
      setShowSparkles(true);
      
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
      });

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
      ]).start();

      speakColor(currentColor.displayName);

      setStars((prev) => prev + 1);
      setLifetimeStars((prev) => prev + 1);

      // Mark this color as matched (avoid duplicates)
      let newMatched = [...matchedColors];
      if (!newMatched.includes(currentColor.name)) {
        newMatched.push(currentColor.name);
      }
      console.log('New matched array:', newMatched);
      console.log('Unique matched count:', newMatched.length);
      setMatchedColors(newMatched);

      // Check if level is complete BEFORE resetting
      const isLevelComplete = checkLevelComplete(newMatched);

      setTimeout(() => {
        pan.flattenOffset();
        pan.setValue({ x: 0, y: 0 });
        pan.setOffset({ x: 0, y: 0 });
        scaleAnim.setValue(1);
        
        if (isLevelComplete) {
          console.log('✅ Level complete - not advancing color');
          return; // Level complete, don't advance color
        }

        // Move to next color in level
        console.log('➡️ Moving to next color in level');
        setCurrentColorIndex((prev) => {
          const nextIndex = (prev + 1) % levelColors.length;
          currentColorIndexRef.current = nextIndex;
          setDebugInfo(`Match: ${levelColors[nextIndex].displayName}!`);
          console.log('Next color:', levelColors[nextIndex].name);
          return nextIndex;
        });
      }, 1000);
      
    } catch (error) {
      console.error('❌ ERROR in handleCorrectMatch:', error);
      console.error('Stack:', error.stack);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !showVictory,
      onMoveShouldSetPanResponder: () => !showVictory,
      
      onPanResponderGrant: () => {
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
        pan.flattenOffset();

        const initialCircleTop = height * 0.22 + CIRCLE_SIZE / 2;
        const initialCircleLeft = width / 2;
        
        const finalCircleCenterX = initialCircleLeft + gestureState.dx;
        const finalCircleCenterY = initialCircleTop + gestureState.dy;

        const isMatch = checkCollision(finalCircleCenterX, finalCircleCenterY);

        if (isMatch) {
          handleCorrectMatch();
        } else {
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

  const currentColor = levelColors[currentColorIndex];

  if (showVictory) {
    return (
      <View style={styles.container}>
        <View style={styles.victoryContainer}>
          {/* Confetti */}
          {[...Array(20)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.confetti,
                {
                  left: (width / 20) * i,
                  backgroundColor: COLORS[i % COLORS.length].value,
                  transform: [
                    {
                      translateY: confettiAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-50, height],
                      }),
                    },
                    {
                      rotate: confettiAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}

          <MaterialCommunityIcons name="trophy" size={120} color="#FFD700" />
          <Text style={styles.victoryTitle}>YOU DID IT!</Text>
          <Text style={styles.victorySubtitle}>All 5 Levels Complete!</Text>
          
          <View style={styles.victoryStars}>
            <MaterialCommunityIcons name="star" size={50} color="#FFD700" />
            <Text style={styles.victoryStarText}>{lifetimeStars} Total Stars!</Text>
          </View>

          <TouchableOpacity style={styles.playAgainButton} onPress={playAgain}>
            <Text style={styles.playAgainText}>PLAY AGAIN</Text>
            <MaterialCommunityIcons name="replay" size={30} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        {/* Level Indicator */}
        <View style={styles.levelContainer}>
          <Text style={styles.levelText}>Level {currentLevel + 1}</Text>
          <Text style={styles.levelName}>{LEVELS[currentLevel].name}</Text>
          <Text style={styles.progressText}>{matchedColors.length}/{levelColors.length} matched</Text>
        </View>

        {/* Lifetime Stars (Only one star counter) */}
        <View style={styles.starContainer}>
          <Animated.View style={{ transform: [{ scale: starAnim }] }}>
            <MaterialCommunityIcons name="star" size={45} color="#FFD700" />
          </Animated.View>
          <Text style={styles.starText}>{lifetimeStars}</Text>
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
              </Animated.View>
            )}
          </Animated.View>
        </View>

        {/* Debug Info */}
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>{debugInfo}</Text>
        </View>

        {/* Color Boxes */}
        <View style={styles.boxesContainer}>
          {levelColors.map((color, index) => (
            <View
              key={`${color.name}-${index}`}
              style={[
                styles.box,
                { 
                  backgroundColor: color.value,
                  width: BOX_SIZE,
                  height: BOX_SIZE,
                  opacity: matchedColors.includes(color.name) ? 0.4 : 1,
                },
              ]}
            >
              {matchedColors.includes(color.name) && (
                <MaterialCommunityIcons name="check-circle" size={40} color="#FFF" />
              )}
            </View>
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
  levelContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  levelText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6347',
  },
  levelName: {
    fontSize: 14,
    color: '#666',
  },
  progressText: {
    fontSize: 12,
    color: '#FF6347',
    fontWeight: 'bold',
    marginTop: 2,
  },
  starContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  starText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6347',
    marginLeft: 8,
  },
  lifetimeContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 90,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  lifetimeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 6,
  },
  circleContainer: {
    position: 'absolute',
    top: height * 0.25,
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
  debugContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 160 : 140,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  debugText: {
    fontSize: 22,
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
    bottom: Platform.OS === 'ios' ? 60 : 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 10,
    flexWrap: 'wrap',
  },
  box: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 5,
    borderColor: '#FFF',
    marginHorizontal: 4,
    marginVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  victoryContainer: {
    flex: 1,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 20,
    borderRadius: 5,
  },
  victoryTitle: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  victorySubtitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6347',
    marginTop: 10,
  },
  victoryStars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
  },
  victoryStarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6347',
    marginLeft: 10,
  },
  playAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6347',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 30,
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  playAgainText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 10,
  },
});
