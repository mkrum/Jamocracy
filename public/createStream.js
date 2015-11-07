var twilio = require('twilio')('ACdc7d3faac00d72c93a830191947c999a', 'dccfe5571db0d393c727cee38b68a730');

function createStream(var phoneNumber, var name) {

	twilio.messages.create({
		to: phoneNumber,
		from: '+16305818347',
		body: name
	}, function(err, data){
		console.error(err);
	});

}
