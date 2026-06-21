(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/UserContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "UserProvider",
    ()=>UserProvider,
    "useUser",
    ()=>useUser
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
const UserContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function UserProvider({ children }) {
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "UserProvider.useEffect": ()=>{
            // Read from localStorage on mount
            try {
                const stored = localStorage.getItem('shelf_life_user');
                if (stored) {
                    setUser(JSON.parse(stored));
                }
            } catch (e) {
                console.error('Error reading user from localStorage:', e);
            } finally{
                setLoading(false);
            }
        }
    }["UserProvider.useEffect"], []);
    const login = async (name, token)=>{
        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    token
                })
            });
            const data = await res.json();
            if (!res.ok) {
                return {
                    success: false,
                    error: data.error || 'Authentication failed'
                };
            }
            if (data.error === 'username_taken') {
                return {
                    success: false,
                    requiresPin: true,
                    error: data.message
                };
            }
            // Successful registration or login
            const authenticatedUser = {
                id: data.id,
                name: data.name,
                token: data.token
            };
            localStorage.setItem('shelf_life_user', JSON.stringify(authenticatedUser));
            setUser(authenticatedUser);
            return {
                success: true
            };
        } catch (e) {
            console.error('Login error:', e);
            return {
                success: false,
                error: 'Could not connect to the server. Please try again.'
            };
        }
    };
    const logout = ()=>{
        localStorage.removeItem('shelf_life_user');
        setUser(null);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(UserContext.Provider, {
        value: {
            user,
            loading,
            login,
            logout
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/UserContext.tsx",
        lineNumber: 80,
        columnNumber: 5
    }, this);
}
_s(UserProvider, "NiO5z6JIqzX62LS5UWDgIqbZYyY=");
_c = UserProvider;
function useUser() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
_s1(useUser, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "UserProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_components_UserContext_tsx_17vxkms._.js.map