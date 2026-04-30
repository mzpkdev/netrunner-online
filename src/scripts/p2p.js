import { createCard } from "./card.js";
import { createDeck } from "./deck.js";
import { setupGame } from "./game.js";
import { createToken } from "./token.js";
import { flipElement, snapToGrid, throttle } from "./utils.js";

window.sendMessage = () => {};
window.sendMessageImmediate = () => {};

/** @type {ReturnType<typeof setInterval> | null} */
let _heartbeatIntervalId = null;
let _missedPings = 0;
let _heartbeatBannerVisible = false;

/**
 * @param {string} entity
 * @param {string} id
 * @param {any[]} params
 */
export function sendCreateMessage(entity, id, params) {
    window.sendMessage({
        perspective: window.playerSide,
        messageType: "create-element",
        entityType: entity,
        entityId: id,
        content: params,
    });
}

/**
 * @param {string} id
 * @param {number} x
 * @param {number} y
 */
export function sendGrabMessage(id, x, y) {
    window.sendMessage({
        perspective: window.playerSide,
        messageType: "grab-element",
        entityId: id,
        content: { x: x, y: y },
    });
}

/**
 * @param {string} id
 * @param {number} x
 * @param {number} y
 */
export function sendMoveMessage(id, x, y) {
    window.sendMessage({
        perspective: window.playerSide,
        messageType: "move-element",
        entityId: id,
        content: { x: x, y: y },
    });
}

/**
 * @param {string} id
 * @param {number} x
 * @param {number} y
 */
export function sendUngrabMessage(id, x, y) {
    window.sendMessage({
        perspective: window.playerSide,
        messageType: "ungrab-element",
        entityId: id,
        content: { x: x, y: y },
    });
}

/**
 * @param {string} id
 */
export function sendDeleteMessage(id) {
    window.sendMessageImmediate({
        perspective: window.playerSide,
        messageType: "delete-element",
        entityId: id,
    });
}

/**
 * @param {string} id
 * @param {boolean} flipped
 */
export function sendFlipMessage(id, flipped) {
    window.sendMessageImmediate({
        perspective: window.playerSide,
        messageType: "flip-element",
        entityId: id,
        content: { flipped: flipped },
    });
}

/**
 * @param {string} id
 * @param {boolean} rotated
 */
export function sendRotateMessage(id, rotated) {
    window.sendMessageImmediate({
        perspective: window.playerSide,
        messageType: "rotate-element",
        entityId: id,
        content: { rotated: rotated },
    });
}

/**
 * @param {object} message
 * @returns {void}
 */
