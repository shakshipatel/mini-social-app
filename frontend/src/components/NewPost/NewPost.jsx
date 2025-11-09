import React, { useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import styles from "./NewPost.module.scss";

export default function NewPost() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/posts", { title, body });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Could not create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Create a New Post</h2>
        <p className={styles.subtitle}>
          Share your thoughts with the community
        </p>
        <form onSubmit={submit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              disabled={loading}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="body">Content</label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your post here..."
              rows="6"
              disabled={loading}
            />
          </div>
          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? "Publishing..." : "Publish Post"}
          </button>
          {error && <div className={styles.error}>{error}</div>}
        </form>
      </div>
    </div>
  );
}
