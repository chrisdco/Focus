import { useCallback, useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useTimerContext } from "../context/TimerContext";

export const useAppStateReconciliation = (): void => {
  const { state, dispatch } = useTimerContext();
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const reconcile = useCallback(() => {
    const current = stateRef.current;

    if (!current.isRunning || current.expectedEndTime === null) {
      return;
    }

    const now = Date.now();
    dispatch({ type: "TICK", now });

    if (current.expectedEndTime <= now) {
      dispatch({ type: "TICK", now });
    }
  }, [dispatch]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        reconcile();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [reconcile]);
};
