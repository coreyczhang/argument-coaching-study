export type Stance = -2 | -1 | 0 | 1 | 2;

export interface User {
    userId: string;
    role: 'user' | 'admin';
    email: string;
    password?: string; // hashed password
    firstName: string;
    lastName: string;
    gameHistory: string[]; // array of game IDs
    surveyData?: Record<string, any>; // JSON blob
    stances: Record<string, Stance>;
}