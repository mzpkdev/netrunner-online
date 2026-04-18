/// <reference types="vite/client" />

interface Window {
    playerSide: string;
    allCards: any[];
    sendMessage: (message: any) => void;
    Peer: any;
}
