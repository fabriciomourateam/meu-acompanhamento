// Guard focado contra a classe de bug que derruba o app em runtime:
// identificadores usados mas nunca declarados (ex.: `isConquista`), que viram
// `ReferenceError` ao renderizar e — sem error boundary — apagam a tela inteira.
//
// O codebase ainda tem muitos erros de tipo herdados (tipos frouxos do Supabase,
// libs sem @types), então NÃO dá pra exigir `tsc` 100% limpo. Aqui filtramos só:
//   TS2304 — "Cannot find name 'x'"
//   TS2552 — "Cannot find name 'x'. Did you mean 'y'?"
// Esses são quase sempre ReferenceError garantido em runtime.
import { execSync } from 'node:child_process';

let out = '';
try {
  out = execSync('npx tsc --noEmit -p tsconfig.json', { encoding: 'utf8' });
} catch (e) {
  out = `${e.stdout || ''}${e.stderr || ''}`;
}

const offenders = out.split('\n').filter((l) => /error TS2304|error TS2552/.test(l));

if (offenders.length > 0) {
  console.error('\n❌ Identificadores nao definidos (ReferenceError / tela branca em runtime):\n');
  offenders.forEach((l) => console.error('  ' + l.trim()));
  console.error(`\n${offenders.length} ocorrencia(s). Declare a variavel/import antes de subir.\n`);
  process.exit(1);
}

console.log('✓ Nenhum identificador indefinido (TS2304/TS2552).');