export function receiveMessage(message) {
    if (!message || !message.messageType) {
        console.warn(
            "receiveMessage: ignored — message is null, undefined, or missing messageType",
            message,
        );
        return;
    }
    /** @type {HTMLElement | null} */
    let element = null;
    switch (message.messageType) {
        case "create-element":
            if (!message.entityType || !message.entityId || !message.content) {
                console.warn(
                    "receiveMessage: create-element ignored — missing entityType, entityId, or content",
                    message,
                );
                break;
            }
            switch (message.entityType) {
                case "deck":
                    if (!document.querySelector(`#${message.entityId}`)) {
                        // @ts-ignore -- content is a runtime-typed array; spread to positional params is safe here
                        element = createDeck(...message.content);
                        if (message.perspective !== window.playerSide) {
                            flipElement(
                                element,
                                /** @type {HTMLElement} */ (document.querySelector("body")).getBoundingClientRect(),
                            );
                        }
                        snapToGrid(element);
                    }
                    break;

                case "card":
                    if (!document.querySelector(`#${message.entityId}`)) {
                        // @ts-ignore -- content is a runtime-typed array; spread to positional params is safe here
                        element = createCard(...message.content);
                        if (message.perspective !== window.playerSide) {
                            flipElement(
                                element,
                                /** @type {HTMLElement} */ (document.querySelector("body")).getBoundingClientRect(),
                            );
                        }
                        snapToGrid(element);
                    }
                    break;

                case "token":
                    if (!document.querySelector(`#${message.entityId}`)) {
                        // @ts-ignore -- content is a runtime-typed array; spread to positional params is safe here
                        element = createToken(...message.content);
                        if (message.perspective !== window.playerSide) {
                            flipElement(
                                element,
                                /** @type {HTMLElement} */ (document.querySelector("body")).getBoundingClientRect(),
                            );
                        }
                        snapToGrid(element);
                    }
                    break;

                default:
                    console.warn(
                        `receiveMessage: create-element — unknown entityType "${message.entityType}"`,
                        message,
                    );
                    break;
            }
            break;

        case "grab-element":
            element = /** @type {HTMLElement | null} */ (document.querySelector(`#${message.entityId}`));
            if (!element) {
                console.warn(
                    `receiveMessage: grab-element ignored — no element with id "${message.entityId}"`,
                );
                break;
            }
            if (
                !message.content ||
                typeof message.content.x !== "number" ||
                typeof message.content.y !== "number"
            ) {
                console.warn(
                    "receiveMessage: grab-element ignored — content is falsy or coordinates are non-numeric",
                    message,
                );
                break;
            }
            element.style.left = `${message.content.x}px`;
            element.style.top = `${message.content.y}px`;
            if (message.perspective !== window.playerSide) {
                flipElement(
                    element,
                    /** @type {HTMLElement} */ (document.querySelector("body")).getBoundingClientRect(),
                );
            }
            element.dispatchEvent(
                new CustomEvent("grab", {
                    detail: {
                        targetX: message.content.x,
                        targetY: message.content.y,
                    },
                }),
            );
            break;

        case "move-element":
            element = /** @type {HTMLElement | null} */ (document.querySelector(`#${message.entityId}`));
            if (!element) {
                console.warn(
                    `receiveMessage: move-element ignored — no element with id "${message.entityId}"`,
                );
                break;
            }
            if (
                !message.content ||
                typeof message.content.x !== "number" ||
                typeof message.content.y !== "number"
            ) {
                console.warn(
                    "receiveMessage: move-element ignored — content is falsy or coordinates are non-numeric",
                    message,
                );
                break;
            }
            element.style.left = `${message.content.x}px`;
            element.style.top = `${message.content.y}px`;
            if (message.perspective !== window.playerSide) {
                flipElement(
                    element,
                    /** @type {HTMLElement} */ (document.querySelector("body")).getBoundingClientRect(),
                );
            }
            element.dispatchEvent(
                new CustomEvent("move", {
                    detail: {
                        targetX: message.content.x,
                        targetY: message.content.y,
                    },
                }),
            );
            break;

        case "ungrab-element":
            element = /** @type {HTMLElement | null} */ (document.querySelector(`#${message.entityId}`));
            if (!element) {
                console.warn(
                    `receiveMessage: ungrab-element ignored — no element with id "${message.entityId}"`,
                );
                break;
            }
            if (
                !message.content ||
                typeof message.content.x !== "number" ||
                typeof message.content.y !== "number"
            ) {
                console.warn(
                    "receiveMessage: ungrab-element ignored — content is falsy or coordinates are non-numeric",
                    message,
                );
                break;
            }
            element.style.left = `${message.content.x}px`;
            element.style.top = `${message.content.y}px`;
            if (message.perspective !== window.playerSide) {
                flipElement(
                    element,
                    /** @type {HTMLElement} */ (document.querySelector("body")).getBoundingClientRect(),
                );
            }
            element.dispatchEvent(
                new CustomEvent("ungrab", {
                    detail: {
                        targetX: message.content.x,
                        targetY: message.content.y,
                    },
                }),
            );
            break;

        case "flip-element":
            element = /** @type {HTMLElement | null} */ (document.querySelector(`#${message.entityId}`));
            if (!element) {
                console.warn(
                    `receiveMessage: flip-element ignored — no element with id "${message.entityId}"`,
                );
                break;
            }
            element.classList.toggle("flipped", message.content.flipped);
            break;

        case "rotate-element":
            element = /** @type {HTMLElement | null} */ (document.querySelector(`#${message.entityId}`));
            if (!element) {
                console.warn(
                    `receiveMessage: rotate-element ignored — no element with id "${message.entityId}"`,
                );
                break;
            }
            element.classList.toggle("rotated", message.content.rotated);
            break;

        case "delete-element":
            element = /** @type {HTMLElement | null} */ (document.querySelector(`#${message.entityId}`));
            if (!element) {
                console.warn(
                    `receiveMessage: delete-element ignored — no element with id "${message.entityId}"`,
                );
                break;
            }
            element.remove();
            break;

        case "heartbeat":
            _missedPings = 0;
            if (_heartbeatBannerVisible) {
                const statusEl = /** @type {HTMLElement | null} */ (document.querySelector("#p2p-status"));
                if (statusEl) statusEl.style.display = "none";
                _heartbeatBannerVisible = false;
            }
            break;

        default:
            console.warn(
                `receiveMessage: unknown messageType "${/** @type {any} */ (message).messageType}"`,
                message,
            );
            break;
    }
}

/**
 * @param {string} message
 * @param {{ bg?: string, color?: string, border?: string }} [style]
 */
