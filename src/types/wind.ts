/**
 * 風（場風・自風で共通の概念）。
 * 場風は Table.roundWind、自風は WinContext.seatWind。
 * 親/子は seatWind==='east' で導出する（isDealer は持たない）。
 */
export type Wind = 'east' | 'south' | 'west' | 'north';
