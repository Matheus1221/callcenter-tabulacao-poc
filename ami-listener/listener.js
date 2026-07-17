/**
 * Listener simples do AMI (Asterisk Manager Interface).
 *
 * Objetivo desta etapa: SÓ ENXERGAR os eventos crus que o Asterisk manda
 * quando uma chamada acontece. Ainda não grava nada, não abre tabulação,
 * é só pra você identificar:
 *   1) Qual evento marca "chamada atendida"
 *   2) Qual campo serve como ID único da ligação (Uniqueid / Linkedid)
 *
 * Depois que a gente mapear isso, partimos pro backend que grava a tabulação.
 */

const net = require("net");

const AMI_HOST = "localhost";
const AMI_PORT = 5038;
const AMI_USER = "admin";
const AMI_SECRET = "admin123";

const client = net.createConnection(AMI_PORT, AMI_HOST, () => {
  console.log("Conectado ao AMI. Fazendo login...");

  const login =
    "Action: Login\r\n" +
    `Username: ${AMI_USER}\r\n` +
    `Secret: ${AMI_SECRET}\r\n` +
    "Events: on\r\n\r\n";

  client.write(login);
});

let buffer = "";

client.on("data", (data) => {
  buffer += data.toString();

  // Eventos do AMI vêm separados por linha em branco dupla (\r\n\r\n)
  const packets = buffer.split("\r\n\r\n");
  buffer = packets.pop(); // guarda o pedaço incompleto pro próximo data event

  for (const packet of packets) {
    if (!packet.trim()) continue;

    const lines = packet.split("\r\n");
    const parsed = {};
    for (const line of lines) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      parsed[key] = value;
    }

    // Só nos interessam eventos (ignora resposta de Login, Pong, etc.)
    if (parsed.Event) {
      console.log("─".repeat(50));
      console.log(`EVENTO: ${parsed.Event}`);
      console.log(JSON.stringify(parsed, null, 2));
    }
  }
});

client.on("error", (err) => {
  console.error("Erro na conexão com o AMI:", err.message);
});

client.on("close", () => {
  console.log("Conexão com o AMI encerrada.");
});
