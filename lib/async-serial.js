/**
 * Serializes async tasks so only one runs at a time (FIFO).
 * Later callers wait for earlier ones; failures do not break the chain.
 *
 * Used to prevent overlapping native notification syncs from racing:
 * an older enable/schedule finishing after a newer cancel/disable.
 */
export function createAsyncSerial() {
    let chain = Promise.resolve();
    return function enqueue(task) {
        const run = chain.then(() => task());
        chain = run.then(
            () => {},
            () => {}
        );
        return run;
    };
}
