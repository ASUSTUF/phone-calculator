import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Vibration,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BTN_SIZE = (SCREEN_WIDTH - 5 * 14) / 4;

// ─── Calculator Logic ────────────────────────────────────────────────────────

const calculate = (a, op, b) => {
  const x = parseFloat(a);
  const y = parseFloat(b);
  if (isNaN(x) || isNaN(y)) return '0';
  switch (op) {
    case '+': return String(x + y);
    case '−': return String(x - y);
    case '×': return String(x * y);
    case '÷': return y === 0 ? 'Eroare' : String(x / y);
    default: return String(x);
  }
};

const formatDisplay = (value) => {
  if (value === 'Eroare') return 'Eroare';
  const num = parseFloat(value);
  if (isNaN(num)) return '0';
  // Limit digits shown
  if (Math.abs(num) >= 1e10 || (Math.abs(num) < 1e-6 && num !== 0)) {
    return num.toExponential(4);
  }
  // Remove floating point jitter
  const str = parseFloat(num.toPrecision(10)).toString();
  return str;
};

const scaleFontSize = (base) => {
  const scale = SCREEN_WIDTH / 390;
  return Math.round(base * scale);
};

// ─── Button Config ────────────────────────────────────────────────────────────

const BUTTONS = [
  [
    { label: 'AC', type: 'fn',      wide: false },
    { label: '+/-', type: 'fn',     wide: false },
    { label: '%',  type: 'fn',      wide: false },
    { label: '÷',  type: 'operator',wide: false },
  ],
  [
    { label: '7', type: 'digit' },
    { label: '8', type: 'digit' },
    { label: '9', type: 'digit' },
    { label: '×', type: 'operator' },
  ],
  [
    { label: '4', type: 'digit' },
    { label: '5', type: 'digit' },
    { label: '6', type: 'digit' },
    { label: '−', type: 'operator' },
  ],
  [
    { label: '1', type: 'digit' },
    { label: '2', type: 'digit' },
    { label: '3', type: 'digit' },
    { label: '+', type: 'operator' },
  ],
  [
    { label: '⌫',  type: 'fn',      wide: false },
    { label: '0',  type: 'digit',   wide: false },
    { label: '.',  type: 'digit',   wide: false },
    { label: '=',  type: 'equals',  wide: false },
  ],
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function App() {
  const [currentValue, setCurrentValue] = useState('0');
  const [prevValue, setPrevValue]       = useState(null);
  const [operator, setOperator]         = useState(null);
  const [waitingForOperand, setWaiting] = useState(false);
  const [expression, setExpression]     = useState('');
  const [justEvaluated, setJustEvaluated] = useState(false);

  const handlePress = useCallback((label, type) => {
    Vibration.vibrate(10);

    // ── AC ──
    if (label === 'AC') {
      setCurrentValue('0');
      setPrevValue(null);
      setOperator(null);
      setWaiting(false);
      setExpression('');
      setJustEvaluated(false);
      return;
    }

    // ── Backspace ──
    if (label === '⌫') {
      if (justEvaluated) {
        setCurrentValue('0');
        setJustEvaluated(false);
        return;
      }
      if (currentValue.length > 1) {
        setCurrentValue(currentValue.slice(0, -1));
      } else {
        setCurrentValue('0');
      }
      return;
    }

    // ── +/- ──
    if (label === '+/-') {
      const toggled = String(parseFloat(currentValue) * -1);
      setCurrentValue(toggled);
      if (justEvaluated) setExpression('');
      setJustEvaluated(false);
      return;
    }

    // ── % ──
    if (label === '%') {
      const percent = String(parseFloat(currentValue) / 100);
      setCurrentValue(percent);
      if (justEvaluated) setExpression('');
      setJustEvaluated(false);
      return;
    }

    // ── Operators ──
    if (type === 'operator') {
      if (operator && !waitingForOperand) {
        // Chain calculation
        const result = calculate(prevValue, operator, currentValue);
        setCurrentValue(result);
        setPrevValue(result);
        setExpression(`${formatDisplay(result)} ${label}`);
      } else {
        setPrevValue(currentValue);
        setExpression(`${formatDisplay(currentValue)} ${label}`);
      }
      setOperator(label);
      setWaiting(true);
      setJustEvaluated(false);
      return;
    }

    // ── Equals ──
    if (label === '=') {
      if (!operator || !prevValue) return;
      const result = calculate(prevValue, operator, currentValue);
      setExpression(`${formatDisplay(prevValue)} ${operator} ${formatDisplay(currentValue)} =`);
      setCurrentValue(result);
      setPrevValue(null);
      setOperator(null);
      setWaiting(false);
      setJustEvaluated(true);
      return;
    }

    // ── Decimal ──
    if (label === '.') {
      if (waitingForOperand) {
        setCurrentValue('0.');
        setWaiting(false);
        return;
      }
      if (!currentValue.includes('.')) {
        setCurrentValue(currentValue + '.');
      }
      setJustEvaluated(false);
      return;
    }

    // ── Digits ──
    if (justEvaluated) {
      setCurrentValue(label);
      setExpression('');
      setJustEvaluated(false);
      return;
    }
    if (waitingForOperand) {
      setCurrentValue(label);
      setWaiting(false);
    } else {
      setCurrentValue(currentValue === '0' ? label : currentValue + label);
    }
  }, [currentValue, prevValue, operator, waitingForOperand, justEvaluated]);

  // Dynamic font size for long numbers
  const displayValue = formatDisplay(currentValue);
  const fontSize =
    displayValue.length > 12
      ? scaleFontSize(38)
      : displayValue.length > 9
      ? scaleFontSize(52)
      : scaleFontSize(72);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* ── Display ── */}
      <View style={styles.display}>
        <Text style={styles.expression} numberOfLines={1} ellipsizeMode="head">
          {expression || ' '}
        </Text>
        <Text
          style={[styles.result, { fontSize }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.4}
        >
          {displayValue}
        </Text>
      </View>

      {/* ── Buttons ── */}
      <View style={styles.buttonsWrapper}>
        {BUTTONS.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {row.map((btn) => (
              <CalcButton
                key={btn.label}
                label={btn.label}
                type={btn.type}
                activeOperator={operator}
                waitingForOperand={waitingForOperand}
                onPress={handlePress}
              />
            ))}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─── CalcButton ───────────────────────────────────────────────────────────────

function CalcButton({ label, type, activeOperator, waitingForOperand, onPress }) {
  const [pressed, setPressed] = useState(false);

  const isActiveOp =
    type === 'operator' &&
    label === activeOperator &&
    waitingForOperand;

  const bgColor = () => {
    if (isActiveOp)          return '#FFFFFF';
    if (type === 'fn')       return '#A5A5A5';
    if (type === 'operator') return '#FF9500';
    if (type === 'equals')   return '#FF9500';
    return '#333333';
  };

  const textColor = () => {
    if (isActiveOp) return '#FF9500';
    return '#FFFFFF';
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={() => onPress(label, type)}
      style={[
        styles.button,
        { backgroundColor: bgColor() },
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.buttonText, { color: textColor() }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ORANGE  = '#FF9500';
const GAP     = 14;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'flex-end',
  },

  // Display
  display: {
    paddingHorizontal: 28,
    paddingBottom: 12,
    alignItems: 'flex-end',
    minHeight: SCREEN_HEIGHT * 0.28,
    justifyContent: 'flex-end',
  },
  expression: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: scaleFontSize(22),
    marginBottom: 4,
    letterSpacing: 0.5,
    fontWeight: '300',
  },
  result: {
    color: '#FFFFFF',
    fontWeight: '200',
    letterSpacing: -2,
  },

  // Buttons
  buttonsWrapper: {
    paddingHorizontal: GAP,
    paddingBottom: GAP,
    gap: GAP,
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
  },
  button: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonPressed: {
    opacity: 0.55,
    transform: [{ scale: 0.94 }],
  },
  buttonText: {
    fontSize: scaleFontSize(30),
    fontWeight: '400',
    letterSpacing: 0.3,
  },
});