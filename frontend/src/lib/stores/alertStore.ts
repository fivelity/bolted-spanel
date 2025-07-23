import type { AlertCondition, Alert } from "$lib/types/sensor";
import { sensorStore } from "./sensorStore";
import { writable, get } from "svelte/store";
import { nanoid } from "nanoid";
import type { Writable } from "svelte/store";

export type AlertStore = {
  init: () => Promise<void>;
  addCondition: (condition: Omit<AlertCondition, "id" | "triggered">) => void;
  updateCondition: (
    conditionId: string,
    updates: Partial<AlertCondition>,
  ) => void;
  removeCondition: (conditionId: string) => void;
  acknowledgeAlert: (alertId: string) => void;
  clearHistory: () => void;
  saveConditions: () => void;
  saveHistory: () => void;
  startMonitoring: () => void;
  checkAlerts: () => void;
  evaluateCondition: (value: number, condition: AlertCondition) => boolean;
  getSensorValue: (data: any, path: string) => number;
  showNotification: (condition: AlertCondition, value: number) => void;
};

// Svelte stores
export const alertConditions = writable<AlertCondition[]>([]);
export const alertHistory = writable<Alert[]>([]);
export const notificationPermission =
  writable<NotificationPermission>("default");

export const alertStore: AlertStore = {
  async init() {
    // Load saved alert conditions
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sensecanvas-alerts");
      if (saved) {
        try {
          alertConditions.set(JSON.parse(saved));
        } catch (error) {
          console.error("Failed to load alert conditions:", error);
        }
      }

      // Request notification permission
      if ("Notification" in window) {
        const permission = Notification.permission;
        notificationPermission.set(permission);
        if (permission === "default") {
          const newPermission = await Notification.requestPermission();
          notificationPermission.set(newPermission);
        }
      }
    }

    // Start monitoring alerts
    this.startMonitoring();
  },

  addCondition(condition: Omit<AlertCondition, "id" | "triggered">) {
    const newCondition: AlertCondition = {
      ...condition,
      id: nanoid(),
      triggered: false,
    };

    alertConditions.update((conditions) => [...conditions, newCondition]);
    this.saveConditions();
  },

  updateCondition(conditionId: string, updates: Partial<AlertCondition>) {
    alertConditions.update((conditions) =>
      conditions.map((condition) =>
        condition.id === conditionId ? { ...condition, ...updates } : condition,
      ),
    );
    this.saveConditions();
  },

  removeCondition(conditionId: string) {
    alertConditions.update((conditions) =>
      conditions.filter((c) => c.id !== conditionId),
    );
    this.saveConditions();
  },

  acknowledgeAlert(alertId: string) {
    alertHistory.update((history) =>
      history.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert,
      ),
    );
    this.saveHistory();
  },

  clearHistory() {
    alertHistory.set([]);
    this.saveHistory();
  },

  saveConditions() {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "sensecanvas-alerts",
        JSON.stringify(get(alertConditions)),
      );
    }
  },

  saveHistory() {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "sensecanvas-alert-history",
        JSON.stringify(get(alertHistory)),
      );
    }
  },

  startMonitoring() {
    // Check alerts every 5 seconds
    setInterval(() => {
      this.checkAlerts();
    }, 5000);
  },

  checkAlerts() {
    const currentData = sensorStore.data;
    const conditions = get(alertConditions);

    conditions.forEach((condition) => {
      if (!condition.enabled) return;

      const value = this.getSensorValue(currentData, condition.sensorPath);
      const shouldAlert = this.evaluateCondition(value, condition);

      if (shouldAlert && !condition.triggered) {
        // Trigger alert
        condition.triggered = true;

        const alert: Alert = {
          id: nanoid(),
          condition: condition.name,
          value,
          timestamp: Date.now(),
          acknowledged: false,
        };

        alertHistory.update((history) => [alert, ...history.slice(0, 99)]); // Keep last 100 alerts

        // Show notification
        this.showNotification(condition, value);

        this.saveConditions();
        this.saveHistory();
      } else if (!shouldAlert && condition.triggered) {
        // Reset trigger state when condition is no longer met
        condition.triggered = false;
        this.saveConditions();
      }
    });
  },

  evaluateCondition(value: number, condition: AlertCondition): boolean {
    switch (condition.operator) {
      case "greater":
        return value > condition.threshold;
      case "less":
        return value < condition.threshold;
      case "equal":
        return Math.abs(value - condition.threshold) < 0.1;
      default:
        return false;
    }
  },

  getSensorValue(data: any, path: string): number {
    const keys = path.split(".");
    let value: any = data;

    for (const key of keys) {
      if (value && typeof value === "object" && key in value) {
        value = value[key];
      } else {
        return 0;
      }
    }

    return typeof value === "number" ? value : 0;
  },

  showNotification(condition: AlertCondition, value: number) {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (get(notificationPermission) !== "granted") return;

    const notification = new Notification(
      `SenseCanvas Alert: ${condition.name}`,
      {
        body: `${condition.sensorPath} is ${value.toFixed(1)}${condition.unit}`,
        icon: "/favicon.png",
        tag: condition.id,
        requireInteraction: true,
      },
    );

    // Auto-close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);
  },
};
