const knex = require('knex')(require('../knexfile'))
async function getAdminByRole() {
  try {
    let response = await knex('bolt_users').where({ roles: '["root","everyone"]' }).select();
    return response
  } catch (e) {
    return e
  }
}

module.exports = {
  getAdminByRole
}