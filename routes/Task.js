// routes/Task.js
const express = require('express');
const router = express.Router();
const pool = require('../db');



// Expand recurring tasks within a date range
function expandRecurringTasks(tasks, startDate, endDate) {
  const expandedTasks = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  tasks.forEach(task => {
    const taskStart = new Date(task.start_date);
    const taskEnd = task.end_date ? new Date(task.end_date) : taskStart; // Use end_date if available
    let current = new Date(taskStart);

    while (current <= end) {
      if (current >= start) {
        expandedTasks.push({
          ...task,
          start_date: current.toISOString(),
          end_date: taskEnd.toISOString(), // Set end_date to the same as start_date for the recurring task
        });
      }

      // Move to the next occurrence based on the recurring type
      switch (task.recurring_type) {
        case 'daily':
          current.setDate(current.getDate() + task.recurring_value);
          break;
        case 'weekly':
          current.setDate(current.getDate() + 7 * task.recurring_value);
          break;
        case 'monthly':
          current.setMonth(current.getMonth() + task.recurring_value);
          break;
        case 'yearly':
          current.setFullYear(current.getFullYear() + task.recurring_value);
          break;
        default:
          current = end; // Stop the loop if type is invalid
      }
    }
  });

  return expandedTasks;
}

// Get all tasks with recurring expansion
router.get('/', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const result = await pool.query('SELECT * FROM tasks');
    const tasks = result.rows;
    const expandedTasks = expandRecurringTasks(tasks, start_date, end_date);
    res.status(200).json(expandedTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a task by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new task
router.post('/', async (req, res) => {
  const { title, description, start_date, end_date, recurring_type, recurring_value } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO tasks (title, description, start_date, end_date, recurring_type, recurring_value) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, start_date, end_date, recurring_type, recurring_value]
    );
    res.status(201).json(result.rows[0]);
  } catch (error ) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a task
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, start_date, end_date, recurring_type, recurring_value } = req.body;

  try {
    const result = await pool.query(
      'UPDATE tasks SET title = $1, description = $2, start_date = $3, end_date = $4, recurring_type = $5, recurring_value = $6 WHERE id = $7 RETURNING *',
      [title, description, start_date, end_date, recurring_type, recurring_value, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;