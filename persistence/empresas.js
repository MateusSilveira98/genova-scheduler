const http = require('axios')
const knex = require('knex')(require('../knexfile'))

async function getEmpresaByNome(nome) {
  try {
    let response = await knex('bolt_empresas').where({ nome }).select('id');
    return response
  } catch (e) {
    return e
  }
}
async function getEmpresaByUserId(userId, apiEndpoint) {
  try {
    let response = await http.get(`${apiEndpoint}empresas?filter[fundadores]=${userId}&filter[aprovado]=false`);
    return response.data.data[0]
  } catch (e) {
    return e
  }
}

module.exports = {
  getEmpresaByNome,
  getEmpresaByUserId
}