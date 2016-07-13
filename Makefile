lint:
	./node_modules/.bin/eslint app.js routes/*.js services/*.js

test: lint
	./node_modules/.bin/mocha spec/spec.js

