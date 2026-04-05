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
                    if (!document.querySelector("#" + message.entityId)) {
                        element = createDeck(...message.content)
                        if (message.perspective !== window.playerSide) {
                            flipElement(element, document.querySelector("body").getBoundingClientRect())
                        }
                        snapToGrid(element)
                    }
                    break;

                case "card":
                    if (!document.querySelector("#" + message.entityId)) {
                        element = createCard(...message.content)
                        if (message.perspective !== window.playerSide) {
                            flipElement(element, document.querySelector("body").getBoundingClientRect())
                        }
                        snapToGrid(element)
                    }
                    break;

                case "token":
                    if (!document.querySelector("#" + message.entityId)) {
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
            element = document.querySelector("#" + message.entityId)
            element.style.left = message.content.x + "px"
            element.style.top = message.content.y + "px"
            if (message.perspective !== window.playerSide) {
                flipElement(element, document.querySelector("body").getBoundingClientRect())
            }
            element.dispatchEvent(new CustomEvent("grab", {detail: {targetX: message.x, targetY: message.y}}))
            break;
        
        case "move-element":
            element = document.querySelector("#" + message.entityId)
            element.style.left = message.content.x + "px"
            element.style.top = message.content.y + "px"
            if (message.perspective !== window.playerSide) {
                flipElement(element, document.querySelector("body").getBoundingClientRect())
            }
            element.dispatchEvent(new CustomEvent("move", {detail: {targetX: message.x, targetY: message.y}}))
            break;

        case "ungrab-element":
            element = document.querySelector("#" + message.entityId)
            element.style.left = message.content.x + "px"
            element.style.top = message.content.y + "px"
            if (message.perspective !== window.playerSide) {
                flipElement(element, document.querySelector("body").getBoundingClientRect())
            }
            element.dispatchEvent(new CustomEvent("ungrab", {detail: {targetX: message.x, targetY: message.y}}))
            break;
    }
}

export const setupP2P = () => {
    const peer = new window.Peer({
        key: "netrunner",
        debug: 4,
        config: {
            iceServers: [
                {
                    urls: "turn:global.relay.metered.ca:80",
                    username: "0216de3689c0327b92c21461",
                    credential: "fAMGCn8IVFAJA0ZZ"
                }
            ]
        }
    })
    
    peer.on("open", id => {
        const yourHostId = document.querySelector("#your-host-id")
        yourHostId.value = id
        window.location.hash = id
    
        const opponentHostId = document.querySelector("#opponent-host-id")
        opponentHostId.value = ""
    })

    peer.on("connection", (connection) => {
        setupP2PConnection(connection)
        document.querySelector("#start-game-panel").remove()
        window.playerSide = "corp"
        document.querySelector("#open-player-panel").click()
    })

    peer.on("error", err => {
        console.error("PeerJS error:", err.type, err)
        alert(`Connection error (${err.type}). Please check the host ID and try again.`)
    })

    const setupP2PConnection = (connection) => {
        const parser = new DOMParser()
        window.sendMessage = throttle((message) => connection.send(message), 200)
    
        connection.on("data", message => {
            console.log(`Peer:`, message)
            receiveMessage(message)
        })
    
        connection.on("open", () => {
            console.log("Connection established. You can send messages now.")
        })
    
        connection.on("close", () => {
            console.log("Data connection has been closed.")
        });

        connection.on("error", err => {
            console.error("Connection error:", err.type, err)
        })
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
        window.playerSide = "corp"
        document.querySelector("#open-player-panel").click()
    })
    
    document.querySelector("#play-solo").addEventListener("click", e => {
        document.querySelector("#start-game-panel").remove()
        window.playerSide = "corp"
        setupGame()
    })
}
