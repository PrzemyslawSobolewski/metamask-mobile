import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../../util/theme';
import Timer from './Timer';

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    },
    button: {
      marginTop: 20,
      padding: 10,
      backgroundColor: colors.secondary.default,
      borderRadius: 5,
    },
    buttonText: {
      color: colors.text.alternative,
      fontSize: 20,
    },
  });

const GenerateCodeView = () => {
  const [code, setCode] = useState(0);
  const [minutes, setMinutes] = useState(2);
  const [seconds, setSeconds] = useState(0);

  const { colors } = useTheme();
  const styles = createStyles(colors);

  useEffect(() => {
    setCode(Math.floor(100000 + Math.random() * 900000));
  }, []);

  const resetTimer = () => {
    setMinutes(2);
    setSeconds(0);
  };

  return (
    <View>
      <View>
        <Text>{code}</Text>
        <Timer initialMinute={minutes} initialSeconds={seconds} />
        {minutes === 0 && (
          <TouchableOpacity style={styles.button} onPress={resetTimer}>
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default GenerateCodeView;
