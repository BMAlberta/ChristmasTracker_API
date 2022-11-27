const nodemailer = require('nodemailer')

// Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: 'gmail',
      port: 465,
      secure: true,
      auth: {
        user: `${process.env.EMAIL_ADDRESS}`,
        pass: `${process.env.EMAIL_PASSWORD}`
      },
    });


const subject_mail = "OTP: For Reset Password"

const message = (otp) =>{
    return `Dear User, \n\n`
    + 'OTP for Reset Password is : \n\n'
    + `${otp}\n\n`
    + 'This is a auto-generated email. Please do not reply to this email.\n\n'
    + 'Regards\n'
    + 'Divyansh Agarwal\n\n'
}

    const {message, subject_mail} = require('../templates/email/email_verification');
        email_message=message(otp)
        email_subject=subject_mail


    const mailOptions = {
      from: `"BMAlberta Auth Systems"<${process.env.EMAIL_ADDRESS}>`,
      to: `${email}`,
      subject: email_subject,
      text: email_message ,
    };

    try {
      await transporter.verify();

      //Send Email
      await transporter.sendMail(mailOptions, (err, response) => {
        if (err) {
            // return res.status(400).send({"Status":"Failure","Details": err });
            console.log("Email not sent.\n" + err)
        } else {
          // return res.send({"Status":"Success","Details":encoded});
          console.log("Email sent")
        }
      });

    } catch (err) {
      console.log("Email error: " + err)
    }
