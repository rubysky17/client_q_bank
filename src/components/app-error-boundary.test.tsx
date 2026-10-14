import '@/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { AppErrorBoundary } from './app-error-boundary';

describe('AppErrorBoundary', () => {
  it('shows the error in development and retries on press', async () => {
    const retry = jest.fn(() => Promise.resolve());
    // Testing Library v14: render and fireEvent are async.
    await render(<AppErrorBoundary error={new Error('Boom')} retry={retry} />);

    expect(screen.getByText('Boom')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Thử lại'));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
