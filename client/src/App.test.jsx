import React from 'react';
import {render, screen} from '@testing-library/react';
import {vi, test, expect} from 'vitest';
import App from './App';

// No server in tests: replace the socket wrapper
vi.mock('./api', () => ({
    default: {
        emitToServer: vi.fn(),
        setCallbackOnMessage: vi.fn(),
        removeCallbackOnMessage: vi.fn(),
        isConnected: () => false
    }
}));

test('shows the registration page to a new player', () => {
    render(<App/>);
    expect(screen.getByRole('heading', {name: 'Hosenabe'})).toBeInTheDocument();
    expect(screen.getByLabelText(/Wie heissisch/)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Los!'})).toBeDisabled();
});
