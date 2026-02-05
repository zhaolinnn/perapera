import dotenv from "dotenv";
dotenv.config();

import express from "express";
import session from "express-session";
import passport from "passport";
import LocalStrategy from "passport-local";
import cors from "cors";
import pg from "pg";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcrypt";

const { Pool } = pg;
const PgSession = connectPgSimple(session);

const app = express();
const PORT = process.env.PORT || 4000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "session",
    }),
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy.Strategy(async (username, password, done) => {
    try {
      const { rows } = await pool.query(
        "SELECT id, username, password_hash FROM users WHERE username = $1",
        [username]
      );
      const user = rows[0];
      if (!user) {
        return done(null, false, { message: "Incorrect username." });
      }
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return done(null, false, { message: "Incorrect password." });
      }
      return done(null, { id: user.id, username: user.username });
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, username FROM users WHERE id = $1",
      [id]
    );
    const user = rows[0];
    if (!user) return done(null, false);
    done(null, { id: user.id, username: user.username });
  } catch (err) {
    done(err);
  }
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}

app.post("/api/auth/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username",
      [username, hash]
    );
    const user = rows[0];
    req.login({ id: user.id, username: user.username }, (err) => {
      if (err) return res.status(500).json({ error: "Login after register failed" });
      res.json({ user });
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Username already taken" });
    }
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
  res.json({ user: req.user });
});

app.post("/api/auth/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ ok: true });
  });
});

app.get("/api/auth/me", (req, res) => {
  if (!req.user) {
    return res.json({ user: null });
  }
  res.json({ user: req.user });
});

app.get("/api/posts", ensureAuthenticated, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
         p.id, 
         p.content, 
         p.created_at, 
         u.username AS author,
         u.id AS author_id,
         COALESCE(SUM(CASE WHEN v.vote_type = 1 THEN 1 ELSE 0 END), 0)::INTEGER AS upvotes,
         COALESCE(SUM(CASE WHEN v.vote_type = -1 THEN 1 ELSE 0 END), 0)::INTEGER AS downvotes,
         (SELECT vote_type FROM votes WHERE post_id = p.id AND user_id = $1) AS user_vote,
         EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND followed_id = u.id) AS is_following
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN votes v ON v.post_id = p.id
       GROUP BY p.id, u.username, u.id
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    // Get tags for each post
    const postsWithTags = await Promise.all(
      rows.map(async (post) => {
        const { rows: tagRows } = await pool.query(
          `SELECT t.id, t.name, t.display_name 
           FROM tags t
           JOIN post_tags pt ON pt.tag_id = t.id
           WHERE pt.post_id = $1`,
          [post.id]
        );
        return { ...post, tags: tagRows };
      })
    );

    res.json(postsWithTags);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/posts", ensureAuthenticated, async (req, res) => {
  const { content, tags } = req.body;
  if (!content) {
    return res.status(400).json({ error: "Content required" });
  }
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows } = await client.query(
        "INSERT INTO posts (user_id, content) VALUES ($1, $2) RETURNING id, content, created_at",
        [req.user.id, content]
      );
      const post = rows[0];

      // Add tags if provided
      if (tags && Array.isArray(tags) && tags.length > 0) {
        for (const tagName of tags) {
          const { rows: tagRows } = await client.query(
            "SELECT id FROM tags WHERE name = $1",
            [tagName]
          );
          if (tagRows.length > 0) {
            await client.query(
              "INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
              [post.id, tagRows[0].id]
            );
          }
        }
      }

      await client.query("COMMIT");
      res.status(201).json(post);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/posts/:id", ensureAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  try {
    const { rows } = await pool.query(
      "UPDATE posts SET content = $1 WHERE id = $2 AND user_id = $3 RETURNING id, content, created_at",
      [content, id, req.user.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/posts/:id", ensureAuthenticated, async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM posts WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    );
    if (!rowCount) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/follow/:username", ensureAuthenticated, async (req, res) => {
  const { username } = req.params;
  try {
    const { rows } = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    const target = rows[0];
    if (!target) return res.status(404).json({ error: "User not found" });
    if (target.id === req.user.id) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }
    await pool.query(
      "INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [req.user.id, target.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/unfollow/:username", ensureAuthenticated, async (req, res) => {
  const { username } = req.params;
  try {
    const { rows } = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    const target = rows[0];
    if (!target) return res.status(404).json({ error: "User not found" });
    await pool.query(
      "DELETE FROM follows WHERE follower_id = $1 AND followed_id = $2",
      [req.user.id, target.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/posts/:id/upvote", ensureAuthenticated, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      `INSERT INTO votes (post_id, user_id, vote_type) 
       VALUES ($1, $2, 1)
       ON CONFLICT (post_id, user_id) 
       DO UPDATE SET vote_type = 1`,
      [id, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/posts/:id/downvote", ensureAuthenticated, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      `INSERT INTO votes (post_id, user_id, vote_type) 
       VALUES ($1, $2, -1)
       ON CONFLICT (post_id, user_id) 
       DO UPDATE SET vote_type = -1`,
      [id, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/posts/:id/vote", ensureAuthenticated, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      "DELETE FROM votes WHERE post_id = $1 AND user_id = $2",
      [id, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/tags", ensureAuthenticated, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id, name, display_name FROM tags ORDER BY name");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/users/:username", ensureAuthenticated, async (req, res) => {
  const { username } = req.params;
  try {
    const { rows: userRows } = await pool.query(
      `SELECT id, username, created_at,
       (SELECT COUNT(*) FROM posts WHERE user_id = users.id) AS post_count,
       (SELECT COUNT(*) FROM follows WHERE followed_id = users.id) AS follower_count,
       (SELECT COUNT(*) FROM follows WHERE follower_id = users.id) AS following_count,
       EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND followed_id = users.id) AS is_following
       FROM users WHERE username = $2`,
      [req.user.id, username]
    );
    const profileUser = userRows[0];
    if (!profileUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const { rows: postRows } = await pool.query(
      `SELECT 
         p.id, 
         p.content, 
         p.created_at,
         COALESCE(SUM(CASE WHEN v.vote_type = 1 THEN 1 ELSE 0 END), 0)::INTEGER AS upvotes,
         COALESCE(SUM(CASE WHEN v.vote_type = -1 THEN 1 ELSE 0 END), 0)::INTEGER AS downvotes,
         (SELECT vote_type FROM votes WHERE post_id = p.id AND user_id = $1) AS user_vote
       FROM posts p
       LEFT JOIN votes v ON v.post_id = p.id
       WHERE p.user_id = $2
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [req.user.id, profileUser.id]
    );

    // Get tags for each post
    const postsWithTags = await Promise.all(
      postRows.map(async (post) => {
        const { rows: tagRows } = await pool.query(
          `SELECT t.id, t.name, t.display_name 
           FROM tags t
           JOIN post_tags pt ON pt.tag_id = t.id
           WHERE pt.post_id = $1`,
          [post.id]
        );
        return { ...post, tags: tagRows };
      })
    );

    res.json({
      user: {
        id: profileUser.id,
        username: profileUser.username,
        created_at: profileUser.created_at,
        post_count: parseInt(profileUser.post_count),
        follower_count: parseInt(profileUser.follower_count),
        following_count: parseInt(profileUser.following_count),
        is_following: profileUser.is_following,
      },
      posts: postsWithTags,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

