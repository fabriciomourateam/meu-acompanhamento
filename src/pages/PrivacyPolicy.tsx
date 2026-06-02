// Política de Privacidade — exigida pela Google Play (e boa prática LGPD).
// Página pública, sem login, acessível em /privacidade.
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const UPDATED_AT = '02 de junho de 2026';
const CONTACT_EMAIL = 'fabriciomouratreinador@gmail.com';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-slate-900">Política de Privacidade</h1>
        <p className="mt-1 text-xs text-slate-400">Última atualização: {UPDATED_AT}</p>

        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          Esta Política descreve como o aplicativo <strong>Meu Acompanhamento</strong> (Consultoria Esportiva
          FMTeam — Nutrição e Treinamento by Fabricio Moura) coleta, usa e protege os seus dados ao usar o
          portal de acompanhamento nutricional e de treinos.
        </p>

        <Section title="1. Dados que coletamos">
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Identificação e acesso:</strong> nome, telefone e data de nascimento (usados para login).</li>
            <li><strong>Dados de acompanhamento:</strong> plano alimentar, treinos, registros de séries e cargas, cardio, peso, medidas e metas diárias.</li>
            <li><strong>Fotos:</strong> fotos de evolução e fotos que você opta por publicar na comunidade.</li>
            <li><strong>Uso do app:</strong> informações técnicas básicas para funcionamento e correção de erros.</li>
          </ul>
        </Section>

        <Section title="2. Como usamos os dados">
          <p>
            Os dados são usados exclusivamente para prestar o serviço de acompanhamento: montar e exibir sua
            dieta e treinos, acompanhar sua evolução, exibir rankings e a comunidade, e enviar lembretes/avisos
            (quando você autoriza notificações). Não usamos seus dados para publicidade de terceiros.
          </p>
        </Section>

        <Section title="3. Armazenamento e segurança">
          <p>
            Seus dados são armazenados em infraestrutura segura (Supabase) com acesso restrito. Mantemos os
            dados enquanto você for cliente do acompanhamento; após o encerramento, podem ser excluídos mediante
            solicitação.
          </p>
        </Section>

        <Section title="4. Compartilhamento">
          <p>
            <strong>Não vendemos seus dados.</strong> O acesso é restrito ao profissional responsável pelo seu
            acompanhamento e aos provedores de infraestrutura necessários para operar o app (ex.: hospedagem e
            banco de dados). Conteúdos que você publica na comunidade ficam visíveis aos demais alunos do mesmo
            profissional.
          </p>
        </Section>

        <Section title="5. Notificações">
          <p>
            Se você autorizar, podemos enviar notificações push (lembretes e avisos). Você pode revogar essa
            permissão a qualquer momento nas configurações do seu dispositivo ou do app.
          </p>
        </Section>

        <Section title="6. Seus direitos (LGPD)">
          <p>
            Você pode solicitar acesso, correção, exclusão dos seus dados ou a revogação de consentimento.
            Para exercer esses direitos, entre em contato pelo e-mail abaixo.
          </p>
        </Section>

        <Section title="7. Contato">
          <p>
            Dúvidas ou solicitações sobre privacidade:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-emerald-600 hover:text-emerald-700">
              {CONTACT_EMAIL}
            </a>
          </p>
        </Section>

        <p className="mt-8 border-t border-slate-100 pt-4 text-xs text-slate-400">
          Ao usar o aplicativo Meu Acompanhamento, você concorda com esta Política de Privacidade.
        </p>
      </div>
    </div>
  );
}
