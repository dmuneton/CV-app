// Helpers shared by every form that uses a native <input type="date"> to edit an
// order's Fecha de la Orden (createdAt, stored as a full ISO timestamp) or Fecha
// de Entrega (deliveryDate, stored as plain "YYYY-MM-DD").

/** YYYY-MM-DD in the LOCAL timezone — Date#toISOString() is UTC and can land on
 *  the wrong day for date-only values, so this is built from local getters instead. */
export const toLocalDateInputValue = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Turns a "YYYY-MM-DD" (from a date input) into an ISO timestamp at local noon —
 *  noon avoids any timezone shift landing the stored date on the previous/next
 *  day when read back with local Date getters (see reportsData.ts). */
export const dateInputToIsoNoon = (dateStr: string): string => new Date(`${dateStr}T12:00:00`).toISOString();

/** The reverse of dateInputToIsoNoon — for pre-filling a date input from a stored
 *  ISO timestamp. Falls back to today if the stored value is missing/invalid. */
export const isoToLocalDateInputValue = (iso: string | undefined): string => {
  if (iso) {
    const parsed = new Date(iso);
    if (!isNaN(parsed.getTime())) return toLocalDateInputValue(parsed);
  }
  return toLocalDateInputValue(new Date());
};
