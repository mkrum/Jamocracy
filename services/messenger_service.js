const twilio = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

function sendText(textMessage, number){
    twilio.messages.create({
        to: number,
        //from: "+16305818347",
        // Dan's twilio number, used for testing
        from: '+19784010087',
        body: textMessage
    }, (err) => {
        if (err) {
            console.log('error: ' + JSON.stringify(err));
        }
    });
}

exports.sendText = sendText;

