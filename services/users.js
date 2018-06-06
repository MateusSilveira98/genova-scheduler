const schedule = require('node-schedule')
const Email = require('./sendEmail.js')
const DB = require('../persistence/index')
const Endpoint = require('../app.config')

function extractNotifications(notificacoes) {
  return notificacoes.map(item => {
    let notificacao = {
      id: item.id,
      fundador_id: item.relationships.fundadores ? item.relationships.fundadores.data[0].id : null,
      email: item.attributes.destinatario,
      mensagem: item.attributes.mensagem,
      assunto: item.attributes.assunto,
      tipo: item.attributes.tipo
    }
    return notificacao
  })
}
async function verifyUsers() {
  schedule.scheduleJob({ rule: '*/5 * * * * *' }, async () => {
    let notifications = extractNotifications(await DB.Notificacoes.getNotificacoes(Enpoint.apiEndpoint));
    notifications.map(async item => {
      let fundador = await DB.Fundadores.getFundadorById(item.fundador_id) || await DB.Fundadores.getFundadorByEmail(item.email);
      let notification = _.merge(item, fundador[0]);
      if (item.assunto === 'Cadastro aprovado') {
        notification.url_conta = Enpoint.frontEndEndpoint + `/login`;
        sendEmailToUser(notification, 'conta_aprovada.pug');
      } else if (item.assunto === 'Conta criada') {
        notification.url_conta = Enpoint.boltEndpoint + `editcontent/fundadores/${notification.user_id}`;
        sendEmailToUser(notification, 'conta_empresa_criada.pug');
        sendEmailToAdmin(notification, 'conta_criada_admin.pug');
      } else if (item.assunto === 'Empresa criada') {
        let empresa = await DB.Empresas.getEmpresaByUserId(notification.user_id, Enpoint.apiEndpoint);
        notification.url_empresa = Enpoint.boltEndpoint + `editcontent/empresas/${empresa.id}`;
        sendEmailToUser(notification, 'conta_empresa_criada.pug');
        sendEmailToAdmin(notification, 'empresa_criada_admin.pug');
      } else if (item.assunto === 'Recuperar senha') {
        notification.url_senha = Enpoint.frontEndEndpoint + `recuperar-senha/${notification.user_id}`;
        sendEmailToUser(notification, 'senha.pug');
      } else if (item.assunto === 'Empresa ativada' || 'Empresa desativada') {
        let name = getModelName('A empresa ', notification);
        empresaId = await DB.Empresas.getEmpresaByNome(name);
        notification.url_model = Enpoint.frontEndEndpoint + `empresas/visualizar/${empresaId[0].id}`;
        sendEmailToUser(notification, 'empresa_negocios_vagas_ativada.pug');
      } else if (item.assunto === 'Vaga ativada' || 'Vaga desativada') {
        let name = getModelName('A vaga ', notification);
        vagaId = await DB.Vagas.getVagaByNome(name);
        notification.url_model = Enpoint.frontEndEndpoint + `vagas/visualizar/${vagaId[0].id}`;
        sendEmailToUser(notification, 'empresa_negocios_vagas_ativada.pug');
      } else if (item.assunto === 'Negócio ativado' || 'Negócio desativado') {
        let name = getModelName('O negócio ', notification);
        negocioId = await DB.Negocios.getNegocioByNome(name);
        notification.url_model = Enpoint.frontEndEndpoint + `negocios/visualizar/${negocioId[0].id}`;
        sendEmailToUser(notification, 'empresa_negocios_vagas_ativada.pug');
      } else if (item.assunto === 'Empresa aprovada') {
        sendEmailToUser(notification, 'empresa_aprovada.pug');
      }
    })
    let fundadores =  await getAllFundadores();
    fundadores.map(item => {
      if (item.enviar_notificacao) {
        insertNotificacao({
          assunto: `Cadastro aprovado`,
          destinatario: item.email,
          tipo: 'email',
          status: 'published'
        }).then(id => {
          updateNotification({ id })
        })
        .catch(err => {
          console.log(err)
        })
      }
    })
    let empresas =  await getAllEmpresas();
    empresas.map(item => {
      if (item.enviar_notificacao) {
        DB.Notificacoes.insertNotificacao({
          assunto: `Empresa aprovada`,
          destinatario: item.email,
          tipo: 'email',
          status: 'published'
        }).then(id => {
          updateNotification({id})
        })
        .catch(err => {
          console.log(err)
        })
      }
    })
    console.log('Rodou um ciclo daqui a 30seg irá rodar novamente');
  })
}
function sendEmailToUser(notification, template) {
  Email.sendEmail(notification, template)
    .then(sended => {
      if (sended) {
        DB.Notificacoes.updateNotification(notification);
      }
    })
}
async function sendEmailToAdmin(notification, template) {
  let admin = await DB.Users.getAdminByRole();
  notification.user_email = notification.email;
  notification.email = admin[0].email;
  notification.admin_id = admin[0].id;
  sendEmailToUser(notification, template);
}
function getModelName(messageToSplit, notification) {
  let split = notification.mensagem.split(messageToSplit);
  let split2 = split[1].split(`está`);
  let modelName = split2[0].trim();
  return modelName
}
module.exports = {
  verifyUsers
}