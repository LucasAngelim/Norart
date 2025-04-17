const express = require('express');
const { MessagingResponse } = require('twilio').twiml;
const app = express();
app.use(express.urlencoded({ extended: false }));

const PORT = process.env.PORT || 3000;

const sessions = {};
const lastInteraction = {};
const TEMPO_LIMITE = 8 * 60 * 60 * 1000; // 8 horas
const NUMERO_VIDROS = '556181532529';
const NUMERO_MOLDURAS = '556183523174';

app.post('/whatsapp', (req, res) => {
  const twiml = new MessagingResponse();

  const userId = req.body.From;
  const msgBody = req.body.Body ? req.body.Body.trim() : '';
  const agora = Date.now();
  const hora = new Date().getHours();

  // Ignora mensagens de grupo e chamadas
  if (msgBody.toLowerCase().includes('ligação de voz')) {
    console.log(`⚠️ Ignorada mensagem de ligação de voz de ${userId}`);
    return res.end();
  }

  if (hora < 8 || hora >= 18) {
    twiml.message('⚠️ Estamos fora do horário de atendimento (08h às 18h). Assim que possível, entraremos em contato!');
    return res.send(twiml.toString());
  }

  if (lastInteraction[userId] && agora - lastInteraction[userId] < TEMPO_LIMITE) {
    return res.end();
  }

  if (!sessions[userId]) {
    sessions[userId] = { step: 1 };
    twiml.message('Seja bem-vindo à Norart Vidros e Molduras! Para iniciar seu atendimento, favor me informe seu nome.');
    return res.send(twiml.toString());
  }

  if (sessions[userId].step === 1) {
    sessions[userId].nome = msgBody;
    sessions[userId].step = 2;
    twiml.message(`Obrigado, ${msgBody}! Agora escolha entre as seguintes opções:\n\n1⃣ Vidros\n2⃣ Molduras`);
    return res.send(twiml.toString());
  }

  if (sessions[userId].step === 2) {
    if (msgBody === '1' || msgBody.toLowerCase() === 'vidros') {
      twiml.message('Você escolheu *Vidros*! Um atendente entrará em contato com você em breve. 📞');
      console.log(`🔔 Novo atendimento de VIDROS: ${sessions[userId].nome} - ${userId}`);
      lastInteraction[userId] = agora;
      delete sessions[userId];
      return res.send(twiml.toString());
    }

    if (msgBody === '2' || msgBody.toLowerCase() === 'molduras') {
      twiml.message('Você escolheu *Molduras*! Um atendente entrará em contato com você em breve. 📞');
      console.log(`🔔 Novo atendimento de MOLDURAS: ${sessions[userId].nome} - ${userId}`);
      lastInteraction[userId] = agora;
      delete sessions[userId];
      return res.send(twiml.toString());
    }

    twiml.message('Opção inválida! Por favor, escolha entre:\n\n1⃣ Vidros\n2⃣ Molduras');
    return res.send(twiml.toString());
  }

  return res.end();
});

app.listen(PORT, () => {
  console.log(`🤖 Bot da Norart rodando na porta ${PORT}`);
});
