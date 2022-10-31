const app = require("./app");

app.listen(process.env.PORT, () => console.log(`Server up and running on 'http://localhost:${process.env.PORT}'...`));