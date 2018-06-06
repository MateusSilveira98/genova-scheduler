const knex = require('knex')(require('../knexfile'))

async function getVagaByNome(nome) {
  try {
    let response = await knex('bolt_vagas').where({ nome }).select('id');
    return response
  } catch (e) {
    return e
  }
}

module.exports = {
  getVagaByNome
}