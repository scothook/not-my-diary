const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require('dotenv').config({ path: './.env' });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Middleware to parse JSON

// Database Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for Railway SSL
});

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});

app.get("/api/entries", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM entries ORDER BY created_at ASC;");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database query failed"});
    }
});

app.post("/api/entries/batch", async (req, res) => {
  const entries = req.body; // [{ timestamp, text }, ...]

  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: "No entries provided" });
  }

  const values = [];
  const placeholders = entries.map((e, i) => {
    const base = i * 2;
    values.push(e.timestamp, e.text);
    return `($${base + 1}, $${base + 2})`;
  });

  const query = `
    INSERT INTO entries (created_at, content)
    VALUES ${placeholders.join(", ")}
    ON CONFLICT DO NOTHING
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database insert failed" });
  }
});


/*
app.get("/api/workout_types", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM workout_types;");
    res.json(result.rows); // Return the workout types
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

app.get("/api/movement_types", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM movement_types;");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

//aka new workout
app.post("/api/workouts", async (req, res) => {
  const client = await pool.connect();

  try {
    const { body_weight, workout_type_id, notes, date, movements } = req.body;

    await client.query("BEGIN"); // Start transaction

    // 1. Insert workout
    const workoutResult = await client.query(
      "INSERT INTO workouts (body_weight, workout_type_id, notes, date) VALUES ($1, $2, $3, $4) RETURNING *;",
      [body_weight, workout_type_id, notes, date]
    );
    const workout = workoutResult.rows[0];
    const workoutId = workout.id;

    // 2. Insert movements and their sets (if any)
    if (movements && Array.isArray(movements)) {
      for (let movement of movements) {
        const movementResult = await client.query(
          "INSERT INTO movements (workout_id, notes, movement_type_id) VALUES ($1, $2, $3) RETURNING id;",
          [workoutId, movement.notes || null, movement.movement_type_id]
        );
        const movementId = movementResult.rows[0].id;

        // Insert sets for the movement if provided
        if (movement.sets && Array.isArray(movement.sets)) {
          for (let set of movement.sets) {
            await client.query(
              "INSERT INTO sets (movement_id, reps, weight) VALUES ($1, $2, $3);",
              [movementId, set.reps, set.weight]
            );
          }
        }
      }
    }

    await client.query("COMMIT");
    res.status(201).json(workout);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to create workout." });
  } finally {
    client.release();
  }
});

app.patch("/api/workouts/:id", async (req, res) => {
  const client = await pool.connect();
  const { id } = req.params;
  const fields = ['body_weight', 'workout_type_id', 'notes', 'date'];
  const values = [];
  const setClauses = [];

  try {
    await client.query("BEGIN");

    // 1. Build the SET clause for workout update
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        setClauses.push(`${field} = $${values.length + 1}`);
        values.push(req.body[field]);
      }
    });

    // 2. Update workouts table if needed
    let updatedWorkout;
    if (setClauses.length > 0) {
      values.push(id);
      const updateWorkoutQuery = `
        UPDATE workouts
        SET ${setClauses.join(", ")}
        WHERE id = $${values.length}
        RETURNING *;`;
      const workoutResult = await client.query(updateWorkoutQuery, values);
      updatedWorkout = workoutResult.rows[0];
    }

    // 3. Replace movements if provided
    if (req.body.movements && Array.isArray(req.body.movements)) {
      // Get existing movement IDs for this workout
      const movementResult = await client.query(
        "SELECT id FROM movements WHERE workout_id = $1",
        [id]
      );
      const movementIds = movementResult.rows.map((row) => row.id);

      if (movementIds.length > 0) {
        // Delete sets that reference those movement IDs
        await client.query(
          "DELETE FROM sets WHERE movement_id = ANY($1::int[])",
          [movementIds]
        );
      }

      // Now delete the movements themselves
      await client.query("DELETE FROM movements WHERE workout_id = $1", [id]);

      // Insert new movements (and optionally sets, if you're doing that here too)
      for (let movement of req.body.movements) {
        const movementInsert = await client.query(
          "INSERT INTO movements (workout_id, notes, movement_type_id) VALUES ($1, $2, $3) RETURNING id",
          [id, movement.notes, movement.movement_type_id]
        );
        const newMovementId = movementInsert.rows[0].id;

        // Insert associated sets for this movement (if any)
        if (movement.sets && Array.isArray(movement.sets)) {
          for (let set of movement.sets) {
            await client.query(
              "INSERT INTO sets (movement_id, reps, weight) VALUES ($1, $2, $3)",
              [newMovementId, set.reps, set.weight]
            );
          }
        }
      }
    }

    await client.query("COMMIT");

    res.json(updatedWorkout || { message: "Workout updated, no fields changed." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to update workout." });
  } finally {
    client.release();
  }
});

app.get("/api/workouts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`   
      SELECT 
          w.id, 
          w.date::text, 
          w.body_weight, 
          w.notes,
          wt.workout_type_name,
          wt.id AS workout_type_id, 
          COALESCE(json_agg(
              CASE 
                  WHEN m.id IS NOT NULL THEN 
                      json_build_object(
                          'id', m.id,
                          'notes', m.notes,
                          'movement_type_id', m.movement_type_id,
                          'movement_type_name', m.movement_type_name,
                          'sets', m.sets
                      )
                  ELSE NULL
              END
          ) FILTER (WHERE m.id IS NOT NULL), '[]') AS movements
      FROM workouts w
      JOIN workout_types wt ON w.workout_type_id = wt.id
      LEFT JOIN (
          SELECT 
              m.workout_id,
              m.notes,
              m.id,
              m.movement_type_id,
              mt.movement_type_name,
              COALESCE(json_agg(
                  json_build_object('id', s.id, 'reps', s.reps, 'order', s.order, 'weight', s.weight)
              ) FILTER (WHERE s.id IS NOT NULL), '[]') AS sets
          FROM movements m
          LEFT JOIN movement_types mt ON m.movement_type_id = mt.id
          LEFT JOIN sets s ON s.movement_id = m.id
          GROUP BY m.workout_id, m.notes, m.id, m.movement_type_id, mt.movement_type_name
      ) m ON m.workout_id = w.id
       where w.id = $1
      GROUP BY w.id, w.date, w.body_weight, wt.workout_type_name, wt.id;`, [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

app.get("/api/workouts", async (req, res) => {
  try {
    const result = await pool.query(`   
      SELECT 
          w.id, 
          w.date::text, 
          w.body_weight, 
          w.notes,
          wt.workout_type_name, 
          wt.id AS workout_type_id,
          COALESCE(json_agg(
              CASE 
                  WHEN m.id IS NOT NULL THEN 
                      json_build_object(
                          'id', m.id,
                          'notes', m.notes,
                          'movement_type_id', m.movement_type_id,
                          'movement_type_name', m.movement_type_name,
                          'sets', m.sets
                      )
                  ELSE NULL
              END
          ) FILTER (WHERE m.id IS NOT NULL), '[]') AS movements
      FROM workouts w
      JOIN workout_types wt ON w.workout_type_id = wt.id
      LEFT JOIN (
          SELECT 
              m.workout_id,
              m.notes,
              m.id,
              m.movement_type_id,
              mt.movement_type_name,
              COALESCE(json_agg(
                  json_build_object('id', s.id, 'reps', s.reps, 'order', s.order, 'weight', s.weight)
              ) FILTER (WHERE s.id IS NOT NULL), '[]') AS sets
          FROM movements m
          LEFT JOIN movement_types mt ON m.movement_type_id = mt.id
          LEFT JOIN sets s ON s.movement_id = m.id
          GROUP BY m.workout_id, m.notes, m.id, m.movement_type_id, mt.movement_type_name
      ) m ON m.workout_id = w.id
      GROUP BY w.id, w.date, w.body_weight, wt.workout_type_name, wt.id;`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});
*/

