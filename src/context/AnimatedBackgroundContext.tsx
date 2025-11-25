'use client';

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import AnimatedBackground from '@/components/AnimatedBackground';

interface AnimatedBackgroundContextValue {
    enable: () => void;
    disable: () => void;
}

const AnimatedBackgroundContext = createContext<AnimatedBackgroundContextValue | null>(null);

export function AnimatedBackgroundProvider({ children }: { children: ReactNode }) {
    const [enabled, setEnabled] = useState(true);

    const enable = useCallback(() => setEnabled(true), []);
    const disable = useCallback(() => setEnabled(false), []);

    const contextValue = useMemo(
        () => ({
            enable,
            disable,
        }),
        [enable, disable],
    );

    return (
        <AnimatedBackgroundContext.Provider value={contextValue}>
            {enabled && <AnimatedBackground />}
            {children}
        </AnimatedBackgroundContext.Provider>
    );
}

export function useAnimatedBackground() {
    const context = useContext(AnimatedBackgroundContext);
    if (!context) {
        throw new Error('useAnimatedBackground must be used within AnimatedBackgroundProvider');
    }
    return context;
}

