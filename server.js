const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Garantir pasta de uploads
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Config multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function fileFilter(req, file, cb) {
  const allowed = ["image/png", "image/jpeg"];
  if (!allowed.includes(file.mimetype)) {
    // criar erro com mensagem amigável para ser mostrada no frontend
    return cb(new Error("Tipo de arquivo inválido."));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

// Middleware CORS simples
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/", (req, res) => {
  res.json({ message: "Servidor de upload rodando" });
});

// Rota de upload: chave esperada 'meusArquivos'
app.post("/upload", function (req, res) {
  // usar upload.array como handler manual para capturar erros
  const handler = upload.array("meusArquivos", 10);
  handler(req, res, function (err) {
    if (err) {
      // MulterError tem propriedade 'code'
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res
            .status(400)
            .json({
              message: "Arquivo muito grande. Máximo por arquivo: 5MB.",
            });
        }
        // LIMIT_UNEXPECTED_FILE pode ocorrer se exceder o número esperado
        if (
          err.code === "LIMIT_UNEXPECTED_FILE" ||
          err.code === "LIMIT_FILE_COUNT"
        ) {
          return res.status(400).json({ message: "Too many files" });
        }
        return res
          .status(400)
          .json({ message: err.message || "Erro no upload." });
      }

      // nosso fileFilter envia Error com mensagem personalizada
      return res
        .status(400)
        .json({ message: err.message || "Erro no upload." });
    }

    // Se nenhum arquivo foi enviado
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Nenhum arquivo enviado." });
    }

    // Resposta de sucesso
    res.json({
      message: `Recebidos ${req.files.length} arquivo(s).`,
      files: req.files.map((f) => ({
        originalname: f.originalname,
        size: f.size,
      })),
    });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
