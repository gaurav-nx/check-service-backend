var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    host: "tls://smtp.gmail.com",
    service: 'gmail',
    port: 587,
    auth: {
        user: 'anmolrajputzixisoft@gmail.com',
        pass: 'drqy nyew vhaw zvxx',
    }
});

function generateOTP() {
    const digits = '0123456789';
    let otp = '';

    for (let i = 0; i < 4; i++) {
        const randomIndex = Math.floor(Math.random() * digits.length);
        otp += digits[randomIndex];
    }

    return otp;
}

function sendVerificationMail(to, pathname, text) {
    const otp = generateOTP();
    const mailOptions = {
        from: 'anmolrajputzixisoft@gmail.com',
        to: to,
        subject: "SignUp OTP",
        text: ` OTP code is: ${otp}`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log('------------------', error);
        } else {
            console.log('Email sent: ');
        }
    })
};

const sendInfluencerMail = async (first_name, last_name, email, password) => {
    let transporter = nodemailer.createTransport({
        // host: "mail.checkcheckservices.in",
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // use SSL/TLS if true for port 465
        auth: {
            user: 'no-reply@checkcheckservices.in',
            pass: 'no-reply@112233'
        },
        tls: {
            rejectUnauthorized: false, // Disable certificate validation
        }
    });

    let info = await transporter.sendMail({
        from: 'no-reply@checkcheckservices.in',
        to: `${email}`,
        subject: "Welcome Aboard! 🎉 Excited to Partner with You",
        text: `Hi ${first_name} ${last_name},

We are delighted to welcome you as our newest CCS-Partner! 🎉 This is an exciting moment for us, and we are thrilled to have you on board.

Your unique voice and creative CCS-Partner are exactly what we need to reach new heights and connect with our audience in fresh and engaging ways. We are confident that this partnership will be both enjoyable and mutually beneficial.

Here’s a quick overview of what’s next:

Kickoff Call: Let’s set up a call to discuss our upcoming campaigns, align on goals, and answer any questions you might have.
Point of Contact: Mr Johny Hans will be your go-to person for any support or queries throughout our collaboration.
We’re here to support you and ensure that this partnership is a success. If you need anything or have any questions, feel free to reach out.

<strong>Please find below your login credentials :</strong> 

URL-https://checkcheckservices.in
Username - ${email}     
Passsword - ${password}

Once again, congratulations, and welcome to the team! We can’t wait to see the amazing content we’ll create together.

Best regards,

Check Check Services
222 McIntyre St W Suite 305, North Bay, ON P1B 2Y8
apply@studybuddycanada.com
+1-514-726-0003`
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
};

const sendCampaginMail = async (first_name, last_name, url, email) => {
    console.log('first_name, last_name, url, email: ', first_name, last_name, url, email);
    let transporter = nodemailer.createTransport({
        host: "mail.checkcheckservices.in",
        port: 587,
        secure: false, // use SSL/TLS if true for port 465
        auth: {
            user: 'no-reply@checkcheckservices.in',
            pass: 'no-reply@112233'
        },
        tls: {
            rejectUnauthorized: false, // Disable certificate validation
        }
    });

    let info = await transporter.sendMail({
        from: 'no-reply@checkcheckservices.in',
        to: `${email}`,
        subject: "Referral Link for Audience",
        cc: 'apply@checkcheckservices.com',
        text: `Hi ${first_name} ${last_name},

I hope you’re doing well!

We’re thrilled to collaborate with you and would like to share an exclusive link for your audience to sign up for our services. We believe this opportunity will resonate with them, and we can’t wait to see the impact you’ll make!

Here’s the link to share:${url}

Feel free to share this link to your audience, and let us know if you need any additional information or materials.

Thank you for being such an integral part of our journey. We’re excited to see this partnership flourish!

Best regards,

Johny Hans
Check Check Services`
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
};

module.exports = { sendVerificationMail, sendInfluencerMail, sendCampaginMail }