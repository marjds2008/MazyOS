# Draw Engine v2.0

Motor criptográfico de geração de números da sorte do Parceria Premiada.

---

## Problema resolvido

Gerar um número de 5 dígitos (00000–99999) para cada participante de uma campanha, com as seguintes garantias:

- **Determinístico:** mesma seed + mesma sequência → sempre o mesmo número
- **Sem colisões:** dentro de uma campanha, nenhum número se repete (até 100.000 participantes)
- **Criptograficamente seguro:** sem `Math.random()`, sem pool pré-gerado
- **Auditável:** qualquer pessoa pode verificar qualquer número
- **Rápido:** sub-1ms por número

---

## Algoritmo

### Visão geral

```
seed (64-char hex, único por campanha)
  ↓
key = SHA256("draw-engine:v1:" + seed)
  ↓
x = (sequence - 1) % 131072        ← 0-indexed, dentro do espaço 2^17
  ↓
do { x = feistel_8rounds(key, x) } while (x >= 100000)   ← cycle-walking
  ↓
display_number = x   ← [0, 99999], garante unicidade por bijeção
  ↓
display_hash = SHA256(seed + ":" + sequence + ":" + display_number)
```

### Rede Feistel

Uma rede Feistel é uma **bijeção** — cada entrada mapeia para exatamente uma saída, e o mapeamento é reversível. Isso garante **zero colisões** dentro de uma campanha.

Usamos uma rede Feistel **não-balanceada** sobre 17 bits (2^17 = 131.072):
- Metade esquerda: 8 bits (256 valores)
- Metade direita: 9 bits (512 valores)
- 8 rodadas com função baseada em HMAC-SHA256

```
Rodadas pares (0, 2, 4, 6): R = (R + HMAC(key, round || L)) mod 512
Rodadas ímpares (1, 3, 5, 7): L = (L + HMAC(key, round || R)) mod 256
```

### Cycle-walking

Como o domínio alvo é 100.000 (não é potência de 2), aplicamos o Feistel recursivamente até o resultado cair em [0, 99.999].

A bijeção garante que sequências diferentes nunca "convergem" para o mesmo valor dentro do domínio. Média de **1,31 iterações** por número.

### Seed

Gerada com `crypto.randomBytes(32).toString("hex")` — 256 bits de entropia. Imutável após o primeiro participante. Armazenada no servidor, nunca exposta publicamente.

O `seed_hash = SHA256(seed)` é publicado para auditoria.

---

## Arquivos

```
src/lib/draw-engine/
├── types.ts       ← interfaces e constantes
├── engine.ts      ← algoritmo core (SeedManager, NumberGenerator, AuditService, etc.)
└── index.ts       ← re-exports

src/app/(admin)/draw-engine/
└── page.tsx       ← painel de auditoria (protegido, role: admin)

src/app/transparencia/
├── page.tsx       ← página pública de transparência
└── VerifyWidget.tsx ← componente de verificação (client)

../../supabase-migration-011-draw-engine.sql ← migração do banco
```

---

## Banco de dados

### Colunas adicionadas em `pp_campanhas`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `seed` | TEXT UNIQUE | Seed criptográfica da campanha |
| `seed_hash` | TEXT | SHA256(seed) — público para auditoria |
| `algorithm_version` | TEXT | `v1` |
| `draw_engine_version` | TEXT | `2.0` |
| `current_sequence` | INTEGER | Contador atômico de participantes |
| `created_draw_at` | TIMESTAMPTZ | Quando a seed foi ativada |

### Colunas adicionadas em `pp_participantes`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `sequence_number` | INTEGER | Sequência do participante (1-indexed) |
| `display_number` | INTEGER | Número da sorte [0, 99999] |
| `display_number_fmt` | TEXT | Número formatado com zeros (ex: `04201`) |
| `display_hash` | TEXT | SHA256(seed:sequence:number) |
| `created_by_algorithm` | BOOLEAN | Sempre `true` para Draw Engine v2 |

### Tabela `pp_draw_audit`

Registro completo de cada emissão e verificação, para auditoria independente.

### RPCs

| Função | Acesso | Descrição |
|--------|--------|-----------|
| `get_next_sequence(campanha_id)` | authenticated | Incrementa e retorna próximo sequence |
| `save_participant_number(...)` | authenticated | Salva número + grava audit log |
| `verify_participant_number(...)` | anon | Verifica número (página pública) |
| `get_draw_audit_info(campanha_id)` | authenticated | Info de auditoria da campanha |
| `list_draw_audit(campanha_id, ...)` | authenticated | Log paginado |

---

## Como integrar no registro de participante

```typescript
import { DrawEngine } from "@/lib/draw-engine";

// 1. Buscar próxima sequência (atômico no banco)
const { data: seq } = await supabase.rpc("get_next_sequence", {
  p_campanha_id: campanhaId,
});

// 2. Gerar número da sorte
const result = DrawEngine.generateForParticipant(seed, seq);
// result = { sequence, displayNumber, displayHash, formatted }

// 3. Salvar no participante + audit log
await supabase.rpc("save_participant_number", {
  p_participante_id: participanteId,
  p_campanha_id:     campanhaId,
  p_sequence:        result.sequence,
  p_display_number:  result.displayNumber,
  p_display_fmt:     result.formatted,
  p_display_hash:    result.displayHash,
});
```

---

## Testes

```bash
cd projetos/parceria-premiada/admin
npx jest src/lib/draw-engine/__tests__/engine.test.ts
```

Coberturas:
- Determinismo: 100 sequências testadas 2x
- Zero colisões: 100.000 sequências, nenhuma repetição
- Distribuição uniforme: ±15% entre decis para 10.000 amostras
- Performance: 1.000 números em menos de 1 segundo
- Audit hash: determinismo, unicidade, tamanho SHA256
- DrawEngine facade: campos completos, verify correto

---

## Interfaces futuras

O `types.ts` define interfaces prontas para extensão futura:

- `LotteryProvider` — abstração para qualquer loteria externa
- `FederalLotteryProvider` — integração com Loteria Federal
- `MegaSenaProvider` — integração com Mega-Sena
- `WinnerResolver` — resolução de ganhador dado número sorteado

Nenhuma dessas interfaces tem implementação — são contratos para o futuro.
