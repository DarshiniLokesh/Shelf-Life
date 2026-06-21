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
"[project]/src/app/api/events/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$events$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/events.ts [app-route] (ecmascript)");
;
const dynamic = 'force-dynamic';
async function GET(req) {
    const clientId = Math.random().toString(36).substring(2, 15);
    const stream = new ReadableStream({
        start (controller) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$events$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerClient"])(clientId, controller);
            // Send initial comment to establish connection and satisfy stream opening
            try {
                controller.enqueue(new TextEncoder().encode(': keepalive\n\n'));
            } catch (e) {
                console.error('[SSE] Failed to enqueue initial keepalive:', e);
            }
            req.signal.addEventListener('abort', ()=>{
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$events$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["unregisterClient"])(clientId);
            });
        },
        cancel () {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$events$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["unregisterClient"])(clientId);
        }
    });
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive'
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0-8j_7m._.js.map