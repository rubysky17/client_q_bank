// The AbortController React Native installs as a global (see react-native/Libraries/Core/setUpXHR.js).
import {
  AbortController as RNAbortController,
  AbortSignal as RNAbortSignal,
} from 'abort-controller';

import { polyfillAbort } from './polyfills';

const Controller = RNAbortController as unknown as typeof AbortController;
const Signal = RNAbortSignal as unknown as typeof AbortSignal;

describe('polyfillAbort on React Native’s AbortController', () => {
  beforeAll(() => {
    expect(typeof Signal.any).toBe('undefined');
    polyfillAbort(Controller, Signal);
  });

  it('records the abort reason, with an AbortError by default', () => {
    const withReason = new Controller();
    withReason.abort('timeout');
    expect(withReason.signal.reason).toBe('timeout');

    const withoutReason = new Controller();
    withoutReason.abort();
    expect((withoutReason.signal.reason as Error).name).toBe('AbortError');
  });

  it('throwIfAborted() throws the reason only once aborted', () => {
    const controller = new Controller();
    expect(() => controller.signal.throwIfAborted()).not.toThrow();
    controller.abort('cancelled');
    expect(() => controller.signal.throwIfAborted()).toThrow('cancelled');
  });

  it('AbortSignal.any() follows whichever input aborts first', () => {
    const first = new Controller();
    const second = new Controller();
    const merged = Signal.any([first.signal, second.signal]);

    expect(merged.aborted).toBe(false);
    second.abort('timeout');
    expect(merged.aborted).toBe(true);
    expect(merged.reason).toBe('timeout');
  });

  it('AbortSignal.any() is already aborted when an input is', () => {
    const done = new Controller();
    done.abort('cancelled');
    const merged = Signal.any([new Controller().signal, done.signal]);

    expect(merged.aborted).toBe(true);
    expect(merged.reason).toBe('cancelled');
  });
});
