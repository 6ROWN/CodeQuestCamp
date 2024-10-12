const Nodemailer = require("nodemailer");
const { MailtrapTransport } = require("mailtrap");

const TOKEN = "7e4df705d5b7374bbd2bde37659ab636";

const transport = Nodemailer.createTransport(
	MailtrapTransport({
		token: TOKEN,
		accountId: 1989767,
	})
);

const sender = {
	address: "hello@demomailtrap.com",
	name: "Mailtrap Test",
};
const recipients = ["gohohodanni@gmail.com"];

const sendEmail = ({ email, subject, message }) => {
	transport
		.sendMail({
			from: sender,
			to: email,
			subject,
			text: message,
			category: "Integration Test",
		})
		.then(console.log, console.error);
};

module.exports = sendEmail;
