import express from "express";
import cors from "cors";
import fs from "fs-extra";
import path from "path";
import bodyParser from "body-parser";

const app = express();
const port = 65080;

app.use(cors());
app.use(bodyParser.json())

const PATHS = {
    shopList: path.join(process.cwd(), "/db/shop-list.json"),
}

const STORE = {
    shopList: fs.readJSONSync(PATHS.shopList)
}

app.get("/shop-list", (__, res) => {
    // console.log(`get shop-list ${port}`)
    res.json(STORE.shopList)
})

app.post("/shop-list", (req, res) => {
    const { action, payload } = req.body || {};
    // console.log(`post shop-list ${port}`, action, payload)

    if (action === 'delete') {
        STORE.shopList.list = STORE.shopList.list.filter(node => node.label !== payload)
        res.json(STORE.shopList)
    } else if (action === 'update') {
        let targetNode = STORE.shopList.list.filter(node => node.label === payload.label)[0]
        if (targetNode) {
            Object.assign(targetNode, payload)
            res.json(STORE.shopList)
        }
    } else if (action === 'create') {
        const label = payload.trim()
        if (label) STORE.shopList.list.push({ label })
        res.json(STORE.shopList)
    }

    fs.outputJSONSync(PATHS.shopList, STORE.shopList)
})

app.listen(port, () => {
    console.log(`Listen ${port}`)
})