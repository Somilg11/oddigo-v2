const isDev = import.meta.env.DEV;

export const logger = {
    error: (...args: unknown[]) => {
        if (isDev) console.error("[ERROR]", ...args);
    },
    warn: (...args: unknown[]) => {
        if (isDev) console.warn("[WARN]", ...args);
    },
    info: (...args: unknown[]) => {
        if (isDev) console.info("[INFO]", ...args);
    },
    debug: (...args: unknown[]) => {
        if (isDev) console.debug("[DEBUG]", ...args);
    },
};
