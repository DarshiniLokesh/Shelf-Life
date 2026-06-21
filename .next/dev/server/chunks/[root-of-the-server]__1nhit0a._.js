module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
;
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]();
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = prisma;
}),
"[project]/src/lib/auth-server.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "validateRequestUser",
    ()=>validateRequestUser
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
;
async function validateRequestUser(req) {
    const userId = req.headers.get('x-user-id');
    const userToken = req.headers.get('x-user-token');
    if (!userId || !userToken) {
        return null;
    }
    try {
        const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user || user.token !== userToken) {
            return null;
        }
        return user;
    } catch (e) {
        console.error('[Auth Helper] Error validating user:', e);
        return null;
    }
}
}),
"[project]/src/lib/validation.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "validateItemInput",
    ()=>validateItemInput
]);
function validateItemInput(input) {
    if (!input || typeof input !== 'object') {
        return {
            error: 'Invalid request body.'
        };
    }
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    const category = input.category;
    const quantityType = input.quantityType;
    const quantityValue = input.quantityValue;
    const unit = input.unit;
    const expiryDate = input.expiryDate;
    // Name validation
    if (!name) {
        return {
            error: 'Item name is required and cannot be empty.'
        };
    }
    if (name.length > 50) {
        return {
            error: 'Item name cannot exceed 50 characters.'
        };
    }
    // Category validation
    const validCategories = [
        'Produce',
        'Dairy',
        'Grain',
        'Spice',
        'Frozen',
        'Other'
    ];
    if (!category || !validCategories.includes(category)) {
        return {
            error: `Category must be one of: ${validCategories.join(', ')}`
        };
    }
    // Quantity structure validation
    const validQuantityTypes = [
        'count',
        'weight',
        'boolean'
    ];
    if (!quantityType || !validQuantityTypes.includes(quantityType)) {
        return {
            error: 'Quantity type must be "count", "weight", or "boolean".'
        };
    }
    let finalValue = null;
    let finalUnit = null;
    if (quantityType === 'count') {
        if (typeof quantityValue !== 'number' || isNaN(quantityValue) || quantityValue <= 0) {
            return {
                error: 'For Count, quantity must be a positive number.'
            };
        }
        finalValue = quantityValue;
        finalUnit = typeof unit === 'string' ? unit.trim() : null;
    } else if (quantityType === 'weight') {
        if (typeof quantityValue !== 'number' || isNaN(quantityValue) || quantityValue <= 0) {
            return {
                error: 'For Weight, quantity must be a positive number.'
            };
        }
        if (unit !== 'g' && unit !== 'kg') {
            return {
                error: 'For Weight, unit must be either "g" or "kg".'
            };
        }
        finalValue = quantityValue;
        finalUnit = unit;
    } else if (quantityType === 'boolean') {
        if (quantityValue !== null && quantityValue !== undefined) {
            return {
                error: 'For Presence Only, quantity value must be empty/null.'
            };
        }
        finalValue = null;
        finalUnit = null;
    }
    // Expiry Date validation
    let finalExpiry = null;
    if (expiryDate) {
        const parsedDate = new Date(expiryDate);
        if (isNaN(parsedDate.getTime())) {
            return {
                error: 'Expiry date is invalid.'
            };
        }
        finalExpiry = parsedDate.toISOString();
    }
    return {
        validatedData: {
            name,
            category: category,
            quantityType: quantityType,
            quantityValue: finalValue,
            unit: finalUnit,
            expiryDate: finalExpiry
        }
    };
}
}),
"[project]/src/lib/events.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "broadcastUpdate",
    ()=>broadcastUpdate,
    "clients",
    ()=>clients,
    "registerClient",
    ()=>registerClient,
    "unregisterClient",
    ()=>unregisterClient
]);
// Global in-memory registry of active Server-Sent Event connections
const globalForEvents = globalThis;
if (!globalForEvents.clients) {
    globalForEvents.clients = new Set();
}
const clients = globalForEvents.clients;
function registerClient(id, controller) {
    clients.add({
        id,
        controller
    });
    console.log(`[SSE] Client registered: ${id}. Total active clients: ${clients.size}`);
}
function unregisterClient(id) {
    let found = false;
    for (const client of clients){
        if (client.id === id) {
            clients.delete(client);
            found = true;
            break;
        }
    }
    if (found) {
        console.log(`[SSE] Client unregistered: ${id}. Total active clients: ${clients.size}`);
    }
}
function broadcastUpdate(type, item) {
    const payload = JSON.stringify({
        type,
        item,
        timestamp: new Date().toISOString()
    });
    const formattedMessage = `data: ${payload}\n\n`;
    const encoder = new TextEncoder();
    const encodedMessage = encoder.encode(formattedMessage);
    console.log(`[SSE] Broadcasting event "${type}" to ${clients.size} clients.`);
    for (const client of clients){
        try {
            client.controller.enqueue(encodedMessage);
        } catch (e) {
            console.warn(`[SSE] Failed to send to client ${client.id}, removing client.`);
            clients.delete(client);
        }
    }
}
}),
"[project]/src/app/api/items/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2d$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth-server.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/validation.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$events$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/events.ts [app-route] (ecmascript)");
;
;
;
;
;
const dynamic = 'force-dynamic';
async function GET(req) {
    try {
        const items = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].item.findMany({
            include: {
                addedBy: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                lastTouchedBy: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                usedUpBy: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(items);
    } catch (error) {
        console.error('GET /api/items error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to retrieve inventory items.'
        }, {
            status: 500
        });
    }
}
async function POST(req) {
    try {
        // 1. Authenticate user
        const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2d$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateRequestUser"])(req);
        if (!user) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Unauthorized. Please log in first.'
            }, {
                status: 401
            });
        }
        // 2. Parse and validate body
        const body = await req.json().catch(()=>({}));
        const { error, validatedData } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateItemInput"])(body);
        if (error || !validatedData) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error
            }, {
                status: 400
            });
        }
        // 3. Create the item in database
        const item = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].item.create({
            data: {
                name: validatedData.name,
                category: validatedData.category,
                quantityType: validatedData.quantityType,
                quantityValue: validatedData.quantityValue,
                unit: validatedData.unit,
                expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : null,
                status: 'active',
                addedById: user.id,
                lastTouchedById: user.id
            },
            include: {
                addedBy: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                lastTouchedBy: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                usedUpBy: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        // 4. Broadcast event in real-time
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$events$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["broadcastUpdate"])('create', item);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(item, {
            status: 201
        });
    } catch (error) {
        console.error('POST /api/items error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to create inventory item.'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1nhit0a._.js.map