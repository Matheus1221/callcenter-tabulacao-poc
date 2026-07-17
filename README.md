# PoC — Screen Pop de Tabulação (Asterisk + AMI)

Ambiente mínimo pra você simular uma ligação e ver, na prática, quais eventos
o discador manda quando uma chamada acontece. É o passo 1 e 2 do plano:
**subir o discador → enxergar os eventos crus**.

## O que tem aqui

- `docker-compose.yml` — sobe o Asterisk
- `config/pjsip.conf` — dois ramais SIP de teste: **1001** (simula cliente) e **1002** (simula atendente)
- `config/extensions.conf` — regra simples: quem disca `1002` cai no ramal 1002
- `config/manager.conf` — libera o AMI (porta 5038) com usuário `admin` / senha `admin123`
- `ami-listener/listener.js` — script Node que conecta no AMI e imprime todo evento de chamada no console

## Passo a passo

### 1. Suba o Asterisk

```bash
docker compose up -d
docker compose logs -f asterisk
```

Espere aparecer algo como `Asterisk Ready` no log.

### 2. Rode o listener do AMI

Em outro terminal, sem precisar instalar nada (o script só usa o módulo `net` nativo do Node):

```bash
cd ami-listener
node listener.js
```

Você deve ver: `Conectado ao AMI. Fazendo login...`

### 3. Instale um softphone pra simular a chamada

Baixe o **Zoiper** (grátis, tem versão desktop e mobile) ou o **MicroSIP** (Windows, mais leve):

- Zoiper: https://www.zoiper.com/en/voip-softphone/download/current
- MicroSIP: https://www.microsip.org/

Configure **dois** softphones (ou dois perfis no mesmo app), assim:

**Softphone A (simulando o "cliente")**
- Usuário: `1001`
- Senha: `senha1001`
- Servidor: `localhost` (ou o IP da máquina onde o Docker está rodando)
- Porta: `5060`

**Softphone B (simulando o "atendente")**
- Usuário: `1002`
- Senha: `senha1002`
- Servidor: `localhost`
- Porta: `5060`

### 4. Faça a ligação

No Softphone A (1001), disque **1002** e chame.
Atenda no Softphone B.

### 5. Olhe o terminal do listener

Você vai ver uma sequência de eventos tipo `Newchannel`, `DialBegin`, `DialEnd`,
`BridgeEnter`, `Hangup`, etc. — cada um em JSON.

**O que você precisa anotar nessa etapa:**
- Qual evento aparece quando a chamada é **atendida** (geralmente `BridgeEnter` ou `DialEnd` com `DialStatus: ANSWER`)
- O valor do campo **`Uniqueid`** ou **`Linkedid`** — esse é o ID único da ligação que vai virar a chave da sua tabulação

## Próximo passo (depois que isso estiver rodando)

Com o evento certo mapeado, a gente parte pro backend: uma rota que recebe
esse evento (ao invés de só logar) e grava um registro de tabulação com esse
`Uniqueid` como identificador, pronto pra ser puxado pelo frontend.
