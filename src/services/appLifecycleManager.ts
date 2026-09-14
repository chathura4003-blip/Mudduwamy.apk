/**
 * Centralized Application Lifecycle Manager
 * Handles FOREGROUND, BACKGROUND, INACTIVE, and RESUMED states
 * across Capacitor Android native and Web browser environments.
 */

import { App as CapacitorApp } from '@capacitor/app';

export type AppLifecycleState = 'FOREGROUND' | 'BACKGROUND' | 'INACTIVE' | 'RESUMED';

interface PollTask {
  id: string;
  callback: () => Promise<void> | void;
  intervalMs: number;
  backgroundIntervalMs?: number;
  allowBackground?: boolean;
  timerId: number | null;
  isRunning: boolean;
  runImmediatelyOnResume: boolean;
}

class AppLifecycleManager {
  private currentState: AppLifecycleState = 'FOREGROUND';
  private tasks: Map<string, PollTask> = new Map();
  private stateListeners: Set<(state: AppLifecycleState) => void> = new Set();
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // 1. Listen to Capacitor Native App State changes
    try {
      CapacitorApp.addListener('appStateChange', (state) => {
        if (state.isActive) {
          this.transitionTo('RESUMED');
        } else {
          this.transitionTo('BACKGROUND');
        }
      }).catch(() => {
        // Fallback for non-Capacitor web environments
      });
    } catch (e) {
      // Ignore if native bridge not available
    }

    // 2. Listen to DOM visibility changes (for WebView / Browser compatibility)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.transitionTo('BACKGROUND');
      } else {
        this.transitionTo('RESUMED');
      }
    });

    // 3. Listen to Window focus/blur
    window.addEventListener('focus', () => {
      if (this.currentState === 'BACKGROUND') {
        this.transitionTo('RESUMED');
      }
    });

    window.addEventListener('blur', () => {
      // Only transition to INACTIVE if not already BACKGROUND
      if (this.currentState !== 'BACKGROUND') {
        this.transitionTo('INACTIVE');
      }
    });
  }

  private transitionTo(nextState: AppLifecycleState) {
    if (this.currentState === nextState) return;

    const prevState = this.currentState;
    this.currentState = nextState;

    if (nextState === 'BACKGROUND' || nextState === 'INACTIVE') {
      this.handleEnterBackground();
    } else if (nextState === 'RESUMED' || nextState === 'FOREGROUND') {
      this.resumeAllTasks(prevState === 'BACKGROUND');
      // Normalize state to FOREGROUND after resume
      this.currentState = 'FOREGROUND';
    }

    // Notify listeners
    this.stateListeners.forEach((listener) => {
      try {
        listener(nextState);
      } catch (err) {
        console.warn('Error in lifecycle listener:', err);
      }
    });
  }

  public getState(): AppLifecycleState {
    return this.currentState;
  }

  public isAppForeground(): boolean {
    return this.currentState === 'FOREGROUND' || this.currentState === 'RESUMED';
  }

  public addStateListener(listener: (state: AppLifecycleState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  /**
   * Registers a recurring periodic task.
   * Tasks with allowBackground: true continue to poll at backgroundIntervalMs when minimized.
   */
  public registerPollTask(
    id: string,
    callback: () => Promise<void> | void,
    intervalMs: number,
    options: {
      runImmediately?: boolean;
      runImmediatelyOnResume?: boolean;
      allowBackground?: boolean;
      backgroundIntervalMs?: number;
    } = {}
  ): () => void {
    const {
      runImmediately = false,
      runImmediatelyOnResume = true,
      allowBackground = false,
      backgroundIntervalMs = Math.max(15000, intervalMs),
    } = options;

    // Clean up existing task if re-registering with same ID
    this.unregisterPollTask(id);

    const task: PollTask = {
      id,
      callback,
      intervalMs,
      backgroundIntervalMs,
      allowBackground,
      timerId: null,
      isRunning: false,
      runImmediatelyOnResume,
    };

    this.tasks.set(id, task);

    this.startTask(task, runImmediately);

    // Return unregister cleanup function
    return () => {
      this.unregisterPollTask(id);
    };
  }

  private startTask(task: PollTask, runNow = false) {
    if (task.timerId !== null) {
      window.clearInterval(task.timerId);
      task.timerId = null;
    }

    const isFg = this.isAppForeground();
    if (!isFg && !task.allowBackground) {
      return;
    }

    const currentInterval = isFg
      ? task.intervalMs
      : (task.backgroundIntervalMs || Math.max(15000, task.intervalMs));

    const execute = async () => {
      if (task.isRunning) return;
      if (!this.isAppForeground() && !task.allowBackground) return;

      task.isRunning = true;
      try {
        await task.callback();
      } catch (err) {
        console.warn(`[Lifecycle] Task "${task.id}" execution error:`, err);
      } finally {
        task.isRunning = false;
      }
    };

    if (runNow) {
      execute();
    }

    task.timerId = window.setInterval(execute, currentInterval);
  }

  private pauseTask(task: PollTask) {
    if (task.timerId !== null) {
      window.clearInterval(task.timerId);
      task.timerId = null;
    }
  }

  public unregisterPollTask(id: string) {
    const task = this.tasks.get(id);
    if (task) {
      this.pauseTask(task);
      this.tasks.delete(id);
    }
  }

  private handleEnterBackground() {
    this.tasks.forEach((task) => {
      if (task.allowBackground) {
        // Switch to low-power background polling interval
        this.startTask(task, false);
      } else {
        this.pauseTask(task);
      }
    });
  }

  public pauseAllTasks() {
    this.tasks.forEach((task) => this.pauseTask(task));
  }

  public resumeAllTasks(fromBackground = true) {
    this.tasks.forEach((task) => {
      const shouldRunImmediately = fromBackground && task.runImmediatelyOnResume;
      this.startTask(task, shouldRunImmediately);
    });
  }

  /**
   * Stops and clears all registered tasks (used on logout or app teardown)
   */
  public stopAllTasks() {
    this.pauseAllTasks();
    this.tasks.clear();
  }
}

export const appLifecycleManager = new AppLifecycleManager();
