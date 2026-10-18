/**
 * Web APIs that React Native lacks but our libraries call. Imported first by the app providers.
 *
 * React Native's AbortController comes from the old `abort-controller` package: no `reason`,
 * `throwIfAborted()` or `AbortSignal.any()`. ky 2 uses all three on every request that passes a
 * `signal` (TanStack Query always does), so every query threw before reaching the network.
 */

/** What `abort()` without an argument records, like the DOM's `AbortError`. */
function abortError(): Error {
  const error = new Error('This operation was aborted');
  error.name = 'AbortError';
  return error;
}

/** Adds the missing members to the given classes; a no-op where they already exist. */
export function polyfillAbort(Controller: typeof AbortController, Signal: typeof AbortSignal) {
  if (!('reason' in Signal.prototype)) {
    const reasons = new WeakMap<AbortSignal, unknown>();
    Object.defineProperty(Signal.prototype, 'reason', {
      configurable: true,
      get(this: AbortSignal) {
        return reasons.get(this);
      },
    });
    const abort = Controller.prototype.abort;
    Controller.prototype.abort = function (this: AbortController, reason?: unknown) {
      if (!this.signal.aborted)
        reasons.set(this.signal, reason === undefined ? abortError() : reason);
      abort.call(this);
    };
  }

  if (typeof Signal.prototype.throwIfAborted !== 'function') {
    Signal.prototype.throwIfAborted = function (this: AbortSignal) {
      if (this.aborted) throw this.reason;
    };
  }

  if (typeof Signal.any !== 'function') {
    Signal.any = (signals: AbortSignal[]) => {
      const controller = new Controller();
      const aborted = signals.find((signal) => signal.aborted);
      if (aborted) {
        controller.abort(aborted.reason);
        return controller.signal;
      }
      for (const signal of signals) {
        signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
      }
      return controller.signal;
    };
  }
}

polyfillAbort(AbortController, AbortSignal);
