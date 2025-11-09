import React, { useEffect, useState } from "react";
import api from "../../api";
import styles from "./Feed.module.scss";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get("/posts")
      .then((r) => setPosts(r.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Social Feed</h2>
        <p className={styles.subtitle}>See what everyone is sharing</p>
      </div>

      {loading && <div className={styles.loading}>Loading posts...</div>}
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.postsContainer}>
        {posts.length === 0 && !loading && (
          <div className={styles.empty}>
            No posts yet. Be the first to share!
          </div>
        )}
        {posts.map((p) => (
          <div key={p.id} className={styles.post}>
            <div className={styles.postHeader}>
              <h3>{p.title}</h3>
              <span className={styles.author}>{p.user_name}</span>
            </div>
            <p className={styles.postBody}>{p.body}</p>
            <small className={styles.timestamp}>
              {new Date(p.created_at).toLocaleString()}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}
