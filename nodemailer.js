const nodemailer = require("nodemailer");



async function mail() {
  const transporter = nodemailer.createTransport({
    service: "hotmail",
    auth: {
      user: "nodesdugshackathon@outlook.com",
      pass: "sdugs123",
    },
  });

  const options = {
    from: "nodesdugshackathon@outlook.com",
    to: "ssecutities@gmail.com",
    subject: "Link to the nearest Vaccination available around You!",
    text: "Hello",
  };

  transporter.sendMail(options, function (err, info) {
    if (err) {
      console.log(err);
      return;
    }
    console.log("Sent: " + info.response);
  });
}

mail();
