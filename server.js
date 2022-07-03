const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const File = require("./models/File.js");
require("dotenv").config();

const corsOption = {
    origin: ["http://localhost:8998"],
};
const app = express();
const upload = multer({
    dest: "uploads",
});

function connectDb() {
    mongoose.connect(process.env.MONGO_URL);
}
connectDb();

app.set("view engine", "ejs");
app.use(cors(corsOption));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.render("index");
});

app.post("/upload", upload.single("file"), async (req, res) => {
    const fileData = {
        path: req.file.path,
        originalName: req.file.originalname,
    };
    if (req.body.password !== null && req.body.password !== "") {
        fileData.password = await bcrypt.hash(req.body.password, 10);
    }
    const file = await File.create(fileData);
    await file.save();
    res.render("index", { fileLink: `${req.headers.origin}/file/${file.id}` });
});

const handleDownload = async (req, res) => {
    const file = await File.findById(req.params.id);
    file.downloadCount++;
    await file.save();
    if (file.password != null || file.password != undefined) {
        if (req.body.password == null) {
            res.render("download");
            return;
        }
        if (!(await bcrypt.compare(req.body.password, file.password))) {
            res.render("download", { error: true });
        }
    }
    res.download(file.path, file.originalName);
}

app.route("/file/:id").get(handleDownload).post(handleDownload)

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running at ${process.env.PORT || 3000}`);
});
