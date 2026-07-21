export interface Tile {
    tileId: string; // tile id starting from "0"
    parentId: string | null;
    parentEdge: number | null;
    children: string[]; // array of child tile ids
    player: 'plus' | 'minus' | null;
    text: string;
    emoji: string | null;
    // ruleCard: string | null;
    confirmed: boolean;
    // revised: boolean
}