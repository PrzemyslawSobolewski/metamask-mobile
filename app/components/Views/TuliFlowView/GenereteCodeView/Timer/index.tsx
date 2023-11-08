import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
// eslint-disable-next-line import/no-extraneous-dependencies
import { CircularProgressBase } from 'react-native-circular-progress-indicator';

const createStyles = () =>
  StyleSheet.create({
    container: {
      justifyContent: 'center',
      alignItems: 'center',
    },

    timerText: {
      fontSize: 48,
    },
  });

interface IProps {
  initialMinute: number;
  initialSeconds: number;
}

const Timer = ({ initialMinute, initialSeconds }: IProps) => {
  const [minutes, setMinutes] = useState(initialMinute);
  const [seconds, setSeconds] = useState(initialSeconds);

  const styles = createStyles();

  useEffect(() => {
    const myInterval = setInterval(() => {
      if (seconds > 0) {
        setSeconds(seconds - 1);
      }
      if (seconds === 0) {
        if (minutes === 0) {
          clearInterval(myInterval);
        } else {
          setMinutes(minutes - 1);
          setSeconds(59);
        }
      }
    }, 1000);
    return () => {
      clearInterval(myInterval);
    };
  });

  const initTime = initialMinute * 60 * 1000 + initialSeconds * 1000;

  return (
    <View style={styles.container}>
      <CircularProgressBase
        value={0}
        initialValue={initTime}
        radius={120}
        duration={initTime}
        activeStrokeWidth={25}
        inActiveStrokeWidth={25}
        inActiveStrokeOpacity={0.2}
        activeStrokeColor={'#badc58'}
        inActiveStrokeColor={'#badc58'}
        maxValue={initTime}
      >
        <Text style={styles.timerText}>
          {' '}
          {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
        </Text>
      </CircularProgressBase>
    </View>
  );
};

export default Timer;
