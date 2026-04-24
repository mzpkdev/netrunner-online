/** The side a player is playing from. */
export type PlayerSide = "corp" | "runner";

/** The kind of entity that can be created in the game. */
export type EntityType = "deck" | "card" | "token";

/** Names of draggable game tokens. */
export type TokenName =
    | "credit"
    | "advancement"
    | "power"
    | "virus"
    | "tag"
    | "bad-publicity"
    | "brain-damage";

/** Data describing a single card as returned by the card-list API and consumed by `createCard`. */
export interface CardInfo {
    title: string;
    side_code: string;
    faction_code: string;
    type_code: string;
    image: string;
    code?: string;
}

// ---------------------------------------------------------------------------
// P2P message union — discriminated on `messageType`
// ---------------------------------------------------------------------------

export interface CreateElementMessage {
    messageType: "create-element";
    perspective: PlayerSide;
    entityType: EntityType;
    entityId: string;
    content: unknown[];
}

export interface GrabElementMessage {
    messageType: "grab-element";
    perspective: PlayerSide;
    entityId: string;
    content: { x: number; y: number };
}

export interface MoveElementMessage {
    messageType: "move-element";
    perspective: PlayerSide;
    entityId: string;
    content: { x: number; y: number };
}

export interface UngrabElementMessage {
    messageType: "ungrab-element";
    perspective: PlayerSide;
    entityId: string;
    content: { x: number; y: number };
}

export interface DeleteElementMessage {
    messageType: "delete-element";
    perspective: PlayerSide;
    entityId: string;
}

export interface FlipElementMessage {
    messageType: "flip-element";
    perspective: PlayerSide;
    entityId: string;
    content: { flipped: boolean };
}

export interface RotateElementMessage {
    messageType: "rotate-element";
    perspective: PlayerSide;
    entityId: string;
    content: { rotated: boolean };
}

export interface HeartbeatMessage {
    messageType: "heartbeat";
}

/** Discriminated union of every P2P message shape exchanged between peers. */
export type P2PMessage =
    | CreateElementMessage
    | GrabElementMessage
    | MoveElementMessage
    | UngrabElementMessage
    | DeleteElementMessage
    | FlipElementMessage
    | RotateElementMessage
    | HeartbeatMessage;
