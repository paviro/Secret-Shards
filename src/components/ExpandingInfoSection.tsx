'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const layoutSpring: Transition = {
    type: 'spring',
    stiffness: 260,
    damping: 24,
};

interface ExpandingInfoSectionProps {
    icon: ReactNode | ((isExpanded: boolean) => ReactNode);
    title: string;
    badge?: ReactNode;
    description: string;
    children: (collapse: () => void) => ReactNode;
    storageKey?: string;
    className?: string;
    variant?: 'default' | 'warning';
}

const VARIANTS = {
    default: {
        border: 'border-emerald-500/20',
        borderHover: 'hover:border-emerald-500/40',
        bgExpanded: 'bg-slate-900/40',
        bgCollapsed: 'bg-slate-900/40',
        gradient: 'from-emerald-500/10 to-teal-500/10',
        iconBg: 'bg-emerald-500/10',
        iconText: 'text-emerald-400',
        title: 'text-emerald-400',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    warning: {
        border: 'border-orange-500/20',
        borderHover: 'hover:border-orange-500/40',
        bgExpanded: 'bg-orange-950/10',
        bgCollapsed: 'bg-orange-950/10',
        gradient: 'from-orange-500/10 to-amber-500/10',
        iconBg: 'bg-orange-500/10',
        iconText: 'text-orange-400',
        title: 'text-orange-400',
        badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    },
};

export default function ExpandingInfoSection({
    icon,
    title,
    badge,
    description,
    children,
    storageKey,
    className = '',
    variant = 'default',
}: ExpandingInfoSectionProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const colors = VARIANTS[variant];

    useEffect(() => {
        if (storageKey) {
            const isHidden = localStorage.getItem(storageKey) === 'true';
            if (!isHidden) {
                setIsVisible(true);
            }
        } else {
            setIsVisible(true);
        }
    }, [storageKey]);

    const dismiss = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsVisible(false);
        if (storageKey) {
            localStorage.setItem(storageKey, 'true');
        }
    };

    if (!isVisible) return null;

    return (
        <motion.div
            layout
            transition={layoutSpring}
            onClick={() => !isExpanded && setIsExpanded(true)}
            whileHover="hover"
            className={`block relative overflow-hidden rounded-2xl border backdrop-blur-md transition-colors ${className} ${colors.border} ${isExpanded
                ? `${colors.bgExpanded} p-5 cursor-default`
                : `${colors.bgCollapsed} ${colors.borderHover} p-5 cursor-pointer group`
                }`}
        >
            {/* Background Gradient Effect */}
            <AnimatePresence>
                {!isExpanded && (
                    <motion.div
                        key="bg-highlight"
                        variants={{
                            initial: { opacity: 0 },
                            animate: { opacity: 0.5 },
                            exit: { opacity: 0 },
                            hover: { opacity: 1 },
                        }}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.25 }}
                        className={`absolute inset-0 bg-gradient-to-r ${colors.gradient} pointer-events-none`}
                    />
                )}
            </AnimatePresence>

            <div className="flex items-start gap-4 relative z-10">
                {/* Icon Container */}
                <motion.div
                    layout
                    variants={{
                        initial: { scale: 1 },
                        hover: { scale: isExpanded ? 1 : 1.1 },
                    }}
                    className={`p-3 rounded-xl shrink-0 ${colors.iconBg} ${colors.iconText}`}
                >
                    {typeof icon === 'function' ? icon(isExpanded) : icon}
                </motion.div>

                {/* Text column */}
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3
                            className={`font-semibold ${colors.title} ${isExpanded ? 'text-lg mb-1' : ''
                                }`}
                        >
                            {title}
                        </h3>

                        <AnimatePresence>
                            {!isExpanded && badge && (
                                <motion.div
                                    key="badge"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {badge}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Content swap */}
                    <div className="relative">
                        <AnimatePresence initial={false}>
                            {!isExpanded ? (
                                <motion.p
                                    key="short-desc"
                                    initial={{ opacity: 0, y: 4, position: 'absolute' }}
                                    animate={{ opacity: 1, y: 0, position: 'relative' }}
                                    exit={{ opacity: 0, y: -4, position: 'absolute' }}
                                    transition={{ duration: 0.18 }}
                                    className="text-slate-400 text-sm mt-0.5 w-full"
                                >
                                    {description}
                                </motion.p>
                            ) : (
                                <motion.div
                                    key="long-desc"
                                    initial={{ opacity: 0, y: 4, position: 'absolute' }}
                                    animate={{ opacity: 1, y: 0, position: 'relative' }}
                                    exit={{ opacity: 0, y: -4, position: 'absolute' }}
                                    transition={{ duration: 0.2 }}
                                    className="mt-1 w-full"
                                >
                                    {children(() => setIsExpanded(false))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Dismiss Button or Expand Indicator */}
                {!isExpanded && (
                    <div className="self-center -mr-2">
                        {storageKey ? (
                            <button
                                onClick={dismiss}
                                className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg transition-all"
                                title="Dismiss"
                            >
                                <XMarkIcon className="w-4 h-4" stroke="currentColor" strokeWidth={2} />
                            </button>
                        ) : (
                            <div className="p-2 text-slate-400" title="Click to expand">
                                <ChevronDownIcon className="w-4 h-4" stroke="currentColor" strokeWidth={2} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
