import { describe, expect, it } from "vitest";
import { check } from "../src/index.js";

const rules = (t: string, o = {}) => check(t, { lang: "pt", ...o }).hits.map((h) => h.rule);

describe("regras em português", () => {
  it("dois-pontos que introduz frase, mas não hora, URL ou rótulo", () => {
    expect(rules("A mais séria: o total sumiu")).toContain("dois_pontos_intro");
    expect(rules("Ficou assim:\nlista")).toContain("dois_pontos_intro");
    expect(rules("às 10:30 eu subo")).not.toContain("dois_pontos_intro");
    expect(rules("veja https://exemplo.com/x")).not.toContain("dois_pontos_intro");
    expect(rules("ex: painel de vendas")).not.toContain("dois_pontos_intro");
  });

  it("travessão e hífen espaçado, mas não palavra com hífen", () => {
    expect(rules("subi tudo — pode testar")).toContain("em_dash");
    expect(rules("subi tudo - pode testar")).toContain("em_dash");
    expect(rules("o e-mail já foi")).not.toContain("em_dash");
  });

  it("tríade, 'não só X mas Y' e 'não é X, é Y'", () => {
    expect(rules("ficou rápido, leve e limpo")).toContain("triade");
    expect(rules("não só corrige o total mas também alinha a coluna")).toContain("nao_so_mas");
    expect(rules("não é só o painel, é o banco")).toContain("nao_e_x_e_y");
  });

  it("abertura e fechamento prontos", () => {
    expect(rules("Ótimo ponto, vou ver")).toContain("validacao_abertura");
    expect(rules("qualquer coisa me chama")).toContain("fechamento_reflexo");
    expect(rules("fico à disposição")).toContain("fechamento_reflexo");
  });

  it("recibo de leitura abrindo a resposta", () => {
    expect(rules("Boa tarde Paulo! Vi sua mensagem do webinário\nJá comecei a montar")).toContain("recibo_abertura");
    expect(rules("Recebi seu áudio\njá tô olhando")).toContain("recibo_abertura");
    expect(rules("Vi aqui")).not.toContain("recibo_abertura");
    expect(rules("vi sua msg mas tava em uma reunião")).not.toContain("recibo_abertura");
  });

  it("vocabulário de IA e gerúndio de profundidade", () => {
    expect(rules("é crucial otimizar a jornada")).toContain("vocabulario_ia");
    expect(rules("subi o ajuste, garantindo que o total bata")).toContain("gerundio_profundidade");
    expect(rules("subi o ajuste e o total bate")).toEqual([]);
  });

  it("culpa, acidente, drama e hedge", () => {
    expect(rules("foi mal, culpa minha")).toContain("confissao");
    expect(rules("acabei derrubando a despesa")).toContain("narrativa_acidente");
    expect(rules("acabei o ajuste agora")).not.toContain("narrativa_acidente");
    expect(rules("por sorte vi antes")).toContain("drama");
    expect(rules("um probleminha no filtro")).toContain("hedge");
    expect(rules("desculpa, sinto muito")).toContain("desculpa_repetida");
  });

  it("não sem alternativa", () => {
    expect(rules("não consigo hoje")).toContain("nao_sem_alternativa");
    expect(rules("não consigo hoje, mas amanhã cedo sai")).not.toContain("nao_sem_alternativa");
  });
});

describe("abertura de assistente em português", () => {
  it("ótima pergunta", () => {
    expect(check("Ótima pergunta! O cache estava velho", { lang: "pt" }).hits.map((h) => h.rule)).toContain("validacao_abertura");
  });
});
