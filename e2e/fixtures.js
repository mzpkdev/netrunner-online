export const NETRUNNERDB_API = "https://netrunnerdb.com/api/2.0/public/cards";

/** Minimal fixture — only the cards exercised by this test suite. */
export const apiFixture = {
    data: [
        {
            code: "26100",
            title: "Pravdivost Consulting: Political Solutions",
            side_code: "corp",
            faction_code: "weyland-consortium",
            type_code: "identity",
        },
        {
            code: "01054",
            title: "Hedge Fund",
            side_code: "corp",
            faction_code: "neutral-corp",
            type_code: "operation",
        },
        {
            code: "33079",
            title: 'Nyusha "Sable" Sintashta: Symphonic Prodigy',
            side_code: "runner",
            faction_code: "criminal",
            type_code: "identity",
        },
        {
            code: "01088",
            title: "Sure Gamble",
            side_code: "runner",
            faction_code: "neutral-runner",
            type_code: "event",
        },
    ],
};
