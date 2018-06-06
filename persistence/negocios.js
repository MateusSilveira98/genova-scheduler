const knex = require('knex')(require('../knexfile'))

async function getNegocioByNome(nome) {
  try {
    let response = await knex('bolt_negocios').where({ nome }).select('id');
    return response
  } catch (e) {
    return e
  }
}

module.exports = {
  getNegocioByNome
}