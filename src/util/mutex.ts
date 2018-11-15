/* 
 * Copyright (C) 2018 Qli5. All Rights Reserved.
 * 
 * @author qli5 <goodlq11[at](163|gmail).com>
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * A simple emulation of pthread_mutex
 */
class Mutex {
    queueTail: Promise<void>
    resolveHead: () => void

    static readonly INIT_QUEUE_TAIL = Promise.resolve()
    static readonly INIT_RESOLVE_HEAD = () => { }
    constructor() {
        this.queueTail = Mutex.INIT_QUEUE_TAIL;
        this.resolveHead = Mutex.INIT_RESOLVE_HEAD;
    }

    /** 
     * await mutex.lock = pthread_mutex_lock
     * @returns a promise that resolves when the lock is available
    */
    async lock() {
        const queueTail = this.queueTail;
        let myResolve: () => void;
        this.queueTail = new Promise(resolve => myResolve = resolve);
        await queueTail;
        this.resolveHead = myResolve!;
    }

    /**
     * mutex.unlock = pthread_mutex_unlock
     */
    unlock() {
        this.resolveHead();
    }

    /**
     * a convenient method for
     * lock -> ret = await async -> unlock -> return ret
     * 
     * @param callback function to call once lock is acquired
     */
    async lockAndAwait<T>(callback: (() => Promise<T>) | (() => T) | T) {
        await this.lock();
        try {
            if (typeof callback === 'function') {
                return await (callback as () => T)();
            }
            else {
                return await callback;
            }
        }
        finally {
            this.unlock();
        }
    }
}

const _UNIT_TEST = () => {
    let m = new Mutex();
    function sleep(time: number) {
        return new Promise(r => setTimeout(r, time));
    }
    m.lockAndAwait(() => {
        console.warn('Check message timestamps.');
        console.warn('Bad:');
        console.warn('1 1 1 1 1:5s');
        console.warn(' 1 1 1 1 1:10s');
        console.warn('Good:');
        console.warn('1 1 1 1 1:5s');
        console.warn('         1 1 1 1 1:10s');
    });
    m.lockAndAwait(async () => {
        await sleep(1000);
        await sleep(1000);
        await sleep(1000);
        await sleep(1000);
        await sleep(1000);
    });
    m.lockAndAwait(async () => console.log('5s!'));
    m.lockAndAwait(async () => {
        await sleep(1000);
        await sleep(1000);
        await sleep(1000);
        await sleep(1000);
        await sleep(1000);
    });
    m.lockAndAwait(async () => console.log('10s!'));
};

export default Mutex;
