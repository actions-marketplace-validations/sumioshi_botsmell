import type { Rule } from "../types.js";
import { re, reAtLeast, reUnless } from "./util.js";

// Rótulo técnico de uma palavra ("ex:", "obs:") é uso legítimo de quem escreve.
const ROTULO_TECNICO = /(^|\s)(ex|obs|link|email|e-mail|cnpj|cpf|senha|user|usuário|usuario|login|token|url|id|ref|nota|ps|(?:feat|fix|chore|docs|refactor|test|perf|ci|build|style|revert)(?:\([^)]*\))?!?)\s*:/gi;
const DOIS_PONTOS = /(?<!\d)(?<!https?):(?!\d|\/\/)\s*(\n|\p{L})/u;

// Recibo de leitura abrindo a resposta, antes do conteúdo. O recibo curto sozinho
// ("vi aqui") ou explicando a demora é uso normal.
const RECIBO_ABERTURA =
  /^\s*(?:(?:opa|oi|olá|ola|fala|e a[ií]|bom dia|boa tarde|boa noite)(?![\p{L}])[^\n]{0,30}?[,!.]?\s+)?(?:vi|recebi|li)\s+(?:a |sua |tua |seu |teu |o seu |o teu )?(?:mensagem|msg|áudio|audio|recado|pedido|pergunta|e-?mail)(?![\p{L}])(?:\s+(?:d[oae]s?|sobre)\s[^\n]*|[!.,]?\s*\n\s*\S)/iu;

