import { Router } from "express";
import {
  getCurrentUser,
  createUser,
  listUsers,
  deleteUser,
  updateUser,
} from "../controllers/user";

const router = Router();

router.get("/users/list-user", listUsers);
router.post("/users/current-user", getCurrentUser);
router.post("/users/delete-user", deleteUser);
router.post("/users/update-user", updateUser);
router.post("/users/create-user", createUser);

export default router;
