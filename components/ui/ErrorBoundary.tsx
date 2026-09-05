import React, { Component, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { fontFamily } from "../../theme/fonts";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
}

const Fallback: React.FC<{ error: Error | null; onRetry: () => void }> = ({
  error,
  onRetry,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Something went wrong
      </Text>
      <Text style={[styles.body, { color: colors.textMuted }]}>
        {error?.message ?? "An unexpected error occurred."}
      </Text>
      <Pressable
        style={[styles.retry, { backgroundColor: colors.focus }]}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Try again"
      >
        <Text style={[styles.retryText, { color: colors.onPrimary }]}>
          Try again
        </Text>
      </Pressable>
    </View>
  );
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  private reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return <Fallback error={this.state.error} onRetry={this.reset} />;
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: fontFamily.bold,
  },
  body: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 16,
    fontFamily: fontFamily.regular,
  },
  retry: {
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: {
    fontWeight: "600",
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
  },
});
