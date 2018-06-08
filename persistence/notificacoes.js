const http = require('axios')
const _ = require('lodash')
const knex = require('knex')(require('../knexfile'))

async function getNotificacoes(apiEndpoint) {
  try {
    let response = await http.get(`${apiEndpoint}notificacoes`);
    return _.filter(response.data.data, item => !item.attributes.enviado)
  } catch (e) {
    return e
  }
}
async function updateNotification(notification) {
  try {
    let response = await knex('bolt_notificacoes').where('id', notification.id).update({ enviado: true })
    console.log('update', response)
  } catch (e) {
    console.log(e)
  }
}
async function insertNotificacao(notification, apiEndpoint) {
  try {
    let response = await http({
      method: 'post',
      url: `${apiEndpoint}notificacoes`,
      data: { data: notification },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    return response.id
  } catch (e) {
    return e
  }
}

module.exports = {
  getNotificacoes,
  updateNotification,
  insertNotificacao
}