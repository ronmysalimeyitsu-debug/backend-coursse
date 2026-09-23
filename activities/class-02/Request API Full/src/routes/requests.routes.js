import { Router } from "express";
import { requests } from "../data/requests.js";

const router = Router();

// GET /requests (con soporte opcional para filtrado ?status=)
router.get("/", (req, res) => {
  const { status } = req.query;
  if (status) {
    const filtered = requests.filter((r) => r.status === status);
    return res.status(200).json(filtered);
  }
  return res.status(200).json(requests);
});

// GET /requests/:id (200 OK o 404 Not Found)
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const found = requests.find((r) => r.id === id);
  if (!found) {
    return res.status(404).json({ error: "Request not found" });
  }
  return res.status(200).json(found);
});

// POST /requests (201 Created o 400 Bad Request)
router.post("/", (req, res) => {
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

export default router;