export const pt: Rule[] = [
  {
    id: "validacao_abertura",
    lang: "pt",
    weight: 2,
    message: "Abre elogiando a pergunta ou concordando por reflexo.",
    suggestion: "Abra pelo fato ou pela resposta.",
    test: re(/^\s*(?:boa pergunta|ótima pergunta|otima pergunta|ótimo ponto|otimo ponto|excelente pergunta|faz (?:todo )?sentido|perfeito[,!.]|excelente[,!.]|com certeza[,!.]|claro[!,]\s)/i),
  },
  {
    id: "recibo_abertura",
    lang: "pt",
    weight: 2,
    message: "Abre confirmando que leu ou recebeu a mensagem antes do conteúdo.",
    suggestion: "Abra pelo que já fez ou pela resposta; quem responde já mostrou que leu.",
    test: re(RECIBO_ABERTURA),
  },
  {
    id: "fechamento_reflexo",
    lang: "pt",
    weight: 2,
    message: "Fechamento pronto oferecendo mais ajuda.",
    suggestion: "Termine no fato ou numa pergunta concreta.",
    test: re(/qualquer (?:coisa|dúvida|duvida)[^.!?\n]{0,25}(?:chama|fala|avisa|só|so)|(?:fico|estou|seguimos) à disposição|(?:fico|estou) a disposição|espero ter ajudado|fico no aguardo de (?:seu|sua) retorno/i),
  },
  {
    id: "vocabulario_ia",
    lang: "pt",
    weight: 2,
    message: "Palavras que modelos de linguagem usam demais.",
    suggestion: "Palavra comum equivalente: melhorar, ajustar, deixar, ficar.",
    test: re(
      /\b(?:crucial|fundamental|essencial|aprimorar|otimizar|potencializar|impulsionar|alavancar|vale (?:ressaltar|destacar)|é importante (?:ressaltar|destacar)|nesse sentido|dessa forma|além disso|em suma|ademais|robust[oa]s?|jornada|abordagem|cenário|panorama|mergulhar (?:fundo|de cabeça)|no mundo (?:atual|de hoje))\b/i,
    ),
  },
  {
    id: "gerundio_profundidade",
    lang: "pt",
    weight: 2,
    message: "Frase esticada com um gerúndio no fim que finge profundidade.",
    suggestion: "Termine a frase e diga o efeito numa frase nova, com verbo direto.",
    test: re(/,\s+(?:garantindo|permitindo|proporcionando|possibilitando|assegurando|contribuindo|reforçando|destacando)\b/i),
  },
  {
    id: "nao_so_mas",
    lang: "pt",
    weight: 2,
    message: "Construção \"não só X, mas também Y\".",
    suggestion: "Afirme direto o segundo termo.",
    test: re(/não (?:só|apenas|somente)[^.!?\n]{0,60}(?:mas|como)/i),
  },
  {
    id: "nao_e_x_e_y",
    lang: "pt",
    weight: 2,
    message: "Reenquadramento \"não é X, é Y\".",
    suggestion: "Afirme direto o que é.",
    test: re(/não é (?:sobre |só |apenas )?[^,.!?\n]{2,40}, (?:é|mas) /i),
  },
  {
    id: "triade",
    lang: "pt",
    weight: 1,
    message: "Lista curta de exatamente três itens, ritmo típico de texto gerado.",
    suggestion: "Dois itens, ou um por frase.",
    test: re(/\b\p{L}+(?: \p{L}+)?, \p{L}+(?: \p{L}+)? e \p{L}+(?: \p{L}+)?\b/u),
  },
  {
    id: "dois_pontos_intro",
    lang: "pt",
    weight: 1,
    message: "Dois-pontos introduzindo a ideia (\"A mais séria: ...\").",
    suggestion: "\"X: Y\" vira \"X, Y\", \"X. Y\" ou duas mensagens.",
    test: (text) => {
      const limpo = text.replace(ROTULO_TECNICO, "$1");
      const m = DOIS_PONTOS.exec(limpo);
      return m ? { match: limpo.slice(Math.max(0, m.index - 20), m.index + 1).trim(), index: m.index } : null;
    },
  },
  {
    id: "confissao",
    lang: "pt",
    weight: 3,
    message: "Auto-incriminação em mensagem profissional.",
    suggestion: "Diga o estado e a correção: \"X não estava entrando; já entra\".",
    test: re(/\b(?:culpa minha|minha culpa|foi culpa|erro meu|falha minha|fiz besteira|vacilei|vacilo|mancada|pisei na bola|me perdoa|foi mal|mil desculpas|desculpa qualquer coisa)\b/iu),
  },
  {
    id: "narrativa_acidente",
    lang: "pt",
    weight: 2,
    message: "Narra intenção ou acidente em vez do impacto.",
    suggestion: "Voz de sistema: \"X tinha saído da conta; voltou\".",
    test: re(/\b(?:acabei \p{L}+(?:ando|endo|indo)|sem querer|por descuido|esqueci de|deixei passar|me passou|não vi que|nao vi que|quebrei|derrubei)\b/iu),
  },
  {
    id: "drama",
    lang: "pt",
    weight: 2,
    message: "Dramatiza o problema.",
    suggestion: "\"O principal\" e o número, sem adjetivo.",
    test: re(/\b(?:a mais séria|a mais seria|o pior|ia te pegar|ia estourar|por sorte|ainda bem que|por pouco|quase deu ruim)\b/iu),
  },
  {
    id: "hedge",
    lang: "pt",
    weight: 1,
    message: "Hedge ou diminutivo que enfraquece a mensagem.",
    suggestion: "Afirme o fato conferido.",
    test: re(
      /\b(?:acho que|eu acho|acredito que|mais ou menos|meio que|vou tentar|se fizer sentido|pode ser bobagem|desculpa incomodar|rapidinho|só queria|coisinha|probleminha|errinho|ajustezinho|bugzinho|detalhezinho)\b/iu,
    ),
  },
  {
    id: "desculpa_repetida",
    lang: "pt",
    weight: 2,
    message: "Mais de um pedido de desculpa na mesma mensagem.",
    suggestion: "Uma vez, curta, depois do estado.",
    test: reAtLeast(/\b(?:desculpa|desculpe|desculpas|sinto muito|lamento)\b/iu, 2),
  },
  {
    id: "nao_sem_alternativa",
    lang: "pt",
    weight: 1,
    message: "Diz não sem oferecer o que dá para fazer.",
    suggestion: "Diga o que dá e quando.",
    test: reUnless(
      /\b(?:não consigo|nao consigo|não dá|nao da|não tem como|nao tem como)/iu,
      /\b(?:mas|porém|porem)\b|(?:o que dá|o que da)|\b(?:amanhã|amanha|depois|cedo)\b|(?:à tarde|a tarde|à noite|a noite)|(?:semana que vem)/iu,
    ),
  },
];
