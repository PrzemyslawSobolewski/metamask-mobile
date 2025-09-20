/* eslint-disable react-native/no-color-literals */
import React, { useEffect, SetStateAction } from 'react';
import { View, Text, StyleSheet } from 'react-native';
// eslint-disable-next-line import/no-extraneous-dependencies
import { useTheme } from '../../../../../util/theme';
import LinearGradient from 'react-native-linear-gradient';

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    timerContentWrapper: {
      position: 'relative',
      height: '100%',
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    timerBorder: {
      width: '80%',
      borderRadius: 8,
      opacity: 1,
      backgroundColor: '#F4F6F8',
      justifyContent: 'center',
      alignItems: 'flex-start',
      height: 4,
    },
    shadowProp: {
      shadowColor: '#00000080',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 1,
      elevation: 2,
    },
    loaderLine: {
      height: 4,
      borderRadius: 8,
    },
    timeTextWrapper: {
      width: '80%',
      justifyContent: 'center',
      alignItems: 'flex-end',
    },
    button: {
      position: 'absolute',
      alignSelf: 'center',
      bottom: '-70%',
    },
    buttonText: {
      color: colors.error.default,
      fontSize: 20,
    },
    timerText: {
      marginTop: 8,
      fontSize: 13,
      fontWeight: '400',
      color: '#3C405D',
    },
  });

interface IProps {
  time: number;
  minutes: number;
  seconds: number;
  setMinutes: React.Dispatch<SetStateAction<number>>;
  setSeconds: React.Dispatch<SetStateAction<number>>;
  handleRefresh: () => void;
  disabled?: boolean;
}

const Timer = ({
  time,
  minutes,
  seconds,
  setMinutes,
  setSeconds,
  disabled,
}: IProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  useEffect(() => {
    if (!disabled) {
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
    }
  });

  return (
    <View style={styles.container}>
      <View style={[styles.timerBorder, styles.shadowProp]}>
        <LinearGradient
          colors={['#5376f7', '#3366FF']}
          style={[
            styles.loaderLine,
            { width: `${(((minutes * 60 + seconds) * 1000) / time) * 100}%` },
          ]}
        />
      </View>
      <View style={styles.timeTextWrapper}>
        <Text style={styles.timerText}>
          {' '}
          {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
        </Text>
      </View>
    </View>
  );
};

export default Timer;
