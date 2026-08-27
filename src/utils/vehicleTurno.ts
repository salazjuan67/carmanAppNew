/**
 * El API a veces envía `turno` como string (ObjectId) o como ref `{ _id }`.
 * Necesario para comparar con `activeShift._id` en filtros de lista.
 */
export function normalizeVehicleTurnoId(turno: unknown): string | undefined {
  if (turno == null || turno === '') return undefined;
  if (typeof turno === 'string') return turno;
  if (typeof turno === 'object' && turno !== null && '_id' in turno) {
    return String((turno as { _id: string })._id);
  }
  return undefined;
}
