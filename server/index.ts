import express from "express";

const app = express();
const port = 65080;

app.listen(port, () => {
    console.log(`Listen ${port}`)
})