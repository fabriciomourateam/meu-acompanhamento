// Verificação da agenda de check-in (src/lib/checkin-schedule.ts).
// Roda com a tooling já presente (esbuild) — sem dependência de runner de teste:
//   node scripts/checkin-schedule.test.mjs
//
// Cobre: mensal (locked/abre 3d antes/dia/graça +1/atraso +2/rolagem), quinzenal
// (dias 1 e 15, aluno novo, perda do dia 1, virada de mês) e `done` (em BRT).

import esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Stub do util de BRT (só formata data em America/Sao_Paulo) pra não puxar o app inteiro.
const utilsStub = `export const getBrtISODate = (input = new Date()) => {
  const d = input instanceof Date ? input : new Date(input);
  return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
};`;

const res = await esbuild.build({
  entryPoints: [resolve(root, 'src/lib/checkin-schedule.ts')],
  bundle: true, format: 'esm', write: false,
  plugins: [{
    name: 'stub-utils',
    setup(b) {
      b.onResolve({ filter: /^@\/lib\/utils$/ }, () => ({ path: 'stub-utils', namespace: 'stub' }));
      b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: utilsStub, loader: 'ts' }));
    },
  }],
});

const M = await import('data:text/javascript;base64,' + Buffer.from(res.outputFiles[0].text).toString('base64'));

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  if (JSON.stringify(got) === JSON.stringify(want)) pass++;
  else { fail++; console.log('FAIL', name, '\n  got ', JSON.stringify(got), '\n  want', JSON.stringify(want)); }
};

// === Mensal: inicio 2026-01-01 → 1ª data = 2026-01-31 (inicio+30) ===
const inicio = '2026-01-01', plano = 'BASIC (Mensal)';
const cy = (hoje) => M.getCheckinCycle({ inicio, plano, hoje });
eq('mensal locked longe', cy('2026-01-10').state, 'locked');
eq('mensal locked daysUntil', cy('2026-01-10').daysUntil, 21);
eq('mensal abre 3d antes (28)', cy('2026-01-28').state, 'open');
eq('mensal due no dia (31)', cy('2026-01-31').state, 'open');
eq('mensal graça +1 (01/02)', cy('2026-02-01').state, 'open');
eq('mensal atraso +2 (02/02)', cy('2026-02-02').state, 'overdue');
eq('mensal atraso dias', cy('2026-02-02').daysOverdue, 2);
eq('mensal rola dueDate (27/02)', cy('2026-02-27').dueDate, '2026-03-02');
eq('mensal rola estado', cy('2026-02-27').state, 'open');

// === done: check-in enviado dentro da janela do ciclo ===
const done = M.getCheckinStatus({ inicio, plano, hoje: '2026-01-29', checkins: [{ data_preenchimento: '2026-01-29T12:00:00-03:00' }] });
eq('done quando preenchido', done.state, 'done');
eq('done aponta próximo', done.nextDate, '2026-03-02');
const oldOnly = M.getCheckinStatus({ inicio, plano, hoje: '2026-01-29', checkins: [{ data_preenchimento: '2026-01-05T12:00:00-03:00' }] });
eq('checkin velho não cumpre', oldOnly.state, 'open');

// === Quinzenal: dias 1 e 15 do calendário ===
const q = 'PREMIUM (Trimestral)';
eq('isQuinzenal true', M.isQuinzenal(q), true);
eq('isQuinzenal false', M.isQuinzenal('BASIC (Mensal)'), false);
eq('quinzenal aluno novo locked', M.getCheckinCycle({ inicio: '2026-06-02', plano: q, hoje: '2026-06-03' }).state, 'locked');
eq('quinzenal aluno novo due 15', M.getCheckinCycle({ inicio: '2026-06-02', plano: q, hoje: '2026-06-03' }).dueDate, '2026-06-15');
eq('quinzenal abre 12', M.getCheckinCycle({ inicio: '2026-05-01', plano: q, hoje: '2026-06-12' }).state, 'open');
eq('quinzenal perdeu dia 1 → overdue', M.getCheckinCycle({ inicio: '2026-05-01', plano: q, hoje: '2026-06-05' }).state, 'overdue');
eq('quinzenal overdue due 01', M.getCheckinCycle({ inicio: '2026-05-01', plano: q, hoje: '2026-06-05' }).dueDate, '2026-06-01');
eq('quinzenal rola pro 15 (12)', M.getCheckinCycle({ inicio: '2026-05-01', plano: q, hoje: '2026-06-12' }).dueDate, '2026-06-15');
eq('quinzenal next vira mês', M.getCheckinCycle({ inicio: '2026-05-01', plano: q, hoje: '2026-06-15' }).nextDate, '2026-07-01');

console.log(`\n${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
