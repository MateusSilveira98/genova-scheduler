const _ = require('lodash')
const http = require('axios')
const knex = require('knex')(require('../knexfile'))
const schedule = require('node-schedule')
const Email = require('./sendEmail.js');
// const apiEndpoint = 'http://ec2-18-231-122-142.sa-east-1.compute.amazonaws.com/api/';
const apiEndpoint = 'http://localhost/api/';
// const frontEndEndpoint = 'http://genova-staging.s3-website-us-east-1.amazonaws.com/'
const frontEndEndpoint = 'http://localhost:8080/';
// const BoltEndpoint = 'http://ec2-18-231-122-142.sa-east-1.compute.amazonaws.com/bolt/';
const boltEndpoint = 'http://localhost/bolt/';

function extractNotifications(notificacoes) {
  return notificacoes.map(item => {
    let notificacao = {
      id: item.id,
      fundador_id: item.relationships.fundadores.data[0].id || null,
      email: item.attributes.destinatario,
      mensagem: item.attributes.mensagem,
      assunto: item.attributes.assunto,
      tipo: item.attributes.tipo
    }
    return notificacao
  })
}
async function getNotificacoes()  {
  let response = await http.get(`${apiEndpoint}notificacoes`);
  return _.filter(response.data.data, item => !item.attributes.enviado)
}
async function updateNotification(notification) {
  let response = await knex('bolt_notificacoes')
  .where('id', notification.id)
  .update({
    enviado: true,
  })
  console.log('update', response)
}
async function getFundadorById(id) {
  let response = await knex('bolt_fundadores').where({id, aprovado: true}).select('nome', 'sobrenome', 'user_id');
  return response
}
async function getAllFundadores() {
  let response = await knex('bolt_fundadores').select();
  return response
}
async function getFundadorByEmail(email) {
  let response = await knex('bolt_fundadores').where({ email }).select('nome', 'sobrenome', 'user_id');
  return response
}
async function getAdminByRole() {
  let response = await knex('bolt_users').where({ roles: '["root","everyone"]'}).select();
  return response
}
async function getEmpresaByNome(nome) {
  let response = await knex('bolt_empresas').where({nome}).select('id');
  return response
}
async function getEmpresaByUserId(userId)  {
  let response = await http.get(`${apiEndpoint}empresas?filter[fundadores]=${userId}&filter[aprovado]=false`);
  return response.data.data[0]
}
async function getVagaByNome(nome) {
  let response = await knex('bolt_vagas').where({nome}).select('id');
  return response
}
async function getNegocioByNome(nome) {
  let response = await knex('bolt_negocios').where({nome}).select('id');
  return response
}
async function verifyUsers() {
  schedule.scheduleJob({ rule: '*/60 * * * * *' }, async () => {
    let notifications = extractNotifications(await getNotificacoes());
    notifications.map(async item => {
      let fundador = await getFundadorById(item.fundador_id) || await getFundadorByEmail(item.email);
      let notification = _.merge(item, fundador[0]);
      if (item.assunto === 'Cadastro aprovado') {
        sendEmailToUser(notification, 'conta_aprovada.pug');
      } else if (item.assunto === 'Conta criada') {
        notification.url_conta = boltEndpoint + `editcontent/fundadores/${notification.user_id}`;
        sendEmailToUser(notification, 'conta_empresa_criada.pug');
        sendEmailToAdmin(notification, 'conta_criada_admin.pug');
      } else if (item.assunto === 'Empresa criada') {
        let empresa = await getEmpresaByUserId(notification.user_id);
        notification.url_empresa = boltEndpoint + `editcontent/empresas/${empresa.id}`;
        sendEmailToUser(notification, 'conta_empresa_criada.pug');
        sendEmailToAdmin(notification, 'empresa_criada_admin.pug');
      } else if (item.assunto === 'Recuperar senha') {
        notification.url_senha = frontEndEndpoint + `recuperar-senha/${notification.user_id}`;
        sendEmailToUser(notification, 'senha.pug');
      } else if (item.assunto === 'Empresa ativada' || 'Empresa desativada') {
        let name = getModelName('A empresa ', notification);
        empresaId = await getEmpresaByNome(name);
        notification.url_model = frontEndEndpoint + `empresas/visualizar/${empresaId[0].id}`;
        sendEmailToUser(notification, 'empresa_negocios_vagas_ativada.pug');
      } else if (item.assunto === 'Vaga ativada' || 'Vaga desativada') {
        let name = getModelName('A vaga ', notification);
        vagaId = await getVagaByNome(name);
        notification.url_model = frontEndEndpoint + `vagas/visualizar/${vagaId[0].id}`;
        sendEmailToUser(notification, 'empresa_negocios_vagas_ativada.pug');
      } else if (item.assunto === 'Negócio ativado' || 'Negócio desativado') {
        let name = getModelName('O negócio ', notification);
        negocioId = await getNegocioByNome(name);
        notification.url_model = frontEndEndpoint + `negocios/visualizar/${negocioId[0].id}`;
        sendEmailToUser(notification, 'empresa_negocios_vagas_ativada.pug');
      }
    })
    console.log('Rodou um ciclo. Daqui a 30seg vai rodar denovo...')
  })
}
function sendEmailToUser(notification, template) {
  Email.sendEmail(notification, template)
    .then(sended => {
      if (sended) {
        updateNotification(notification);
      }
    })
}
async function sendEmailToAdmin(notification, template) {
  let admin = await getAdminByRole();
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