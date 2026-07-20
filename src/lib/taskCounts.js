import { toProjectList } from '../projects';
import { isOverdue } from './dates';
import { getTodayTasks } from './tasks';

function countTasksByDueStatus(tasks) {
  return tasks.reduce(
    (counts, task) => {
      if (task.dueDate && isOverdue(task.dueDate)) {
        counts.overdue += 1;
      } else {
        counts.onTime += 1;
      }
      return counts;
    },
    { onTime: 0, overdue: 0 },
  );
}

export function getTodayTaskCounts(tasks) {
  const incomplete = getTodayTasks(tasks).filter((task) => !task.done);
  return countTasksByDueStatus(incomplete);
}

export function getProjectTaskCounts(tasks, slug) {
  const list = toProjectList(slug);
  const incomplete = tasks.filter(
    (task) => task.list === list && !task.done,
  );
  return countTasksByDueStatus(incomplete);
}
