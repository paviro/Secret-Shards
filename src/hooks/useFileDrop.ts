import { useState, useRef, type DragEvent } from 'react';

interface UseFileDropOptions {
    onFiles: (files: File[]) => void;
}

export function useFileDrop({ onFiles }: UseFileDropOptions) {
    const [isDragOver, setIsDragOver] = useState(false);
    const dragCounter = useRef(0);

    const isFileDrag = (event: DragEvent<HTMLElement>) => {
        const types = event.dataTransfer?.types;
        if (!types) return false;
        return Array.from(types).includes('Files');
    };

    const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
        if (!isFileDrag(event)) return;
        event.preventDefault();
        dragCounter.current += 1;
        setIsDragOver(true);
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        if (!isFileDrag(event)) return;
        event.preventDefault();
        dragCounter.current = Math.max(0, dragCounter.current - 1);
        if (dragCounter.current === 0) {
            setIsDragOver(false);
        }
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        if (!isFileDrag(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        if (!isFileDrag(event)) return;
        event.preventDefault();
        dragCounter.current = 0;
        setIsDragOver(false);
        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            onFiles(Array.from(event.dataTransfer.files));
        }
    };

    return {
        isDragOver,
        handleDragEnter,
        handleDragLeave,
        handleDragOver,
        handleDrop
    };
}
