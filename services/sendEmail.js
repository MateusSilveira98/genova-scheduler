const nodemailer = require('nodemailer');
const pug = require('pug');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'genova.ecosystem@gmail.com',
    pass: 'genova@123'
  }
});

function sendEmail(notification, template) {
  const compiledFunction = pug.compileFile(`./email_theme/${template}`);
  let html = compiledFunction({
    notification
  });
  let mailOptions = {
    from: 'genova.ecosystem@gmail.com',
    to: `${notification.email}, rafael.coronel@spread.com.br, mateussilveiracosta98@gmail.com, juulhao@gmail.com`,
    subject: notification.assunto,
    html
  }
  return new Promise((resolve, reject) => {
    return transporter.sendMail(mailOptions, (error, info) => {
      return error ? resolve(false) : resolve(true)
    })
  })
}

module.exports = {
  sendEmail
}