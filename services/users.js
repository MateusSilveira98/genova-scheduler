const _ = require('lodash')
const http = require('axios')
const knex = require('knex')(require('../knexfile'))
const schedule = require('node-schedule')
// const endpoint = 'http://ec2-18-231-116-28.sa-east-1.compute.amazonaws.com';
const endpoint = 'http://localhost/api/';
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
  let response = await knex('bolt_fundadores').where({id, aprovado: true}).select('nome', 'sobrenome')
  return response
}
async function verifyUsers() {
  let notifications = extractNotifications(await getNotificacoes());
  notifications.map(async item => {
    let fundador = await getFundador(item.user_id)
    let notification = _.merge(item, fundador[0])
    if (item.assunto === 'Cadastro Aprovado') {
      sendEmailToUser(notification)
    } else if (item.assunto === 'Conta Criada') {
      sendEmailToUser(notification)
      sendEmailToAdmin(notification)
    }
  })
}
function sendEmailToUser(notification) {
  email.sendEmail(notification, 'senha.pug')
}
function sendEmailToAdmin(notification) {
  console.log(notification)
}
module.exports = {
  verifyUsers
}