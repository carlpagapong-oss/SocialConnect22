import { useCallback, useEffect, useState } from "react";

// Loads a list of posts from `fetcher` (a function returning { posts }) and
// exposes helpers to add, update and remove posts without refetching.
export function usePosts(fetcher, deps = []) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetcher();
      setPosts(data.posts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  const addPost = useCallback((post) => setPosts((prev) => [post, ...prev]), []);
  const updatePost = useCallback(
    (post) => setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p))),
    [],
  );
  const removePost = useCallback((id) => setPosts((prev) => prev.filter((p) => p.id !== id)), []);

  return { posts, loading, error, reload: load, addPost, updatePost, removePost };
}
