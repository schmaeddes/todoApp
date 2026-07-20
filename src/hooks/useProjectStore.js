import {
  createUniqueProjectSlug,
  normalizeProject,
  prependProjectNameToTaskText,
  toProjectList,
} from '../projects';

export default function useProjectStore({
  projects,
  commitProjects,
  commitTasks,
  nextProjectId,
  setError,
  closeTaskModal,
}) {
  function addProject(name) {
    const trimmed = name.trim();
    if (!trimmed) return;

    const slug = createUniqueProjectSlug(trimmed, projects);
    const newProject = normalizeProject({
      id: nextProjectId.current++,
      name: trimmed,
      slug,
    });

    commitProjects((prev) => [...prev, newProject]);
    setError(null);
  }

  function renameProject(projectId, name) {
    const trimmed = name.trim();
    if (!trimmed) return;

    commitProjects((prev) =>
      prev.map((project) =>
        project.id === projectId ? { ...project, name: trimmed } : project,
      ),
    );
    closeTaskModal();
    setError(null);
  }

  function deleteProject(projectId) {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;

    const projectList = toProjectList(project.slug);

    commitTasks((prev) =>
      prev.map((task) =>
        task.list === projectList
          ? {
              ...task,
              list: 'trash',
              text: prependProjectNameToTaskText(project.name, task.text),
            }
          : task,
      ),
    );

    commitProjects((prev) => prev.filter((item) => item.id !== projectId));
    closeTaskModal();
    setError(null);
  }

  return { addProject, renameProject, deleteProject };
}
