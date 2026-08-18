import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const requests = [
  { id: 1, title: "Projector failure", description: "The projector in Room 302 turns off automatically.", status: "open" },
  { id: 2, title: "Network issue", description: "Wi-Fi connection is dropping in the main hall.", status: "closed" }
];

app.get("/requests", (req, res) => {
  const { status } = req.query;
  if (status) {
    const filtered = requests.filter((r) => r.status === status);
    return res.status(200).json(filtered);
  }
  return res.status(200).json(requests);
});

app.get("/requests/:id", (req, res) => {
  const id = Number(req.params.id);
  const found = requests.find((r) => r.id === id);
  if (!found) {
    return res.status(404).json({ error: "Request not found" });
  }
  return res.status(200).json(found);
});

app.post("/requests", (req, res) => {
  const { title, description } = req.body;
  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Title is required" });
  }
  const newRequest = {
    id: requests.length + 1,
    title: title.trim(),
    description: description ? description.trim() : "",
    status: "open"
  };
  requests.push(newRequest);
  return res.status(201).json(newRequest);
});

app.listen(PORT, () => {
  console.log(`Request API Lite escuchando en http://localhost:${PORT}`);
});