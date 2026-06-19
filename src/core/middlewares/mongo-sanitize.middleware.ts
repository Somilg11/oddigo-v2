const TEST_REGEX = /^\$|\./;
const TEST_REGEX_WITHOUT_DOT = /^\$/;
const REPLACE_REGEX = /^\$|\./g;

function isPlainObject(obj: unknown): obj is Record<string, unknown> {
    return typeof obj === 'object' && obj !== null;
}

function getTestRegex(allowDots?: boolean) {
    return allowDots ? TEST_REGEX_WITHOUT_DOT : TEST_REGEX;
}

function withEach(target: unknown, cb: (obj: Record<string, unknown>, val: unknown, key: string) => { shouldRecurse: boolean; key?: string }) {
    (function act(obj: unknown) {
        if (Array.isArray(obj)) {
            obj.forEach(act);
        } else if (isPlainObject(obj)) {
            Object.keys(obj).forEach((key) => {
                const val = obj[key];
                const resp = cb(obj, val, key);
                if (resp.shouldRecurse) {
                    act(obj[resp.key || key]);
                }
            });
        }
    })(target);
}

function _sanitize(target: unknown, options: { allowDots?: boolean; replaceWith?: string; dryRun?: boolean }) {
    const regex = getTestRegex(options.allowDots);
    let isSanitized = false;
    let replaceWith: string | null = null;
    const dryRun = Boolean(options.dryRun);

    if (!regex.test(options.replaceWith || '') && options.replaceWith !== '.') {
        replaceWith = options.replaceWith || null;
    }

    withEach(target, (obj, val, key) => {
        let shouldRecurse = true;

        if (regex.test(key)) {
            isSanitized = true;
            if (dryRun) {
                return { shouldRecurse, key };
            }
            delete obj[key];
            if (replaceWith) {
                key = key.replace(REPLACE_REGEX, replaceWith);
                if (key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
                    obj[key] = val;
                }
            } else {
                shouldRecurse = false;
            }
        }

        return { shouldRecurse, key };
    });

    return { isSanitized, target };
}

export function mongoSanitizeMiddleware(options: { allowDots?: boolean; replaceWith?: string; dryRun?: boolean } = {}) {
    return function mongoSanitize(req: any, _res: unknown, next: () => void) {
        for (const key of ['body', 'params', 'headers']) {
            if (req[key]) {
                _sanitize(req[key], options);
            }
        }
        if (req.query) {
            _sanitize(req.query, options);
        }
        next();
    };
}
