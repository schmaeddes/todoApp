import {
  createUniqueProjectSlug,
  normalizeProject,
} from '../projects';

export default function useProjectStore({
  projects,
  commitProjects,
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

  return { addProject, renameProject };
}
