export interface Supporter {
  name: string;
  // Необязательная подпись под именем (например, дисциплина или город).
  note?: string;
}

// Игроки, поддержавшие проект материально. Порядок в списке = порядок на странице FAQ.
export const supporters: Supporter[] = [];

// Абзацы блока «Особая благодарность» на странице FAQ.
export const specialThanks: string[] = [];
