import { getMacroGroupMeta, type MacroGroupId } from "./food-macro-groups";

/**
 * Resolve um emoji específico do alimento (em vez do emoji genérico do macrogrupo).
 *
 * O matching é por palavra-chave normalizada (sem acentos, lowercase). A ordem
 * importa: regras de PRODUTO PREPARADO (biscoito, bolo, pão, ovo, omelete) vêm
 * ANTES de ingredientes/sabores. Cai no emoji do macrogrupo quando nada bate.
 */

type Rule = [pattern: RegExp, emoji: string];

const RULES: Rule[] = [
  // ===== PRODUTOS PREPARADOS (top priority — sobrescreve sabores) =====
  [/\bbiscoito|\bbolacha|\bcookie|\bwafer/, "🍪"],
  [/\bbolo\b|\btorta\b/, "🍰"],
  [/\bpao\b|\bpaes\b/, "🍞"],
  [/\bpizza/, "🍕"],
  [/\blasanha|\bmacarra|\bespaguete|\btalharim|\bpenne|\bnhoque/, "🍝"],
  [/\bpastel\b|\bempada\b|\bcoxinha\b|\bquibe|\bsalgadinho/, "🥟"],
  [/\bpanqueca|\bcrepe\b|\btapioca|\bcrepioca/, "🥞"],
  [/\bpamonha|\bcurau\b|\bpolenta/, "🌽"],
  [/\bomelete|\bovos? |\bovo,|\bovo$|\bclara de ovo|\bgema\b/, "🥚"],
  [/\blinguica|\bsalsicha|\bmortadela|\bsalame|\bpresunto|\bapresuntado/, "🌭"],
  [/\bhamburguer|\bhamburger|\balmondega|\balmondegas|\bcroquete/, "🍔"],
  [/\bbacon|\btoucinho/, "🥓"],
  [/\bdoce de leite|\bbrigadeiro|\bbeijinho|\bbombom|\bbala\b|\bbalinha|\bgomas\b|\bpacoca|\bpe-de-moleque/, "🍬"],
  [/\bsorvete|\bpicole/, "🍦"],
  [/\bpudim|\bmusse|\bmousse|\bcanjica/, "🍮"],
  [/\bgeleia|\bmel\b/, "🍯"],
  [/\bacucar|\brapadura/, "🍭"],
  [/\bchocolate|\bcacau|\bcocoa\b|\bachocolatado/, "🍫"],
  [/\bwhey|\bproteina isolada|\balbumina|\bcaseina/, "🥤"],
  [/\biogurte|\bcoalhada|\bkefir|\bbebida lactea|\bleite fermentado/, "🥛"],
  [/\bcereal matinal/, "🥣"],

  // ===== FRUTAS =====
  [/\bbanan/, "🍌"],
  [/\bmaca\b|\bmacas\b/, "🍎"],
  [/\bpera\b|\bperas\b/, "🍐"],
  [/\blaranj/, "🍊"],
  [/\btangerin|\bmexeric|\bbergamot/, "🍊"],
  [/\blimao|\blimoes/, "🍋"],
  [/\babacaxi|\banana\b/, "🍍"],
  [/\bmanga\b|\bmangas\b/, "🥭"],
  [/\buva/, "🍇"],
  [/\bmorango/, "🍓"],
  [/\bmelancia/, "🍉"],
  [/\bmamao|\bmelao/, "🍈"],
  [/\bpessego/, "🍑"],
  [/\bameixa|\bnespera/, "🍑"],
  [/\bcoco\b|\bcocos\b/, "🥥"],
  [/\babacate/, "🥑"],
  [/\bkiwi/, "🥝"],
  [/\bcereja/, "🍒"],
  [/\bgoiaba|\bjabuticaba|\bcaqui|\bfigo|\bromã|\bcaja|\bgraviola|\bpitanga|\bjaca|\bmaracuja|\bacerola/, "🍓"],

  // ===== VEGETAIS =====
  [/\balface|\brucula|\bagriao|\bespinafre|\bcouve|\brepolho/, "🥬"],
  [/\btomate/, "🍅"],
  [/\bcenoura/, "🥕"],
  [/\bbrocolis|\bbrocoli/, "🥦"],
  [/\bpepino/, "🥒"],
  [/\bmilho/, "🌽"],
  [/\bpimenta\b|\bmolho de pimenta/, "🌶️"],
  [/\bpimentao/, "🫑"],
  [/\bberinjela/, "🍆"],
  [/\babobrinha/, "🥒"],
  [/\bcebola/, "🧅"],
  [/\balho\b/, "🧄"],
  [/\bcogumelo|\bchampignon|\bshiitake/, "🍄"],
  [/\bbeterraba|\brabanete|\bnabo/, "🥕"],

  // ===== INGREDIENTES BASE / GRÃOS =====
  [/\barroz/, "🍚"],
  [/\bbatata/, "🥔"],
  [/\bmandioca|\baipim|\bmacaxeira|\binhame/, "🥔"],
  [/\baveia\b|\bgranola|\bquinoa|\bcouscous|\bcuscuz|\bfarofa|\bfarinha de mandioca|\bfarinha de milho/, "🌾"],
  [/\bfeijao|\blentilha|\bgrao de bico|\bervilha\b|\bsoja\b|\btremoco|\bguandu/, "🫘"],

  // ===== CARNES (não-preparadas) =====
  [/\bfrango|\bgalinha|\bpeito de frango|\bcoxa\b|\bsobrecoxa|\basa\b|\bsobre-asa/, "🍗"],
  [/\bperu\b|\bchester/, "🦃"],
  [/\bcontrafile|\bfile mignon|\balcatra|\bcoxao|\bmusculo|\bpicanha|\bmaminha|\bfraldinha|\bcupim|\bcosteta|\bcostela|\bbisteca|\bbife|\bcarne moida|\bcarne assada|\bcarne bovina|\bcarne suina|\bcarne de boi|\bvazio|\bacem|\bpaleta|\bmiolo de alcatra|\blagarto|\bcontra-file|\bpatinho|\bflanco|\bseca\b|\bcharque|\bbucho|\blingua\b|\bfigado/, "🥩"],
  [/\bporco\b|\bpernil|\blombo|\bcopa\b|\bcalabresa/, "🥓"],
  [/\bpeixe|\bpescado|\btilapia|\bdourado|\bpintado|\bsurubim|\bcorvina|\bbadejo|\bpescada|\bsardinha|\btruta|\bpacu|\btambaqui|\bnamorado|\bbacalhau|\bmerluza|\babadejo|\bcacao\b|\bcorimba|\blambari|\bmanjuba|\bporquinho|\btucunare|\bpescadinha/, "🐟"],
  [/\batum/, "🐟"],
  [/\bsalmao/, "🐟"],
  [/\bcamarao|\blagosta|\bcaranguejo/, "🦐"],

  // ===== GORDURAS / OLEAGINOSAS =====
  [/\bazeite/, "🫒"],
  [/\boleo de|\boleo \w/, "🛢️"],
  [/\bmanteiga|\bmargarina/, "🧈"],
  [/\bcastanha|\bnoz\b|\bnozes|\bamendoa|\bavela/, "🌰"],
  [/\bamendoim|\bpasta de amendoim/, "🥜"],
  [/\bgergelim|\blinhaca|\bchia|\bgirassol|\babobora.*semente|\bsemente\b|\bsementes\b/, "🌱"],

  // ===== LATICÍNIOS =====
  [/\bleite\b/, "🥛"],
  [/\bqueijo|\bricota|\bmussarela|\bmuzzarela|\bmozarela|\bcheddar|\bparmesao|\bgorgonzola|\bbrie|\bcamembert|\bprato\b|\bcottage|\bminas\b|\bpetit/, "🧀"],
  [/\brequeijao|\bcream cheese|\bcatupiry/, "🧀"],
  [/\bnata\b|\bcreme de leite|\bchantilly/, "🥛"],

  // ===== BEBIDAS =====
  [/\bcafe\b|\bcafezinho|\bexpresso/, "☕"],
  [/\bcha\b|\bchas\b|\bmate\b/, "🍵"],
  [/\bsuco|\bnectar/, "🧃"],
  [/\bagua\b|\bagua de coco/, "💧"],
  [/\bvinho|\bespumante|\bchampanhe/, "🍷"],
  [/\bcerveja|\bchopp/, "🍺"],
  [/\brefrigerante|\bcoca\b|\bguarana|\bsoda\b/, "🥤"],
];

function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function getFoodEmoji(name: string, fallbackMacro: MacroGroupId): string {
  const normalized = normalize(name);
  for (const [pattern, emoji] of RULES) {
    if (pattern.test(normalized)) return emoji;
  }
  return getMacroGroupMeta(fallbackMacro).emoji;
}
