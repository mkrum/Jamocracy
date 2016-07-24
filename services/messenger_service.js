const twilio = require('twilio'),
    client = new twilio.RestClient(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

function sendText(textMessage, number) {
    client.messages.create({
        to: number,
        from: '+19784010087',
        body: textMessage
    }, (err) => {
        if (err) {
            console.log('error: ' + JSON.stringify(err));
        }
    });
}

function getTwiMLString(msg) {
    const twiml = new twilio.TwimlResponse();
    twiml.message(msg);
    return twiml.toString();
}

function validate(req) {
    return twilio.validateExpressRequest(req, process.env.TWILIO_AUTH_TOKEN);
}

exports.sendText = sendText;
exports.getTwiMLString = getTwiMLString;
exports.validate = validate;
