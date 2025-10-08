const fs = require("fs");
const FormData = require("form-data");
const http = require("http");

const form = new FormData();
form.append("meusArquivos", fs.createReadStream("./frontend_atividade.html"));

const options = {
  method: "post",
  host: "localhost",
  port: 3000,
  path: "/upload",
  headers: form.getHeaders(),
};

const req = http.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    console.log("STATUS", res.statusCode);
    console.log("BODY", data);
    process.exit(0);
  });
});

form.pipe(req);

req.on("error", (err) => {
  console.error("ERROR", err);
  process.exit(1);
});
