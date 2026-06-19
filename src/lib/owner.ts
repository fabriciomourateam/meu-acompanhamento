// UUID do dono do ecossistema (Fabricio / FMTeam). É o `patients.user_id` /
// `profiles.id` dele. Usado para diferenciar os alunos do Fabricio dos alunos de
// outros treinadores (o app é multitenant via /portal-<slug>).
export const OWNER_USER_ID = 'a9798432-60bd-4ac8-a035-d139a47ad59b';

/** True se o paciente pertence ao dono (Fabricio). */
export function isOwnerPatient(patient: { user_id?: string | null } | null | undefined): boolean {
  return patient?.user_id === OWNER_USER_ID;
}
