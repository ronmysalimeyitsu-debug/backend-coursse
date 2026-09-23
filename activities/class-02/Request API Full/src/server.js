import app from "./app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor Request API Full escuchando en http://localhost:${PORT}`);
});