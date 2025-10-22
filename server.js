const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
// parse JSON bodies
app.use(express.json());

// user model and bcrypt
const bcrypt = require("bcryptjs");
const userModel = require("./models/userModel");
const PORT = process.env.PORT || 3000;

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

// Rota GET /upload para facilitar debug (usar POST para envio de arquivos)
// Página de listagem de arquivos enviados (para inspeção no navegador)
app.get("/upload", (req, res) => {
  try {
    const files = fs.readdirSync(uploadDir).map((name) => {
      const stat = fs.statSync(path.join(uploadDir, name));
      return { name, size: stat.size, mtime: stat.mtime };
    });

    const rows = files
      .map(
        (f) =>
          `<tr><td><a href="/uploads/${encodeURIComponent(
            f.name
          )}" target="_blank">${f.name}</a></td><td>${
            f.size
          } bytes</td><td>${f.mtime.toLocaleString()}</td></tr>`
      )
      .join("\n");

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Uploads</title><style>body{font-family:Arial,Helvetica,sans-serif;padding:18px;background:#f7fafc}table{border-collapse:collapse;width:100%;max-width:980px}th,td{padding:8px;border:1px solid #e6e9ef;text-align:left}th{background:#eef2ff}</style></head><body><h2>Arquivos enviados</h2><p>Links para os arquivos em <code>/uploads</code></p><table><thead><tr><th>Arquivo</th><th>Tamanho</th><th>Modificado</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  } catch (err) {
    return res.status(500).json({ message: "Erro ao listar uploads." });
  }
});

// Rota de registro de usuários
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "username, email e password são obrigatórios." });
    }

    // verificar se usuário já existe
    const existing = userModel.findByUsername(username);
    if (existing) {
      return res.status(409).json({ message: "Username já existe." });
    }

    // hashear a senha
    const passwordHash = await bcrypt.hash(password, 10);

    // salvar usuário (in-memory)
    const saved = userModel.addUser({ username, email, passwordHash });

    return res.status(201).json({
      message: "Usuário criado com sucesso.",
      user: { id: saved.id, username: saved.username, email: saved.email },
    });
  } catch (err) {
    console.error("Erro /register", err);
    return res.status(500).json({ message: "Erro interno." });
  }
});

// Rota de debug: listar usuários (sem passwordHash)
app.get("/users", (req, res) => {
  try {
    const list = userModel.listAll().map(({ passwordHash, ...user }) => user);
    res.json({ users: list });
  } catch (err) {
    res.status(500).json({ message: "Erro ao listar usuários." });
  }
});

// Servir arquivos enviados estaticamente em /uploads
app.use("/uploads", express.static(uploadDir));

// Listar arquivos recebidos (nome do arquivo no servidor e tamanho)
app.get("/files", (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err)
      return res.status(500).json({ message: "Erro ao listar uploads." });
    const items = files.map((name) => {
      const stat = fs.statSync(path.join(uploadDir, name));
      return { name, size: stat.size };
    });
    res.json({ files: items });
  });
});

// (rota /upload agora renderiza uma página com os arquivos — ver acima)

// Rota de upload: chave esperada 'meusArquivos'
app.post("/upload", function (req, res) {
  // usar upload.array como handler manual para capturar erros
  const handler = upload.array("meusArquivos", 10);
  handler(req, res, function (err) {
    if (err) {
      // MulterError tem propriedade 'code'
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
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
