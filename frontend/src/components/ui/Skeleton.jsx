import React from 'react';
import { cn } from './cn';

export function Skeleton({ className }) {
    return <div className={cn('animate-pulse rounded-md bg-slate-200', className)} />;
}

export function SkeletonText({ lines = 2, className }) {
    return (
        <div className={cn('space-y-2', className)}>
            {Array.from({ length: lines }).map((_, index) => (
                <Skeleton key={index} className={cn('h-3', index === lines - 1 ? 'w-2/3' : 'w-full')} />
            ))}
        </div>
    );
}

export function ChatItemSkeleton({ count = 5 }) {
    return (
        <div className="divide-y divide-slate-100">
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 px-4 py-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="min-w-0 flex-1">
                        <Skeleton className="mb-2 h-3 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-3 w-8" />
                </div>
            ))}
        </div>
    );
}

export function MessageBubbleSkeleton({ count = 4 }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, index) => {
                const isMine = index % 2 === 1;
                return (
                    <div key={index} className={cn('flex items-end gap-2', isMine ? 'justify-end' : 'justify-start')}>
                        {!isMine && <Skeleton className="h-7 w-7 rounded-full" />}
                        <Skeleton className={cn('h-10 rounded-2xl', isMine ? 'w-48' : 'w-56')} />
                        {isMine && <div className="h-7 w-7" />}
                    </div>
                );
            })}
        </div>
    );
}
