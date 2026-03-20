import express from "express";
import cors from "cors";
import fs from "fs-extra";
import path from "path";

const app = express();
const port = 65080;

app.use(cors())

const STORE = {
    shopList: fs.readJSONSync(path.join(process.cwd(), "/server/db/shop-list.json"))
}

app.get("/shop-list", (__, res) => {
    console.log(`get shop-list ${port}`)
    res.json(STORE.shopList)
})

app.listen(port, () => {
    console.log(`Listen ${port}`)
})