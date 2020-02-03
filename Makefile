default: build zip

zip:
	zip -r -X package.zip ./package -x "*.map*"

build:
	npm run build
