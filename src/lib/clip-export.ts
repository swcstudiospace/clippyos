/** Client-safe helpers for the Crayo clip → Library export flow. No secrets, no I/O. */

export function clipExternalRef(projectId: string): string {
  return `crayo:project:${projectId.trim()}`;
}
