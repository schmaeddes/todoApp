import { useEffect, useRef, useState } from 'react';
import { fetchProjects, fetchTodos, saveProjects, saveTodos } from '../api';

export default function useAppBootstrap() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const nextTaskId = useRef(1);
  const nextProjectId = useRef(1);
  const readyToSave = useRef(false);
  const skipTaskSave = useRef(true);
  const skipProjectSave = useRef(true);
  const taskSaveQueue = useRef(Promise.resolve());
  const projectSaveQueue = useRef(Promise.resolve());

  useEffect(() => {
    Promise.all([fetchTodos(), fetchProjects()])
      .then(([todoData, projectData]) => {
        setTasks(todoData);
        setProjects(projectData);
        nextTaskId.current =
          todoData.reduce((max, task) => Math.max(max, task.id), 0) + 1;
        nextProjectId.current =
          projectData.reduce((max, project) => Math.max(max, project.id), 0) + 1;
        readyToSave.current = true;
        skipTaskSave.current = true;
        skipProjectSave.current = true;
      })
      .catch(() => setError('Could not load todos.'))
      .finally(() => setLoading(false));
  }, []);

  function commitTasks(updater) {
    setTasks((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;

      if (readyToSave.current) {
        if (skipTaskSave.current) {
          skipTaskSave.current = false;
        } else {
          taskSaveQueue.current = taskSaveQueue.current
            .then(() => saveTodos(next))
            .catch(() => setError('Could not save todos.'));
        }
      }

      return next;
    });
  }

  function commitProjects(updater) {
    setProjects((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;

      if (readyToSave.current) {
        if (skipProjectSave.current) {
          skipProjectSave.current = false;
        } else {
          projectSaveQueue.current = projectSaveQueue.current
            .then(() => saveProjects(next))
            .catch(() => setError('Could not save projects.'));
        }
      }

      return next;
    });
  }

  return {
    tasks,
    projects,
    loading,
    error,
    setError,
    commitTasks,
    commitProjects,
    nextTaskId,
    nextProjectId,
  };
}
