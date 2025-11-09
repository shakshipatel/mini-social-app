import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import styles from "./Feed.module.scss";

export default function Feed({ user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get("/posts")
      .then((r) => {
        // enrich posts with UI state
        const enriched = r.data.map((p) => ({
          ...p,
          showComments: false,
          comments: [],
          commentLoading: false,
          editing: false,
          editTitle: p.title,
          editBody: p.body,
        }));
        setPosts(enriched);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleComments = async (postId) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, showComments: !p.showComments } : p
      )
    );
    const post = posts.find((p) => p.id === postId);
    if (post && post.comments.length === 0 && !post.showComments) {
      // load comments
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, commentLoading: true } : p))
      );
      try {
        const res = await api.get(`/posts/${postId}/comments`);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, comments: res.data, comment_count: res.data.length }
              : p
          )
        );
      } catch (err) {
        console.error("failed to load comments", err);
      } finally {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, commentLoading: false } : p
          )
        );
      }
    }
  };

  const startEdit = (postId) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, editing: true, editTitle: p.title, editBody: p.body }
          : p
      )
    );
  };

  const cancelEdit = (postId) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, editing: false, editTitle: p.title, editBody: p.body }
          : p
      )
    );
  };

  const saveEdit = async (postId) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    try {
      const res = await api.put(`/posts/${postId}`, {
        title: post.editTitle,
        body: post.editBody,
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, ...res.data, editing: false } : p
        )
      );
    } catch (err) {
      console.error("update failed", err.response?.data || err.message);
      // could show UI error
    }
  };

  const deletePost = async (postId) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("delete failed", err.response?.data || err.message);
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await api.post(`/posts/${postId}/like`);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, like_count: res.data.like_count } : p
        )
      );
    } catch (err) {
      console.error("like failed", err.response?.data || err.message);
    }
  };

  const submitComment = async (postId, text, resetFn) => {
    if (!text || text.trim() === "") return;
    try {
      const res = await api.post(`/posts/${postId}/comments`, { body: text });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: [res.data, ...p.comments],
                comment_count: (p.comment_count || 0) + 1,
              }
            : p
        )
      );
      resetFn();
    } catch (err) {
      console.error("comment failed", err.response?.data || err.message);
    }
  };

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
              <div className={styles.postMeta}>
                <span className={styles.postedBy}>Posted by {p.user_name}</span>
                <small className={styles.timestamp}>
                  {new Date(p.created_at).toLocaleString()}
                </small>
              </div>
            </div>
            {p.editing ? (
              <div className={styles.editForm}>
                <input
                  type="text"
                  value={p.editTitle}
                  onChange={(e) =>
                    setPosts((prev) =>
                      prev.map((x) =>
                        x.id === p.id ? { ...x, editTitle: e.target.value } : x
                      )
                    )
                  }
                />
                <textarea
                  value={p.editBody}
                  rows={4}
                  onChange={(e) =>
                    setPosts((prev) =>
                      prev.map((x) =>
                        x.id === p.id ? { ...x, editBody: e.target.value } : x
                      )
                    )
                  }
                />
                <div className={styles.editActions}>
                  <button
                    onClick={() => saveEdit(p.id)}
                    className={styles.saveBtn}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => cancelEdit(p.id)}
                    className={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className={styles.postBody}>{p.body}</p>
            )}
            <div className={styles.postFooter}>
              {/* show edit/delete only for post owner */}
              {user && String(p.user_id) === String(user.id) && (
                <>
                  <button
                    className={styles.editBtn}
                    onClick={() => startEdit(p.id)}
                  >
                    Edit
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => deletePost(p.id)}
                  >
                    Delete
                  </button>
                </>
              )}
              <button
                className={styles.likeBtn}
                onClick={() => handleLike(p.id)}
                disabled={!user}
                title={user ? "Like" : "Log in to like posts"}
              >
                👍 Like ({p.like_count || 0})
              </button>
              <button
                className={styles.commentBtn}
                onClick={() => toggleComments(p.id)}
                disabled={false}
                title={user ? "View/add comments" : "Log in to add comments"}
              >
                💬 Comments ({p.comment_count || 0})
              </button>
            </div>

            {p.showComments && (
              <div className={styles.commentsSection}>
                {p.commentLoading && <div>Loading comments...</div>}
                {/* only show the comment form when the user is logged in */}
                {user ? (
                  <CommentForm postId={p.id} onSubmit={submitComment} />
                ) : (
                  <div className={styles.commentLoginHint}>
                    Log in to post comments
                  </div>
                )}
                {p.comments.map((c) => (
                  <div key={c.id} className={styles.comment}>
                    <div className={styles.commentRow}>
                      <div className={styles.commentAvatar}>
                        {c.user_name
                          ? c.user_name.charAt(0).toUpperCase()
                          : "?"}
                      </div>
                      <div className={styles.commentContent}>
                        <div className={styles.commentHeader}>
                          <strong className={styles.commentAuthor}>
                            {c.user_name}
                          </strong>
                          <small className={styles.commentDate}>
                            {new Date(c.created_at).toLocaleString()}
                          </small>
                        </div>
                        <div className={styles.commentBody}>{c.body}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {p.comments.length === 0 && !p.commentLoading && (
                  <div className={styles.commentEmpty}>
                    <div className={styles.commentEmptyIcon}>💬</div>
                    <div className={styles.commentEmptyText}>
                      {user ? (
                        <>
                          <strong>Be the first to comment</strong>
                          <div className={styles.commentEmptySub}>
                            Share your thoughts with the author.
                          </div>
                        </>
                      ) : (
                        <>
                          <strong>No comments yet</strong>
                          <div className={styles.commentEmptySub}>
                            Log in to join the conversation.
                          </div>
                          <Link to="/login" className={styles.commentEmptyBtn}>
                            Log in
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CommentForm({ postId, onSubmit }) {
  const [text, setText] = useState("");

  const handle = (e) => {
    e.preventDefault();
    onSubmit(postId, text, () => setText(""));
  };

  return (
    <form className={styles.commentForm} onSubmit={handle}>
      <input
        type="text"
        placeholder="Write a comment..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="submit">Post</button>
    </form>
  );
}