function showP2PStatus(
    message,
    { bg = "#856404", color = "#fff3cd", border = "#ffc107" } = {},
) {
    const el = /** @type {HTMLElement | null} */ (document.querySelector("#p2p-status"));
    if (!el) return;
    el.textContent = message;
    el.style.backgroundColor = bg;
    el.style.color = color;
    el.style.border = `1px solid ${border}`;
    el.style.display = "block";
}

/**
 * @param {any} connection
 * @returns {ReturnType<typeof setInterval>}
 */
export function setupHeartbeat(connection) {
    _missedPings = 0;
    _heartbeatBannerVisible = false;
    if (_heartbeatIntervalId !== null) {
        clearInterval(_heartbeatIntervalId);
    }
    _heartbeatIntervalId = setInterval(() => {
        connection.send({ messageType: "heartbeat" });
        _missedPings++;
        if (_missedPings >= 3) {
            showP2PStatus("Opponent may have disconnected.", {
                bg: "#721c24",
                color: "#f8d7da",
                border: "#f5c6cb",
            });
            _heartbeatBannerVisible = true;
        }
    }, 5000);
    return _heartbeatIntervalId;
}

export function teardownHeartbeat() {
    if (_heartbeatIntervalId !== null) {
        clearInterval(_heartbeatIntervalId);
        _heartbeatIntervalId = null;
    }
    _missedPings = 0;
    _heartbeatBannerVisible = false;
}

function getIceServers() {
    const credential = import.meta.env.VITE_TURN_CREDENTIAL;
    if (!credential) {
        console.warn("VITE_TURN_CREDENTIAL not set, using STUN only");
        return [{ urls: "stun:stun.l.google.com:19302" }];
    }
    return [
        {
            urls: "turn:global.relay.metered.ca:80",
            username: "9370f3a45c11a0ae0dd13256",
            credential,
        },
    ];
}

export const setupP2P = () => {
    const peer = new window.Peer({
        key: "netrunner",
        debug: 4,
        config: { iceServers: getIceServers() },
    });

    peer.on("open", (/** @type {any} */ id) => {
        const yourHostId = /** @type {HTMLInputElement | null} */ (document.querySelector("#your-host-id"));
        if (yourHostId) yourHostId.value = id;
        window.location.hash = id;

        const opponentHostId = /** @type {HTMLInputElement | null} */ (document.querySelector("#opponent-host-id"));
        if (opponentHostId) opponentHostId.value = "";

        /** @type {HTMLButtonElement} */ (document.querySelector("#host-game")).disabled = false;
        /** @type {HTMLButtonElement} */ (document.querySelector("#join-game")).disabled = false;
    });

    peer.on("connection", (/** @type {any} */ connection) => {
        setupP2PConnection(connection);
        document.querySelector("#start-game-panel")?.remove();
        window.playerSide = "corp";
        /** @type {HTMLElement} */ (document.querySelector("#open-player-panel")).click();
    });

    peer.on("error", (/** @type {any} */ err) => {
        console.error(`PeerJS error [${err.type}]:`, err);
        showP2PStatus(`Connection error: ${err.type}`, {
            bg: "#721c24",
            color: "#f8d7da",
            border: "#f5c6cb",
        });
    });

    /** @param {any} connection */
    const setupP2PConnection = (connection) => {
        window.sendMessage = throttle(
            (/** @type {any} */ message) => connection.send(message),
            200,
        );
        window.sendMessageImmediate = (/** @type {any} */ message) => connection.send(message);

        connection.on("data", (/** @type {any} */ message) => {
            console.log("Peer:", message);
            receiveMessage(message);
        });

        connection.on("open", () => {
            console.log("Connection established. You can send messages now.");
            setupHeartbeat(connection);
        });

        connection.on("close", () => {
            console.log("Data connection has been closed.");
            teardownHeartbeat();
            showP2PStatus("Opponent disconnected.");
        });
    };

    /** @type {HTMLInputElement} */ (document.querySelector("#opponent-host-id")).focus();

    document.querySelector("#host-game")?.addEventListener("click", (e) => {
        const yourHostId = /** @type {HTMLInputElement} */ (document.querySelector("#your-host-id"));
        yourHostId.select();
        navigator.clipboard.writeText(yourHostId.value);
    });

    document.querySelector("#join-game")?.addEventListener("click", (e) => {
        const opponentHostId = /** @type {HTMLInputElement} */ (document.querySelector("#opponent-host-id"));
        const connection = peer.connect(opponentHostId.value);
        setupP2PConnection(connection);
        document.querySelector("#start-game-panel")?.remove();
        window.playerSide = "runner";
        /** @type {HTMLElement} */ (document.querySelector("#open-player-panel")).click();
    });

    document.querySelector("#play-solo")?.addEventListener("click", (e) => {
        document.querySelector("#start-game-panel")?.remove();
        window.playerSide = "corp";
        setupGame();
    });
};
