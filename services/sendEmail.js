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
    text: html
  }
  
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

module.exports = {
  sendEmail
}