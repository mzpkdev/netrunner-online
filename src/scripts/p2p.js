import { setupGame } from "./game.js"
import { throttle, snapToGrid, flipElement } from "./utils.js"
import { createCard } from "./card.js"
import { createDeck } from "./deck.js"
import { createToken } from "./token.js"

window.sendMessage = () => {}

export function sendCreateMessage(entity, id, params) {
    window.sendMessage({
        perspective: window.playerSide,
        messageType: "create-element",
        entityType: entity,
        entityId: id,
        content: params
    })
}

export function sendGrabMessage(id, x, y) {
    window.sendMessage({
        perspective: window.playerSide,
        messageType: "grab-element",
        entityId: id,
        content: {x: x, y: y}
    })
}

export function sendMoveMessage(id, x, y) {
    window.sendMessage({
        perspective: window.playerSide,
        messageType: "move-element",
        entityId: id,
        content: {x: x, y: y}
    })
}

export function sendUngrabMessage(id, x, y) {
    window.sendMessage({
        perspective: window.playerSide,
        messageType: "ungrab-element",
        entityId: id,
        content: {x: x, y: y}
    })
}

export function receiveMessage(message) {
    let element = null
    switch (message.messageType) {
        case "create-element":
            switch (message.entityType) {
                case "deck":
                    if (!document.querySelector(`#${message.entityId}`)) {
                        element = createDeck(...message.content)
                        if (message.perspective !== window.playerSide) {
                            flipElement(element, document.querySelector("body").getBoundingClientRect())
                        }
                        snapToGrid(element)
                    }
                    break;

                case "card":
                    if (!document.querySelector(`#${message.entityId}`)) {
                        element = createCard(...message.content)
                        if (message.perspective !== window.playerSide) {
                            flipElement(element, document.querySelector("body").getBoundingClientRect())
                        }
                        snapToGrid(element)
                    }
                    break;

                case "token":
                    if (!document.querySelector(`#${message.entityId}`)) {
                        element = createToken(...message.content)
                        if (message.perspective !== window.playerSide) {
                            flipElement(element, document.querySelector("body").getBoundingClientRect())
                        }
                        snapToGrid(element)
                    }
                    break;
            }
            break;

        case "grab-element":
            element = document.querySelector(`#${message.entityId}`)
            if (!element) {
                console.warn(`receiveMessage: grab-element ignored — no element with id "${message.entityId}"`)
                break
            }
            element.style.left = `${message.content.x}px`
            element.style.top = `${message.content.y}px`
            if (message.perspective !== window.playerSide) {
                flipElement(element, document.querySelector("body").getBoundingClientRect())
            }
            element.dispatchEvent(new CustomEvent("grab", {detail: {targetX: message.content.x, targetY: message.content.y}}))
            break;

        case "move-element":
            element = document.querySelector(`#${message.entityId}`)
            if (!element) {
                console.warn(`receiveMessage: move-element ignored — no element with id "${message.entityId}"`)
                break
            }
            element.style.left = `${message.content.x}px`
            element.style.top = `${message.content.y}px`
            if (message.perspective !== window.playerSide) {
                flipElement(element, document.querySelector("body").getBoundingClientRect())
            }
            element.dispatchEvent(new CustomEvent("move", {detail: {targetX: message.content.x, targetY: message.content.y}}))
            break;

        case "ungrab-element":
            element = document.querySelector(`#${message.entityId}`)
            if (!element) {
                console.warn(`receiveMessage: ungrab-element ignored — no element with id "${message.entityId}"`)
                break
            }
            element.style.left = `${message.content.x}px`
            element.style.top = `${message.content.y}px`
            if (message.perspective !== window.playerSide) {
                flipElement(element, document.querySelector("body").getBoundingClientRect())
            }
            element.dispatchEvent(new CustomEvent("ungrab", {detail: {targetX: message.content.x, targetY: message.content.y}}))
            break;
    }
}

function showP2PStatus(message, { bg = "#856404", color = "#fff3cd", border = "#ffc107" } = {}) {
    const el = document.querySelector("#p2p-status")
    if (!el) return
    el.textContent = message
    el.style.backgroundColor = bg
    el.style.color = color
    el.style.border = `1px solid ${border}`
    el.style.display = "block"
}

function getIceServers() {
    const credential = import.meta.env.VITE_TURN_CREDENTIAL
    if (!credential) {
        console.warn("VITE_TURN_CREDENTIAL not set, using STUN only")
        return [{ urls: "stun:stun.l.google.com:19302" }]
    }
    return [{
        urls: "turn:global.relay.metered.ca:80",
        username: "9370f3a45c11a0ae0dd13256",
        credential
    }]
}

export const setupP2P = () => {
    const peer = new window.Peer({
        key: "netrunner",
        debug: 4,
        config: { iceServers: getIceServers() }
    })
    
    peer.on("open", id => {
        const yourHostId = document.querySelector("#your-host-id")
        yourHostId.value = id
        window.location.hash = id

        const opponentHostId = document.querySelector("#opponent-host-id")
        opponentHostId.value = ""

        document.querySelector("#host-game").disabled = false
        document.querySelector("#join-game").disabled = false
    })

    peer.on("connection", (connection) => {
        setupP2PConnection(connection)
        document.querySelector("#start-game-panel").remove()
        window.playerSide = "corp"
        document.querySelector("#open-player-panel").click()
    })

    peer.on("error", (err) => {
        console.error(`PeerJS error [${err.type}]:`, err)
        showP2PStatus(`Connection error: ${err.type}`, { bg: "#721c24", color: "#f8d7da", border: "#f5c6cb" })
    })

    const setupP2PConnection = (connection) => {
        window.sendMessage = throttle((message) => connection.send(message), 200)
    
        connection.on("data", message => {
            console.log("Peer:", message)
            receiveMessage(message)
        })
    
        connection.on("open", () => {
            console.log("Connection established. You can send messages now.")
        })
    
        connection.on("close", () => {
            console.log("Data connection has been closed.")
            showP2PStatus("Opponent disconnected.")
        });
    }
    
    document.querySelector("#opponent-host-id").focus()
    
    document.querySelector("#host-game").addEventListener("click", e => {
        const yourHostId = document.querySelector("#your-host-id")
        yourHostId.select()
        navigator.clipboard.writeText(yourHostId.value)
    })
    
    document.querySelector("#join-game").addEventListener("click", e => {
        const opponentHostId = document.querySelector("#opponent-host-id")
        const connection = peer.connect(opponentHostId.value)
        setupP2PConnection(connection)
        document.querySelector("#start-game-panel").remove()
        window.playerSide = "runner"
        document.querySelector("#open-player-panel").click()
    })
    
    document.querySelector("#play-solo").addEventListener("click", e => {
        document.querySelector("#start-game-panel").remove()
        window.playerSide = "corp"
        setupGame()
    })
}
