const _ = require('lodash')
const http = require('axios')
const knex = require('knex')(require('../knexfile'))
const schedule = require('node-schedule')
// const endpoint = 'http://ec2-18-231-116-28.sa-east-1.compute.amazonaws.com';
const endpoint = 'http://localhost/api/';
// const frontEndEndpoint = 'http://genova-staging.s3-website-us-east-1.amazonaws.com/'
const frontEndEndpoint = 'http://localhost:8080/'
const email = require('./sendEmail.js')

function extractNotifications(notificacoes) {
  return notificacoes.map(item => {
    let notificacao = {
      id: item.id,
      user_id: item.relationships.fundadores.data[0].id,
      email: item.attributes.destinatario,
      mensagem: item.attributes.mensagem,
      assunto: item.attributes.assunto,
      tipo: item.attributes.tipo
    }
    return notificacao
  })
}
async function getNotificacoes()  {
  let response = await http.get(`${endpoint}notificacoes`);
  return _.filter(response.data.data, item => !item.attributes.enviado)
}
async function getFundador(id) {
  let response = await knex('bolt_fundadores').where({id, aprovado: true}).select('nome', 'sobrenome');
  return response
}
async function getAdmin() {
  let admin = await knex('bolt_users').where({ roles: '["root","everyone"]'}).select();
  return admin
}
async function updateNotification(notification) {
  let response = await knex('bolt_notificacoes')
    .where('id', notification.id)
    .update({
      enviado: true,
    })
  console.log('update', response)
}
async function verifyUsers() {
  schedule.scheduleJob({ rule: '*/30 * * * * *' }, async () => {
    let notifications = extractNotifications(await getNotificacoes());
    notifications.map(async item => {
      let fundador = await getFundador(item.user_id)
      let notification = _.merge(item, fundador[0])
      if (item.assunto === 'Cadastro aprovado') {
        sendEmailToUser(notification, 'conta_aprovada.pug')
      } else if (item.assunto === 'Conta criada') {
        sendEmailToUser(notification, 'conta_empresa_criada.pug')
        sendEmailToAdmin(notification, 'conta_empresa_criada_admin.pug')
      } else if (item.assunto === 'Recuperar senha') {
        notification.url_senha = frontEndEndpoint + `users/recuperar-senha/${notification.user_id}`
        sendEmailToUser(notification, 'senha.pug')
      }
    })
    console.log('ta rodando')
  })
}
function sendEmailToUser(notification, template) {
  email.sendEmail(notification, template)
    .then(sended => {
      if (sended) {
        updateNotification(notification);
      }
    })
}
async function sendEmailToAdmin(notification, template) {
  let admin = await getAdmin();
  notification.user_email = notification.email;
  notification.email = admin[0].email;
  notification.admin_id = admin[0].id;
  sendEmailToUser(notification, template);
}
module.exports = {
  verifyUsers
}