# ChelaJS punto algo

## Building

```
npm install
# copiamos y editamos la configuración a nuestro gusto
cp config.example.json config.json
$EDITOR config.json

# Bajamos los eventos del meetup para popular la db
grunt db:seed
# Compilamos estilos
grunt sass
```

Luego, podemos iniciar con `npm start`

## Development

`grunt sass:watch`
