declare module "*.jpg" {
    const src: string;
    export default src;
}

declare module "*.png" {
    const src: string;
    export default src;
}

interface ImportMeta {
    readonly env: Record<string, string | undefined>;
}

interface Window {
    playerSide: string;
    allCards: any[];
    Peer: new (options?: object) => any;
    sendMessage: (message: object) => void;
    sendMessageImmediate: (message: object) => void;
}
