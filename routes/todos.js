import { Router } from "express";
import pool from "../db.js";
import protect from "../middleware/auth.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

//create a todo
router.post("/add", async (req, res) => {
  try {
    const { todo_description, completed } = req.body;
    const userId = req.user.id;
    
    if (!todo_description) {
      return res.status(400).json({ message: "Todo description is required" });
    }

    const newTodo = await pool.query(
      "INSERT INTO todo (description, completed, user_id) VALUES ($1, $2, $3) RETURNING *",
      [todo_description, completed || false, userId],
    );
    res.json(newTodo.rows[0]);
  } catch (err) {
    console.error("Error creating todo:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

//get all todos for the authenticated user
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const allTodos = await pool.query("SELECT * FROM todo WHERE user_id = $1 ORDER BY todo_id DESC", [userId]);
    res.json(allTodos.rows);
  } catch (err) {
    console.error("Error fetching todos:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

//update a todo
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { todo_description, description, completed } = req.body;
    const userId = req.user.id;
    
    // Use todo_description if provided, otherwise use description for backward compatibility
    const todoDescription = todo_description || description;

    // Check if todo belongs to user
    const todoCheck = await pool.query("SELECT * FROM todo WHERE todo_id = $1 AND user_id = $2", [id, userId]);
    
    if (todoCheck.rows.length === 0) {
      return res.status(404).json({ message: "Todo not found or unauthorized" });
    }

    let updateTodo;
    if (todoDescription !== undefined && completed !== undefined) {
      // Update both description and completed status
      updateTodo = await pool.query(
        "UPDATE todo SET description = $1, completed = $2 WHERE todo_id = $3 AND user_id = $4 RETURNING *",
        [todoDescription, completed, id, userId],
      );
    } else if (todoDescription !== undefined) {
      // Update only description
      updateTodo = await pool.query(
        "UPDATE todo SET description = $1 WHERE todo_id = $2 AND user_id = $3 RETURNING *",
        [todoDescription, id, userId],
      );
    } else if (completed !== undefined) {
      // Update only completed status
      updateTodo = await pool.query(
        "UPDATE todo SET completed = $1 WHERE todo_id = $2 AND user_id = $3 RETURNING *",
        [completed, id, userId],
      );
    } else {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    res.json(updateTodo.rows[0]);
  } catch (err) {
    console.error("Error updating todo:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

//delete a todo
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if todo belongs to user
    const todoCheck = await pool.query("SELECT * FROM todo WHERE todo_id = $1 AND user_id = $2", [id, userId]);
    
    if (todoCheck.rows.length === 0) {
      return res.status(404).json({ message: "Todo not found or unauthorized" });
    }

    await pool.query("DELETE FROM todo WHERE todo_id = $1 AND user_id = $2", [id, userId]);
    res.json({ message: "Todo deleted successfully" });
  } catch (err) {
    console.error("Error deleting todo:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

//mark a todo as completed
router.put("/complete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if todo belongs to user
    const todoCheck = await pool.query("SELECT * FROM todo WHERE todo_id = $1 AND user_id = $2", [id, userId]);
    
    if (todoCheck.rows.length === 0) {
      return res.status(404).json({ message: "Todo not found or unauthorized" });
    }

    const completeTodo = await pool.query(
      "UPDATE todo SET completed = TRUE WHERE todo_id = $1 AND user_id = $2 RETURNING *",
      [id, userId],
    );
    res.json(completeTodo.rows[0]);
  } catch (err) {
    console.error("Error completing todo:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
