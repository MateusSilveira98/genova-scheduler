const knex = require('knex')(require('../knexfile'))
async function getFundadorById(id) {
  try {
    let response = await knex('bolt_fundadores').where({ id, aprovado: true }).select('nome', 'sobrenome', 'user_id');
    return response
  } catch (e) {
    return e
  }
}
async function getAllFundadores() {
  try {
    let response = await knex('bolt_fundadores').select();
    return response
  } catch (e) {
    return e
  }
}
async function getFundadorByEmail(email) {
  try {
    let response = await knex('bolt_fundadores').where({ email }).select('nome', 'sobrenome', 'user_id');
    return response
  } catch (e) {
    return e
  }
}

module.exports = {
  getFundadorById,
  getAllFundadores,
  getFundadorByEmail
}