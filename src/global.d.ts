// Vite injects import.meta.env at build time; declare the properties used in
// this project so the type checker can verify access patterns.
interface ImportMetaEnv {
    readonly VITE_TURN_CREDENTIAL: string | undefined;
    [key: string]: string | boolean | undefined;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

// ---------------------------------------------------------------------------
// Asset module declarations
// ---------------------------------------------------------------------------

declare module "*.jpg" {
    const src: string;
    export default src;
}

// ---------------------------------------------------------------------------
// PeerJS minimal structural types
//
// PeerJS is injected via a CDN script tag with no bundled types. Only the
// surface actually called by p2p.js is described here. Each event overload
// is listed explicitly so that callback argument types are inferred correctly
// at call sites without requiring any casts in application code.
// ---------------------------------------------------------------------------

interface PeerConnection {
    send(message: unknown): void;
    on(event: "data", callback: (message: import('./scripts/types.ts').P2PMessage) => void): void;
    on(event: "open" | "close", callback: () => void): void;
    on(event: string, callback: (...args: unknown[]) => void): void;
}

interface PeerInstance {
    on(event: "open", callback: (id: string) => void): void;
    on(event: "connection", callback: (connection: PeerConnection) => void): void;
    on(event: "error", callback: (err: { type: string }) => void): void;
    on(event: string, callback: (...args: unknown[]) => void): void;
    connect(id: string): PeerConnection;
}

// ---------------------------------------------------------------------------
// Global window extensions
// ---------------------------------------------------------------------------

interface Window {
    /** Which side this client is playing. Set before setupGame() is called. */
    playerSide: "corp" | "runner";
    /** Full card catalogue fetched from NetrunnerDB, populated by main(). */
    allCards: {
        title: string;
        side_code: string;
        faction_code: string;
        type_code: string;
        image: string;
        code?: string;
    }[];
    /** Throttled P2P send — set up by setupP2PConnection(). */
    sendMessage: (message: unknown) => void;
    /** Immediate P2P send — set up by setupP2PConnection(). */
    sendMessageImmediate: (message: unknown) => void;
    /** PeerJS constructor injected via CDN script tag. */
    Peer: new (options?: unknown) => PeerInstance;
}

// ---------------------------------------------------------------------------
// Element augmentation
//
// document.querySelector() returns Element in the lib, but every queried
// element in this application is an HTML element.  Adding the HTML
// properties that are accessed throughout the codebase avoids per-call casts.
// ---------------------------------------------------------------------------

interface Element {
    style: CSSStyleDeclaration;
    value: string;
    checked: boolean;
    disabled: boolean;
    select(): void;
    focus(): void;
    click(): void;
    innerText: string;
    src: string;
}

// ---------------------------------------------------------------------------
// Event augmentation
//
// Custom events ("grab", "move", "puttop", etc.) and pointer events accessed
// through Element.addEventListener fall back to the generic Event type.
// Adding the properties used throughout the codebase avoids per-handler casts.
// ---------------------------------------------------------------------------

interface Event {
    /** Present on CustomEvent; typed as any to allow arbitrary detail shapes. */
    // biome-ignore lint/suspicious/noExplicitAny: detail carries arbitrary custom-event payloads; the shapes differ per event and narrowing at call sites would require casts throughout application code
    detail: any;
    clientX: number;
    clientY: number;
    button: number;
}
